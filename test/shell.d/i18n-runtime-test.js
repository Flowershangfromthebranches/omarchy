const assert = require("assert")
const fs = require("fs")
const path = require("path")
const I18nModel = require("../../shell/Commons/I18nModel.js")
const MenuModel = require("../../shell/plugins/menu/MenuModel.js")
const zhCatalog = require("../../shell/Commons/i18n/zh_CN.js")

console.log("Running comprehensive i18n automated tests...")

// ---------------------------------------------------------------------------
// 1. Locale selection, candidate resolution, and isolation
console.log("- Test locale selection & fallback isolation...")
assert.strictEqual(I18nModel.normalizeLocale("zh_CN.UTF-8"), "zh_CN")
assert.strictEqual(I18nModel.normalizeLocale("zh-CN"), "zh_CN")
assert.strictEqual(I18nModel.normalizeLocale("zh_SG.UTF-8"), "zh_SG")
assert.strictEqual(I18nModel.normalizeLocale("zh-SG"), "zh_SG")
assert.strictEqual(I18nModel.normalizeLocale("zh_Hans"), "zh_Hans")
assert.strictEqual(I18nModel.normalizeLocale("zh-Hans"), "zh_Hans")
assert.strictEqual(I18nModel.normalizeLocale("zh_Hans_CN"), "zh_Hans_CN")
assert.strictEqual(I18nModel.normalizeLocale("zh_TW.UTF-8"), "zh_TW")
assert.strictEqual(I18nModel.normalizeLocale("zh-TW"), "zh_TW")
assert.strictEqual(I18nModel.normalizeLocale("zh_HK"), "zh_HK")
assert.strictEqual(I18nModel.normalizeLocale("zh_MO"), "zh_MO")
assert.strictEqual(I18nModel.normalizeLocale("zh_Hant"), "zh_Hant")
assert.strictEqual(I18nModel.normalizeLocale("zh-Hant"), "zh_Hant")
assert.strictEqual(I18nModel.normalizeLocale("zh"), "zh")
assert.strictEqual(I18nModel.normalizeLocale("en_US.UTF-8"), "en_US")
assert.strictEqual(I18nModel.normalizeLocale(""), "")
assert.strictEqual(I18nModel.normalizeLocale("C"), "")
assert.strictEqual(I18nModel.normalizeLocale("POSIX"), "")

// Candidate generation
assert.deepStrictEqual(
  I18nModel.localeCandidates({ OMARCHY_UI_LANGUAGE: "zh_CN", LANG: "en_US.UTF-8" }),
  ["zh_CN", "zh"]
)
assert.deepStrictEqual(
  I18nModel.localeCandidates({ OMARCHY_UI_LANGUAGE: "zh_Hans_CN" }),
  ["zh_Hans_CN", "zh_Hans", "zh_CN", "zh"]
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
assert.deepStrictEqual(
  I18nModel.localeCandidates({ LANG: "xx_YY.UTF-8" }),
  ["xx_YY", "xx"]
)

// Registry setup matching I18n.qml behavior
const reg = I18nModel.createRegistry()
reg.registerCatalog("zh_CN", zhCatalog, ["zh_SG", "zh_Hans"])

// Verify registerCatalog does NOT register bare 'zh'
assert.strictEqual(reg.catalogs["zh"], undefined, "catalogs.zh must NOT be registered")
assert(reg.catalogs["zh_CN"], "catalogs.zh_CN must be registered")
assert(reg.catalogs["zh_SG"], "catalogs.zh_SG must be registered as alias")
assert(reg.catalogs["zh_Hans"], "catalogs.zh_Hans must be registered as alias")

// Locale isolation testing
const isolationLocales = {
  // Simplified Chinese locales: MUST resolve to Chinese
  "zh_CN": true,
  "zh-CN": true,
  "zh_SG": true,
  "zh-SG": true,
  "zh_Hans": true,
  "zh-Hans": true,
  "zh_Hans_CN": true,
  // Traditional Chinese locales: MUST fall back to English, NEVER hit Simplified Chinese
  "zh_TW": false,
  "zh-TW": false,
  "zh_HK": false,
  "zh-HK": false,
  "zh_MO": false,
  "zh-MO": false,
  "zh_Hant": false,
  "zh-Hant": false,
  "zh_Hant_TW": false,
  "zh_Hant_HK": false,
  // English / other
  "en_US": false,
  "en": false,
  "ja_JP": false
}

for (const [loc, shouldHitSimplified] of Object.entries(isolationLocales)) {
  const cands = I18nModel.localeCandidates({ OMARCHY_UI_LANGUAGE: loc })
  const result = reg.translate("Network", { candidates: cands })
  if (shouldHitSimplified) {
    assert.strictEqual(result, "网络", `Locale '${loc}' should resolve to Simplified Chinese ('网络')`)
  } else {
    assert.strictEqual(result, "Network", `Locale '${loc}' must fall back to English ('Network')`)
  }
}

// ---------------------------------------------------------------------------
// 2. Context translation & Fallbacks
console.log("- Test context translations & fallbacks...")
const zhCand = ["zh_CN", "zh"]
const enCand = ["en_US", "en"]
const unknownCand = ["xx_YY", "xx"]

assert.strictEqual(reg.translate("Remove", { context: "menu:remove", candidates: zhCand }), "卸载")
assert.strictEqual(reg.translate("Remove", { context: "software", candidates: zhCand }), "卸载")
assert.strictEqual(reg.translate("Remove", { context: "plugin", candidates: zhCand }), "移除")
assert.strictEqual(reg.translate("Remove", { context: "file", candidates: zhCand }), "删除")
assert.strictEqual(reg.translate("Defaults", { context: "menu:setup.default", candidates: zhCand }), "默认应用")
assert.strictEqual(reg.translate("Defaults", { context: "menu:setup.defaults", candidates: zhCand }), "默认应用")
assert.strictEqual(reg.translate("Defaults", { context: "settings", candidates: zhCand }), "默认值")
assert.strictEqual(reg.translate("INPUT", { context: "audio", candidates: zhCand }), "输入")
assert.strictEqual(reg.translate("OUTPUT", { context: "audio", candidates: zhCand }), "输出")
assert.strictEqual(reg.translate("Input", { context: "audio", candidates: zhCand }), "输入")
assert.strictEqual(reg.translate("Output", { context: "audio", candidates: zhCand }), "输出")
assert.strictEqual(reg.translate("Input", { context: "dmenu", candidates: zhCand }), "输入")
assert.strictEqual(reg.translate("Select", { context: "dmenu", candidates: zhCand }), "选择")

// Context fallback when specific context key is missing but general msgid exists
assert.strictEqual(reg.translate("Connect", { context: "custom_ctx", candidates: zhCand }), "连接")

// Context and general missing fallback to English
assert.strictEqual(reg.translate("Nonexistent Action", { context: "custom_ctx", candidates: zhCand }), "Nonexistent Action")
assert.strictEqual(reg.translate("Nonexistent Action", { candidates: zhCand }), "Nonexistent Action")
assert.strictEqual(reg.translate("", { candidates: zhCand }), "")

// ---------------------------------------------------------------------------
// 3. Packaging contract assertions
console.log("- Test packaging contract & self-containment...")
const repoRoot = path.resolve(__dirname, "../..")
const shellDir = path.join(repoRoot, "shell")
const zhCatalogPath = path.join(shellDir, "Commons/i18n/zh_CN.js")
assert(fs.existsSync(zhCatalogPath), "shell/Commons/i18n/zh_CN.js must exist")

const i18nQmlPath = path.join(shellDir, "Commons/I18n.qml")
const i18nQmlContent = fs.readFileSync(i18nQmlPath, "utf8")
assert(!i18nQmlContent.includes("../../localization"), "I18n.qml must not reference ../../localization/")
assert(!i18nQmlContent.includes("localization/"), "I18n.qml must not reference localization/")

function assertNoExternalLocalizationImports(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      assertNoExternalLocalizationImports(fullPath)
    } else if (entry.name.endsWith(".qml") || entry.name.endsWith(".js")) {
      const content = fs.readFileSync(fullPath, "utf8")
      assert(!content.includes("../../localization"), `${fullPath} must not import from ../../localization`)
      assert(!content.includes("../../../localization"), `${fullPath} must not import from localization`)
    }
  }
}
assertNoExternalLocalizationImports(shellDir)

// ---------------------------------------------------------------------------
// 4. Stage 1 Panel high frequency GUI texts and placeholder parity
console.log("- Test stage 1 panel GUI texts & placeholder parity...")
const stage1Strings = {
  // Network
  "Turn Wi-Fi on": "开启 Wi-Fi",
  "Turn Wi-Fi off": "关闭 Wi-Fi",
  "SIGN-IN REQUIRED": "需要登录",
  "LIMITED INTERNET ACCESS": "网络访问受限",
  "NOT CONNECTED": "未连接",
  "Wiring bits": "接通比特",
  "Handling packets": "处理数据包",
  "Sorting frames": "整理数据帧",
  "Hauling bytes": "搬运字节",
  "Routing crumbs": "碎屑路由中",
  "Counting collisions": "统计冲突",
  "Bending light": "折射光纤",
  "Connecting...": "正在连接…",
  "Wrong password": "密码错误",
  "Passphrase required": "需要密码",
  "Network lost": "网络已断开",
  "Connection failed": "连接失败",
  "Failed to connect": "连接失败",
  "Timed out connecting": "连接超时",
  "Timed out disconnecting": "断开连接超时",
  "Timed out forgetting": "忘记网络超时",
  "Identity (user@domain)": "身份 (user@domain)",
  "Passphrase": "密码",
  "KNOWN NETWORKS": "已知网络",
  "OTHER NETWORKS": "其他网络",
  "Let Wi-Fi pick the band": "由 Wi-Fi 自动选择频段",
  "Custom": "自定义",
  "Ethernet": "以太网",
  "Sign-in required": "需要登录",
  "Forgetting…": "正在忘记…",
  "Copy to clipboard": "复制到剪贴板",

  // Bluetooth
  "Bluetooth": "蓝牙",
  "Device": "设备",
  "No Bluetooth adapter": "没有蓝牙适配器",

  // Audio
  "Audio": "音频",
  "SOURCES": "播放流",

  // Display / Monitor
  "Display": "显示",
  "BRIGHTNESS": "亮度",
  "TEXT SIZE": "文字大小",
  "SCALE": "缩放",
  "DISPLAYS": "显示器",

  // Power
  "Power": "电源",
  "Power Profile": "电源模式",
  "Amassing watts": "聚集瓦特",
  "Hoarding joules": "储备焦耳",
  "Sucking volts": "吸取伏特",
  "Topping reserves": "充实储备",
  "Soaking amps": "汲取安培",
  "Inhaling kilowatts": "吞吐千瓦",
  "Slurping power": "畅饮电量",
  "Spending joules": "消耗焦耳",
  "Draining watts": "流失瓦特",
  "Burning electrons": "燃烧电子",
  "Sipping juice": "轻啜电量",
  "Spending coulombs": "消耗库仑",
  "Bleeding amps": "消耗安培",
  "Guzzling volts": "鲸吞伏特",
  "Munching reserves": "咀嚼储备",
  "Fully charged": "已充满",
  "On battery": "使用电池",
  "Threshold": "限制充电",
  "Battery size": "电池容量",
  "Charge cycles": "充电循环",
  "Charge limit": "充电限制",
  "Time left": "剩余时间",
  "Time to full": "充满所需时间",
  "Battery state": "电池状态",
  "Holding": "保持中",
  "Discharging": "放电中",
  "Charging": "充电中",

  // Clock
  "BORN": "出生年份",
  "LIVE TO": "预期寿命",
  "year": "年份",
  "Time": "时间",
  "Timezone": "时区"
}

for (const [en, zh] of Object.entries(stage1Strings)) {
  assert.strictEqual(reg.translate(en, { candidates: zhCand }), zh, `Stage 1 string '${en}' must translate to '${zh}'`)
}

// Placeholder parity
assert.strictEqual(
  reg.translate("Stay on %1", { candidates: zhCand, args: ["5 GHz"] }),
  "保持在 5 GHz"
)
assert.strictEqual(
  reg.translate("No matches for “%1”", { candidates: zhCand, args: ["foobar"] }),
  "未找到与“foobar”匹配的结果"
)
assert.strictEqual(
  reg.translate("Do you want to uninstall %1?", { candidates: zhCand, args: ["Firefox"] }),
  "是否要卸载 Firefox？"
)
assert.strictEqual(
  reg.translate("Connected to %1", { candidates: zhCand, args: ["Office-5G"] }),
  "已连接到 Office-5G"
)
assert.strictEqual(
  reg.translate("Connected to %1", { candidates: enCand, args: ["Office-5G"] }),
  "Connected to Office-5G"
)
assert.strictEqual(
  I18nModel.interpolate("Device %1 of %2", ["2", "10"]),
  "Device 2 of 10"
)

// ---------------------------------------------------------------------------
// 5. Technical term preservation (Zero translation)
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
  assert.strictEqual(
    reg.translate(term, { context: "any_ctx", candidates: zhCand }),
    term,
    `Technical term '${term}' must be preserved as-is with context!`
  )
  assert.strictEqual(zhCatalog[term], undefined, `Catalog must not translate technical term '${term}'`)
}

// ---------------------------------------------------------------------------
// 6. Menu Search Bilingual Compatibility
console.log("- Test menu bilingual search compatibility...")
const mockI18n = {
  tr: function(k) { return reg.translate(k, { candidates: zhCand }) },
  trc: function(c, k) { return reg.translate(k, { context: c, candidates: zhCand }) }
}
const menuJsonc = fs.readFileSync(path.join(repoRoot, "default/omarchy/omarchy-menu.jsonc"), "utf8")
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

console.log("All 6 i18n test suites passed completely!")
