require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client setup (to be configured with actual credentials)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
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
        const { category, sort } = req.query;
        
        // This would fetch from Supabase in a real app
        const resources = [
            {
                id: 1,
                title: 'freeCodeCamp - Full Stack Development',
                description: 'Learn web development with comprehensive courses covering HTML, CSS, JavaScript...',
                image: 'https://images.unsplash.com/photo-1555066931-bf19f8fd1085',
                rating: 4.9,
                source: 'freeCodeCamp',
                date_added: '20/02/2024',
                tags: ['Programming', 'Web Development', 'Full Stack'],
                category_id: 1
            },
            {
                id: 2,
                title: 'The Odin Project',
                description: 'Free full-stack curriculum from basics to advanced web development concepts.',
                image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
                rating: 4.8,
                source: 'The Odin Project',
                date_added: '19/02/2024',
                tags: ['Web Development', 'JavaScript', 'Ruby'],
                category_id: 1
            },
            {
                id: 3,
                title: 'MDN Web Docs',
                description: 'Comprehensive documentation and learning resources for web technologies.',
                image: 'https://images.unsplash.com/photo-1550063873-ab792950096b',
                rating: 4.9,
                source: 'Mozilla',
                date_added: '18/02/2024',
                tags: ['Documentation', 'Web Development', 'Reference'],
                category_id: 1
            }
        ];
        
        // Filter by category if provided
        let filteredResources = resources;
        if (category && category !== 'all') {
            filteredResources = resources.filter(resource => 
                resource.tags.includes(category) || 
                resource.category_id === parseInt(category)
            );
        }
        
        // Sort resources if sort parameter is provided
        if (sort === 'rating') {
            filteredResources.sort((a, b) => b.rating - a.rating);
        } else if (sort === 'newest') {
            // This is simplified; in a real app we'd use proper date objects
            filteredResources.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
        }
        
        res.json(filteredResources);
    } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({ error: 'Failed to fetch resources' });
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
}); 