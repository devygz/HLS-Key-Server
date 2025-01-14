const Redis = require("iovalkey");
const basics = require("./basics");

// Create a Redis instance.
// By default, it will connect to localhost:6379.
// We are going to cover how to specify connection options soon.
const redis = new Redis();

function writeKey(key, value, ttl) {
    let hasExpiration = (ttl > 0);
    try {
        if (hasExpiration) {
            redis.set(key, value, 'EX', ttl);
        } else {
            redis.set(key, value);
        }
        return true;
    } catch (e) {
        console.error('An error occurred during Redis String Write: ' + e);
        return false;
    }
}

async function writeHash(key, value, ttl) {
    let hasExpiration = (ttl > 0);
    try {
        if (hasExpiration) {
            await redis.hset(key, value);
            redis.expire(key, ttl);
        } else {
            redis.hset(key, value);
        }
        return true;
    } catch (e) {
        console.error('An error occurred during Redis Hash Write: ' + e);
        return false;
    }
}

async function readKey(key) {
    try {
        return await redis.get(key);
    } catch (e) {
        console.error('An error occurred during Redis Read: ' + e);
        return false;
    }
}

async function readHash(key, prop) {
    try {
        if(prop) {
            return await redis.hget(key, prop);
        }
        return await redis.hgetall(key);

    } catch (e) {
        console.error('An error occurred during Redis Read: ' + e);
        return false;
    }
}

async function readTTL(key) {
    try {
        return await redis.ttl(key);
    } catch (e) {
        console.error(e);
        return false;
    }
}

async function safeWriteHash(key, value, ttl) {
    let readHashResult = await readHash(key);
    //console.debug(typeof readHashResult);
    if (Object.keys(readHashResult).length === 0) {
        // Key doesn't exist, we can create it.
        try{
            await writeHash(key, value, ttl);
            return basics.returnResult(true);
        }catch (e) {
            console.error('An error occurred during safeWriteKey writing action:\n' + e);
            return basics.returnResult(false, 'WRITE-OPERATION-FAILED', 'DB key write action failed.', e);
        }

    }
    console.warn(`safeWriteKey attempt unsuccessful: Key ${key} already exists.`);
    return basics.returnResult(false, 'KEY-ALREADY-EXISTS', 'safeWrite Check Failed: Key already exists.', false);
}

module.exports = {writeKey, readKey, readTTL, safeWriteHash, readHash, writeHash};