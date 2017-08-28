'use strict'/* global chrome */
import AccountMenuSheetHook from './AccountMenuSheetHook.js'
import CellContextMenuSheetHook from './CellContextMenuSheetHook.js'
import ContainerInfoProviderHook from './containerInfoProviderHook.js'
import PluginHost from './pluginHost.js'
import Diag from '../modules/diag.js'

const D = new Diag('contentscript')
var pluginHost = null
var sheetHooks = null // eslint-disable-line no-unused-vars

D.log('SheetMonkey content script loaded.')

initPlugins()

function initPlugins () {
  // load plugins from background page:
  chrome.runtime.sendMessage({
    sheetmonkey: {
      cmd: 'getRegisteredPlugins'
    }
  }, response => {
    D.log('response from getResigeredPlugins:', response)
    const registeredPlugins = response
      // host the plugins inside the app's window (as iframes).
    pluginHost = new PluginHost(document, registeredPlugins)
      // hook into SS DOM to start routing events to hosted plugins:
    sheetHooks = initSheetHooks(registeredPlugins)
  }
  )
}

function initSheetHooks (registeredPlugins) {
  return [
    new AccountMenuSheetHook(pluginHost, registeredPlugins, document),
    new CellContextMenuSheetHook(pluginHost, registeredPlugins, document),
    new ContainerInfoProviderHook(pluginHost, registeredPlugins, document)
  ]
}
