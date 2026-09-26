var menu = Il2CppBLINK.RPGBuilder.Managers.MainMenuManager.Instance;
if (menu == null) throw new System.InvalidOperationException("The main menu is not active.");
var requested = args == null ? null : (string)args["researchCharacter"];
if (string.IsNullOrEmpty(requested)) throw new System.ArgumentException("researchCharacter is required.");
menu.SelectCharacter(requested);
menu.PlaySelectedCharacter();
return new
{
    requested = requested,
    activeScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name,
    frame = UnityEngine.Time.frameCount
};
