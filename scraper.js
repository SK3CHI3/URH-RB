// Note: This would be a server-side script to handle web scraping
// It is a simplified version to demonstrate the concept
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const { FirecrawlApp } = require('firecrawl');
require('dotenv').config();

// Supabase client setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Firecrawl
const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY
});

// Target websites for resources
const targetSites = [
  {
    name: 'GeeksGod',
    url: 'https://geeksgod.com/category/free-courses/*',
    schema: {
      title: 'h1.entry-title',
      description: '.entry-content p',
      image: '.wp-post-image',
      url: '.coupon-link',
      category: 'Education',
      tags: ['Udemy', 'Course', 'Free']
    }
  },
  {
    name: 'UdemyFreebies',
    url: 'https://www.udemyfreebies.com/*',
    schema: {
      title: 'h4 a',
      description: '.coupon-description',
      image: '.coupon-image img',
      url: 'a.coupon-link',
      category: 'Education',
      tags: ['Udemy', 'Course', 'Free']
    }
  },
  {
    name: 'UdemyKing',
    url: 'https://www.udemyking.com/*',
    schema: {
      title: 'h2.entry-title a',
      description: '.entry-content p',
      image: '.wp-post-image',
      url: '.coupon-link',
      category: 'Education',
      tags: ['Udemy', 'Course', 'Free']
    }
  },
  {
    name: 'freeCodeCamp',
    url: 'https://www.freecodecamp.org/news/*',
    schema: {
      title: '.post-card-title a',
      description: '.post-card-excerpt',
      image: '.post-card-image',
      category: 'Technology',
      tags: ['Programming', 'Web Development']
    }
  },
  {
    name: 'Smashing Magazine',
    url: 'https://www.smashingmagazine.com/articles/*',
    schema: {
      title: '.article--post__title a',
      description: '.article--post__teaser',
      image: '.article--post__image img',
      category: 'Design',
      tags: ['UI Design', 'UX Design']
    }
  },
  {
    name: 'Entrepreneur',
    url: 'https://www.entrepreneur.com/latest/*',
    schema: {
      title: '.entrepreneur-landing-card__title',
      description: '.entrepreneur-landing-card__description',
      image: '.entrepreneur-landing-card__image',
      category: 'Business',
      tags: ['Entrepreneurship', 'Business']
    }
  }
];

/**
 * Use Firecrawl API for enhanced scraping
 * @param {object} site - Site configuration
 * @returns {Promise} - Scraped resources
 */
async function scrapeWithFirecrawl(site) {
  try {
    console.log(`Scraping ${site.name} using Firecrawl...`);
    
    // Extract data using Firecrawl
    const result = await firecrawl.extract([
      site.url
    ], {
      schema: site.schema,
      enableWebSearch: true
    });

    if (!result.success) {
      throw new Error(`Firecrawl extraction failed: ${result.error}`);
    }

    return result.data;
  } catch (error) {
    console.error(`Error scraping ${site.name}:`, error);
    throw error;
  }
}

/**
 * Scrape a website for resources
 * @param {object} site - Site configuration
 * @returns {Promise} - Scraped resources
 */
async function scrapeWebsite(site) {
  try {
    const resources = await scrapeWithFirecrawl(site);
    
    return resources.map(resource => ({
      title: resource.title,
      description: resource.description,
      url: resource.url,
      image_url: resource.image,
      category: resource.category,
      tags: resource.tags,
      source: site.name
    }));
  } catch (error) {
    console.error(`Error scraping ${site.name}:`, error);
    return [];
  }
}

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