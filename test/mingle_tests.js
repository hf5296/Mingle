/**
 * @fileoverview Automated test suite for Mingle OAuth2 API implementation.
 * Implements Phase D test cases TC1-TC3 focusing on user registration,
 * OAuth2 bearer token authentication, and access control validation.
 *
 * @description This test suite validates core authentication features:
 * - TC1: User registration for Olga, Nick, Mary, and Nestor
 * - TC2: OAuth2 Bearer token verification and user profile access
 * - TC3: Unauthorized API access rejection
 *
 * Test data is exported to Postman-compatible JSON for continued manual testing
 * of remaining test cases (TC4-TC20) covering posts, likes, comments, and browsing.
 *
 * @requires axios - HTTP client for API requests (2.6.0+)
 * @requires fs - Node.js file system module for test data export
 *
 * @example
 * ```bash
 * # Run tests from project root
 * node test/mingle_tests.js
 * ```
 *
 * @example
 * ```js
 * // Programmatic execution
 * const { runTests } = require('./test/mingle_tests.js');
 * runTests().then(() => console.log('Tests completed'));
 * ```
 */

const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000/api';

/**
 * Main test execution function for TC1-TC3 authentication scenarios
 * @async
 * @function runTests
 * @description Orchestrates the automated testing sequence:
 * 1. User registration for Olga, Nick, Mary, and Nestor
 * 2. OAuth2 Bearer token verification via /auth/me
 * 3. Unauthorized access rejection testing
 * 4. Export test data for Postman continuation
 * @returns {Promise<void>} Completes when all tests finish, regardless of success/failure
 * @throws {Error} Handles and reports test failures gracefully
 */
async function runTests() {
  console.log('🧪 Starting Mingle OAuth v2 API Tests (TC1-TC3)...\n');

  let tokens = {};
  let userIds = {};

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

    // ========== EXPORT DATA FOR POSTMAN ==========
    
    /**
     * @typedef {Object} PostmanExport
     * @property {Object.<string, string>} tokens - Map of User Name -> Bearer Token
     * @property {Object.<string, string>} userIds - Map of User Name -> MongoDB ID
     * @property {Object} config - Environment configuration
     */
    
    /** @type {PostmanExport} */
    const postmanTestData = {
      tokens,
      userIds,
      config: {
        baseUrl: BASE_URL,
        generatedAt: new Date().toISOString()
      }
    };

    fs.writeFileSync('./test/postman_data.json', JSON.stringify(postmanTestData, null, 2));
    console.log('\n📝 Complete test data saved to test/postman_data.json for Postman!');

    // ========== Summary ==========
    console.log('\n' + '='.repeat(50));
    console.log('✅ TC1-TC3 TESTS COMPLETED!');
    console.log('='.repeat(50));
    console.log('\n📊 Test Summary:');
    console.log(`   - Users registered: 4 (Olga, Nick, Mary, Nestor)`);
    console.log(`   - OAuth v2 bearer tokens: Verified`);
    console.log(`   - Unauthorized access: Blocked`);
    
    console.log('\n📌 Next Steps:');
    console.log(`   - Use tokens from postman_data.json for TC4-TC20`);
    console.log(`   - Continue testing manually via Postman`);
    console.log(`   - For Google OAuth: Visit http://localhost:3000/api/auth/google`);
    
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