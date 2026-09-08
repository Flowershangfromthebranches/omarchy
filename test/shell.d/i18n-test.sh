#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$DIR/../.." && pwd)"

node "$REPO_ROOT/test/shell.d/i18n-runtime-test.js"
echo "ok - i18n runtime test passed"
