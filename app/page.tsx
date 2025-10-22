'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // Timeout 2 saniye (daha hızlı)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      );
      
      const sessionPromise = supabase.auth.getSession();
      
      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
      
      if (session?.user) {
        setUser(session.user);
        
        // Kullanıcı rolünü kontrol et
        const isOwner = session.user.email === 'furkanaydemirie@gmail.com';
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('auth_user_id', session.user.id)
          .single();
        
        if (isOwner) {
          setUserRole('owner');
        } else if (profile?.role === 'business_owner') {
          setUserRole('business_owner');
        } else if (profile?.role === 'staff') {
          setUserRole('staff');
        } else {
          setUserRole('customer');
        }
      }
    } catch (error) {
      // Hata olsa da devam et
      console.log('Session check:', error instanceof Error ? error.message : 'failed');
    } finally {
      // Her durumda loading'i bitir  
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-emerald-700">📅 RezApp</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-gray-600">Hoş geldin, {user.email}</span>
                  {/* Owner ve Business Owner için Admin Panel */}
                  {(userRole === 'owner' || userRole === 'business_owner') && (
                    <Link 
                      href="/admin" 
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all duration-200 shadow-sm"
                    >
                      Yönetim Paneli
                    </Link>
                  )}
                  {/* Staff için Takvim */}
                  {userRole === 'staff' && (
                    <Link 
                      href="/staff" 
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all duration-200 shadow-sm"
                    >
                      Takvim
                    </Link>
                  )}
                  <Link 
                    href="/debug" 
                    className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors"
                  >
                    🔍 Debug
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Çıkış
                  </button>
                </>
              ) : (
                <Link 
                  href="/login" 
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all duration-200 shadow-sm"
                >
                  Giriş Yap
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Role-based başlık */}
          {userRole === 'owner' || userRole === 'business_owner' ? (
            <>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
                Yönetim Paneli
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                İşletmenizi yönetin, randevuları takip edin ve personellerinizi organize edin.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/admin" 
                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Yönetim Paneli
                </Link>
                <Link 
                  href="/admin/availability" 
                  className="bg-teal-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Müsaitlik Yönetimi
                </Link>
                <Link 
                  href="/book" 
                  className="bg-cyan-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Randevu Al
                </Link>
              </div>
            </>
          ) : userRole === 'staff' ? (
            <>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
                Personel Paneli
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Randevularınızı görüntüleyin, müsaitlik durumunuzu yönetin veya randevu alın.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/staff" 
                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Takvim
                </Link>
                <Link 
                  href="/book" 
                  className="bg-teal-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Randevu Al
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
                Kolay Randevu Alma
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                İstediğiniz hizmeti seçin, yakınınızdaki işletmeleri bulun ve 
                kolayca randevunuzu alın. Artık telefon aramaya gerek yok!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/book" 
                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Hemen Randevu Al
                </Link>
                <Link 
                  href="/map" 
                  className="bg-teal-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  🗺️ Haritada Gör
                </Link>
                <Link 
                  href="/customer-appointments" 
                  className="bg-cyan-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  📋 Randevu Geçmişim
                </Link>
              </div>
              
              {/* İşletme Sahipleri İçin */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-gray-600 mb-4">İşletme sahibi misiniz?</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    href="/login" 
                    className="bg-white text-emerald-600 px-6 py-2 rounded-lg text-base font-medium border-2 border-emerald-300 hover:bg-emerald-50 transition-all duration-200"
                  >
                    Giriş Yap
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Features - Sadece end user için göster */}
        {!userRole && (
          <>
            <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-emerald-100">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">7/24 Randevu</h3>
                <p className="text-gray-600">İstediğiniz zaman, istediğiniz yerden randevu alın</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-emerald-100">
                <div className="text-4xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Yakınınızda Bulun</h3>
                <p className="text-gray-600">Haritada işletmeleri görün, en yakınını seçin</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-emerald-100">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Hızlı ve Kolay</h3>
                <p className="text-gray-600">Sadece birkaç tıklama ile randevunuz hazır</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-emerald-100">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Telefon Yok</h3>
                <p className="text-gray-600">Artık telefon aramaya gerek yok, online alın</p>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-20 text-center">
              <div className="bg-white rounded-xl p-8 shadow-xl border border-emerald-100">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Hemen Randevunuzu Alın
                </h2>
                <p className="text-gray-600 mb-6">
                  Berber, kuaför, güzellik salonu... Hangi hizmeti arıyorsanız, 
                  yakınınızdaki en iyi işletmeleri bulun ve randevunuzu alın.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    href="/book" 
                    className="bg-emerald-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Randevu Al
                  </Link>
                  <Link 
                    href="/map" 
                    className="bg-teal-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Haritada Gör
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">📅 RezApp</h3>
              <p className="text-gray-300 text-sm">
                Kolay randevu alma ve yönetim platformu
              </p>
            </div>
            
            <div>
              <h4 className="text-md font-semibold mb-4">Hızlı Linkler</h4>
              <div className="space-y-2">
                <Link href="/book" className="block text-gray-300 hover:text-white text-sm transition-colors">
                  Randevu Al
                </Link>
                <Link href="/map" className="block text-gray-300 hover:text-white text-sm transition-colors">
                  Harita
                </Link>
                <Link href="/login" className="block text-gray-300 hover:text-white text-sm transition-colors">
                  Giriş Yap
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-semibold mb-4">Yasal</h4>
              <div className="space-y-2">
                <Link href="/kvkk" className="block text-gray-300 hover:text-white text-sm transition-colors">
                  KVKK Aydınlatma Metni
                </Link>
                <Link href="/etk" className="block text-gray-300 hover:text-white text-sm transition-colors">
                  ETK Aydınlatma Metni
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-6 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 RezApp. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}