---
name: hotrepl-runtime-inspection
description: Inspect or control Afallon through HotRepl in the CrossOver Steam bottle. Use when launching the instrumented game, running probes, extracting game data, visiting scenes, or shutting down the runtime.
---

# Afallon HotRepl runtime inspection

## Use the configured runtime

Read the selected file under `local/` before launch. Use its `gamePath`, `hotreplUrl`, `character`, and scene restoration fields.

Do not assume a port. Afallon and another instrumented game can use different ports. A connection to the wrong game can return valid HotRepl data.

Use only `scan` or `capture` for durable runtime work. Each command validates the local installation identity and verifies that the connected product is Afallon before it claims runtime ownership.

## Launch through CrossOver

Steam must be running and signed in inside the `Steam` bottle.

Use the supervised process name `afallon-game`. Set these process fields:

- Application: `/Applications/CrossOver.app/Contents/SharedSupport/CrossOver/bin/wine`
- Working directory: the configured `gamePath`
- `CX_BOTTLE`: `Steam`
- `WINEPREFIX`: `/Users/glockyco/Library/Application Support/CrossOver/Bottles/Steam`
- `DOTNET_ROOT`: `C:\Program Files\dotnet`
- `WINEDLLOVERRIDES`: `version=n,b`

Start `cmd.exe` with these arguments:

```text
/d
/c
set HOTREPL_PORT=<configured-port>&&Afallon.exe
```

Set the port inside `cmd.exe`. An existing Wine server can prevent a new Unix environment value from reaching the Windows child process.

Use the configured port as the readiness check. A TCP check can establish listener ownership without taking the single WebSocket client.

The first launch after an Afallon update can regenerate IL2CPP interop assemblies and exit. Wait for that process to exit. Relaunch only after the old listener is gone.

## Prepare the game state

Select the configured research character through the main menu. Confirm that the loaded scene is usable before extraction.

Do not use a character saved inside a challenge-stone instance for scene traversal. Such a save can remain behind the loading screen and prevent clean scene visits.

`AtlasSurvey` is the current capture character. Its restoration target is Coalway woods in `local/config-capture-current.json`.

## Run one client at a time

HotRepl accepts one WebSocket client. A new client disconnects the current client, including one that only requests a handshake.

Do not run another HotRepl client while `scan` or `capture` owns the connection.

Use repository commands for durable work:

```sh
bun run compendium scan --config local/<config>.json --plan local/<scan-plan>.json
bun run compendium capture --config local/<config>.json --plan local/<capture-plan>.json
```

Keep exploratory probes under ignored `local/` or `research/`. Move a proven collector into `packages/scan/src/probes/` or `packages/capture/src/probes/` and register its TypeBox contract in `packages/contracts` before publication uses it.

## Shut down cleanly

Call `UnityEngine.Application.Quit()` through the owned HotRepl connection. A disconnect during this call can prevent the repository runtime from confirming cleanup.

Wait for the supervised process to exit. Confirm that the configured port no longer listens before relaunch.

If Steam launched a second Afallon process, identify its Windows process ID with `tasklist.exe`. Stop that verified process with `taskkill.exe`. Do not use an unverified host PID.

## Evidence

- `EXPLORATION.md:158-171` records the installed MelonLoader and HotRepl host, launch environment, and successful handshake.
- `EXPLORATION.md:224-246` records the clean shutdown and retained research character.
- `EXPLORATION.md:806-817` records connection ownership and cleanup behavior.
- `EXPLORATION.md:837-839` records per-game port isolation and wrong-game rejection.
- `EXPLORATION.md:909-940` records challenge-stone save and stale-listener failures.
- `packages/runtime/src/runtime.ts` implements the configured HotRepl connection and ownership cleanup.
- `apps/compendium-cli/src/cli.ts` defines the supported repository commands.
