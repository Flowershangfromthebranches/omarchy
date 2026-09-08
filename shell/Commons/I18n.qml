pragma Singleton
import QtQuick
import Quickshell
import "I18nModel.js" as Model
import "../../localization/zh_CN/translations.json" as ZhCatalog

QtObject {
  id: root

  readonly property var candidates: Model.localeCandidates({
    OMARCHY_UI_LANGUAGE: Quickshell.env("OMARCHY_UI_LANGUAGE"),
    LANGUAGE: Quickshell.env("LANGUAGE"),
    LC_ALL: Quickshell.env("LC_ALL"),
    LC_MESSAGES: Quickshell.env("LC_MESSAGES"),
    LANG: Quickshell.env("LANG")
  })

  readonly property string language: candidates.length > 0 ? candidates[0].split("_")[0] : "en"
  readonly property bool isChinese: language === "zh"

  property var _registry: {
    var reg = Model.createRegistry()
    reg.registerCatalog("zh_CN", ZhCatalog)
    return reg
  }

  function tr(source, args) {
    return root._registry.translate(source, { candidates: root.candidates, args: args })
  }

  function trc(context, source, args) {
    return root._registry.translate(source, { context: context, candidates: root.candidates, args: args })
  }

  function translate(source) {
    return tr(source)
  }
}

