'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';

export default function AdminStaffPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [userBusinessId, setUserBusinessId] = useState<string | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    business_id: '',
    role: 'staff',
    selectedServices: [] as string[]
  });

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
        await loadStaff(undefined, true);
        await loadBusinesses(undefined, true);
        await loadServices(undefined, true);
        return;
      }
      
      // Business owner kontrolü
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role, business_id')
        .eq('auth_user_id', session.user.id)
        .single();
      
      const isBusinessOwner = profile?.role === 'business_owner';
      
      if (!isBusinessOwner) {
        router.push('/');
        return;
      }

      // Business owner için data yükle
      setUserBusinessId(profile.business_id);
      await loadStaff(profile.business_id, false);
      await loadBusinesses(profile.business_id, false);
      await loadServices(profile.business_id, false);
    } catch (error) {
      console.error('User check error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async (businessId?: string, isOwnerParam?: boolean) => {
    try {
      let query = supabaseAdmin
        .from('staff')
        .select(`
          *,
          businesses (
            name,
            district
          )
        `)

      // Business owner ise sadece kendi işletmesinin personelini göster
      const actualBusinessId = businessId || userBusinessId;
      const actualIsOwner = isOwnerParam !== undefined ? isOwnerParam : isOwner;
      
      if (!actualIsOwner && actualBusinessId) {
        query = query.eq('business_id', actualBusinessId);
      }

      const { data: staff, error } = await query;

      if (error) {
        console.error('Staff load error:', error);
        return;
      }

      setStaff(staff || []);
    } catch (error) {
      console.error('Staff load error:', error);
    }
  };

  const loadBusinesses = async (businessId?: string, isOwnerParam?: boolean) => {
    try {
      let query = supabaseAdmin
        .from('businesses')
        .select('*')
        .order('name', { ascending: true });

      // Business owner ise sadece kendi işletmesini göster
      const actualBusinessId = businessId || userBusinessId;
      const actualIsOwner = isOwnerParam !== undefined ? isOwnerParam : isOwner;
      
      if (!actualIsOwner && actualBusinessId) {
        query = query.eq('id', actualBusinessId);
      }

      const { data: businesses, error } = await query;

      if (error) {
        console.error('Businesses load error:', error);
        return;
      }

      setBusinesses(businesses || []);
    } catch (error) {
      console.error('Businesses load error:', error);
    }
  };

  const loadServices = async (businessId?: string, isOwnerParam?: boolean) => {
    try {
      let query = supabaseAdmin
        .from('services')
        .select('*')
        .order('name', { ascending: true });

      // Business owner ise sadece kendi işletmesinin hizmetlerini göster
      const actualBusinessId = businessId || userBusinessId;
      const actualIsOwner = isOwnerParam !== undefined ? isOwnerParam : isOwner;
      
      if (!actualIsOwner && actualBusinessId) {
        query = query.eq('business_id', actualBusinessId);
      }

      const { data: services, error } = await query;

      if (error) {
        console.error('Services load error:', error);
        return;
      }

      setServices(services || []);
    } catch (error) {
      console.error('Services load error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      // Önce kullanıcının zaten var olup olmadığını kontrol et
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', newStaff.email)
        .single();

      // Business ID'yi doğru şekilde belirle
      let businessId;
      if (isOwner) {
        // Owner ise formdan seçilen business_id'yi kullan
        businessId = newStaff.business_id;
        if (!businessId) {
          setMessage('Lütfen bir işletme seçin!');
          return;
        }
      } else {
        // Business owner ise kendi business_id'sini kullan
        businessId = userBusinessId;
        if (!businessId) {
          setMessage('Business ID bulunamadı!');
          return;
        }
      }

      if (existingProfile) {
        // Kullanıcı zaten varsa, rolünü ve business_id'sini güncelle
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ 
            role: 'staff',
            business_id: businessId
          })
          .eq('id', existingProfile.id);
          
        if (updateError) {
          setMessage('Profil güncelleme hatası: ' + updateError.message);
          return;
        }
      } else {
        // Yeni profil oluştur (auth kullanıcısı olmadan)
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            auth_user_id: null, // Auth kullanıcısı yok
            email: newStaff.email,
            role: 'staff',
            business_id: businessId
          });

        if (profileError) {
          setMessage('Profil oluşturma hatası: ' + profileError.message);
          return;
        }
      }

      // Staff tablosuna ekle - business_id'yi doğrudan gönder
      const staffData = {
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone,
        business_id: businessId // Doğrudan gönder
      };
      
      const { error: staffError, data: insertedData } = await supabaseAdmin
        .from('staff')
        .insert(staffData)
        .select();

      if (staffError) {
        setMessage('Personel ekleme hatası: ' + staffError.message);
        return;
      }

      // Staff oluşturulduktan sonra profiles tablosuna staff_id'yi kaydet
      if (insertedData && insertedData[0]) {
        const staffId = insertedData[0].id;
        
        const { error: profileUpdateError } = await supabaseAdmin
          .from('profiles')
          .update({ staff_id: staffId })
          .eq('email', newStaff.email);
          
        if (profileUpdateError) {
          console.error('Profile staff_id güncelleme hatası:', profileUpdateError);
          setMessage('Personel eklendi ama profil güncellemesi başarısız: ' + profileUpdateError.message);
          return;
        }
      }

      // Seçilen hizmetleri staff_services tablosuna ekle
      if (newStaff.selectedServices.length > 0 && insertedData && insertedData[0]) {
        const staffId = insertedData[0].id;
        const staffServicesData = newStaff.selectedServices.map(serviceId => ({
          staff_id: staffId,
          service_id: serviceId
        }));

        const { error: staffServicesError } = await supabaseAdmin
          .from('staff_services')
          .insert(staffServicesData);

        if (staffServicesError) {
          console.error('Staff services ekleme hatası:', staffServicesError);
          setMessage('Personel eklendi ama hizmet eşleştirmesi başarısız: ' + staffServicesError.message);
          return;
        }
      }

      setMessage('Personel başarıyla eklendi! (Auth kullanıcısı oluşturulmadı - sadece profil)');
      setNewStaff({
        name: '',
        email: '',
        phone: '',
        business_id: '',
        role: 'staff',
        selectedServices: []
      });
      setShowAddForm(false);
      loadStaff();
    } catch (error) {
      setMessage('Bir hata oluştu: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteStaff = async (staffId: string) => {
    if (!confirm('Bu personeli silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabaseAdmin
        .from('staff')
        .delete()
        .eq('id', staffId);

      if (error) {
        setMessage('Hata: ' + error.message);
        return;
      }
      setMessage('Personel başarıyla silindi!');
      loadStaff();
    } catch (error) {
      console.error('Delete exception:', error);
      setMessage('Bir hata oluştu: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const fixStaffConnection = async (staffId: string, staffEmail: string) => {
    try {
      // Profiles tablosunda staff_id'yi güncelle
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ staff_id: staffId })
        .eq('email', staffEmail);
        
      if (profileError) {
        setMessage('Profil güncelleme hatası: ' + profileError.message);
        return;
      }

      setMessage('Personel bağlantısı başarıyla düzeltildi!');
      loadStaff();
    } catch (error) {
      console.error('Fix staff connection error:', error);
      setMessage('Bir hata oluştu: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">📅 RezApp Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Hoş geldin, {user?.email}</span>
              <Link 
                href="/" 
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
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
                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
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
          <div className="flex space-x-8">
            <Link href="/admin" className="text-gray-600 hover:text-blue-600 py-4">
              Dashboard
            </Link>
            <Link href="/admin/businesses" className="text-gray-600 hover:text-blue-600 py-4">
              İşletmeler
            </Link>
            <Link href="/admin/services" className="text-gray-600 hover:text-blue-600 py-4">
              Hizmetler
            </Link>
            <Link href="/admin/staff" className="border-b-2 border-blue-600 text-blue-600 py-4">
              Personel
            </Link>
            <Link href="/admin/appointments" className="text-gray-600 hover:text-blue-600 py-4">
              Randevular
            </Link>
            <Link href="/admin/availability" className="text-gray-600 hover:text-blue-600 py-4">
              Müsaitlik
            </Link>
            {user?.email === 'furkanaydemirie@gmail.com' && (
              <Link href="/super-admin" className="text-gray-600 hover:text-blue-600 py-4">
                Business Owner Panel
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Personel</h2>
            <p className="text-gray-600">Sistemdeki tüm personel ({staff.length})</p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all duration-200"
          >
            {showAddForm ? 'İptal' : '+ Yeni Personel Ekle'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.includes('Hata') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}

        {/* Add Staff Form */}
        {showAddForm && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Yeni Personel Ekle</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                <input 
                  type="text" 
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                  placeholder="Personel Adı Soyadı" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta *</label>
                <input 
                  type="email" 
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                  placeholder="personel@example.com" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                <input 
                  type="tel" 
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                  placeholder="5xx xxx xx xx" 
                  required
                />
              </div>
              {isOwner && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İşletme *</label>
                  <select 
                    value={newStaff.business_id}
                    onChange={(e) => setNewStaff({...newStaff, business_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value="">İşletme Seçin</option>
                    {businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name} ({business.district})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hizmetler (Hangi hizmetleri verebilir?)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {services.map((service) => (
                    <label key={service.id} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newStaff.selectedServices.includes(service.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewStaff({
                              ...newStaff,
                              selectedServices: [...newStaff.selectedServices, service.id]
                            });
                          } else {
                            setNewStaff({
                              ...newStaff,
                              selectedServices: newStaff.selectedServices.filter(id => id !== service.id)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span>{service.name}</span>
                    </label>
                  ))}
                </div>
                {services.length === 0 && (
                  <p className="text-gray-500 text-sm mt-1">Henüz hizmet eklenmemiş</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select 
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="staff">Personel</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Not:</strong> Yeni personel için varsayılan şifre <strong>123456</strong> olarak ayarlanacaktır.
                  </p>
                </div>
              </div>
              <div className="md:col-span-2">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all duration-200"
                >
                  {submitting ? 'Ekleniyor...' : 'Personel Ekle'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Staff List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Personel Listesi ({staff.length})</h3>
          </div>
          
          <div className="p-6">
            {staff.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Henüz personel eklenmemiş</h3>
                <p className="text-gray-600">Yeni personel eklemek için yukarıdaki butonu kullanın.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map((person) => (
                  <div key={person.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{person.name}</h4>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => fixStaffConnection(person.id, person.email)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="Bağlantıyı Düzelt"
                        >
                          🔧
                        </button>
                        <button 
                          onClick={() => deleteStaff(person.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Sil"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>📧 {person.email}</p>
                      <p>📞 {person.phone}</p>
                      <p>🏢 {person.businesses?.name || 'Bilinmeyen İşletme'}</p>
                      <p>📍 {person.businesses?.district || 'Bilinmeyen İlçe'}</p>
                      <p>👤 Rol: {person.role || 'Personel'}</p>
                      
                      {/* Hizmetler */}
                      <div className="mt-3">
                        <p className="font-medium text-gray-700 mb-1">🔧 Hizmetler:</p>
                        <p className="text-gray-500 text-xs">Hizmet bilgileri yükleniyor...</p>
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        Oluşturulma: {new Date(person.created_at).toLocaleDateString('tr-TR')}
                      </p>
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