const { createClient } = require('@supabase/supabase-js');

// Check for required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_KEY');
}

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

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Check if Supabase client is properly initialized
    if (!supabase) {
      throw new Error('Supabase client not initialized. Check environment variables.');
    }

    const params = event.queryStringParameters || {};
    const path = event.path;
    const httpMethod = event.httpMethod;
    
    console.log('Path:', path);
    console.log('Method:', httpMethod);
    console.log('Params:', params);
    
    // Check saved resources
    if (httpMethod === 'GET') {
      // Case 1: Get saved resources for a user
      if (params.user_id && !params.resource_ids) {
        const userId = params.user_id;
        console.log('Getting saved resources for user:', userId);
        
        // First get saved resources with full resource details using joins
        const { data: savedResourcesWithDetails, error: joinError } = await supabase
          .from('saved_resources')
          .select(`
            id,
            saved_at:created_at,
            resource_id,
            resources:resource_id (
              id,
              title,
              description,
              url,
              image_url,
              category_id,
              rating,
              source,
              created_at,
              categories:category_id(name)
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (joinError) {
          console.error('Supabase saved resources query error:', joinError);
          throw new Error('Database query failed');
        }
        
        if (!savedResourcesWithDetails || savedResourcesWithDetails.length === 0) {
          return {
            statusCode: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify([])
          };
        }
        
        // Format the response to make it more usable
        const formattedData = savedResourcesWithDetails.map(item => {
          const resource = item.resources || {};
          return {
            id: item.id,
            saved_id: item.id,
            saved_at: item.saved_at,
            resource_id: item.resource_id,
            title: resource.title,
            description: resource.description,
            url: resource.url,
            image_url: resource.image_url,
            category_id: resource.category_id,
            rating: resource.rating,
            source: resource.source,
            created_at: resource.created_at,
            categories: resource.categories
          };
        });
        
        console.log(`Returning ${formattedData.length} saved resources`);
        
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedData)
        };
      }
      
      // Case 2: Check if resources are saved by user
      if (params.user_id && params.resource_ids) {
        const userId = params.user_id;
        const resourceIds = params.resource_ids.split(',').map(id => {
          // Try to convert to integer but keep as string if it fails
          const parsed = parseInt(id.trim(), 10);
          return isNaN(parsed) ? id.trim() : parsed;
        });
        
        console.log('Checking saved status for user:', userId, 'resources:', resourceIds);
        
        // Get saved resources matching the resource IDs
        const { data, error } = await supabase
          .from('saved_resources')
          .select('resource_id')
          .eq('user_id', userId)
          .in('resource_id', resourceIds);
          
        if (error) {
          console.error('Supabase error checking saved resources:', error);
          throw new Error('Database query failed');
        }
        
        // Create the saved map
        const savedMap = {};
        resourceIds.forEach(id => {
          savedMap[id] = false;
        });
        
        if (data && data.length > 0) {
          data.forEach(item => {
            savedMap[item.resource_id] = true;
          });
        }
        
        console.log('Returning saved resources map:', savedMap);
        
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(savedMap)
        };
      }
    }
    
    // Save a resource
    if (httpMethod === 'POST') {
      // Parse body
      const body = JSON.parse(event.body || '{}');
      const { user_id, resource_id } = body;
      
      if (!user_id || !resource_id) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing user_id or resource_id' })
        };
      }
      
      // Insert saved resource
      const { data, error } = await supabase
        .from('saved_resources')
        .insert([{ user_id, resource_id }])
        .single();
        
      if (error) {
        // Check if already exists
        if (error.code === '23505') { // Unique constraint error
          return {
            statusCode: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Resource already saved' })
          };
        }
        
        console.error('Supabase insert error:', error);
        throw new Error('Failed to save resource');
      }
      
      return {
        statusCode: 201,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Resource saved successfully' })
      };
    }
    
    // Unsave a resource
    if (httpMethod === 'DELETE') {
      const userId = params.user_id;
      const resourceId = params.resource_id;
      
      if (!userId || !resourceId) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing user_id or resource_id' })
        };
      }
      
      // Delete saved resource
      const { error } = await supabase
        .from('saved_resources')
        .delete()
        .eq('user_id', userId)
        .eq('resource_id', resourceId);
        
      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error('Failed to unsave resource');
      }
      
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Resource unsaved successfully' })
      };
    }
    
    return {
      statusCode: 404,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Endpoint not found' })
    };
    
  } catch (error) {
    console.error('Error handling saved resources:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to process request',
        message: error.message || 'Unknown server error'
      })
    };
  }
}; 