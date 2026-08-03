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

Run the repository-wide quality gate:

```bash
npm run check
```

## Packaging

This package currently publishes these project files explicitly:

- `extensions/`
- `README.md`
- `LICENSE`

Stable and prerelease `v<version>` tags trigger the shared CI release flow. CI validates and tests the release before staging it on npm with provenance. Stable versions use `latest`; prereleases derive their npm dist-tag from the first prerelease identifier. Release tags must be lightweight tags. Create one with `git tag v<version>`; do not use `git tag -a`, `git tag -s`, `git tag -m`, or `cog bump --annotated`.
