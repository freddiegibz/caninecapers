import { NextResponse } from "next/server";
import { supabase } from "../../../src/lib/supabaseClient";

// Helper: find user by email in auth.users
async function findUserByEmail(email: string) {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('Error fetching users:', error);
      return null;
    }

    const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    return user || null;
  } catch (err) {
    console.error('Error finding user by email:', err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { specificEmail, forceRefresh } = body;
    console.log('🔗 Starting session linking process...', specificEmail ? `for ${specificEmail}` : 'bulk');

    // If specific email provided, just link that one
    if (specificEmail) {
      console.log(`🎯 Linking sessions for specific email: ${specificEmail}`);

      const user = await findUserByEmail(specificEmail);
      if (!user) {
        return NextResponse.json({
          error: `No user found with email: ${specificEmail}`,
          userFound: false
        }, { status: 404 });
      }

      console.log(`✅ Found user ${user.id} for email: ${specificEmail}`);

      // Get unlinked sessions for this email
      const { data: sessions, error: fetchError } = await supabase
        .from('sessions')
        .select('id')
        .eq('client_email', specificEmail.toLowerCase())
        .is('user_id', null);

      if (fetchError) {
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
      }

      if (!sessions || sessions.length === 0) {
        return NextResponse.json({
          message: 'No unlinked sessions found for this email',
          linked: 0,
          userFound: true,
          userId: user.id
        });
      }

      // Link the sessions
      const sessionIds = sessions.map(s => s.id);
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ user_id: user.id })
        .in('id', sessionIds);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to link sessions' }, { status: 500 });
      }

      return NextResponse.json({
        message: `Successfully linked ${sessions.length} sessions`,
        linked: sessions.length,
        userFound: true,
        userId: user.id,
        sessionIds
      });
    }

    // Bulk linking logic - get ALL unlinked sessions
    console.log('🔍 Fetching all unlinked sessions...');
    const { data: unlinkedSessions, error: fetchError } = await supabase
      .from('sessions')
      .select('id, client_email')
      .is('user_id', null)
      .not('client_email', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching unlinked sessions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    if (!unlinkedSessions || unlinkedSessions.length === 0) {
      console.log('✅ No unlinked sessions found');
      return NextResponse.json({ message: 'No unlinked sessions found', linked: 0 });
    }

    console.log(`📋 Found ${unlinkedSessions.length} unlinked sessions`);

    let linkedCount = 0;
    const results = [];

    // Group sessions by email for efficiency
    const sessionsByEmail: { [email: string]: typeof unlinkedSessions } = {};
    for (const session of unlinkedSessions) {
      if (!session.client_email) continue;
      const email = session.client_email.toLowerCase();
      if (!sessionsByEmail[email]) {
        sessionsByEmail[email] = [];
      }
      sessionsByEmail[email].push(session);
    }

    // Process each email group
    for (const [email, sessions] of Object.entries(sessionsByEmail)) {
      console.log(`🔍 Processing ${sessions.length} sessions for email: ${email}`);

      // Find user by email
      const user = await findUserByEmail(email);

      if (!user) {
        console.log(`⚠️ No user found for email: ${email}`);
        results.push({ email, sessions: sessions.length, status: 'no_user_found' });
        continue;
      }

      console.log(`✅ Found user ${user.id} for email: ${email}`);

      // Link all sessions for this email to the user
      const sessionIds = sessions.map(s => s.id);
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ user_id: user.id })
        .in('id', sessionIds);

      if (updateError) {
        console.error(`❌ Error linking sessions for ${email}:`, updateError);
        results.push({ email, sessions: sessions.length, status: 'error', error: updateError.message });
      } else {
        console.log(`✅ Successfully linked ${sessions.length} sessions for ${email}`);
        linkedCount += sessions.length;
        results.push({ email, sessions: sessions.length, status: 'linked', userId: user.id });
      }
    }

    console.log(`🎉 Bulk linking complete! Linked ${linkedCount} sessions total`);

    return NextResponse.json({
      message: `Successfully linked ${linkedCount} sessions`,
      linked: linkedCount,
      totalProcessed: unlinkedSessions.length,
      results
    });

  } catch (err) {
    console.error('💥 Linking error:', err);
    return NextResponse.json({ error: 'Server error during linking' }, { status: 500 });
  }
}
