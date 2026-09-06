var flags = System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic;
System.Diagnostics.ProcessModule assembly = null;
foreach (System.Diagnostics.ProcessModule module in System.Diagnostics.Process.GetCurrentProcess().Modules)
{
    if (string.Equals(module.ModuleName, "GameAssembly.dll", System.StringComparison.OrdinalIgnoreCase)) assembly = module;
}
if (assembly == null) throw new System.InvalidOperationException("GameAssembly module was not found.");
var rows = new System.Collections.Generic.List<object>();
foreach (var type in new[] { typeof(Il2Cpp.EconomyUtilities), typeof(Il2Cpp.RPGNpc) })
{
    foreach (var field in type.GetFields(flags))
    {
        if (!field.Name.StartsWith("NativeMethodInfoPtr_")) continue;
        var info = (System.IntPtr)field.GetValue(null);
        if (info == System.IntPtr.Zero) continue;
        var address = System.Runtime.InteropServices.Marshal.ReadIntPtr(info).ToInt64();
        var rva = address - assembly.BaseAddress.ToInt64();
        if (rva < 0 || rva >= assembly.ModuleMemorySize) throw new System.InvalidOperationException("Method pointer is outside GameAssembly.");
        rows.Add(new { type = type.FullName, field = field.Name, rva = rva });
    }
}
return new { schemaVersion = "compendium.native-methods.v1", module = assembly.ModuleName, imageSize = assembly.ModuleMemorySize, methods = rows };
