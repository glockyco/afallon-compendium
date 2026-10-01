---
name: game-update
description: Update the compendium to a new Afallon Steam build, from Steam install through scans, catalog, publication, and accept-update. Use when the game has a new patch or when a step of an update fails.
---

# Afallon game update

An update turns a new Steam build into an accepted catalog and publication. Each step writes immutable, content-addressed evidence, and later steps cite earlier runs by run ID. Work through the steps in order and record every run ID in the update's OpenSpec change (`openspec/changes/update-game-<version>/tasks.md`) as you go. The report at the end needs them.

## Before you start

- Run the CLI from the main checkout. It holds the ignored `artifacts/`, `local/`, `research/`, and `.recovered/`. Code changes go to the working branch; fast-forward the main checkout before you run changed code.
- Start from a clean state: no unaccepted candidate and no open data change. An update compares against the accepted build in `artifacts/accepted-build.json`.
- Read the release notes first. Save the Steam news item as JSON: `curl -s 'https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=2597810&count=5&maxlength=0&format=json'`, then select the item by title. Name the risk areas that the notes give. The update report must classify each of them, and only them.
- Use a new file name for every authored input. Never overwrite an input, a report, or research evidence.
- Use a configuration with every field of `config.example.json`. `local/config.json` can be stale; check before use. Its `mapSpaceProfile` names one build's profile: scans ignore it, but captures fail with "The spatial profile belongs to another game build" until a copy of the configuration names the new build's profile (step 4).

## 1. Install the build

1. Close the game. End the CrossOver session of the Steam bottle: kill every process whose open files are under `Bottles/Steam` (`lsof -p <pid>`), including old `services.exe`, `winedevice.exe`, and `wineserver` processes. Orphaned sessions survive for weeks and make a new Steam client hang without writing a log line.
2. `bun run compendium update --config <config> --version <release>`. It starts Steam, requests a validation of app 2597810, and waits for the scheduler result and a fully installed manifest (`StateFlags` 4). It registers the Steam log ranges as an update receipt run.
3. If it fails with "Steam did not become ready", Steam wrote no logon line. Repeat step 1; do not raise the timeout.

## 2. Compare declarations

1. Get the pinned Cpp2IL (`CPP2IL_VERSION` in `apps/compendium-cli/src/recover.ts`). The current pin is the `Cpp2IL-net9-osx-arm64` artifact of Cpp2IL Actions run 33818570909 (run number 1736), downloadable through `https://nightly.link/SamboyCoding/Cpp2IL/actions/runs/33818570909/Cpp2IL-net9-osx-arm64.zip` until 2026-12-02. Keep the copy under `local/tools/`.
2. `bun run compendium recover --config <config> --cpp2il <binary>` writes `.recovered/steam-<build>-<metadata>` and keeps the previous snapshot.
3. `bun tools/update/compare-declarations.ts <previous> <current> <domains.json> <output>`. Run it once with `{}` as domains, read the member changes, then write the reviewed domain classifications and run it again to a new output.
4. Register the snapshot receipt (`--schema compendium.cpp2il-snapshot-receipt.v1`), the comparison, and the release notes with `bun run compendium register --store artifacts --build <build> --file <file>`.

The comparison tells you which collectors and decoders can break. Fix those before scanning.

## 3. Scan

1. Copy the accepted build's scan plans (`local/scan-<build>-shard-*.json` and the dungeon and stream plans) to new names. Plans use `compendium.scan-plan.v2`. Add one plan with the canonical scene alone (`build-scene:44`) and `"artworkTarget": "build-scene:44"`; the catalog reads canonical facts and artwork only from that target. The shard plans name no artwork target. Run `tools/update/author-scan-arrivals.ts <accepted catalog.sqlite> <plans...>`; it rewrites the given plans in place.
2. `tools/update/load-character.ts <config>` loads the research character. Run `bun run compendium scan --config <config> --plan <plan> --candidate` for each plan, one at a time. Read each outcome; a failed target is not a gap to skip. A scene target takes about a minute; the artwork target takes about two more.
3. `tools/update/check-scan-arrivals.ts` checks the arrivals that the scans used. `tools/update/quit-game.ts <config>` ends the game.
4. New scenes need new plan targets. Compare the scene list of the new scans with the accepted catalog.

Time the steps from the run manifests (`timestamps`) and, inside a scan, from the write times of the `targets/NNN/*.context.json` objects. A step that grows with each target of a run points to a cost that scales with the run's size.

## 4. Map spaces and imagery

1. `author-map-profile.ts` and `verify-map-profile.ts` author and check the map-space profile. Register it.
2. `sweep-map-zones.ts`, `author-game-map-plans.ts`, then `bun run compendium game-map` produce the game maps. `extract-overworld-texture.py` needs `UnityPy` (`uv run --with UnityPy`); `author-overworld-plan.ts` uses its image.
3. `author-capture-plans.ts` re-authors the reviewed terrain plans, `capture-plans.ts` captures each plan in its own sweep, and `bun run compendium pyramid` builds the tiles. The twelve world-surface plans of build 25434619 captured in about 10 minutes; run them in the background and record each run.

## 5. Catalog

1. Copy the accepted coverage policy to the new build id and register it (`--schema compendium.coverage-policy.v1`): the review references the policy object, and the catalog fails with ENOENT on that object when it is not registered. `author-bootstrap-review.ts` writes the open review from the policy. Register the review (`--schema compendium.coverage-review.v1`), author the plan with `author-catalog-plan.ts` (`--canonical-scan` is the run of the artwork plan, `--canonical-target build-scene:44`), and run `bun run compendium catalog --store artifacts --plan <plan> --candidate`.
2. `author-coverage-review.ts` writes the complete review from that catalog. Register it and build the final catalog.
3. The plan names the reviewed mechanics rules. Rules cite evidence of one build; review each rule against the new build and register a new rules record for it.
4. `compare-catalogs.ts <accepted> <candidate>` lists what changed. Explain every removal before you publish.

## 6. Publish and check

1. Register the reviewed presentation (world offsets, bounds, exclusions) for the new build. Its `catalogId` must match the catalog, or publish fails with "Static resource catalog mismatch".
2. `bun run compendium publish --store artifacts --output <root> --plan <plan> --candidate`, then write `<root>/selected.json` for the new publication.
3. `bun run stage:production <root> <accepted publication directory> --verified-update` in every checkout whose development server is used, including the main checkout: staging writes into the `apps/site` of the checkout that runs it. Check the dev site in a browser at 1440 and 390 px: map, search, each entity kind, relations, artwork, coverage, and every risk area of the notes.

## 7. Accept

1. Author the update report (`compendium.update-report.v2`, contract in `packages/contracts/src/update-report.ts`). The previous reports and their author scripts under `local/` show the shape. Every pointer must be a run of the new build.
2. Copy the candidate directory into the accepted publication root (the root whose `selected.json` names the accepted publication): `/bin/cp -cR <root>/publications/<id> <accepted root>/publications/`.
3. Accepting needs the owner's approval. Then run `bun run compendium accept-update --store artifacts --report <report> --publication-root <accepted root> --baseline-root <accepted publication directory> --expected <sha256 of artifacts/accepted-build.json>`.
4. Record the build facts in `EXPLORATION.md`, archive the update change, and fast-forward the main checkout.
