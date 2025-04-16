#!/usr/bin/env node

/**
 * Deploy Environment Variables Script
 * 
 * This script automates the process of importing environment variables
 * from a .env file to your Netlify site.
 * 
 * Usage:
 * 1. Make sure you have Netlify CLI installed: npm install -g netlify-cli
 * 2. Make sure you're authenticated with Netlify: netlify login
 * 3. Run this script: node deploy-env.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env file not found!');
  console.log('Please create a .env file in the current directory with your environment variables.');
  process.exit(1);
}

console.log('🌟 Netlify Environment Variables Deployment Tool 🌟');
console.log('------------------------------------------------');
console.log('This script will deploy the variables from your .env file to Netlify.');

// Ask for site ID
rl.question('\n📋 Enter your Netlify site ID or site name: ', (siteId) => {
  if (!siteId) {
    console.error('Error: Site ID is required!');
    rl.close();
    process.exit(1);
  }

  console.log(`\n🔄 Importing environment variables from .env file to Netlify site: ${siteId}`);
  
  try {
    // Run Netlify CLI command to import variables
    execSync(`netlify env:import ${envPath} --site=${siteId}`, { stdio: 'inherit' });
    
    console.log('\n✅ Environment variables successfully imported to Netlify!');
    console.log('\n🚀 Next steps:');
    console.log('1. Trigger a new build to apply the variables: netlify build --site=${siteId}');
    console.log('2. Or visit the Netlify dashboard to trigger a manual deploy.');
  } catch (error) {
    console.error('\n❌ Error importing environment variables:');
    console.error(error.message);
    console.log('\n🔍 Troubleshooting tips:');
    console.log('- Make sure you\'re logged in with the Netlify CLI (run netlify login)');
    console.log('- Verify that the site ID is correct');
    console.log('- Check that your .env file is properly formatted');
  }
  
  rl.close();
});

// Handle the close event
rl.on('close', () => {
  console.log('\n👋 Thank you for using the Environment Variables Deployment Tool!');
  process.exit(0);
}); 