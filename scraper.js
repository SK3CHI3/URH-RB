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

// Firecrawl API key
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

// Target websites for resources
const targetSites = [
    // New sites for Udemy course scraping
    {
        name: 'GeeksGod',
        url: 'https://geeksgod.com/category/free-courses/',
        selector: '.article-content', // Main container for course articles
        titleSelector: '.entry-title a', // Course title selector
        descriptionSelector: '.entry-content p', // Course description selector
        imageSelector: '.wp-post-image', // Course image selector
        category: 'Education', // Default category
        tags: ['Udemy', 'Course', 'Free'],
        relevanceKeywords: ['udemy', 'free', 'course', 'coupon', '100% off'],
        irrelevanceKeywords: ['job', 'hiring', 'internship', 'recruitment']
    },
    {
        name: 'UdemyFreebies',
        url: 'https://www.udemyfreebies.com/',
        selector: '.coupon-detail', // Main container for course cards
        titleSelector: 'h4 a', // Course title selector
        descriptionSelector: '.coupon-description', // Course description selector
        imageSelector: '.coupon-image img', // Course image selector
        category: 'Education', // Default category
        tags: ['Udemy', 'Course', 'Free'],
        linkSelector: 'a.coupon-link', // Direct link to course/coupon
        relevanceKeywords: ['udemy', 'free', 'course', 'coupon', '100% off']
    },
    {
        name: 'UdemyKing',
        url: 'https://www.udemyking.com/',
        selector: 'article.post', // Main container for course posts
        titleSelector: 'h2.entry-title a', // Course title selector
        descriptionSelector: '.entry-content p', // Course description selector
        imageSelector: '.wp-post-image', // Course image selector
        category: 'Education', // Default category
        tags: ['Udemy', 'Course', 'Free'],
        relevanceKeywords: ['udemy', 'free', 'course', 'coupon', '100% off']
    },
    // Keep existing sites if needed
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
 * Check if a resource is relevant based on keyword analysis
 * @param {object} resource - Resource object with title and description
 * @param {object} site - Site configuration with relevance keywords
 * @returns {boolean} - Whether the resource is relevant
 */
function isResourceRelevant(resource, site) {
    // Default to true for sites without specific relevance checks
    if (!site.relevanceKeywords && !site.irrelevanceKeywords) return true;
    
    const titleAndDesc = `${resource.title.toLowerCase()} ${resource.description.toLowerCase()}`;
    
    // Check for irrelevance keywords (prioritized in title)
    if (site.irrelevanceKeywords) {
        for (const keyword of site.irrelevanceKeywords) {
            if (resource.title.toLowerCase().includes(keyword)) {
                return false;
            }
        }
    }
    
    // Check for relevance keywords
    if (site.relevanceKeywords) {
        for (const keyword of site.relevanceKeywords) {
            if (titleAndDesc.includes(keyword)) {
                return true;
            }
        }
        // If we have relevance keywords but none matched, it's not relevant
        return false;
    }
    
    // Default to true if no irrelevance keywords found
    return true;
}

/**
 * Determine the best category based on resource content
 * @param {object} resource - Resource with title and description
 * @param {string} defaultCategory - Default category if no match found
 * @returns {Promise<string>} - Best matching category
 */
async function determineCategory(resource, defaultCategory) {
    const titleAndDesc = `${resource.title.toLowerCase()} ${resource.description.toLowerCase()}`;
    
    // Category keyword mapping
    const categoryKeywords = {
        'Technology': ['python', 'javascript', 'programming', 'web development', 'coding', 
                      'java', 'react', 'angular', 'node', 'django', 'algorithm', 'database',
                      'sql', 'aws', 'cloud', 'devops', 'machine learning', 'ai', 'data science'],
        'Design': ['ui', 'ux', 'photoshop', 'illustrator', 'figma', 'design', 'canva', 
                  'graphic', 'logo', 'typography', 'branding', 'creative', 'portfolio',
                  'sketch', 'adobe', 'visual', 'animation', 'art'],
        'Business': ['business', 'marketing', 'management', 'strategy', 'entrepreneurship',
                    'startup', 'finance', 'accounting', 'sales', 'leadership', 'analytics',
                    'ecommerce', 'seo', 'social media', 'advertising', 'mba'],
        'Education': ['education', 'teaching', 'learning', 'school', 'university', 'course',
                     'training', 'certification', 'lecture', 'instructor', 'curriculum'],
        'Books': ['book', 'ebook', 'reading', 'literature', 'novel', 'textbook', 'writing'],
        'Blogs & News': ['blog', 'news', 'article', 'report', 'journalism', 'media', 'newsletter']
    };
    
    // Score each category
    let bestCategory = defaultCategory;
    let highestScore = 0;
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        let score = 0;
        for (const keyword of keywords) {
            if (titleAndDesc.includes(keyword)) {
                // Add to score, with extra weight for matches in the title
                score += resource.title.toLowerCase().includes(keyword) ? 2 : 1;
            }
        }
        
        if (score > highestScore) {
            highestScore = score;
            bestCategory = category;
        }
    }
    
    return bestCategory;
}

/**
 * Use Firecrawl API for enhanced scraping
 * @param {string} url - URL to scrape
 * @returns {Promise<Object|null>} - Scraped data or null on error
 */
async function scrapeWithFirecrawl(url) {
    if (!FIRECRAWL_API_KEY) {
        console.error('Firecrawl API key not set. Skipping Firecrawl scraping.');
        return null;
    }
    
    try {
        console.log(`Scraping ${url} with Firecrawl API...`);
        
        // Try the v1 endpoint format without the /api prefix
        const response = await axios({
            method: 'post',
            url: 'https://api.firecrawl.dev/v1/scrape',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
            },
            data: {
                url: url,
                wait_for: 'networkidle',
                timeout: 30000,
                extract: {
                    html: true,
                    metadata: true,
                    links: true
                }
            },
            timeout: 60000 // 60 second timeout for the request itself
        });
        
        if (!response.data) {
            console.error('No data returned from Firecrawl API');
            return null;
        }
        
        return response.data;
    } catch (error) {
        console.error(`Error using Firecrawl API for ${url}:`, error.message);
        if (error.response) {
            // Log response details for debugging
            console.error(`Status: ${error.response.status}, Data:`, error.response.data);
        }
        return null;
    }
}

/**
 * Extract resources from Firecrawl response
 * @param {Object} firecrawlData - Firecrawl API response
 * @param {Object} site - Site configuration
 * @returns {Array} - Extracted resources
 */
function extractResourcesFromFirecrawl(firecrawlData, site) {
    if (!firecrawlData || !firecrawlData.html) {
        return [];
    }
    
    // Load the HTML content into cheerio
    const $ = cheerio.load(firecrawlData.html);
    const resources = [];
    
    // Process similarly to scrapeWebsite but with the Firecrawl data
    $(site.selector).each((i, el) => {
        // Limit to first 10 resources for Udemy course sites
        if (i >= 10) return false;
        
        const titleEl = $(el).find(site.titleSelector);
        const title = titleEl.text().trim();
        
        // Get URL - either from specific link selector or from title element
        let url = '';
        if (site.linkSelector) {
            url = $(el).find(site.linkSelector).attr('href') || '';
        } else {
            url = titleEl.attr('href') || '';
        }
        
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
        
        const resource = {
            title,
            description: description || `A resource from ${site.name}`,
            url: url.startsWith('http') ? url : `${new URL(site.url).origin}${url.startsWith('/') ? '' : '/'}${url}`,
            image_url: imageUrl,
            source: site.name,
            rating: parseFloat(rating),
            category: site.category,
            tags: [...site.tags]
        };
        
        // Only add if relevant
        if (isResourceRelevant(resource, site)) {
            resources.push(resource);
        }
    });
    
    return resources;
}

/**
 * Scrape a website for resources
 * @param {object} site - Site configuration
 * @returns {Promise} - Scraped resources
 */
async function scrapeWebsite(site) {
    try {
        console.log(`Scraping ${site.name} at ${site.url}`);
        
        // For Udemy course sites, try Firecrawl first
        let resources = [];
        if (site.name === 'GeeksGod' || site.name === 'UdemyFreebies' || site.name === 'UdemyKing') {
            const firecrawlData = await scrapeWithFirecrawl(site.url);
            if (firecrawlData) {
                resources = extractResourcesFromFirecrawl(firecrawlData, site);
                if (resources.length > 0) {
                    console.log(`Found ${resources.length} resources from ${site.name} using Firecrawl`);
                    return resources;
                }
            }
            console.log(`Falling back to regular scraping for ${site.name}...`);
        }
        
        // Regular scraping with axios and cheerio
        const response = await axios.get(site.url);
        const $ = cheerio.load(response.data);
        
        $(site.selector).each((i, el) => {
            // Limit to first 10 resources per site for Udemy courses
            if (i >= 10 && (site.name === 'GeeksGod' || site.name === 'UdemyFreebies' || site.name === 'UdemyKing')) return false;
            // Limit to first 5 resources for other sites
            if (i >= 5 && !(site.name === 'GeeksGod' || site.name === 'UdemyFreebies' || site.name === 'UdemyKing')) return false;
            
            const titleEl = $(el).find(site.titleSelector);
            const title = titleEl.text().trim();
            
            // Get URL - either from specific link selector or from title element
            let url = '';
            if (site.linkSelector) {
                url = $(el).find(site.linkSelector).attr('href') || '';
            } else {
                url = titleEl.attr('href') || '';
            }
            
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
            
            const resource = {
                title,
                description: description || `A resource from ${site.name}`,
                url: url.startsWith('http') ? url : `${new URL(site.url).origin}${url.startsWith('/') ? '' : '/'}${url}`,
                image_url: imageUrl,
                source: site.name,
                rating: parseFloat(rating),
                category: site.category,
                tags: [...site.tags]
            };
            
            // Only add if relevant (for Udemy course sites)
            if (isResourceRelevant(resource, site)) {
                resources.push(resource);
            }
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
            
            // Determine best category (may override default)
            const bestCategory = await determineCategory(resource, resource.category);
            
            // Get category ID
            const { data: categories, error: categoryError } = await supabase
                .from('categories')
                .select('id')
                .eq('name', bestCategory)
                .limit(1);
            
            if (categoryError) {
                console.error('Error finding category:', categoryError);
                continue;
            }
            
            if (!categories || categories.length === 0) {
                console.error(`Category not found: ${bestCategory}`);
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