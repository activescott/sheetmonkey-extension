'use strict'
import $ from 'jquery'

class SheetHook {
  constructor (pluginHost, plugins, document) {
    if (pluginHost == null || plugins == null || document == null) {
      throw new Error('missing arguments')
    }
    this._pluginHost = pluginHost
    this._plugins = plugins
    this._document = document
    this.initDocumentListeners()
  }

  initDocumentListeners () {
    // Should we be doing this via this.doc instead? Jquery seems to find the document ok and is more resilient.
    $(() => {
      this.onSmartsheetLoaded()
    })
  }

  get doc () {
    return this._document
  }

  get pluginHost () {
    return this._pluginHost
  }

  get plugins () {
    return this._plugins
  }

  getPluginManifestUrlFromID (pluginID) {
    let plugin = this.plugins.find(p => p.manifest.id === pluginID)
    if (!plugin) {
      throw new Error(`manifestUrl not found for pluginID ${pluginID}`)
    }
    return plugin.manifestUrl
  }

  /**
  * Triggered when the document for Smartsheet is loaded and available.
  */
  onSmartsheetLoaded () {
  }
}

export default SheetHook
