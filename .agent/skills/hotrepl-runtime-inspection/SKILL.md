---
name: hotrepl-runtime-inspection
description: Inspect or control Afallon through HotRepl in the CrossOver Steam bottle. Use when launching the instrumented game, running probes, extracting game data, visiting scenes, or shutting down the runtime.
---

# Afallon HotRepl runtime inspection

## Use the configured runtime

Read the selected configuration under ignored `local/` before launch. Use its `gamePath`, `hotreplUrl`, `character`, and scene restoration fields. Confirm the installed build against the selection in [EXPLORATION.md](../../../EXPLORATION.md#build-and-installation).

Do not assume a port. Afallon and another instrumented game can use different ports. A connection to the wrong game can return valid HotRepl data.

Use repository-owned `scan` or `capture` for durable runtime work. Each operation verifies the local installation and the connected product before it claims ownership. See `packages/runtime/src/runtime.ts` and [Runtime access](../../../EXPLORATION.md#runtime-access).

## Launch through CrossOver

Steam must be running and signed in inside the `Steam` bottle.

Start a supervised process named `afallon-game` with these fields:

- Application: `/Applications/CrossOver.app/Contents/SharedSupport/CrossOver/bin/wine`
- Working directory: the configured `gamePath`
- `CX_BOTTLE`: `Steam`
- `WINEPREFIX`: `/Users/glockyco/Library/Application Support/CrossOver/Bottles/Steam`
- `DOTNET_ROOT`: `C:\Program Files\dotnet`
- `WINEDLLOVERRIDES`: `version=n,b`

Pass `cmd.exe` these arguments:

```text
/d
/c
set HOTREPL_PORT=<configured-port>&&Afallon.exe
```

Set the port inside `cmd.exe`. An existing Wine server can prevent a new Unix environment value from reaching the Windows child process. Check TCP readiness on the configured port without taking the only WebSocket client.

The first launch after an update can regenerate IL2CPP interop assemblies and exit. Wait for that process to exit. Relaunch only after the old listener releases its port.

## Prepare the game state

Select the configured research character through the main menu. Confirm that its loaded scene is usable before extraction. `AtlasSurvey` is the capture character in ignored `local/config-capture-current.json` in the main checkout. Read the configuration instead of assuming its current restoration scene.

Do not use a character saved inside a challenge-stone instance for traversal. Such a save can remain behind the loading screen and prevent clean scene visits.

Author scan arrivals from transitions discovered in the accepted catalog with `tools/update/author-scan-arrivals.ts`. Each visit records its selected doorway ID. A scene with no discovered doorway uses its authored start. Saved scene positions can be stale in build 25434619. See [Scenes and arrivals](../../../EXPLORATION.md#scenes-and-arrivals).

Visit streamed sources before collecting a scene that requires them. A distant `ChunkHider` can make a loader inactive. The stream visit uses `HoldPosition` and disposes its hold on restoration. See [Scenes and arrivals](../../../EXPLORATION.md#scenes-and-arrivals) and `packages/scan/src/probes/stream-visit/support.csx`.

## Run one client at a time

HotRepl accepts one WebSocket client. A new client disconnects the current one, including a client that requests only a handshake. Do not start a second client while `scan`, `capture`, or an owned research probe uses the connection.

Repository runtime operations take an exclusive SQLite lock at `~/.cache/afallon-compendium/runtime-owner.sqlite`. The native owner also binds cleanup to connection loss. This coordination cannot stop an arbitrary raw HotRepl client from replacing the connection. Evidence: `packages/runtime/src/runtime.ts:31-109,150-159`.

Use repository commands for durable work:

```sh
bun run compendium scan --config local/<config>.json --plan local/<scan-plan>.json
bun run compendium capture --config local/<config>.json --plan local/<capture-plan>.json
```

Keep exploratory probes and outputs under ignored `local/` or `research/`. Use the owned `withRuntime` and `Runtime.evaluate` APIs for a research probe. Do not run a raw client while an owned operation is active. `tools/probes/native-methods.csx` and [Native analysis](../native-analysis/SKILL.md) show the address-discovery case.

Register frame cleanup before a temporary change in the current evaluation. Register runtime or deferred cleanup before resources or state survive an evaluation. Unregister only after explicit restoration. Deferred callbacks run in reverse registration order and remain pending until restoration settles. Evidence: `packages/runtime/src/runtime.ts:242-305`, `packages/runtime/src/probes/runtime-owner.csx`.

## Capture and cleanup receipts

Use a reviewed capture plan. Do not treat a PNG, a `MapZone` texture, or an inactive loader as proof of complete imagery. Wait for source readiness, stable frame evidence, visual restoration, and stream cleanup. The world-surface readiness limit is 900,000 ms in `packages/capture/src/capture-planner.ts`. See [Map imagery and capture](../../../EXPLORATION.md#map-imagery-and-capture).

Call `runtime.complete()` before publishing the result of an owned research operation. The operation confirms a `clean` native receipt with no errors or remaining callbacks. Failed or missing receipts do not permit reuse of the affected state. Do not clear an unknown failed-owner record to force a new claim. Evidence: `packages/runtime/src/runtime.ts:191-239` and `packages/runtime/src/probes/runtime-owner.csx`.

On cancellation or socket loss, wait for cleanup confirmation. The host deadline does not turn pending native work into clean restoration. Verify the receipt and process state before another visit. A slow scene restoration is not an empty scene.

## Shut down cleanly

Call `UnityEngine.Application.Quit()` through the owned HotRepl connection. A disconnect during this call can prevent the repository runtime from confirming cleanup.

Wait for the supervised game process to exit. Confirm that the configured port no longer listens before relaunch. If Steam launched a second Afallon process, identify its Windows process ID with `tasklist.exe`. Stop only that verified process with `taskkill.exe`. Do not use an unverified host PID.

The game can end without a clean receipt after a forced exit. Preserve the failed run evidence and inspect the configured output root's `.runtime/` receipts before another mutation. See [Runtime access](../../../EXPLORATION.md#runtime-access) and `packages/runtime/src/runtime.ts`.
