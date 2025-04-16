/**
 * Set Environment Variables Script
 * 
 * This script sets the SUPABASE_KEY environment variable in Netlify
 * using the netlify-api-client instead of the CLI to avoid issues with long values.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read the .env file
const envFile = path.join(process.cwd(), '.env');
let supabaseKey = '';
let supabaseUrl = '';

try {
  const envContent = fs.readFileSync(envFile, 'utf8');
  
  // Extract SUPABASE_KEY
  const keyMatch = envContent.match(/SUPABASE_KEY=(.+)/);
  if (keyMatch && keyMatch[1]) {
    supabaseKey = keyMatch[1].trim();
    console.log('Found SUPABASE_KEY in .env file');
    
    // Safety check - don't log if it's a real key (longer than placeholder)
    if (supabaseKey.length > 50) {
      console.log('✓ Found valid Supabase service role key');
    } else {
      console.log('⚠️ Warning: SUPABASE_KEY in .env appears to be a placeholder');
    }
  } else {
    console.error('Could not find SUPABASE_KEY in .env file');
    process.exit(1);
  }
  
  // Extract SUPABASE_URL
  const urlMatch = envContent.match(/SUPABASE_URL=(.+)/);
  if (urlMatch && urlMatch[1]) {
    supabaseUrl = urlMatch[1].trim();
    console.log('Found SUPABASE_URL in .env file:', supabaseUrl);
  } else {
    console.error('Could not find SUPABASE_URL in .env file');
    process.exit(1);
  }
} catch (error) {
  console.error('Error reading .env file:', error.message);
  process.exit(1);
}

// Set the environment variables
console.log('Setting environment variables in Netlify...');

try {
  // Set SUPABASE_URL
  console.log('Setting SUPABASE_URL...');
  execSync(`netlify env:set SUPABASE_URL "${supabaseUrl}" --context production`, {
    stdio: 'inherit'
  });
  
  // Set SUPABASE_KEY with proper escaping
  console.log('Setting SUPABASE_KEY... (value hidden for security)');
  // For Windows cmd.exe, we need to escape quotes differently
  const isWindows = process.platform === 'win32';
  const escapedKey = isWindows 
    ? supabaseKey.replace(/"/g, '\\"') 
    : supabaseKey.replace(/"/g, '\\"');
  
  // Hide actual key from logs
  const command = `netlify env:set SUPABASE_KEY "${escapedKey}" --context production --secret`;
  
  // Execute with inherit for stdout but not for stderr to avoid leaking secrets
  const options = {
    stdio: ['inherit', 'inherit', 'pipe']
  };
  
  try {
    execSync(command, options);
    console.log('✓ SUPABASE_KEY set successfully');
  } catch (err) {
    console.error('Error setting SUPABASE_KEY. Exit code:', err.status);
    // Don't output the actual error message as it might contain the key
    console.error('Please check Netlify CLI permissions and try again');
  }
  
  console.log('Successfully set environment variables!');
  console.log('Triggering a new deploy to apply the changes...');
  
  execSync('netlify deploy --prod', {
    stdio: 'inherit'
  });
  
  console.log('Deployment triggered. Your site should now have the correct environment variables.');
} catch (error) {
  console.error('Error setting environment variables. Exit code:', error.status);
  process.exit(1);
} 