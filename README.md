# pi-researcher

Minimal Pi package stub for research-oriented workflows.

Requires Pi `>=1.0.1 <1.1.0`. Releases are validated against Pi 1.0.1. The
extension refuses to load on a Pi older than 1.0.1, because Pi does not enforce
the package's peer range when it installs packages.

**Pi's virtual models are not supported.** Releases are validated only with
physical models. Models registered with `pi.registerVirtualModel()` are untested.

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

The command sends a research-style prompt back into the session so Pi can investigate the topic and summarize findings. Without a topic, it shows usage and sends nothing.

## Local development

Run the complete non-writing validation:

```bash
mise run check
```

It runs the hk quality gate, the offline tests, and a package dry run.

The live test packs the extension, loads the archive into the Pi CLI from
`node_modules`, and sends a real `/research` request to `openai-codex`
`gpt-5.6-luna`. It uses an isolated temporary Pi home and reads the bearer
token from your existing `openai-codex` login:

```bash
mise run test:live
```

Set `PI_PACKAGE_ARCHIVE` to test an existing archive instead of packing the
worktree, or `PI_TEST_CLI_PATH` to the `dist/bundle/cli.js` of another
installation of the same Pi version. The test requires the selected CLI to report
the version of the repository's Pi development dependency.

## Packaging

This package currently publishes these project files explicitly:

- `extensions/`
- `README.md`
- `LICENSE`

Release flow:

1. Run `npm run release -- X.Y.Z` from a clean, synchronized `main`.
2. The command builds the exact package locally, runs `mise run test:live` against that archive, records its SHA-256 in an SSH-signed release commit, proves a clean rebuild is reproducible, and creates a lightweight tag. A failed or unavailable live test stops the release before the commit.
3. Inspect the result, then push atomically with `git push --atomic origin main vX.Y.Z`.
4. A read-only GitHub Actions job validates and packs the package. A separate GitHub-owned job verifies the signature and signed digest before staging that exact archive through npm trusted publishing. That job also creates a GitHub artifact attestation for the archive and its checksum, and npm records provenance for the staged package.
5. A final job creates the immutable GitHub release for the tag from the same verified archive, its
   checksum, and the version's `CHANGELOG.md` section (`Unreleased` for prereleases).
6. Approve the staged package on npmjs.com, or with `npm stage approve <stage-id>`.

Stable releases use `latest`; prereleases derive their npm dist-tag from the first prerelease identifier.
