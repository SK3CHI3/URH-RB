// Note: This would be a server-side script to handle web scraping
// It is a simplified version to demonstrate the concept
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Target websites for resources
const targetSites = [
    {
        name: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/news',
        selector: '.post-card',
        titleSelector: '.post-card-title a',
        descriptionSelector: '.post-card-excerpt',
        imageSelector: '.post-card-image',
        category: 'Technology',
        tags: ['Programming', 'Web Development']
    },
    {
        name: 'Smashing Magazine',
        url: 'https://www.smashingmagazine.com/articles/',
        selector: '.article--post',
        titleSelector: '.article--post__title a',
        descriptionSelector: '.article--post__teaser',
        imageSelector: '.article--post__image img',
        category: 'Design',
        tags: ['UI Design', 'UX Design']
    },
    {
        name: 'Entrepreneur',
        url: 'https://www.entrepreneur.com/latest',
        selector: '.entrepreneur-landing-card',
        titleSelector: '.entrepreneur-landing-card__title',
        descriptionSelector: '.entrepreneur-landing-card__description',
        imageSelector: '.entrepreneur-landing-card__image',
        category: 'Business',
        tags: ['Entrepreneurship', 'Business']
    }
];

/**
 * Scrape a website for resources
 * @param {object} site - Site configuration
 * @returns {Promise} - Scraped resources
 */
async function scrapeWebsite(site) {
    try {
        console.log(`Scraping ${site.name} at ${site.url}`);
        
        const response = await axios.get(site.url);
        const $ = cheerio.load(response.data);
        const resources = [];
        
        $(site.selector).each((i, el) => {
            // Limit to first 5 resources per site
            if (i >= 5) return false;
            
            const titleEl = $(el).find(site.titleSelector);
            const title = titleEl.text().trim();
            const url = titleEl.attr('href') || '';
            const description = $(el).find(site.descriptionSelector).text().trim();
            let imageUrl = '';
            
            if (site.imageSelector) {
                const imgEl = $(el).find(site.imageSelector);
                imageUrl = imgEl.attr('src') || imgEl.attr('data-src') || '';
                
                // Handle relative URLs
                if (imageUrl && !imageUrl.startsWith('http')) {
                    const baseUrl = new URL(site.url);
                    imageUrl = `${baseUrl.origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
                }
            }
            
            // Generate a reasonable rating (for demo purposes)
            const rating = (Math.random() * (5 - 4) + 4).toFixed(1);
            
            resources.push({
                title,
                description,
                url: url.startsWith('http') ? url : `${new URL(site.url).origin}${url.startsWith('/') ? '' : '/'}${url}`,
                image_url: imageUrl,
                source: site.name,
                rating: parseFloat(rating),
                category: site.category,
                tags: site.tags
            });
        });
        
        console.log(`Found ${resources.length} resources from ${site.name}`);
        return resources;
    } catch (error) {
        console.error(`Error scraping ${site.name}:`, error.message);
        return [];
    }
}

/**
 * Save resources to Supabase
 * @param {array} resources - Array of resources
 * @returns {Promise} - Save result
 */
async function saveResourcesToDatabase(resources) {
    try {
        console.log(`Saving ${resources.length} resources to database...`);
        
        for (const resource of resources) {
            // Check if resource already exists (by URL)
            const { data: existingResources, error: checkError } = await supabase
                .from('resources')
                .select('id')
                .eq('url', resource.url)
                .limit(1);
            
            if (checkError) {
                console.error('Error checking existing resource:', checkError);
                continue;
            }
            
            if (existingResources && existingResources.length > 0) {
                console.log(`Resource already exists: ${resource.title}`);
                continue;
            }
            
            // Get category ID
            const { data: categories, error: categoryError } = await supabase
                .from('categories')
                .select('id')
                .eq('name', resource.category)
                .limit(1);
            
            if (categoryError) {
                console.error('Error finding category:', categoryError);
                continue;
            }
            
            if (!categories || categories.length === 0) {
                console.error(`Category not found: ${resource.category}`);
                continue;
            }
            
            const categoryId = categories[0].id;
            
            // Save resource
            const { data: savedResource, error: saveError } = await supabase
                .from('resources')
                .insert({
                    title: resource.title,
                    description: resource.description,
                    url: resource.url,
                    image_url: resource.image_url,
                    rating: resource.rating,
                    source: resource.source,
                    category_id: categoryId
                })
                .select()
                .single();
            
            if (saveError) {
                console.error('Error saving resource:', saveError);
                continue;
            }
            
            // Save tags
            if (resource.tags && resource.tags.length > 0) {
                const tagsToInsert = resource.tags.map(tag => ({
                    resource_id: savedResource.id,
                    tag_name: tag
                }));
                
                const { error: tagError } = await supabase
                    .from('resource_tags')
                    .insert(tagsToInsert);
                
                if (tagError) {
                    console.error('Error saving tags:', tagError);
                }
            }
            
            console.log(`Saved resource: ${resource.title}`);
        }
        
        console.log('Resources saved successfully');
        return { success: true };
    } catch (error) {
        console.error('Error saving resources to database:', error);
        return { success: false, error };
    }
}

/**
 * Main function to run the scraper
 */
async function runScraper() {
    try {
        console.log('Starting resource scraper...');
        
        const allResources = [];
        
        // Scrape all target websites
        for (const site of targetSites) {
            const resources = await scrapeWebsite(site);
            allResources.push(...resources);
        }
        
        // Save resources to database
        if (allResources.length > 0) {
            await saveResourcesToDatabase(allResources);
        }
        
        console.log('Scraper completed successfully');
    } catch (error) {
        console.error('Error running scraper:', error);
    }
}

// Run the scraper if called directly
if (require.main === module) {
    runScraper();
}

module.exports = {
    runScraper,
    scrapeWebsite,
    saveResourcesToDatabase
}; 