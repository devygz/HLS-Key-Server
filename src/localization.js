module.exports = {
    NON_PROD_WARNING: '! WARNING !: INSECURE SERVER CONFIGURATION\n\nThis server is currently running in a NON-PRODUCTION mode. This is EXTREMELY RISKY to use in Production as it allows additional debugging features. Make sure to configure this server as PROD before production use.',
    NON_PROD_KEY_SUPPRESSED: 'NON-PRODUCTION mode warning keys returned in the responses are suppressed by the advanced configuration.',
    BLOCKED_BY_CONFIGURATION: 'Access has been declined because of the server security configuration.',
    PATH_PROTECTIONS_DISABLED: 'IMPORTANT: Path Protection is disabled. This may allow remote users to gain access to different files in the file system. Please reconsider enabling it.',
    NOT_ALLOWED_IN_PROD: 'This function is not available when running in production mode.',
    SESSION_DOES_NOT_EXIST: 'Session not found. The session might be expired or not created at all.',
    CLIENT_IS_NOT_ACTIVE: 'This client record is not active.',
    CLIENT_NOT_FOUND: 'Client not found.',
    CANNOT_CREATE_SESSION_CLIENT_NOT_ACTIVE: 'Cannot create a session for an inactive client record.',
}