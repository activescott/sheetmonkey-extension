/*
SheetMonkeyHost.init(
    {
        commandHandler: myCommandHandler
    }
);
*/
function myCommandHandler(cmdInfo) {
    assert(cmdInfo);
    console.log(cmdInfo.eventType);
    console.log(cmdInfo.pluginId);
    console.log(cmdInfo.commandId);
}
console.log('hi from plugin!');
alert('hi from plugin!');