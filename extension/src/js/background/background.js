/* global chrome */
'use strict'
import Promise from 'bluebird'
import Storage from '../modules/storage'
import SheetmonkeyUtil from './SheetmonkeyUtil'
import Diag from '../modules/diag'
import $ from 'jquery'
import Constants from '../modules/Constants'
import urlmod from 'url'
import JwtHelper from '../modules/JwtHelper'
import Promisifier from '../modules/Promisifier'

const chromeIdentity = Promisifier.promisifyChromeApi(chrome.identity)

const D = new Diag('bg-script')

D.log('script loaded!')

class Background {
  constructor () {
    this.listenForMessages()
  }

  listenForMessages () {
    this.messageHandlers = {
      getRegisteredPlugins: function getRegisteredPlugins (request, sender, sendResponse) {
        this.getRegisteredPluginsImpl().then(pluginRegistry => {
          D.log('getRegisteredPlugins returning pluginRegistry:', pluginRegistry)
          sendResponse(pluginRegistry)
        })
        return true// this indicates our response is forthcoming...
      },
      /**
       * Provided to the sheetmonkey beta page so that the extension can load all the manifests from urls.
       * Why not in the page? cross-orgin not permitted.
       * Why not in sheetmonkey backend? Because why put the cost on backend to load all the manifests (and cache, etc.).
       */
      loadPluginsFromManifestUrls: function loadPluginsFromManifestUrls (request, sender, sendResponse) {
        console.assert(request && request.hasOwnProperty('sheetmonkey'), 'expected request to have sheetmonkey prop')
        console.assert(request.sheetmonkey.hasOwnProperty('params'), 'expected params')
        console.assert(typeof request.sheetmonkey.params.hasOwnProperty('manifestUrls'), 'expected manifestUrls prop!')
        let urls = request.sheetmonkey.params.manifestUrls
        SheetmonkeyUtil.loadPluginsFromManifestUrls(urls).then(plugins => {
          D.log('extension loadPluginsFromManifestUrls returning:', plugins)
          sendResponse(plugins)
        })
        return true// this indicates our response is forthcoming...
      },
      installPlugin: function installPlugin (request, sender, sendResponse) {
        console.assert(request && request.hasOwnProperty('sheetmonkey'), 'expected request to have sheetmonkey prop')
        console.assert(request.sheetmonkey.hasOwnProperty('params'), 'expected params')
        console.assert(typeof request.sheetmonkey.params.hasOwnProperty('manifestUrl'), 'expected manifestUrls prop!')
        const manifestUrl = request.sheetmonkey.params.manifestUrl
        if (window.confirm(`You are about to install a plugin from '${manifestUrl}'. You should only install plugins from a trusted source. Click OK to install it, or Cancel to cancel installing this plugin.`)) {
          Storage.loadPluginUrls().then(loadedUrls => {
            if (loadedUrls.findIndex(url => url.toLowerCase() === manifestUrl.toLowerCase()) === -1) {
              loadedUrls.push(manifestUrl)
              Storage.savePluginUrls(loadedUrls).then(() => {
                D.log('plugin installed.')
                sendResponse(true)
              })
            } else {
              D.log(`Plugin '${manifestUrl} already installed.`)
              sendResponse(false)
            }
          })
        }
        return true// this indicates our response is forthcoming... (and we want the client to be able to know when we're done so they can refresh)
      },
      uninstallPlugin: function uninstallPlugin (request, sender, sendResponse) {
        console.assert(request && request.hasOwnProperty('sheetmonkey'), 'expected request to have sheetmonkey prop')
        console.assert(request.sheetmonkey.hasOwnProperty('params'), 'expected params')
        console.assert(typeof request.sheetmonkey.params.hasOwnProperty('manifestUrl'), 'expected manifestUrls prop!')
        const manifestUrl = request.sheetmonkey.params.manifestUrl
        if (window.confirm(`Are you sure that you want to uninstall the plugin from '${manifestUrl}'? Click OK to uninstall it, or Cancel to cancel.`)) {
          Storage.loadPluginUrls().then(loadedUrls => {
            const foundIndex = loadedUrls.findIndex(url => url.toLowerCase() === manifestUrl.toLowerCase())
            if (foundIndex >= 0) {
              loadedUrls.splice(foundIndex, 1)
              Storage.savePluginUrls(loadedUrls).then(() => {
                D.log('plugin uninstalledinstalled.')
                sendResponse(true)
              })
            } else {
              D.log(`Plugin '${manifestUrl} not installed.`)
              sendResponse(false)
            }
          })
        }
        return true// this indicates our response is forthcoming...
      },
      launchAuthFlow: function launchAuthFlow (request, sender, sendResponse) {
        D.log('launchAuthFlow:', request, sender)
        // TODO: Get this boilerplate shite out of here:
        D.assert(request && request.hasOwnProperty('sheetmonkey'), 'expected request to have sheetmonkey prop')
        D.assert(request.sheetmonkey.hasOwnProperty('params'), 'expected params')
        D.assert(typeof request.sheetmonkey.params.hasOwnProperty('pluginId'), 'expected pluginId prop!')
        // TODO: DON'T TRUST THIS pluginId WE NEED PLUGINS TO SIGN THEIR REQUESTS TO EXTENSION!
        const pluginId = request.sheetmonkey.params.pluginId
        const scope = ('scope' in request.sheetmonkey.params && request.sheetmonkey.params.scopes) || 'READ_SHEETS'

        // ensure that the pluginId has a apiClientID:
        this.getRegisteredPluginsImpl().then(pluginRegistry => {
          D.log('pluginRegistry:', pluginRegistry)
          const plugin = pluginRegistry.find(p => p.manifest.id === pluginId)
          if (!plugin) {
            throw new Error(`plugin with pluginId "${pluginId}" not found.`)
          }
          if (!plugin.manifest.apiClientID) {
            throw new Error(`plugin with pluginId "${pluginId}" does not have a clientID. Ensure that apiClientID is in the published manifest.`)
          }
          // Get the email address from the tab that sent us this request
          return this.getEmailAddress(sender.tab.id).then(email => {
            /** Launch the auth flow:
             *  We first launch them directly to Smartsheet (https://smartsheet-platform.github.io/api-docs/#request-authorization-from-the-user)
             *  After they auth, they will be redirected to sheetmonkey-server with the code; server exchanges code for a token (using the secret)
             *  sheetmonkey-server then redirects user back to us with the token and we catch the token in the URL below:
             */
            const flowDetails = {
              url: 'https://app.smartsheet.com/b/authorize?' +
              $.param({
                response_type: 'code',
                client_id: plugin.manifest.apiClientID,
                scope: scope,
                state: chrome.i18n.getMessage('@@extension_id')
              }),
              interactive: true
            }
            D.log('flowDetails:', flowDetails)
            return chromeIdentity.launchWebAuthFlowAsync(flowDetails).then(flowResult => {
              D.log('chrome flowResult:', flowResult)
              // flowResult is a URL, parse out the tokenInfo querystring
              const urlFlowResult = urlmod.parse(flowResult, true)
              if (!('tokenInfo' in urlFlowResult.query)) {
                throw new Error('Missing tokenInfo in auth flow result')
              }
              const jwtWithToken = urlFlowResult.query.tokenInfo
              /** jwtWithToken has the following relevant claims in it (as encoded by sheetmonkey-server)
               * - access_token: SS API Access Token
               * - expires_at: Time that the accesstoken expires.
               * - prn: The SS users' User ID for the user who just authorized.
               * - prneml: The SS users' email address for the user who just authorized.
               * - aud: The manifest URL of the plugin that the token is for
              */
              // D.log('jwtWithToken:', jwtWithToken)
              return JwtHelper.decode(jwtWithToken).then(claims => {
                // D.log('claims:', claims)
                return Storage.saveAccessTokenForPlugin(plugin.manifestUrl, email, jwtWithToken).then(() => {
                  // let the plugin know we succeeded. If we didn't, a catch below should be hit and return an object that is `instanceof Error`
                  sendResponse({success: true})
                })
              })
            })
          })
        }).catch(jwtError => {
          D.error('promise error:', jwtError)
          // send an `instanceof Error` object as response
          if (!(jwtError instanceof Error)) {
            jwtError = new Error(jwtError)
          }
          sendResponse(jwtError)
        })
        return true
      }
    }
    // SEE https://developer.chrome.com/extensions/messaging
    chrome.runtime.onMessage.addListener(this.backgroundMessageListener.bind(this))
    chrome.runtime.onMessageExternal.addListener(this.backgroundMessageListener.bind(this))
  }

  getEmailAddress (tabID) {
    return new Promise((resolve, reject) => {
      if (!tabID) reject(new Error('tabID must be specified'))
      chrome.tabs.sendMessage(tabID, {
        sheetmonkey: {
          cmd: Constants.messageGetUserEmail,
          params: {}
        }
      }, response => {
        D.log('response from messageGetUserEmail:', response)
        resolve(response)
      })
    })
  }

  getRedirectUri (pluginId) {
    return chrome.identity.getRedirectURL(pluginId)
  }

  /**
   * Used to listen to chrome extension messages. See https://developer.chrome.com/extensions/messaging
   */
  backgroundMessageListener (request, sender, sendResponse) {
    D.log('backgroundMessageListener request:', request, 'sender:', sender, 'sendResponse:', sendResponse)
    D.log(sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension.')
    if (request && request.sheetmonkey && typeof request.sheetmonkey.cmd === 'string') {
      const cmd = request.sheetmonkey.cmd
      if (!this.messageHandlers.hasOwnProperty(cmd)) {
        D.error(`No handler for sheetmonkey cmd ${cmd}`)
        return
      }
      let handler = this.messageHandlers[cmd]
      return handler.call(this, request, sender, sendResponse)
    }
  }

  /**
   * Returns a promise that will resolve to an array of registered plugins.
   */
  getRegisteredPluginsImpl () {
    return Storage.loadPluginUrls().then(urls => {
      return SheetmonkeyUtil.loadPluginsFromManifestUrls(urls)
    })
  }
}

const bg = new Background()
