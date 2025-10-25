import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { email, password = '123456' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email gerekli' },
        { status: 400 }
      );
    }

    console.log('Making business owner:', email);
    console.log('Supabase URL:', 'https://sbityfrhgfqhebssljtk.supabase.co');

    // Önce profiles tablosunda var mı kontrol et
    let existingProfile, profileError;
    try {
      const result = await supabaseAdmin
        .from('profiles')
        .select('id, auth_user_id, role')
        .eq('email', email)
        .maybeSingle();
      
      existingProfile = result.data;
      profileError = result.error;
      
      console.log('Query result:', { existingProfile, profileError });
    } catch (err) {
      console.error('Query exception:', err);
      return NextResponse.json(
        { error: 'Profil kontrol edilemedi: ' + (err as Error).message },
        { status: 500 }
      );
    }

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile check error:', profileError);
      return NextResponse.json(
        { error: 'Profil kontrol edilemedi: ' + profileError.message },
        { status: 500 }
      );
    }

    if (!existingProfile) {
      // Profil yoksa, kullanıcının önce kayıt olması gerekiyor
      return NextResponse.json({
        error: 'Bu email adresi sistemde kayıtlı değil. Lütfen önce /login sayfasından "Kayıt Ol" ile hesap oluşturun (Şifre: ' + password + ')'
      }, { status: 400 });
    }

    // Profil varsa, business_owner yap
    console.log('Updating profile to business_owner');
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'business_owner',
        business_id: null
      })
      .eq('email', email);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Profil güncellenemedi: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla business owner yapıldı!'
    });

  } catch (error) {
    console.error('Business owner creation error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

