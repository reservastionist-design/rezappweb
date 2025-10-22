import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

// GET - Tüm businesses (owner için) veya super admin'in businesses'leri
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

    // User profile'ını al
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, id')
      .eq('auth_user_id', user.id)
      .single();

    // Owner ise tüm businesses'leri getir
    if (profile?.role === 'owner' || user.email === 'furkanaydemirie@gmail.com') {
      const { data: businesses, error } = await supabaseAdmin
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data: businesses });
    }

    // Super admin ise sadece kendi businesses'lerini getir
    if (profile?.role === 'super_admin') {
      const { data: businesses, error } = await supabaseAdmin
        .from('business_admins')
        .select('business_id, businesses(*)')
        .eq('admin_id', profile.id);

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      const businessList = businesses?.map(ba => ba.businesses) || [];
      return NextResponse.json({ success: true, data: businessList });
    }

    return NextResponse.json({ success: true, data: [] });

  } catch (error: any) {
    console.error('Get businesses error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Yeni business oluştur (sadece owner)
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
      .select('role, id')
      .eq('auth_user_id', user.id)
      .single();

    if (profile?.role !== 'owner' && user.email !== 'furkanaydemirie@gmail.com') {
      return NextResponse.json(
        { success: false, error: 'Only owner can create businesses' },
        { status: 403 }
      );
    }

    const { name, slug, description, address, city, district, phone, email } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Business oluştur
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .insert({
        name,
        slug,
        description,
        address,
        city,
        district,
        phone,
        email,
        owner_id: profile?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Business creation error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Business başarıyla oluşturuldu!',
      data: data
    });

  } catch (error: any) {
    console.error('Business API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Business sil (sadece owner)
export async function DELETE(request: NextRequest) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID gerekli' },
        { status: 400 }
      );
    }

    // Owner kontrolü
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('auth_user_id', session.user.id)
      .single();

    if (profile?.role !== 'owner' && session.user.email !== 'furkanaydemirie@gmail.com') {
      return NextResponse.json(
        { success: false, error: 'Only owner can delete businesses' },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin
      .from('businesses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Business deletion error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Business başarıyla silindi!'
    });

  } catch (error: any) {
    console.error('Business delete API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

