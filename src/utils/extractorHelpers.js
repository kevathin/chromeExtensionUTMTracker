// Simple URL validation helper
export async function isURL(str){
    return new Promise((resolve) =>{
        try {
        const url = new URL(str);
        resolve(true);
    } catch (e) {
        resolve(false);
    }
    });
}

// Helper function to extract UTM parameters from a given URL string based on host configuration
export async function extractUtmsFromUrl(urlString, host) {
    return new Promise((resolve) =>{
        
    });
}

 
/**
 * Because GA4 doesn't store the original page but just the previous page and current page, 
 * this function is used to cross check the previous page and session id
 * 
 * @returns - {sidtest:t/f, pagetest:t/f}
 * 
 */
export async function testGA4Accuracy(){
    return new Promise((resolve) =>{
        
    });
}