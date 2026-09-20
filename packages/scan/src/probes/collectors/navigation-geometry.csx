var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
var gameScene = Il2Cpp.GameState.CurrentGameScene;
if (!scene.IsValid() || !scene.isLoaded || gameScene == null) throw new System.InvalidOperationException("A loaded game scene is required.");
var pointer = Il2CppInterop.Runtime.IL2CPP.il2cpp_resolve_icall("UnityEngine.AI.NavMesh::CalculateTriangulation_Injected");
if (pointer == System.IntPtr.Zero || System.IntPtr.Size != 8) throw new System.NotSupportedException("The verified 64-bit native triangulation binding is unavailable.");
Il2CppInterop.Runtime.InteropTypes.Arrays.Il2CppStructArray<UnityEngine.Vector3> nativeVertices;
Il2CppInterop.Runtime.InteropTypes.Arrays.Il2CppStructArray<int> nativeIndices;
Il2CppInterop.Runtime.InteropTypes.Arrays.Il2CppStructArray<int> nativeAreas;
unsafe
{
    // The injected ABI writes IL2CPP array pointers for vertices, indices, and areas.
    // Keep them on the stack until all three wrappers own GC handles.
    System.IntPtr* result = stackalloc System.IntPtr[3];
    result[0] = result[1] = result[2] = System.IntPtr.Zero;
    ((delegate* unmanaged[Cdecl]<System.IntPtr, void>)(void*)pointer)((System.IntPtr)result);
    if (result[0] == System.IntPtr.Zero || result[1] == System.IntPtr.Zero || result[2] == System.IntPtr.Zero) throw new System.InvalidOperationException("Native triangulation did not return all three arrays.");
    nativeVertices = new Il2CppInterop.Runtime.InteropTypes.Arrays.Il2CppStructArray<UnityEngine.Vector3>(result[0]);
    nativeIndices = new Il2CppInterop.Runtime.InteropTypes.Arrays.Il2CppStructArray<int>(result[1]);
    nativeAreas = new Il2CppInterop.Runtime.InteropTypes.Arrays.Il2CppStructArray<int>(result[2]);
}
var vertexCount = nativeVertices.Length;
var indexCount = nativeIndices.Length;
var areaCount = nativeAreas.Length;
if (indexCount % 3 != 0 || areaCount != indexCount / 3) throw new System.InvalidOperationException("Native navigation triangle and area counts disagree.");
var vertices = new float[checked(vertexCount * 3)];
for (var index = 0; index < vertexCount; index++)
{
    var vertex = nativeVertices[index];
    var offset = index * 3;
    vertices[offset] = vertex.x;
    vertices[offset + 1] = vertex.y;
    vertices[offset + 2] = vertex.z;
}
var indices = new int[indexCount];
for (var index = 0; index < indexCount; index++)
{
    var vertexIndex = nativeIndices[index];
    if (vertexIndex < 0 || vertexIndex >= vertexCount) throw new System.InvalidOperationException("A native navigation triangle references an unavailable vertex.");
    indices[index] = vertexIndex;
}
var areas = new int[areaCount];
for (var index = 0; index < areaCount; index++) areas[index] = nativeAreas[index];
return new { schemaVersion = "compendium.navigation-geometry.v2", vertexLayout = "world-xyz", vertexCount = vertexCount, triangleCount = areaCount, frame = UnityEngine.Time.frameCount, scene = new { nativeId = gameScene.ID, path = scene.path, name = scene.name, handle = (int)scene.handle, buildIndex = scene.buildIndex }, scope = "all-loaded-navigation-data", surfaceOwnership = "unresolved", includesOffMeshLinks = false, vertices = vertices, indices = indices, areas = areas };
