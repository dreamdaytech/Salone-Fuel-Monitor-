const https = require('https');

const payload = JSON.stringify({ amount: 100, name: "Test User", email: "test@example.com" });

const options = {
  hostname: 'salonefuelmonitor.com',
  path: '/api/monime/create-checkout',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Response:', data);
  });
});

req.on('error', (err) => console.error('Request failed:', err.message));
req.write(payload);
req.end();
