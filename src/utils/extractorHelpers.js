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