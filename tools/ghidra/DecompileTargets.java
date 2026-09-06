// Decompile explicit function ranges from a hash-matched local binary.
// @category Compendium
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import ghidra.app.script.GhidraScript;
import ghidra.app.cmd.disassemble.DisassembleCommand;
import ghidra.app.cmd.function.ApplyFunctionSignatureCmd;
import ghidra.app.decompiler.DecompInterface;
import ghidra.program.model.data.FunctionDefinitionDataType;
import ghidra.app.util.cparser.C.CParser;
import ghidra.framework.Application;
import ghidra.program.model.address.AddressSet;
import ghidra.program.model.symbol.SourceType;

public class DecompileTargets extends GhidraScript {
    @Override
    public void run() throws Exception {
        var args = getScriptArgs();
        if (args.length != 2) throw new IllegalArgumentException("Supply a target JSON file and a new output JSON path.");
        var input = JsonParser.parseString(Files.readString(Path.of(args[0]))).getAsJsonObject();
        var output = Path.of(args[1]).toAbsolutePath();
        if (Files.exists(output)) throw new IllegalArgumentException("The output already exists. Select a new run path.");
        var sha256 = currentProgram.getExecutableSHA256();
        if (sha256 == null || !sha256.equalsIgnoreCase(input.get("sha256").getAsString()))
            throw new IllegalArgumentException("The imported binary does not match the target SHA-256.");
        var targets = input.getAsJsonArray("functions");
        if (targets.isEmpty()) throw new IllegalArgumentException("Supply at least one function range.");
        if (input.has("types")) {
            var parser = new CParser(currentProgram.getDataTypeManager(), true, null);
            for (var declaration : input.getAsJsonArray("types")) {
                monitor.checkCancelled();
                if (parser.parse(declaration.getAsString()) == null || !parser.didParseSucceed())
                    throw new IllegalArgumentException("A supplied native type could not be parsed.");
            }
        }
        var names = new HashSet<String>();
        var addresses = new HashSet<ghidra.program.model.address.Address>();
        for (var element : targets) {
            monitor.checkCancelled();
            var target = element.getAsJsonObject();
            var name = target.get("name").getAsString();
            if (!name.matches("[A-Za-z_][A-Za-z0-9_]*") || !names.add(name))
                throw new IllegalArgumentException("Function names must be unique identifiers.");
            var start = currentProgram.getImageBase().add(Long.parseUnsignedLong(target.get("rva").getAsString(), 16));
            var end = currentProgram.getImageBase().add(Long.parseUnsignedLong(target.get("endRva").getAsString(), 16));
            if (!addresses.add(start)) throw new IllegalArgumentException("Duplicate native function address: " + start);
            if (end.compareTo(start) <= 0 || !currentProgram.getMemory().getExecuteSet().contains(start, end.subtract(1)))
                throw new IllegalArgumentException("Function range is not contained in executable memory: " + name);
            if (!new DisassembleCommand(start, new AddressSet(start, end.subtract(1)), true).applyTo(currentProgram, monitor))
                throw new IllegalStateException("Disassembly failed: " + name);
            var function = getFunctionAt(start);
            if (function == null) function = createFunction(start, name);
            if (function == null) throw new IllegalStateException("Function creation failed: " + name);
            function.setBody(new AddressSet(start, end.subtract(1)));
            function.setName(name, SourceType.USER_DEFINED);
            if (target.has("signature")) {
                var parsed = new CParser(currentProgram.getDataTypeManager()).parse(target.get("signature").getAsString());
                if (!(parsed instanceof FunctionDefinitionDataType signature) || !signature.getName().equals(name))
                    throw new IllegalArgumentException("Invalid native signature: " + name);
                signature.setCallingConvention(currentProgram.getCompilerSpec().getDefaultCallingConvention().getName());
                if (!new ApplyFunctionSignatureCmd(start, signature, SourceType.USER_DEFINED).applyTo(currentProgram, monitor))
                    throw new IllegalStateException("Signature application failed: " + name);
            }
        }
        var decompiler = new DecompInterface();
        var results = new JsonArray();
        try {
            if (!decompiler.openProgram(currentProgram)) throw new IllegalStateException(decompiler.getLastMessage());
            for (var element : targets) {
                monitor.checkCancelled();
                var target = element.getAsJsonObject();
                var start = currentProgram.getImageBase().add(Long.parseUnsignedLong(target.get("rva").getAsString(), 16));
                var result = decompiler.decompileFunction(getFunctionAt(start), 60, monitor);
                if (!result.decompileCompleted() || result.getDecompiledFunction() == null)
                    throw new IllegalStateException("Decompilation failed: " + target.get("name") + ": " + result.getErrorMessage());
                var row = target.deepCopy();
                row.addProperty("appliedSignature", getFunctionAt(start).getSignature().getPrototypeString());
                row.addProperty("bodyBytes", getFunctionAt(start).getBody().getNumAddresses());
                row.addProperty("pseudocode", result.getDecompiledFunction().getC());
                row.addProperty("diagnostics", result.getErrorMessage());
                results.add(row);
            }
        } finally {
            decompiler.dispose();
        }
        monitor.checkCancelled();
        var document = new JsonObject();
        document.addProperty("schemaVersion", "compendium.native-analysis.v1");
        document.addProperty("sha256", sha256);
        document.addProperty("ghidraVersion", Application.getApplicationVersion());
        document.addProperty("language", currentProgram.getLanguageID().toString());
        document.addProperty("compiler", currentProgram.getCompilerSpec().getCompilerSpecID().toString());
        document.addProperty("interpretation", "Decompiler output requires assembly and runtime verification; this is not recovered source.");
        if (input.has("types")) document.add("types", input.get("types").deepCopy());
        document.add("functions", results);
        Files.createDirectories(output.getParent());
        var temporary = Files.createTempFile(output.getParent(), ".decompile-", ".json");
        try {
            Files.writeString(temporary, new GsonBuilder().setPrettyPrinting().create().toJson(document) + "\n");
            Files.createLink(output, temporary);
        } finally {
            Files.deleteIfExists(temporary);
        }
        println("Verified decompilation output: " + output);
    }
}
