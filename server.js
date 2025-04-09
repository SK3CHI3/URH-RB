require('dotenv').config();
// Immediately verify environment variables are loaded
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase credentials. Please check your .env file');
  console.log('SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.log('SUPABASE_KEY:', supabaseKey ? 'Found' : 'Missing');
}

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client setup
// Using the variables we verified above
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    // Allow all origins in development
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));

// Serve static files from root directory
app.use(express.static(__dirname));

// API Routes

// Get categories
app.get('/api/categories', async (req, res) => {
    try {
        // This would fetch from Supabase in a real app
        const categories = [
            { id: 1, name: 'Technology', icon: 'fa-code', description: 'Programming tutorials, coding resources, and tech documentation' },
            { id: 2, name: 'Design', icon: 'fa-paint-brush', description: 'UI kits, design templates, and creative assets' },
            { id: 3, name: 'Business', icon: 'fa-briefcase', description: 'Business templates, guides, and entrepreneurship resources' },
            { id: 4, name: 'Education', icon: 'fa-graduation-cap', description: 'Online courses, tutorials, and learning materials' },
            { id: 5, name: 'Events', icon: 'fa-calendar-alt', description: 'Tech events, hackathons, and conferences from different regions' },
            { id: 6, name: 'Music', icon: 'fa-music', description: 'Music theory, instruments, and audio resources' }
        ];
        
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Get resources
app.get('/api/resources', async (req, res) => {
  try {
    const { category } = req.query;
    
    // Basic query
    let query = supabase
      .from('resources')
      .select('*, categories(name)')
      .order('created_at', { ascending: false })
      .limit(12);
    
    // Simple category filter
    if (category && category !== 'Featured') {
      try {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('id')
          .eq('name', category)
          .single();
          
        if (catError) {
          console.error('Error finding category:', catError);
        } else if (catData) {
          query = query.eq('category_id', catData.id);
        }
      } catch (catErr) {
        console.error('Error in category lookup:', catErr);
        // Continue with unfiltered query if category lookup fails
      }
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase query error:', error);
      throw new Error('Database query failed');
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ 
      error: 'Failed to fetch resources',
      message: error.message || 'Unknown server error'
    });
  }
});

// User routes (simplified)
app.post('/api/auth/register', async (req, res) => {
    // In a real app, this would use Supabase Auth
    res.json({ message: 'Registration endpoint (to be implemented with Supabase)' });
});

app.post('/api/auth/login', async (req, res) => {
    // In a real app, this would use Supabase Auth
    res.json({ message: 'Login endpoint (to be implemented with Supabase)' });
});

app.get('/api/user/interests', async (req, res) => {
    // In a real app, this would fetch user interests from Supabase
    res.json({ message: 'User interests endpoint (to be implemented)' });
});

// Test endpoint for validating resource URLs
app.get('/api/test/resources', async (req, res) => {
  try {
    // Query all resources with their URLs
    const { data, error } = await supabase
      .from('resources')
      .select('id, title, url')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching resources for testing:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Validate each URL and provide diagnostic information
    const validatedResources = data.map(resource => {
      let isValid = false;
      let validationMessage = 'Missing URL';
      
      if (resource.url) {
        try {
          const url = new URL(resource.url);
          isValid = url.protocol === 'http:' || url.protocol === 'https:';
          validationMessage = isValid ? 'Valid URL' : `Invalid protocol: ${url.protocol}`;
        } catch (e) {
          validationMessage = `Invalid URL format: ${e.message}`;
        }
      }
      
      return {
        id: resource.id,
        title: resource.title,
        url: resource.url || 'No URL provided',
        isValid,
        validationMessage
      };
    });
    
    // Count valid and invalid URLs
    const validCount = validatedResources.filter(r => r.isValid).length;
    const invalidCount = validatedResources.length - validCount;
    
    res.json({
      total: validatedResources.length,
      validCount,
      invalidCount,
      resources: validatedResources
    });
    
  } catch (error) {
    console.error('Error in resource URL validation endpoint:', error);
    res.status(500).json({ error: error.message || 'Unknown error in validation endpoint' });
  }
});

// Admin endpoint to fix resource URLs (for development/testing only)
app.post('/api/admin/fix-resource-urls', async (req, res) => {
  try {
    // Simple admin check - in production, this would use proper authentication
    const { adminKey } = req.body;
    
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    // Get resources with missing or invalid URLs
    const { data, error } = await supabase
      .from('resources')
      .select('id, title, url');
    
    if (error) {
      throw new Error(`Error fetching resources: ${error.message}`);
    }
    
    const fixes = [];
    const failures = [];
    
    // Process each resource
    for (const resource of data) {
      let needsFix = false;
      let fixedUrl = resource.url;
      
      // Check if URL is missing or invalid
      if (!resource.url || resource.url === '#' || resource.url === '') {
        // Create a fallback URL based on the title
        const slug = resource.title
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, '-');
        
        fixedUrl = `https://example.com/resource/${slug}`;
        needsFix = true;
      } else {
        // Try to fix URLs without proper protocol
        try {
          new URL(resource.url);
        } catch (e) {
          // Assume it's missing the protocol
          if (resource.url.startsWith('www.')) {
            fixedUrl = `https://${resource.url}`;
            needsFix = true;
          } else if (!resource.url.startsWith('http://') && !resource.url.startsWith('https://')) {
            fixedUrl = `https://${resource.url}`;
            needsFix = true;
          }
        }
      }
      
      // Update the resource if needed
      if (needsFix) {
        const { error: updateError } = await supabase
          .from('resources')
          .update({ url: fixedUrl })
          .eq('id', resource.id);
        
        if (updateError) {
          failures.push({
            id: resource.id,
            title: resource.title,
            originalUrl: resource.url,
            error: updateError.message
          });
        } else {
          fixes.push({
            id: resource.id,
            title: resource.title,
            originalUrl: resource.url,
            fixedUrl
          });
        }
      }
    }
    
    res.json({
      success: true,
      processed: data.length,
      fixed: fixes.length,
      failed: failures.length,
      fixes,
      failures
    });
    
  } catch (error) {
    console.error('Error in fix-resource-urls endpoint:', error);
    res.status(500).json({
      error: 'Failed to fix resource URLs',
      message: error.message || 'Unknown error'
    });
  }
});

// User saved resources endpoints
// Save a resource
app.post('/api/user/saved-resources', async (req, res) => {
  try {
    const { user_id, resource_id } = req.body;
    
    if (!user_id || !resource_id) {
      return res.status(400).json({ error: 'Missing required fields: user_id and resource_id' });
    }
    
    console.log('Attempting to save resource:', { user_id, resource_id });
    
    // Check if already saved
    const { data: existingSave, error: checkError } = await supabase
      .from('saved_resources')
      .select('id')
      .eq('user_id', user_id)
      .eq('resource_id', resource_id)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error code
      console.error('Error checking existing save:', checkError);
      throw new Error(`Error checking existing save: ${checkError.message}`);
    }
    
    // If already saved, return success (idempotent operation)
    if (existingSave) {
      console.log('Resource already saved:', existingSave);
      return res.json({ 
        success: true, 
        id: existingSave.id,
        message: 'Resource already saved' 
      });
    }
    
    // Save the resource
    console.log('Inserting new saved resource');
    const { data, error } = await supabase
      .from('saved_resources')
      .insert([
        { user_id, resource_id, saved_at: new Date().toISOString() }
      ])
      .select()
      .single();
      
    if (error) {
      console.error('Error saving resource:', error);
      throw new Error(`Error saving resource: ${error.message}`);
    }
    
    console.log('Resource saved successfully:', data);
    res.status(201).json({
      success: true,
      id: data.id,
      message: 'Resource saved successfully'
    });
    
  } catch (error) {
    console.error('Error in save resource endpoint:', error);
    res.status(500).json({
      error: 'Failed to save resource',
      message: error.message || 'Unknown error'
    });
  }
});

// Unsave a resource
app.delete('/api/user/saved-resources', async (req, res) => {
  try {
    const { user_id, resource_id } = req.query;
    
    if (!user_id || !resource_id) {
      return res.status(400).json({ error: 'Missing required parameters: user_id and resource_id' });
    }
    
    console.log('Attempting to unsave resource:', { user_id, resource_id });
    
    // Remove the saved resource
    const { error } = await supabase
      .from('saved_resources')
      .delete()
      .eq('user_id', user_id)
      .eq('resource_id', resource_id);
      
    if (error) {
      console.error('Error removing saved resource:', error);
      throw new Error(`Error removing saved resource: ${error.message}`);
    }
    
    console.log('Resource unsaved successfully');
    res.json({
      success: true,
      message: 'Resource unsaved successfully'
    });
    
  } catch (error) {
    console.error('Error in unsave resource endpoint:', error);
    res.status(500).json({
      error: 'Failed to unsave resource',
      message: error.message || 'Unknown error'
    });
  }
});

// Get user's saved resources
app.get('/api/user/:user_id/saved-resources', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    console.log('Fetching saved resources for user:', user_id);
    
    if (!user_id) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }
    
    // Get saved resources with full resource details
    console.log('Running Supabase query for saved resources');
    const { data, error } = await supabase
      .from('saved_resources')
      .select(`
        id,
        saved_at,
        resources:resource_id (
          id, 
          title, 
          description, 
          url, 
          image_url, 
          source, 
          rating,
          created_at,
          categories(name)
        )
      `)
      .eq('user_id', user_id)
      .order('saved_at', { ascending: false });
      
    if (error) {
      console.error('Supabase error fetching saved resources:', error);
      throw new Error(`Error fetching saved resources: ${error.message}`);
    }
    
    console.log('Saved resources raw data:', JSON.stringify(data));
    
    // Format the response to make it more usable
    const formattedData = data.map(item => {
      console.log('Processing item:', JSON.stringify(item));
      if (!item.resources) {
        console.warn(`Item ID ${item.id} has no associated resource data`);
      }
      return {
        id: item.id,
        saved_id: item.id, // Add saved_id for unsave functionality
        saved_at: item.saved_at,
        ...(item.resources || {}),
      };
    });
    
    console.log(`Returning ${formattedData.length} formatted resources`);
    res.json(formattedData);
    
  } catch (error) {
    console.error('Error in get saved resources endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch saved resources',
      message: error.message || 'Unknown error'
    });
  }
});

// Check if a resource is saved by user
app.get('/api/user/:user_id/saved-resources/check', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { resource_ids } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }
    
    if (!resource_ids) {
      return res.status(400).json({ error: 'Missing required query parameter: resource_ids' });
    }
    
    // Parse the resource_ids from the query string
    // Handle a mixed array of strings and numbers
    const ids = resource_ids.split(',').map(id => {
      // Try to convert to integer but keep as string if it fails
      const parsed = parseInt(id.trim(), 10);
      return isNaN(parsed) ? id.trim() : parsed;
    });
    
    console.log('Checking saved status for resource IDs:', ids);
    
    // Get saved resources matching the provided IDs
    const { data, error } = await supabase
      .from('saved_resources')
      .select('resource_id')
      .eq('user_id', user_id)
      .in('resource_id', ids);
      
    if (error) {
      console.error('Error checking saved resources:', error);
      throw new Error(`Error checking saved resources: ${error.message}`);
    }
    
    console.log('Saved resources check result:', data);
    
    // Create a map of resource_id -> isSaved
    const savedMap = {};
    ids.forEach(id => {
      savedMap[id] = false;
    });
    
    // Update the ones that are saved
    data.forEach(item => {
      savedMap[item.resource_id] = true;
    });
    
    console.log('Returning saved map:', savedMap);
    res.json(savedMap);
    
  } catch (error) {
    console.error('Error in check saved resources endpoint:', error);
    res.status(500).json({
      error: 'Failed to check saved resources',
      message: error.message || 'Unknown error'
    });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Start the cron job for resource scraping
    if (process.env.NODE_ENV !== 'development' || process.env.RUN_CRON === 'true') {
        console.log('Starting resource scraper cron job...');
        require('./cron');
    } else {
        console.log('Resource scraper cron job not started in development mode. Set RUN_CRON=true to enable.');
    }
}); 