/* global chrome */
'use strict'
import SheetHook from './SheetHook'
import Diag from '../modules/diag'
import Constants from '../modules/Constants'
import Xhr from '../modules/Xhr'
import Storage from '../modules/storage'
import GetUserEmailSheetHook from './GetUserEmailSheetHook'

const D = new Diag('ApiRequestSheetHook')

class ApiRequestSheetHook extends SheetHook {
  onSmartsheetLoaded () {
    window.addEventListener('message', this.receiveMessage.bind(this), false)
  }

  receiveMessage (event) {
    // D.log('receiveMessage! eventType:', event.data && event.data.hasOwnProperty('eventType') ? event.data.eventType : '<none>', 'event:', event)
    let msg = event.data
    if (msg.eventType === Constants.messageApiRequest) {
      D.assert(msg.pluginID, 'Expected pluginID on message!')
      if (msg.pluginID) {
        return this.apiRequest(msg).then(apiResponse => {
          // D.log('apiResponse:', apiResponse)
          if (!apiResponse) apiResponse = {}
          const responseMessage = {
            eventType: Constants.messageApiRequestResponse,
            response: apiResponse
          }
          this.pluginHost.postMessageToPlugin(msg.pluginID, responseMessage)
        })
      }
    }
  }

  getUserEmail () {
    // HACK: no good way to communicate between SheetHooks right now.
    const hook = new GetUserEmailSheetHook(this.pluginHost, this.plugins, this.doc)
    return hook.getUserEmail()
  }

  getAccessTokenForPlugin (pluginID) {
    return this.getUserEmail().then(userEmail => {
      const manifestUrl = this.getPluginManifestUrlFromID(pluginID)
      return Storage.getAccessTokenForPlugin(manifestUrl, userEmail)
      .then(token => {
        if (token) {
          return token
        }
        D.log('Authorization token not found. Attempting auth flow...')
        return this.launchAuthFlow(pluginID).then(authResponse => {
          D.log('authResponse:', authResponse)
          if (authResponse.success) {
            // now it should be saved, so try again...
            return Storage.getAccessTokenForPlugin(manifestUrl, userEmail)
          } else {
            throw new Error('Authorization flow for plugin failed')
          }
        })
      })
    })
  }

  /**
   * Starts the SS OAuth flow for the specified plugin
   */
  launchAuthFlow (pluginID) {
    return new Promise((resolve, reject) => {
      // send it to background so background can do the actual authflow with chrome:
      chrome.runtime.sendMessage({
        sheetmonkey: {
          cmd: 'launchAuthFlow',
          params: {
            pluginID: pluginID
          }
        }
      }, response => {
        D.log('response from launchAuthFlow:', response)
        resolve(response)
      })
    })
  }

  apiRequest (message) {
    ['pluginID', 'method', 'path'].forEach(p => {
      if (!(p in message)) throw new Error(`Expected message to have property ${p}`)
    })
    return this.getAccessTokenForPlugin(message.pluginID).then(accessToken => {
      if (!accessToken) {
        throw new Error('failed to get access token for plugin "', message.pluginID, '".')
      }
      let headers = {
        'Authorization': `Bearer ${accessToken}`
      }
      const BASE_URL = 'https://beta.sheetmonkey.com/api/ssapiproxy'
      let url
      if (message.path.startsWith('http')) {
        url = message.path
      } else {
        if (message.path.startsWith('/')) {
          url = BASE_URL + message.path
        } else {
          url = BASE_URL + '/' + message.path
        }
      }
      return Xhr.request(message.method, url, headers, message.data).then(responseText => {
        // D.log('API responseText:', responseText)
        // API always returns json, so parse it here:
        try {
          let parsed = JSON.parse(responseText)
          return parsed
        } catch (e) {
          throw new Error(`Failed to parse JSON from url '${url}'. Error: ${e}\n Response was: '${responseText}'`)
        }
      })
    })
  }
}

export default ApiRequestSheetHook
