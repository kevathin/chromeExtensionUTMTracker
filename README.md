# chromeExtensionUTMTracker
A Google Chrome Extension that tracks UTM parameters


Database Structure

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
--> standardname: the standard name of the hostname (ex: Google Analytics)
--> storagetype: (A: in url, B: in separate header)
--> source: the name of the header or part of url containing the session source data.
--> medium: the name of the header or part of url containing the session medium data.
--> urlid: the header id containing the url

cookies:
--> id: location + name
--> name: the specific cookie name (pk)
--> location: where is the cookie location (pk) 
--> type: source, or medium, or campaign, etc. (aka what does it store)

cookiehistory:
--> id: (pk ordered)
--> cookieid: (fk)
--> value: value of cookie
--> stage: (start, end, idle)
--> currenturl: current url of user
