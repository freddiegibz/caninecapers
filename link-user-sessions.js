#!/usr/bin/env node

/**
 * Link Sessions for Specific User
 *
 * Usage: node link-user-sessions.js sophsstrolls@gmail.com c3c26cd0-0040-4845-9120-4670af0fe542
 */

const email = process.argv[2];
const userId = process.argv[3];

if (!email || !userId) {
  console.log('Usage: node link-user-sessions.js <email> <userId>');
  console.log('Example: node link-user-sessions.js sophsstrolls@gmail.com c3c26cd0-0040-4845-9120-4670af0fe542');
  process.exit(1);
}

console.log(`🔗 Linking sessions for ${email} to user ${userId}`);

// This would require the Supabase client, but for now, let's provide the SQL
console.log('\n📝 Run this SQL in your Supabase SQL editor:');
console.log(`
UPDATE sessions
SET user_id = '${userId}'
WHERE client_email = '${email.toLowerCase()}'
AND user_id IS NULL;
`);

console.log('\n✅ This will link all unlinked sessions for this user.');
console.log('🔍 Check your My Sessions page after running this query.');
