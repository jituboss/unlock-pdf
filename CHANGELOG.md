# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

The release pipeline publishes each version's section below as its GitHub
release notes, so add a `## [x.y.z] - YYYY-MM-DD` section before tagging.

## [1.2.0] - 2026-11-12

First version published to Docker Hub by the release pipeline. It includes
all the 1.1.0 changes below.

### Fixed
- Release pipeline: the workflow lint failed on an unused loop variable (ShellCheck SC2034).
- Release pipeline: the smoke test now runs the server on its own port and checks
  that it is talking to this app before testing unlocks.

### Added
- `PORT` environment variable (default `3000`).
- qpdf's error output is logged when an unlock fails, which shows why (passwords are never logged).
- GitHub releases use this changelog for their notes.

## [1.1.0] - 2026-11-12

Tagged but never published: the release pipeline failed its checks. Use 1.2.0.

### Security
- Fixed command injection: the password and filename were passed through a shell
  to `qpdf`, so anyone could run commands on the server. `qpdf` is now invoked
  without a shell.
- Unlocked files get random server-generated names; the uploaded filename is only
  used, sanitized, as the download name.
- Uploads limited to a single PDF of up to 50 MB.
- Passwords are no longer written to the server log.
- The container runs as a non-root user.
- Removed a user-uploaded PDF that had been committed to the repository.

### Changed
- Upgraded Express 4.18.2 → 5.3.0 and multer 1.4.4 → 2.5.0 (fixes known vulnerabilities).
- Docker image based on `node:24-slim` (Node 20 is end of life), installed from the lockfile.
- Multi-arch image (amd64 + arm64).
- A request with no file returns 400, and a wrong password returns 422 instead of 500.
- Temp files are deleted when unlocking fails.

### Removed
- The `./uploads` volume from `docker-compose.yml`. Remove it from your own compose
  file too: the non-root container can't write to it.

### Added
- GitHub Actions release pipeline: checks on every push and pull request, and
  publishes to Docker Hub on a `v*` tag.

## [1.0.0] - 2025-09-28

### Added
- Web UI to upload a password-protected PDF and download the unlocked copy.
- An empty password returns the original file.
- Docker image and Docker Compose setup.
