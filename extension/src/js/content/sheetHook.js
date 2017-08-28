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

  /**
  * Triggered when the document for Smartsheet is loaded and available.
  */
  onSmartsheetLoaded () {
  }
}

export default SheetHook
