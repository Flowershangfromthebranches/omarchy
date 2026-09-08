#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$DIR/../.." && pwd)"

node "$REPO_ROOT/test/shell.d/i18n-runtime-test.js"
echo "ok - i18n runtime test passed"

echo "Testing omarchy-i18n shell command..."
I18N_BIN="$REPO_ROOT/bin/omarchy-i18n"
export OMARCHY_PATH="$REPO_ROOT"

# 1. Simplified Chinese translation
res=$(OMARCHY_UI_LANGUAGE=zh_CN bash "$I18N_BIN" "No QR code found")
[[ "$res" == "未找到二维码" ]] || { echo "Failed: expected 未找到二维码, got $res"; exit 1; }

# 2. Placeholder interpolation (2-arg form)
res=$(OMARCHY_UI_LANGUAGE=zh_CN bash "$I18N_BIN" "Battery is down to %1%" "20")
[[ "$res" == "电池电量已降至 20%" ]] || { echo "Failed: expected 电池电量已降至 20%, got $res"; exit 1; }

# 3. Placeholder interpolation (3-arg form)
res=$(OMARCHY_UI_LANGUAGE=zh_CN bash "$I18N_BIN" "Battery is down to %1%" "Battery is down to %1%" "20")
[[ "$res" == "电池电量已降至 20%" ]] || { echo "Failed: expected 电池电量已降至 20%, got $res"; exit 1; }

# 4. zh_SG alias
res=$(OMARCHY_UI_LANGUAGE=zh_SG bash "$I18N_BIN" "Battery is down to %1%" "20")
[[ "$res" == "电池电量已降至 20%" ]] || { echo "Failed: expected 电池电量已降至 20%, got $res"; exit 1; }

# 5. zh_TW isolation (must fallback to English)
res=$(OMARCHY_UI_LANGUAGE=zh_TW bash "$I18N_BIN" "Battery is down to %1%" "Battery is down to %1%" "20")
[[ "$res" == "Battery is down to 20%" ]] || { echo "Failed: expected Battery is down to 20%, got $res"; exit 1; }

# 6. en_US fallback
res=$(OMARCHY_UI_LANGUAGE=en_US bash "$I18N_BIN" "Battery is down to %1%" "Battery is down to %1%" "20")
[[ "$res" == "Battery is down to 20%" ]] || { echo "Failed: expected Battery is down to 20%, got $res"; exit 1; }

# 7. Migration pending notification
res=$(OMARCHY_UI_LANGUAGE=zh_CN bash "$I18N_BIN" "Pending Omarchy Migrations")
[[ "$res" == "Omarchy 有待处理的迁移" ]] || { echo "Failed: expected Omarchy 有待处理的迁移, got $res"; exit 1; }

echo "ok - omarchy-i18n shell command test passed"
