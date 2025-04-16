// Simplified resources loading with robust error handling
document.addEventListener('DOMContentLoaded', () => {
  console.log('Resources.js loaded');
  
  // Get DOM elements
  const resourcesGrid = document.querySelector('.resources-grid');
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  // Track if we're currently accessing a resource to prevent multiple clicks
  let isAccessingResource = false;
  let isSavingResource = false;
  
  // Store saved resources map (resourceId -> true/false)
  let savedResourcesMap = {};
  
  // Current user info
  let currentUser = null;
  
  // Exit if the resources grid isn't found
  if (!resourcesGrid) {
    console.error('Resources grid not found in the document');
    return;
  } else {
    console.log('Resources grid found');
  }
  
  // Initialize - check if user is logged in
  async function initialize() {
    try {
      console.log('Initializing resources.js - checking environment config');
      console.log('Environment:', window.location.hostname.includes('localhost') ? 'Development' : 'Production');
      console.log('API URL:', window.appConfig?.apiUrl || 'Not configured');
      console.log('Supabase Client:', window.supabaseClient ? 'Available' : 'Not available');
      
      // Get current user if auth.js is loaded
      if (typeof getCurrentUser === 'function') {
        console.log('getCurrentUser function is available');
        try {
          currentUser = await getCurrentUser();
          console.log('Current user:', currentUser ? currentUser.id : 'Not logged in');
          
          if (!currentUser) {
            console.log('No user found. Auth state:', 
                        typeof getSupabase === 'function' ? 'Supabase client available' : 'No Supabase client');
          }
        } catch (authError) {
          console.error('Error getting current user:', authError);
        }
      } else {
        console.warn('getCurrentUser function is not available - auth.js might not be loaded yet');
        
        // Try to load auth.js if not already loaded
        if (!document.querySelector('script[src*="auth.js"]')) {
          console.log('Attempting to load auth.js dynamically');
          const script = document.createElement('script');
          script.src = 'public/js/auth.js';
          document.body.appendChild(script);
          
          // Wait for script to load
          await new Promise(resolve => {
            script.onload = resolve;
            script.onerror = () => {
              console.error('Failed to load auth.js');
              resolve();
            };
          });
        }
      }
      
      // Load resource counts for category badges
      await updateResourceCounts();
      
      // Load resources
      await loadResources();
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  }
  
  // Fetch and update resource counts for each category
  async function updateResourceCounts() {
    try {
      console.log('Fetching resource counts for categories');
      
      // Construct the API URL based on the environment configuration
      const baseUrl = window.appConfig?.apiUrl || '';
      const countUrl = `${baseUrl}/api/resources/counts`;
      
      // If we're using static HTML, the counts are already in the HTML
      const resourceCountElements = document.querySelectorAll('.resource-count');
      if (resourceCountElements.length > 0) {
        console.log('Resource count badges already present in HTML');
        return;
      }
      
      // Attempt to fetch counts from API
      try {
        const response = await fetch(countUrl);
        
        if (!response.ok) {
          throw new Error(`Error fetching resource counts: ${response.status}`);
        }
        
        const counts = await response.json();
        console.log('Resource counts:', counts);
        
        // Update the count badges
        document.querySelectorAll('.category-card').forEach(card => {
          const categoryName = card.querySelector('h3').textContent.trim();
          const count = counts[categoryName] || 0;
          
          // Get or create the resource count element
          let countElement = card.querySelector('.resource-count');
          if (!countElement) {
            countElement = document.createElement('div');
            countElement.className = 'resource-count';
            card.appendChild(countElement);
          }
          
          countElement.textContent = count;
        });
      } catch (error) {
        console.error('Failed to fetch category counts:', error);
        // On error, we'll leave the hardcoded counts as is
      }
    } catch (error) {
      console.error('Error updating resource counts:', error);
    }
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
  
  // Handle saving resources
  async function handleSaveResource(saveBtn, resourceId) {
    console.log('handleSaveResource called for resource ID:', resourceId);
    
    // Prevent multiple simultaneous saves
    if (isSavingResource) {
      console.log('Already saving a resource, ignoring click');
      return;
    }
    
    isSavingResource = true;
    
    try {
      // Check if auth.js is properly loaded
      if (typeof getCurrentUser !== 'function') {
        console.error('Auth functions not available - auth.js may not be loaded correctly');
        showNotification('Authentication system not available. Please refresh the page.', 'error');
        isSavingResource = false;
        return;
      }
      
      // Try to get the current user again if not available
      if (!currentUser) {
        try {
          console.log('Attempting to get current user again...');
          currentUser = await getCurrentUser();
        } catch (authError) {
          console.error('Error getting current user:', authError);
        }
      }
      
      // Check if user is logged in
      if (!currentUser) {
        console.log('User not logged in, redirecting to login');
        showNotification('Please log in to save resources', 'error');
        window.location.href = '/login.html?redirect=index.html';
        return;
      }
      
      const userId = currentUser.id;
      console.log('User ID for save operation:', userId);
      
      const icon = saveBtn.querySelector('i');
      const isSaved = icon.classList.contains('fas');
      
      console.log('Current saved state:', isSaved ? 'Saved' : 'Not saved');
      
      // Apply visual feedback immediately
      saveBtn.style.transform = 'scale(0.95)';
      saveBtn.style.opacity = '0.7';
      
      // Show loading state
      const originalIcon = icon.className;
      icon.className = 'fas fa-spinner fa-spin';
      saveBtn.disabled = true;
      
      // Ensure we have the correct base URL for the environment
      const baseUrl = window.appConfig?.apiUrl || '';
      
      // For local development, we need to use the full path including /api
      const endpoint = `${baseUrl}/api/user/saved-resources`;
      console.log('Using endpoint:', endpoint);
      
      // Save the resource
      try {
        if (!isSaved) {
          console.log('Making POST request to save resource:', endpoint);
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: userId,
              resource_id: resourceId
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error saving resource');
          }
          
          // Update saved state
          savedResourcesMap[resourceId] = true;
          
          // Update UI
          icon.className = 'fas fa-bookmark';
          saveBtn.title = 'Saved';
          showNotification('Resource saved successfully', 'success', 2000);
          
          // Refresh the dashboard if we're on it
          if (window.location.pathname === '/dashboard.html') {
            await loadSavedResources();
          }
          
        } else {
          console.log('Making DELETE request to unsave resource:', endpoint);
          
          const response = await fetch(`${endpoint}?user_id=${userId}&resource_id=${resourceId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error removing saved resource');
          }
          
          console.log('Unsave successful');
          
          // Update saved state
          savedResourcesMap[resourceId] = false;
          
          // Update UI
          icon.className = 'far fa-bookmark';
          saveBtn.title = 'Save for later';
          showNotification('Resource removed from saved items', 'success', 2000);
          
          // Refresh the dashboard if we're on it
          if (window.location.pathname === '/dashboard.html') {
            await loadSavedResources();
          }
        }
      } catch (error) {
        console.error('Error in save/unsave operation:', error);
        throw error;
      }
      
    } catch (error) {
      console.error('Error saving/unsaving resource:', error);
      showNotification(`Failed to ${saveBtn.title === 'Saved' ? 'unsave' : 'save'} resource`, 'error');
      
      // Reset to original state
      const icon = saveBtn.querySelector('i');
      icon.className = saveBtn.title === 'Saved' ? 'fas fa-bookmark' : 'far fa-bookmark';
      
    } finally {
      // Reset button state with a slight delay for better visual feedback
      setTimeout(() => {
        const icon = saveBtn.querySelector('i');
        saveBtn.disabled = false;
        saveBtn.style.transform = '';
        saveBtn.style.opacity = '1';
        
        // Add bounce effect on completion
        saveBtn.style.transform = 'translateY(-3px)';
        setTimeout(() => {
          saveBtn.style.transform = '';
        }, 300);
        
        isSavingResource = false;
      }, 500);
    }
  }
  
  // Function to attach click handlers to all access and save buttons
  function attachButtonHandlers() {
    console.log('Attaching button handlers');
    
    // Get all access buttons
    const accessButtons = document.querySelectorAll('.access-btn');
    console.log(`Found ${accessButtons.length} access buttons`);
    
    // Attach click handlers to each access button
    accessButtons.forEach((btn, index) => {
      console.log(`Setting up access button ${index+1} with URL: ${btn.dataset.url}`);
      
      // Remove any existing click handlers
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Add the new click handler
      newBtn.addEventListener('click', function(e) {
        console.log('Access button clicked');
        e.preventDefault();
        e.stopPropagation();
        handleResourceAccess(this);
      });
      
      // Ensure the button looks clickable
      newBtn.style.cursor = 'pointer';
    });
    
    // Get all save buttons
    const saveButtons = document.querySelectorAll('.save-btn');
    console.log(`Found ${saveButtons.length} save buttons`);
    
    // Attach click handlers to each save button
    saveButtons.forEach((btn, index) => {
      const resourceId = btn.dataset.resourceId;
      console.log(`Setting up save button ${index+1} for resource ID: ${resourceId}`);
      
      if (!resourceId) {
        console.warn(`Save button ${index+1} has no resource ID`);
        return;
      }
      
      // Remove any existing click handlers
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Ensure the button looks clickable
      newBtn.style.cursor = 'pointer';
      
      // Apply additional inline styles to increase clickability
      newBtn.style.position = 'relative';
      newBtn.style.zIndex = '20';
      
      // Add visual indicator on hover
      newBtn.addEventListener('mouseover', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      });
      
      newBtn.addEventListener('mouseout', function() {
        this.style.transform = 'translateY(0)';
        this.style.backgroundColor = 'transparent';
      });
      
      // Update icon based on saved state
      const icon = newBtn.querySelector('i');
      if (savedResourcesMap[resourceId]) {
        icon.className = 'fas fa-bookmark';
        newBtn.title = 'Saved';
      } else {
        icon.className = 'far fa-bookmark';
        newBtn.title = 'Save for later';
      }
      
      // Add the new click handler with additional debugging
      newBtn.addEventListener('click', function(e) {
        console.log('Save button clicked for resource ID:', resourceId);
        e.preventDefault();
        e.stopPropagation();
        
        // Add click indicator
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
          this.style.transform = 'translateY(0)';
        }, 100);
        
        handleSaveResource(this, resourceId);
      });
    });
  }
  
  // Check which resources are saved by the current user
  async function checkSavedResources(resourceIds) {
    try {
      if (!currentUser || !resourceIds || !resourceIds.length) {
        console.log('Cannot check saved resources: missing user or resource IDs');
        return {};
      }
      
      // Get list of saved resources from API
      const userId = currentUser.id;
      
      // Ensure we have the correct base URL for the environment
      const baseUrl = window.appConfig?.apiUrl || '';
      
      // Handle different API paths for server.js vs Netlify Functions
      let apiUrl;
      
      // Convert resourceIds to strings for safety
      const stringResourceIds = resourceIds.map(id => String(id));
      
      if (baseUrl.includes('/.netlify/functions')) {
        // In production with Netlify Functions
        apiUrl = `${baseUrl}/saved-resources/check?user_id=${userId}&resource_ids=${stringResourceIds.join(',')}`;
      } else {
        // In development with Express server
        apiUrl = `${baseUrl}/api/user/${userId}/saved-resources/check?resource_ids=${stringResourceIds.join(',')}`;
      }
      
      console.log('Checking saved resources at URL:', apiUrl);
      
      // Use fetch with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 10000)
      );
      
      const response = await Promise.race([
        fetch(apiUrl),
        timeoutPromise
      ]);
      
      if (!response.ok) {
        console.error('Failed to check saved resources, status:', response.status);
        throw new Error('Failed to check saved resources');
      }
      
      const savedMap = await response.json();
      console.log('Saved resources map:', savedMap);
      
      return savedMap;
    } catch (error) {
      console.error('Error checking saved resources:', error);
      return {};
    }
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
        'Events': 7,
        'Blogs & News': 8
      };

      // Set up request timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 15 seconds')), 15000);
      });
      
      let resources;
      
      // Check if Supabase client is available
      if (window.supabaseClient) {
        console.log('Using Supabase client for data');
        // Query resources from Supabase with timeout
        let query = window.supabaseClient
          .from('resources')
          .select('*, categories(name)')
          .order('created_at', { ascending: false });
        
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
        
        const { data, error } = result;
        
        // Handle Supabase error
        if (error) {
          throw new Error(error.message);
        }
        
        resources = data;
      } else {
        console.log('Using API endpoint for data');
        // Use the API endpoint if Supabase client is not available
        const baseUrl = window.appConfig?.apiUrl || '';
        
        // Handle different API paths for server.js vs Netlify Functions
        let apiUrl;
        
        if (baseUrl.includes('/.netlify/functions')) {
          // In production with Netlify Functions
          apiUrl = category && category !== 'Featured'
            ? `${baseUrl}/resources?category=${encodeURIComponent(category)}`
            : `${baseUrl}/resources`;
        } else {
          // In development with Express server
          apiUrl = category && category !== 'Featured' 
            ? `${baseUrl}/api/resources?category=${encodeURIComponent(category)}`
            : `${baseUrl}/api/resources`;
        }
          
        console.log('Fetching from API URL:', apiUrl);
        
        const response = await Promise.race([
          fetch(apiUrl),
          timeoutPromise
        ]);
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        resources = await response.json();
      }
      
      // Check which resources are saved by the current user
      if (resources && resources.length > 0) {
        const resourceIds = resources.map(r => r.id);
        savedResourcesMap = await checkSavedResources(resourceIds);
      }
      
      // Enhanced sorting logic with better error handling and debug info
      console.log('Resources before sorting:', resources.length > 0 ? 
        `First item date: ${resources[0].created_at}, Last item date: ${resources[resources.length-1].created_at}` : 
        'No resources');
        
      // Sort resources to always show newest first
      try {
        resources.sort((a, b) => {
          // Handle missing dates
          if (!a.created_at && !b.created_at) return 0;
          if (!a.created_at) return 1;
          if (!b.created_at) return -1;
          
          // Convert to Date objects and compare
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          
          // Check for invalid dates
          if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          
          // Sort newest first
          return dateB - dateA;
        });
        
        console.log('Resources after sorting:', resources.length > 0 ? 
          `First item date: ${resources[0].created_at}, Last item date: ${resources[resources.length-1].created_at}` : 
          'No resources');
      } catch (sortError) {
        console.error('Error sorting resources:', sortError);
        // Continue with unsorted resources rather than failing
      }
      
      // Render the resources
      renderResources(resources);
      
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
        const id = resource.id || index;
        const title = resource.title || 'Untitled Resource';
        const description = resource.description || 'No description available';
        const imageUrl = resource.image_url || 'https://via.placeholder.com/400x200?text=Resource';
        const url = resource.url || '#';
        const rating = resource.rating || '4.5';
        const source = resource.source || 'Unknown Source';
        const categoryName = resource.categories?.name || 'Resource';
        
        // Log URL for debugging
        console.log(`Resource ${index+1} "${title}" URL:`, url);
        console.log(`Resource ${index+1} "${title}" ID:`, id);
        
        // Format the date
        const createdAt = resource.created_at ? new Date(resource.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : 'Recently added';
        
        // Set saved status from our map
        const isSaved = savedResourcesMap[id] || false;
        
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
              <button class="save-btn" title="${isSaved ? 'Saved' : 'Save for later'}" data-resource-id="${id}" style="cursor: pointer; position: relative; z-index: 10;">
                <i class="${isSaved ? 'fas' : 'far'} fa-bookmark"></i>
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
    attachButtonHandlers();
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
  
  // Start initialization
  initialize();
  
  // Additional initialization to make sure buttons are clickable 
  // for cases where resources are loaded from cached data
  setTimeout(() => {
    attachButtonHandlers();
    console.log('Added delayed button handler initialization');
  }, 2000);
}); 