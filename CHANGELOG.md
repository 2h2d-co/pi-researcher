# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Security

- Require npm releases to match a locally built SHA-256 recorded in an SSH-signed release commit before trusted publishing can stage the package.
- Retain npm provenance while skipping GitHub artifact-attestation persistence when the repository's private plan does not support it.
