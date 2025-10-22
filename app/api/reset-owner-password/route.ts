import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const ownerEmail = 'furkanaydemirie@gmail.com';
    
    // Auth kullanıcısını bul
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      return NextResponse.json(
        { success: false, error: listError.message },
        { status: 500 }
      );
    }

    const ownerUser = users.find(u => u.email === ownerEmail);

    if (!ownerUser) {
      // Kullanıcı yoksa oluştur
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ownerEmail,
        password: '123456',
        email_confirm: true
      });

      if (createError) {
        return NextResponse.json(
          { success: false, error: createError.message },
          { status: 500 }
        );
      }

      // Profile oluştur
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          auth_user_id: newUser.user.id,
          email: ownerEmail,
          full_name: 'Furkan Aydemir',
          role: 'owner'
        });

      if (profileError) {
        return NextResponse.json(
          { success: false, error: profileError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${ownerEmail} kullanıcısı oluşturuldu ve şifre 123456 olarak ayarlandı!`,
        userId: newUser.user.id
      });
    } else {
      // Mevcut kullanıcının şifresini güncelle
      const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        ownerUser.id,
        { password: '123456' }
      );

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      // Profile'ı owner yap (yoksa oluştur)
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('auth_user_id', ownerUser.id)
        .single();

      if (existingProfile) {
        await supabaseAdmin
          .from('profiles')
          .update({ role: 'owner' })
          .eq('auth_user_id', ownerUser.id);
      } else {
        await supabaseAdmin
          .from('profiles')
          .insert({
            auth_user_id: ownerUser.id,
            email: ownerEmail,
            full_name: 'Furkan Aydemir',
            role: 'owner'
          });
      }

      return NextResponse.json({
        success: true,
        message: `${ownerEmail} şifresi 123456 olarak güncellendi ve owner yapıldı!`,
        userId: ownerUser.id
      });
    }

  } catch (error) {
    console.error('Reset owner password error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

