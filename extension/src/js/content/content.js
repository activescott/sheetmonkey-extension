import Promise from 'bluebird';
import $ from 'jquery';
import msg from '../modules/msg';
import AccountSheetHook from './accountSheetHook.js';
import ContainerInfoProviderHook from './containerInfoProviderHook.js';
import PluginHost from './pluginHost.js';
import Diag from '../modules/diag.js';

const D = new Diag('contentscript');
var pluginHost = null;
var sheetHooks = null;

D.log('SheetMonkey content script loaded.');

const messenger = msg.init('content', { });

initPlugins();

function initPlugins() {
    // load plugins from background:
    messenger.bg('getRegisteredPlugins', registeredPlugins => {
        // host the plugins inside the app's window (as iframes).
        pluginHost = new PluginHost(document, registeredPlugins);
        // hook into SS DOM to start routing events to hosted plugins:
        sheetHooks = initSheetHooks(registeredPlugins);
    });
}

function initSheetHooks(registeredPlugins) {
    return [
        new AccountSheetHook(pluginHost, registeredPlugins, document),
        new ContainerInfoProviderHook(pluginHost, registeredPlugins, document)
    ];
}
