import { openDatabase, fillHostTable, fillCookieTable, fillSettingsTable } from './utils/dbHelper.js';
/* ------------------------ -------------------------*/
/*                  api tracking setup               */
/* ------------------------ ------------------------ */



/**
 * Main api call listener
 */
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        // Extract hostname from the URL
        const URL = new URL(details.url);
        const HOSTNAME = URL.hostname;

        // open the database and search for matching host
        openDatabase().then(async (db) => {
            // sends the db, hostname, and a function to execute once the host is found (or not found)
            const STOREDHOSTDATA = await findMatchingHost(db, HOSTNAME);

            // STOREDHOSTDATA is false if the findMatchingHost() timed out or if the api call did not match the hostnames in the db
            if(!STOREDHOSTDATA) return;

            // Extract UTM and user data 
            const data = extractUtmsByHostname()

        }).catch(error => {
            console.error('Error opening database:', error);
        });
    }, 
    // Filter to listen to all urls
    { urls: ["<all_urls>"] },
    ["requestBody"]
);

/**
 * Finds and returns the basic host data from the db if found.
 * Function has a timeout of 2 seconds
 * If the function is timed out or if the host is not found, it returns null
 * 
 * @param {*} db - the indexeddb
 * @param {*} hostname - the hostname of the api call
 * @returns basic host data if matched a host in db or NULL
 */
async function findMatchingHost(db, hostname) {
    return new Promise((resolve)=>{

        let settled = false;

        const safeResolve = (value) =>{
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve(value);
        }

        // set 2 second timer
        const timer = setTimeout(() => {
            console.warn('findMatchingHost() - timed out after 2s');
            safeResolve(null);
        }, 2000);

        // open read only transaction with hosts store
        const transaction = db.transaction(['hosts'], 'readonly');
        // get the hosts store 
        const store = transaction.objectStore('hosts');
        // make the request
        const request = store.openCursor();

        // on request success 
        request.onsuccess = function(event) {
            const cursor = event.target.result;
            if (cursor) {
                const host = cursor.value;
                // if hostname is found and hostname does not contain the excluding values
                if (hostname.includes(host.hostname) && !host['excludeContains']?.some(excludeStr => hostname.includes(excludeStr))) {
                    //
                    safeResolve(host);
                } else {
                    // else, continue searching for a match in the next record
                    cursor.continue();
                }
            } else {
                // No matching hostname found, return null to callback.
                safeResolve(null);
            }
        };

        request.onerror = function(event) {
            console.error('findMatchingHost() - store request failed: ', event.target.error);
            safeResolve(null);
        };
    });   
}

/**
 * 
 * 
 * @param {*} STOREDHOSTDATA - The matched basic hostname information
 * @param {*} URL - The API call url
 * @param {*} details -  API call details
 * @returns extracted utm and user ID data (if applicable) in json format 
 */
async function extractUtmsByHostname(STOREDHOSTDATA, URL, details) {
    return new Promise((resolve) =>{
        
    });
}

// Simple URL validation helper
async function isURL(str){
    try {
        const url = new URL(str);
        return true;
    } catch (e) {
        return false;
    }
}

// Helper function to extract UTM parameters from a given URL string based on host configuration
async function extractUtmsFromUrl(urlString, host) {

}

// Helper function to save a call record to the database
async function saveCallRecord(db, hostname, utmResult, details) {
    
}