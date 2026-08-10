# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Security

- Require npm releases to match a locally built SHA-256 recorded in an SSH-signed release commit before trusted publishing can stage the package.
- Avoid requesting GitHub artifact attestations or npm provenance, which are unsupported while the source repository is private.
