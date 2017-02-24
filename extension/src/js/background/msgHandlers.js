/**
 * For using with the msg module to handle messages.
 */
function log(...args) {
  console.log(...args); // eslint-disable-line no-console
}

const handlers = {};

handlers.create = context => ({
  //echo handler:
  echo: (what, done) => {
    log(`---> ${context}::echo("${what}") invoked`);
    log('<--- (no return value)');
    done();
  },
  getRegisteredPlugins(done) {
    log(`---> ${context}::getRegisteredPlugins() invoked`);
    
    const mockPluginRegistry = [
        {
          manifestUrl: "http://localhost:8100/ssfjmanifest.json",
          baseUrl: "http://localhost:8100/",
          manifest: {
            "id": "smartsheetforjira",
            "scripts": ["js/ssfj.js"],
            "commands": [
                {
                    "kind": "account_menu",
                    "id": "launchwindow",
                    "label": "Smartsheet for JIRA"
                }
            ]
          }
        }
    ];
    done(mockPluginRegistry);
  }
});

// for surpressing console.log output in unit tests:
handlers.__resetLog = () => { // eslint-disable-line no-underscore-dangle
  log = () => {}; // eslint-disable-line no-func-assign
};

export default handlers;
