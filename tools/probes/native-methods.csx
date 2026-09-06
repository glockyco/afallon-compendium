var flags = System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic;
System.Diagnostics.ProcessModule assembly = null;
foreach (System.Diagnostics.ProcessModule module in System.Diagnostics.Process.GetCurrentProcess().Modules)
{
    if (string.Equals(module.ModuleName, "GameAssembly.dll", System.StringComparison.OrdinalIgnoreCase)) assembly = module;
}
if (assembly == null) throw new System.InvalidOperationException("GameAssembly module was not found.");
var rows = new System.Collections.Generic.List<object>();
var unavailable = new System.Collections.Generic.List<object>();
foreach (var type in new[] { typeof(Il2Cpp.EconomyUtilities), typeof(Il2Cpp.ClothDrops), typeof(Il2Cpp.RPGNpc), typeof(Il2CppSystem.Collections.Generic.Dictionary<int, Il2Cpp.RPGNpc>), typeof(UnityEngine.Random), typeof(UnityEngine.Object), typeof(Il2CppBLINK.RPGBuilder.Managers.RequirementsManager), typeof(Il2CppBLINK.RPGBuilder.AI.NPCSpawner) })
{
    foreach (var field in type.GetFields(flags))
    {
        if (!field.Name.StartsWith("NativeMethodInfoPtr_")) continue;
        var info = (System.IntPtr)field.GetValue(null);
        if (info == System.IntPtr.Zero)
        {
            unavailable.Add(new { type = type.FullName, field = field.Name, reason = "Native method metadata pointer is zero." });
            continue;
        }
        var address = System.Runtime.InteropServices.Marshal.ReadIntPtr(info).ToInt64();
        var rva = address - assembly.BaseAddress.ToInt64();
        if (address == 0 || rva < 0 || rva >= assembly.ModuleMemorySize)
        {
            unavailable.Add(new { type = type.FullName, field = field.Name, reason = address == 0 ? "Native code pointer is zero." : "Native code pointer is outside GameAssembly." });
            continue;
        }
        rows.Add(new { type = type.FullName, field = field.Name, rva = rva });
    }
}
return new { schemaVersion = "compendium.native-methods.v1", module = assembly.ModuleName, imageSize = assembly.ModuleMemorySize, methods = rows, unavailable = unavailable };
