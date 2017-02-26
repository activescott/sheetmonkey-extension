import Promise from 'bluebird';
import $ from 'jquery';
import Constants from '../modules/Constants.js';
import Diag from '../modules/diag.js';

const D = new Diag('PluginHost');

class PluginHost {
    constructor(document, plugins) {
        if (document == null)
            throw new Error('document must be provided');
        if (plugins == null)
            throw new Error('plugins must be provided');
        this._document = document;
        this._plugins = plugins;
        this.hostPlugins();
    }

    get doc() {
        return this._document;
    }

    get plugins() {
        return this._plugins;
    }

    hostPlugins() {
        for (var plugin of this.plugins) {
            D.log('found plugin', plugin.manifest.id, 'at', plugin.manifestUrl, 'with baseUrl', plugin.baseUrl);
            // Now we build out a sandboxed iframe element for the plugin:
            // Get plugin script urls (and other plugin detail)
            var urls = [chrome.runtime.getURL(Constants.SheetMonkeyHostScriptPath)];
            urls = urls.concat(plugin.manifest.scripts.map(s => plugin.baseUrl + s));
            // Add the SheetMonkey script URL:
            
            // note: relying on jquery to safely encode all these unsafe strings
            let scripts = urls.map(u => $('<script>').attr('src', u));
            let html = $('<html>').append(scripts);
            let srcDoc = html.prop('outerHTML');
            D.log('srcDoc:', srcDoc);
            let iframe = $('<iframe sandbox="allow-scripts allow-modals allow-popups allow-forms allow-popups-to-escape-sandbox" style="display:none"></iframe>');
            iframe.attr('id', `sheetmonkey_${plugin.manifest.id}`);
            iframe.attr('data-sheetmonkey-pluginid', plugin.manifest.id);
            iframe.attr('srcdoc', srcDoc);
            iframe.appendTo($('body'));
        }
    }

    getPluginFrame(pluginId) {
        //TODO: ensure pluginId is encoded! - This encoding/safe id values needs to be done in background before they ever get to content. They should be safe for attribute values
        let frame = $(`iframe[data-sheetmonkey-pluginid="${pluginId}"]`);
        D.assert(frame.length == 1, 'expected exactly one plugin host!');
        return frame.first();
    }

    postMessageToPlugin(pluginId, message) {
        let f = this.getPluginFrame(pluginId);
        D.log('pluginFrame:', f);
        //https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
        let window = f.prop('contentWindow');
        D.log('window:', window);
        const targetOrigin = '*';
        window.postMessage(message, targetOrigin);
    }

    notifyCommandClicked(pluginId, commandId) {
        const msg = {
            eventType: 'command_click',
            pluginId: pluginId,
            commandId: commandId
        };
        this.postMessageToPlugin(pluginId, msg);
    }
}

export default PluginHost;