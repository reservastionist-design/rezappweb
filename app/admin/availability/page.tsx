'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export default function AvailabilityPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [userBusinessId, setUserBusinessId] = useState<string | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showBusyModal, setShowBusyModal] = useState(false);
  const [busySlot, setBusySlot] = useState({ date: '', time: '', duration: 60 });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, business_id')
        .eq('auth_user_id', session.user.id)
        .single();

      const isOwnerCheck = profile?.role === 'owner';
      const isBusinessOwner = profile?.role === 'business_owner';
      
      if (!isOwnerCheck && !isBusinessOwner && profile?.role !== 'staff') {
        router.push('/');
        return;
      }

      setUser(session.user);
      setIsOwner(isOwnerCheck);
      setUserBusinessId(isBusinessOwner ? profile.business_id : null);
      
      await loadStaff(isOwnerCheck, isBusinessOwner ? profile.business_id : null);
    } catch (error) {
      console.error('User check error:', error);
      router.push('/login');
    }
  };

  const loadStaff = async (isOwnerParam: boolean, userBusinessIdParam: string | null) => {
    try {
      let query = supabaseAdmin
        .from('staff')
        .select('*');

      // Owner ise tüm personelleri göster, Business owner ise sadece kendi işletmesinin personelini göster
      if (!isOwnerParam && userBusinessIdParam) {
        query = query.eq('business_id', userBusinessIdParam);
      }

      const { data: staffData, error } = await query;
      if (error) {
        console.error('Staff query error:', error);
        throw error;
      }

      console.log('Staff loaded for availability:', staffData?.length || 0, 'staff members');
      
      // Business bilgilerini ayrıca yükle
      if (staffData && staffData.length > 0) {
        const businessIds = [...new Set(staffData.map(s => s.business_id))];
        const { data: businesses } = await supabaseAdmin
          .from('businesses')
          .select('id, name, district')
          .in('id', businessIds);
        
        // Staff data'ya business bilgilerini ekle
        const staffWithBusinesses = staffData.map(staff => ({
          ...staff,
          businesses: businesses?.find(b => b.id === staff.business_id)
        }));
        
        setStaff(staffWithBusinesses);
      } else {
        setStaff([]);
      }
    } catch (error) {
      console.error('Staff load error:', error);
    }
  };

  const loadAvailability = async (staffId: string) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('staff_availability')
        .select('*')
        .eq('staff_id', staffId)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Availability load error:', error);
    }
  };

  const handleStaffSelect = (staffMember: any) => {
    setSelectedStaff(staffMember);
    loadAvailability(staffMember.id);
  };

  const addAvailability = async (dayOfWeek: number, startTime: string, endTime: string) => {
    if (!selectedStaff) return;

    try {
      const { error } = await supabaseAdmin
        .from('staff_availability')
        .insert({
          staff_id: selectedStaff.id,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          is_active: true
        });

      if (error) throw error;

      setMessage('Müsaitlik eklendi!');
      loadAvailability(selectedStaff.id);
    } catch (error) {
      console.error('Add availability error:', error);
      setMessage('Hata: ' + error.message);
    }
  };

  const toggleAvailability = async (availabilityId: string, isActive: boolean) => {
    try {
      const { error } = await supabaseAdmin
        .from('staff_availability')
        .update({ is_active: !isActive })
        .eq('id', availabilityId);

      if (error) throw error;

      setMessage('Müsaitlik güncellendi!');
      loadAvailability(selectedStaff.id);
    } catch (error) {
      console.error('Toggle availability error:', error);
      setMessage('Hata: ' + error.message);
    }
  };

  const deleteAvailability = async (availabilityId: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('staff_availability')
        .delete()
        .eq('id', availabilityId);

      if (error) throw error;

      setMessage('Müsaitlik silindi!');
      loadAvailability(selectedStaff.id);
    } catch (error) {
      console.error('Delete availability error:', error);
      setMessage('Hata: ' + error.message);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    // DB'de: 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
    const days: { [key: number]: string } = {
      0: 'Pazar',
      1: 'Pazartesi',
      2: 'Salı',
      3: 'Çarşamba',
      4: 'Perşembe',
      5: 'Cuma',
      6: 'Cumartesi'
    };
    return days[dayOfWeek] || 'Bilinmeyen';
  };

  const getAvailableSlots = (staffId: string, date: string) => {
    // Bu fonksiyon randevu alma sayfasında kullanılacak
    // Şimdilik placeholder
    return [];
  };

  // Duplicate availability to other staff
  const duplicateAvailability = async (targetStaffIds: string[]) => {
    try {
      if (!selectedStaff) return;

      // Seçili personelin müsaitliklerini al
      const { data: sourceAvailability, error: sourceError } = await supabase
        .from('staff_availability')
        .select('*')
        .eq('staff_id', selectedStaff.id);

      if (sourceError) throw sourceError;

      // Her hedef personel için müsaitlikleri kopyala
      for (const targetStaffId of targetStaffIds) {
        for (const slot of sourceAvailability || []) {
          const { error: insertError } = await supabase
            .from('staff_availability')
            .insert({
              staff_id: targetStaffId,
              day_of_week: slot.day_of_week,
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_active: slot.is_active
            });

          if (insertError) {
            console.error(`Error copying to staff ${targetStaffId}:`, insertError);
          }
        }
      }

      setMessage(`Müsaitlikler ${targetStaffIds.length} personel için kopyalandı!`);
      setShowDuplicateModal(false);
    } catch (error) {
      console.error('Duplicate availability error:', error);
      setMessage('Hata: ' + error.message);
    }
  };

  // Create busy slot (block appointment)
  const createBusySlot = async () => {
    try {
      if (!selectedStaff || !busySlot.date || !busySlot.time) {
        setMessage('Lütfen tarih ve saat seçin!');
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
          staff_id: selectedStaff.id,
          day_of_week: new Date(busySlot.date).getDay(),
          start_time: startTime,
          end_time: endTimeStr,
          is_active: false // Meşgul slot
        });

      if (error) throw error;

      setMessage('Meşgul slot oluşturuldu! Bu saatte randevu alınamaz.');
      setShowBusyModal(false);
      setBusySlot({ date: '', time: '', duration: 60 });
      loadAvailability(selectedStaff.id);
    } catch (error) {
      console.error('Create busy slot error:', error);
      setMessage('Hata: ' + error.message);
    }
  };

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
              <a 
                href="/" 
                className="bg-gray-200 text-gray-800 px-3 sm:px-4 py-2 rounded-md hover:bg-gray-300 transition-colors text-sm sm:text-base"
              >
                Ana Sayfa
              </a>
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
            <a href="/admin" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200 whitespace-nowrap text-sm sm:text-base">
              Dashboard
            </a>
            <a href="/admin/businesses" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200 whitespace-nowrap text-sm sm:text-base">
              İşletmeler
            </a>
            <a href="/admin/services" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200 whitespace-nowrap text-sm sm:text-base">
              Hizmetler
            </a>
            <a href="/admin/staff" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200 whitespace-nowrap text-sm sm:text-base">
              Personel
            </a>
            <a href="/admin/appointments" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200 whitespace-nowrap text-sm sm:text-base">
              Randevular
            </a>
            <a href="/admin/availability" className="border-b-2 border-slate-600 text-slate-600 py-4 font-medium whitespace-nowrap text-sm sm:text-base">
              Müsaitlik
            </a>
            {user?.email === 'furkanaydemirie@gmail.com' && (
              <a href="/super-admin" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200 whitespace-nowrap text-sm sm:text-base">
                Business Owner Panel
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-slate-800">Müsaitlik Yönetimi</h2>
          {isOwner && (
            <p className="text-sm text-emerald-600 mt-2">👑 Owner - Tüm personellerin müsaitliklerini yönetebilirsiniz</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">

          {message && (
            <div className={`p-4 rounded-md mb-6 ${
              message.includes('Hata') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
            }`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personel Listesi */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Personel Seçin {isOwner && <span className="text-sm text-emerald-600">(Tüm İşletmeler)</span>}
              </h2>
              <div className="space-y-2">
                {staff.map((staffMember) => (
                  <button
                    key={staffMember.id}
                    onClick={() => handleStaffSelect(staffMember)}
                    className={`w-full p-3 text-left rounded-lg border transition-colors ${
                      selectedStaff?.id === staffMember.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-300 hover:border-emerald-300'
                    }`}
                  >
                    <div className="font-medium">{staffMember.name || 'İsimsiz'}</div>
                    <div className="text-sm text-gray-600">
                      {staffMember.businesses?.name} • {staffMember.businesses?.district}
                    </div>
                  </button>
                ))}
              </div>
              {staff.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {isOwner ? 'Henüz hiç personel eklenmemiş' : 'Bu işletmede henüz personel eklenmemiş'}
                </div>
              )}
            </div>

            {/* Müsaitlik Yönetimi */}
            {selectedStaff && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedStaff.profiles?.name} - Müsaitlik Takvimi
                </h2>

                {/* Yeni Müsaitlik Ekleme */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="font-medium mb-3">Yeni Müsaitlik Ekle</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      id="dayOfWeek"
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
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
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <input
                      type="time"
                      id="endTime"
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const dayOfWeek = parseInt((document.getElementById('dayOfWeek') as HTMLSelectElement).value);
                      const startTime = (document.getElementById('startTime') as HTMLInputElement).value;
                      const endTime = (document.getElementById('endTime') as HTMLInputElement).value;
                      addAvailability(dayOfWeek, startTime, endTime);
                    }}
                    className="mt-2 bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700"
                  >
                    Ekle
                  </button>
                </div>

                {/* Hızlı İşlemler */}
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h3 className="font-medium mb-3 text-blue-800">🚀 Hızlı İşlemler</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowDuplicateModal(true)}
                      className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      📋 Diğer Personellere Kopyala
                    </button>
                    <button
                      onClick={() => setShowBusyModal(true)}
                      className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                    >
                      🚫 Anında Meşgul Yap
                    </button>
                  </div>
                </div>

                {/* Mevcut Müsaitlikler */}
                <div className="space-y-2">
                  {availability.map((slot) => (
                    <div
                      key={slot.id}
                      className={`p-3 rounded-lg border flex justify-between items-center ${
                        slot.is_active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div>
                        <span className="font-medium">{getDayName(slot.day_of_week)}</span>
                        <span className="ml-2 text-sm">
                          {slot.start_time} - {slot.end_time}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleAvailability(slot.id, slot.is_active)}
                          className={`px-3 py-1 rounded text-xs ${
                            slot.is_active
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {slot.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                        </button>
                        <button
                          onClick={() => deleteAvailability(slot.id)}
                          className="px-3 py-1 rounded text-xs bg-gray-100 text-gray-800 hover:bg-gray-200"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Duplicate Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">📋 Müsaitlikleri Kopyala</h3>
            <p className="text-gray-600 mb-4">
              <strong>{selectedStaff?.name}</strong> personelinin müsaitliklerini diğer personellere kopyalayın.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {staff
                .filter(s => s.id !== selectedStaff?.id)
                .map((staffMember) => (
                  <label key={staffMember.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`staff-${staffMember.id}`}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {staffMember.name} ({staffMember.businesses?.name})
                    </span>
                  </label>
                ))}
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
                  const targetStaffIds = Array.from(checkboxes).map(cb => 
                    (cb as HTMLInputElement).id.replace('staff-', '')
                  );
                  if (targetStaffIds.length > 0) {
                    duplicateAvailability(targetStaffIds);
                  } else {
                    setMessage('Lütfen en az bir personel seçin!');
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Kopyala
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meşgul Modal */}
      {showBusyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">🚫 Anında Meşgul Yap</h3>
            <p className="text-gray-600 mb-4">
              <strong>{selectedStaff?.name}</strong> personeli için belirli bir saati meşgul yapın.
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
