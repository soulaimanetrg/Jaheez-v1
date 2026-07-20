const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('--- Testing Phone OTP Send ---');
  const resPhoneSend = await post('/admin-api/otp/send', { phone: '0612345678' });
  console.log('Phone Send Response:', resPhoneSend);

  console.log('--- Testing Email OTP Send ---');
  const resEmailSend = await post('/admin-api/otp/send', { email: 'test@example.com' });
  console.log('Email Send Response:', resEmailSend);

  if (resEmailSend.body && resEmailSend.body.code) {
    console.log('--- Testing Email OTP Verify ---');
    const resEmailVerify = await post('/admin-api/otp/verify', {
      email: 'test@example.com',
      code: resEmailSend.body.code
    });
    console.log('Email Verify Response:', resEmailVerify);
  }
}

run().catch(console.error);
