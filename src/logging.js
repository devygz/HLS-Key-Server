colors = require('colors');

module.exports = {
    error: message => console.log(message.red),
    seriousWarn: message => console.log(message.black.bgYellow),
    warn: message => console.log(message.yellow),
    info: message => console.log(message.blue),
    debug: message => console.log(message.gray),
};