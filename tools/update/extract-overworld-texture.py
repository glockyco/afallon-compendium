# Operator tool: extracts the overworld map texture "Newest map" from the installed game data.
# usage: uv run python tools/update/extract-overworld-texture.py OUTPUT_PNG
import sys
from pathlib import Path
import UnityPy

if len(sys.argv) != 2:
    raise SystemExit("usage: extract-overworld-texture.py OUTPUT_PNG")
data_root = Path.home() / "Library/Application Support/CrossOver/Bottles/Steam/drive_c/Program Files (x86)/Steam/steamapps/common/Afallon/Afallon_Data"
out = Path(sys.argv[1])
matches = []
for source in [*sorted(data_root.glob("sharedassets*.assets")), data_root / "resources.assets"]:
    environment = UnityPy.load(str(source))
    for obj in environment.objects:
        if obj.type.name != "Texture2D":
            continue
        data = obj.read()
        if data.m_Name == "Newest map":
            print(source)
            matches.append(data)
if len(matches) != 1:
    raise RuntimeError(f"Expected one Newest map texture, found {len(matches)}")
matches[0].image.save(out)
print(out)
