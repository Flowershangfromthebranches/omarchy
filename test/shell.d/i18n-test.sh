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

# 8. Literal-safe interpolation: & in dynamic value must not corrupt or backreference
res=$(OMARCHY_UI_LANGUAGE=zh_CN bash "$I18N_BIN" "Transcoded to %1 %2" "A&B" "50%")
[[ "$res" == "已转码为 A&B 50%" ]] || { echo "Failed: expected 已转码为 A&B 50%, got $res"; exit 1; }

# 9. Literal-safe interpolation: backslashes, percent, file paths, metacharacters
res=$(OMARCHY_UI_LANGUAGE=en bash "$I18N_BIN" "%1 to %2 (%3)" "A&B" 'foo\bar' "100%")
[[ "$res" == 'A&B to foo\bar (100%)' ]] || { echo "Failed: expected A&B to foo\\bar (100%), got $res"; exit 1; }

res=$(OMARCHY_UI_LANGUAGE=en bash "$I18N_BIN" "Saved to %1" "Saved to %1" "/home/user/A&B/file.txt")
[[ "$res" == "Saved to /home/user/A&B/file.txt" ]] || { echo "Failed: expected /home/user/A&B/file.txt, got $res"; exit 1; }

# 10. Single-pass non-reentrant interpolation (%2 inside arg 1 must NOT expand)
res=$(OMARCHY_UI_LANGUAGE=en bash "$I18N_BIN" "%1 and %2" "%2" "final")
[[ "$res" == "%2 and final" ]] || { echo "Failed: expected '%2 and final', got $res"; exit 1; }

# 11. Metacharacters and command substitutions must remain inert literals
metachars='$(whoami) `date` $HOME * ? [ ] ; | > < ( ) '\'' "'
res=$(OMARCHY_UI_LANGUAGE=en bash "$I18N_BIN" "Value: %1" "$metachars")
[[ "$res" == "Value: $metachars" ]] || { echo "Failed: expected literal metacharacters, got $res"; exit 1; }

# 12. Cross-runtime locale resolution parity (QML Model.localeCandidates vs Shell omarchy-i18n)
parity_cases=(
  "OMARCHY_UI_LANGUAGE=en:en"
  "OMARCHY_UI_LANGUAGE=en_US:en"
  "OMARCHY_UI_LANGUAGE=zh_CN:zh_CN"
  "OMARCHY_UI_LANGUAGE=zh-CN:zh_CN"
  "OMARCHY_UI_LANGUAGE=zh_cn:zh_CN"
  "OMARCHY_UI_LANGUAGE=zh_SG:zh_CN"
  "OMARCHY_UI_LANGUAGE=zh-sg:zh_CN"
  "OMARCHY_UI_LANGUAGE=zh_Hans:zh_CN"
  "OMARCHY_UI_LANGUAGE=zh-hans:zh_CN"
  "OMARCHY_UI_LANGUAGE=zh_Hans_CN:zh_CN"
  "OMARCHY_UI_LANGUAGE=zh_TW:en"
  "OMARCHY_UI_LANGUAGE=zh-Hant:en"
  "OMARCHY_UI_LANGUAGE=zh_HK:en"
  "LANG=C:en"
  "LANG=POSIX:en"
  "LANGUAGE=fr:zh_CN:zh_CN"
  "LANGUAGE=zh_TW:zh_CN:zh_CN"
  "LANGUAGE=fr:en:en"
  "LANG=zh_CN.UTF-8:zh_CN"
  "LC_MESSAGES=zh_SG.UTF-8:zh_CN"
)

for test_case in "${parity_cases[@]}"; do
  env_var="${test_case%:*}"
  expected_target="${test_case##*:}"
  var_name="${env_var%%=*}"
  var_val="${env_var#*=}"

  res=$(env -i PATH="$PATH" OMARCHY_PATH="$OMARCHY_PATH" "$var_name"="$var_val" bash "$I18N_BIN" "Pending Omarchy Migrations")
  if [[ $expected_target == "zh_CN" ]]; then
    expected_str="Omarchy 有待处理的迁移"
  else
    expected_str="Pending Omarchy Migrations"
  fi
  [[ "$res" == "$expected_str" ]] || {
    echo "Locale parity failed for $env_var: expected '$expected_str', got '$res'"
    exit 1
  }
done

echo "ok - omarchy-i18n shell command test passed"
