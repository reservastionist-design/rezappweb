import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

// GET - Super admin'leri listele (sadece owner için)
export async function GET(request: NextRequest) {
  try {
    // Authorization header'dan token al
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Token'ı verify et
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Owner kontrolü
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, id')
      .eq('auth_user_id', user.id)
      .single();

    const isOwner = user.email === 'furkanaydemirie@gmail.com' || profile?.role === 'owner';

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Only owner can view super admins' },
        { status: 403 }
      );
    }

    // Super admin'leri getir (RLS bypass için supabaseAdmin kullan)
    const { data: superAdmins, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, created_at')
      .eq('role', 'super_admin')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching super admins:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: superAdmins || [] });

  } catch (error: any) {
    console.error('Super admins API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

