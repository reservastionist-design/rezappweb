import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

// POST - Super admin'i business'e ata (sadece owner)
export async function POST(request: NextRequest) {
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
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    if (profile?.role !== 'owner' && user.email !== 'furkanaydemirie@gmail.com') {
      return NextResponse.json(
        { success: false, error: 'Only owner can assign admins to businesses' },
        { status: 403 }
      );
    }

    const { business_id, admin_id } = await request.json();

    if (!business_id || !admin_id) {
      return NextResponse.json(
        { success: false, error: 'Business ID and Admin ID are required' },
        { status: 400 }
      );
    }

    // Önce mevcut atamayı kontrol et
    const { data: existingAssignment } = await supabaseAdmin
      .from('business_admins')
      .select('id')
      .eq('business_id', business_id)
      .eq('admin_id', admin_id)
      .maybeSingle();

    if (existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Bu admin zaten bu işletmeye atanmış!' },
        { status: 400 }
      );
    }

    // İlişkiyi oluştur
    const { data, error } = await supabaseAdmin
      .from('business_admins')
      .insert({
        business_id,
        admin_id
      })
      .select()
      .single();

    if (error) {
      console.error('Business-admin assignment error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin başarıyla business\'e atandı!',
      data: data
    });

  } catch (error: any) {
    console.error('Business-admin API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Super admin'i business'ten çıkar (sadece owner)
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const business_id = searchParams.get('business_id');
    const admin_id = searchParams.get('admin_id');

    if (!business_id || !admin_id) {
      return NextResponse.json(
        { success: false, error: 'Business ID and Admin ID are required' },
        { status: 400 }
      );
    }

    // Owner kontrolü
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    if (profile?.role !== 'owner' && user.email !== 'furkanaydemirie@gmail.com') {
      return NextResponse.json(
        { success: false, error: 'Only owner can remove admins from businesses' },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin
      .from('business_admins')
      .delete()
      .eq('business_id', business_id)
      .eq('admin_id', admin_id);

    if (error) {
      console.error('Business-admin removal error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin business\'ten çıkarıldı!'
    });

  } catch (error: any) {
    console.error('Business-admin delete API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

