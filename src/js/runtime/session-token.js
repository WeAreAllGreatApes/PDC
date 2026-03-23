/** The below is a global UUID which follows the rules from mapbox's session billing:
 *  * https://docs.mapbox.com/api/search/search-box/#session-billing
 */
const uuidGlobals = {
    // UUID to be passed to search
    uuid: crypto.randomUUID(),
    // Time of creation. 
    creationTime: Date.now(),
    requestsUsed: 0
}

/** ### Experimental implementation of session-based UUID retrieval
 * @returns new UUID for session-based requests (currently just /autocomplete)
 */
function getUUID() {
    let now = Date.now();
    // 50+ requests have been used:
    if (uuidGlobals.requestsUsed >= 50) {
        return newUUID();
    }
    // 60+ minutes have passed since session generated:
    if (now - uuidGlobals.creationTime >= 3600000) {
        return newUUID();
    } 
    
    uuidGlobals.requestsUsed++;
    return uuidGlobals.uuid;
}

function newUUID(time = undefined) {
    if (!time) {
        time = Date.now();
    }
    uuidGlobals.uuid = crypto.randomUUID();
    uuidGlobals.creationTime = time;
    uuidGlobals.requestsUsed = 0;

    return uuidGlobals.uuid
}