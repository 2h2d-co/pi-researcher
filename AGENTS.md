# pi-researcher Project Instructions

pi-researcher is a Pi package for web search, content retrieval, and research-oriented workflows.

## Conventions

- Format commit messages according to [Conventional Commits](https://www.conventionalcommits.org/).
- Maintain `CHANGELOG.md` using the [Keep a Changelog](https://keepachangelog.com/) style.
- Add changelog entries for changes whose commit would be `feat:` or `fix:`; keep entries under `Unreleased` until a release is made.
- Release commits should do the following:
  - update the package version;
  - keep changelog entries under `Unreleased` for prereleases and move them into a release section only for stable releases;
  - use `npm run release -- X.Y.Z` to build the package locally, create an SSH-signed `release: vX.Y.Z` commit containing its `Npm-Artifact-SHA256` trailer, verify a clean rebuild, and create the matching lightweight tag;
  - push the release commit and tag atomically; do not use `git tag -a`, `git tag -s`, `git tag -m`, or `cog bump --annotated`.
  - The tag workflow creates the immutable GitHub release from the verified archive and the version's changelog section. Never create GitHub releases by hand.

## Pi compatibility and validation

- Support only the Pi release the extension is developed and validated against. Keep the exact minimum in the peer range, `MINIMUM_PI_VERSION`, the load-time error, the README, and the tests.
- Run `mise run check` before committing. It runs `npm run check`, `npm test`, and `npm run pack:dry`.
- The release script must run `npm run test:live` against its exact candidate archive before signing. A missing prerequisite or a failed live test blocks the commit and tag. Cover release orchestration offline in `test/release.test.ts` with mocked child processes; never run the real release script in tests.
