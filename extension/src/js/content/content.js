'use strict' /* global chrome */
import AccountMenuSheetHook from './AccountMenuSheetHook.js'
import CellContextMenuSheetHook from './CellContextMenuSheetHook.js'
import ContainerInfoProviderHook from './containerInfoProviderHook.js'
import AuthenticationHook from './AuthenticationHook'
import PluginHost from './pluginHost.js'
import Diag from '../modules/diag.js'
import Constants from '../modules/Constants.js'
import DomUtil from '../modules/DomUtil.js'

const D = new Diag('contentscript')
var pluginHost = null
var sheetHooks = null // eslint-disable-line no-unused-vars

D.log('SheetMonkey content script loaded.')

initPlugins()
listenForMessages()

function initPlugins () {
  // load plugins from background page:
  chrome.runtime.sendMessage({
    sheetmonkey: {
      cmd: 'getRegisteredPlugins'
    }
  }, response => {
    D.log('response from getRegisteredPlugins:', response)
    const registeredPlugins = response
      // host the plugins inside the app's window (as iframes).
    pluginHost = new PluginHost(document, registeredPlugins)
      // hook into SS DOM to start routing events to hosted plugins:
    sheetHooks = initSheetHooks(registeredPlugins)
  })
}

function listenForMessages () {
  D.log('listenForMessages...')
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    D.log('onMessage, sender:', sender)
    if (request && request.sheetmonkey && typeof request.sheetmonkey.cmd === 'string') {
      const cmd = request.sheetmonkey.cmd
      if (cmd === Constants.messageGetUserEmail) {
        getUserEmail().then(sendResponse)
        return true
      }
    }
  })
}

function getUserEmail () {
  return Promise.try(() => {
    // we're pulling email from bottom left corner (alternatively we could get it from Sign-out menu too):
    return DomUtil.lazyQuerySelector('div.clsDesktopFooter.clsTextOnDesktopColor > div:first-child').then(div => {
      return div.innerText
    })
  })
}

function initSheetHooks (registeredPlugins) {
  return [
    new AccountMenuSheetHook(pluginHost, registeredPlugins, document),
    new CellContextMenuSheetHook(pluginHost, registeredPlugins, document),
    new ContainerInfoProviderHook(pluginHost, registeredPlugins, document),
    new AuthenticationHook(pluginHost, registeredPlugins, document)
  ]
}
