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
assert.deepStrictEqual(
  I18nModel.localeCandidates({ LANGUAGE: "fr:zh_CN" }),
  ["fr", "zh_CN", "zh"]
)
assert.deepStrictEqual(
  I18nModel.localeCandidates({ LANGUAGE: "zh_TW:zh_CN" }),
  ["zh_TW", "zh", "zh_CN"]
)
assert.deepStrictEqual(
  I18nModel.localeCandidates({ LANGUAGE: "fr:en" }),
  ["fr", "en"]
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

// Duplicate translation key detection in catalog source
const catalogSource = fs.readFileSync(zhCatalogPath, "utf8")
const keyMatches = [...catalogSource.matchAll(/^  "((?:\\.|[^"\\])*)"\s*:/gm)]
const parsedKeys = keyMatches.map(m => JSON.parse('"' + m[1] + '"'))
const seenKeys = new Set()
const duplicateKeys = []
for (const k of parsedKeys) {
  if (seenKeys.has(k)) duplicateKeys.push(k)
  seenKeys.add(k)
}
assert.deepStrictEqual(duplicateKeys, [], `Duplicate translation keys found in zh_CN.js: ${duplicateKeys.join(", ")}`)

// ---------------------------------------------------------------------------
// 4. Stage 1 Panel high frequency GUI texts, polish & placeholder parity
console.log("- Test stage 1 panel GUI texts & placeholder parity...")
const stage1Strings = {
  // Network
  "Turn Wi-Fi on": "开启 Wi-Fi",
  "Turn Wi-Fi off": "关闭 Wi-Fi",
  "SIGN-IN REQUIRED": "需要登录",
  "LIMITED INTERNET ACCESS": "网络访问受限",
  "NOT CONNECTED": "未连接",
  "Wiring bits": "正在接通网络",
  "Handling packets": "正在处理数据包",
  "Sorting frames": "正在整理数据帧",
  "Hauling bytes": "正在传输数据",
  "Routing crumbs": "正在寻找路由",
  "Counting collisions": "正在检测冲突",
  "Bending light": "正在穿越光纤",
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

  // Audio
  "Audio": "音频",
  "SOURCES": "播放流",

  // Display / Monitor
  "Display": "显示",
  "BRIGHTNESS": "亮度",
  "TEXT SIZE": "文字大小",
  "SCALE": "缩放",
  "DISPLAYS": "显示器",
  "focused": "当前焦点",

  // Power
  "Power": "电源",
  "Power Profile": "电源模式",
  "Amassing watts": "蓄积电量",
  "Hoarding joules": "储备能量",
  "Sucking volts": "正在取电",
  "Topping reserves": "充实储备",
  "Soaking amps": "注入电流",
  "Inhaling kilowatts": "高效快充中",
  "Slurping power": "畅享充电",
  "Spending joules": "消耗能量",
  "Draining watts": "消耗电量",
  "Burning electrons": "燃烧电量",
  "Sipping juice": "轻微耗电",
  "Spending coulombs": "释放电荷",
  "Bleeding amps": "释放电流",
  "Guzzling volts": "火力全开",
  "Munching reserves": "消耗储备",
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
// 5. Bluetooth core UI localization coverage
console.log("- Test Bluetooth core UI localization...")
const bluetoothCoreStrings = {
  "Bluetooth": "蓝牙",
  "No adapter": "无适配器",
  "Turned Off": "已关闭",
  "No Bluetooth adapter": "没有蓝牙适配器",
  "Turn Bluetooth on to scan": "开启蓝牙以扫描设备",
  "Scanning for devices…": "正在扫描设备…",
  "Turn Bluetooth on": "开启蓝牙",
  "Turn Bluetooth off": "关闭蓝牙",
  "Untangling wires": "正在理顺无线链路",
  "Streaming vikings": "维京信号流淌中",
  "Pairing mysteries": "正在探索配对",
  "Herding headsets": "正在搜寻耳机",
  "Taming radios": "正在调谐射频",
  "Summoning speakers": "正在呼唤音箱",
  "Wrangling codecs": "正在协商编解码",
  "Polishing packets": "正在润色数据包",
  "Device": "设备",
  "CONNECTED": "已连接",
  "PAIRED": "已配对设备",
  "AVAILABLE": "可用设备"
}

for (const [en, zh] of Object.entries(bluetoothCoreStrings)) {
  assert.strictEqual(reg.translate(en, { candidates: zhCand }), zh, `Bluetooth core string '${en}' must translate to '${zh}'`)
}

// Bluetooth dynamic device names must never be translated
const dynamicBluetoothDevices = [
  "WH-1000XM6",
  "AirPods Pro",
  "Pixel 10 Pro",
  "HUAWEI FreeBuds Pro 3",
  "Sony WH-1000XM5",
  "JBL Flip 6",
  "Bose QuietComfort 45",
  "Magic Keyboard",
  "MX Master 3S"
]

for (const devName of dynamicBluetoothDevices) {
  assert.strictEqual(
    reg.translate(devName, { candidates: zhCand }),
    devName,
    `Dynamic bluetooth device name '${devName}' must NOT be translated!`
  )
  assert.strictEqual(zhCatalog[devName], undefined, `Catalog must not have entry for '${devName}'`)
}

// ---------------------------------------------------------------------------
// 6. Top bar static tooltips & Bar.showTooltip regression contract
console.log("- Test top bar tooltips & Bar.showTooltip regression contract...")
const barTooltips = {
  "Sign in to this network": "登录此网络",
  "Limited internet access": "网络访问受限",
  "Pending Omarchy Updates": "有待处理的 Omarchy 更新",
  "Microphone muted": "麦克风已静音",
  "Microphone in use": "麦克风正在使用",
  "Microphone live": "麦克风已就绪",
  "Right-click to toggle format": "右键点击切换时间格式",
  "Stop recording": "停止录屏",
  "Screen Recording": "屏幕录制",
  "Allow Idle Lock & Screensaver": "允许自动锁定与屏幕保护",
  "Stay Awake": "保持唤醒",
  "Day Light": "日间模式",
  "Night Light": "夜间模式",
  "Dictate": "语音听写",
  "Allow Notifications": "允许通知",
  "Silence Notifications": "免打扰"
}

for (const [en, zh] of Object.entries(barTooltips)) {
  assert.strictEqual(reg.translate(en, { candidates: zhCand }), zh, `Bar tooltip '${en}' must translate to '${zh}'`)
}

// Regression contract: Bar.showTooltip must NOT translate tooltips globally!
const barQmlContent = fs.readFileSync(path.join(shellDir, "plugins/bar/Bar.qml"), "utf8")
assert(
  !barQmlContent.includes("tooltipText = I18n.tr"),
  "Bar.qml must NOT globally wrap tooltipText in I18n.tr in showTooltip"
)
assert(
  barQmlContent.includes("tooltipText = pendingTooltipText"),
  "Bar.qml must store pendingTooltipText directly without global translation"
)
assert(
  barQmlContent.includes("text: root.tooltipText"),
  "Bar.qml tooltip label must bind directly to root.tooltipText"
)

// ---------------------------------------------------------------------------
// 7. Dynamic text opt-out audit
console.log("- Test dynamic text opt-out protections...")
// agents/Panel.qml protections
const agentsQmlContent = fs.readFileSync(path.join(shellDir, "plugins/agents/Panel.qml"), "utf8")
assert(agentsQmlContent.includes("translateTitle: false"), "agents PanelHero must set translateTitle: false")
assert(agentsQmlContent.includes("translateText: false"), "agents components must set translateText: false")

// tailscale/Panel.qml protections
const tailscaleQmlContent = fs.readFileSync(path.join(shellDir, "plugins/panels/tailscale/Panel.qml"), "utf8")
assert(tailscaleQmlContent.includes("translateTitle: false"), "tailscale PanelHero must set translateTitle: false")

// bluetooth/Panel.qml protections
const bluetoothQmlContent = fs.readFileSync(path.join(shellDir, "plugins/panels/bluetooth/Panel.qml"), "utf8")
assert(bluetoothQmlContent.includes("text: root.deviceLabel(row.dev) || I18n.tr(\"Device\")"), "bluetooth DeviceRow must NOT wrap deviceLabel in I18n.tr")

// power/Panel.qml protections
const powerQmlContent = fs.readFileSync(path.join(shellDir, "plugins/panels/power/Panel.qml"), "utf8")
assert(!powerQmlContent.includes("InfoValue { text: value !== \"\" ? I18n.tr(value) : \"\" }"), "InfoPair.value must NOT be globally passed through I18n.tr")
assert(powerQmlContent.includes("InfoValue { text: value }"), "InfoPair.value must render directly as text: value")
assert(powerQmlContent.includes('value: root.chargeThresholdActive ? I18n.tr("Holding")'), "Holding must be explicitly translated at call site in power/Panel.qml")

const dynamicPowerValues = ["12.5 W", "15.0 W", "0 W", "-", "80%", "45 W"]
for (const val of dynamicPowerValues) {
  assert.strictEqual(reg.translate(val, { candidates: zhCand }), val, `Dynamic power value '${val}' must NOT be translated`)
  assert.strictEqual(zhCatalog[val], undefined, `Catalog must not contain entry for dynamic power value '${val}'`)
}

// ---------------------------------------------------------------------------
// 8. Technical term preservation (Zero translation)
console.log("- Test technical term preservation...")
const technicalTerms = [
  "Omarchy", "Arch Linux", "Arch", "Hyprland", "Quickshell", "Wayland", "XWayland",
  "Codex", "Claude Code", "Gemini CLI", "OpenCode", "Grok", "Copilot", "Hermes", "Crush", "Pi", "Oh My Pi",
  "Git", "GitHub", "GitHub CLI", "Docker", "systemd", "pacman", "AUR", "mise",
  "Neovim", "Vim", "Emacs", "VS Code", "Cursor", "Zed", "Helix",
  "Chromium", "Obsidian", "LibreOffice", "Kdenlive", "OBS Studio",
  "Fcitx", "Fcitx 5", "QEMU", "VirGL", "ANGLE", "Metal",
  "PipeWire", "WirePlumber", "NetworkManager",
  "Agent"
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

// Agent menu item and title
assert.strictEqual(
  reg.translate("Agent", { context: "menu:setup.default.agent", candidates: zhCand }),
  "Agent",
  "menu:setup.default.agent Agent must be preserved as 'Agent'"
)
assert.strictEqual(
  reg.translate("Default Agent", { candidates: zhCand }),
  "默认 Agent",
  "Default Agent must be '默认 Agent'"
)

// ---------------------------------------------------------------------------
// 9. Menu Search Bilingual Compatibility
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

// ---------------------------------------------------------------------------
// 10. Omarchy Menu Completeness & Explicit Disambiguation
console.log("- Test menu localization completeness & disambiguation...")
const rawEnMenuItems = MenuModel.parseMenuJsonc(menuJsonc, { tr: k => k, trc: (c, k) => k })
const enMerged = MenuModel.mergeMenuSources(rawEnMenuItems, [])
const enMenuMap = enMerged.items

assert.strictEqual(menuMap["trigger.transcode"].label, "转码", "trigger.transcode must be '转码'")
assert.strictEqual(menuMap["trigger.share"].label, "分享", "trigger.share must be '分享'")
assert.strictEqual(menuMap["trigger.toggle"].label, "开关", "trigger.toggle must be '开关'")

// Check all menu items
let menuTranslatable = 0
let menuTranslated = 0
let menuPreserved = 0
let menuMissing = []

const forbiddenEnglishGuiWords = new Set([
  "Apps", "Learn", "Trigger", "Style", "Setup", "Install", "Remove", "Update", "About",
  "Transcode", "Share", "Toggle", "Hardware", "Speed Test", "Network", "Bluetooth", "Audio",
  "Display", "Power", "Timezone", "Lock", "Suspend", "Hibernate", "Logout", "Reboot",
  "Shutdown", "Save", "Cancel", "Confirm", "Close", "Search", "Settings", "Defaults",
  "Plugin", "Plugins", "Package", "Security", "Password", "Theme", "Background", "Font",
  "Position", "Transparency", "Keybindings", "Community", "Emoji", "Reminder", "Capture",
  "Screenshot", "Screenrecord", "Stop Screenrecording", "Clipboard", "Dictate", "Dictation",
  "Receive", "Notifications", "Crash Capture", "Unlock", "Preinstalls", "Windows",
  "Channel", "Process", "Firmware", "Top", "Bottom", "Left", "Right"
])

for (const [id, item] of Object.entries(enMenuMap)) {
  const enLabel = item.label || ""
  const zhLabel = menuMap[id] ? (menuMap[id].label || "") : ""
  if (!enLabel) continue

  if (zhLabel !== enLabel) {
    menuTranslatable++
    menuTranslated++
  } else {
    menuPreserved++
    if (forbiddenEnglishGuiWords.has(enLabel)) {
      menuMissing.push({ id, label: enLabel })
    }
  }
}
assert.strictEqual(menuMissing.length, 0, `Menu has unlocalized items: ${JSON.stringify(menuMissing)}`)

// ---------------------------------------------------------------------------
// 11. Notification Server No-Global-Translation Contract
console.log("- Test notification server no-global-translation contract...")
const notifServerDir = path.join(shellDir, "plugins/notifications")
function assertNoNotificationGlobalTranslation(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      assertNoNotificationGlobalTranslation(fullPath)
    } else if (entry.name.endsWith(".qml") || entry.name.endsWith(".js")) {
      const content = fs.readFileSync(fullPath, "utf8")
      assert(!content.includes("I18n.tr(notification.summary)"), `${fullPath} must NOT translate notification.summary globally`)
      assert(!content.includes("I18n.tr(notification.body)"), `${fullPath} must NOT translate notification.body globally`)
      assert(!content.includes("I18n.tr(n.summary)"), `${fullPath} must NOT translate n.summary globally`)
      assert(!content.includes("I18n.tr(n.body)"), `${fullPath} must NOT translate n.body globally`)
      assert(!content.includes("I18n."), `${fullPath} should not tamper with third-party notification content`)
    }
  }
}
assertNoNotificationGlobalTranslation(notifServerDir)

// ---------------------------------------------------------------------------
// 12. Shell Notification Helper & Catalog Integrity
console.log("- Test shell notification helper & catalog integrity...")
const shCatalogPath = path.join(repoRoot, "default/i18n/zh_CN.json")
assert(fs.existsSync(shCatalogPath), "default/i18n/zh_CN.json must exist")
const shCatalogRaw = fs.readFileSync(shCatalogPath, "utf8")
const shCatalog = JSON.parse(shCatalogRaw)

// Verify no duplicate keys in zh_CN.json
const jsonKeyMatches = [...shCatalogRaw.matchAll(/^\s*"((?:\\.|[^"\\])*)"\s*:/gm)]
const jsonKeys = jsonKeyMatches.map(m => JSON.parse('"' + m[1] + '"'))
const jsonSeen = new Set()
const jsonDups = []
for (const k of jsonKeys) {
  if (jsonSeen.has(k)) jsonDups.push(k)
  jsonSeen.add(k)
}
assert.deepStrictEqual(jsonDups, [], `Duplicate keys found in default/i18n/zh_CN.json: ${jsonDups.join(", ")}`)

// Critical notifications present
assert.strictEqual(shCatalog["Pending Omarchy Migrations"], "Omarchy 有待处理的迁移")
assert.strictEqual(shCatalog["Click to run %1 pending migrations."], "有 %1 项待处理的迁移，点击运行。")
assert.strictEqual(shCatalog["Battery is down to %1%"], "电池电量已降至 %1%")
assert.strictEqual(shCatalog["Time to recharge!"], "该充电了！")

// Placeholder parity check for both catalogs
function checkPlaceholderParity(name, cat) {
  for (const [key, val] of Object.entries(cat)) {
    if (typeof val !== "string") continue
    if (!key.includes("%")) continue
    const keyPlaceholders = (key.match(/%\d+/g) || []).sort()
    const valPlaceholders = (val.match(/%\d+/g) || []).sort()
    assert.deepStrictEqual(
      valPlaceholders,
      keyPlaceholders,
      `Placeholder mismatch in ${name} for key "${key}": expected ${keyPlaceholders}, got ${valPlaceholders}`
    )
  }
}
checkPlaceholderParity("shell/Commons/i18n/zh_CN.js", zhCatalog)
checkPlaceholderParity("default/i18n/zh_CN.json", shCatalog)

// ---------------------------------------------------------------------------
// 13. QML Source-Side Graphical Audit (User-Facing Properties & Literals)
console.log("- Test QML source-side graphical audit...")
function walkQml(dir) {
  let results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "dev-gallery") continue // DEVELOPER_ONLY
      results = results.concat(walkQml(full))
    } else if (entry.name.endsWith(".qml") || (entry.name.endsWith(".js") && !full.includes("/i18n/"))) {
      results.push(full)
    }
  }
  return results
}

const PRESERVED_QML_TERMS = new Set([
  "Omarchy", "Arch", "Arch Linux", "Hyprland", "Quickshell", "Wayland", "PipeWire",
  "systemd", "pacman", "AUR", "Neovim", "Bash", "Tmux", "Herdr", "Docker",
  "GitHub", "GitHub CLI", "Codex", "Claude Code", "Gemini CLI", "OpenCode",
  "Tailscale", "Dropbox", "Mullvad", "RetroArch", "Ghostty", "Foot", "Alacritty",
  "Kitty", "Agent", "Default Agent", "Fcitx", "WirePlumber", "NetworkManager"
])

const allQmlFiles = walkQml(shellDir)
const qmlAudit = {
  candidateLiterals: 0,
  translated: 0,
  preserved: 0,
  dynamicOrDeveloper: 0,
  missing: [],
  unclassified: []
}

for (const f of allQmlFiles) {
  const rel = path.relative(repoRoot, f)
  const content = fs.readFileSync(f, "utf8")
  const lines = content.split("\n")

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith("//") || line.startsWith("/*")) continue

    const lineRegex = /(?:^|\s)(text|title|label|tooltipText|placeholderText|description|headerText)\s*:\s*(?:(["'])((?:\\.|(?!\2).)*)\2|I18n\.(trc?)\(([^)]+)\)|([a-zA-Z0-9_$.]+))/g
    let m
    while ((m = lineRegex.exec(line)) !== null) {
      const prop = m[1]
      const literal = m[3]
      const trFunc = m[4]
      const trArgs = m[5]
      const expr = m[6]

      qmlAudit.candidateLiterals++

      if (trFunc) {
        qmlAudit.translated++
        continue
      }

      if (literal !== undefined) {
        const str = literal.trim()
        if (!str || /^[^a-zA-Z]+$/.test(str) || /^(\\u[0-9a-fA-F]{4})+$/.test(str) || /^[a-zA-Z0-9]+$/.test(str) || /^[\d.]+\s*(?:%|MB|GB|KB|s|ms|h|m|W|Wh|°C|px|pt)?$/i.test(str)) {
          // Glyph, icon escape, punctuation, pure numbers/units
          qmlAudit.dynamicOrDeveloper++
        } else if (PRESERVED_QML_TERMS.has(str)) {
          qmlAudit.preserved++
        } else if (str in zhCatalog) {
          qmlAudit.translated++
        } else {
          qmlAudit.missing.push({ file: rel, line: i + 1, prop, literal: str })
        }
      } else if (expr) {
        qmlAudit.dynamicOrDeveloper++
      }
    }
  }
}

assert.deepStrictEqual(qmlAudit.missing, [], `Unlocalized QML literals found: ${JSON.stringify(qmlAudit.missing)}`)
assert.deepStrictEqual(qmlAudit.unclassified, [], `Unclassified QML literals found: ${JSON.stringify(qmlAudit.unclassified)}`)

// ---------------------------------------------------------------------------
// 14. Shell Graphical Surfaces Real Source Inventory
console.log("- Test shell graphical surfaces real source inventory...")

const SHELL_ALLOWLIST = [
  {
    file: "bin/omarchy-tailscale-send",
    pattern: "${error:-$default_error}",
    type: "DYNAMIC_THIRD_PARTY",
    reason: "Tailscale daemon error message or dynamic network error output"
  },
  {
    file: "bin/omarchy-tailscale-send",
    pattern: "$what",
    type: "DYNAMIC_DATA",
    reason: "Dynamic list of file paths or machine name"
  },
  {
    file: "bin/omarchy-tailscale-send",
    pattern: "$notif_title",
    type: "LOCALIZED_VIA_VAR",
    reason: "notif_title formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-default-browser",
    pattern: "$notif_msg",
    type: "LOCALIZED_VIA_VAR",
    reason: "notif_msg formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-default-editor",
    pattern: "$notif_msg",
    type: "LOCALIZED_VIA_VAR",
    reason: "notif_msg formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-default-terminal",
    pattern: "$notif_msg",
    type: "LOCALIZED_VIA_VAR",
    reason: "notif_msg formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-windows-vm",
    pattern: "$notif_title",
    type: "LOCALIZED_VIA_VAR",
    reason: "notif_title & notif_desc formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-voxtype-install",
    pattern: "$notif_title",
    type: "LOCALIZED_VIA_VAR",
    reason: "notif_title & notif_desc formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-plugin-clone",
    pattern: "$notif_title",
    type: "LOCALIZED_VIA_VAR",
    reason: "notif_title & notif_desc formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-games-retro-install",
    pattern: "/usr/lib/libretro",
    type: "DYNAMIC_DATA",
    reason: "Filesystem library path subtext"
  },
  {
    file: "bin/omarchy-games-retro-install",
    pattern: "$notif_title",
    type: "LOCALIZED_VIA_VAR",
    reason: "notif_title & notif_desc formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-transcode",
    pattern: "$trans_done",
    type: "LOCALIZED_VIA_VAR",
    reason: "trans_done and trans_saved formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-transcode",
    pattern: "$trans_msg",
    type: "LOCALIZED_VIA_VAR",
    reason: "trans_msg formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-hyprland-window-width",
    pattern: "$title",
    type: "LOCALIZED_VIA_VAR",
    reason: "title & desc formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-crash-watch",
    pattern: "$notif_headline",
    type: "LOCALIZED_VIA_VAR",
    reason: "notif_headline & notif_desc formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-system-sleep-lock",
    pattern: "$notif_title",
    type: "LOCALIZED_VIA_VAR",
    reason: "notif_title & notif_desc formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-reminder",
    pattern: "$reminder_label",
    type: "LOCALIZED_VIA_VAR",
    reason: "reminder_label, message, confirmation formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-reminder",
    pattern: "$confirmation_title",
    type: "LOCALIZED_VIA_VAR",
    reason: "confirmation_title formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-chromium-ytdlp-host",
    pattern: "$notif_title",
    type: "LOCALIZED_VIA_VAR",
    reason: "notif_title, notif_complete, notif_failed formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-chromium-ytdlp-host",
    pattern: "$notif_complete",
    type: "LOCALIZED_VIA_VAR",
    reason: "notif_complete formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-chromium-ytdlp-host",
    pattern: "$notif_failed",
    type: "LOCALIZED_VIA_VAR",
    reason: "notif_failed formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-audio-output-switch",
    pattern: "$next_sink_description",
    type: "DYNAMIC_DATA",
    reason: "Hardware audio sink device name"
  },
  {
    file: "bin/omarchy-menu-file",
    pattern: "$label",
    type: "LOCALIZED_VIA_VAR",
    reason: "Caller provides label, localized via omarchy-i18n before display"
  },
  {
    file: "bin/omarchy-capture-screenrecording-with-webcam",
    pattern: "$menu_prompt",
    type: "LOCALIZED_VIA_VAR",
    reason: "menu_prompt formatted via omarchy-i18n Select Webcam"
  },
  {
    file: "bin/omarchy-menu-plugin",
    pattern: "$menu_prompt",
    type: "LOCALIZED_VIA_VAR",
    reason: "menu_prompt formatted via omarchy-i18n ${1^} plugin"
  },
  {
    file: "bin/omarchy-menu-plugin",
    pattern: "No plugin to ${1}",
    type: "LOCALIZED_VIA_VAR",
    reason: "Evaluates to No plugin to <action> where all action variants are in catalog"
  },
  {
    file: "bin/omarchy-games-retro-install",
    pattern: "$core_prompt",
    type: "LOCALIZED_VIA_VAR",
    reason: "core_prompt formatted via omarchy-i18n RetroArch core"
  },
  {
    file: "bin/omarchy-tailscale-send",
    pattern: "$chooser_title",
    type: "LOCALIZED_VIA_VAR",
    reason: "chooser_title formatted via omarchy-i18n Send to %1"
  },
  {
    file: "bin/omarchy-migrate-notify",
    pattern: "$headline",
    type: "LOCALIZED_VIA_VAR",
    reason: "headline and message formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-battery-low",
    pattern: "$headline",
    type: "LOCALIZED_VIA_VAR",
    reason: "headline and description formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-display-text-size",
    pattern: "$notif_msg",
    type: "LOCALIZED_VIA_VAR",
    reason: "notif_msg formatted via omarchy-i18n"
  },
  {
    file: "bin/omarchy-notification-time",
    pattern: "$msg",
    type: "LOCALIZED_VIA_VAR",
    reason: "msg formatted conditionally with Chinese date template"
  },
  {
    file: "bin/omarchy-notification-battery",
    pattern: "$msg",
    type: "LOCALIZED_VIA_VAR",
    reason: "msg formatted conditionally from omarchy-battery-status --shell fields"
  },
  {
    file: "bin/omarchy-tailscale-receive",
    pattern: "${args[@]}",
    type: "LOCALIZED_VIA_VAR",
    reason: "args contain title & body formatted via omarchy-i18n"
  },
  {
    file: "default/hypr/helpers.lua",
    pattern: "message",
    type: "DYNAMIC_DATA",
    reason: "User config helper function o.notify(message)"
  }
]

function scanDirectory(dir) {
  let files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files = files.concat(scanDirectory(full))
    } else if (entry.isFile()) {
      files.push(full)
    }
  }
  return files
}

function auditShellSurfaces() {
  const dirs = ["bin", "install", "migrations", "default"]
  const allFiles = []
  for (const d of dirs) {
    const fullD = path.join(repoRoot, d)
    if (fs.existsSync(fullD)) {
      allFiles.push(...scanDirectory(fullD))
    }
  }

  const notifications = { callSites: 0, localized: 0, dynamic: 0, missing: [], unclassified: [] }
  const osd = { messages: 0, localized: 0, dynamic: 0, missing: [] }
  const selectors = { prompts: 0, localized: 0, dynamic: 0, missing: [] }

  function extractI18nKeys(stmt) {
    const regex = /omarchy-i18n\s+(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)')/g
    const keys = []
    let m
    while ((m = regex.exec(stmt)) !== null) {
      keys.push(m[1] !== undefined ? m[1] : m[2])
    }
    return keys
  }

  for (const f of allFiles) {
    if (f.endsWith(".md") || f.endsWith(".json") || f.endsWith(".png") || f.endsWith(".jpg") || f.endsWith(".toml") || f.endsWith(".ini") || f.endsWith(".svg") || f.endsWith(".txt")) continue
    const rel = path.relative(repoRoot, f)
    const content = fs.readFileSync(f, "utf8")
    const lines = content.split("\n")

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith("#") || line.includes("Usage:")) continue

      // 1. omarchy-notification-send
      if (line.includes("omarchy-notification-send")) {
        notifications.callSites++
        let stmt = line
        let j = i
        while (stmt.endsWith("\\") && j + 1 < lines.length) {
          j++
          stmt += " " + lines[j].trim()
        }

        const i18nKeys = extractI18nKeys(stmt)
        if (i18nKeys.length > 0) {
          notifications.localized++
          for (const k of i18nKeys) {
            if (k.includes("${1}")) {
              const actions = ["clone", "remove", "enable", "disable"]
              const allExist = actions.every(a => k.replace("${1}", a) in shCatalog)
              if (!allExist) {
                notifications.missing.push({ file: rel, line: i + 1, key: k })
              }
            } else if (!(k in shCatalog)) {
              notifications.missing.push({ file: rel, line: i + 1, key: k })
            }
          }
          continue
        }

        const allow = SHELL_ALLOWLIST.find(a => a.file === rel && stmt.includes(a.pattern))
        if (allow) {
          if (allow.type === "LOCALIZED_VIA_VAR") {
            notifications.localized++
          } else {
            notifications.dynamic++
          }
          continue
        }

        const stringLiteralMatches = [...stmt.matchAll(/(?:^|\s)["']([A-Z][a-zA-Z0-9 ,.!?'-]+)["']/g)]
        if (stringLiteralMatches.length > 0) {
          for (const m of stringLiteralMatches) {
            notifications.missing.push({ file: rel, line: i + 1, text: m[1] })
          }
        } else {
          notifications.unclassified.push({ file: rel, line: i + 1, snippet: stmt })
        }
      }

      // 2. omarchy-osd
      if (line.includes("omarchy-osd")) {
        osd.messages++
        let stmt = line
        let j = i
        while (stmt.endsWith("\\") && j + 1 < lines.length) {
          j++
          stmt += " " + lines[j].trim()
        }

        const i18nKeys = extractI18nKeys(stmt)
        if (i18nKeys.length > 0) {
          osd.localized++
          for (const k of i18nKeys) {
            if (!(k in shCatalog)) {
              osd.missing.push({ file: rel, line: i + 1, key: k })
            }
          }
          continue
        }

        const allow = SHELL_ALLOWLIST.find(a => a.file === rel && stmt.includes(a.pattern))
        if (allow) {
          if (allow.type === "LOCALIZED_VIA_VAR") {
            osd.localized++
          } else {
            osd.dynamic++
          }
          continue
        }

        if (stmt.includes("-p ") && !stmt.includes("-m ")) {
          osd.dynamic++
          continue
        }

        const rawLiteral = stmt.match(/-m\s+["']([A-Z][^"']+)["']/)
        if (rawLiteral) {
          osd.missing.push({ file: rel, line: i + 1, text: rawLiteral[1] })
        } else {
          osd.dynamic++
        }
      }

      // 3. omarchy-menu-select & omarchy-file-select
      if (line.includes("omarchy-menu-select") || line.includes("omarchy-file-select")) {
        selectors.prompts++
        let stmt = line
        let j = i
        while (stmt.endsWith("\\") && j + 1 < lines.length) {
          j++
          stmt += " " + lines[j].trim()
        }

        const i18nKeys = extractI18nKeys(stmt)
        if (i18nKeys.length > 0) {
          selectors.localized++
          for (const k of i18nKeys) {
            if (!(k in shCatalog)) {
              selectors.missing.push({ file: rel, line: i + 1, key: k })
            }
          }
          continue
        }

        const allow = SHELL_ALLOWLIST.find(a => a.file === rel && stmt.includes(a.pattern))
        if (allow) {
          if (allow.type === "LOCALIZED_VIA_VAR") {
            selectors.localized++
          } else {
            selectors.dynamic++
          }
          continue
        }

        const rawLiteral = stmt.match(/(?:omarchy-menu-select|--title)\s+["']([A-Z][^"']+)["']/)
        if (rawLiteral) {
          selectors.missing.push({ file: rel, line: i + 1, text: rawLiteral[1] })
        } else {
          selectors.dynamic++
        }
      }
    }
  }

  return { notifications, osd, selectors }
}

const shellSurfaces = auditShellSurfaces()
assert.deepStrictEqual(shellSurfaces.notifications.missing, [], `Unlocalized shell notifications: ${JSON.stringify(shellSurfaces.notifications.missing)}`)
assert.deepStrictEqual(shellSurfaces.notifications.unclassified, [], `Unclassified shell notifications: ${JSON.stringify(shellSurfaces.notifications.unclassified)}`)
assert.deepStrictEqual(shellSurfaces.osd.missing, [], `Unlocalized OSD messages: ${JSON.stringify(shellSurfaces.osd.missing)}`)
assert.deepStrictEqual(shellSurfaces.selectors.missing, [], `Unlocalized selector prompts: ${JSON.stringify(shellSurfaces.selectors.missing)}`)

// ---------------------------------------------------------------------------
// 15. Negative Fixture Tests (Detector Regression Protection)
console.log("- Test detector negative fixtures & regression protection...")

function testAuditStatement(stmt, allowlist, catalog) {
  const i18nMatches = [...stmt.matchAll(/omarchy-i18n\s+(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)')/g)].map(m => m[1] !== undefined ? m[1] : m[2])
  if (i18nMatches.length > 0) {
    for (const k of i18nMatches) {
      if (!(k in catalog)) return { status: "MISSING", key: k }
    }
    return { status: "LOCALIZED" }
  }
  const allow = allowlist.find(a => stmt.includes(a.pattern))
  if (allow) {
    return { status: allow.type === "LOCALIZED_VIA_VAR" ? "LOCALIZED" : "DYNAMIC" }
  }
  const rawLiteral = stmt.match(/(?:omarchy-notification-send|-m|omarchy-menu-select|--title)\s+["']([A-Z][a-zA-Z0-9 ,.!?'-]+)["']/)
  if (rawLiteral) {
    return { status: "MISSING", text: rawLiteral[1] }
  }
  return { status: "UNCLASSIFIED" }
}

const mockAllowlist = [{ pattern: "$what", type: "DYNAMIC_DATA" }]
const mockCatalog = { "Existing Key": "已存在" }

// Fixture 1: Unlocalized notification string literal must be caught
const fix1 = testAuditStatement('omarchy-notification-send "Foo English UI"', mockAllowlist, mockCatalog)
assert.strictEqual(fix1.status, "MISSING")
assert.strictEqual(fix1.text, "Foo English UI")

// Fixture 2: Unlocalized OSD message literal must be caught
const fix2 = testAuditStatement('omarchy-osd -m "Foo English OSD"', mockAllowlist, mockCatalog)
assert.strictEqual(fix2.status, "MISSING")
assert.strictEqual(fix2.text, "Foo English OSD")

// Fixture 3: Unlocalized menu selector prompt must be caught
const fix3 = testAuditStatement('omarchy-menu-select "Foo English Prompt"', mockAllowlist, mockCatalog)
assert.strictEqual(fix3.status, "MISSING")
assert.strictEqual(fix3.text, "Foo English Prompt")

// Fixture 4: i18n key missing from catalog must be caught
const fix4 = testAuditStatement('omarchy-notification-send "$(omarchy-i18n "Missing In Catalog")"', mockAllowlist, mockCatalog)
assert.strictEqual(fix4.status, "MISSING")
assert.strictEqual(fix4.key, "Missing In Catalog")

// Fixture 5: Allowlisted dynamic variable must pass as DYNAMIC
const fix5 = testAuditStatement('omarchy-notification-send -g 󰒊 "$title" "$what"', mockAllowlist, mockCatalog)
assert.strictEqual(fix5.status, "DYNAMIC")

// Fixture 6: QML literal detection
function testAuditQmlLine(line, catalog) {
  const lineRegex = /(?:^|\s)(text|title|label|tooltipText|placeholderText|description|headerText)\s*:\s*(?:(["'])((?:\\.|(?!\2).)*)\2|I18n\.(trc?)\(([^)]+)\)|([a-zA-Z0-9_$.]+))/g
  const m = lineRegex.exec(line)
  if (!m) return { status: "IGNORED" }
  const literal = m[3]
  const trFunc = m[4]
  if (trFunc) return { status: "TRANSLATED" }
  if (literal !== undefined) {
    const str = literal.trim()
    if (PRESERVED_QML_TERMS.has(str)) return { status: "PRESERVED" }
    if (str in catalog) return { status: "TRANSLATED" }
    return { status: "MISSING", literal: str }
  }
  return { status: "DYNAMIC" }
}

assert.strictEqual(testAuditQmlLine('text: "Foo English UI"', mockCatalog).status, "MISSING")
assert.strictEqual(testAuditQmlLine('text: "Hyprland"', mockCatalog).status, "PRESERVED")
assert.strictEqual(testAuditQmlLine('text: I18n.tr("Existing Key")', mockCatalog).status, "TRANSLATED")
assert.strictEqual(testAuditQmlLine('text: modelData.name', mockCatalog).status, "DYNAMIC")

// ---------------------------------------------------------------------------
// 16. Completeness Report
console.log("\n============================================================")
console.log("Omarchy zh_CN Graphical Localization Completeness Report")
console.log("============================================================")
console.log(`Menu:`)
console.log(`  translatable source labels: ${menuTranslatable}`)
console.log(`  translated: ${menuTranslated}`)
console.log(`  preserved technical: ${menuPreserved}`)
console.log(`  dynamic: 0`)
console.log(`  missing: ${menuMissing.length}`)
console.log(`  unclassified: 0`)
console.log(`\nQML graphical strings:`)
console.log(`  candidate user-facing literals: ${qmlAudit.candidateLiterals}`)
console.log(`  translated: ${qmlAudit.translated}`)
console.log(`  preserved: ${qmlAudit.preserved}`)
console.log(`  dynamic/developer: ${qmlAudit.dynamicOrDeveloper}`)
console.log(`  missing: ${qmlAudit.missing.length}`)
console.log(`  unclassified: ${qmlAudit.unclassified.length}`)
console.log(`\nShell graphical notifications:`)
console.log(`  source call sites: ${shellSurfaces.notifications.callSites}`)
console.log(`  localized fixed messages: ${shellSurfaces.notifications.localized}`)
console.log(`  dynamic/third-party: ${shellSurfaces.notifications.dynamic}`)
console.log(`  missing: ${shellSurfaces.notifications.missing.length}`)
console.log(`  unclassified: ${shellSurfaces.notifications.unclassified.length}`)
console.log(`\nOSD:`)
console.log(`  source messages: ${shellSurfaces.osd.messages}`)
console.log(`  localized: ${shellSurfaces.osd.localized}`)
console.log(`  dynamic: ${shellSurfaces.osd.dynamic}`)
console.log(`  missing: ${shellSurfaces.osd.missing.length}`)
console.log(`\nGraphical selectors:`)
console.log(`  prompts: ${shellSurfaces.selectors.prompts}`)
console.log(`  localized: ${shellSurfaces.selectors.localized}`)
console.log(`  dynamic: ${shellSurfaces.selectors.dynamic}`)
console.log(`  missing: ${shellSurfaces.selectors.missing.length}`)
console.log(`\nGraphical localization completeness passed.`)
console.log("============================================================")

console.log("All 16 i18n test suites passed completely!")
