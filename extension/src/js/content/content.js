import Promise from 'bluebird';
import $ from 'jquery';
import msg from '../modules/msg';
import handlers from './msghandlers.js'
import AccountCommandManager from './accountCommandManager.js';

console.log('SheetMonkey content script loaded.'); // eslint-disable-line no-console

const messenger = msg.init('ct', handlers.create('content'));

const sheetMonkeyPlugins = [
    {
        id: 'ssfj',
        commands: [
            {
                kind: 'account_menu',
                id: 'launchwindow',
                label: 'Smartsheet for JIRA'
            }
        ]
    }
];

function initManagers() {
    let ctx = {
        document: document,
        plugins: sheetMonkeyPlugins
    };
    return [
        new AccountCommandManager(ctx)
    ];
}

// this initializes managers that do all the work of hooking the SS DOM:
const managers = initManagers();


function hostPlugin() {
    //http://localhost:8000/ssfjmanifest.json
    /**
     * - load plugin URLs from background task - send a message and get back json
     * - For each plugin:
     *  - Get script urls
     *  - Create a sandboxed iframe element
     *      - Attributes:
     *          - Add SheetMonkeyPluginHost class
     *          - Add data-sheetmonkey-pluginid=...
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


$( () => {
    console.log('DOM loaded, now waiting to initialize plugins...');
});
