import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { full_name, email, role, business_id } = await request.json();

    if (!full_name || !email) {
      return NextResponse.json(
        { success: false, error: 'Ad Soyad ve Email gerekli' },
        { status: 400 }
      );
    }

    // RLS bypass için supabaseAdmin kullan
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        full_name,
        email,
        role: role || 'staff',
        business_id: business_id || null // Business ID ekle
      })
      .select()
      .single();

    if (error) {
      console.error('Staff creation error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Personel başarıyla eklendi!',
      data: data
    });

  } catch (error: any) {
    console.error('Staff API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID gerekli' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Staff deletion error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Personel başarıyla silindi!'
    });

  } catch (error: any) {
    console.error('Staff delete API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

