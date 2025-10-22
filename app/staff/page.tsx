'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function StaffPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [staffId, setStaffId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [showAvailability, setShowAvailability] = useState(false);
  const [staffServices, setStaffServices] = useState<any[]>([]);
  const [showBusyModal, setShowBusyModal] = useState(false);
  const [busySlot, setBusySlot] = useState({ date: '', time: '', duration: 60 });

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

      // Sadece staff erişebilir
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, staff_id')
        .eq('auth_user_id', session.user.id)
        .single();
      
      if (profile?.role !== 'staff') {
        router.push('/');
        return;
      }

      setStaffId(profile.staff_id);
      await loadAppointments();
      
      // Hizmet bilgilerini yükle
      const services = await loadStaffServices();
      setStaffServices(services || []);
    } catch (error) {
      console.error('User check error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      if (!staffId) return;

      const { data: appointments, error } = await supabase
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
        .eq('staff_id', staffId)
        .order('appointment_date', { ascending: true });

      if (error) {
        console.error('Appointments load error:', error);
        return;
      }

      setAppointments(appointments || []);
    } catch (error) {
      console.error('Appointments load error:', error);
    }
  };

  const loadStaffServices = async () => {
    try {
      if (!staffId) return;

      const { data: staffServices, error } = await supabase
        .from('staff_services')
        .select(`
          *,
          services (
            name
          )
        `)
        .eq('staff_id', staffId);

      if (error) {
        console.error('Staff services load error:', error);
        return [];
      }

      return staffServices || [];
    } catch (error) {
      console.error('Staff services load error:', error);
      return [];
    }
  };

  const loadAvailability = async () => {
    try {
      if (!staffId) return;

      const { data, error } = await supabase
        .from('staff_availability')
        .select('*')
        .eq('staff_id', staffId)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Availability load error:', error);
        return;
      }

      setAvailability(data || []);
    } catch (error) {
      console.error('Availability load error:', error);
    }
  };

  const addAvailability = async (dayOfWeek: number, startTime: string, endTime: string) => {
    if (!staffId) return;

    try {
      const { error } = await supabase
        .from('staff_availability')
        .insert({
          staff_id: staffId,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          is_active: true
        });

      if (error) throw error;

      loadAvailability();
    } catch (error) {
      console.error('Add availability error:', error);
      alert('Hata: ' + error.message);
    }
  };

  const toggleAvailability = async (availabilityId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('staff_availability')
        .update({ is_active: isActive })
        .eq('id', availabilityId);

      if (error) throw error;

      loadAvailability();
    } catch (error) {
      console.error('Toggle availability error:', error);
      alert('Hata: ' + error.message);
    }
  };

  const deleteAvailability = async (availabilityId: string) => {
    try {
      const { error } = await supabase
        .from('staff_availability')
        .delete()
        .eq('id', availabilityId);

      if (error) throw error;

      loadAvailability();
    } catch (error) {
      console.error('Delete availability error:', error);
      alert('Hata: ' + error.message);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[dayOfWeek];
  };

  // Create meşgul slot (block appointment)
  const createBusySlot = async () => {
    try {
      if (!staffId || !busySlot.date || !busySlot.time) {
        alert('Lütfen tarih ve saat seçin!');
        return;
      }

      const startTime = busySlot.time;
      const endTime = new Date(`2000-01-01T${startTime}`);
      endTime.setMinutes(endTime.getMinutes() + busySlot.duration);
      const endTimeStr = endTime.toTimeString().slice(0, 5);

      // Meşgul slot'u staff_availability olarak ekle (is_active: false)
      const { error } = await supabase
        .from('staff_availability')
        .insert({
          staff_id: staffId,
          day_of_week: new Date(busySlot.date).getDay(),
          start_time: startTime,
          end_time: endTimeStr,
          is_active: false // Meşgul slot
        });

      if (error) throw error;

      alert('Meşgul slot oluşturuldu! Bu saatte randevu alınamaz.');
      setShowBusyModal(false);
      setBusySlot({ date: '', time: '', duration: 60 });
      loadAvailability();
    } catch (error) {
      console.error('Create busy slot error:', error);
      alert('Hata: ' + error.message);
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

  const getAppointmentsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateString = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.appointment_date === dateString);
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
      newDate.setMonth(newDate.getMonth() + direction);
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
              <h1 className="text-xl sm:text-2xl font-bold text-slate-700">👨‍💼 Personel Paneli</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-sm sm:text-base text-gray-600">Hoş geldin, {user?.email}</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setShowAvailability(!showAvailability);
                    if (!showAvailability) loadAvailability();
                  }}
                  className="bg-emerald-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors text-sm sm:text-base"
                >
                  {showAvailability ? 'Takvim' : 'Müsaitlik Yönetimi'}
                </button>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hizmet Bilgileri */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">🎯 Sunduğum Hizmetler</h2>
            <div className="flex flex-wrap gap-2">
              {staffServices && staffServices.length > 0 ? (
                staffServices.map((staffService) => (
                  <span
                    key={staffService.id}
                    className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium"
                  >
                    {staffService.services?.name}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">Henüz hizmet atanmamış</span>
              )}
            </div>
          </div>
        </div>

        {showAvailability ? (
          // Availability Management
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800">Müsaitlik Yönetimi</h2>
              <p className="text-slate-600">Çalışma saatlerinizi belirleyin</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100">
              {/* Yeni Müsaitlik Ekleme */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Yeni Müsaitlik Ekle</h3>
                <div className="grid grid-cols-3 gap-4">
                  <select
                    id="dayOfWeek"
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="1">Pazartesi</option>
                    <option value="2">Salı</option>
                    <option value="3">Çarşamba</option>
                    <option value="4">Perşembe</option>
                    <option value="5">Cuma</option>
                    <option value="6">Cumartesi</option>
                    <option value="0">Pazar</option>
                  </select>
                  <input
                    type="time"
                    id="startTime"
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <input
                    type="time"
                    id="endTime"
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      const dayOfWeek = parseInt((document.getElementById('dayOfWeek') as HTMLSelectElement).value);
                      const startTime = (document.getElementById('startTime') as HTMLInputElement).value;
                      const endTime = (document.getElementById('endTime') as HTMLInputElement).value;
                      addAvailability(dayOfWeek, startTime, endTime);
                    }}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Müsaitlik Ekle
                  </button>
                  <button
                    onClick={() => setShowBusyModal(true)}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    🚫 Anında Meşgul Yap
                  </button>
                </div>
              </div>

              {/* Mevcut Müsaitlikler */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Mevcut Müsaitlikler</h3>
                <div className="space-y-2">
                  {availability.map((slot) => (
                    <div
                      key={slot.id}
                      className={`p-3 rounded-lg border flex justify-between items-center ${
                        slot.is_active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div>
                        <span className="font-medium text-slate-800">{getDayName(slot.day_of_week)}</span>
                        <span className="text-slate-600 ml-2">
                          {slot.start_time} - {slot.end_time}
                        </span>
                        {!slot.is_active && (
                          <span className="ml-2 text-red-600 font-medium">(Meşgul)</span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleAvailability(slot.id, !slot.is_active)}
                          className={`px-3 py-1 rounded text-sm ${
                            slot.is_active
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {slot.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                        </button>
                        <button
                          onClick={() => deleteAvailability(slot.id)}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Appointments Calendar
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800">Randevu Takvimi</h2>
              <p className="text-slate-600">Randevularınızı görüntüleyin</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100">
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-slate-800">
                  {currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Bugün
                  </button>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((day) => (
                  <div key={day} className="p-2 text-center font-medium text-slate-600">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentDate).map((day, index) => {
                  const isToday = day && day.toDateString() === new Date().toDateString();
                  const dayAppointments = getAppointmentsForDate(day);
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 border border-slate-200 ${
                        day ? 'bg-white' : 'bg-slate-50'
                      } ${isToday ? 'bg-slate-50 border-slate-300' : ''}`}
                    >
                      {day && (
                        <>
                          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-emerald-600' : 'text-slate-700'}`}>
                            {day.getDate()}
                          </div>
                          <div className="space-y-1">
                            {dayAppointments.slice(0, 2).map((appointment) => (
                              <div
                                key={appointment.id}
                                className={`text-xs p-1 rounded truncate ${getStatusColor(appointment.status)}`}
                              >
                                {appointment.appointment_time} - {appointment.customer_name}
                              </div>
                            ))}
                            {dayAppointments.length > 2 && (
                              <div className="text-xs text-slate-500">
                                +{dayAppointments.length - 2} daha
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

            {/* Appointments List */}
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-slate-100">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Randevu Listesi</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarih & Saat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Müşteri
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hizmet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(appointment.appointment_date).toLocaleDateString('tr-TR')} {appointment.appointment_time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {appointment.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {appointment.services?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status === 'confirmed' ? 'Onaylandı' :
                             appointment.status === 'pending' ? 'Beklemede' :
                             appointment.status === 'completed' ? 'Tamamlandı' :
                             appointment.status === 'cancelled' ? 'İptal Edildi' :
                             appointment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Meşgul Modal */}
      {showBusyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">🚫 Anında Meşgul Yap</h3>
            <p className="text-gray-600 mb-4">
              Belirli bir saati meşgul yaparak randevu alımını engelleyin.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                <input
                  type="date"
                  value={busySlot.date}
                  onChange={(e) => setBusySlot({ ...busySlot, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Saati</label>
                <input
                  type="time"
                  value={busySlot.time}
                  onChange={(e) => setBusySlot({ ...busySlot, time: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Süre (dakika)</label>
                <select
                  value={busySlot.duration}
                  onChange={(e) => setBusySlot({ ...busySlot, duration: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value={30}>30 dakika</option>
                  <option value={60}>1 saat</option>
                  <option value={90}>1.5 saat</option>
                  <option value={120}>2 saat</option>
                  <option value={180}>3 saat</option>
                  <option value={240}>4 saat</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowBusyModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                İptal
              </button>
              <button
                onClick={createBusySlot}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Meşgul Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}