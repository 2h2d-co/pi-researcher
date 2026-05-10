# pi-researcher

Minimal Pi package stub for research-oriented workflows.

## Included resources

- `extensions/pi-researcher/index.ts` - registers the `/research` command

## Usage

Run Pi with this package installed, then use:

```text
/research <topic>
```

Example:

```text
/research compare Bun and Node.js runtime tradeoffs for CLI tools
```

The command sends a research-style prompt back into the session so Pi can investigate the topic and summarize findings.

## Local development

Typecheck the package:

```bash
npm run check
```

## Packaging

This package currently publishes these project files explicitly:

- `extensions/`
- `README.md`
- `LICENSE`

Release helper:

```bash
npm run release:publish
npm run release:publish -- --execute
```

`npm run release:publish` runs `npm run check` first and defaults to an npm dry-run. Pass `--execute` to perform the real publish.

The publish script derives the npm dist-tag from `package.json` version:

- stable versions like `1.2.3` -> `latest`
- prereleases like `0.0.1-alpha.0` -> `alpha`
- prereleases like `1.0.0-rc.2` -> `rc`
