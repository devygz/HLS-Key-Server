module.exports = {
    SERVER_ID:              'DEV-KS:DB79Z3',         // Constant, could be generated randomly
    SERVER_TYPE:            'DEV',      // Allowed values are DEV, PROD, STAG
    CLIENT_ID_LENGTH:       12,
    SESSION_ID_LENGTH:      12,
    MAX_CONTENT_ID_LENGTH:  32,
    DEFAULT_CLIENT_TTL:     86400,      // 24 Hours of client retention
    DEFAULT_SESSION_TTL:    14400,      // 4 Hours of Playback window
                                        // IMPORTANT: Client TTL MUST ALWAYS be higher than Session TTL.

    REQUIRE_FIXED_IP_SESSION:   true,   // Requires the client IP to stay same during the playback session.
    REQUIRE_FIXED_UA_SESSION:   true,   // Requires the same exact User-Agent during the playback session.
    BLOCK_EMPTY_USER_AGENT:     true,   // Block requests made with empty User Agent strings.
    BLOCK_NON_MOZILLA_UA:       true,   // Block requests without the word "Mozilla" in User-Agent.
    STATIC_IP_BLOCKLIST:        [],     // This might be integrated with a security solution to enable
                                        // IP Address based client filtering directly at the server.


    LOCAL_KEY_FILE_PREFIX:      'enc',
    LOCAL_KEY_FILE_EXTENSION:   '.key',

    ALLOW_SERVER_INFO_IN_PROD:  false,



    // Configs below are related to advanced configurations used by some functions to work properly.
    // Please DO NOT MAKE ANY CHANGES unless you really sure that you have to change.

    SUPPRESS_NON_PROD_WARNING:  false,
    DISABLE_PATH_PROTECTIONS:   false,   // ! ENABLING this might make the server VULNERABLE TO ATTACKS !
    KEY_SERVER_INFO:        {
        version: 1,
        name: 'Experimental HLS Key Server'
    },

    PATH_PROTECTIONS_REGEX:     /^[A-Za-z0-9_-]+$/,
    NO_UA_STRING:               '!!NO-UA!!',

}
