// Scheduler for resource scraper
const { runScraper } = require('./scraper');

// Set initial delay of 10 seconds to allow server to fully start
const initialDelay = 10 * 1000;

// Interval in milliseconds (15 minutes = 15 * 60 * 1000)
const interval = 15 * 60 * 1000; 

// Log the schedule
console.log(`Resource scraper scheduled to run every 15 minutes.`);

// Run scraper once after initial delay, then at regular intervals
setTimeout(() => {
    // Initial run
    console.log(`[${new Date().toISOString()}] Running initial scrape...`);
    runScraper();
    
    // Set up interval for subsequent runs
    setInterval(() => {
        console.log(`[${new Date().toISOString()}] Running scheduled scrape...`);
        runScraper();
    }, interval);
}, initialDelay);

console.log(`Resource scraper successfully scheduled. First run in ${initialDelay/1000} seconds.`); 