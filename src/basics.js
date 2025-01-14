const config = require('./config');
const locals = require('./localization');
const logging = require("./logging");

async function sendJSON(res, obj) {
    res.setHeader('Content-Type', 'application/json');
    if(!isProduction()){
        obj['_securityWarning'] = locals.NON_PROD_WARNING;
    }
    return await res.send(JSON.stringify(obj));
}

async function sendErrorJSON(res, reason, helpfulText) {
    return await sendJSON(res, {
        "error": true,
        "reason" : reason || "UNKNOWN",
        "helpfulText" : helpfulText || ""
    });
}

function returnResult(success, reason='UNKNOWN', helpfulText = 'UNKNOWN', result='UNKNOWN') {
    return {success, reason, helpfulText, result};
}

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

function isProduction() {
    return process.env.NODE_ENV === 'production' || config.SERVER_TYPE === 'PROD' || config.SERVER_TYPE === 'PRODUCTION';
}

function safeguardPaths(path) {
    const regex = config.PATH_PROTECTIONS_REGEX;
    return regex.test(path);
}

function configurationSecurityCheck() {
    if(isProduction()){
        logging.info('Server is running in Production mode.')
    }else{
        logging.warn(locals.NON_PROD_WARNING);
    }

    if(config.SUPPRESS_NON_PROD_WARNING) {
        logging.warn('!!! '+locals.NON_PROD_KEY_SUPPRESSED);
    }

    if(config.DISABLE_PATH_PROTECTIONS) {
        logging.seriousWarn('!!! ' + locals.PATH_PROTECTIONS_DISABLED);
    }
}

module.exports = {
    sendJSON, sendErrorJSON, returnResult, makeid, isProduction, safeguardPaths, configurationSecurityCheck
}