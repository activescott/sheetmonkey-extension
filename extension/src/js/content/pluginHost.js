'use strict' /* global chrome, window */
import $ from 'jquery'
import Constants from '../modules/Constants.js'
import Diag from '../modules/diag.js'

const D = new Diag('PluginHost')

class PluginHost {
  constructor (document, plugins) {
    if (document == null) throw new Error('document must be provided')
    if (plugins == null) throw new Error('plugins must be provided')
    this._document = document
    this._plugins = plugins
    this.hostPlugins()
  }

  get doc () {
    return this._document
  }

  get plugins () {
    return this._plugins
  }

  hostPlugins () {
    for (var plugin of this.plugins) {
      D.log('found plugin', plugin.manifest.id, 'at', plugin.manifestUrl, 'with baseUrl', plugin.baseUrl)
            // Now we build out a sandboxed iframe element for the plugin:
            // Get plugin script urls (and other plugin detail)
      var urls = [chrome.runtime.getURL(Constants.SheetMonkeyHostScriptPath)]
      urls = urls.concat(plugin.manifest.scripts.map(s => plugin.baseUrl + s))
            // Add the SheetMonkey script URL:

            // note: relying on jquery to safely encode all these unsafe strings
      let scripts = urls.map(u => $('<script>').attr('src', u))
      scripts.unshift(`<script>window.data_sheetmonkey_pluginid="${plugin.manifest.id}"</script>`)
      scripts.unshift(`<script>window.data_sheetmonkey_ssOrigin="${window.origin}"</script>`)
      let html = $('<html>').append(scripts)
      let srcDoc = html.prop('outerHTML')
      let iframe = $('<iframe sandbox="allow-scripts allow-modals allow-popups allow-forms allow-popups-to-escape-sandbox" style="display:none"></iframe>')
      iframe.attr('id', `sheetmonkey_${plugin.manifest.id}`)
      iframe.attr('data-sheetmonkey-pluginid', plugin.manifest.id)
      iframe.attr('srcdoc', srcDoc)
      iframe.appendTo($('body'))
    }
  }

  getPluginFrame (pluginId) {
    const selector = `iframe[data-sheetmonkey-pluginid="${pluginId}"]`
    const frame = $(selector)
    D.assert(frame.length === 1, `expected exactly one plugin host, but found ${frame.length}! Selector: ${selector}`)
    return frame.first()
  }

  postMessageToPlugin (pluginId, message) {
    let f = this.getPluginFrame(pluginId)
    if (!f || (f.length === 0)) {
      throw new Error(`frame for plugin '${pluginId}' not found.`)
    }
        // ensure the message has pluginId on it:
    if (!message.pluginId) { message.pluginId = pluginId }

    let window = f.prop('contentWindow')
    const targetOrigin = '*'
    window.postMessage(message, targetOrigin)
  }

  notifyCommandClicked (pluginId, commandId) {
    const msg = {
      eventType: 'command_click',
      pluginId: pluginId,
      commandId: commandId
    }
    this.postMessageToPlugin(pluginId, msg)
  }
}

export default PluginHost
