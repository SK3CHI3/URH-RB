const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
let supabase;
try {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Error initializing Supabase client:', error);
}

// Common headers for CORS
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

exports.handler = async (event, context) => {
  // Log request details
  console.log('API Router received request:', {
    path: event.path,
    method: event.httpMethod,
    params: event.queryStringParameters,
    body: event.body ? '(body present)' : '(no body)',
  });

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Extract path components
  const path = event.path;
  const pathParts = path.split('/').filter(p => p);
  
  // Determine which function to route to
  let targetFunction = null;
  let newParams = { ...event.queryStringParameters };
  
  console.log('Path parts:', pathParts);
  
  // Route based on path
  if (pathParts.includes('resources') && !pathParts.includes('saved-resources')) {
    targetFunction = 'resources';
  } 
  else if (pathParts.includes('saved-resources') || 
           (pathParts.includes('user') && pathParts.includes('saved-resources'))) {
    targetFunction = 'saved-resources';
    
    // Extract user_id from path if it's in the format /user/:userId/saved-resources
    if (pathParts.includes('user') && pathParts.length > 2) {
      const userIdIndex = pathParts.indexOf('user') + 1;
      if (userIdIndex < pathParts.length) {
        const userId = pathParts[userIdIndex];
        if (userId && userId !== 'saved-resources') {
          newParams.user_id = userId;
        }
      }
    }
  }
  else if (pathParts.includes('categories')) {
    targetFunction = 'categories';
  }
  
  // If no matching function, return 404
  if (!targetFunction) {
    return {
      statusCode: 404,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `No matching function for path: ${path}` })
    };
  }
  
  console.log(`Routing to function: ${targetFunction} with params:`, newParams);
  
  try {
    // Prepare a new event object for the target function
    const newEvent = {
      ...event,
      queryStringParameters: newParams,
      // We're keeping the original path, but you could modify it if needed
    };
    
    // Dynamically require and execute the target function
    const functionModule = require(`./${targetFunction}.js`);
    return await functionModule.handler(newEvent, context);
  } catch (error) {
    console.error(`Error routing request to ${targetFunction}:`, error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to process request',
        message: error.message || 'Unknown server error',
        path: path,
        target: targetFunction
      })
    };
  }
}; 