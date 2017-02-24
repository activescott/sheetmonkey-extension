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
  }
});

// for surpressing console.log output in unit tests:
handlers.__resetLog = () => { // eslint-disable-line no-underscore-dangle
  log = () => {}; // eslint-disable-line no-func-assign
};

export default handlers;
