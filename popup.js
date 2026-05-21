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
                    openCallHistory();
                    break;
                case 'viewCallHistoryBtn':
                    openCookieHistory();
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
    const sectionTemplate = document.getElementById('historySectionTemplate');

}

function openCallHistory(){
    const sectionTemplate = document.getElementById('historySectionTemplate');

}

function openTrackedCookies(){

}

function openTrackedCalls(){

}

function getCurrentView(){
    
}