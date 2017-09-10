/* global XMLHttpRequest */
'use strict'
import Diag from './diag'

const D = new Diag('Xhr')

class Xhr {
  /**
   * Returns JSON from the specified URL as a promise.
   */
  static getJSON (url) {
    return Xhr.get(url).then(responseText => {
      try {
        let parsed = JSON.parse(responseText)
        return parsed
      } catch (e) {
        throw new Error(`Failed to parse JSON from url '${url}'. Error: ${e}\n Response was: '${responseText}'`)
      }
    })
  }

  static get (url) {
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)
      xhr.onload = () => resolve(xhr.responseText)
      xhr.onerror = () => reject(xhr.statusText)
      xhr.send()
    })
  }

  /**
   * Promisified http request that allows specifying the request method.
   * @param {*string} httpMethod HTTP method to use
   * @param {*} url The URL to send the HTTP request to.
   * @param {*} headers A hash of request headers to send with the request
   * @param {*} data If a post, the data to send with the request.
   */
  static request (httpMethod, url, headers, data) {
    return new Promise((resolve, reject) => {
      D.log('request (', httpMethod, url, headers, data, ')')
      var xhr = new XMLHttpRequest()
      xhr.open(httpMethod, url, true)
      headers = headers || {}
      Object.getOwnPropertyNames(headers).forEach(key => xhr.setRequestHeader(key, headers[key]))
      xhr.onload = () => resolve(xhr.responseText)
      xhr.onerror = () => reject(xhr.statusText)
      if (data) xhr.send(data)
      else xhr.send()
    })
  }
}

export default Xhr
