// Configuration for different environments
const config = {
    development: {
        apiUrl: 'http://localhost:3000'
    },
    production: {
        apiUrl: '' // Use relative path to work in any deployment
    }
};

// Determine environment based on hostname
const isProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

// Export the configuration
const currentConfig = isProduction ? config.production : config.development;

// Make config available globally
window.appConfig = currentConfig;

// Supabase Configuration
const SUPABASE_URL = 'https://spkbhpmqxdbqwpwzyykc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwa2JocG1xeGRicXdwd3p5eWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDk1MTYsImV4cCI6MjA1OTUyNTUxNn0.cJU1gjNPMBAIDjc80MR-IXX17Vh09nLtejKMUjIUvco';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make supabase client available globally
window.supabase = supabase; 