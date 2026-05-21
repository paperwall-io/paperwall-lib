# Paperwall Lib

Core SDK published as the `paperwall` npm package. Runs in the browser on publisher sites.

## Stack

- **Runtime:** Bun (build tooling)
- **Output:** Browser-compatible bundle in `dist/`

## API

- Main export: `initPaperwall(config: WallConfig)`
- State machine: `WallState` enum — `LOADING` → `SHOW_WALL` | `SHOW_ARTICLE` | `NO_WALL`
- `WallStore` is the global state container

## Testing

- Unit tests: `bun test`
- CI workflows: `run-tests.yaml` and `test-prerelease.yaml`
- Both workflows use the shared harness (download tarball, start API + DB)
- Workflows include "Show service logs" step with `if: failure()` for CI debugging

## CI Notes

- Contract tests (Pact) are being migrated to integration tests
- Pre-release testing verifies against a pre-release API image before publishing
