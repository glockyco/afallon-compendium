from __future__ import annotations

import unittest

from packages.scan.src.serialized_assets import ReaderError, mono_script_info


class Pointer:
    m_PathID: int = 17

    def __init__(self, file_id: int) -> None:
        self.m_FileID: int = file_id

    def __bool__(self) -> bool:
        return True

    def deref(self) -> object:
        raise FileNotFoundError("dependency is unavailable")


class Mono:
    def __init__(self, file_id: int) -> None:
        self.m_Script: Pointer = Pointer(file_id)


class Raw:
    path_id: int = 42


class MonoScriptInfoTest(unittest.TestCase):
    def test_unavailable_external_pointer_is_evidence(self) -> None:
        self.assertEqual(
            mono_script_info(Raw(), Mono(1), {}),
            {"status": "unresolved", "fileId": 1, "pathId": "17"},
        )

    def test_unavailable_local_pointer_is_invalid(self) -> None:
        with self.assertRaises(ReaderError):
            _ = mono_script_info(Raw(), Mono(0), {})


if __name__ == "__main__":
    _ = unittest.main()
