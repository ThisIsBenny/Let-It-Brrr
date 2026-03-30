# Let-It-Brrr Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-30

## Active Technologies
- Deno 2.0.0 + Hono (jsr:@hono/hono@^4.12.9), @std/dotenv (jsr:@std/dotenv@^0.225.6), @std/yaml (jsr:@std/yaml@^1.0.12) (002-docker-compose-service)
- N/A (YAML config file at /app/config/mappings.yaml) (002-docker-compose-service)
- GitHub Actions YAML (workflows) + Docker buildx, GitHub CLI (gh), Deno runtime (003-ci-github-actions)
- GitHub Container Registry (GHCR) for Docker images (003-ci-github-actions)

- Deno 2 + Hono, Deno YAML (js-yaml), standard testing (001-webhook-middleware-mvp)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

# Add commands for Deno 2

## Code Style

Deno 2: Follow standard conventions

## Recent Changes
- 003-ci-github-actions: Added GitHub Actions YAML (workflows) + Docker buildx, GitHub CLI (gh), Deno runtime
- 002-docker-compose-service: Added Deno 2.0.0 + Hono (jsr:@hono/hono@^4.12.9), @std/dotenv (jsr:@std/dotenv@^0.225.6), @std/yaml (jsr:@std/yaml@^1.0.12)

- 001-webhook-middleware-mvp: Added Deno 2 + Hono, Deno YAML (js-yaml), standard testing

<!-- MANUAL ADDITIONS START -->

## How to Create a Release Version

To create a new version tag for release, use the `version-bump.sh` script in `.github/scripts/`:

**Step 1: Determine version type based on your changes:**
- **patch** - Bug fixes (v1.0.0 → v1.0.1)
- **minor** - New features (v1.0.0 → v1.1.0)
- **major** - Breaking changes (v1.0.0 → v2.0.0)

**Step 2: Calculate the next version:**
```bash
.github/scripts/version-bump.sh patch
# Output: v1.0.1
```

**Step 3: Create and push the tag:**
```bash
git checkout main
git pull
NEW_VERSION=$(.github/scripts/version-bump.sh patch)
git tag $NEW_VERSION
git push origin $NEW_VERSION
```

**Step 4: Wait for pipeline to complete:**
The release pipeline will automatically:
1. Run lint and tests
2. Build multi-arch Docker image (amd64, arm64)
3. Publish to GitHub Container Registry (GHCR)

**Step 5: Create the GitHub release (after pipeline succeeds):**

First, check the diff to the latest version:
```bash
git log --oneline --ancestry-path <previous-version>..main
```

Then create the release with all changes included:
```bash
gh release create $NEW_VERSION --title "Release $NEW_VERSION" --notes '## Bug Fixes

- Fixed: Description of bug fix

## Features

- Added: Description of new feature

## Changelog

- [Full Changelog](https://github.com/ThisIsBenny/Let-It-Brrr/compare/<previous-version>...$NEW_VERSION)' --target main
```

**Note**: Do NOT use `--generate-notes` - it does not produce useful release notes. Always check the diff to the latest version first, then write release notes manually with categories: Bug Fixes, Features, Breaking Changes (at top), Chores.

**Important**: You (the release manager) decide what version type to create based on the changes in that release. The agent cannot decide this for you - you must specify when and what type of version should be created!

<!-- MANUAL ADDITIONS END -->
