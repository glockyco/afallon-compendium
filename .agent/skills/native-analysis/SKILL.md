---
name: native-analysis
description: Analyze build-matched Afallon IL2CPP native methods with a HotRepl address probe and bounded Ghidra decompilation. Use when recovered declarations lack method behavior and a game rule needs native evidence.
---

# Afallon native analysis

## Select a build and question

Use native analysis when an IL2CPP declaration supplies a field or signature but not its behavior. State the exact method and behavioral question first. Use [EXPLORATION.md: NPC levels in build 25434619](../../../EXPLORATION.md#npc-levels-in-build-25434619) as a worked reference. Decompiler pseudocode is not original C# and does not prove every branch. Compare uncertain branches with assembly and bounded runtime observations.

Keep the installed `GameAssembly.dll`, native metadata, target file, and Ghidra project on the same Steam build. Verify the binary SHA-256. Do not reuse absolute process addresses or an RVA from another build. The analysis shell supplies Ghidra. It does not install analysis software in CrossOver.

## Collect live native method addresses

Follow [Runtime access](../../../EXPLORATION.md#runtime-access) and `.agent/skills/hotrepl-runtime-inspection/SKILL.md` before connecting. Do not connect while `scan` or `capture` owns the single HotRepl client.

`tools/probes/native-methods.csx` reads `NativeMethodInfoPtr_` fields from the live interop types. It reads native code pointers from their method metadata and subtracts the loaded `GameAssembly.dll` base. It returns decimal module-relative RVAs and reports unavailable fields. Its present type list covers combat NPC levels, zone rules, adventurer population, and NPC spawning. Change the type list only for a separately reviewed research question.

Run this owned, read-only example from the main checkout, which holds the ignored configuration and research evidence. Set the output to a new path under ignored `research/ghidra/<build>/`. Run the example only after the research character and game are ready.

```sh
bun -e '
import { loadConfig } from "./apps/compendium-cli/src/config.ts";
import { withRuntime } from "@afallon/runtime";
const config = await loadConfig("local/config.json");
const body = await Bun.file("tools/probes/native-methods.csx").text();
const output = "research/ghidra/25434619/native-methods-new.json";
if (await Bun.file(output).exists()) throw new Error("Choose a new output path.");
const value = await withRuntime(config, async runtime => {
  const rows = await runtime.evaluate(`new System.Func<object>(() => { ${body} })()`);
  await runtime.complete();
  return rows;
});
await Bun.write(output, JSON.stringify(value, null, 2) + "\n");
'
```

Read the `unavailable` array and verify each required method field has one valid RVA. The probe does not supply a function's exclusive end. In the analysis shell, run `llvm-readobj --unwind "<gamePath>/GameAssembly.dll"` and find the matching PE function start and end. Compare the start with the live RVA and inspect adjacent instructions for range ambiguity. Convert decimal RVAs to hexadecimal strings without a `0x` prefix. Do not invent a range from a neighboring method name.

Create a local targets JSON with the binary's SHA-256 and a nonempty `functions` array. Each function has a unique `name`, hexadecimal `rva`, and exclusive hexadecimal `endRva`. Optional `signature` and `types` entries require reviewed C declarations and the correct Windows x64 ABI. The ignored `local/level-targets.json` in the main checkout is an example for build 25434619. Recovered declarations and generated bodies are not native implementation evidence.

## Decompile the explicit targets

Use an existing imported `GameAssembly.dll` project for the same build. Run this command from the main checkout, where the ignored research project exists. Select a new output filename for each run.

```sh
nix develop .#analysis --no-write-lock-file --command ghidra-analyzeHeadless \
  research/ghidra/25434619 NpcLevels \
  -process GameAssembly.dll -noanalysis \
  -scriptPath tools/ghidra \
  -postScript DecompileTargets.java local/level-targets.json research/ghidra/25434619/npc-level-functions-new.json
```

For a new build, import its verified binary into a new Ghidra project under `research/ghidra/<build>/` before `-process`. Never overwrite an earlier output. `DecompileTargets.java` checks the imported SHA-256, target names, executable ranges, and decompilation results. It writes the output atomically only after all targets complete. The script can disassemble selected ranges and apply reviewed signatures and types.

## Check the output, not only the exit status

A successful headless Ghidra process can still report a script failure. Require a new output file and the `Verified decompilation output` message. Inspect script diagnostics and each row's `diagnostics`, `appliedSignature`, `bodyBytes`, and `pseudocode`. Match the output `sha256` to both the target file and installed binary. Match the function names, start RVAs, and exclusive end RVAs against the target list. Reject missing, duplicate, empty, or partial results. Confirm suspicious control flow against assembly and a bounded HotRepl observation before recording a derived rule.

For the example targets and output, this check covers identity and basic completeness:

```sh
jq -e --slurpfile targets local/level-targets.json '
  .schemaVersion == "compendium.native-analysis.v1" and
  .sha256 == $targets[0].sha256 and
  ([.functions[] | [.name, .rva, .endRva]] | sort) ==
    ([$targets[0].functions[] | [.name, .rva, .endRva]] | sort) and
  all(.functions[]; .bodyBytes > 0 and (.pseudocode | length) > 0)
' research/ghidra/25434619/npc-level-functions-new.json
```

This command checks recorded fields. It does not replace assembly review or prove that the decompiler recovered game source. Store target files, Ghidra projects, outputs, logs, and additional runtime evidence under ignored `research/ghidra/<build>/` or ignored `local/`. Do not commit game binaries, recovered declarations, save data, or bulk artwork. See [Open limitations](../../../EXPLORATION.md#open-limitations).
