import { openDatabase, fillHostTable, fillCookieTable, fillSettingsTable } from './utils/dbHelper.js';

/**
 * because of how vite packages modules, window[functionName] does not work.
 * So instead we create a mapping of clear functions that can be called by name when creating the footer buttons.
 */
const clearFunctions = {
    clearCallHistory,
    clearCookieHistory
};

document.addEventListener('DOMContentLoaded', function() {
    // Variables 
    const dbchannel = new BroadcastChannel('db_updates');
    const homebuttons = document.getElementsByClassName('homepageButton');
    const returnbutton = document.getElementsByClassName('returnButton');

    // ---------------- Button Listeners ----------------

    // for each home button
    for (const button of homebuttons) {

        // add click event listener
        button.addEventListener('click', (e) => {

            const buttonId = e.target.id;

            // open template page based on button id
            switch (buttonId) {
                case 'viewCookieHistoryBtn':
                    openCookieHistory();
                    break;
                case 'viewCallHistoryBtn':
                    openCallHistory();
                    break;
                case 'viewTrackedCookiesBtn':
                    openTrackedCookies();
                    break;
                case 'viewTrackedCallsBtn':
                    openTrackedCalls();
                    break;
                default:
                    console.log('Unknown button clicked');
            }
        });

    }

    for (const button of returnbutton) {
        button.addEventListener('click', (e) => {
            
        });
    }

    // ---------------- Channel Listeners ----------------

    // listen for db updates from background
    dbchannel.onmessage = function(event) {
        const message = event.data;
        console.log('Received message on channel:', message);
        // Handle the message as needed (e.g., update UI, fetch new data, etc.)
    }
});

function openCookieHistory(){
    // get templates
    const sectionTemplate = document.getElementById('historySectionTemplate');
    const mainTemplate = document.getElementById('mainTemplate');


    // replace footer
    createHistoryFooterButtons('Cookie');
}

function openSettings(){

}

function openCallHistory(){
    // get templates
    const sectionTemplate = document.getElementById('historySectionTemplate');
    const mainTemplate = document.getElementById('mainTemplate');
    const callRecordTemplate = document.getElementById('callRecordTemplate');
    // clear page
    clearPage();
    // get call history data:
    fetchCallHistory().then(callHistory => {
        // step 1: fill main template with "Call History" title and append to body
        const mainClone = mainTemplate.content.cloneNode(true);
        const mainTitle = mainClone.querySelector('.mainHead h1');
        mainTitle.textContent = 'Call History';
        document.body.appendChild(mainClone);
        const mainContent = document.querySelector('.mainContent');

        // step 2: iterate through each page (currentUrl)
        for (const currentUrl in callHistory) {
            const pageSection = sectionTemplate.content.cloneNode(true);
            const pageHead = pageSection.querySelector('.historyBoxHead');
            const pageTitle = pageSection.querySelector('.historyBoxTitle');
            const pageArrow = pageSection.querySelector('.dropDownArrow');
            const pageContent = pageSection.querySelector('.historyBoxContent');

            // set page title and initialize hidden
            pageTitle.textContent = currentUrl;
            pageContent.classList.add('contentHidden');
            pageArrow.textContent = '>';

            // step 3: add dropdown listener for page section
            pageHead.addEventListener('click', function() {
                const isHidden = pageContent.classList.contains('contentHidden');
                if (isHidden) {
                    pageContent.classList.remove('contentHidden');
                    pageArrow.textContent = 'v';
                } else {
                    pageContent.classList.add('contentHidden');
                    pageArrow.textContent = '>';
                }
            });

            // step 4: iterate through each standard hostname
            for (const standardName in callHistory[currentUrl]) {
                const hostSection = sectionTemplate.content.cloneNode(true);
                const hostHead = hostSection.querySelector('.historyBoxHead');
                const hostTitle = hostSection.querySelector('.historyBoxTitle');
                const hostArrow = hostSection.querySelector('.dropDownArrow');
                const hostContent = hostSection.querySelector('.historyBoxContent');

                // change h2 to h3 for nested level
                const h3 = document.createElement('h3');
                h3.className = 'historyBoxTitle';
                h3.textContent = standardName;
                hostTitle.replaceWith(h3);

                // set host section hidden and add listener
                hostContent.classList.add('contentHidden');
                hostArrow.textContent = '>';

                hostHead.addEventListener('click', function() {
                    const isHidden = hostContent.classList.contains('contentHidden');
                    if (isHidden) {
                        hostContent.classList.remove('contentHidden');
                        hostArrow.textContent = 'v';
                    } else {
                        hostContent.classList.add('contentHidden');
                        hostArrow.textContent = '>';
                    }
                });

                // step 5: iterate through each call record
                for (const callId in callHistory[currentUrl][standardName]) {
                    const call = callHistory[currentUrl][standardName][callId];
                    const callRecord = callRecordTemplate.content.cloneNode(true);
                    const callHead = callRecord.querySelector('.callRecordBoxHead');
                    const callTitle = callRecord.querySelector('.callRecordBoxTitle');
                    const callArrow = callRecord.querySelector('.dropDownArrow');
                    const callContent = callRecord.querySelector('.callRecord');
                    const callUrl = callRecord.querySelector('.callRecordUrl');
                    const callSource = callRecord.querySelector('.callRecordSource');
                    const callMedium = callRecord.querySelector('.callRecordMedium');

                    // set call record data with labels
                    callTitle.textContent = `Call ID: ${callId}`;
                    callUrl.textContent = `API URL: ${call.apiurl}`;
                    callSource.textContent = `UTM Source: ${call.utmsource}`;
                    callMedium.textContent = `UTM Medium: ${call.utmmedium}`;

                    // set call record hidden and add listener
                    callContent.classList.add('contentHidden');
                    callArrow.textContent = '>';

                    callHead.addEventListener('click', function() {
                        const isHidden = callContent.classList.contains('contentHidden');
                        if (isHidden) {
                            callContent.classList.remove('contentHidden');
                            callArrow.textContent = 'v';
                        } else {
                            callContent.classList.add('contentHidden');
                            callArrow.textContent = '>';
                        }
                    });

                    hostContent.appendChild(callRecord);
                }

                pageContent.appendChild(hostSection);
            }

            mainContent.appendChild(pageSection);
        }

        // step 6: replace footer
        createHistoryFooterButtons('Call');
    }).catch(error => {
        console.error('Error fetching call history:', error);
    });
}

function openTrackedCookies(){

}

function openTrackedCalls(){

}

function openHomepage(){

}

function getCurrentView(){
    
}

/**
 * If popup is open on call history viewand a new call is recorded, 
 * this function should be called to update the call history view in real time.
 */
function updateCallHistoryView(){

}


/**
 * If popup is open on cookie history view and a new cookie value is recorded, 
 * this function should be called to update the cookie history view in real time.
 */
function updateCookieHistoryView(){
    
}

function createSettingsFooterButtons(page){
    // page is either 'Call' or 'Cookie' - determines which clear function the clear button calls
    const pageName = String(page).trim();
    if (!pageName) {
        console.error('createFooterButtons requires a page name.');
        return;
    }

    clearFooterButtons();

}

function clearFooterButtons(){
    const existingFooter = document.getElementById('pageFooter');
    if (existingFooter) {
        existingFooter.remove();
    }
}

function createHistoryFooterButtons(page){
    // page is either 'Call' or 'Cookie' - determines which clear function the clear button calls
    const pageName = String(page).trim();
    if (!pageName) {
        console.error('createFooterButtons requires a page name.');
        return;
    }

    // remove existing footer if it exists to prevent duplicates
    clearFooterButtons();

    // create a new footer element with id 'pageFooter'
    const footer = document.createElement('footer');
    footer.id = 'pageFooter';

    // creates the return home button
    const returnButton = document.createElement('button');
    returnButton.id = 'returnHome';
    returnButton.textContent = 'Return Home';
    returnButton.addEventListener('click', openHomepage);

    // creates the clear history button
    const clearButton = document.createElement('button');
    clearButton.id = `clear${pageName}History`;
    clearButton.textContent = `Clear ${pageName} History`;
    clearButton.addEventListener('click', () => {
        const clearFnName = `clear${pageName}History`;
        const clearFn = clearFunctions[clearFnName];
        if (typeof clearFn === 'function') {
            clearFn();
        } else {
            console.error(`No function found for ${clearFnName}`);
        }
    });

    // append buttons to footer and footer to body
    footer.appendChild(returnButton);
    footer.appendChild(clearButton);

    document.body.appendChild(footer);
}


function clearCookieHistory(){
    // open db
    openDatabase().then(db => {
        // open transaction
        const tx = db.transaction('cookiehistory', 'readwrite');
        // open cookie store
        const store = tx.objectStore('cookiehistory');
        // clear store
        const request = store.clear();

        request.onsuccess = function() {
            console.log('Cookie history cleared successfully.');
        };

        request.onerror = function(event) {
            console.error('Error clearing cookie history:', event.target.error);
        };
    }).catch(error => {
        console.error('Error opening database:', error);
    });
}

function clearCallHistory(){
    // open db
    openDatabase().then(db => {
        // open transaction
        const tx = db.transaction('call', 'readwrite');
        // open call store
        const store = tx.objectStore('call');
        // clear store
        const request = store.clear();

        request.onsuccess = function() {
            console.log('Call history cleared successfully.');
        };

        request.onerror = function(event) {
            console.error('Error clearing call history:', event.target.error);
        };
    }).catch(error => {
        console.error('Error opening database:', error);
    });
}

function clearPage(){
    // get the document body and remove all child nodes to clear the page
    const body = document.body;
    while (body.firstChild) {
        body.removeChild(body.firstChild);
    }
}

/**
 * Fetch call history and return a nested JSON object grouped by current page URL.
 *
 * Result shape:
 * {
 *   "currentUrlA": {
 *     "Host Standard Name A": {
 *       "callId1": {
 *         "utmsource": "...",
 *         "utmmedium": "...",
 *         "apiurl": "..."
 *       },
 *       "callId2": { ... }
 *     },
 *     "Host Standard Name B": {
 *       "callId3": { ... }
 *     }
 *   },
 *   "currentUrlB": {
 *     "Host Standard Name A": {
 *       "callId4": { ... }
 *     }
 *   }
 * }
 *
 * Notes:
 * - `currenturl` is the page URL associated with the API call.
 * - `standardname` groups only hosts that actually made calls on that page.
 * - Each call ID is stored only under the matching host and current URL.
 *
 * Example output:
 * {
 *   "https://example.com/page1": {
 *     "Google Analytics": {
 *       "3": {
 *         "utmsource": "newsletter",
 *         "utmmedium": "email",
 *         "apiurl": "https://analytics.google.com/g/collect?..."
 *       }
 *     }
 *   },
 *   "https://example.com/page2": {
 *     "Google Analytics": {
 *       "2": {
 *         "utmsource": "social",
 *         "utmmedium": "cpc",
 *         "apiurl": "https://analytics.google.com/g/collect?..."
 *       }
 *     },
 *     "Facebook Pixel": {
 *       "1": {
 *         "utmsource": "campaign",
 *         "utmmedium": "paid",
 *         "apiurl": "https://www.facebook.com/tr/?..."
 *       }
 *     }
 *   }
 * }
 */
function findHostRecordForCall(hostMap, hostname) {
    for (const hostKey in hostMap) {
        if (hostname === hostKey || hostname.endsWith('.' + hostKey)) {
            return hostMap[hostKey];
        }
    }
    return null;
}

function fetchCallHistory(){
    return openDatabase().then(db => {
        return new Promise((resolve, reject) => {
            const hostMap = {};
            const result = {};
            const transaction = db.transaction(['hosts', 'call'], 'readonly');
            const hostStore = transaction.objectStore('hosts');
            const callStore = transaction.objectStore('call');

            hostStore.openCursor().onsuccess = function(event) {
                const cursor = event.target.result;
                if (cursor) {
                    hostMap[cursor.key] = cursor.value;
                    cursor.continue();
                } else {
                    callStore.openCursor(null, 'prev').onsuccess = function(callEvent) {
                        const callCursor = callEvent.target.result;
                        if (callCursor) {
                            // get call values
                            const call = callCursor.value;
                            // get call current url
                            const currentUrl = call.currenturl || 'notfound';
                            // get call hostname matched with call
                            const hostRecord = findHostRecordForCall(hostMap, call.hostname);
                            // get call hostname standard name
                            const standardName = hostRecord?.standardname || call.hostname || 'unknown';

                            // set current url key if not exist
                            if (!result[currentUrl]) {
                                result[currentUrl] = {};
                            }
                            // set standard hostname key if not exist
                            if (!result[currentUrl][standardName]) {
                                result[currentUrl][standardName] = {};
                            }

                            // store call info in the grouped current url and grouped standard hostname.
                            result[currentUrl][standardName][call.id] = {
                                utmsource: call.utmsource,
                                utmmedium: call.utmmedium,
                                apiurl: call.apiurl
                            };

                            callCursor.continue();
                        } else {
                            resolve(result);
                        }
                    };

                    callStore.openCursor().onerror = function(event) {
                        reject(event.target.error);
                    };
                }
            };

            hostStore.openCursor().onerror = function(event) {
                reject(event.target.error);
            };

            transaction.onerror = function(event) {
                reject(event.target.error);
            };
        });
    });
}
