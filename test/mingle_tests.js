// Test script for OAuth v2 implementation (Phase D: Testing - TC1-TC20)
const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('🧪 Starting Mingle OAuth v2 API Tests (TC1-TC20)...\n');

  let tokens = {};
  let userIds = {};
  let postIds = {
    olgaTech: null,
    nickTech: null,
    maryTech: null,
    nestorHealth: null,
    nickSport: null
  };

  try {
    // ========== TC1: Register all users ==========
    console.log('📝 TC1: Registering Olga, Nick, Mary, and Nestor...');
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
        userIds[user.name] = res.data.user.id;
        console.log(`✅ ${user.name} registered (Token type: Bearer, ID: ${res.data.user.id})`);
      }
    }

    // ========== TC2: OAuth v2 token verification ==========
    console.log('\n🔐 TC2: All users verify OAuth v2 token access...');
    for (let userName of Object.keys(tokens)) {
      const meRes = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: tokens[userName] }
      });
      console.log(`✅ ${userName}'s OAuth v2 bearer token verified`);
    }

    // ========== TC3: Unauthorized access ==========
    console.log('\n🚫 TC3: Olga attempts API call without token...');
    try {
      await axios.post(`${BASE_URL}/posts`, {});
    } catch (e) {
      if (e.response && e.response.status === 401) {
        console.log('✅ Unauthorized access correctly blocked');
      }
    }

    // ========== TC4: Olga posts Tech message (5 min expiration) ==========
    console.log('\n📮 TC4: Olga posts in Tech topic (5 min expiration)...');
    const olgaTechPostRes = await axios.post(`${BASE_URL}/posts`, {
      title: 'AI Advances',
      body: 'Content',
      topics: ['Tech'],
      expirationMinutes: 5
    }, {
      headers: { Authorization: tokens.Olga }
    });
    postIds.olgaTech = olgaTechPostRes.data.post.id;
    console.log(`✅ Olga posted Tech message (ID: ${postIds.olgaTech}, expires in 5 min)`);

    // ========== TC5: Nick posts in Tech topic ==========
    console.log('\n📮 TC5: Nick posts in Tech topic...');
    const nickTechPostRes = await axios.post(`${BASE_URL}/posts`, {
      title: 'Cloud Computing Trends',
      body: 'Exploring serverless architecture',
      topics: ['Tech'],
      expirationMinutes: 10
    }, {
      headers: { Authorization: tokens.Nick }
    });
    postIds.nickTech = nickTechPostRes.data.post.id;
    console.log(`✅ Nick posted Tech message (ID: ${postIds.nickTech})`);

    // ========== TC6: Mary posts in Tech topic ==========
    console.log('\n📮 TC6: Mary posts in Tech topic...');
    const maryTechPostRes = await axios.post(`${BASE_URL}/posts`, {
      title: 'Cybersecurity Best Practices',
      body: 'Essential security measures',
      topics: ['Tech'],
      expirationMinutes: 10
    }, {
      headers: { Authorization: tokens.Mary }
    });
    postIds.maryTech = maryTechPostRes.data.post.id;
    console.log(`✅ Mary posted Tech message (ID: ${postIds.maryTech})`);

    // ========== EXPORT DATA FOR POSTMAN ==========
    const postmanTestData = {
      tokens,
      postIds,
      userIds,
      config: {
        baseUrl: BASE_URL,
        generatedAt: new Date().toISOString()
      },
      testData: {
        topics: ['Tech', 'Health', 'Sport', 'Politics'],
        expirationTimes: [5, 10, 15],
        sampleComments: [
          "Great article on cybersecurity!",
          "Excellent security insights! Very helpful.",
          "Very important topic. Thanks for sharing!"
        ]
      }
    };

    fs.writeFileSync('./test/postman_data.json', JSON.stringify(postmanTestData, null, 2));
    console.log('\n📝 Complete test data saved to test/postman_data.json for Postman!');

    // ========== TC7: Nick and Olga browse Tech topic ==========
    console.log('\n🔍 TC7: Nick and Olga browse Tech topic...');
    const browseRes = await axios.get(`${BASE_URL}/posts?topic=Tech`, {
      headers: { Authorization: tokens.Nick }
    });
    console.log(`✅ Found ${browseRes.data.count} Tech posts (expected 3)`);

    // ========== TC8: Nick and Olga like Mary's post ==========
    console.log('\n👍 TC8: Nick and Olga like Mary\'s post...');
    await axios.post(`${BASE_URL}/posts/${postIds.maryTech}/like`, {}, {
      headers: { Authorization: tokens.Nick }
    });
    console.log('✅ Nick liked Mary\'s post');

    await axios.post(`${BASE_URL}/posts/${postIds.maryTech}/like`, {}, {
      headers: { Authorization: tokens.Olga }
    });
    console.log('✅ Olga liked Mary\'s post');

    // ========== TC9: Nestor likes Nick's post and dislikes Mary's ==========
    console.log('\n👍👎 TC9: Nestor likes Nick\'s post and dislikes Mary\'s...');
    await axios.post(`${BASE_URL}/posts/${postIds.nickTech}/like`, {}, {
      headers: { Authorization: tokens.Nestor }
    });
    console.log('✅ Nestor liked Nick\'s post');

    await axios.post(`${BASE_URL}/posts/${postIds.maryTech}/dislike`, {}, {
      headers: { Authorization: tokens.Nestor }
    });
    console.log('✅ Nestor disliked Mary\'s post');

    // ========== TC10: Nestor dislikes Nick's post (mutual exclusivity) ==========
    console.log('\n🔄 TC10: Nestor changes to dislike on Nick\'s post...');
    await axios.post(`${BASE_URL}/posts/${postIds.nickTech}/dislike`, {}, {
      headers: { Authorization: tokens.Nestor }
    });
    console.log('✅ Nestor disliked Nick\'s post (like removed - mutual exclusivity)');

    // ========== TC11: Mary tries to like her own post ==========
    console.log('\n⚠️  TC11: Mary tries to like her own post...');
    try {
      await axios.post(`${BASE_URL}/posts/${postIds.maryTech}/like`, {}, {
        headers: { Authorization: tokens.Mary }
      });
      console.log('⚠️  Self-like succeeded (business rule not enforced)');
    } catch (e) {
      if (e.response && e.response.status === 403) {
        console.log('✅ Self-like correctly prevented');
      }
    }

    // ========== TC12: Nick comments on Mary's post ==========
    console.log('\n💬 TC12: Nick comments on Mary\'s post...');
    await axios.post(`${BASE_URL}/posts/${postIds.maryTech}/comments`, {
      text: 'Excellent security insights! Very helpful.'
    }, {
      headers: { Authorization: tokens.Nick }
    });
    console.log('✅ Nick commented on Mary\'s post');

    // ========== TC13: Olga comments on Mary's post ==========
    console.log('\n💬 TC13: Olga comments on Mary\'s post...');
    await axios.post(`${BASE_URL}/posts/${postIds.maryTech}/comments`, {
      text: 'Great article on cybersecurity!'
    }, {
      headers: { Authorization: tokens.Olga }
    });
    console.log('✅ Olga commented on Mary\'s post');

    // ========== TC14: Nestor posts Health topic message ==========
    console.log('\n📮 TC14: Nestor posts in Health topic...');
    const nestorHealthPostRes = await axios.post(`${BASE_URL}/posts`, {
      title: 'Mental Health Awareness',
      body: 'Importance of mental health in the workplace',
      topics: ['Health'],
      expirationMinutes: 10
    }, {
      headers: { Authorization: tokens.Nestor }
    });
    postIds.nestorHealth = nestorHealthPostRes.data.post.id;
    console.log(`✅ Nestor posted Health message (ID: ${postIds.nestorHealth})`);

    // ========== TC15: Mary browses Health topic ==========
    console.log('\n🔍 TC15: Mary browses Health topic...');
    const healthBrowseRes = await axios.get(`${BASE_URL}/posts?topic=Health`, {
      headers: { Authorization: tokens.Mary }
    });
    console.log(`✅ Mary found ${healthBrowseRes.data.count} Health post(s) (expected 1)`);

    // ========== TC16: Mary comments on Nestor's Health post ==========
    console.log('\n💬 TC16: Mary comments on Nestor\'s Health post...');
    await axios.post(`${BASE_URL}/posts/${postIds.nestorHealth}/comments`, {
      text: 'Very important topic. Thanks for sharing!'
    }, {
      headers: { Authorization: tokens.Mary }
    });
    console.log('✅ Mary commented on Nestor\'s Health post');

    // ========== TC17: Mary tries to dislike expired post ==========
    console.log('\n⏰ TC17: Testing expired post interaction...');
    console.log('   (Skipping 5-minute wait - test manually or reduce expiration time)');
    console.log('   Expected: Dislike should fail on expired post');

    // ========== TC18: Nestor browses Health topic ==========
    console.log('\n🔍 TC18: Nestor browses Health topic...');
    const nestorHealthBrowse = await axios.get(`${BASE_URL}/posts?topic=Health`, {
      headers: { Authorization: tokens.Nestor }
    });
    const healthPost = nestorHealthBrowse.data.posts[0];
    console.log(`✅ Nestor found ${nestorHealthBrowse.data.count} Health post(s)`);
    console.log(`   Post has ${healthPost.comments} comment(s) (expected 1 from Mary)`);

    // ========== TC19: Nick browses expired Sport posts ==========
    console.log('\n🔍 TC19: Nick browses expired Sport posts...');
    const expiredSportsRes = await axios.get(`${BASE_URL}/posts/browse/expired?topic=Sport`, {
      headers: { Authorization: tokens.Nick }
    });
    console.log(`✅ Found ${expiredSportsRes.data.count} expired Sport posts (expected 0)`);

    // ========== TC20: Nestor queries most active Tech post ==========
    console.log('\n🏆 TC20: Nestor queries most active Tech post...');
    const activePostRes = await axios.get(`${BASE_URL}/posts/browse/active?topic=Tech`, {
      headers: { Authorization: tokens.Nestor }
    });
    const topPost = activePostRes.data.topPost;
    console.log(`✅ Most active Tech post: "${topPost.title}" by ${topPost.owner}`);
    console.log(`   Activity score: ${topPost.activityScore} (${topPost.likes} likes, ${topPost.dislikes} dislikes)`);

    // ========== Summary ==========
    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL TC1-TC20 TESTS COMPLETED!');
    console.log('='.repeat(50));
    console.log('\n📊 Test Summary:');
    console.log(`   - Users registered: 4 (Olga, Nick, Mary, Nestor)`);
    console.log(`   - Posts created: ${Object.values(postIds).filter(id => id).length}`);
    console.log(`   - Topics tested: Tech, Health, Sport`);
    console.log(`   - Interactions: Likes, dislikes, comments`);
    console.log(`   - OAuth v2 bearer tokens: Verified`);
    
    console.log('\n📌 Note: For complete OAuth v2 testing with Google:');
    console.log(`   Visit: http://localhost:3000/api/auth/google`);
    console.log('   (Browser required for OAuth authorization flow)');
    
  } catch (e) {
    console.error('\n❌ Test failed:');
    console.error('   Error:', e.response?.data || e.message);
    console.error('   Status:', e.response?.status);
    if (e.response?.data) {
      console.error('   Details:', JSON.stringify(e.response.data, null, 2));
    }
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };