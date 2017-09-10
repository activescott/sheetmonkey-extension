
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
  /** Sent by background to contentscript to get active users' email */
  static get messageGetUserEmail () {
    return 'messageGetUserEmail'
  }
  static get messageApiRequest () {
    return 'messageApiRequest'
  }
  static get messageApiRequestResponse () {
    return 'messageApiRequestResponse'
  }
}

export default Constants
