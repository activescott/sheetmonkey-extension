import msg from '../modules/msg';
import msgHandlers from './msgHandlers.js'

console.log('Background script loaded!'); // eslint-disable-line no-console

const message = msg.init('bg', msgHandlers.create('bg'));
