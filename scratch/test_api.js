const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/stock?branch=Palembang',
  method: 'GET',
  headers: {
    // Need to mock an authenticated request? 
    // The API might require authentication. Let's see what getAuthenticatedUser does.
  }
};
