# Afallon Compendium

An interactive world map and searchable reference for more than 3,700 locations of the single-player RPG [Afallon](https://store.steampowered.com/app/2597810/Afallon/).

[Open the map](https://afallon.compendiums.org/) · [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3800843227) · [Project page](https://glockyco.com/projects/afallon/)

![Afallon Compendium showing the world map, interior maps, category filters, and search results](assets/afallon-compendium-map.png)

## About

Search and filter bosses, dungeons, merchants, quest givers, resources, and other points of interest across the overworld and interior maps. The Adventure Guide provides dedicated pages for bosses, dungeons, regions, and properties.

The pipeline uses [HotRepl](https://github.com/glockyco/HotRepl), a runtime C# REPL for Unity games, to execute C# evidence probes inside the running game. Repository tooling validates immutable evidence into a canonical SQLite catalog and builds a static publication for the SvelteKit and deck.gl site.

## Development

Development requires [Bun](https://bun.sh/). Install dependencies and run the repository checks from the project root:

```sh
bun install
bun run check
bun run check:dependencies
bun test
bun run build:production
```

The site requires a selected static publication. Stage it from the project root, then start the development server:

```sh
bun run stage:production /path/to/publication-root
bun run dev
```

## Data pipeline

Runtime extraction requires a locally installed copy of Afallon with the HotRepl host loaded. [`config.example.json`](config.example.json) lists the required runtime paths and connection settings.

The workspace exposes one operator CLI:

```sh
bun run compendium scan --config local/config.json --plan local/scan-plan.json
bun run compendium capture --config local/config.json --plan local/capture-plan.json
bun run compendium catalog --store local/store --plan local/catalog-plan.json
bun run compendium publish --store local/store --plan local/publish-plan.json --output local/publication
```

Add `--candidate` to produce a verified result without changing the workflow's selected reference. `scan` and `capture` write immutable, content-addressed evidence. `catalog` validates that evidence into the canonical SQLite source of truth. `publish` queries the catalog and atomically selects a static publication. The atlas loads every map shard together at its reviewed world offset. Game-provided maps are enabled by default; captured terrain is available only when a reader selects it.

Generated artifacts, local configuration, and extracted game assets are not committed.

## Deployment

Preview or deploy a selected publication from the project root:

```sh
bun run stage:production /path/to/publication-root
bun run compendium preview
bun run compendium deploy /path/to/publication-root
```

The deploy command stages the selected immutable publication, builds and validates `apps/site`, deploys Cloudflare Static Assets with Wrangler, and smoke-tests production. Production excludes database access, runtime probes, authoring controls, and development detail panels.

## License

This project is licensed under the [MIT License](LICENSE).

Afallon Compendium is an unofficial fan project and is not affiliated with the developer or publisher of Afallon. Afallon and its related names, artwork, and assets belong to their respective owners.
