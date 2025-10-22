'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [userBusinessId, setUserBusinessId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    businesses: 0,
    services: 0,
    staff: 0,
    appointments: 0
  });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

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
        await loadStats(true, null);
        await loadAppointments(true, null);
        return;
      }
      
      // Business owner kontrolü
      console.log('🔍 Checking business owner for user:', session.user.email, 'ID:', session.user.id);
      
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role, business_id')
        .eq('auth_user_id', session.user.id)
        .single();
      
      console.log('🔍 Profile query result:', { profile, profileError });
      
      const isBusinessOwner = profile?.role === 'business_owner';
      
      console.log('🔍 User check - isOwner:', isOwnerCheck, 'isBusinessOwner:', isBusinessOwner, 'profile:', profile);
      console.log('🔍 Profile error:', profileError);
      console.log('🔍 Session user:', session.user);
      
      if (!isBusinessOwner) {
        router.push('/');
        return;
      }

      // Business owner için data yükle
      console.log('Setting userBusinessId:', profile.business_id);
      setUserBusinessId(profile.business_id);
      await loadStats(false, profile.business_id);
      await loadAppointments(false, profile.business_id);
    } catch (error) {
      console.error('User check error:', error);
      setError('Kullanıcı bilgileri yüklenirken hata oluştu: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (isOwnerParam?: boolean, userBusinessIdParam?: string | null) => {
    try {
      const actualIsOwner = isOwnerParam !== undefined ? isOwnerParam : isOwner;
      const actualUserBusinessId = userBusinessIdParam !== undefined ? userBusinessIdParam : userBusinessId;
      
      console.log('Loading stats - isOwner:', actualIsOwner, 'userBusinessId:', actualUserBusinessId);
      
      let businessCount = 0;
      let serviceCount = 0;
      let staffCount = 0;
      let appointmentCount = 0;

      if (actualIsOwner) {
        // Owner tüm verileri görebilir - supabaseAdmin kullan
        console.log('Loading stats for Owner...');
        
        const { count: businesses, error: businessesError } = await supabaseAdmin
          .from('businesses')
          .select('*', { count: 'exact', head: true });
        console.log('Businesses count:', businesses, 'Error:', businessesError);
        businessCount = businesses || 0;

        const { count: services, error: servicesError } = await supabaseAdmin
          .from('services')
          .select('*', { count: 'exact', head: true });
        console.log('Services count:', services, 'Error:', servicesError);
        serviceCount = services || 0;

        const { count: staff, error: staffError } = await supabaseAdmin
          .from('staff')
          .select('*', { count: 'exact', head: true });
        console.log('Staff count:', staff, 'Error:', staffError);
        staffCount = staff || 0;

        const { count: appointments, error: appointmentsError } = await supabaseAdmin
          .from('appointments')
          .select('*', { count: 'exact', head: true });
        console.log('Appointments count:', appointments, 'Error:', appointmentsError);
        appointmentCount = appointments || 0;
      } else if (actualUserBusinessId) {
        // Business owner sadece kendi işletmesini görebilir
        console.log('Loading stats for Business Owner with business_id:', actualUserBusinessId);
        businessCount = 1;

        const { count: services, error: servicesError } = await supabaseAdmin
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', actualUserBusinessId);
        console.log('Services count for business:', services, 'Error:', servicesError);
        serviceCount = services || 0;

        const { count: staff, error: staffError } = await supabaseAdmin
          .from('staff')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', actualUserBusinessId);
        console.log('Staff count for business:', staff, 'Error:', staffError);
        staffCount = staff || 0;

        // Business owner için randevu sayısını services üzerinden hesapla
        const { data: userServices } = await supabaseAdmin
          .from('services')
          .select('id')
          .eq('business_id', actualUserBusinessId);
        
        if (userServices && userServices.length > 0) {
          const serviceIds = userServices.map(s => s.id);
          const { count: appointments } = await supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .in('service_id', serviceIds);
          appointmentCount = appointments || 0;
        } else {
          appointmentCount = 0;
        }
      }

      const finalStats = {
        businesses: businessCount,
        services: serviceCount,
        staff: staffCount,
        appointments: appointmentCount
      };
      
      console.log('Final stats being set:', finalStats);
      setStats(finalStats);
    } catch (error) {
      console.error('Stats load error:', error);
    }
  };

  const loadAppointments = async (isOwnerParam?: boolean, userBusinessIdParam?: string | null) => {
    try {
      const actualIsOwner = isOwnerParam !== undefined ? isOwnerParam : isOwner;
      const actualUserBusinessId = userBusinessIdParam !== undefined ? userBusinessIdParam : userBusinessId;
      
      console.log('Loading appointments - isOwner:', actualIsOwner, 'userBusinessId:', actualUserBusinessId);
      
      // Her durumda supabaseAdmin kullan (RLS bypass için)
      let query = supabaseAdmin
        .from('appointments')
        .select(`
          *,
          services (
            name,
            businesses (
              name
            )
          )
        `)
        .order('appointment_date', { ascending: true });

      // Business owner ise sadece kendi işletmesinin randevularını göster
      if (!actualIsOwner && actualUserBusinessId) {
        console.log('🔍 Business owner randevu yükleme - business_id:', actualUserBusinessId);
        
        // Önce kendi işletmesinin hizmetlerini al
        const { data: userServices, error: servicesError } = await supabaseAdmin
          .from('services')
          .select('id, name')
          .eq('business_id', actualUserBusinessId);
        
        console.log('🔍 User services:', userServices, 'Error:', servicesError);
        
        if (userServices && userServices.length > 0) {
          const serviceIds = userServices.map(s => s.id);
          console.log('🔍 Service IDs for filtering:', serviceIds);
          query = query.in('service_id', serviceIds);
        } else {
          console.log('🔍 No services found, setting service_id to null');
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
      console.log('🔍 setAppointments called with:', appointments?.length || 0, 'items');
    } catch (error) {
      console.error('Appointments load error:', error);
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
    
    // Boş günler
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Haftalık takvim için yeni fonksiyonlar
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    return startOfWeek;
  });

  const getWeekDays = (startDate: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const goToPreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const goToNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    setCurrentWeekStart(startOfWeek);
  };

  const getAppointmentsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateString = date.toISOString().split('T')[0];
    console.log('🔍 getAppointmentsForDate - Date:', dateString, 'Total appointments:', appointments.length);
    console.log('🔍 All appointment dates:', appointments.map(apt => apt.appointment_date));
    const filteredAppointments = appointments.filter(apt => apt.appointment_date === dateString);
    console.log('🔍 Filtered appointments for', dateString, ':', filteredAppointments.length);
    if (filteredAppointments.length > 0) {
      console.log('🔍 Found appointments:', filteredAppointments);
    }
    return filteredAppointments;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const testSupabaseConnection = async () => {
    try {
      setDebugInfo('Testing Supabase connection...');
      
      // Test basic connection - supabaseAdmin kullan
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, role')
        .limit(3);
      
      if (profilesError) {
        setDebugInfo(`Profiles error: ${profilesError.message}`);
        return;
      }
      
      // Test businesses
      const { data: businesses, error: businessesError } = await supabaseAdmin
        .from('businesses')
        .select('id, name')
        .limit(3);
      
      if (businessesError) {
        setDebugInfo(`Businesses error: ${businessesError.message}`);
        return;
      }
      
      // Test services
      const { data: services, error: servicesError } = await supabaseAdmin
        .from('services')
        .select('id, name')
        .limit(3);
      
      if (servicesError) {
        setDebugInfo(`Services error: ${servicesError.message}`);
        return;
      }
      
      // Test staff
      const { data: staff, error: staffError } = await supabaseAdmin
        .from('staff')
        .select('id, name')
        .limit(3);
      
      if (staffError) {
        setDebugInfo(`Staff error: ${staffError.message}`);
        return;
      }
      
      // Test appointments - use supabaseAdmin to bypass RLS
      const { data: appointments, error: appointmentsError } = await supabaseAdmin
        .from('appointments')
        .select('id, customer_name, appointment_date, appointment_time, status')
        .limit(3);
      
      if (appointmentsError) {
        setDebugInfo(`Appointments error: ${appointmentsError.message}`);
        return;
      }
      
      // Business owner için özel test
      if (!isOwner && userBusinessId) {
        setDebugInfo(`✅ Connection OK! Profiles: ${profiles?.length || 0}, Businesses: ${businesses?.length || 0}, Services: ${services?.length || 0}, Staff: ${staff?.length || 0}, Appointments: ${appointments?.length || 0}\n\n🔍 Business Owner Debug:\n- User Business ID: ${userBusinessId}\n- Is Owner: ${isOwner}\n- User Email: ${user?.email}`);
      } else {
        setDebugInfo(`✅ Connection OK! Profiles: ${profiles?.length || 0}, Businesses: ${businesses?.length || 0}, Services: ${services?.length || 0}, Staff: ${staff?.length || 0}, Appointments: ${appointments?.length || 0}`);
      }
      
    } catch (error) {
      setDebugInfo(`❌ Connection failed: ${(error as Error).message}`);
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
                onClick={handleLogout}
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
            <Link href="/admin" className="border-b-2 border-slate-600 text-slate-600 py-4 font-medium whitespace-nowrap text-sm sm:text-base">
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
            <Link href="/admin/availability" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200 whitespace-nowrap text-sm sm:text-base">
              Müsaitlik
            </Link>
            <Link href="/admin/appointments" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200 whitespace-nowrap text-sm sm:text-base">
              Randevular
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
          <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-600">Sisteminizin genel durumu</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Hata</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug Section - Removed for production */}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🏢</div>
              <div>
                <p className="text-sm font-medium text-slate-600">İşletmeler</p>
                <p className="text-2xl font-bold text-slate-800">{stats.businesses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🔧</div>
              <div>
                <p className="text-sm font-medium text-slate-600">Hizmetler</p>
                <p className="text-2xl font-bold text-slate-800">{stats.services}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="text-3xl mr-4">👥</div>
              <div>
                <p className="text-sm font-medium text-slate-600">Personel</p>
                <p className="text-2xl font-bold text-slate-800">{stats.staff}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📅</div>
              <div>
                <p className="text-sm font-medium text-slate-600">Randevular</p>
                <p className="text-2xl font-bold text-slate-800">{stats.appointments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Calendar */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800">📅 Haftalık Randevu Takvimi</h3>
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  onClick={goToPreviousWeek}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200 text-lg sm:text-base"
                >
                  ←
                </button>
                <button
                  onClick={goToCurrentWeek}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors duration-200 whitespace-nowrap"
                >
                  Bu Hafta
                </button>
                <span className="font-medium text-slate-800 text-xs sm:text-base text-center min-w-[120px] sm:min-w-[200px]">
                  {currentWeekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <button
                  onClick={goToNextWeek}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200 text-lg sm:text-base"
                >
                  →
                </button>
              </div>
            </div>

            {/* Weekly Calendar Grid */}
            <div className="hidden sm:grid grid-cols-7 gap-1 mb-4">
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-slate-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Mobile: Horizontal scroll for calendar */}
            <div className="sm:hidden overflow-x-auto mb-4">
              <div className="flex gap-2 min-w-max pb-2">
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                  <div key={day} className="min-w-[100px] text-center text-xs font-medium text-slate-500">
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: Grid layout */}
            <div className="hidden sm:grid grid-cols-7 gap-1">
              {getWeekDays(currentWeekStart).map((day, index) => {
                const dayAppointments = getAppointmentsForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={index}
                    className={`min-h-[140px] p-3 border-2 rounded-lg transition-all duration-200 ${
                      isToday ? 'bg-emerald-50 border-emerald-400 shadow-md' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-2 flex items-center justify-between ${
                      isToday ? 'text-emerald-700' : 'text-slate-800'
                    }`}>
                      <span>{day.getDate()}</span>
                      {dayAppointments.length > 0 && (
                        <span className="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-normal">
                          {dayAppointments.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {dayAppointments.length > 0 ? (
                        dayAppointments.map(appointment => (
                          <div
                            key={appointment.id}
                            className={`text-xs p-2 rounded-lg transition-all duration-200 hover:shadow-sm cursor-pointer ${getStatusColor(appointment.status)}`}
                            title={`${appointment.customer_name} - ${appointment.services?.name || 'Hizmet'} - ${appointment.services?.businesses?.name || 'İşletme'}`}
                          >
                            <div className="font-medium mb-1">{appointment.appointment_time}</div>
                            <div className="text-slate-700 truncate">{appointment.customer_name}</div>
                            <div className="text-slate-500 text-[10px] truncate mt-1">
                              {appointment.services?.businesses?.name || 'İşletme'}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 italic">Randevu yok</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile: Horizontal scroll layout */}
            <div className="sm:hidden overflow-x-auto">
              <div className="flex gap-2 min-w-max pb-4">
                {getWeekDays(currentWeekStart).map((day, index) => {
                  const dayAppointments = getAppointmentsForDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  
                  return (
                    <div
                      key={index}
                      className={`min-w-[140px] p-3 border-2 rounded-lg ${
                        isToday ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className={`text-sm font-semibold mb-2 ${
                        isToday ? 'text-emerald-700' : 'text-slate-800'
                      }`}>
                        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][index]} {day.getDate()}
                        {dayAppointments.length > 0 && (
                          <span className="ml-1 text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                            {dayAppointments.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {dayAppointments.length > 0 ? (
                          dayAppointments.map(appointment => (
                            <div
                              key={appointment.id}
                              className={`text-xs p-2 rounded-lg ${getStatusColor(appointment.status)}`}
                            >
                              <div className="font-medium mb-1">{appointment.appointment_time}</div>
                              <div className="text-slate-700">{appointment.customer_name}</div>
                              <div className="text-slate-500 text-[10px] mt-1">
                                {appointment.services?.businesses?.name || 'İşletme'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-400 italic">Randevu yok</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Debug Info - Removed for production */}

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-medium text-slate-800 mb-2">Durum Açıklaması</h4>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                  <span>Onaylandı</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                  <span>Beklemede</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                  <span>Tamamlandı</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                  <span>İptal Edildi</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link 
            href="/admin/businesses" 
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 border border-slate-100"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">İşletmeler</h3>
              <p className="text-slate-600 text-sm">İşletmelerinizi yönetin</p>
            </div>
          </Link>

          <Link 
            href="/admin/services" 
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 border border-slate-100"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Hizmetler</h3>
              <p className="text-slate-600 text-sm">Hizmetlerinizi düzenleyin</p>
            </div>
          </Link>

          <Link 
            href="/admin/staff" 
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 border border-slate-100"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Personel</h3>
              <p className="text-slate-600 text-sm">Personel ekleyin</p>
            </div>
          </Link>

          <Link 
            href="/admin/appointments" 
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 border border-slate-100"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Randevular</h3>
              <p className="text-slate-600 text-sm">Randevuları görüntüleyin</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}