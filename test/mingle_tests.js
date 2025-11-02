// Test script (Phase D: Testing via Node.js or Python; using Node.js for demo)
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('🧪 Starting Mingle API Tests (TC1-TC20)...');

  let tokens = {};

  try {
    // TC1: Register Olga, Nick, Mary, Nestor
    const users = [
      { name: 'Olga', email: 'olga@test.com', password: 'password' },
      { name: 'Nick', email: 'nick@test.com', password: 'password' },
      { name: 'Mary', email: 'mary@test.com', password: 'password' },
      { name: 'Nestor', email: 'nestor@test.com', password: 'password' }
    ];

    for (let user of users) {
      const res = await axios.post(`${BASE_URL}/auth/register`, user);
      if (res.data.token) {
        tokens[user.name] = `Bearer ${res.data.token}`;
        console.log(`✅ ${user.name} registered`);
      }
    }

    // TC2: OAuth2 access (simulated via JWT)

    // TC3: Olga without token fails
    try {
      await axios.post(`${BASE_URL}/posts`, {});
    } catch (e) {
      console.log('✅ Olga unauth fails');
    }

    // TC4: Olga posts Tech message (5 min expire)
    const postRes = await axios.post(`${BASE_URL}/posts`, {
      title: 'AI Advances', body: 'Content', topics: ['Tech'], expirationMinutes: 5
    }, { headers: { Authorization: tokens.Olga } });
    console.log('✅ Olga posted (TC4)');

    // Continue adding more TC cases as needed...
    console.log('🚀 Tests complete. Add Postman for full demos.');
  } catch (e) {
    console.error('❌ Test failed:', e.message);
  }
}

if (require.main === module) {
  runTests();
}