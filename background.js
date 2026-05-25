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
// facebook pixel stores utm parameters in url
// Sample hosts to populate the `hosts` store. In a real implementation, this would be dynamic based on observed hostnames.
// Note: `storagetype` indicates where UTM parameters are typically stored for that host (e.g., 'url', 'cookie', 'notfound' if unknown).
function fillHostTable(db){
    const tx = db.transaction('hosts', 'readwrite');
    const store = tx.objectStore('hosts');
    const sampleHosts = [
        { hostname: 'analytics.google.com', excludeContains: ['script'], standardname: 'Google Analytics', storagetype: 'url', source: 'utm_source', medium: 'utm_medium', curid: 'dl', historicid: 'dr' },
        { hostname: 'clarity.ms', excludeContains: ['script'],standardname: 'Clarity', storagetype: 'bin', source: 'notfound', medium: 'notfound', curid: 'notfound', historicid: 'notfound'},
        { hostname: 'track.hubspot.com', excludeContains: ['script'],standardname: 'HubSpot', storagetype: 'url', source: 'utm_source', medium: 'utm_medium', curid: 'pu', historicid: 'r'},
        { hostname: 'www.facebook.com', excludeContains: ['script'],standardname: 'Facebook Pixel', storagetype: 'json', source: 'utm_source', medium: 'utm_medium', curid: 'ups[pv]', historicid: 'ups[rpv]'}
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

function fillSettingsTable(db) {
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    const sampleSettings = [
        { key: 'apiTrackingEnabled', value: true },
        { key: 'cookieTrackingEnabled', value: true },
        { key: 'trackedHostnames', value: ['analytics.google.com', 'clarity.ms', 'track.hubspot.com', 'www.facebook.com'] }
    ];
    for (const setting of sampleSettings) {
        store.put(setting);
    }
}
/* ------------------------ -------------------------*/
/*                  api tracking setup               */
/* ------------------------ ------------------------ */

// Helper function to extract UTM parameters from a given URL string based on host configuration
function extractUtmsFromUrl(urlString, host) {
    try {
        const parsedUrl = new URL(urlString);
        const searchParams = parsedUrl.searchParams;
        return {
            source: searchParams.get(host.source),
            medium: searchParams.get(host.medium),
            href: parsedUrl.href
        };
    } catch (error) {
        return { source: null, medium: null, href: null };
    }
}

// Handler for 'url' storage type - checks historic URL, current URL, then API URL
function handleUrlStorageType(host, url, details) {
    const params = url.searchParams;
    let utmSource = '';
    let utmMedium = '';
    let recordedCurrentUrl = details.documentUrl || details.initiator || details.url;
    let utmFound = false;

    // checkpoint 1: check historic url
    if (host.historicid && params.has(host.historicid)) {
        const historicUrlValue = params.get(host.historicid) || '';
        try {
            const decodedHistoricUrlValue = decodeURIComponent(historicUrlValue);
            const historicResult = extractUtmsFromUrl(decodedHistoricUrlValue, host);
            if (historicResult.source || historicResult.medium) {
                utmSource = historicResult.source || 'notfound';
                utmMedium = historicResult.medium || 'notfound';
                utmFound = true;
                // console.log('Found UTM params in historicid');
            }
        } catch (error) {
            console.warn('Unable to parse historicid:', host.historicid, historicUrlValue, error);
        }
    }

    // checkpoint 2: check current url
    if (!utmFound && host.curid && params.has(host.curid)) {
        const nestedUrlValue = params.get(host.curid) || '';
        try {
            const decodedNestedUrlValue = decodeURIComponent(nestedUrlValue);
            const nestedResult = extractUtmsFromUrl(decodedNestedUrlValue, host);
            if (nestedResult.source || nestedResult.medium) {
                utmSource = nestedResult.source || 'notfound';
                utmMedium = nestedResult.medium || 'notfound';
                utmFound = true;
                // console.log('Found UTM params in curid');
            }
        } catch (error) {
            console.warn('Unable to parse curid:', host.curid, nestedUrlValue, error);
        }
    }

    // checkpoint 3: check API call URL
    if (!utmFound) {
        //console.log('reached checkpoint 3 for ' + host.standardname + ' with url: ' + url.href);
        const apiSource = params.get(host.source);
        const apiMedium = params.get(host.medium);
        if (apiSource || apiMedium) {
            utmSource = apiSource || 'notfound';
            utmMedium = apiMedium || 'notfound';
            utmFound = true;
            // console.log('Found UTM params in API call URL');
        }
    }

    // return the found utm parameters along with the URL they were found in, or 'notfound' if not found in any checkpoint
    return {
        source: utmFound ? utmSource : 'notfound',
        medium: utmFound ? utmMedium : 'notfound',
        currentUrl: recordedCurrentUrl
    };
}

// Handler for 'bin' storage type - extracts from API-level parameters
function handleBinStorageType(host, url, details) {
    // check what type of file the payload is. then extract the bin accordingly and handle it. 
    let recordedCurrentUrl = details.documentUrl || details.initiator || details.url;
    return {
        source: 'notfound',
        medium: 'notfound',
        currentUrl: recordedCurrentUrl
    }
}


// Handler for 'json' storage type.
// ex urlencoded query parameter: ups[rpv]: "%7B%22utm_source%22%3A%22google%22%2C%22utm_medium%22%3A%22cpc%22%7D"
function handleJsonStorageType(host, url, details) {
    let recordedCurrentUrl = details.documentUrl || details.initiator || details.url;
    // checkpoint 1: check historic url
    if (host.historicid && url.searchParams.has(host.historicid)) {
        const historicValue = url.searchParams.get(host.historicid) || '';
        try {
            const decodedHistoricValue = decodeURIComponent(historicValue);
            const historicResult = JSON.parse(decodedHistoricValue);
            if (historicResult[host.source] || historicResult[host.medium]) {
                return {
                    source: historicResult[host.source] || 'notfound',
                    medium: historicResult[host.medium] || 'notfound',
                    currentUrl: recordedCurrentUrl
                };
            }
        } catch (error) {
            console.warn('Unable to parse historicid JSON:', host.historicid, historicValue, error);
        }
    }

    // checkpoint 2: check current url
    if (host.curid && url.searchParams.has(host.curid)) {
        const currentValue = url.searchParams.get(host.curid) || '';
        try {
            const decodedCurrentValue = decodeURIComponent(currentValue);
            const currentResult = JSON.parse(decodedCurrentValue);
            if (currentResult[host.source] || currentResult[host.medium]) {
                return {
                    source: currentResult[host.source] || 'notfound',
                    medium: currentResult[host.medium] || 'notfound',
                    currentUrl: recordedCurrentUrl
                };
            }
        } catch (error) {
            console.warn('Unable to parse curid JSON:', host.curid, currentValue, error);
        }
    }

    // checkpoint 3: return notfound since querystring doesn't contain the Json-encoded utm parameters.
    return {
        source: 'notfound',
        medium: 'notfound',
        currentUrl: recordedCurrentUrl
    };
    
}

// Dispatcher function to handle UTM extraction based on storage type
function extractUtmsByStorageType(host, url, details) {
    // handle the api call based on the storage type.
    if (host.storagetype === 'url') {
        return handleUrlStorageType(host, url, details);
    } else if (host.storagetype === 'bin') {
        return handleBinStorageType(host, url, details);
    } else {
        // Default fallback for unknown storage types
        console.warn('Unknown storage type:', host.storagetype);
        return {
            source: 'notfound',
            medium: 'notfound',
            currentUrl: details.documentUrl || details.initiator || details.url
        };
    }
}

// Helper function to save a call record to the database
function saveCallRecord(db, hostname, utmResult, details) {
    const callRecord = {
        time: Date.now(),
        hostname: hostname,
        utmsource: utmResult.source,
        utmmedium: utmResult.medium,
        apiurl: details.url,
        currenturl: utmResult.currentUrl
    };

    const writeTx = db.transaction(['call'], 'readwrite');
    const callStore = writeTx.objectStore('call');
    const addRequest = callStore.add(callRecord);

    addRequest.onsuccess = function() {
        // console.log('Added call history record:', callRecord);
        if (utmResult.source == 'notfound' || utmResult.medium == 'notfound') {
            console.log('Not found utm parameters:', callRecord);
        }
    };

    addRequest.onerror = function(event) {
        console.error('Error adding call history record:', event.target.error);
    };
}

// Helper function to find a matching host in the database by partial hostname match
function findMatchingHost(db, hostname, callback) {
    const transaction = db.transaction(['hosts'], 'readonly');
    const store = transaction.objectStore('hosts');
    const request = store.openCursor();

    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const host = cursor.value;
            // if hostname is found, handle the call using callback function. exlude calls identified as non utm related calls
            if (hostname.includes(host.hostname) && !host['excludeContains']?.some(excludeStr => hostname.includes(excludeStr))) {
                callback(host);
            } else {
                // else, continue searching for a match in the next record
                cursor.continue();
            }
        } else {
            // No matching hostname found, return null to callback.
            callback(null);
        }
    };

    request.onerror = function(event) {
        console.error('Error searching for host:', event.target.error);
        callback(null);
    };
}

// Listen for web requests 
// main api call handler
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        // Extract hostname from the URL
        const url = new URL(details.url);
        const hostname = url.hostname;

        // open the database and search for matching host
        openDatabase().then(db => {
            // sends the db, hostname, and a function to execute once the host is found (or not found)
            findMatchingHost(db, hostname, (host) => {
                if (host) {
                    const utmResult = extractUtmsByStorageType(host, url, details);
                    saveCallRecord(db, hostname, utmResult, details);
                } else {
                    // console.log('No matching host found for hostname:', hostname);
                }
            });
        }).catch(error => {
            console.error('Error opening database:', error);
        });
    }, 
    // Filter to listen to all urls
    { urls: ["<all_urls>"] }
);

/**
 *  Call Stack for successful api handling:
 *  --> call line 296: findMatchingHost(db, hostname, callback)
 *  --> call line 296: function(host)
 *  --> call line 298: extractUtmsByStorageType(host, url, details)
 *  --> call line 218: handleUrlStorageType(host, url, details) [for url storage type hosts]
 *  <-- return utm parameters to extractUtmsByStorageType()
 *  <-- return utm parameters to function(host)
 *  --> call line 299: saveCallRecord(db, hostname, utmResult, details)
 *  <-- return nothing to function(host)
 *  <-- return nothing to findMatchingHost()
 *  end of call stack.
 */