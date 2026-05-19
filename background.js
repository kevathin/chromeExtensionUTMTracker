const request = indexedDB.open('UTMTrackerDB', 1);
let db;


function fillHostTable(db){
    const tx = db.transaction('hosts', 'readwrite');
    const store = tx.objectStore('hosts');
    const sampleHosts = [
        { hostname: 'analytics.google.com', standardname: 'Google Analytics', storagetype: 'url', source: 'utm_source', medium: 'utm_medium', urlid: 'dl' },
        { hostname: 'y.clarity.ms', standardname: 'Clarity', storagetype: 'localStorage', source: 'utm_source', medium: 'utm_medium', urlid: 'url2' }
    ];
}

function fillCookieTable(db){
    const tx = db.transaction('cookies', 'readwrite');
    const store = tx.objectStore('cookies');
    const sampleCookies = [
        { name: 'hs_login_email', type: 'email' },
        { name: 'ec_email', type: 'email' },
        { name: 'ec_phone', type: 'phone' },
        { name: 'utm_source', type: 'source' },
        { name: 'utm_medium', type: 'medium' }
    ];
}

request.onupgradeneeded = function(event) {
    db = event.target.result;
    // Create `hosts` store and indexes if missing
    if (!db.objectStoreNames.contains('hosts')) {
        const store = db.createObjectStore('hosts', { keyPath: 'hostname', autoIncrement: false});
        store.createIndex('hostname', 'hostname', { unique: true });
        store.createIndex('standardname', 'standardname', { unique: false });
        store.createIndex('storagetype', 'storagetype', { unique: false });
        store.createIndex('source', 'source', { unique: false });
        store.createIndex('medium', 'medium', { unique: false });
        store.createIndex('urlid', 'urlid', { unique: false });
        fillHostTable(db);
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
        fillCookieTable(db);
    }

    // Create `cookiehistory` store for cookie value history
    if (!db.objectStoreNames.contains('cookiehistory')) {
        const store = db.createObjectStore('cookiehistory', { keyPath: 'id', autoIncrement: true });
        store.createIndex('cookieid', 'cookieid', { unique: false});
        store.createIndex('value', 'value', { unique: false });
        store.createIndex('stage', 'stage', { unique: false });
        store.createIndex('currenturl', 'currenturl', { unique: false });
    }
};

request.onsuccess = function(event) {
    db = event.target.result;
    console.log('Database opened successfully');
}

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        const url = new URL(details.url);
        const hostname = url.hostname;
        
        // check if hostname is in the database
        let transaction = db.transaction(['hosts'], 'readonly');
        let store = transaction.objectStore('hosts');
        let getRequest = store.get(hostname);
        
        getRequest.onsuccess = function() {
            if (getRequest.result) {
                // Hostname exists in the database, do something with it
                console.log('Hostname found in database:', getRequest.result);
            } else {
                // Hostname not found, you can choose to add it to the database or ignore
                console.log('Hostname not found in database:', hostname);
            }
        };
    }   
);