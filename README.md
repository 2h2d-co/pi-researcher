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

Release flow:

1. Run `npm run release -- X.Y.Z` from a clean, synchronized `main`.
2. The command builds the exact package locally, records its SHA-256 in an SSH-signed release commit, proves a clean rebuild is reproducible, and creates a lightweight tag.
3. Inspect the result, then push atomically with `git push --atomic origin main vX.Y.Z`.
4. A read-only GitHub Actions job validates and packs the package. A separate GitHub-owned job verifies the signature and signed digest before staging that exact archive through npm trusted publishing. Public repositories also persist a GitHub artifact attestation; npm provenance is generated for every staged package.
5. Approve the staged package on npmjs.com, or with `npm stage approve <stage-id>`.

Stable releases use `latest`; prereleases derive their npm dist-tag from the first prerelease identifier.
