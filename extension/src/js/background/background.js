import Promise from 'bluebird'
import Storage from '../modules/storage'
import SheetmonkeyUtil from './SheetmonkeyUtil'
import Diag from '../modules/diag.js'

const D = new Diag('bg-script')

D.log('script loaded!')

class Background {
  constructor() {
    this.listenForMessages()
  }

  listenForMessages() {
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
            if (loadedUrls.findIndex(url => url.toLowerCase() == manifestUrl.toLowerCase()) === -1) {
              loadedUrls.push(manifestUrl)
              Storage.savePluginUrls(loadedUrls).then(() => {
                D.log('plugin installed.')
                sendResponse(true)
              })
            } else {
              D.log(`Plugin '${manifestUrl} already installed.`)
              sendResponse(false) 
            }
          });
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
            const foundIndex = loadedUrls.findIndex(url => url.toLowerCase() == manifestUrl.toLowerCase())
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
          });
        }
        return true// this indicates our response is forthcoming...
      }
    }
    // SEE https://developer.chrome.com/extensions/messaging
    chrome.runtime.onMessage.addListener(this.backgroundMessageListener.bind(this))
    chrome.runtime.onMessageExternal.addListener(this.backgroundMessageListener.bind(this))
  }
  
  /**
   * Used to listen to chrome extension messages. See https://developer.chrome.com/extensions/messaging
   */
  backgroundMessageListener (request, sender, sendResponse) {
    console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension")
    D.log('backgroundMessageListener request:', request, 'sender:', sender, 'sendResponse:', sendResponse)
    if (request && request.sheetmonkey && typeof request.sheetmonkey.cmd === 'string') {
      const cmd = request.sheetmonkey.cmd
      if (!this.messageHandlers.hasOwnProperty(cmd)) {
        d.error(`No handler for sheetmonkey cmd ${cmd}`)
        return
      }
      let handler = this.messageHandlers[cmd]
      return handler.call(this, request, sender, sendResponse)
    }
  }

  /**
   * Returns a promise that will resolve to an array of registered plugins.
   */
  getRegisteredPluginsImpl() {
    return Storage.loadPluginUrls().then(urls => {
      return SheetmonkeyUtil.loadPluginsFromManifestUrls(urls)
    })
  }
}

const bg = new Background()
