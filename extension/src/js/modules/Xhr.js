/* global XMLHttpRequest */
'use strict'

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
}

export default Xhr
