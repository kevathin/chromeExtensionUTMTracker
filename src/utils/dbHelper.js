export function openDatabase() {
    return new Promise((resolve, reject) => {

        // request to open or create the database. 
        const request = indexedDB.open('UTMTrackerDB', 1);

        // if database does not exist or if the version number is higher than the existing version.
        // If so, it creates the database and object stores.
        // Warning: this creates a read/write transaction
        request.onupgradeneeded = async function(event) {

            // fetch the database from the event
            // 
            const db = event.target.result;

            // Create `hosts` store and indexes if missing
            if (!db.objectStoreNames.contains('hosts')) {
                const store = db.createObjectStore('hosts', { keyPath: 'hostname', autoIncrement: false});
                store.createIndex('hostname', 'hostname', { unique: true });
                store.createIndex('excludeContains', 'excludeContains', { unique: false });
                store.createIndex('standardname', 'standardname', { unique: false });
                store.createIndex('storagetype', 'storagetype', { unique: false });
                store.createIndex('source', 'source', { unique: false });
                store.createIndex('medium', 'medium', { unique: false });
                store.createIndex('curid', 'curid', { unique: false });
                store.createIndex('historicid', 'historicid', { unique: false });
            }

            // Create `call` store for API calls
            if (!db.objectStoreNames.contains('call')) {
                const store = db.createObjectStore('call', { keyPath: 'id', autoIncrement: true });
                store.createIndex('time', 'time', { unique: false });
                store.createIndex('hostname', 'hostname', { unique: false });
                store.createIndex('utmsource', 'utmsource', { unique: false });
                store.createIndex('utmmedium', 'utmmedium', { unique: false });
                store.createIndex('apiurl', 'apiurl', { unique: false });
                store.createIndex('currenturl', 'currenturl', { unique: false });
            }

            // Create `cookies` store with compound primary key (location + name)
            if (!db.objectStoreNames.contains('cookies')) {
                const store = db.createObjectStore('cookies', {keyPath: 'name', autoIncrement: false });
                store.createIndex('name', 'name', { unique: true });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('software', 'software', { unique: false});
            }

            // Create `cookiehistory` store for cookie value history
            if (!db.objectStoreNames.contains('cookiehistory')) {
                const store = db.createObjectStore('cookiehistory', { keyPath: 'id', autoIncrement: true });
                store.createIndex('cookieid', 'cookieid', { unique: false});
                store.createIndex('value', 'value', { unique: false });
                store.createIndex('stage', 'stage', { unique: false });
                store.createIndex('currenturl', 'currenturl', { unique: false });
            }

            if(!db.objectStoreNames.contains('settings')) {
                const store = db.createObjectStore('settings', { keyPath: 'key', autoIncrement: false });
                store.createIndex('key', 'key', { unique: true });
                store.createIndex('value', 'value', { unique: false });
            }

            event.target.transaction.oncomplete = function() {
                fillHostTable(db);
                fillCookieTable(db);
                fillSettingsTable(db);
            }
        }

        // If database exists, return the database instance.
        request.onsuccess = function(event) {
            const db = event.target.result;
            resolve(db);
        }

        // If an error occurs, pray
        request.onerror = function(event) {
            reject(event.target.error);
        }
    });
}


// google analytics stores utm parameters in url
// hubspot stores utm parameters in url
// clarity stores utm parameters in a bin in the payload of the api call
// facebook pixel stores utm parameters in json format in the url
// Sample hosts to populate the `hosts` store. In a real implementation, this would be dynamic based on observed hostnames.
// Note: `storagetype` indicates where UTM parameters are typically stored for that host (e.g., 'url', 'cookie', 'notfound' if unknown).
export function fillHostTable(db){
    const tx = db.transaction('hosts', 'readwrite');
    const store = tx.objectStore('hosts');
    const sampleHosts = [
        { hostname: 'analytics.google.com', excludeContains: ['script'], standardname: 'Google Analytics', storagetype: 'url', source: 'utm_source', medium: 'utm_medium', curid: 'dl', historicid: 'dr' },
        { hostname: 'clarity.ms', excludeContains: ['script'], standardname: 'Clarity', storagetype: 'bin', source: 'notfound', medium: 'notfound', curid: 'notfound', historicid: 'notfound'},
        { hostname: 'track.hubspot.com', excludeContains: ['script'],standardname: 'HubSpot', storagetype: 'url', source: 'utm_source', medium: 'utm_medium', curid: 'pu', historicid: 'r'},
        { hostname: 'www.facebook.com', excludeContains: ['script'],standardname: 'Facebook Pixel', storagetype: 'json', source: 'utm_source', medium: 'utm_medium', curid: 'ups[pv]', historicid: 'ups[rpv]'}
    ];
    for (const host of sampleHosts) {
        store.put(host);
    }
}

// Sample cookies to populate the `cookies` store. In a real implementation, this would be dynamic based on observed cookies.
export function fillCookieTable(db){
    const tx = db.transaction('cookies', 'readwrite');
    const store = tx.objectStore('cookies');
    const sampleCookies = [
        { name: 'hs_login_email', type: 'email', software: 'HubSpot' },
        { name: 'hs_login_phone', type: 'phone', software: 'HubSpot' },
        { name: 'ec_email', type: 'email', software: 'default' },
        { name: 'ec_phone', type: 'phone', software: 'default' },
        { name: 'utm_source', type: 'source', software: 'default' },
        { name: 'utm_campaign', type: 'campaign', software: 'default' },
        { name: 'sa-u-source', type: 'source', software: 'StackAdapt'},
        { name: 'utm_medium', type: 'medium', software: 'default' },
        { name: 'calltrk_landing', type: 'landing', software: 'Callrail'},
        { name: 'calltrk_session_id', type: 'sessionid', software: 'Callrail'},
        { name: 'sa-user-id', type: 'userid', software: 'StackAdapt'},
        { name: 'wix_utm_params', type: 'source', software: 'Wix' },
        { name: 'mpaSessionId', type: 'sessionid', software: 'default' }
    ];
    for (const cookie of sampleCookies) {
        store.put(cookie);
    }
}

export function fillSettingsTable(db) {
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    const sampleSettings = [
        { key: 'apiTrackingEnabled', value: false },
        { key: 'cookieTrackingEnabled', value: false },
        { key: 'trackedHostnames', value: ['analytics.google.com', 'clarity.ms', 'track.hubspot.com', 'www.facebook.com'] }
    ];
    for (const setting of sampleSettings) {
        store.put(setting);
    }
}