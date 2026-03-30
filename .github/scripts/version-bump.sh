#!/bin/bash
set -e

VERSION_TYPE="${1:-patch}"

if [[ ! "$VERSION_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo "Error: VERSION_TYPE must be 'major', 'minor', or 'patch'"
    echo "Usage: $0 <major|minor|patch>"
    exit 1
fi

if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not in a git repository"
    exit 1
fi

CURRENT=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")

if ! [[ "$CURRENT" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Warning: No valid semver tag found. Starting from v0.0.0"
    CURRENT="v0.0.0"
fi

CURRENT=${CURRENT#v}
IFS='.' read -r major minor patch <<< "$CURRENT"

case "$VERSION_TYPE" in
    major)
        major=$((major + 1))
        minor=0
        patch=0
        ;;
    minor)
        minor=$((minor + 1))
        patch=0
        ;;
    patch)
        patch=$((patch + 1))
        ;;
esac

NEW_VERSION="v${major}.${minor}.${patch}"
echo "New version: $NEW_VERSION"

echo "$NEW_VERSION"