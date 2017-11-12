'use strict'/* globals MutationObserver */
import { Promise, TimeoutError, CancellationError } from 'bluebird'
import Diag from './diag.js'

const D = new Diag('DomUtil')

class DomUtil {
  /**
   * Monitors the DOM for elements that match the specified query. If/when the query has a match the Promise will be resolved with the matching nodes.
   * @param {*Array} queries An array of string queries or a string query that can be fed to docuemnt.querySelector to find the desired nodes. If there is more than one element in the array any of the queries that succeed will fulfill and resolve the promise.
   */
  static lazyQuerySelector (queries, timeoutInMs) {
    if (typeof queries === 'string') {
      queries = [queries]
    }
    let observer
    return new Promise((resolve, reject) => {
      let queryResolved = false
      function execQuery (observer) {
        if (queryResolved) {
          // Don't keep trying to process if we've already resolved the caller's query.
          return
        }
        // run our query to see if the node appeared:
        for (let query of queries) {
          let found = document.querySelector(query)
          if (found) {
            D.log(`Found items for query ${query} selector items:`, found)
            queryResolved = true
            if (observer) {
              observer.disconnect()
            }
            D.log('resolving lazyQuerySelector for queries:', queries)
            resolve(found)
            return true
          }
        }
        return false
      }
      observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          // D.log('observer:', mutation)
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            execQuery()
          }
        })
      })
      // do the query once rightaway to see if the elements already exist before we even start the observer:
      if (!execQuery(null)) {
        observer.observe(document, { childList: true, subtree: true })
      }
    })
    .timeout(1000)
    .catch(e => {
      if (observer) {
        observer.disconnect()
        observer = null
        if (e.name !== 'TimeoutError') {
          D.error(`Cancelled observer due to unexpected error:`, e)
        }
      }
    })
  }
}

export default DomUtil
