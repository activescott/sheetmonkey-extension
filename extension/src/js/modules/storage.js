/* global chrome */
'use strict'
import Diag from './diag'
import JwtHelper from './JwtHelper'
import SheetmonkeyUtil from '../background/SheetmonkeyUtil'
import Promisifer from './Promisifier'

const D = new Diag('storage')

const storageSync = Promisifer.promisifyChromeApi(chrome.storage.sync)
const storageLocal = Promisifer.promisifyChromeApi(chrome.storage.local)

class Storage {
  static savePluginUrls (urls) {
    D.log('saving urls', urls)
    let storageData = { manifestUrls: urls }
    return storageSync.setAsync(storageData).then(() => {
      if (chrome.runtime.lastError) { throw (chrome.runtime.lastError) }
      return null
    })
  }

  static loadPluginUrls () {
    const defaultData = { manifestUrls: [] }
    return storageSync.getAsync(defaultData).then(storedData => {
      if (chrome.runtime.lastError) { throw (chrome.runtime.lastError) }
      D.log('loaded urls:', storedData.manifestUrls)
      return storedData.manifestUrls
    })
  }

  /**
  * Saves the specified access token for the specified plugin and user.
  * @param {*string} pluginManifestUrl The plugin's manifest URL.
  * @param {*string} userEmail The email address of the user using the plugin.
  * @param {*string} jwtStr The access token encoded in as a JWT from sheetmonkey-server.
  */
  static saveAccessTokenForPlugin (pluginManifestUrl, userEmail, jwtStr) {
    return JwtHelper.decode(jwtStr).then(claims => {
      if (!('aud' in claims) || claims.aud !== pluginManifestUrl) {
        throw new Error(`received token not designated for this plugin. aud:${claims.aud}, pluginManifestUrl:${pluginManifestUrl}`)
      }
      if (!('prneml' in claims) || claims.prneml !== userEmail) {
        throw new Error('received token ont designated for this user')
      }
      const storageKey = Storage._getAccessTokenStorageKey(pluginManifestUrl, userEmail)
      D.log(`Storing token for plugin ${pluginManifestUrl} and user ${userEmail} using key ${storageKey}`)
      const storageData = {}
      storageData[storageKey] = jwtStr
      return storageLocal.setAsync(storageData).then(() => {
        if (chrome.runtime.lastError) { throw (chrome.runtime.lastError) }
        return null
      })
    })
  }

  static _getAccessTokenStorageKey (pluginManifestUrl, userEmail) {
    return SheetmonkeyUtil.encodeIdent(pluginManifestUrl) + SheetmonkeyUtil.encodeIdent(userEmail)
  }

  /**
  * Retreives the specified access token for the specified plugin and user.
  * NOTE: The returned token is the raw API access token, not the jwt.
  * @param {*} pluginManifestUrl The URL of the manifest for the plugin that will use this token.
  * @param {*} userEmail The email address of the user this token is used for.
  */
  static getAccessTokenForPlugin (pluginManifestUrl, userEmail) {
    const storageKey = Storage._getAccessTokenStorageKey(pluginManifestUrl, userEmail)
    const defaultData = {}
    defaultData[storageKey] = null

    return storageLocal.getAsync(defaultData).then(storedData => {
      if (chrome.runtime.lastError) { throw chrome.runtime.lastError }
      D.log('getAccessTokenForPlugin storedData:', storedData)
      const jwtStr = storedData[storageKey]
      if (!jwtStr) {
        D.error('No value for storageKey "', storageKey, '".')
        return null
      }
      return JwtHelper.decode(jwtStr).then(claims => {
        if (!('aud' in claims) || claims.aud !== pluginManifestUrl) {
          throw new Error(`received token not designated for this plugin. aud:${claims.aud}, pluginManifestUrl:${pluginManifestUrl}`)
        }
        if (!('prneml' in claims) || claims.prneml !== userEmail) {
          throw new Error('received token not designated for this user')
        }
        // if expired, don't bother return it, just act as if it doesn't exist:
        D.log('returning token w/ claims:', claims)
        const expiresAtDate = new Date(claims.expires_at * 1000)
        D.log('Token expires_at:', new Date(expiresAtDate))
        if (expiresAtDate.toString() === 'Invalid Date') {
          D.error('Invalid date claim: ', claims.expires_at)
          return null
        }
        if (expiresAtDate < new Date()) {
          D.error('Found stored token, but it is expired.')
          return null
        }
        return jwtStr
      })
    })
  }
}

export default Storage
