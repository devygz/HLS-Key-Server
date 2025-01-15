# HLS Key Server with Access Control
  
### Simple HLS Key Server with Built-in Basic Access Control support. Uses Node.js, Express and Valkey as database. 
  <br>  
  IMPORTANT: This project was developed as a personal project and may not represent production-grade security or reliability standards. While it aims to be functional and useful, it might contain security vulnerabilities or other issues that have not been addressed. Please use this software with caution, especially in scenarios where robust security is required. Contributions, feedback, and improvements are welcome, but active maintenance is not guaranteed.
<br><br>
This server is designed to deliver AES-128 keys to HLS-compatible players conditionally, allowing precise and straightforward content access control. This server is not an alternative to Platform-based DRM solutions, as it cannot prevent copies of the content from being made, but it provides an effective way to control access and customize delivery rights, such as restricting the delivery of certain portions of content or revoking access to live streams after a specific timeout, without implementing file-based ACL restrictions.<br>
  <br>
For this server to be useful, periodic rotation of keys is required for both VOD (using multiple keys for different content segments) and live streaming content.
  
## Features
  * Keys can be delivered in Binary format (default format, compatible with HLS standard and HLS players) or as a JSON payload for custom workflows (e.g., using custom JavaScript and HLS.js to process and load keys dynamically).
  * Store custom Client and Session Metadata
  * Automatic TTL for Client and Sessions, allowing "Expires" style timeouts
  * Client - Session linking allows invalidating Client record to revoke all the sessions immediately.
  * Development & Production Modes to allow easier debugging


## Getting Started
**Before Getting Started**: This server requires an external Valkey (or Redis-like) database to be already configured to work properly. For testing or development, a Valkey instance can be run easily in a Docker container. The `database.js` file must be configured to connect to the database. This code **will not deploy** a database automatically. 

- Content encryption keys should be placed in folders. Each folder should have a unique name representing the `contentID`. Keys must be named sequentially and can include prefixes or suffixes. An example structure can be found in the `./key-storage` folder.
- Clone the repository and customize `config.js` according to the needs.
- Run a local Valkey instance or edit `database.js` to configure the database connection.
- Run the server with `node app.js`

### Production Use

Either set NODE_ENV environmental value to "production" or edit `config.js` and use PROD as the server type string. By default, Production mode disables some endpoints like Server Information, getting client information and server information. These restrictions can be configured in `config.js`. If this key server instance only runs in a local network and there is another firewall or API gateway in front of the server, you may also consider to use it in a Non-Production mode. However, the associated security risks should be considered.

Regardless of the server mode (Production or Non-Production), critical security features such as path string protections and non-production warnings are always enabled. Console outputs can be used to debug these features.

## Step-by-Step Guide After Installation
1. A POST request should be sent to `/client` to create a new client. A `clientID` will be returned in the response. By default, clients are valid for 24 hours, though this can be customized in the configuration.
2. A session should be created by providing the `clientID` and `contentID`. Before creating a session, it is important to ensure the base path for key storage is correctly configured and the key files are properly organized in folders.
3. Keys can be requested using the `clid` (Client ID), `sessid` (Session ID), and `ks` (Key Sequence) parameters. The `/getKey` or `/keyBag` endpoint should be used for this purpose.
4. The key URL should be included in the manifest file as follows: `https://<SERVER_HOSTNAME>/getKey?clid=(CLIENT-ID)&sessid=(SESSION-ID)&ks=(KEY-SEQUENCE)`. Supplying `contentID` is not required as it is already present in the session metadata.


## Endpoints Overview
| Method(s) | Endpoint | Query Params | Description |
| -------- | ------- |----------- |----------- |
| GET, POST  | /client          |**GET**: clientID<br>**POST**: (none)|Create new client (POST) or get the information of an existing one (GET). GET is disabled by default when running in Production mode.    |
| GET, POST  |/session          |**GET**: clientID, sessionID<br>**POST**: clientID, contentID|Create new session (POST) or get the information of an existing one (GET). GET is disabled by default when running in Production mode.    |
| GET        | /getKey          |**GET**: clid (Client ID), sessid (Session ID), ks (Key Sequence)|Get HLS Key in Binary.         |
| GET        | /keyBag          |**GET**: clid (Client ID), sessid (Session ID), ks (Key Sequence)|Get HLS Key in JSON encoded in Base64.         |
| GET        | /serverInfo      |(none)|Get Server Information (appInfo, serverID, serverType and current Unix timestamp). Disabled by default when running in Production mode but can be configured in `config.js`.         |

### Query Parameters
- **clientID / clid**: Client ID generated at POST to /client.
- **contentID**: Content ID of the content. This is used to find the local key files. It will be appended to the base key storage path. For example if the base key storage path is `/opt/keylocal` and the contentID is `123456`, the keys will be searched under the folder `/opt/keylocal/123456`.
- **ks**: Key Sequence. Key Sequence is an incremental decimal generally starting at 0, and it helps to choose the exact key that is used to sign the portion of the content.
- **sessionID / sessid**: Session ID generated at POST to /session.
  
## Additional Configuration Options
  * Static IP Blocklist Support. Integrate with 3rd party solutions or blocklists to enable blocking requests directly on the server.
  * Enforce Fixed IP and/or Fixed User-Agent for a single Playback Session
  * Filter requests with empty User-Agent
  * Filter requests with User-Agent that does not contain the keyword `Mozilla`
  * Customize Default Client/Session TTL
  * Customize Local Key Prefixes and Path
  * Unique Server ID
