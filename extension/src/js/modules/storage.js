import Promise from 'bluebird';
import Diag from '../modules/diag';

const D = new Diag('storage');

class Storage {
    static savePluginUrls(urls) {
        return new Promise((resolve, reject) => { 
            D.log('saving urls', urls);
            let storageData = { manifestUrls: urls };
            chrome.storage.sync.set(storageData, () => {
                if (chrome.runtime.lastError)
                    return reject(chrome.runtime.lastError);
                return resolve();
            });
        });
    }

    static loadPluginUrls() {
        return new Promise((resolve, reject) => {
            const defaultData = { manifestUrls: [] };
            chrome.storage.sync.get(defaultData, (storedData) => {
                if (chrome.runtime.lastError)
                    return reject(chrome.runtime.lastError);
                D.log('loaded urls:', storedData.manifestUrls);
                return resolve(storedData.manifestUrls);
            });
        });
    }
}

export default Storage;