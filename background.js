function openDatabase() {
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
                store.createIndex('standardname', 'standardname', { unique: false });
                store.createIndex('storagetype', 'storagetype', { unique: false });
                store.createIndex('source', 'source', { unique: false });
                store.createIndex('medium', 'medium', { unique: false });
                store.createIndex('urlid', 'urlid', { unique: false });
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

            event.target.transaction.oncomplete = function() {
                fillHostTable(db);
                fillCookieTable(db);
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

// Sample hosts to populate the `hosts` store. In a real implementation, this would be dynamic based on observed hostnames.
// Note: `storagetype` indicates where UTM parameters are typically stored for that host (e.g., 'url', 'cookie', 'notfound' if unknown).
function fillHostTable(db){
    const tx = db.transaction('hosts', 'readwrite');
    const store = tx.objectStore('hosts');
    const sampleHosts = [
        { hostname: 'analytics.google.com', standardname: 'Google Analytics', storagetype: 'url', source: 'utm_source', medium: 'utm_medium', urlid: 'dl' },
        { hostname: 'y.clarity.ms', standardname: 'Clarity', storagetype: 'notfound', source: 'notfound', medium: 'notfound', urlid: 'notfound' },
        { hostname: 'track.hubspot.com', standardname: 'HubSpot', storagetype: 'url', source: 'utm_source', medium: 'utm_medium', urlid: 'pu' },
        { hostname: 'www.facebook.com', standardname: 'Facebook Pixel', storagetype: 'url', source: 'utm_source', medium: 'utm_medium', urlid: 'dl' }
    ];
    for (const host of sampleHosts) {
        store.put(host);
    }
}

// Sample cookies to populate the `cookies` store. In a real implementation, this would be dynamic based on observed cookies.
function fillCookieTable(db){
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

// Listen for web requests
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        // Extract hostname from the URL
        const url = new URL(details.url);
        const hostname = url.hostname;

        // open the database, with filter set to all urls
        openDatabase().then(db => {
            // open db transaction
            let transaction = db.transaction(['hosts'], 'readonly');
            // access the `hosts` object store
            let store = transaction.objectStore('hosts');
            // get the record for the hostname
            let getRequest = store.get(hostname);
            
            // handle the result of the get request
            getRequest.onsuccess = function() {
                if (getRequest.result) {
                    // if hostname exists, add to call history with relevant info
                    
                } else {
                    // if hostname does not exist, don't do anything for now. 
                    
                }
            }
        }).catch(error => {
            console.error('Error opening database:', error);
        });
    }, 
    // Filter to listen to all urls
    { urls: ["<all_urls>"] }
);

