'use strict'
import Promise from 'bluebird'
import Diag from '../modules/diag'
import Xhr from '../modules/Xhr'

const D = new Diag('SheetmonkeyUtil')

/**
 * A set of plugin utilities that are shared across the various Sheetmonkey components including the extension and server.
 */
class SheetmonkeyUtil {
  /**
   * Given a set of Plugin manifest URLs, returns a set of plugin objects with the manifest details.
   * @param {*array} pluginManifestUrls
   */
  static loadPluginsFromManifestUrls (pluginManifestUrls) {
    return Promise.map(pluginManifestUrls, url => {
      return Xhr.getJSON(url).catch(e => {
        // NOTE: Just log and ignore, don't don't throw. We'll recover by adding a null into the promise chain
        D.error(`Failed to get JSON manifest from url '${url}'. Error: ${e}`)
        return null
      }).then(manifest => {
        D.log(`Preparing the following manifest from url '${url}':`, JSON.stringify(manifest))
        if (!manifest) { return null }// nulls filtered out in promise chain
        let plugin = {}
        plugin.manifestUrl = url
        plugin.baseUrl = SheetmonkeyUtil.parseBaseUrl(url)
        plugin.manifest = SheetmonkeyUtil.sanitizeManifest(url, manifest)
        return plugin
      })
    }).then(plugins => {
      return plugins.filter(p => p != null)
    })
  }

  static sanitizeManifest (url, manifest) {
    let m = Object.assign({}, manifest)
    m.id = SheetmonkeyUtil.encodeIdent(url)
    if (m.commands) {
      m.commands = m.commands.map(c => {
        return {
          kind: c.kind,
          id: SheetmonkeyUtil.encodeIdent(c.id),
          label: c.label
        }
      })
    }
    return m
  }

  static parseBaseUrl (url) {
    let slashIndex = url.lastIndexOf('/')
    if (slashIndex < 0) { throw new Error('invalid url:' + url) }
    if (slashIndex === url.length - 1) { return url }
    return url.substring(0, slashIndex + 1)
  }

  static encodeIdent (ident) {
    return ident.replace(/[^A-Za-z0-9]/g, '_')
  }
}

export default SheetmonkeyUtil
