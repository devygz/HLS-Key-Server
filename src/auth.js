const database = require("./database");
const basics = require('./basics');
const config = require('./config');
const {returnResult} = require("./basics");
const logging = require("./logging");
const locals = require("./localization");

async function addClient(clientID, ttl, metadataOverride) {

    let client = metadataOverride || {
        enabled: true,      // BOOL: Enable or disable client account. Disabled accounts are unable to
                            // retrieve the keys or do operations.
    }

    return await database.safeWriteHash('client:' + clientID, client, ttl);
}

async function addSession(sessionID, clientID, sessionData, ttl) {
    if(!sessionID || !clientID || !sessionData || !ttl) {

        return basics.returnResult(false, 'SESSION-MISSING-PARAMETERS', 'Missing parameters to create a new session.');
    }

    if(sessionData.contentID && sessionData.contentID.length > config.MAX_CONTENT_ID_LENGTH) {
        return basics.returnResult(false, 'SESSION-CONTENT_ID-TOO-LONG', 'contentID is too long.');
    }

    if(!config.DISABLE_PATH_PROTECTIONS && !(basics.safeguardPaths(sessionData.contentID)) ) {
        // Path Protections are Enabled and there is at least 1 prop that doesn't match with RegEx.
        return basics.returnResult(false, 'BLOCKED-BY-CONFIGURATION', locals.BLOCKED_BY_CONFIGURATION);
    }

    let clientDetails = await getClient(clientID);
    if(!clientDetails || Object.keys(clientDetails).length === 0) {
        return basics.returnResult(false, 'CLIENT-NOT-FOUND', locals.CLIENT_NOT_FOUND);
    }
    if(!clientDetails.enabled){
        return basics.returnResult(false, 'CLIENT-NOT-ENABLED', locals.CANNOT_CREATE_SESSION_CLIENT_NOT_ACTIVE)
    }

    let session = {
        clientIP: sessionData.clientIP,
        userAgent: sessionData.userAgent,
        contentID: sessionData.contentID,
    }

    return await database.safeWriteHash('session:' + clientID + ':' + sessionID, session, ttl);
}

async function getClient(clientID){
    return await database.readHash('client:' + clientID);
}

async function getClientTTL(clientID){
    return await database.readTTL('client:' + clientID);
}

async function getSessionTTL(clientID, sessionID){
    return await database.readTTL('session:' + clientID + ':' + sessionID);
}

async function getSession(clientID, sessionID){
    return await database.readHash('session:' + clientID + ':' + sessionID);
}

async function isKeyDeliveryAllowed(clientID, sessionID, req){
    let clientData = await getClient(clientID);

    if (Object.keys(clientData).length === 0){
        return returnResult(false, 'KDALLOW:CLIENT-DOES-NOT-EXIST', locals.CLIENT_NOT_FOUND);
    }
    if (clientData.enabled !== true && clientData.enabled !== 'true'){
        return returnResult(false, 'KDALLOW:CLIENT-IS-NOT-ACTIVE', locals.CLIENT_IS_NOT_ACTIVE);
    }

    let sessionData = await getSession(clientID, sessionID);
    if(Object.keys(sessionData).length === 0){
        return returnResult(false, 'KDALLOW:SESSION-DOES-NOT-EXIST', locals.SESSION_DOES_NOT_EXIST);
    }

    if(config.BLOCK_EMPTY_USER_AGENT && sessionData.userAgent === config.NO_UA_STRING){
        console.warn(`Key Request Check for session ${sessionID} failed because the User-Agent in the session record is empty and the current server configuration prevents clients with empty User-Agent strings to retrieve a content decryption key.`)
        return returnResult(false, 'KDALLOW:BLOCKED-BY-CONFIGURATION', locals.BLOCKED_BY_CONFIGURATION);
    }
    if(config.BLOCK_NON_MOZILLA_UA && sessionData.userAgent.indexOf('Mozilla') < 0){
        console.warn(`Key Request Check for session ${sessionID} failed because the User-Agent in the session record DOES NOT include the phrase "Mozilla" and the current server configuration prevents clients with other User-Agent strings to retrieve a content decryption key.`)
        return returnResult(false, 'KDALLOW:BLOCKED-BY-CONFIGURATION', locals.BLOCKED_BY_CONFIGURATION);
    }

    // If req is known, then also check for request-record matching.
    if(req) {
        // Check for IP Address Matching
        if(config.REQUIRE_FIXED_IP_SESSION && (req.socket.remoteAddress !== sessionData.clientIP)){
            console.warn(`Key Request Check for session ${sessionID} failed because the IP address in the session record DOES NOT match with the request's source IP address. Current server configuration requires the request IP address to exactly match the IP address in the sessionData to retrieve a content decryption key.`)
            return returnResult(false, 'RDMATCH:BLOCKED-BY-CONFIGURATION', locals.BLOCKED_BY_CONFIGURATION);
        }

        // Check for User-Agent matching
        if(config.REQUIRE_FIXED_UA_SESSION && (req.header('User-Agent') !== sessionData.userAgent)){
            console.warn(`Key Request Check for session ${sessionID} failed because the User-Agent in the session record DOES NOT match with the request's User-Agent. Current server configuration requires the request User-Agent to exactly match the User-Agent in the sessionData to retrieve a content decryption key.`)
            return returnResult(false, 'RDMATCH:BLOCKED-BY-CONFIGURATION', locals.BLOCKED_BY_CONFIGURATION);
        }
    }

    return returnResult(true);

}

function blockRequestsInProduction(res) {
    if(basics.isProduction()) {
        basics.sendErrorJSON(res, 'NOT-AVAILABLE-IN-PROD', locals.NOT_ALLOWED_IN_PROD);
        return true;
    }
    return false;
}

module.exports = {addClient, addSession, getClient, getClientTTL, getSession, getSessionTTL, isKeyDeliveryAllowed, blockRequestsInProduction}