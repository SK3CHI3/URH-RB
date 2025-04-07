// Configuration for different environments
const config = {
    development: {
        apiUrl: 'http://localhost:3000'
    },
    production: {
        apiUrl: 'https://urh-rb.onrender.com' // Replace with your actual production URL
    }
};

// Determine environment based on hostname
const isProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

// Export the configuration
const currentConfig = isProduction ? config.production : config.development;

// Make config available globally
window.appConfig = currentConfig; 