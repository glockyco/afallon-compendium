#!/usr/bin/env python3
"""Index Unity hierarchies without decoding custom MonoBehaviour payloads."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import sys
from pathlib import Path, PurePosixPath
from typing import Any

import UnityPy


UNITYPY_VERSION = UnityPy.__version__
GAME_OBJECT = 1
TRANSFORM = 4
MONO_BEHAVIOUR = 114
MONO_SCRIPT = 115
RECT_TRANSFORM = 224
BUILD_SETTINGS = 141
ASSET_BUNDLE = 142


class ReaderError(RuntimeError):
    """An input cannot produce a structurally valid serialized index."""


def fail(message: str) -> ReaderError:
    return ReaderError(message)


def ptr_id(value: Any) -> int | None:
    if value is None:
        return None
    result = value.m_PathID
    if not isinstance(result, int):
        raise fail(f"invalid pointer path ID: {result!r}")
    return result or None


def ptr_file_id(value: Any) -> int:
    if value is None:
        return 0
    result = value.m_FileID
    if not isinstance(result, int):
        raise fail(f"invalid pointer file ID: {result!r}")
    return result


def class_id(obj: Any) -> int:
    value = obj.class_id
    if not isinstance(value, int):
        raise fail(f"object has no numeric class ID: {value!r}")
    return value


def obj_path_id(obj: Any) -> int:
    value = obj.path_id
    if not isinstance(value, int) or value == 0:
        raise fail(f"object has invalid path ID: {value!r}")
    return value


def finite_float(value: Any, field: str) -> float:
    if not isinstance(value, (int, float)) or not math.isfinite(float(value)):
        raise fail(f"{field} is not a finite number: {value!r}")
    return float(value)


def vector3(value: Any, field: str) -> dict[str, float]:
    return {
        "x": finite_float(getattr(value, "x", None), f"{field}.x"),
        "y": finite_float(getattr(value, "y", None), f"{field}.y"),
        "z": finite_float(getattr(value, "z", None), f"{field}.z"),
    }


def quaternion(value: Any, field: str) -> dict[str, float]:
    return {
        "x": finite_float(getattr(value, "x", None), f"{field}.x"),
        "y": finite_float(getattr(value, "y", None), f"{field}.y"),
        "z": finite_float(getattr(value, "z", None), f"{field}.z"),
        "w": finite_float(getattr(value, "w", None), f"{field}.w"),
    }


def logical_path(root: Path, path: Path) -> str:
    try:
        return path.resolve().relative_to(root.resolve()).as_posix()
    except ValueError as exc:
        raise fail(f"path is outside game root: {path}") from exc


def hash_file(path: Path, label: str) -> tuple[str, int]:
    try:
        size = path.stat().st_size
    except OSError as exc:
        raise fail(f"cannot stat {label} {path}: {exc}") from exc
    digest = hashlib.sha256()
    try:
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
    except OSError as exc:
        raise fail(f"cannot hash {label} {path}: {exc}") from exc
    return digest.hexdigest(), size


def file_record(root: Path, path: Path) -> dict[str, Any]:
    path = path.resolve()
    digest, size = hash_file(path, "metadata dependency")
    return {"path": logical_path(root, path), "sha256": digest, "bytes": size}


def all_serialized_files(value: Any) -> list[Any]:
    assets = getattr(value, "assets", None)
    if assets is None:
        return []
    return [asset for asset in assets if getattr(asset, "objects", None) is not None]


def serialized_file_name(value: Any) -> str:
    name = getattr(value, "name", "")
    if not isinstance(name, str) or not name:
        raise fail("serialized file has no name")
    return name.replace("\\", "/")


def find_serialized_file(files: list[Any], requested: str | None) -> Any:
    if requested is None:
        if len(files) != 1:
            names = ", ".join(sorted(serialized_file_name(item) for item in files))
            raise fail(f"serialized file selection is ambiguous; choose one of: {names}")
        return files[0]

    matches = [item for item in files if serialized_file_name(item) == requested]
    if not matches:
        # UnityPy strips bundle directory prefixes from SerializedFile.name. Accept
        # an exact basename only when the caller supplied a path to that same name.
        requested_name = PurePosixPath(requested.replace("\\", "/")).name
        matches = [item for item in files if serialized_file_name(item) == requested_name]
    if len(matches) != 1:
        if not matches:
            names = ", ".join(sorted(serialized_file_name(item) for item in files))
            raise fail(f"serialized file {requested!r} was not found; available: {names}")
        raise fail(f"serialized file selection {requested!r} is ambiguous")
    return matches[0]


def object_name(obj: Any) -> str:
    value = getattr(obj, "m_Name", "")
    if not isinstance(value, str):
        raise fail("GameObject has a non-string name")
    return value


def component_pointer(entry: Any) -> Any:
    if entry is None:
        return None
    if isinstance(entry, tuple):
        if len(entry) != 2:
            raise fail(f"malformed component slot: {entry!r}")
        return entry[1]
    pointer = getattr(entry, "component", None)
    if pointer is None:
        raise fail(f"malformed component slot: {entry!r}")
    return pointer


def parse_object(obj: Any, label: str) -> Any:
    try:
        return obj.parse_as_object(check_read=False)
    except Exception as exc:  # UnityPy raises several parser-specific exceptions.
        raise fail(f"cannot parse {label} object {obj_path_id(obj)}: {exc}") from exc


def parse_monobehaviour_head(obj: Any) -> Any:
    try:
        return obj.parse_monobehaviour_head()
    except Exception as exc:
        raise fail(f"cannot parse MonoBehaviour header {obj_path_id(obj)}: {exc}") from exc


def local_pointer(pointer: Any, source_file: Any, target_class: int | None, label: str) -> Any:
    if not pointer:
        raise fail(f"{label} is null")
    if ptr_file_id(pointer) != 0:
        raise fail(f"{label} points outside serialized file (file ID {ptr_file_id(pointer)})")
    target_path = ptr_id(pointer)
    if target_path is None:
        raise fail(f"{label} is null")
    target = source_file.objects.get(target_path)
    if target is None:
        raise fail(f"{label} points to missing path ID {target_path}")
    if target_class is not None and class_id(target) != target_class:
        raise fail(f"{label} points to class {class_id(target)}, expected {target_class}")
    return target


def parse_hierarchy(source_file: Any) -> tuple[dict[int, Any], dict[int, Any], dict[int, Any]]:
    game_objects: dict[int, Any] = {}
    transforms: dict[int, Any] = {}
    parsed_game_objects: dict[int, Any] = {}
    for raw in source_file.objects.values():
        kind = class_id(raw)
        object_id = obj_path_id(raw)
        if kind == GAME_OBJECT:
            game_objects[object_id] = raw
        elif kind in (TRANSFORM, RECT_TRANSFORM):
            transforms[object_id] = parse_object(raw, "Transform")
    for object_id, raw in game_objects.items():
        parsed_game_objects[object_id] = parse_object(raw, "GameObject")
    return game_objects, transforms, parsed_game_objects


def select_root_from_container(environment: Any, source_file: Any, asset_name: str) -> Any:
    try:
        matches = []
        found_name = False
        for asset_file in all_serialized_files(environment):
            for raw in asset_file.objects.values():
                if class_id(raw) != ASSET_BUNDLE:
                    continue
                bundle = parse_object(raw, "AssetBundle")
                for name, info in getattr(bundle, "m_Container", None) or []:
                    if name != asset_name:
                        continue
                    found_name = True
                    pointer = getattr(info, "asset", None)
                    target = pointer.deref()
                    target_file = getattr(target, "assets_file", None)
                    if target_file is source_file and class_id(target) == GAME_OBJECT:
                        matches.append(target)
    except Exception as exc:
        raise fail(f"cannot resolve bundle asset {asset_name!r}: {exc}") from exc
    if len(matches) == 1:
        return matches[0]
    if not matches and found_name:
        raise fail(f"bundle asset {asset_name!r} is not in selected serialized file")
    if not matches:
        raise fail(f"bundle asset {asset_name!r} was not found as an exact GameObject container path")
    raise fail(f"bundle asset {asset_name!r} selects multiple root GameObjects")


def select_root_by_name(source_file: Any, asset_name: str, parsed_game_objects: dict[int, Any]) -> Any:
    matches = [source_file.objects[path_id] for path_id, parsed in parsed_game_objects.items() if object_name(parsed) == asset_name]
    if len(matches) == 1:
        return matches[0]
    if not matches:
        raise fail(f"asset {asset_name!r} was not found in serialized file")
    raise fail(f"asset {asset_name!r} is ambiguous; select its exact bundle asset path")


def selected_game_object_ids(
    source_file: Any,
    game_objects: dict[int, Any],
    transforms: dict[int, Any],
    parsed_game_objects: dict[int, Any],
    root: Any | None,
) -> tuple[set[int], int | None]:
    if root is None:
        return set(game_objects), None

    root_id = obj_path_id(root)
    root_parsed = parsed_game_objects[root_id]
    component_entries = getattr(root_parsed, "m_Component", None) or []
    root_transform_id: int | None = None
    for entry in component_entries:
        pointer = component_pointer(entry)
        target_id = ptr_id(pointer)
        if target_id is not None and target_id in transforms:
            if root_transform_id is not None:
                raise fail(f"prefab root GameObject {root_id} has multiple Transform components")
            root_transform_id = target_id
    if root_transform_id is None:
        raise fail(f"prefab root GameObject {root_id} has no Transform component")

    selected: set[int] = set()
    visiting: set[int] = set()

    def visit(transform_id: int) -> None:
        if transform_id in visiting:
            raise fail(f"transform hierarchy cycle at path ID {transform_id}")
        transform = transforms.get(transform_id)
        if transform is None:
            raise fail(f"prefab root references missing Transform {transform_id}")
        game_object = local_pointer(
            getattr(transform, "m_GameObject", None), source_file, GAME_OBJECT, f"Transform {transform_id}.m_GameObject"
        )
        game_object_id = obj_path_id(game_object)
        if game_object_id not in game_objects:
            raise fail(f"Transform {transform_id} points to an unselected GameObject")
        visiting.add(transform_id)
        selected.add(game_object_id)
        children = getattr(transform, "m_Children", None) or []
        for child in children:
            child_id = ptr_id(child)
            if child_id is None or ptr_file_id(child) != 0:
                raise fail(f"Transform {transform_id} has an invalid child pointer")
            visit(child_id)
        visiting.remove(transform_id)

    visit(root_transform_id)
    return selected, root_id



def mono_script_info(mono_raw: Any, mono: Any, cache: dict[tuple[int, int], tuple[str | None, str | None]]) -> tuple[str | None, str | None, bool]:
    script = mono.m_Script
    if not script:
        return None, None, True
    try:
        script_reader = script.deref()
        if class_id(script_reader) != MONO_SCRIPT:
            raise fail(f"MonoBehaviour {obj_path_id(mono_raw)} points to a non-MonoScript object")
        key = (id(script_reader.assets_file), obj_path_id(script_reader))
        if key in cache:
            return *cache[key], False
        script_obj = parse_object(script_reader, "MonoScript")
    except ReaderError:
        raise
    except Exception as exc:
        raise fail(f"MonoBehaviour {obj_path_id(mono_raw)} has an unresolved MonoScript pointer: {exc}") from exc
    namespace = script_obj.m_Namespace
    class_name = script_obj.m_ClassName
    assembly = script_obj.m_AssemblyName
    if not isinstance(namespace, str) or not isinstance(class_name, str) or not isinstance(assembly, str):
        raise fail(f"MonoBehaviour {obj_path_id(mono_raw)} has malformed MonoScript metadata")
    type_name = f"{namespace}.{class_name}" if namespace and class_name else class_name
    cache[key] = (type_name or None, assembly or None)
    return *cache[key], False


def component_info(
    game_object_id: int,
    game_object: Any,
    source_file: Any,
    mono_headers: dict[int, tuple[Any, str | None, str | None, bool]],
) -> tuple[list[dict[str, Any] | None], set[int]]:
    result: list[dict[str, Any] | None] = []
    attached_mono: set[int] = set()
    for index, entry in enumerate(game_object.m_Component):
        pointer = component_pointer(entry)
        target_id = ptr_id(pointer)
        if target_id is None:
            if ptr_file_id(pointer) != 0:
                raise fail(f"GameObject {game_object_id} component slot {index} has an external null pointer")
            result.append(None)
            continue
        if ptr_file_id(pointer) != 0:
            raise fail(f"GameObject {game_object_id} component slot {index} points outside source file")
        target = source_file.objects.get(target_id)
        if target is None:
            raise fail(f"GameObject {game_object_id} component slot {index} points to missing {target_id}")
        target_class = class_id(target)
        type_name: str | None = None
        assembly: str | None = None
        if target_class == MONO_BEHAVIOUR:
            header = mono_headers.get(target_id)
            if header is None:
                raise fail(f"MonoBehaviour {target_id} is outside the selected ownership graph")
            mono, type_name, assembly, _ = header
            if not mono.m_GameObject or ptr_file_id(mono.m_GameObject) != 0 or ptr_id(mono.m_GameObject) != game_object_id:
                raise fail(f"MonoBehaviour {target_id} does not point back to GameObject {game_object_id}")
            attached_mono.add(target_id)
        result.append({"pathId": str(target_id), "classId": target_class, "typeName": type_name, "assembly": assembly})
    return result, attached_mono


def hierarchy_record(
    game_object_raw: Any,
    game_object: Any,
    source_file: Any,
    transforms: dict[int, Any],
    selected_ids: set[int],
    mono_headers: dict[int, tuple[Any, str | None, str | None, bool]],
) -> tuple[dict[str, Any], set[int]]:
    game_object_id = obj_path_id(game_object_raw)
    transform_id: int | None = None
    transform: Any | None = None
    entries = getattr(game_object, "m_Component", None) or []
    for entry in entries:
        component_id = ptr_id(component_pointer(entry))
        if component_id is not None and component_id in transforms:
            if transform_id is not None:
                raise fail(f"GameObject {game_object_id} has multiple Transform components")
            transform_id = component_id
            transform = transforms[component_id]
    if transform_id is None or transform is None:
        raise fail(f"GameObject {game_object_id} has no Transform component")
    transform_go = local_pointer(getattr(transform, "m_GameObject", None), source_file, GAME_OBJECT, f"Transform {transform_id}.m_GameObject")
    if obj_path_id(transform_go) != game_object_id:
        raise fail(f"Transform {transform_id}.m_GameObject does not point back to GameObject {game_object_id}")

    parent_pointer = getattr(transform, "m_Father", None)
    parent_transform_id: int | None = None
    if parent_pointer:
        if ptr_file_id(parent_pointer) != 0:
            raise fail(f"Transform {transform_id}.m_Father points outside source file")
        parent_transform_id = ptr_id(parent_pointer)
        if parent_transform_id is None or parent_transform_id not in transforms:
            raise fail(f"Transform {transform_id}.m_Father points to missing Transform {parent_transform_id}")
        parent_transform = transforms[parent_transform_id]
        parent_go = local_pointer(getattr(parent_transform, "m_GameObject", None), source_file, GAME_OBJECT, f"Transform {parent_transform_id}.m_GameObject")
        parent_go_id = obj_path_id(parent_go)
        if parent_go_id not in selected_ids:
            raise fail(f"Transform {transform_id}.m_Father points outside selected hierarchy")

    children_ids: list[str] = []
    seen_children: set[int] = set()
    for child_pointer in getattr(transform, "m_Children", None) or []:
        if ptr_file_id(child_pointer) != 0:
            raise fail(f"Transform {transform_id} has a child outside source file")
        child_transform_id = ptr_id(child_pointer)
        if child_transform_id is None or child_transform_id not in transforms:
            raise fail(f"Transform {transform_id} has a missing child Transform {child_transform_id}")
        if child_transform_id in seen_children:
            raise fail(f"Transform {transform_id} lists child {child_transform_id} more than once")
        seen_children.add(child_transform_id)
        child_transform = transforms[child_transform_id]
        child_go = local_pointer(getattr(child_transform, "m_GameObject", None), source_file, GAME_OBJECT, f"Transform {child_transform_id}.m_GameObject")
        child_go_id = obj_path_id(child_go)
        if child_go_id not in selected_ids:
            raise fail(f"Transform {transform_id} has child GameObject outside selected hierarchy")
        children_ids.append(str(child_transform_id))

    components, attached_mono = component_info(game_object_id, game_object, source_file, mono_headers)
    position = getattr(transform, "m_LocalPosition", None)
    rotation = getattr(transform, "m_LocalRotation", None)
    scale = getattr(transform, "m_LocalScale", None)
    if position is None or rotation is None or scale is None:
        raise fail(f"Transform {transform_id} has incomplete local transform")
    record = {
        "pathId": str(game_object_id),
        "name": object_name(game_object),
        "activeSelf": bool(getattr(game_object, "m_IsActive", False)),
        "transform": {
            "pathId": str(transform_id),
            "parentPathId": str(parent_transform_id) if parent_pointer else None,
            "children": children_ids,
            "localPosition": vector3(position, f"Transform {transform_id}.m_LocalPosition"),
            "localRotation": quaternion(rotation, f"Transform {transform_id}.m_LocalRotation"),
            "localScale": vector3(scale, f"Transform {transform_id}.m_LocalScale"),
        },
        "components": components,
    }
    return record, attached_mono


def find_build_settings_file(root: Path, source: Path) -> Path | None:
    current = source.parent
    while True:
        candidate = current / "globalgamemanagers"
        if candidate.is_file():
            return candidate.resolve()
        if current == root or current.parent == current:
            break
        current = current.parent
    discovered = [path.resolve() for path in root.rglob("globalgamemanagers") if path.is_file()]
    if len(discovered) > 1:
        raise fail("globalgamemanagers metadata is ambiguous")
    return discovered[0] if discovered else None


def build_scene_identity(root: Path, source: Path, build_file: Path | None) -> tuple[str | None, int | None, list[dict[str, Any]]]:
    level = re.fullmatch(r"level(\d+)", source.name)
    if build_file is None or level is None or source.parent != build_file.parent:
        return None, None, []
    try:
        environment = UnityPy.load(str(build_file))
        settings_objects = [obj for obj in environment.objects if class_id(obj) == BUILD_SETTINGS]
        if len(settings_objects) != 1:
            raise fail(f"globalgamemanagers contains {len(settings_objects)} BuildSettings objects")
        scenes = parse_object(settings_objects[0], "BuildSettings").scenes
        index = int(level.group(1))
        if not isinstance(scenes, list) or index >= len(scenes) or not isinstance(scenes[index], str) or not scenes[index]:
            raise fail(f"BuildSettings has no scene path at build index {index}")
        return scenes[index], index, [file_record(root, build_file)]
    except ReaderError:
        raise
    except Exception as exc:
        raise fail(f"cannot read BuildSettings from {build_file}: {exc}") from exc


def loaded_metadata_paths(environment: Any, source: Path) -> list[Path]:
    paths: set[Path] = set()
    for name in environment.files:
        path = Path(name)
        if not path.is_absolute():
            path = Path(environment.path) / path
        path = path.resolve()
        if path == source:
            continue
        if not path.is_file():
            raise fail(f"cannot attribute loaded metadata to a source file: {name}")
        paths.add(path)
    return sorted(paths)


def index_asset(game_root: Path, source: Path, serialized_file: str | None, asset_name: str | None) -> dict[str, Any]:
    environment = UnityPy.load(str(source))
    files = all_serialized_files(environment)
    if not files:
        raise fail(f"source contains no serialized files: {source}")
    selected_file = find_serialized_file(files, serialized_file)
    bundle_records = [
        raw
        for asset_file in files
        for raw in asset_file.objects.values()
        if class_id(raw) == ASSET_BUNDLE
    ]
    if bundle_records and asset_name is None:
        raise fail("assetName is required when indexing an asset bundle")

    game_objects, transforms, parsed_game_objects = parse_hierarchy(selected_file)
    root: Any | None = None
    root_id: int | None = None
    if asset_name is not None:
        if bundle_records:
            root = select_root_from_container(environment, selected_file, asset_name)
        else:
            root = select_root_by_name(selected_file, asset_name, parsed_game_objects)
        root_id = obj_path_id(root)
        if root_id not in game_objects:
            raise fail(f"asset root {asset_name!r} is not a GameObject in {serialized_file_name(selected_file)}")
    selected_ids, root_id = selected_game_object_ids(
        selected_file, game_objects, transforms, parsed_game_objects, root
    )
    if not selected_ids:
        raise fail("selected serialized source contains no GameObjects")

    mono_headers: dict[int, tuple[Any, str | None, str | None, bool]] = {}
    script_cache: dict[tuple[int, int], tuple[str | None, str | None]] = {}
    for raw in selected_file.objects.values():
        if class_id(raw) != MONO_BEHAVIOUR:
            continue
        parsed = parse_monobehaviour_head(raw)
        owner = parsed.m_GameObject
        if asset_name is not None and (not owner or ptr_file_id(owner) != 0 or ptr_id(owner) not in selected_ids):
            continue
        if owner and (ptr_file_id(owner) != 0 or ptr_id(owner) not in game_objects):
            raise fail(f"MonoBehaviour {obj_path_id(raw)} references a missing GameObject")
        type_name, assembly, null_script = mono_script_info(raw, parsed, script_cache)
        mono_headers[obj_path_id(raw)] = (parsed, type_name, assembly, null_script)

    objects: list[dict[str, Any]] = []
    attached_mono_ids: set[int] = set()
    selected_transform_ids: set[int] = set()
    for object_id in sorted(selected_ids):
        record, attached = hierarchy_record(
            game_objects[object_id],
            parsed_game_objects[object_id],
            selected_file,
            transforms,
            selected_ids,
            mono_headers,
        )
        objects.append(record)
        attached_mono_ids.update(attached)
        selected_transform_ids.add(int(record["transform"]["pathId"]))

    component_ids: set[str] = set()
    for record in objects:
        for component in record["components"]:
            if component is None:
                continue
            component_id = component["pathId"]
            if component_id in component_ids:
                raise fail(f"serialized component path ID {component_id} is attached more than once")
            component_ids.add(component_id)

    records_by_transform_id = {int(record["transform"]["pathId"]): record for record in objects}
    for record in objects:
        object_id = int(record["pathId"])
        transform_id = record["transform"]["pathId"]
        parent_id = record["transform"]["parentPathId"]
        if parent_id is not None:
            parent_record = records_by_transform_id.get(int(parent_id))
            if parent_record is None:
                raise fail(f"Transform {transform_id} has a missing parent Transform {parent_id}")
            parent_children = parent_record["transform"]["children"]
            if str(transform_id) not in parent_children:
                raise fail(f"Transform {transform_id} is not listed by parent Transform {parent_id}")
        for child_id in record["transform"]["children"]:
            child_record = records_by_transform_id.get(int(child_id))
            if child_record is None:
                raise fail(f"Transform {transform_id} has a missing child Transform {child_id}")
            if child_record["transform"]["parentPathId"] != str(transform_id):
                raise fail(f"child Transform {child_id} does not point back to parent {transform_id}")

    # Every selected transform must belong to exactly one selected GameObject;
    # this catches truncated or cross-file hierarchy graphs.
    if asset_name is None:
        all_transform_ids = set(transforms)
    else:
        all_transform_ids = selected_transform_ids
    if selected_transform_ids != all_transform_ids:
        missing = sorted(all_transform_ids - selected_transform_ids)
        raise fail(f"serialized source contains Transform records outside indexed hierarchy: {missing[:8]}")

    root_candidates = [
        int(record["pathId"])
        for record in objects
        if record["transform"]["parentPathId"] is None
    ]
    if asset_name is None and len(root_candidates) == 1:
        root_id = root_candidates[0]
    elif asset_name is None:
        root_id = None

    scene_path: str | None = None
    build_index: int | None = None
    dependencies: list[dict[str, Any]] = []
    if asset_name is None:
        build_file = find_build_settings_file(game_root, source)
        scene_path, build_index, build_dependencies = build_scene_identity(game_root, source, build_file)
        dependencies.extend(build_dependencies)
    for dependency in loaded_metadata_paths(environment, source):
        dependencies.append(file_record(game_root, dependency))
    unique_dependencies = {item["path"]: item for item in dependencies}

    source_hash, source_bytes = hash_file(source, "source")
    null_scripts = sum(1 for header in mono_headers.values() if header[3])
    attached_count = len(attached_mono_ids)
    mono_count = len(mono_headers)
    return {
        "schemaVersion": "compendium.serialized-assets.v1",
        "source": {
            "path": logical_path(game_root, source),
            "sha256": source_hash,
            "bytes": source_bytes,
            "serializedFile": serialized_file_name(selected_file),
            "unityVersion": str(getattr(selected_file, "unity_version", "")),
            "scenePath": scene_path,
            "buildIndex": build_index,
            "assetName": asset_name,
        },
        "parser": {"name": "UnityPy", "version": UNITYPY_VERSION},
        "dependencies": [unique_dependencies[key] for key in sorted(unique_dependencies)],
        "rootGameObjectPathId": str(root_id) if root_id is not None else None,
        "totals": {
            "objects": len(selected_file.objects),
            "gameObjects": len(objects),
            "transforms": len(selected_transform_ids),
            "monoBehaviours": mono_count,
            "attachedMonoBehaviours": attached_count,
            "unboundMonoBehaviours": mono_count - attached_count,
            "nullScripts": null_scripts,
        },
        "objects": objects,
    }


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--game-root", required=True, help="installed game root used for relative paths and metadata")
    parser.add_argument("--source-path", required=True, help="scene or bundle path, absolute or relative to game root")
    parser.add_argument("--serialized-file", help="exact serialized file name inside a bundle")
    parser.add_argument("--asset-name", help="exact prefab container path or unambiguous standalone root name")
    return parser.parse_args(argv)


def resolve_paths(game_root_arg: str, source_arg: str) -> tuple[Path, Path]:
    game_root = Path(game_root_arg).expanduser().resolve()
    if not game_root.is_dir():
        raise fail(f"game root is not a directory: {game_root}")
    source_arg_path = Path(source_arg).expanduser()
    source = source_arg_path.resolve() if source_arg_path.is_absolute() else (game_root / source_arg_path).resolve()
    if not source.is_file():
        raise fail(f"source path is not a file: {source}")
    # The emitted logical paths and dependency hashes must be meaningful game
    # relative paths. Do not silently hash an unrelated file elsewhere.
    logical_path(game_root, source)
    return game_root, source


def main(argv: list[str] | None = None) -> int:
    try:
        args = parse_args(sys.argv[1:] if argv is None else argv)
        game_root, source = resolve_paths(args.game_root, args.source_path)
        output = index_asset(game_root, source, args.serialized_file, args.asset_name)
        json.dump(output, sys.stdout, ensure_ascii=False, separators=(",", ":"))
        sys.stdout.write("\n")
        return 0
    except ReaderError as exc:
        print(f"serialized-assets: {exc}", file=sys.stderr)
        return 2
    except Exception as exc:
        print(f"serialized-assets: unexpected failure: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
