const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

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
    const params = event.queryStringParameters || {};
    const path = event.path;
    const httpMethod = event.httpMethod;
    
    console.log('Path:', path);
    console.log('Method:', httpMethod);
    console.log('Params:', params);
    
    // Check saved resources
    if (httpMethod === 'GET' && params.resource_ids) {
      const userId = path.split('/').filter(Boolean).pop();
      const resourceIds = params.resource_ids.split(',').map(id => parseInt(id, 10));
      
      console.log('Checking saved resources for user:', userId);
      console.log('Resource IDs:', resourceIds);
      
      if (!userId || !resourceIds.length) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing user ID or resource IDs' })
        };
      }
      
      // Query saved resources
      const { data, error } = await supabase
        .from('saved_resources')
        .select('resource_id')
        .eq('user_id', userId)
        .in('resource_id', resourceIds);
        
      if (error) {
        console.error('Supabase query error:', error);
        throw new Error('Database query failed');
      }
      
      // Convert to map format { '1': true, '2': true, ... }
      const savedMap = {};
      resourceIds.forEach(id => {
        savedMap[id] = false;
      });
      
      if (data && data.length > 0) {
        data.forEach(item => {
          savedMap[item.resource_id] = true;
        });
      }
      
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(savedMap)
      };
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