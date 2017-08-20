import Promise from 'bluebird';
import Storage from '../modules/storage';
import Diag from '../modules/diag.js';

const D = new Diag('bg-script');

D.log('script loaded!');

class Background {
  constructor() {
    this.listenForMessages()
  }

  listenForMessages() {
    this.messageHandlers = {
      getRegisteredPlugins: function (request, sender, sendResponse) {
        D.log('request:', request, 'sender:', sender, 'sendResponse:', sendResponse)
        this.getRegisteredPluginsImpl().then(pluginRegistry => {
          D.log('getRegisteredPlugins returning pluginRegistry:', pluginRegistry);
          sendResponse(pluginRegistry);
        })
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
      return Promise.map(urls, url => {
        return Background.xhrGetJSON(url).catch(e => {
          // NOTE: Just log and ignore, don't don't throw. We'll recover by adding a null into the promise chain
          D.error(`Failed to get JSON manifest from url '${url}'. Error: ${e}`);
          return null;
        }).then(manifest => {
          D.log(`Preparing the following manifest from url '${url}':`, JSON.stringify(manifest));
          if (!manifest)
            return null;// nulls filtered out in promise chain
          let plugin = {};
          plugin.manifestUrl = url;
          plugin.baseUrl = Background.parseBaseUrl(url);
          plugin.manifest = Background.sanitizeManifest(url, manifest);
          return plugin;
        });
      }).then(plugins => {
        return plugins.filter(p => p != null);
      });
    });
  }

  /**
   * Returns JSON from the specified URL as a promise.
   */
  static xhrGetJSON(url) {
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) {
          if (xhr.status < 200 || xhr.status >= 300)
            return reject(new Error(`Server at url '${url}' returned error status '${xhr.status}'. StatusText: '${xhr.statusText}'`));
          try {
            return resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            return reject(new Error(`Failed to parse JSON from url '${url}'. Error: ${e}\n Response was: '${xhr.responseText}'`))
          }
        }
      }
      xhr.send();
    });
  }

  static sanitizeManifest(url, manifest) {
    let m = Object.assign({}, manifest);
    m.id = Background.encodeIdent(url);
    if (m.commands) {
      m.commands = m.commands.map(c => {
        return {
          kind: c.kind,
          id: Background.encodeIdent(c.id),
          label: c.label
        }
      });
    }
    return m;
  }

  static parseBaseUrl(url) {
    let slashIndex = url.lastIndexOf('/');
    if (slashIndex < 0)
      throw new Error('invalid url:' + url);
    if (slashIndex == url.length - 1)
      return url;
    return url.substring(0, slashIndex + 1);
  }

  static encodeIdent(ident) {
    return ident.replace(/[^A-Za-z0-9_\.]/g, '_');
  }
}

const bg = new Background();