# HLS Key Server with Access Control
  
### Simple HLS Key Server with Built-in Basic Access Control support. Uses Node.js Express and Valkey as database for better performance. 
  <br>  
This server delivers AES-128 keys to the HLS-compatible players conditionally, allowing precise and easy content access controls. This is not an alternative to Platform-based DRM solutions, meaning that this server is unable to prevent people from making a copy of your content, but you can control the access to your content easily and customize delivery and rights like only allowing some portion of the content to be delivered, or for live streams revoking access to the stream after some time, without implementing stream file based restrictions.<br>
  <br>
For this server to be useful, you must rotate your keys periodically for both VOD (using multiple keys for different part of the content) and Live Streaming content.
  
## Features
  * Deliver keys as Binary (for default compatibility with HLS Players) or JSON payload for custom workflows (like using HLS.js to do additional operations and deliver keys to player on fly)
  * Store custom Client and Session Metadata
  * Automatic TTL for Client and Sessions allowing "Expires" style timeouts
  * Client - Session Relationship allows invalidating Client record to revoke all the sessions at once
  * Development & Production Mode to allow easier debugging


## Getting Started
**Before Getting Started**: This server needs an external Valkey (or Redis-like) database already configured to work. Especially for testing and development, you can run one inside a Docker container easily. Configure <code>database.js</code> to use a customized server. This code **won't deploy** a database automatically. 

- Place your content encryption keys in a folder. Create a folder for each different content with a unique name (this will be your contentID), and put the keys and name them sequentally. You can use prefixes and suffixes in the key names. For an example structure, see ./key-storage folder.
- Clone the repository and customize <code>config.js</code> according to your needs.
- Run a local Valkey instance or edit <code>database.js</code> to configure database connection.
- Run the server with <code>node app.js</code>

### Production Use

Either set NODE_ENV environmental value to "production" or edit <code>config.js</code> and use PROD as the server type string. By default, Production mode disables some endpoints like Server Information, getting client information and server information. These restrictions can be configured in config.js. If this key server instance only runs in a local network and there is another firewall or API gateway in front of this, you may also try to use it in a Non-Production mode but please be aware of the potential security risks.

Regardless of the server mode (either PROD or Non-Production), important security features like Path String Protections and Non-Production Warnings are always enabled. Use the console outputs to debug these.

## Step-by-Step Guide After Installation
1. First, you need to create a new client. This can be done easily by just sending a POST to <code>/client</code>. In the response, a new clientID will be returned. By default settings each client is valid for 24 hours, but you can customize that easily in the configuration.
2. Now that you have a valid client, you can create a new session. Before creating a new session, it is important to remember that you should have already configured where your actual key files are stored, and the base path for that in the configuration. Each key must be placed inside a folder in a sequence. You can apply prefixes and suffixes to the key names, but the actual sequence must always be incremental and numerical.
3. Creating a new session requires the clientID and the contentID. At the creation of the new session, the clientID must both exist and be enabled. Otherwise, API returns a helpful error message.
4. After you have the sessionID, you can combine clientID and sessionID in your Manifest File and use ks (Key Sequence) to get rotating keys. Point out the address <code>https://<SERVER_HOSTNAME>/getKey?clid=(CLIENT-ID)&sessid=(SESSION-ID)&ks=(KEY-SEQUENCE)</code> in your Manifest and you are good to go! You don't need to supply contentID as it is already present in the session metadata.


## Endpoints Overview
| Method(s) | Endpoint | Query Params | Description |
| -------- | ------- |----------- |----------- |
| GET, POST  | /client          |**GET**: clientID<br>**POST**: (none)|Create new client (POST) or get the information of an existing one (GET). GET is disabled by default when running in Production mode.    |
| GET, POST  |/session          |**GET**: clientID, sessionID<br>**POST**: clientID, contentID|Create new session (POST) or get the information of an existing one (GET). GET is disabled by default when running in Production mode.    |
| GET        | /getKey          |**GET**: clid (Client ID), sessid (Session ID), ks (Key Sequence)|Get HLS Key in Binary.         |
| GET        | /keyBag          |**GET**: clid (Client ID), sessid (Session ID), ks (Key Sequence)|Get HLS Key in JSON encoded in Base64.         |
| GET        | /serverInfo      |(none)|Get Server Information (appInfo, serverID, serverType and current Unix timestamp). Disabled by default when running in Production mode but can be configured in <code>config.js</code>.         |

### Query Parameters
- **clientID / clid**: Client ID generated at POST to /client.
- **contentID**: Content ID of the content. This is used to find the local key files. It will be appended to the base key storage path. For example if the base key storage path is <code>/opt/keylocal</code> and the contentID is <code>123456</code>, the keys will be searched under the folder <code>/opt/keylocal/123456</code>.
- **ks**: Key Sequence. Key Sequence is an incremental decimal generally starting at 0, and it helps to choose the exact key that is used to sign the portion of the content.
- **sessionID / sessid**: Session ID generated at POST to /session.
  
## Additional Configuration Options
  * Static IP Blocklist Support. Integrate with 3rd party solutions or blocklists to enable blocking requests directly on the server.
  * Enforce Fixed IP and/or Fixed User-Agent for a single Playback Session
  * Filter requests with empty User-Agent
  * Filter requests with User-Agent that does not contain Mozilla
  * Customize Default Client/Session TTL
  * Customize Local Key Prefixes and Path
  * Unique Server ID
