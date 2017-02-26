import Promise from 'bluebird';
import msg from '../modules/msg';
import Storage from '../modules/storage';
import Diag from '../modules/diag.js';

const D = new Diag('bg-script');

D.log('script loaded!');

class Background {
    constructor() {
        const handlers = {
            getRegisteredPlugins: (done) => {
                D.log('getRegisteredPlugins message');
                bg.getRegisteredPluginsImpl().then(pluginRegistry => {
                    D.log('pluginRegistry:', pluginRegistry);
                    done(pluginRegistry);
                });
            }
        };
        this.messenger = msg.init('bg', handlers);        
    }

    /**
     * Returns a promise who will return an array of registered plugins.
     */
    getRegisteredPluginsImpl() {
        return Storage.loadPluginUrls().then(urls => {
            return Promise.map(urls, url => {
                // TODO: wrap xhr in it's own promise func.
                return new Promise((resolve, reject) => {
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", url, true);
                    xhr.onreadystatechange = () => {
                        if (xhr.readyState == 4) {
                            try {
                                let manifest = {};
                                try {
                                    manifest = JSON.parse(xhr.responseText);
                                } catch (e) {
                                    return reject(new Error(`Failed to parse JSON from url '${url}'. Error: ${e}\n Complete response:'${xhr.responseText}'`))
                                }
                                D.log(`Preparing the following manifest from url '${url}':`, JSON.stringify(manifest));
                                let plugin = { };
                                plugin.manifestUrl = url;
                                plugin.baseUrl = Background.parseBaseUrl(url);
                                plugin.manifest = Background.sanitizeManifest(manifest);
                                return resolve(plugin);
                            } catch (e) {
                                return reject(new Error(`Failed to load manifest from url '${url}'. Error:${e}`));
                            }
                        }
                    }
                    xhr.send();
                });
            });
        });
    }

    static sanitizeManifest(manifest) {
        let m = Object.assign({}, manifest);
        m.id = Background.encodeIdent(m.id);
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
            throw new Error('invalid url');
        if (slashIndex == url.length-1)
            return url;
        return url.substring(0, slashIndex+1);
    }

    static encodeIdent(ident) {
        return ident.replace(/[^A-Za-z0-9_\.]/g, '_');
    }
}

const bg = new Background();