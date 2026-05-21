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

function openCallHistory(){
    // get templates
    const sectionTemplate = document.getElementById('historySectionTemplate');
    const mainTemplate = document.getElementById('mainTemplate');
    const callRecordTemplate = document.getElementById('callRecordTemplate');


    // replace footer
    createHistoryFooterButtons('Call');
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
        const clearFn = window[clearFnName];
        if (typeof clearFn === 'function') {
            clearFn();
        } else {
            console.error(`No function found for ${clearFnName}`);
        }
    });

    // append buttons to footer and footer to body
    footer.appendChild(returnButton);
    footer.appendChild(clearButton);

    document.body.appendChild(footer);s
}

function clearCookieHistory(){
    openDatabase().then(db => {
        const tx = db.transaction('cookiehistory', 'readwrite');
        const store = tx.objectStore('cookiehistory');
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
    openDatabase().then(db => {
        const tx = db.transaction('call', 'readwrite');
        const store = tx.objectStore('call');
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

/* ------------------------ turn into package later -------------------------*/
/*                  base database setup              */
/* ------------------------ ------------------------ */


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
                store.createIndex('historicurlid', 'historicurlid', { unique: false });
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
        { hostname: 'analytics.google.com', standardname: 'Google Analytics', storagetype: 'url', source: 'utm_source', medium: 'utm_medium', urlid: 'dl', historicurlid: 'dr' },
        { hostname: 'y.clarity.ms', standardname: 'Clarity', storagetype: 'notfound', source: 'notfound', medium: 'notfound', urlid: 'notfound', historicurlid: 'notfound'},
        { hostname: 'track.hubspot.com', standardname: 'HubSpot', storagetype: 'url', source: 'utm_source', medium: 'utm_medium', urlid: 'pu', historicurlid: 'r'},
        { hostname: 'www.facebook.com', standardname: 'Facebook Pixel', storagetype: 'url', source: 'utm_source', medium: 'utm_medium', urlid: 'dl', historicurlid: 'rl'}
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