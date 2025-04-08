// Simplified resources loading with error handling
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const resourcesGrid = document.querySelector('.resources-grid');
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  // Category name to ID mapping
  const categoryMap = {
    'Technology': 1,
    'Design': 4,
    'Business': 5,
    'Education': 6,
    'Books': 7,
    'Blogs & News': 8
  };
  
  // Exit if the resources grid isn't found
  if (!resourcesGrid) {
    console.error('Resources grid not found in the document');
    return;
  }
  
  // Load resources function
  async function loadResources(category = null) {
    try {
      // Show loading indicator
      resourcesGrid.innerHTML = '<div style="text-align: center; grid-column: 1/-1; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading resources...</div>';
      
      // Query resources from Supabase
      let query = window.supabaseClient
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
      
      // Execute query
      const { data: resources, error } = await query;
      
      // Handle Supabase error
      if (error) {
        throw new Error(error.message);
      }
      
      // Clear the grid
      resourcesGrid.innerHTML = '';
      
      // Handle empty results
      if (!resources || resources.length === 0) {
        resourcesGrid.innerHTML = '<div style="text-align: center; grid-column: 1/-1; padding: 2rem;">No resources found for this category</div>';
        return;
      }
      
      // Build resource cards
      resources.forEach(resource => {
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
          <div class="resource-footer">
            <div class="post-date">
              <i class="far fa-calendar-alt"></i> ${createdAt}
            </div>
            <div class="resource-actions">
              <button class="save-btn" title="Save for later">
                <i class="far fa-bookmark"></i>
              </button>
              <button class="access-btn" data-url="${url}">
                <i class="fas fa-external-link-alt"></i> Access Resource
              </button>
            </div>
          </div>
        `;
        
        // Update click handler to only work with the Access button
        card.removeEventListener('click', () => {});
        const accessBtn = card.querySelector('.access-btn');
        if (accessBtn) {
          accessBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = accessBtn.dataset.url;
            if (url && url !== '#') {
              window.open(url, '_blank', 'noopener,noreferrer');
            }
          });
        }

        // Add save button functionality
        const saveBtn = card.querySelector('.save-btn');
        if (saveBtn) {
          saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const icon = saveBtn.querySelector('i');
            if (icon.classList.contains('far')) {
              icon.classList.remove('far');
              icon.classList.add('fas');
              saveBtn.title = 'Saved';
            } else {
              icon.classList.remove('fas');
              icon.classList.add('far');
              saveBtn.title = 'Save for later';
            }
          });
        }
        
        resourcesGrid.appendChild(card);
      });
      
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
  
  // Set up filter buttons
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const category = button.textContent.trim();
      loadResources(category === 'Featured' ? null : category);
    });
  });
  
  // Initial load
  loadResources();
}); 