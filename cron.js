/**
 * Resource Scraper Scheduler
 * Designed to run as a standalone service independent of the main web server
 */
const cron = require('node-cron');
const { runScraper } = require('./scraper');
const fs = require('fs');
const path = require('path');

// Set up logging
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, 'scraper.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Log to both console and file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

// Handle uncaught exceptions to prevent the service from crashing
process.on('uncaughtException', (err) => {
  log(`UNCAUGHT EXCEPTION: ${err.message}`);
  log(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  log('UNHANDLED REJECTION at Promise: ' + promise);
  log('Reason: ' + reason);
});

// Startup message
log('Resource scraper scheduler starting...');

// Run a scrape with error handling
async function runSafeScraperJob(jobName) {
  try {
    log(`Running ${jobName} scrape job...`);
    await runScraper();
    log(`${jobName} scrape job completed successfully`);
  } catch (error) {
    log(`Error in ${jobName} scrape job: ${error.message}`);
    log(error.stack);
  }
}

// Schedule jobs to run at 12:00 AM (midnight) and 12:00 PM (noon) every day
// Cron format: second(0-59) minute(0-59) hour(0-23) day(1-31) month(1-12) weekday(0-6)(Sunday=0)

// Run at midnight (00:00)
cron.schedule('0 0 0 * * *', () => {
  runSafeScraperJob('midnight');
});

// Run at noon (12:00)
cron.schedule('0 0 12 * * *', () => {
  runSafeScraperJob('noon');
});

// Optionally run immediately on startup
const runOnStartup = true;
if (runOnStartup) {
  // Small delay to allow system to initialize fully
  setTimeout(() => {
    runSafeScraperJob('initial');
  }, 5000);
}

log('Resource scraper scheduled successfully:');
log('- 12:00 AM (midnight) every day');
log('- 12:00 PM (noon) every day');
if (runOnStartup) {
  log('- Initial scrape will run in 5 seconds');
}

// Keep the process running and handle termination gracefully
process.on('SIGINT', () => {
  log('Received SIGINT. Shutting down gracefully...');
  logStream.end();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM. Shutting down gracefully...');
  logStream.end();
  process.exit(0);
});

log('Scheduler running. Service will continue running in the background.'); 