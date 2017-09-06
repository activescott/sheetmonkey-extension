/* global chrome */
'use strict'
import base64url from 'base64url'
import jsrsasign from 'jsrsasign'
import Xhr from './Xhr'

class JwtHelper {
  /**
   * Returns a promise of true if the specified JWT is valid
   * @param {*string} jwtStr The JWT as a string.
   */
  static verify (jwtStr) {
    if (!jwtStr || jwtStr.length === 0) {
      Promise.reject(new Error('jwtStr arg required'))
    }
    return JwtHelper.readCertAsString().then(crt => {
      var isValid = jsrsasign.jws.JWS.verify(jwtStr, crt, ['RS256'])
      if (!isValid) { throw new Error('invalid jwt signature') }
      return jwtStr
    })
  }

  static readCertAsString () {
    const crtUrl = chrome.extension.getURL('data/sheetmonkey-server-pub.crt')
    return Xhr.get(crtUrl)
  }

  /**
   * Returns a promise of the decoded payload of claims as an object where claim names are the keys and values are the values.
   * @param {*string} jwtStr The JWT as a string.
   */
  static decode (jwtStr) {
    return JwtHelper.verify(jwtStr).then(() => {
      const parts = jwtStr.split('.')
      if (parts.length !== 3) {
        throw new Error(`invalid number of parts (${parts.length}) for jwt`)
      }
      const decodedStr = base64url.decode(parts[1])
      const decoded = JSON.parse(decodedStr)
      return decoded
    })
  }
}

export default JwtHelper
