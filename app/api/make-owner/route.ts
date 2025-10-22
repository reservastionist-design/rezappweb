import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const ownerEmail = 'furkanaydemirie@gmail.com';
    
    // Owner profilini oluştur veya güncelle
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', ownerEmail)
      .single();

    if (existingProfile) {
      // Mevcut profili owner yap
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'owner' })
        .eq('email', ownerEmail)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${ownerEmail} başarıyla owner yapıldı!`,
        data: data
      });
    } else {
      // Yeni profil oluştur
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert({
          email: ownerEmail,
          full_name: 'Furkan Aydemir',
          role: 'owner'
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${ownerEmail} için owner profili oluşturuldu!`,
        data: data
      });
    }

  } catch (error) {
    console.error('Make owner error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

