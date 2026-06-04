import { openDatabase, fillHostTable, fillCookieTable, fillSettingsTable } from './utils/dbHelper.js';
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

// Helper to resolve the active page URL for a request, including the full path when available.
async function getRecordedCurrentUrl(details) {
    return new Promise((resolve) => {
        // Use details.tabId directly - no guessing which tab is active
        if (details.tabId && details.tabId > 0) {
            chrome.tabs.get(details.tabId, (tab) => {
                if (chrome.runtime.lastError || !tab) {
                    // fallback if tab isn't accessible
                    const url = new URL(details.documentUrl || details.initiator || details.url);
                    resolve(url.hostname + url.pathname);
                } else {
                    const url = new URL(tab.url);
                    resolve(url.hostname + url.pathname);
                }
            });
        } else {
            // fallback for requests not tied to a tab (e.g. background requests)
            const url = new URL(details.documentUrl || details.initiator || details.url);
            resolve(url.hostname + url.pathname);
        }
    });
}

// Handler for 'url' storage type - checks historic URL, current URL, then API URL
function handleUrlStorageType(host, url, details) {
    const params = url.searchParams;
    let utmSource = '';
    let utmMedium = '';
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
        medium: utmFound ? utmMedium : 'notfound'
    };
}

// Simple URL validation helper
function isURL(str){
    try {
        const url = new URL(str);
        return true;
    } catch (e) {
        return false;
    }
}

// Handler for 'bin' storage type - extracts from API-level parameters
async function handleBinStorageType(host, url, details) {
    // clarity likely uses a GZIP-compressed binary payload
    // get the array buffer from the request body
    const arrayBuffer = details.requestBody?.raw?.[0]?.bytes;
    if (arrayBuffer) {
        console.log('BCP 1: entered array buffer handeling for: ', url.href);
        try{
            // don't event ask, i have no idea how this works
            const ds = new DecompressionStream('gzip');
            const blob = new Blob([arrayBuffer]);
            const stream = blob.stream().pipeThrough(ds);
            const decompressed = await new Response(stream).arrayBuffer();
            const result = new TextDecoder().decode(decompressed);

            // print the decompressed payload to the console
            //console.log("Decompressed value: ", result);
            const jsonResult = JSON.parse(result);
            
            // is the sequence number greater than 1 ignore the call because on the first sequence api call contains the utm parameters

            if (jsonResult["e"][1] > 1) {
                console.log("BCP 2: rejected call: ", url.href);
                return{
                    source: '',
                    medium: '',
                    ignore: 'true'
                }
            }
            console.log('BCP 2: accepted call: ', url.href);
            // navigate the "a" envelope to find the utm parameters
            // the "a" envelope contains an array of lists
            // one one of the lists contains the old and current url with the utm parameters in the query string
            // unfortunately, there is no fixed position for this list in the "a" envelope so we need to loop through all the lists to find it

            // for each list in the "a" envelope
            for (const list of jsonResult["a"]){
                // list[1] should contain the current url with possible utm parameters
                // list[2] is either empty or contains the old url with utm parameters

                // check if the list contains the url at 1, if so, then we found the right list
                if (list[1] && isURL(list[1])){
                    
                    console.log('BCP 3: found the url-containing list in the "a" envelope: ', list[1]);
                    // chick if historic url exists
                    if (list[2] && isURL(list[2])){
                        // extrack utm parameters from the historic url
                        console.log('BCP 4: found historic url in the "a" envelope: ', list[2]);
                        const historicResult = extractUtmsFromUrl(list[2], host);
                        // if found, return the utm parameters
                        if (historicResult.source || historicResult.medium) {
                            console.log('BCP 5: found historic utm values: ', list[2]);
                            return {
                                source: historicResult.source || 'notfound',
                                medium: historicResult.medium || 'notfound'
                            };
                        }
                        console.log('BCP 5-1: no historic utm values found: ', list[2]);
                    }

                    // check the current url for utm parameters
                    console.log('BCP 5-2: checking current url for utm parameters: ', list[1]);
                    const currentResult = extractUtmsFromUrl(list[1], host);
                    return {
                        source: currentResult.source || 'notfound',
                        medium: currentResult.medium || 'notfound'
                    };
                }
            }
            
            console.log("unable to find url in 'a' envelope");
            return {
                source: 'notfound',
                medium: 'notfound'
            }

        } catch(e){
            console.log("we cooked fr", e.message);
            console.log("we cooked url", url.href);
        }
    }

    return {
        source: 'notfound',
        medium: 'notfound',
    }
}


// Handler for 'json' storage type.
// ex urlencoded query parameter: ups[rpv]: "%7B%22utm_source%22%3A%22google%22%2C%22utm_medium%22%3A%22cpc%22%7D"
function handleJsonStorageType(host, url, details) {
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
    };
    
}

// Dispatcher function to handle UTM extraction based on storage type
function extractUtmsByStorageType(host, url, details) {
    // handle the api call based on the storage type.
    if (host.storagetype === 'url') {
        return handleUrlStorageType(host, url, details);
    } else if (host.storagetype === 'bin') {
        return handleBinStorageType(host, url, details);
    } else if(host.storagetype === 'json') {
        return handleJsonStorageType(host, url, details);
    }else {
        // Default fallback for unknown storage types
        console.warn('Unknown storage type:', host.storagetype);
        return {
            source: 'notfound',
            medium: 'notfound'
        };
    }
}

// Helper function to save a call record to the database
async function saveCallRecord(db, hostname, utmResult, details) {
    const currenturl = await getRecordedCurrentUrl(details);
    if(utmResult.ignore && utmResult.ignore === 'true'){
        // currently, this is only used for clarity because only the first clarity call for each page contains the utm parameters
        return;
    }
    const callRecord = {
        time: Date.now(),
        hostname: hostname,
        utmsource: utmResult.source,
        utmmedium: utmResult.medium,
        apiurl: details.url,
        currenturl: currenturl || 'notfoundcheck'
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
    { urls: ["<all_urls>"] },
    ["requestBody"]
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