SheetMonkeyHost.init(
    {
        pluginId: "smartsheetforjira",
        commandHandler: myCommandHandler
    }
);

function myCommandHandler(cmdInfo) {
    console.assert(cmdInfo);
    console.log('ssfj commandHandler!', cmdInfo);
    switch(cmdInfo.commandId) {
        case 'launchwindow':
            window.open('https://connectors.smartsheet.com/c/jira');
        break;
    }
}
console.log('hi from plugin!');
