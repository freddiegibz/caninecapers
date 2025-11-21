import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    console.log('🔍 Debug: Checking user lookup functionality...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing Supabase configuration',
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }, { status: 500 });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Test user lookup
    const { data, error } = await adminClient.auth.admin.listUsers();

    if (error) {
      console.error('❌ Admin API error:', error);
      return NextResponse.json({
        error: 'Admin API failed',
        details: error.message,
        code: error.status
      }, { status: 500 });
    }

    const userCount = data.users.length;
    const sampleUsers = data.users.slice(0, 3).map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at
    }));

    console.log(`✅ Found ${userCount} users in system`);

    // Test session lookup
    const { data: sessions, error: sessionError } = await adminClient
      .from('sessions')
      .select('id, client_email, user_id, status')
      .limit(5);

    return NextResponse.json({
      success: true,
      userLookupWorking: true,
      totalUsers: userCount,
      sampleUsers,
      sessionQueryWorking: !sessionError,
      sessionError: sessionError?.message,
      sampleSessions: sessions?.slice(0, 3)
    });

  } catch (err) {
    console.error('💥 Debug error:', err);
    return NextResponse.json({
      error: 'Unexpected error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
