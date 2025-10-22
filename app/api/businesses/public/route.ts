import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Tüm businesses (public, authentication gerektirmez)
export async function GET(request: NextRequest) {
  try {
    // Public endpoint - herkes erişebilir
    const { data: businesses, error } = await supabaseAdmin
      .from('businesses')
      .select(`
        id, 
        name, 
        address, 
        phone, 
        email,
        services (
          id,
          name,
          duration_minutes,
          price_cents
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get public businesses error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      businesses: businesses || [] 
    });

  } catch (error: any) {
    console.error('Public businesses API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
