
const assert = require("assert")
const fs = require("fs")
const I18nModel = require("../../shell/Commons/I18nModel.js")
const MenuModel = require("../../shell/plugins/menu/MenuModel.js")
const zhCatalog = require("../../localization/zh_CN/translations.json")

console.log("Running comprehensive i18n automated tests...")

// ---------------------------------------------------------------------------
// 1. Locale selection & precedence
console.log("- Test locale selection & fallback...")
assert.strictEqual(I18nModel.normalizeLocale("zh_CN.UTF-8"), "zh_CN")
assert.strictEqual(I18nModel.normalizeLocale("zh-CN"), "zh_CN")
assert.strictEqual(I18nModel.normalizeLocale("zh"), "zh")
assert.strictEqual(I18nModel.normalizeLocale("en_US.UTF-8"), "en_US")
assert.strictEqual(I18nModel.normalizeLocale(""), "")
assert.strictEqual(I18nModel.normalizeLocale("C"), "")
assert.strictEqual(I18nModel.normalizeLocale("POSIX"), "")

// Environment overrides
// OMARCHY_UI_LANGUAGE takes precedence
assert.deepStrictEqual(
  I18nModel.localeCandidates({ OMARCHY_UI_LANGUAGE: "zh_CN", LANG: "en_US.UTF-8" }),
  ["zh_CN", "zh"]
)
assert.deepStrictEqual(
  I18nModel.localeCandidates({ OMARCHY_UI_LANGUAGE: "en", LANG: "zh_CN.UTF-8" }),
  ["en"]
)
assert.deepStrictEqual(
  I18nModel.localeCandidates({ LANGUAGE: "zh_CN:en_US", LANG: "en_US.UTF-8" }),
  ["zh_CN", "zh", "en_US", "en"]
)
assert.deepStrictEqual(
  I18nModel.localeCandidates({ LANG: "en_US.UTF-8" }),
  ["en_US", "en"]
)
// Unknown locale falls back cleanly
assert.deepStrictEqual(
  I18nModel.localeCandidates({ LANG: "xx_YY.UTF-8" }),
  ["xx_YY", "xx"]
)

// ---------------------------------------------------------------------------
// 2. Core translations & Missing translations
console.log("- Test core translations & fallbacks...")
const reg = I18nModel.createRegistry()
reg.registerCatalog("zh_CN", zhCatalog)
const zhCand = ["zh_CN", "zh"]
const enCand = ["en_US", "en"]
const unknownCand = ["xx_YY", "xx"]

const expectedTranslations = {
  "Setup": "设置",
  "Install": "安装",
  "Remove": "卸载",
  "Update": "更新",
  "Network": "网络",
  "Bluetooth": "蓝牙",
  "Audio": "音频",
  "Display": "显示",
  "Monitor": "显示器",
  "Battery": "电池",
  "Power": "电源",
  "Power Profile": "电源模式",
  "Connect": "连接",
  "Disconnect": "断开连接",
  "Pair": "配对",
  "Forget": "忘记",
  "Enable": "启用",
  "Disable": "禁用",
  "Confirm": "确认",
  "Cancel": "取消",
  "Close": "关闭",
  "Search": "搜索",
  "No matches": "没有匹配项",
  "Nothing here yet": "这里还没有内容"
}

for (const [en, zh] of Object.entries(expectedTranslations)) {
  // zh_CN returns Chinese
  assert.strictEqual(reg.translate(en, { candidates: zhCand }), zh, `Expected ${en} -> ${zh}`)
  // en_US returns original English
  assert.strictEqual(reg.translate(en, { candidates: enCand }), en, `Expected English UI for ${en}`)
  // Unknown returns English fallback
  assert.strictEqual(reg.translate(en, { candidates: unknownCand }), en, `Expected fallback for ${en}`)
}

// Missing translation fallback
assert.strictEqual(
  reg.translate("Unseen Future Feature", { candidates: zhCand }),
  "Unseen Future Feature"
)
assert.strictEqual(
  reg.translate("", { candidates: zhCand }),
  ""
)

// ---------------------------------------------------------------------------
// 3. Technical term preservation (Zero translation)
console.log("- Test technical term preservation...")
const technicalTerms = [
  "Omarchy", "Arch Linux", "Arch", "Hyprland", "Quickshell", "Wayland", "XWayland",
  "Codex", "Claude Code", "Gemini CLI", "OpenCode", "Grok", "Copilot", "Hermes", "Crush", "Pi", "Oh My Pi",
  "Git", "GitHub", "GitHub CLI", "Docker", "systemd", "pacman", "AUR", "mise",
  "Neovim", "Vim", "Emacs", "VS Code", "Cursor", "Zed", "Helix",
  "Fcitx", "Fcitx 5", "QEMU", "VirGL", "ANGLE", "Metal",
  "PipeWire", "WirePlumber", "NetworkManager"
]

for (const term of technicalTerms) {
  assert.strictEqual(
    reg.translate(term, { candidates: zhCand }),
    term,
    `Technical term '${term}' must be preserved as-is!`
  )
}

// ---------------------------------------------------------------------------
// 4. Placeholder parity
console.log("- Test placeholder parity...")
assert.strictEqual(
  reg.translate("Connected to %1", { candidates: zhCand, args: ["Office-5G"] }),
  "已连接到 Office-5G"
)
assert.strictEqual(
  reg.translate("Connected to %1", { candidates: enCand, args: ["Office-5G"] }),
  "Connected to Office-5G"
)
// Multivariable test
assert.strictEqual(
  I18nModel.interpolate("Device %1 of %2", ["2", "10"]),
  "Device 2 of 10"
)

// ---------------------------------------------------------------------------
// 5. Menu Search Bilingual Compatibility
console.log("- Test menu bilingual search compatibility...")
const mockI18n = {
  tr: function(k) { return reg.translate(k, { candidates: zhCand }) }
}
const menuJsonc = fs.readFileSync("default/omarchy/omarchy-menu.jsonc", "utf8")
const rawMenuItems = MenuModel.parseMenuJsonc(menuJsonc, mockI18n)
const merged = MenuModel.mergeMenuSources(rawMenuItems, [])
const menuMap = merged.items

// Setup test
const setup = menuMap["setup"]
assert(setup, "setup menu item must exist")
assert.strictEqual(setup.label, "设置")
assert(setup.aliases.includes("Setup"), "Original English 'Setup' must be preserved in aliases")
assert(setup.aliases.includes("settings"), "Pre-existing alias 'settings' must be preserved")

// Search Setup
const sZh = MenuModel.searchScore(menuMap, setup, "设置")
const sEn = MenuModel.searchScore(menuMap, setup, "Setup")
const sAlias = MenuModel.searchScore(menuMap, setup, "settings")
assert(!isNaN(sZh) && sZh < 80000, "Should match '设置'")
assert(!isNaN(sEn) && sEn < 80000, "Should match 'Setup'")
assert(!isNaN(sAlias) && sAlias < 80000, "Should match 'settings'")

// Install test
const install = menuMap["install"]
assert(install, "install menu item must exist")
assert.strictEqual(install.label, "安装")
assert(install.aliases.includes("Install"))

console.log("All 5 i18n test suites passed completely!");
