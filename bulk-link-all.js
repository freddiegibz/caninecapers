#!/usr/bin/env node

/**
 * Bulk Link ALL Sessions Script
 *
 * Links ALL unlinked sessions to their corresponding user accounts by email.
 * Run this to fix the session-user linking issue for all users at once.
 *
 * Usage: node bulk-link-all.js
 */

const https = require('https');

async function bulkLinkAll() {
  try {
    console.log('🚀 Starting bulk linking of ALL unlinked sessions...');

    // You'll need to set your environment variables
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const postData = JSON.stringify({
      forceRefresh: false // Only link unlinked sessions
    });

    const options = {
      hostname: new URL(baseUrl).hostname,
      port: new URL(baseUrl).port || 443,
      path: '/api/link-sessions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(data);

            if (res.statusCode === 200 && result.message) {
              console.log('✅ Bulk linking completed successfully!');
              console.log(`📊 Results: ${result.linked || 0} sessions linked out of ${result.totalProcessed || 0} total`);

              if (result.results && result.results.length > 0) {
                console.log('\n📋 Summary by email:');
                result.results.forEach((res, index) => {
                  if (res.status === 'linked') {
                    console.log(`✅ ${res.email}: ${res.sessions} sessions linked`);
                  } else if (res.status === 'no_user_found') {
                    console.log(`⚠️ ${res.email}: No user account found (${res.sessions} sessions)`);
                  } else {
                    console.log(`❌ ${res.email}: Error (${res.error || 'unknown'})`);
                  }
                });
              }

              console.log('\n🎉 All sessions processed!');
            } else {
              console.error('❌ Bulk linking failed:', result.error || 'Unknown error');
            }

            resolve(result);
          } catch (parseError) {
            console.error('❌ Error parsing response:', parseError);
            reject(parseError);
          }
        });
      });

      req.on('error', (error) => {
        console.error('💥 Request error:', error);
        reject(error);
      });

      req.write(postData);
      req.end();
    });

  } catch (error) {
    console.error('💥 Script error:', error.message);
  }
}

// Run the script
bulkLinkAll().catch(console.error);
