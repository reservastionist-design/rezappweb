import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email, createNew } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email gerekli' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking for email:', email);
    console.log('🔑 Using service key:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) + '...');

    // Mevcut profili kontrol et
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle(); // single() yerine maybeSingle() kullan - yoksa hata vermez
    
    console.log('📊 Query result:', { existingProfile, fetchError });

    if (existingProfile) {
      // Mevcut profili super admin yap
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('email', email)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${email} başarıyla super admin yapıldı!`,
        data: data
      });
    } else if (createNew) {
      // Yeni profil oluştur (RLS bypass için supabaseAdmin kullan)
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert({
          email: email,
          role: 'super_admin'
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${email} için super admin profili oluşturuldu!`,
        data: data
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı. Önce kayıt olması gerekiyor.' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Make super admin error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

