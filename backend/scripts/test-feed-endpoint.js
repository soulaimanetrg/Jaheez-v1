const http = require('http');

http.get('http://localhost:3002/admin-api/notification-feed/public', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('Response:', JSON.parse(data));
  });
}).on('error', (err) => {
  console.error('Fetch error:', err.message);
});
