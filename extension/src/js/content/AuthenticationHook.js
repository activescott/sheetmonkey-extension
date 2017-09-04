'use strict'
/* global chrome */
import SheetHook from './SheetHook.js'
import Diag from '../modules/diag.js'
import Constants from '../modules/Constants.js'
import Promise from 'bluebird'

const D = new Diag('AuthenticationHook')

class AuthenticationHook extends SheetHook {
  onSmartsheetLoaded () {
    window.addEventListener('message', this.receiveMessage.bind(this), false)
  }

  receiveMessage (event) {
    D.log('receiveMessage! eventType:', event.data && event.data.hasOwnProperty('eventType') ? event.data.eventType : '<none>', 'event:', event)
    let msg = event.data
    if (msg.eventType === Constants.messageLaunchAuthFlow) {
      D.assert(msg.pluginId, 'Expected pluginId on message!')
      if (msg.pluginId) {
        return this.launchAuthFlow(msg.pluginId).then(authInfo => {
          D.log('authInfo:', authInfo)
          if (!authInfo) authInfo = {}
          authInfo.eventType = Constants.messageLaunchAuthFlowResponse
          this.pluginHost.postMessageToPlugin(msg.pluginId, authInfo)
        })
      }
    }
  }

  /**
   * Starts the SS OAuth flow for the specified plugin
   */
  launchAuthFlow (pluginId) {
    return new Promise((resolve, reject) => {
      // send it to background so background can do the actual authflow with chrome:
      chrome.runtime.sendMessage({
        sheetmonkey: {
          cmd: 'launchAuthFlow',
          params: {
            pluginId: pluginId
          }
        }
      }, response => {
        D.log('response from launchAuthFlow:', response)
        resolve(response)
      })
    })
  }
}

export default AuthenticationHook
