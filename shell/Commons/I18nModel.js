// I18nModel.js — pure-JS core of qs.Commons.I18n
//
// Pure JavaScript: runs under node for unit testing and loads into QML with
// `import "I18nModel.js" as Model`.

var CONTEXT_SEPARATOR = "\u0004"

// ---------------------------------------------------------------------------
// Locale normalization and candidate resolution

function normalizeLocale(value) {
  var locale = String(value || "").trim()
  if (!locale) return ""
  locale = locale.split(".")[0].split("@")[0].replace(/-/g, "_")
  if (locale === "C" || locale === "POSIX") return ""
  var parts = locale.split("_")
  var language = parts[0].toLowerCase()
  if (!language) return ""
  return parts.length > 1 && parts[1] ? language + "_" + parts[1].toUpperCase() : language
}

function localeCandidates(environment) {
  var env = environment || {}
  // Priority: OMARCHY_UI_LANGUAGE > LANGUAGE > LC_ALL > LC_MESSAGES > LANG
  var raw = env.OMARCHY_UI_LANGUAGE || env.LANGUAGE || env.LC_ALL || env.LC_MESSAGES || env.LANG || ""
  var requested = (env.OMARCHY_UI_LANGUAGE ? [env.OMARCHY_UI_LANGUAGE] : (env.LANGUAGE ? String(raw).split(":") : [raw]))
  var candidates = []
  for (var i = 0; i < requested.length; i++) {
    var normalized = normalizeLocale(requested[i])
    if (!normalized) continue
    var language = normalized.split("_")[0]
    if (candidates.indexOf(normalized) === -1) candidates.push(normalized)
    if (candidates.indexOf(language) === -1) candidates.push(language)
    if (language === "en") break
  }
  return candidates
}

// ---------------------------------------------------------------------------
// Interpolation: %1, %2 ... preserves unknown indices, avoids re-expansion

function interpolate(value, args) {
  var output = String(value === undefined || value === null ? "" : value)
  var values = Array.isArray(args) ? args : []
  return output.replace(/%([1-9][0-9]*)/g, function(match, rawIndex) {
    var index = Number(rawIndex) - 1
    return index < values.length ? String(values[index]) : match
  })
}

function contextKey(context, source) {
  var ctx = String(context === undefined || context === null ? "" : context)
  var key = String(source === undefined || source === null ? "" : source)
  return ctx ? ctx + CONTEXT_SEPARATOR + key : key
}

// ---------------------------------------------------------------------------
// Catalog Registry & Translation lookup

function createRegistry() {
  var catalogs = {} // locale -> catalog map
  var currentLocale = "en"

  function registerCatalog(locale, catalog) {
    var norm = normalizeLocale(locale)
    if (!norm || !catalog) return
    catalogs[norm] = catalog
    var lang = norm.split("_")[0]
    if (!catalogs[lang]) catalogs[lang] = catalog
  }

  function setLocale(locale) {
    currentLocale = normalizeLocale(locale) || "en"
  }

  function getCatalog(candidates) {
    var cand = Array.isArray(candidates) ? candidates : [currentLocale]
    for (var i = 0; i < cand.length; i++) {
      var c = catalogs[cand[i]]
      if (c) return c
    }
    return null
  }

  function translate(source, options) {
    var key = String(source === undefined || source === null ? "" : source)
    if (!key) return ""
    var opts = options || {}
    var fullKey = opts.context ? contextKey(opts.context, key) : key
    var candidates = opts.candidates || [currentLocale]

    var catalog = getCatalog(candidates)
    var translated = (catalog && catalog[fullKey] !== undefined) ? catalog[fullKey] : null

    // Fallback if context lookup missed: try bare key
    if (translated === null && opts.context && catalog && catalog[key] !== undefined) {
      translated = catalog[key]
    }

    // Default fallback to source English string
    if (translated === null || translated === undefined) {
      translated = key
    }

    if (opts.args && opts.args.length > 0) {
      return interpolate(translated, opts.args)
    }
    return translated
  }

  return {
    registerCatalog: registerCatalog,
    setLocale: setLocale,
    getCatalog: getCatalog,
    translate: translate,
    catalogs: catalogs
  }
}

if (typeof module !== "undefined") {
  module.exports = {
    normalizeLocale: normalizeLocale,
    localeCandidates: localeCandidates,
    interpolate: interpolate,
    contextKey: contextKey,
    createRegistry: createRegistry
  }
}

