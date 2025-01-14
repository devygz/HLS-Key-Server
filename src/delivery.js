const fs = require('fs');
const config = require('./config');
const basics = require('./basics');
const auth = require('./auth');
const logging = require('./logging');
const locals = require('./localization');



async function deliverKeyData(req, res, clientID, sessionID, keySequence, additionalHeaders) {

    let isAllowed = await auth.isKeyDeliveryAllowed(clientID, sessionID, req);
    if(!isAllowed.success){
        // Key delivery is not allowed.
        res.status(400);
        basics.sendErrorJSON(res, isAllowed.reason, isAllowed.helpfulText);
        return;
    }

    let sessionData = await auth.getSession(clientID, sessionID);
    // TODO: SECURITY-IMPORTANT: Add contentID and keySequence checks to prevent requesting other files. (like supplying a
    // TODO: contentID '../../file' etc. Also you could/should implement safety check for requested content IDs and keySequences.

    if(!config.DISABLE_PATH_PROTECTIONS && !(basics.safeguardPaths(sessionData.contentID) || basics.safeguardPaths(keySequence)) ) {
        // Path Protections are Enabled and there is at least 1 prop that doesn't match with RegEx.
        res.status(403);
        logging.info(`Request of session ${sessionID} coming from IP ${req.socket.remoteAddress}:${req.socket.remotePort} is blocked by Path Protection because keySequence and/or contentID includes characters that are not allowed.`);
        basics.sendErrorJSON(res, 'BLOCKED-BY-CONFIGURATION', locals.BLOCKED_BY_CONFIGURATION);
        return;
    }

    fs.readFile(`./key-storage/${sessionData.contentID}/${config.LOCAL_KEY_FILE_PREFIX}${keySequence}${config.LOCAL_KEY_FILE_EXTENSION}`, (err, data) => {
        if (err) {
            console.error(err);
            basics.sendErrorJSON(res, 'KD-ERROR:KEY-DOES-NOT-EXIST', 'Requested key cannot be found.');
            return;
        }
        // console.log('Binary data:', data);
        res.setHeader('Content-Type', 'application/octet-stream');

        if(additionalHeaders && Array.isArray(additionalHeaders)) {
            // Process additional headers
            additionalHeaders.forEach((headerValuePair) => {
                res.setHeader(headerValuePair[0], headerValuePair[1]);
            })
        }

        if(config.SERVER_TYPE !== 'PROD' || config.ALLOW_SERVER_INFO_IN_PROD) {
            res.setHeader('X-KeyDeliveryServer-ID', config.SERVER_ID);
            res.setHeader('X-KeyDeliveryServer-Type', config.SERVER_TYPE);
        }

        res.send(data);
    });
}

async function returnKeyData(res, keyID) {
    try {
        return fs.readFileSync(`./key-storage/${encodeURIComponent(keyID)}.key`);

    }catch(error) {
        return false;

    }

}

module.exports = {deliverKeyData, returnKeyData};