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

// Initialize Firecrawl if API key is available
const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
const firecrawlAvailable = firecrawlApiKey && firecrawlApiKey !== 'your_firecrawl_api_key_here';
let firecrawl;

try {
  if (firecrawlAvailable) {
    const { FirecrawlApp } = require('firecrawl');
    firecrawl = new FirecrawlApp({
      apiKey: firecrawlApiKey
    });
    console.log('Firecrawl initialized successfully');
  } else {
    console.log('Firecrawl API key not found or invalid. Using fallback scraper with axios and cheerio.');
  }
} catch (error) {
  console.error('Failed to initialize Firecrawl:', error.message);
  console.log('Using fallback scraper with axios and cheerio.');
}

// Process command line arguments
const args = process.argv.slice(2);
const isTestMode = args.includes('--test');
const testSingleSite = args.find(arg => arg.startsWith('--site='));
const siteToTest = testSingleSite ? testSingleSite.split('=')[1] : null;

// Target websites for resources
const targetSites = [
  // ----- EDUCATION RESOURCES -----
  {
    name: 'GeeksGod',
    url: 'https://geeksgod.com/category/free-courses/',
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
    url: 'https://www.udemyfreebies.com/',
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
    url: 'https://www.udemyking.com/',
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
    name: 'CourseFolder',
    url: 'https://coursefolder.net/',
    schema: {
      title: '.entry-title a',
      description: '.entry-content p',
      image: '.wp-post-image',
      url: '.entry-title a',
      category: 'Education',
      tags: ['Course', 'Free', 'Online Learning']
    }
  },
  
  // ----- TECHNOLOGY RESOURCES -----
  {
    name: 'freeCodeCamp',
    url: 'https://www.freecodecamp.org/news/',
    schema: {
      title: '.post-card-title a',
      description: '.post-card-excerpt',
      image: '.post-card-image',
      url: '.post-card-title a',
      category: 'Technology',
      tags: ['Programming', 'Web Development', 'Coding']
    }
  },
  {
    name: 'DigitalOcean',
    url: 'https://www.digitalocean.com/community/tutorials',
    schema: {
      title: '.tutorials-item__title',
      description: '.tutorials-item__excerpt',
      image: '.tutorials-item__image img',
      url: '.tutorials-item__title a',
      category: 'Technology',
      tags: ['Tutorials', 'DevOps', 'Cloud']
    }
  },
  {
    name: 'Hackernoon',
    url: 'https://hackernoon.com/',
    schema: {
      title: '.title-wrapper h2',
      description: '.content-preview p',
      image: '.story-image img',
      url: '.title-link',
      category: 'Technology',
      tags: ['Programming', 'Tech News', 'Startups']
    }
  },
  {
    name: 'MDN',
    url: 'https://developer.mozilla.org/en-US/docs/Web',
    schema: {
      title: '.document-title',
      description: '.summary',
      image: '.document-logo', // This may be less reliable as MDN doesn't always have images
      url: '.document-title a',
      category: 'Technology',
      tags: ['Documentation', 'Web Development', 'Reference']
    }
  },
  
  // ----- DESIGN RESOURCES -----
  {
    name: 'Smashing Magazine',
    url: 'https://www.smashingmagazine.com/articles/',
    schema: {
      title: '.article--post__title a',
      description: '.article--post__teaser',
      image: '.article--post__image img',
      url: '.article--post__title a',
      category: 'Design',
      tags: ['UI Design', 'UX Design', 'Web Design']
    }
  },
  {
    name: 'DesignModo',
    url: 'https://www.designmodo.com/',
    schema: {
      title: '.post-title a',
      description: '.post-excerpt',
      image: '.post-thumbnail img',
      url: '.post-title a',
      category: 'Design',
      tags: ['UI Design', 'Web Design', 'Inspiration']
    }
  },
  {
    name: 'UI Garage',
    url: 'https://uigarage.net/',
    schema: {
      title: '.entry-title',
      description: '.entry-summary',
      image: '.entry-image img',
      url: '.entry-title a',
      category: 'Design',
      tags: ['UI Design', 'Inspiration', 'Patterns']
    }
  },
  {
    name: 'UI8 Freebies',
    url: 'https://ui8.net/freebies',
    schema: {
      title: '.product-item__title',
      description: '.product-item__description',
      image: '.product-item__preview img',
      url: '.product-item__link',
      category: 'Design',
      tags: ['UI Kits', 'Free Resources', 'Templates']
    }
  },
  
  // ----- BUSINESS RESOURCES -----
  {
    name: 'Entrepreneur',
    url: 'https://www.entrepreneur.com/latest/',
    schema: {
      title: '.entrepreneur-landing-card__title',
      description: '.entrepreneur-landing-card__description',
      image: '.entrepreneur-landing-card__image',
      url: '.entrepreneur-landing-card__title a',
      category: 'Business',
      tags: ['Entrepreneurship', 'Business', 'Startups']
    }
  },
  {
    name: 'HubSpot Resources',
    url: 'https://www.hubspot.com/resources',
    schema: {
      title: '.resource-card__title',
      description: '.resource-card__description',
      image: '.resource-card__image img',
      url: '.resource-card__link',
      category: 'Business',
      tags: ['Marketing', 'Sales', 'Templates']
    }
  },
  {
    name: 'SCORE Resources',
    url: 'https://www.score.org/resource/business-planning-financial-statements-template-gallery',
    schema: {
      title: '.resource-title',
      description: '.resource-description',
      image: '.resource-image img',
      url: '.resource-link',
      category: 'Business',
      tags: ['Business Planning', 'Templates', 'Financial']
    }
  },
  {
    name: 'Forbes Business',
    url: 'https://www.forbes.com/business/',
    schema: {
      title: '.stream-item__title',
      description: '.stream-item__description',
      image: '.stream-item__image img',
      url: '.stream-item__title a',
      category: 'Business',
      tags: ['Business News', 'Industry', 'Leadership']
    }
  },
  
  // ----- EVENTS RESOURCES -----
  {
    name: 'Devpost Hackathons',
    url: 'https://devpost.com/hackathons?challenge_type=hackathon&location=Worldwide',
    schema: {
      title: '.challenge-title, .challenge-card__title',
      description: '.challenge-description, .challenge-card__tagline',
      image: '.challenge-logo img, .challenge-card__logo img',
      url: 'a.clearfix, .challenge-card__link',
      category: 'Events',
      tags: ['Hackathon', 'Competition', 'Developer']
    }
  },
  {
    name: 'EventBrite Tech',
    url: 'https://www.eventbrite.com/d/kenya--nairobi/tech-events/',
    schema: {
      title: '.event-card__title, .eds-event-card__formatted-name--is-clamped',
      description: '.event-card__description, .eds-event-card__formatted-description--is-clamped',
      image: '.event-card__image img, .eds-event-card-content__image img',
      url: '.event-card__link, a.eds-event-card-content__action-link',
      category: 'Events',
      tags: ['Tech Events', 'Conference', 'Workshop'],
      useHeadlessBrowser: true // This site requires JS rendering
    },
  },
  {
    name: 'Luma Kenya',
    url: 'https://lu.ma/explore/kenya',
    schema: {
      title: '.event-card__title, h3, .event-name',
      description: '.event-card__description, .event-description',
      image: '.event-card__image, .event-image',
      url: '.event-card__link, a[href*="/event/"]',
      category: 'Events',
      tags: ['Tech Events', 'Meetup', 'Community'],
      useHeadlessBrowser: true // This site requires JS rendering
    },
  },
  {
    name: 'TechCabal Events',
    url: 'https://techcabal.com/events/',
    schema: {
      title: '.event-title, .tc-event-title, h2.entry-title',
      description: '.event-description, .tc-event-description, .excerpt',
      image: '.event-image img, .tc-event-image img, .wp-post-image',
      url: '.event-link, .tc-event-link, a.more-link',
      category: 'Events',
      tags: ['Africa Tech', 'Conference', 'Startup']
    }
  },
  
  // ----- BLOGS & NEWS RESOURCES -----
  {
    name: 'The Hacker News',
    url: 'https://thehackernews.com/',
    schema: {
      title: '.home-title',
      description: '.home-desc',
      image: '.home-img img',
      url: '.story-link',
      category: 'Blogs & News',
      tags: ['Cybersecurity', 'Tech News', 'Hacking'],
      disabled: true
    }
  },
  {
    name: 'TechRadar',
    url: 'https://www.techradar.com/news',
    schema: {
      title: '.article-name',
      description: '.synopsis',
      image: '.picture-wrapper img',
      url: '.article-link',
      category: 'Blogs & News',
      tags: ['Tech News', 'Reviews', 'Products']
    }
  },
  {
    name: 'Wired Tech',
    url: 'https://www.wired.com/tag/tech/',
    schema: {
      title: '.SummaryItemHedBase-egbdfL',
      description: '.SummaryItemDekBase-dPeCmm',
      image: '.ResponsiveImageContainer-euIopn img',
      url: '.SummaryItemHedLink-fUqtGi',
      category: 'Blogs & News',
      tags: ['Tech News', 'Innovation', 'Culture']
    }
  },
  {
    name: 'Dev.to',
    url: 'https://dev.to/',
    schema: {
      title: '.crayons-story__title',
      description: '.crayons-story__snippet',
      image: '.crayons-story__cover img',
      url: '.crayons-story__title a',
      category: 'Blogs & News',
      tags: ['Developer', 'Programming', 'Community']
    }
  },
  {
    name: 'Hashnode',
    url: 'https://hashnode.com/',
    schema: {
      title: '.article-title',
      description: '.article-brief',
      image: '.article-cover img',
      url: '.article-title a',
      category: 'Blogs & News',
      tags: ['Developer', 'Technical Writing', 'Community']
    }
  }
];

/**
 * Fallback scraper using axios and cheerio
 * @param {object} site - Site configuration
 * @returns {Promise} - Scraped resources
 */
async function scrapeWithAxiosCheerio(site) {
  try {
    console.log(`Scraping ${site.name} using axios and cheerio...`);
    
    // Basic URL handling to remove wildcards
    const url = site.url.replace('/*', '');
    
    // Set custom user agent to avoid bot detection
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.google.com/'
    };
    
    const response = await axios.get(url, { headers });
    const $ = cheerio.load(response.data);
    
    const results = [];
    
    // Extract based on schema selectors - support multiple selectors
    const titleSelectors = site.schema.title.split(',').map(s => s.trim());
    
    // Try each title selector until we find matches
    let titleElements = [];
    for (const selector of titleSelectors) {
      titleElements = $(selector);
      if (titleElements.length > 0) break;
    }
    
    // Process each title element
    titleElements.each((i, el) => {
      if (i >= 10) return false; // Limit to 10 items
      
      const result = {
        title: $(el).text().trim(),
        description: '',
        url: '',
        image: '',
        category: site.schema.category,
        tags: site.schema.tags || []
      };
      
      // Skip empty titles
      if (!result.title) return;
      
      // Handle different URL extraction strategies
      if (site.schema.url) {
        const urlSelectors = site.schema.url.split(',').map(s => s.trim());
        let foundUrl = false;
        
        // If the title element is an anchor tag
        if ($(el).is('a')) {
          result.url = $(el).attr('href');
          foundUrl = true;
        } 
        // Try to find URL in parent container
        else {
          // Find closest container (article, card, etc.)
          const container = $(el).closest('article, .post, .card, .item, .event, .challenge, div[id]');
          
          if (container.length) {
            // Try each URL selector
            for (const selector of urlSelectors) {
              const urlEl = container.find(selector);
              if (urlEl.length) {
                result.url = urlEl.attr('href');
                foundUrl = true;
                break;
              }
            }
            
            // If still no URL, look for any anchor tag in the container
            if (!foundUrl) {
              const anyLink = container.find('a').first();
              if (anyLink.length) {
                result.url = anyLink.attr('href');
                foundUrl = true;
              }
            }
          }
          
          // Global search as last resort
          if (!foundUrl) {
            for (const selector of urlSelectors) {
              const urlEl = $(selector).filter((_, linkEl) => {
                // Either text matches or is nearby
                return $(linkEl).text().trim() === result.title || 
                       $(linkEl).parent().text().includes(result.title);
              });
              
              if (urlEl.length) {
                result.url = urlEl.attr('href');
                foundUrl = true;
                break;
              }
            }
          }
        }
        
        // Handle relative URLs
        if (result.url && !result.url.startsWith('http')) {
          try {
            // Handle various relative URL formats
            if (result.url.startsWith('//')) {
              result.url = 'https:' + result.url;
            } else {
              result.url = new URL(result.url, url).href;
            }
          } catch (e) {
            console.warn(`Could not resolve relative URL: ${result.url}`);
          }
        }
      }
      
      // Try to extract description with multiple selectors
      if (site.schema.description) {
        const descSelectors = site.schema.description.split(',').map(s => s.trim());
        const container = $(el).closest('article, .post, .card, .item, .event, .challenge, div[id]');
        
        let foundDesc = false;
        if (container.length) {
          for (const selector of descSelectors) {
            const descEl = container.find(selector);
            if (descEl.length) {
              result.description = descEl.text().trim();
              foundDesc = true;
              break;
            }
          }
        }
        
        // Try sibling elements if no description found
        if (!foundDesc) {
          let currentEl = $(el);
          for (let i = 0; i < 3; i++) { // Check next 3 siblings
            currentEl = currentEl.next();
            if (currentEl.length && currentEl.text().trim().length > 20) {
              result.description = currentEl.text().trim();
              foundDesc = true;
              break;
            }
          }
        }
      }
      
      // Try to extract image with multiple selectors
      if (site.schema.image) {
        const imgSelectors = site.schema.image.split(',').map(s => s.trim());
        const container = $(el).closest('article, .post, .card, .item, .event, .challenge, div[id]');
        
        let foundImg = false;
        if (container.length) {
          for (const selector of imgSelectors) {
            const imgEl = container.find(selector);
            if (imgEl.length) {
              // Direct img tag
              if (imgEl.is('img')) {
                result.image = imgEl.attr('src') || imgEl.attr('data-src');
                foundImg = true;
              } 
              // Background image
              else if (imgEl.attr('style') && imgEl.attr('style').includes('background')) {
                const style = imgEl.attr('style');
                const match = style.match(/background(?:-image)?\s*:\s*url\(['"]?([^'"]+)['"]?\)/i);
                if (match && match[1]) {
                  result.image = match[1];
                  foundImg = true;
                }
              }
              // Nested img
              else {
                const nestedImg = imgEl.find('img');
                if (nestedImg.length) {
                  result.image = nestedImg.attr('src') || nestedImg.attr('data-src');
                  foundImg = true;
                }
              }
              
              if (foundImg) break;
            }
          }
          
          // If still no image, try any img in the container
          if (!foundImg) {
            const anyImg = container.find('img').first();
            if (anyImg.length) {
              result.image = anyImg.attr('src') || anyImg.attr('data-src');
              foundImg = true;
            }
          }
        }
        
        // Handle relative URLs for images
        if (result.image && !result.image.startsWith('http')) {
          try {
            if (result.image.startsWith('//')) {
              result.image = 'https:' + result.image;
            } else if (result.image.startsWith('data:')) {
              // Keep data URLs as is
            } else {
              result.image = new URL(result.image, url).href;
            }
          } catch (e) {
            console.warn(`Could not resolve relative image URL: ${result.image}`);
          }
        }
      }
      
      // Ensure we have a title and preferably a URL
      if (result.title && (result.url || result.description)) {
        // Sanitize fields to prevent database errors
        result.title = result.title.substring(0, 255);
        result.description = result.description.substring(0, 1000);
        results.push(result);
      }
    });
    
    return results;
  } catch (error) {
    console.error(`Error scraping ${site.name} with axios/cheerio:`, error);
    return [];
  }
}

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
    let resources;
    
    // Use Firecrawl if available, otherwise fallback to axios/cheerio
    if (firecrawlAvailable && firecrawl) {
      resources = await scrapeWithFirecrawl(site);
    } else {
      resources = await scrapeWithAxiosCheerio(site);
    }
    
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
    let sitesToScrape = targetSites.filter(site => !site.disabled);
    
    // If in test mode with a specific site, filter to just that site
    if (isTestMode && siteToTest) {
      const matchedSite = sitesToScrape.find(site => site.name.toLowerCase() === siteToTest.toLowerCase());
      if (matchedSite) {
        console.log(`Test mode: Only scraping ${matchedSite.name}`);
        sitesToScrape = [matchedSite];
      } else {
        console.error(`Test mode: Site ${siteToTest} not found or is disabled`);
        return;
      }
    }
    // If in test mode without specific site, just use a sample from each category
    else if (isTestMode) {
      // Get one site from each category for testing
      const categories = [...new Set(sitesToScrape.map(site => site.schema.category))];
      sitesToScrape = categories.map(category => {
        return sitesToScrape.find(site => site.schema.category === category);
      });
      console.log(`Test mode: Scraping ${sitesToScrape.length} sample sites (one from each category)`);
    }
    
    console.log(`Will scrape ${sitesToScrape.length} sites out of ${targetSites.length} total sites`);
    if (targetSites.length !== sitesToScrape.length) {
      console.log(`Skipping ${targetSites.length - sitesToScrape.length} disabled sites`);
    }
    
    let successCount = 0;
    let failedCount = 0;
    let resourcesBySite = {};
    
    for (const site of sitesToScrape) {
      try {
        console.log(`\nScraping ${site.name} (${site.schema.category})...`);
      const resources = await scrapeWebsite(site);
        
        // Track resources by site for reporting
        resourcesBySite[site.name] = resources.length;
        
        console.log(`- Found ${resources.length} resources from ${site.name}`);
        if (resources.length > 0) {
          successCount++;
        } else {
          console.log(`- Warning: No resources found from ${site.name}`);
        }
        
        // In test mode, show sample data rather than saving
        if (isTestMode && resources.length > 0) {
          console.log('\nSample Resources:');
          resources.slice(0, 3).forEach((resource, index) => {
            console.log(`\n--- Resource ${index + 1} ---`);
            console.log(`Title: ${resource.title}`);
            console.log(`Description: ${resource.description ? resource.description.substring(0, 100) + '...' : 'N/A'}`);
            console.log(`URL: ${resource.url}`);
            console.log(`Image: ${resource.image_url}`);
            console.log(`Category: ${resource.category}`);
            console.log(`Tags: ${resource.tags ? resource.tags.join(', ') : 'N/A'}`);
          });
          console.log('\n'); // Add spacing
          
          // Don't skip saving in test mode anymore - allow saving test results
          allResources.push(...resources);
        } else {
      allResources.push(...resources);
        }
      } catch (error) {
        console.error(`Failed to scrape ${site.name}:`, error.message);
        failedCount++;
      }
    }
    
    console.log(`\nScraping summary:`);
    console.log(`- Successfully scraped: ${successCount} sites`);
    console.log(`- Failed to scrape: ${failedCount} sites`);
    console.log(`- Total resources found: ${allResources.length}`);
    
    // Show resource breakdown by site
    console.log('\nResources by site:');
    Object.entries(resourcesBySite).forEach(([site, count]) => {
      console.log(`- ${site}: ${count} resources`);
    });
    
    // Show resource breakdown by category
    const resourcesByCategory = {};
    allResources.forEach(resource => {
      const category = resource.category;
      resourcesByCategory[category] = (resourcesByCategory[category] || 0) + 1;
    });
    
    console.log('\nResources by category:');
    Object.entries(resourcesByCategory).forEach(([category, count]) => {
      console.log(`- ${category}: ${count} resources`);
    });
    
    // Save resources to database if not in test mode or if explicitly requested in test mode
    const shouldSave = !isTestMode || (isTestMode && args.includes('--save'));
    
    if (shouldSave && allResources.length > 0) {
      await saveResourcesToDatabase(allResources);
    } else if (isTestMode && !args.includes('--save')) {
      console.log(`\nTest mode: Found ${allResources.length} resources (not saved to database)`);
      console.log('Add --save flag to save test results to database');
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