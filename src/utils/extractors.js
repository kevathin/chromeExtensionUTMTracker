export const extractorFunctions = {

    /**
     * Google Analytics Extraction notes:
     * the curr
     * 
     * @param {*} STOREDHOSTDATA - contains the stored host data
     * @param {*} URL - current api call url
     * @param {*} details - current api call details
     * @returns - raw api call tracking data (utm parameters)
     */
    async googleAnalyticsExtractor(STOREDHOSTDATA, URL, details){
        return new Promise((resolve) =>{

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

        });
    },

    /**
     * 
     * @param {*} STOREDHOSTDATA - contains the stored host data
     * @param {*} URL - current api call url
     * @param {*} details - current api call details
     * @returns - raw api call tracking data (utm parameters)
     */
    async clarityExtractor(STOREDHOSTDATA, URL, details){
        return new Promise((resolve) =>{

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

        });
    },

    /**
     * 
     * @param {*} STOREDHOSTDATA - contains the stored host data
     * @param {*} URL - current api call url
     * @param {*} details - current api call details
     * @returns - raw api call tracking data (utm parameters)
     */
    async hubSpotExtractor(STOREDHOSTDATA, URL, details){
        return new Promise((resolve) =>{

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
            
        });
    },

    /**
     * 
     * @param {*} STOREDHOSTDATA - contains the stored host data
     * @param {*} URL - current api call url
     * @param {*} details - current api call details
     * @returns - raw api call tracking data (utm parameters)
     */    
    async googleAdsExtractor(STOREDHOSTDATA, URL, details){
        return new Promise((resolve) =>{

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
            
        });
    },

    /**
     * 
     * @param {*} STOREDHOSTDATA - contains the stored host data
     * @param {*} URL - current api call url
     * @param {*} details - current api call details
     * @returns - raw api call tracking data (utm parameters)
     */    
    async linkedInAdsExtractor(STOREDHOSTDATA, URL, details){
        return new Promise((resolve) =>{

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
            
        });
    },

    /**
     * 
     * @param {*} STOREDHOSTDATA - contains the stored host data
     * @param {*} URL - current api call url
     * @param {*} details - current api call details
     * @returns - raw api call tracking data (utm parameters)
     */    
    async facebookExtractor(STOREDHOSTDATA, URL, details){
        return new Promise((resolve) =>{

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
            
        });
    }
};