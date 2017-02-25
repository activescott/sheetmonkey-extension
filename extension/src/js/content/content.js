import Promise from 'bluebird';
import $ from 'jquery';
import msg from '../modules/msg';
import handlers from './msghandlers.js'
import AccountSheetHook from './accountSheetHook.js';
import PluginHost from './pluginHost.js';
import Diag from '../modules/diag.js';

const D = new Diag('contentscript');
var pluginHost = null;
var sheetHooks = null;

D.log('SheetMonkey content script loaded.');

const messenger = msg.init('content', handlers.create('content'));

initPlugins();

function initPlugins() {
    D.log('initPlugins...');
    // load plugins from background:
    messenger.bg('getRegisteredPlugins', registeredPlugins => {
        D.log('getRegisteredPlugins result:', registeredPlugins);
        // host the plugins inside the app's window (as iframes).
        pluginHost = new PluginHost(document, registeredPlugins);
        // hook into SS DOM to start routing events to hosted plugins:
        sheetHooks = initSheetHooks(registeredPlugins);
    });
    D.log('initPlugins complete.');
}

function initSheetHooks(registeredPlugins) {
    return [
        new AccountSheetHook(pluginHost, registeredPlugins, document)
    ];
}
