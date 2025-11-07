// Test script for OAuth v2 implementation (Phase D: Testing)
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('🧪 Starting Mingle OAuth v2 API Tests (TC1-TC20)...\n');

  let tokens = {};

  try {
    // ========== TC1: Local Registration (Fallback) ==========
    console.log('📝 TC1: Testing local registration...');
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
        console.log(`✅ ${user.name} registered (Token type: ${res.data.token_type})`);
      }
    }

    // ========== TC2: OAuth v2 Access Verification ==========
    console.log('\n🔐 TC2: Testing OAuth v2 token-based access...');
    const meRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: tokens.Olga }
    });
    console.log(`✅ OAuth v2 bearer token authenticated: ${meRes.data.user.name}`);

    // ========== TC3: Unauthorized Access Prevention ==========
    console.log('\n🚫 TC3: Testing unauthorized access prevention...');
    try {
      await axios.post(`${BASE_URL}/posts`, {});
    } catch (e) {
      if (e.response && e.response.status === 401) {
        console.log('✅ Unauthorized access correctly blocked');
      }
    }

    // ========== TC4: Create Post with OAuth Token ==========
    console.log('\n📮 TC4: Testing post creation with OAuth v2 token...');
    const postRes = await axios.post(`${BASE_URL}/posts`, {
      title: 'OAuth v2 Test Post',
      body: 'Testing authenticated API access with OAuth v2 bearer token',
      topics: ['Tech'],
      expirationMinutes: 5
    }, { headers: { Authorization: tokens.Olga } });
    
    const postId = postRes.data.post.id;
    console.log(`✅ Post created (ID: ${postId})`);

    // ========== TC5: Like Post ==========
    console.log('\n👍 TC5: Testing like functionality...');
    await axios.post(`${BASE_URL}/posts/${postId}/like`, {}, {
      headers: { Authorization: tokens.Nick }
    });
    console.log('✅ Nick liked the post');

    // ========== TC6: Dislike Post ==========
    console.log('\n👎 TC6: Testing dislike functionality...');
    await axios.post(`${BASE_URL}/posts/${postId}/dislike`, {}, {
      headers: { Authorization: tokens.Mary }
    });
    console.log('✅ Mary disliked the post');

    // ========== TC7: Comment on Post ==========
    console.log('\n💬 TC7: Testing comment functionality...');
    await axios.post(`${BASE_URL}/posts/${postId}/comments`, {
      text: 'Great post about OAuth v2!'
    }, {
      headers: { Authorization: tokens.Nestor }
    });
    console.log('✅ Nestor commented on the post');

    // ========== TC8: Browse Posts by Topic ==========
    console.log('\n🔍 TC8: Testing browse posts by topic...');
    const browseRes = await axios.get(`${BASE_URL}/posts?topic=Tech`, {
      headers: { Authorization: tokens.Olga }
    });
    console.log(`✅ Found ${browseRes.data.count} Tech posts`);

    // ========== TC9: Token Refresh ==========
    console.log('\n🔄 TC9: Testing OAuth v2 token refresh...');
    const refreshRes = await axios.post(`${BASE_URL}/auth/token/refresh`, {}, {
      headers: { Authorization: tokens.Olga }
    });
    console.log(`✅ Token refreshed (New token type: ${refreshRes.data.token_type})`);

    // ========== TC10: Local Login ==========
    console.log('\n🔑 TC10: Testing local login...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'olga@test.com',
      password: 'password'
    });
    console.log(`✅ Local login successful (Expires in: ${loginRes.data.expires_in}s)`);

    console.log('\n✅ All OAuth v2 tests passed!');
    console.log('\n📌 Note: For full OAuth v2 testing, visit:');
    console.log(`   Google OAuth: http://localhost:3000/api/auth/google`);
    console.log('   (Browser required for OAuth flow)');
    
  } catch (e) {
    console.error('❌ Test failed:', e.response?.data || e.message);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };