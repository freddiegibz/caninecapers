#!/usr/bin/env node

/**
 * Bulk Session Linking Script
 *
 * This script links existing sessions to user accounts by matching email addresses.
 * Run this to connect all unlinked sessions to their corresponding user accounts.
 *
 * Usage: node link-sessions.js
 */

const fetch = require('node-fetch');

async function linkSessions() {
  try {
    console.log('🚀 Starting bulk session linking...');

    // You'll need to set your environment variables
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/link-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Bulk linking completed successfully!');
      console.log(`📊 Results: ${result.linked} sessions linked out of ${result.totalProcessed} total`);

      console.log('\n📋 Detailed results:');
      result.results.forEach((res, index) => {
        console.log(`${index + 1}. ${res.email}: ${res.status} (${res.sessions} sessions)`);
        if (res.userId) console.log(`   User ID: ${res.userId}`);
        if (res.error) console.log(`   Error: ${res.error}`);
      });
    } else {
      console.error('❌ Bulk linking failed:', result.error);
    }

  } catch (error) {
    console.error('💥 Script error:', error.message);
  }
}

// Run the script
linkSessions();
