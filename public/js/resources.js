// Simplified resources loading with robust error handling
document.addEventListener('DOMContentLoaded', () => {
  console.log('Resources.js loaded');
  
  // Get DOM elements
  const resourcesGrid = document.querySelector('.resources-grid');
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  // Track if we're currently accessing a resource to prevent multiple clicks
  let isAccessingResource = false;
  
  // Exit if the resources grid isn't found
  if (!resourcesGrid) {
    console.error('Resources grid not found in the document');
    return;
  } else {
    console.log('Resources grid found');
  }
  
  // URL validation function
  function isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (e) {
      console.error('URL validation error:', e);
      return false;
    }
  }
  
  // Toast notification function
  function showNotification(message, type = 'error', duration = 5000) {
    console.log('Showing notification:', message, type);
    const toast = document.createElement('div');
    toast.className = `notification ${type}`;
    toast.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
        <span>${message}</span>
      </div>
      <button class="close-btn"><i class="fas fa-times"></i></button>
    `;
    document.body.appendChild(toast);
    
    // Add close button functionality
    toast.querySelector('.close-btn').addEventListener('click', () => toast.remove());
    
    // Auto-remove after duration (if provided)
    if (duration) setTimeout(() => {
      if (document.body.contains(toast)) toast.remove();
    }, duration);
    
    return toast;
  }
  
  // Handle resource access with improved error handling
  function handleResourceAccess(accessBtn) {
    console.log('Access button clicked');
    
    // Prevent multiple simultaneous clicks
    if (isAccessingResource) return;
    isAccessingResource = true;
    
    // Get URL from button data attribute
    const url = accessBtn.dataset.url;
    console.log('Attempting to access resource:', url);
    
    // Store original button state
    const originalText = accessBtn.innerHTML;
    
    // Validate URL
    if (!url || url === '#' || !isValidUrl(url)) {
      console.error('Invalid resource URL:', url);
      showNotification('Resource URL is invalid or unavailable');
      isAccessingResource = false;
      return;
    }
    
    // Show loading state
    accessBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Opening...';
    accessBtn.disabled = true;
    
    try {
      // Attempt to open URL
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      
      // Handle popup blockers
      if (newWindow === null) {
        throw new Error('popup-blocked');
      }
      
      // Show success notification
      showNotification('Resource opened successfully', 'success', 3000);
      
      // Log success (if analytics available)
      if (window.analytics) {
        window.analytics.logEvent('resource_access', { url });
      }
    } catch (error) {
      console.error('Error accessing resource:', error);
      
      let message = 'Error accessing resource';
      
      if (error.message === 'popup-blocked') {
        message = 'Please allow popups to access resources';
      }
      
      const toast = showNotification(message, 'error');
      
      // Add retry button
      const retryBtn = document.createElement('button');
      retryBtn.className = 'retry-btn';
      retryBtn.innerHTML = 'Retry';
      retryBtn.addEventListener('click', () => {
        toast.remove();
        setTimeout(() => handleResourceAccess(accessBtn), 300);
      });
      
      toast.querySelector('.notification-content').appendChild(retryBtn);
    } finally {
      // Reset button state after delay
      setTimeout(() => {
        accessBtn.innerHTML = originalText;
        accessBtn.disabled = false;
        isAccessingResource = false;
      }, 1000);
    }
  }
  
  // Function to attach click handlers to all access buttons
  function attachAccessButtonHandlers() {
    console.log('Attaching access button handlers');
    
    // Get all access buttons
    const accessButtons = document.querySelectorAll('.access-btn');
    console.log(`Found ${accessButtons.length} access buttons`);
    
    // Attach click handlers to each button
    accessButtons.forEach((btn, index) => {
      console.log(`Setting up button ${index+1} with URL: ${btn.dataset.url}`);
      
      // Remove any existing click handlers
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Add the new click handler
      newBtn.addEventListener('click', function(e) {
        console.log('Button clicked');
        e.preventDefault();
        e.stopPropagation();
        handleResourceAccess(this);
      });
      
      // Ensure the button looks clickable
      newBtn.style.cursor = 'pointer';
    });
  }
  
  // Load resources function with improved error handling
  async function loadResources(category = null) {
    try {
      // Show loading indicator
      resourcesGrid.innerHTML = '<div style="text-align: center; grid-column: 1/-1; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading resources...</div>';
      
      // Category name to ID mapping
      const categoryMap = {
        'Technology': 1,
        'Design': 4,
        'Business': 5,
        'Education': 6,
        'Books': 7,
        'Blogs & News': 8
      };

      // Set up request timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 15 seconds')), 15000);
      });
      
      let query;
      
      // Check if Supabase client is available
      if (window.supabaseClient) {
        console.log('Using Supabase client for data');
        // Query resources from Supabase with timeout
        query = window.supabaseClient
          .from('resources')
          .select('*, categories(name)');
        
        // Add category filter if specified
        if (category && category !== 'Featured') {
          const categoryId = categoryMap[category];
          if (!categoryId) {
            throw new Error(`Unknown category: ${category}`);
          }
          query = query.eq('category_id', categoryId);
        }
        
        // Execute query with timeout
        const result = await Promise.race([
          query,
          timeoutPromise
        ]);
        
        const { data: resources, error } = result;
        
        // Handle Supabase error
        if (error) {
          throw new Error(error.message);
        }
        
        renderResources(resources);
      } else {
        console.log('Using API endpoint for data');
        // Use the API endpoint if Supabase client is not available
        const baseUrl = window.appConfig?.apiUrl || '';
        const apiUrl = category && category !== 'Featured' 
          ? `${baseUrl}/api/resources?category=${encodeURIComponent(category)}`
          : `${baseUrl}/api/resources`;
          
        console.log('Fetching from API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const resources = await response.json();
        renderResources(resources);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
      
      // Show user-friendly error message
      resourcesGrid.innerHTML = `
        <div style="text-align: center; grid-column: 1/-1; padding: 2rem; color: #e53e3e;">
          <i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem;"></i>
          Error loading resources: ${error.message || 'Unknown error'}
          <div style="margin-top: 1rem;">
            <button id="retry-btn" style="padding: 0.5rem 1rem; border-radius: 8px; background: var(--primary-color); color: white; border: none;">
              Retry
            </button>
          </div>
        </div>
      `;
      
      // Add retry button functionality
      const retryBtn = document.getElementById('retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => loadResources(category));
      }
    }
  }
  
  // Function to render resource cards
  function renderResources(resources) {
    // Clear the grid
    resourcesGrid.innerHTML = '';
    
    // Handle empty results
    if (!resources || resources.length === 0) {
      resourcesGrid.innerHTML = '<div style="text-align: center; grid-column: 1/-1; padding: 2rem;">No resources found for this category</div>';
      return;
    }
    
    console.log(`Rendering ${resources.length} resources`);
    
    // Build resource cards
    resources.forEach((resource, index) => {
      try {
        // Create card element
        const card = document.createElement('div');
        card.className = 'resource-card';
        
        // Safely get resource properties with fallbacks
        const title = resource.title || 'Untitled Resource';
        const description = resource.description || 'No description available';
        const imageUrl = resource.image_url || 'https://via.placeholder.com/400x200?text=Resource';
        const url = resource.url || '#';
        const rating = resource.rating || '4.5';
        const source = resource.source || 'Unknown Source';
        const categoryName = resource.categories?.name || 'Resource';
        
        // Log URL for debugging
        console.log(`Resource ${index+1} "${title}" URL:`, url);
        
        // Format the date
        const createdAt = resource.created_at ? new Date(resource.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : 'Recently added';
        
        // Build card HTML
        card.innerHTML = `
          <div class="resource-image">
            <img src="${imageUrl}" alt="${title}" onerror="this.src='https://via.placeholder.com/400x200?text=Error'; this.onerror=null;">
            <div class="featured-badge">
              <i class="fas fa-star"></i> New
            </div>
            <div class="resource-tags">
              <span class="tag">${categoryName}</span>
            </div>
          </div>
          <div class="resource-content">
            <h3>${title}</h3>
            <p>${description}</p>
            <div class="resource-meta">
              <div class="rating">
                <i class="fas fa-star" style="color: #fbbf24;"></i>
                <span>${rating}</span>
                <span class="views">50K+ views</span>
              </div>
              <div class="source">
                <p>Source: ${source}</p>
              </div>
            </div>
          </div>
          <div class="resource-footer">
            <div class="post-date">
              <i class="far fa-calendar-alt" style="color: var(--accent-color);"></i>
              <span>${createdAt}</span>
            </div>
            <div class="resource-actions">
              <button class="save-btn" title="Save for later">
                <i class="far fa-bookmark"></i>
              </button>
              <button class="access-btn" data-url="${url}" style="cursor: pointer;">
                <i class="fas fa-external-link-alt"></i> Access Resource
              </button>
            </div>
          </div>
        `;
        
        resourcesGrid.appendChild(card);
      } catch (cardError) {
        console.error('Error creating resource card:', cardError);
        // Continue with other cards
      }
    });
    
    // Attach event handlers to all buttons after rendering
    attachAccessButtonHandlers();
  }
  
  // Set up filter buttons with error handling
  if (filterButtons && filterButtons.length > 0) {
    console.log(`Found ${filterButtons.length} filter buttons`);
    filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        try {
          e.preventDefault();
          filterButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          const category = button.textContent.trim();
          loadResources(category === 'Featured' ? null : category);
        } catch (error) {
          console.error('Error handling filter button click:', error);
          showNotification('Error applying filter', 'error');
        }
      });
    });
  } else {
    console.warn('Filter buttons not found');
  }
  
  // Initial load with error handling
  try {
    console.log('Starting initial resource load');
    loadResources();
  } catch (error) {
    console.error('Error during initial resource load:', error);
    resourcesGrid.innerHTML = `
      <div style="text-align: center; grid-column: 1/-1; padding: 2rem; color: #e53e3e;">
        <i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem;"></i>
        Failed to load resources: ${error.message || 'Unknown error'}
        <div style="margin-top: 1rem;">
          <button id="retry-btn" style="padding: 0.5rem 1rem; border-radius: 8px; background: var(--primary-color); color: white; border: none;">
            Retry
          </button>
        </div>
      </div>
    `;
    
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => loadResources());
    }
  }
  
  // Additional initialization to make sure buttons are clickable 
  // for cases where resources are loaded from cached data
  setTimeout(() => {
    attachAccessButtonHandlers();
    console.log('Added delayed button handler initialization');
  }, 2000);
}); 