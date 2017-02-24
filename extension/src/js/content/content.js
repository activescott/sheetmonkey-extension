import Promise from 'bluebird';
import $ from 'jquery';
import msg from '../modules/msg';
import handlers from './msghandlers.js'
import AccountSheetHook from './accountSheetHook.js';

console.log('SheetMonkey content script loaded.'); // eslint-disable-line no-console

const messenger = msg.init('content', handlers.create('content'));
var sheetHooks = null; //just to keep them alive

initPlugins();

function initPlugins() {
    console.log('initPlugins...');
    /**
     * - load plugin URLs from background task - send a message and get back json
    */
    messenger.bg('getRegisteredPlugins', registeredPlugins => {
        console.log('getRegisteredPlugins result:', registeredPlugins);
        hostPlugins(registeredPlugins);
        // this initializes initSheetHooks that do all the work of hooking the SS DOM:
        sheetHooks = initSheetHooks(registeredPlugins);
    });
    console.log('initPlugins complete.');
}

function hostPlugins(registeredPlugins) {
    // For each plugin:
    for (var plugin of registeredPlugins) {
        // Get script urls (and other plugin detail)
        console.log('found plugin', plugin.manifest.id, 'at', plugin.manifestUrl, 'with baseUrl', plugin.baseUrl);
        
        /*
        *  - Create a sandboxed iframe element
        *      - Attributes:
        *          - Add SheetMonkeyPluginHost class
        *          - Add data-sheetmonkey-pluginid=...
        */
        /** srcdoc references:
         * - https://html.spec.whatwg.org/multipage/embedded-content.html#attr-iframe-srcdoc
         * - https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-srcdoc
         */
        var scriptTags = plugin.manifest.scripts.map(s => `<script src=${plugin.baseUrl + s}></script>`).join('\n');
        var srcDoc = `<html>${scriptTags}</html>`;
        console.log('srcDoc:', srcDoc);
        let iframe = $('<iframe sandbox="allow-scripts allow-modals allow-popups allow-forms" style="display:none"></iframe>');
        iframe.attr('id', `sheetmonkey_${plugin.manifest.id}`);
        iframe.attr('data-sheetmonkey-pluginid', plugin.manifest.id);
        iframe.attr('srcdoc', srcDoc);
        iframe.appendTo($('body'));
        /*
        *      - inject html/doc into iframe doc that includes:
        *          - SheetMonkeyHost js
        *          - JS module from the manifest's specified script
        *          - 
        *          
        *  - Start posting messages frame to route events to plugin:
        *      - Find frame for plugin.
        *      - postMessage
        * 
        * - SheetMonkeyHost TODO:
        *  - Needs to be able to respond to postmessages coming into the iframe and route them to plugin's handler as specified in manifest.
        *  - Content script needs to know how to 
        */
    }
}

function initSheetHooks(registeredPlugins) {
    let ctx = {
        document: document,
        plugins: registeredPlugins
    };
    return [
        new AccountSheetHook(ctx)
    ];
}
