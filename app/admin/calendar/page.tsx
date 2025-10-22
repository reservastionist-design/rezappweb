'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminCalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAndLoadAppointments();
  }, []);

  const checkAdminAndLoadAppointments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Admin kontrolü
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('auth_user_id', session.user.id)
        .single();

      // Owner, super_admin veya admin kontrolü
      const isOwner = session.user.email === 'furkanaydemirie@gmail.com';
      const isTestUser = session.user.id === '59569b53-792e-4a10-8d28-a2625d96104b';
      const isAuthorized = isOwner || profile?.role === 'super_admin' || profile?.role === 'admin' || isTestUser;

      if (!isAuthorized) {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      await loadAppointments();
    } catch (e) {
      console.log('Admin check error:', e);
      router.push('/login');
    }
  };

  const loadAppointments = async () => {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          services (
            name,
            duration_minutes,
            price_cents,
            business_id
          ),
          businesses (
            name,
            district
          )
        `);

      // Super admin ise sadece kendi işletmesinin randevularını göster
      if (user?.email !== 'furkanaydemirie@gmail.com') {
        // Super admin'in işletmesini bul
        const { data: businessAdmin } = await supabase
          .from('business_admins')
          .select('business_id')
          .eq('email', user?.email)
          .single();

        if (businessAdmin?.business_id) {
          // Services tablosundan business_id'ye göre filtrele
          query = query.eq('services.business_id', businessAdmin.business_id);
        } else {
          // Super admin değilse boş liste döndür
          setAppointments([]);
          setLoading(false);
          return;
        }
      }

      const { data: appointments, error } = await query
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) {
        console.error('Appointments yüklenemedi:', error);
        return;
      }

      setAppointments(appointments || []);
    } catch (error) {
      console.error('Appointments yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Boş günler (önceki ay)
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getAppointmentsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.appointment_date === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return '✅';
      case 'pending': return '⏳';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Onaylandı';
      case 'pending': return 'Beklemede';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return 'Bilinmiyor';
    }
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const days = getDaysInMonth(currentDate);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Takvim</h1>
              <p className="text-gray-600">Randevu takvimini görüntüle</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin" 
                className="text-gray-600 hover:text-gray-900"
              >
                ← Admin Panel
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Calendar Navigation */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                ←
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {days.map((day, index) => {
                const dayAppointments = getAppointmentsForDate(day);
                const isToday = day && day.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={index}
                    className={`min-h-[140px] p-2 border border-gray-200 ${
                      day ? 'bg-white' : 'bg-gray-50'
                    } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${
                          isToday ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 3).map(appointment => (
                            <div
                              key={appointment.id}
                              className={`text-xs p-2 rounded border cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(appointment.status)}`}
                              title={`${appointment.customer_name} - ${appointment.services?.name || 'Hizmet'} - ${getStatusText(appointment.status)}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{appointment.appointment_time}</span>
                                <span className="text-xs">{getStatusIcon(appointment.status)}</span>
                              </div>
                              <div className="truncate font-medium">{appointment.customer_name}</div>
                              <div className="truncate text-gray-600">{appointment.services?.name || 'Hizmet'}</div>
                              {appointment.businesses?.name && (
                                <div className="truncate text-gray-500 text-xs">🏢 {appointment.businesses.name}</div>
                              )}
                            </div>
                          ))}
                          {dayAppointments.length > 3 && (
                            <div className="text-xs text-gray-500 bg-gray-100 p-1 rounded text-center">
                              +{dayAppointments.length - 3} daha
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📅 Randevu Durumları</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <span className="text-lg">✅</span>
                <div>
                  <div className="font-medium text-green-800">Onaylandı</div>
                  <div className="text-xs text-green-600">Randevu onaylandı</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <span className="text-lg">⏳</span>
                <div>
                  <div className="font-medium text-yellow-800">Beklemede</div>
                  <div className="text-xs text-yellow-600">Onay bekliyor</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <span className="text-lg">✅</span>
                <div>
                  <div className="font-medium text-blue-800">Tamamlandı</div>
                  <div className="text-xs text-blue-600">Hizmet verildi</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <span className="text-lg">❌</span>
                <div>
                  <div className="font-medium text-red-800">İptal Edildi</div>
                  <div className="text-xs text-red-600">Randevu iptal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}