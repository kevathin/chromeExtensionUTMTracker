# chromeExtensionUTMTracker
A Google Chrome Extension that tracks UTM parameters
//-------------------------------------------------------//
//------------------Development Testing------------------//
//-------------------------------------------------------//
In terminal, run:
--> "npm run build" 

In chrome://extensions/:
--> set Developer mode on
--> load unpacked

//-------------------------------------------------------//
//------------------File Structure-----------------------//
//-------------------------------------------------------//

dist: 
--> contains the packaged js using vite
node_modules: 
--> contains vite code
src:
--> utils:
--> --> dbHelper.js: contains indexedDB helper functions
--> popup.js: contains ui javascript
--> background.js: contains background tracking javascript
index.png: the html for ui including templates.
manifest.json: Google Chrome extension configuration 
package.json: (I think) node configuration including dependices 
package-lock.json: god knows
vite.config.js: Vite configuration

//-------------------------------------------------------//
//------------------Database Structure-------------------//
//-------------------------------------------------------//
--------- pending update -------
call:
--> id: unqiue api call id (pk ordered)
--> time: the time the api call was made
--> hostname: the hostname of the api (ex: analytics.google.com) (fk)
--> utmsource: the utm_source specified in the api call.
--> utmmedium: the utm_medium specified in the api call.
--> apiurl: page url sent (if found)
--> currenturl: current url of user

hosts:
--> hostname: the hostname of the api (ex: analytics.google.com) (pk)
--> excludeContains: exclude the hostname call if it contains value {{x}}
--> standardname: the standard name of the hostname (ex: Google Analytics)
--> storagetype: (A: in url, B: in separate header)
--> source: the name of the header or part of url containing the session source data.
--> medium: the name of the header or part of url containing the session medium data.
--> curid: the id containing the current url/utm data
--> historicid: the id containing the landing page url/utm data

cookies:
--> name: the specific cookie name (pk)
--> type: source, or medium, or campaign, etc. (aka what does it store)
--> software: tracking software name or default.

cookiehistory:
--> id: (pk ordered)
--> cookieid: specific cookie mentioned(fk)
--> value: value of cookie
--> stage: at what stage of the page was this cookie tracked(start, end, idle)
--> currenturl: current url of user

settings:
--> key: (pk) the name of the setting
--> value: true or false depending on the setting

//-------------------------------------------------------//
//------------------Popup Structure----------------------//
//-------------------------------------------------------//

Homepage (when user clicks popup)
[]-----------------------------------------[]
|                                           |
|              UTM Tracker                  |
|                                           |
|[]---------------------------------------[]|
| |        View Cookie History            | |
|[]---------------------------------------[]|
|[]---------------------------------------[]|
| |        View Call History              | |
|[]---------------------------------------[]|
|[]---------------------------------------[]|
| |        View Tracked Cookies           | |
|[]---------------------------------------[]|
|[]---------------------------------------[]|
| |        View Tracked calls             | |
|[]---------------------------------------[]|
|[]---------------------------------------[]|
| |        Settings                       | |
|[]---------------------------------------[]|
[]-----------------------------------------[]

History Pages (view cookie history or view call history)
(snaphots contain tracked data using a scroll method to prevent clutter) (snapshot can either be the host name for call history or the snapshot name for cookie history)
[]-----------------------------------------[]
|                                           |
|              {{type}} history             |
|                                           |
|[]---------------------------------------[]|
| |    v    {{page name}}                 | | (drop down)
| | []---------------------------------[] | |
| |  |        snapshot A.              |  | | 
| | []---------------------------------[] | |
| | []---------------------------------[] | |
| |  |        snapshot B (older).      |  | |
| | []---------------------------------[] | |
|[]---------------------------------------[]|
|[]---------------------------------------[]|
| |    >    {{page name}}                 | | (drop down)
|[]---------------------------------------[]|
|[]-----------------[][]-----------------[] |
| |      back       |  |   clear history |  | (buttons)
|[]-----------------[][]-----------------[] |
[]-----------------------------------------[]


Tracked settings (view tracked cookies or view tracked domains)

[]-----------------------------------------[]
|                                           |
|             tracked {{type}}              |
|                                           |
|[]---------------------------------------[]|
| |    v    {{tracked name}}   []remove[] | | (drop down)
| | []---------------------------------[] | |
| |  | variable:    value      []edit[]|  | |
| | []---------------------------------[] | |
| | []---------------------------------[] | |
| |  | variable:    value      []edit[]|  | |
| | []---------------------------------[] | |
|[]---------------------------------------[]|
|[]---------------------------------------[]|
| |    >    {{tracked name}}              | | (drop down)
|[]---------------------------------------[]|
|[]-----------------[][]-----------------[] |
| |      back       |  |  restore default|  | (buttons)
|[]-----------------[][]-----------------[] |
[]-----------------------------------------[]