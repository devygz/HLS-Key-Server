
const express = require('express')
const app = express()
const port = 3000

const basics = require('./basics');
const delivery = require('./delivery');
const auth = require('./auth');
const config = require('./config');
const locals = require('./localization');
const logging = require('./logging');
const {blockRequestsInProduction} = require("./auth");


basics.configurationSecurityCheck();

// Get Key
app.get('/getKey', (req, res) => {
  //res.send('Hello World!')
  let keyRequest = {
    clientID: req.query.clid,
    sessionID: req.query.sessid,
    keySequence: req.query.ks
  }

  delivery.deliverKeyData(req, res, keyRequest.clientID, keyRequest.sessionID, keyRequest.keySequence);
})

// Get Key as JSON Payload
app.get('/keyBag', async (req, res) => {
  //res.send('Hello World!')
  let keyRequest = {
    clientID: req.query.clid,
    sessionID: req.query.sessid,
    keySequence: req.query.ks,
    debugKeyPrefix: req.query.debugkp,
  }

  let keyData = await delivery.returnKeyData(res, 'enc' + keyRequest.keySequence);

  // Key Not Found
  if (!keyData) {
    basics.sendErrorJSON(res, 'KD-ERROR:' + 'KEY-DOES-NOT-EXIST', 'Requested key cannot be found.');
    return;
  }

  basics.sendJSON(res, {
    "success" : true,
    "keyData" : keyData.toString('base64'),
  });

})

app.get('/client', async(req, res) => {
  if(blockRequestsInProduction(res)) {return;}

  if(!req.query.clientID){
    res.status(400);
    basics.sendErrorJSON(res, 'CLIENT_ID-IS-MISSING', 'Client ID is missing from the request.');
    return;
  }

  let clientData = await auth.getClient(req.query.clientID);
  let recordTTL = await auth.getClientTTL(req.query.clientID);
  if (Object.keys(clientData).length > 0) {
    basics.sendJSON(res, {"clientData" : clientData, "ttl" : recordTTL});
  }else{
    basics.sendErrorJSON(res, 'CLIENT-NOT-FOUND', 'Client not found.');
  }
})

app.post('/client', async (req, res) => {
  let newClientID = basics.makeid(config.CLIENT_ID_LENGTH);
  let writeResult = await auth.addClient(newClientID, config.DEFAULT_CLIENT_TTL);
  if(writeResult.success) {
    basics.sendJSON(res, basics.returnResult(true, 'SUCCESS', 'New Client Created Successfully.', newClientID));
  }else{
    basics.sendErrorJSON(res, writeResult.reason, 'An error occurred while creating a new client.');
  }
})


app.get('/session', async(req, res) => {
  if(blockRequestsInProduction(res)) {return;}

  if(!req.query.sessionID || !req.query.clientID) {
    res.status(400);
    basics.sendErrorJSON(res, 'MISSING-PARAMETERS', 'Some parameters are missing in your request.');
    return;
  }
  let clientData = await auth.getClient(req.query.clientID);
  let sessionData = await auth.getSession(req.query.clientID, req.query.sessionID);
  let sessionTTL = await auth.getSessionTTL(req.query.clientID, req.query.sessionID);
  if(Object.keys(sessionData).length === 0) {
    basics.sendErrorJSON(res, 'SESSION-NOT-FOUND', 'Session not found.');
    return;
  }

  if(Object.keys(clientData).length === 0) {
    basics.sendErrorJSON(res, 'CLIENT-DOES-NOT-EXIST', 'Cannot retrieve session since the linked client does not exist.');
    return;
  }
  console.log(clientData);
  if(clientData.enabled === 'false') {    //TODO: Think about this
    basics.sendErrorJSON(res, 'CLIENT-DISABLED', 'Cannot retrieve session since the linked client is disabled.');
    return;
  }



  if (Object.keys(sessionData).length > 0) {
    basics.sendJSON(res, {"sessionData" : sessionData, "ttl" : sessionTTL});
  }else{
    basics.sendErrorJSON(res, 'SESSION-NOT-FOUND', 'Session not found.');
  }
})

app.post('/session', async (req, res) => {
  if(!req.query.clientID || !req.query.contentID){
    res.status(400);
    basics.sendErrorJSON(res, 'MISSING-PARAMETERS', 'Some parameters are missing in your request.');
    return;
  }

  let clientData = await auth.getClient(req.query.clientID);
  if(clientData.enabled === 'false') {    //TODO: Think about this
    basics.sendErrorJSON(res, 'CLIENT-DISABLED', 'Cannot create a session for a disabled client record.');
    return;
  }

  let newSessionID = basics.makeid(config.SESSION_ID_LENGTH);
  let sessionData = {
    clientIP: req.socket.remoteAddress,
    userAgent: req.header('user-agent') || config.NO_UA_STRING,   // Might add a feature to make it fail silently if no UA exists.
    contentID: req.query.contentID,
  };
  let writeResult = await auth.addSession(newSessionID, req.query.clientID, sessionData, config.DEFAULT_SESSION_TTL);
  if(writeResult.success) {
    basics.sendJSON(res, basics.returnResult(true, 'SUCCESS', 'New Session Created Successfully.', newSessionID));
  }else{
    basics.sendErrorJSON(res, writeResult.reason, 'An error occurred while creating a new client.');
  }
})

app.get('/serverInfo', async (req, res) => {
  if(!config.ALLOW_SERVER_INFO_IN_PROD){
    if(auth.blockRequestsInProduction(res)) return;
  }

  basics.sendJSON(res, {
    appInfo: config.KEY_SERVER_INFO,
    serverID: config.SERVER_ID,
    serverType: config.SERVER_TYPE,
    time: Date.now(),
  })
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})