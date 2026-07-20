const BASE_URL = 'http://localhost:5000';

async function run() {
  console.log('Fetching store list without token...');
  const res = await fetch(`${BASE_URL}/admin-api/v1/customer/stores`);
  console.log('Status:', res.status);
  const json = await res.json();
  console.log('Stores count:', json.length);
  if (json.length > 0) {
    console.log('First store sample:', {
      id: json[0].id,
      name: json[0].name,
      is_open: json[0].is_open
    });
  }
}

run().catch(console.error);
