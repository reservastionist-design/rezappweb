'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminAppointmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [userBusinessId, setUserBusinessId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Owner kontrolü - sadece owner ve super adminler erişebilir
      const isOwnerCheck = session.user.email === 'furkanaydemirie@gmail.com';
      setIsOwner(isOwnerCheck);
      
      // Owner ise direkt erişim ver
      if (isOwnerCheck) {
        await loadAppointments(true, null);
        return;
      }
      
      // Business owner kontrolü
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, business_id')
        .eq('auth_user_id', session.user.id)
        .single();
      
      const isBusinessOwner = profile?.role === 'business_owner';
      
      console.log('🔍 Appointments page - User check - isOwner:', isOwnerCheck, 'isBusinessOwner:', isBusinessOwner, 'profile:', profile);
      console.log('🔍 Appointments page - Profile error:', profileError);
      
      if (!isBusinessOwner) {
        router.push('/');
        return;
      }

      // Business owner için data yükle
      console.log('🔍 Appointments page - Setting userBusinessId:', profile.business_id);
      
      // GÜVENLİK: Business ID kontrolü
      if (!profile.business_id) {
        console.error('Business owner has no business_id assigned!');
        setError('⚠️ Size henüz bir işletme atanmamış. Lütfen sistem yöneticisi ile iletişime geçin.');
        setLoading(false);
        return;
      }
      
      setUserBusinessId(profile.business_id);
      await loadAppointments(false, profile.business_id);
    } catch (error) {
      console.error('User check error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async (isOwnerParam?: boolean, userBusinessIdParam?: string | null) => {
    try {
      const actualIsOwner = isOwnerParam !== undefined ? isOwnerParam : isOwner;
      const actualUserBusinessId = userBusinessIdParam !== undefined ? userBusinessIdParam : userBusinessId;
      
      console.log('Loading appointments - isOwner:', actualIsOwner, 'userBusinessId:', actualUserBusinessId);
      
      // Her durumda supabase kullan (RLS bypass için)
      let query = supabase
        .from('appointments')
        .select(`
          *,
          services (
            name,
            duration_minutes,
            price_cents,
            businesses (
              name,
              district
            )
          )
        `)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      // Business owner ise sadece kendi işletmesinin randevularını göster
      if (!actualIsOwner && actualUserBusinessId) {
        console.log('🔍 Appointments page - Business owner randevu yükleme - business_id:', actualUserBusinessId);
        
        // Önce kendi işletmesinin hizmetlerini al (supabase kullan)
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('id, name')
          .eq('business_id', actualUserBusinessId);
        
        console.log('🔍 Appointments page - User services:', services, 'Error:', servicesError);
        
        if (services && services.length > 0) {
          const serviceIds = services.map(s => s.id);
          console.log('🔍 Appointments page - Service IDs for filtering:', serviceIds);
          query = query.in('service_id', serviceIds);
        } else {
          console.log('🔍 Appointments page - No services found, setting service_id to null');
          // Hizmet yoksa randevu da yok
          query = query.is('service_id', null);
        }
      }

      const { data: appointments, error } = await query;

      if (error) {
        console.error('Appointments load error:', error);
        return;
      }

      console.log('Appointments loaded:', appointments?.length || 0, 'appointments');
      console.log('Appointments data:', appointments);
      setAppointments(appointments || []);
    } catch (error) {
      console.error('Appointments load error:', error);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      setMessage('Randevu statüsü güncellendi!');
      
      // Randevuları yeniden yükle
      await loadAppointments(isOwner, userBusinessId);
    } catch (error) {
      console.error('Status update error:', error);
      setMessage('Hata: ' + error.message);
    }
  };


  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) {
        setMessage('Hata: ' + error.message);
        return;
      }

      setMessage('Randevu başarıyla silindi!');
      loadAppointments();
    } catch (error) {
      setMessage('Bir hata oluştu: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Onaylandı';
      case 'pending':
        return 'Beklemede';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  // GÜVENLİK: Eğer business owner'a işletme atanmamışsa
  if (error && !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erişim Engellendi</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-700">📅 RezApp Admin</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <span className="text-sm sm:text-base text-gray-600">Hoş geldin, {user?.email}</span>
              <Link 
                href="/" 
                className="bg-gray-200 text-gray-800 px-3 sm:px-4 py-2 rounded-md hover:bg-gray-300 transition-colors text-sm sm:text-base"
              >
                Ana Sayfa
              </Link>
              <button 
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                    router.push('/');
                  } catch (error) {
                    console.error('Logout error:', error);
                  }
                }}
                className="bg-emerald-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors text-sm sm:text-base"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
            <Link href="/admin" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200 whitespace-nowrap text-sm sm:text-base">
              Dashboard
            </Link>
            <Link href="/admin/businesses" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200 whitespace-nowrap text-sm sm:text-base">
              İşletmeler
            </Link>
            <Link href="/admin/services" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200 whitespace-nowrap text-sm sm:text-base">
              Hizmetler
            </Link>
            <Link href="/admin/staff" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200 whitespace-nowrap text-sm sm:text-base">
              Personel
            </Link>
            <Link href="/admin/appointments" className="border-b-2 border-slate-600 text-slate-600 py-4 font-medium whitespace-nowrap text-sm sm:text-base">
              Randevular
            </Link>
            <Link href="/admin/availability" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200 whitespace-nowrap text-sm sm:text-base">
              Müsaitlik
            </Link>
            {user?.email === 'furkanaydemirie@gmail.com' && (
              <Link href="/super-admin" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200 whitespace-nowrap text-sm sm:text-base">
                Business Owner Panel
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Randevular</h2>
          <p className="text-gray-600">Sistemdeki tüm randevular ({appointments.length})</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.includes('Hata') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}

        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Randevu Listesi ({appointments.length})</h3>
          </div>
          
          <div className="p-6">
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Henüz randevu yok</h3>
                <p className="text-gray-600">Müşteriler randevu aldığında burada görünecek.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <h4 className="font-semibold text-lg">{appointment.customer_name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusText(appointment.status)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={appointment.status}
                          onChange={(e) => updateAppointmentStatus(appointment.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="pending">Beklemede</option>
                          <option value="confirmed">Onaylandı</option>
                          <option value="completed">Tamamlandı</option>
                          <option value="cancelled">İptal Edildi</option>
                        </select>
                        <button 
                          onClick={() => deleteAppointment(appointment.id)}
                          className="text-red-600 hover:text-red-800 flex-shrink-0 p-1"
                          title="Sil"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="font-medium text-gray-900">📅 Tarih & Saat</p>
                        <p>{new Date(appointment.appointment_date).toLocaleDateString('tr-TR')}</p>
                        <p>{appointment.appointment_time}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">🔧 Hizmet</p>
                        <p>{appointment.services?.name || 'Bilinmeyen Hizmet'}</p>
                        <p>{appointment.services?.duration_minutes} dakika</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">🏢 İşletme</p>
                        <p>{appointment.services?.businesses?.name || 'Bilinmeyen İşletme'}</p>
                        <p>{appointment.services?.businesses?.district || 'Bilinmeyen İlçe'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">💰 Fiyat</p>
                        <p>{appointment.services?.price_cents ? (appointment.services.price_cents / 100) + ' TL' : 'Belirtilmemiş'}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="font-medium text-gray-900">📧 E-posta</p>
                          <p>{appointment.customer_email}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">📞 Telefon</p>
                          <p>{appointment.customer_phone}</p>
                        </div>
                      </div>
                      {appointment.notes && (
                        <div className="mt-3">
                          <p className="font-medium text-gray-900">📝 Notlar</p>
                          <p className="text-sm text-gray-600">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}