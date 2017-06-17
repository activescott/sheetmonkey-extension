import Promise from 'bluebird';

class DomUtil {
  /**
   * Returns a Promise of the result of the specified DOM query.
   * @param {*Array} queries An array of string queries or a string query that can be fed to docuemnt.querySelector to find the desired nodes. If there is more than one element in the array any of the queries that succeed will fulfill and resolve the promise.
   */
  static lazyQuerySelector(queries) {
    if (typeof queries == 'string')
      queries = [queries];
    return new Promise((resolve, reject) => {
      var queryResolved = false;
      function execQuery(observer) {
        if (queryResolved) // Don't keep trying to process if we've already resolved the caller's query.
          return;
        //run our query to see if the node appeared:
        for (var query of queries) {
          let found = document.querySelector(query);
          if (found) {
            queryResolved = true;
            if (observer)
              observer.disconnect();
            resolve(found);
            return true;
          }
        }
        return false;
      }
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          //console.log('observer:', mutation);
          if (mutation.type == 'childList' && mutation.addedNodes.length > 0) {
            execQuery();
          }
        });
      });
      // do the query once rightaway to see if the elements already exist before we even start the observer:
      if (!execQuery(null)) {
        observer.observe(document, { childList:true, subtree:true });
      }
    });
  }
}

export default DomUtil;