'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SuperAdminAvailabilityPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [workingHours, setWorkingHours] = useState<any[]>([]);
  const [newHour, setNewHour] = useState<any>({ weekday: 1, start_time: '09:00', end_time: '18:00' });

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Super admin kontrolü
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('auth_user_id', session.user.id)
        .single();

      // Test kullanıcısı için özel kontrol
      const isTestUser = session.user.id === '59569b53-792e-4a10-8d28-a2625d96104b';
      const isSuperAdmin = profile?.role === 'super_admin' || isTestUser;

      if (!isSuperAdmin) {
        router.push('/');
        return;
      }

      setIsAuthorized(true);
      await loadBusinesses();
    } catch (e) {
      console.log('Auth check error:', e);
      router.push('/login');
    }
  };

  const loadBusinesses = async () => {
    try {
      const { data: businessesData } = await supabase
        .from('businesses')
        .select('*')
        .order('name', { ascending: true });

      setBusinesses(businessesData || []);
    } catch (error) {
      console.error('Businesses load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async (businessId: any) => {
    try {
      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .eq('business_id', businessId)
        .eq('active', true);

      setStaff(staffData || []);
      setSelectedStaff(null);
      setWorkingHours([]);
    } catch (error) {
      console.error('Staff load error:', error);
    }
  };

  const loadWorkingHours = async (staffId: any) => {
    try {
      const { data: hours } = await supabase
        .from('working_hours')
        .select('*')
        .eq('staff_id', staffId)
        .order('weekday', { ascending: true });

      setWorkingHours(hours || []);
    } catch (error) {
      console.error('Working hours load error:', error);
    }
  };

  const addWorkingHour = async () => {
    if (!selectedStaff) return;

    try {
      const { error } = await supabase
        .from('working_hours')
        .insert({
          staff_id: selectedStaff.id,
          weekday: newHour.weekday,
          start_time: newHour.start_time,
          end_time: newHour.end_time
        });

      if (error) {
        console.error('Working hour add error:', error);
        return;
      }

      await loadWorkingHours(selectedStaff.id);
      setNewHour({ weekday: 1, start_time: '09:00', end_time: '18:00' });
    } catch (error) {
      console.error('Working hour add error:', error);
    }
  };

  const deleteWorkingHour = async (hourId: any) => {
    try {
      const { error } = await supabase
        .from('working_hours')
        .delete()
        .eq('id', hourId);

      if (error) {
        console.error('Working hour delete error:', error);
        return;
      }

      await loadWorkingHours(selectedStaff.id);
    } catch (error) {
      console.error('Working hour delete error:', error);
    }
  };

  const weekdays = [
    { value: 0, name: 'Pazar' },
    { value: 1, name: 'Pazartesi' },
    { value: 2, name: 'Salı' },
    { value: 3, name: 'Çarşamba' },
    { value: 4, name: 'Perşembe' },
    { value: 5, name: 'Cuma' },
    { value: 6, name: 'Cumartesi' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Super Admin Müsaitlik Yönetimi</h1>
              <p className="text-gray-600">Tüm işletmelerin personel çalışma saatlerini düzenle</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/super-admin" 
                className="text-gray-600 hover:text-gray-900"
              >
                ← Super Admin Panel
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Business Selection */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">İşletme Seçin</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businesses.map((business) => (
                <button
                  key={business.id}
                  onClick={() => {
                    setSelectedBusiness(business);
                    loadStaff(business.id);
                  }}
                  className={`p-4 border rounded-lg text-left hover:bg-gray-50 ${
                    selectedBusiness?.id === business.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <h4 className="font-medium text-gray-900">{business.name}</h4>
                  <p className="text-sm text-gray-500">{business.category} • {business.district}</p>
                  <p className="text-sm text-gray-500">{business.address}</p>
                </button>
              ))}
            </div>
          </div>

          {selectedBusiness && (
            <>
              {/* Staff Selection */}
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedBusiness.name} - Personel Seçin
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staff.map((staffMember) => (
                    <button
                      key={staffMember.id}
                      onClick={() => {
                        setSelectedStaff(staffMember);
                        loadWorkingHours(staffMember.id);
                      }}
                      className={`p-4 border rounded-lg text-left hover:bg-gray-50 ${
                        selectedStaff?.id === staffMember.id 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900">{staffMember.full_name}</h4>
                      <p className="text-sm text-gray-500">{staffMember.email}</p>
                      <p className="text-sm text-gray-500">{staffMember.phone}</p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedStaff && (
                <>
                  {/* Add Working Hours */}
                  <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {selectedStaff.full_name} - Çalışma Saatleri Ekle
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gün
                        </label>
                        <select
                          value={newHour.weekday}
                          onChange={(e) => setNewHour({...newHour, weekday: parseInt(e.target.value)})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          {weekdays.map(day => (
                            <option key={day.value} value={day.value}>
                              {day.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Başlangıç
                        </label>
                        <input
                          type="time"
                          value={newHour.start_time}
                          onChange={(e) => setNewHour({...newHour, start_time: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bitiş
                        </label>
                        <input
                          type="time"
                          value={newHour.end_time}
                          onChange={(e) => setNewHour({...newHour, end_time: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={addWorkingHour}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                          Ekle
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Current Working Hours */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Mevcut Çalışma Saatleri
                    </h3>
                    <div className="space-y-2">
                      {workingHours.map((hour) => (
                        <div key={hour.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                          <div className="flex items-center space-x-4">
                            <span className="font-medium text-gray-900">
                              {weekdays.find(d => d.value === hour.weekday)?.name}
                            </span>
                            <span className="text-gray-600">
                              {hour.start_time} - {hour.end_time}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteWorkingHour(hour.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Sil
                          </button>
                        </div>
                      ))}
                      {workingHours.length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                          Henüz çalışma saati tanımlanmamış.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

