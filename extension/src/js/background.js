import msg from './modules/msg';

console.log('Background script loaded!'); // eslint-disable-line no-console

const message = msg.init('bg', handlers.create('bg'));
