'use strict'
import Promise from 'bluebird'
import Diag from './diag'

const D = new Diag('Promisifier')

/**
 * Promisifies chrome.* libraries per http://bluebirdjs.com/docs/api/promise.promisifyall.html#option-promisifier
 */
class Promisifier {
  static promisifyChromeApi (chromeApi) {
    function DOMPromisifier (originalMethod) {
      // return a function
      return function promisified () {
        let args = [].slice.call(arguments)
        // D.log('arguments:', arguments)
        // D.log('args:', args)
        // Needed so that the original method can be called with the correct receiver
        let self = this
        // which returns a promise
        return new Promise(function (resolve, reject) {
          args.push(resolve) // at least for StorageArea chrome doesn't like reject so we dropped it: args.push(resolve, reject)
          originalMethod.apply(self, args)
        })
      }
    }
    return Promise.promisifyAll(chromeApi, {promisifier: DOMPromisifier})
  }
}

export default Promisifier
