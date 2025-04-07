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
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '/')));

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
            { id: 5, name: 'Books', icon: 'fa-book', description: 'Free ebooks, digital publications, and reading materials' },
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