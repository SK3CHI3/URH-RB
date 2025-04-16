/**
 * Independent Scraper Deployment Script
 * 
 * This script sets up the scraper as a standalone service that runs
 * independently of the main web server. It can be deployed separately
 * and will continue scraping even if the web server is down.
 */

const pm2 = require('pm2');
const path = require('path');

const scraper = {
  name: 'resource-scraper-scheduler',
  script: path.resolve(__dirname, 'cron.js'),
  instances: 1,
  autorestart: true,
  watch: false,
  max_memory_restart: '500M',
  env: {
    NODE_ENV: 'production',
  },
};

// Connect to PM2
pm2.connect((err) => {
  if (err) {
    console.error('Error connecting to PM2:', err);
    process.exit(2);
  }

  // Check if the scraper is already running
  pm2.list((err, list) => {
    if (err) {
      console.error('Error listing processes:', err);
      pm2.disconnect();
      return;
    }

    // Look for existing scraper process
    const existingScraper = list.find(p => p.name === scraper.name);
    
    if (existingScraper) {
      console.log(`Scraper process '${scraper.name}' is already running.`);
      console.log('Restarting it to ensure latest code is used...');
      
      // Restart existing process
      pm2.restart(scraper.name, (err) => {
        if (err) {
          console.error('Error restarting scraper process:', err);
        } else {
          console.log(`Scraper process '${scraper.name}' restarted successfully.`);
        }
        pm2.disconnect();
      });
    } else {
      // Start a new process
      pm2.start(scraper, (err) => {
        if (err) {
          console.error('Error starting scraper process:', err);
          pm2.disconnect();
          return;
        }
        
        console.log(`Scraper process '${scraper.name}' started successfully.`);
        console.log('It will run at 12:00 AM and 12:00 PM every day.');
        console.log('The process will restart automatically if it crashes.');
        
        // Save the current process list to resurrect them later
        pm2.dump((err) => {
          if (err) {
            console.error('Error saving process list:', err);
          } else {
            console.log('Process list saved. PM2 will resurrect processes on system restart.');
            console.log('To ensure PM2 starts on system boot, run: pm2 startup');
          }
          
          pm2.disconnect();
        });
      });
    }
  });
}); 