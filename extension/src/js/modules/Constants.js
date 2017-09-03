
class Constants {
  static get SheetMonkeyHostScriptPath () {
    return 'js/sheetMonkeyHost.js'
  }
  static get commandClassName () {
    return 'sheetMonkeyCmd'
  }
  static get account_menu () { // eslint-disable-line camelcase
    return 'account_menu'
  }
  static get cell_context_menu () { // eslint-disable-line camelcase
    return 'cell_context_menu'
  }
  static get messageGetContainerID () {
    return 'messageGetContainerID'
  }
  static get messageGetContainerIDResponse () {
    return 'messageGetContainerIDResponse'
  }
  static get messageGetSelectionInfo () {
    return 'messageGetSelectionInfo'
  }
  static get messageGetSelectionInfoResponse () {
    return 'messageGetSelectionInfoResponse'
  }
  static get messageLaunchAuthFlow () {
    return 'messageLaunchAuthFlow'
  }
  static get messageLaunchAuthFlowResponse () {
    return 'messageLaunchAuthFlowResponse'
  }
  /** Sent by background to contentscript to get active users' email */
  static get messageGetUserEmail () {
    return 'messageGetUserEmail'
  }
}

export default Constants
