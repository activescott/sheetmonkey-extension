/* global chrome */
'use strict'
import SheetHook from './SheetHook.js'
import Diag from '../modules/diag.js'
import Constants from '../modules/Constants.js'
import DomUtil from '../modules/DomUtil.js'

const D = new Diag('GetUserEmailSheetHook')

class GetUserEmailSheetHook extends SheetHook {
  onSmartsheetLoaded () {
    // window.addEventListener('message', this.receiveBrowserMessage.bind(this), false)
    chrome.runtime.onMessage.addListener(this.receiveExtensionMessage.bind(this))
  }

  receiveBrowserMessage (event) {
    D.log('receiveBrowserMessage:', event)
    // NOTE: don't responde here because then any plugin could get email address of user!
  }

  receiveExtensionMessage (request, sender, sendResponse) {
    D.log('receiveExtensionMessage', request, sender)
    if (request && request.sheetmonkey && typeof request.sheetmonkey.cmd === 'string') {
      const cmd = request.sheetmonkey.cmd
      if (cmd === Constants.messageGetUserEmail) {
        this.getUserEmail().then(sendResponse)
        return true
      }
    }
  }

  getUserEmail () {
    return Promise.try(() => {
      // we're pulling email from bottom left corner (alternatively we could get it from Sign-out menu too):
      return DomUtil.lazyQuerySelector('div.clsDesktopFooter.clsTextOnDesktopColor > div:first-child').then(div => {
        return div.innerText
      })
    })
  }
}

export default GetUserEmailSheetHook
