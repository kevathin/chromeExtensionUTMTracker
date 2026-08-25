import { openDatabase, fillHostTable, fillCookieTable, fillSettingsTable, fillSessionDataTable } from './utils/dbHelper.js';
import { extractorFunctions } from './utils/extractors.js';
import { isURL, extractUtmsFromUrl } from './utils/extractorHelpers.js';
/* ------------------------ -------------------------*/
/*              Main API Tracking Function           */
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
            // finds the matching host for the API call hostname
            const STOREDHOSTDATA = await findMatchingHost(db, HOSTNAME);

            // STOREDHOSTDATA is false if the findMatchingHost() timed out or if the api call did not match the hostnames in the db
            if(!STOREDHOSTDATA) return;

            // obtain extractor function using basic host data.
            const extractor = extractorFunctions[STOREDHOSTDATA.funcName];

            // check if extractor exists
            if(!extractor){
                console.warn(`No extractor found for funcName: ${STOREDHOSTDATA.funcName}`);
                return;
            }

            /* obtain utm/user data from extractor function
                extractedData structure:
                {
                utmSource:{{value}},
                utmMedium:{{value}}
                }
            */
            const extractedData = await extractor(STOREDHOSTDATA, URL, details);

            // check if data was collected
            if(!extractedData){
                console.warn(`No extracted data for: ${URL}`);
                return;
            }

            await saveCallRecord(STOREDHOSTDATA, extractedData, details);

            db.close();
        }).catch(error => {
            console.error('Error opening database:', error);
        });
    }, 
    // Filter to listen to all urls
    { urls: ["<all_urls>"] },
    ["requestBody"]
);

/* ------------------------ -------------------------*/
/*              Main Helper Functions                */
/* ------------------------ ------------------------ */

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

        // if the timer runs out, it will resolve the promise with a value of null
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
                if (hostname.includes(host.hostname) && !host['excludecontains']?.some(excludeStr => hostname.includes(excludeStr))) {
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

async function saveCallRecord() {
    return new Promise((resolve)=>{

    });
}