# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Security

- Require npm releases to match a locally built SHA-256 recorded in an SSH-signed release commit before trusted publishing can stage the package.
- Avoid requesting GitHub artifact attestations or npm provenance, which are unsupported while the source repository is private.
- Updated the Pi development dependency and peer range to 0.84.x, including patched transitive HTTP and glob dependencies.
