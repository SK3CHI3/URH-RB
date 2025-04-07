// Simplified resources loading with error handling
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const resourcesGrid = document.querySelector('.resources-grid');
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  // Exit if the resources grid isn't found
  if (!resourcesGrid) {
    console.error('Resources grid not found in the document');
    return;
  }
  
  // Load resources function
  async function loadResources(category = null) {
    try {
      // Show loading indicator with proper grid span
      resourcesGrid.innerHTML = '<div style="text-align: center; grid-column: 1/-1; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading resources...</div>';
      
      // Get base URL from config
      const baseUrl = window.appConfig?.apiUrl || 'http://localhost:3000';
      const isLocalDev = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
      
      // Prepare URL with error handling for category parameter
      let url = `${baseUrl}${isLocalDev ? '/api' : ''}/resources`; // Add /api prefix only for local development
      if (category) {
        // Sanitize category parameter
        const safeCategory = encodeURIComponent(category.trim());
        url += `?category=${safeCategory}`;
      }
      
      console.log('Fetching resources from:', url); // Debug log
      
      // Fetch with timeout and error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(url, { 
          signal: controller.signal,
          headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        // Clear timeout since fetch completed
        clearTimeout(timeoutId);
        
        // Handle HTTP errors with more detail
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response:', errorText);
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        // Parse JSON with error handling
        let resources;
        try {
          resources = await response.json();
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          throw new Error('Failed to parse server response');
        }
        
        // Clear the grid
        resourcesGrid.innerHTML = '';
        
        // Handle empty results
        if (!Array.isArray(resources) || resources.length === 0) {
          resourcesGrid.innerHTML = '<div style="text-align: center; grid-column: 1/-1; padding: 2rem;">No resources found for this category</div>';
          return;
        }
        
        // Build resource cards
        resources.forEach(resource => {
          // Validate resource object
          if (!resource || typeof resource !== 'object') {
            console.warn('Invalid resource data skipped');
            return;
          }
          
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
          
          // Build card HTML - matching existing design
          card.innerHTML = `
            <div class="resource-image">
              <img src="${imageUrl}" alt="${title}" onerror="this.src='https://via.placeholder.com/400x200?text=Error'; this.onerror=null;">
              <div class="featured-badge">
                <i class="fas fa-star"></i> New
              </div>
            </div>
            <div class="resource-content">
              <h3>${title}</h3>
              <p>${description}</p>
              <div class="resource-meta">
                <div class="rating">
                  <i class="fas fa-star"></i>
                  <span>${rating}</span>
                </div>
                <div class="source">
                  <p>Source: ${source}</p>
                </div>
              </div>
              <div class="resource-tags">
                <span class="tag featured">${categoryName}</span>
              </div>
            </div>
          `;
          
          // Make card clickable to open resource with additional error handling
          card.addEventListener('click', (e) => {
            if (e.target.closest('.tag')) return; // Don't trigger on tag click
            if (url && url !== '#') {
              // Open in new tab with safety checks
              try {
                window.open(url, '_blank', 'noopener,noreferrer');
              } catch (windowError) {
                console.error('Failed to open resource URL:', windowError);
                alert('Could not open resource link. Please check your popup settings.');
              }
            }
          });
          
          resourcesGrid.appendChild(card);
        });
        
      } catch (fetchError) {
        // Handle fetch specific errors
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw fetchError;
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
        retryBtn.addEventListener('click', () => {
          loadResources(category);
        });
      }
    }
  }
  
  // Set up filter buttons with error handling
  try {
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        try {
          // Update active state
          filterButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          
          // Get category and load resources
          const category = button.textContent.trim();
          loadResources(category === 'Featured' ? null : category);
        } catch (btnError) {
          console.error('Error handling filter button click:', btnError);
        }
      });
    });
  } catch (filtersError) {
    console.error('Error setting up filter buttons:', filtersError);
  }
  
  // Initial load with error handling
  try {
    loadResources();
  } catch (initialLoadError) {
    console.error('Error during initial resources load:', initialLoadError);
  }
}); 