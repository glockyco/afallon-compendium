var assemblyPath = System.IO.Path.GetFullPath(System.IO.Path.Combine(UnityEngine.Application.dataPath, "..", "GameAssembly.dll"));
string hash;
using (var stream = System.IO.File.OpenRead(assemblyPath))
using (var digest = System.Security.Cryptography.SHA256.Create())
{
    hash = System.BitConverter.ToString(digest.ComputeHash(stream)).Replace("-", "").ToLowerInvariant();
}
return new
{
    product = UnityEngine.Application.productName,
    applicationVersion = UnityEngine.Application.version,
    unityVersion = UnityEngine.Application.unityVersion,
    scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name,
    dataPath = UnityEngine.Application.dataPath,
    gameAssemblySha256 = hash
};
