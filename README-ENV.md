# Setting Up Environment Variables for Netlify Deployment

This guide will help you set up and deploy the necessary environment variables for your Universal Resource Hub project on Netlify.

## Option 1: Using the .env File and Script (Recommended)

### Step 1: Configure Your .env File

Edit the `.env` file in this directory and replace the placeholder values with your actual Supabase credentials:

```
# Find these values in your Supabase dashboard > Project Settings > API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_service_role_key_here
```

**IMPORTANT: Never commit your actual API keys to the repository. The `.env` file should be added to `.gitignore`.**

### Step 2: Install the Netlify CLI (if not already installed)

```bash
npm install -g netlify-cli
```

### Step 3: Authenticate with Netlify

```bash
netlify login
```

### Step 4: Deploy Environment Variables

Run the deployment script:

```bash
node set-env.js
```

This script safely reads your local `.env` file and securely sets the environment variables in your Netlify project without exposing them in logs or build output.

### Step 5: Trigger a New Deployment

After importing the environment variables, trigger a new deployment:

```bash
netlify deploy --prod
```

## Option 2: Manual Configuration via Netlify Dashboard

If you prefer to set up variables manually:

1. Go to your Netlify site dashboard
2. Navigate to Site settings > Build & deploy > Environment
3. Click "Add variable" and add the following variables:
   - Key: `SUPABASE_URL` | Value: Your Supabase project URL
   - Key: `SUPABASE_KEY` | Value: Your Supabase service role key
4. Click "Save" after adding each variable
5. Deploy your site again for the changes to take effect

## Option 3: Using Netlify MCP Server

If you have Netlify MCP Server set up:

1. Configure the environment variables using the MCP tool:
   ```
   set-env-vars --siteId YOUR_SITE_ID --envVars SUPABASE_URL=your_url
   set-env-vars --siteId YOUR_SITE_ID --envVars SUPABASE_KEY=your_key --secret
   ```

2. Import variables from your .env file:
   ```
   import-env --siteId YOUR_SITE_ID --filePath .env
   ```

3. Trigger a new build:
   ```
   trigger-build --siteId YOUR_SITE_ID
   ```

## Troubleshooting

If you encounter 500 errors in your Netlify Functions after deployment:

1. Check the Netlify Function logs:
   ```bash
   netlify functions:logs --name saved-resources
   ```

2. Verify that your environment variables are correctly set in the Netlify dashboard

3. Make sure you're using the correct keys from Supabase:
   - For `SUPABASE_URL`: Use the project URL from Project Settings > API
   - For `SUPABASE_KEY`: Use the **service role key**, not the anon key

## Finding Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to Project Settings > API
4. Copy the Project URL for `SUPABASE_URL`
5. Copy the service_role secret for `SUPABASE_KEY`

Remember that the service role key has full access to your database, so keep it secure and never expose it in client-side code. 