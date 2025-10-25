'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminServicesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [userBusinessId, setUserBusinessId] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [newService, setNewService] = useState({
    name: '',
    business_id: '',
    price_cents: '',
    duration_minutes: '',
    capacity: '1'
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
        await loadServices(undefined, true);
        await loadBusinesses(undefined, true);
        return;
      }
      
      // Business owner kontrolü
      const { data: profile, error: profileError } = await supabase
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
      
      // GÜVENLİK: Business ID kontrolü
      if (!profile.business_id) {
        console.error('Business owner has no business_id assigned!');
        setError('⚠️ Size henüz bir işletme atanmamış. Lütfen sistem yöneticisi ile iletişime geçin.');
        setLoading(false);
        return;
      }
      
      setUserBusinessId(profile.business_id);
      await loadServices(profile.business_id, false);
      await loadBusinesses(profile.business_id, false);
    } catch (error) {
      console.error('User check error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async (businessId?: string, isOwnerParam?: boolean) => {
    try {
      let query = supabase
        .from('services')
        .select(`
          *,
          businesses (
            name,
            district
          )
        `);

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

  const loadBusinesses = async (businessId?: string, isOwnerParam?: boolean) => {
    try {
      let query = supabase
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      // Business owner ise business_id'yi otomatik set et
      let businessId;
      if (isOwner) {
        businessId = newService.business_id;
        if (!businessId) {
          setMessage('Lütfen bir işletme seçin!');
          return;
        }
      } else {
        businessId = userBusinessId;
        if (!businessId) {
          setMessage('Business ID bulunamadı! Lütfen admin ile iletişime geçin.');
          return;
        }
      }
      
      const { error } = await supabase
        .from('services')
        .insert({
          name: newService.name,
          business_id: businessId,
          price_cents: parseInt(newService.price_cents) * 100,
          duration_minutes: parseInt(newService.duration_minutes),
          capacity: parseInt(newService.capacity)
        });

      if (error) {
        setMessage('Hata: ' + error.message);
        return;
      }

      setMessage('Hizmet başarıyla eklendi!');
      setNewService({
        name: '',
        business_id: '',
        price_cents: '',
        duration_minutes: '',
        capacity: '1'
      });
      setShowAddForm(false);
      loadServices();
    } catch (error) {
      setMessage('Bir hata oluştu: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        setMessage('Hata: ' + error.message);
        return;
      }

      setMessage('Hizmet başarıyla silindi!');
      loadServices();
    } catch (error) {
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
            <Link href="/admin/services" className="border-b-2 border-slate-600 text-slate-600 py-4 font-medium whitespace-nowrap text-sm sm:text-base">
              Hizmetler
            </Link>
            <Link href="/admin/staff" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200 whitespace-nowrap text-sm sm:text-base">
              Personel
            </Link>
            <Link href="/admin/appointments" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200 whitespace-nowrap text-sm sm:text-base">
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Hizmetler</h2>
            <p className="text-gray-600">Sistemdeki tüm hizmetler ({services.length})</p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all duration-200"
          >
            {showAddForm ? 'İptal' : '+ Yeni Hizmet Ekle'}
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

        {/* Add Service Form */}
        {showAddForm && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Yeni Hizmet Ekle</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet Adı *</label>
                <input 
                  type="text" 
                  value={newService.name}
                  onChange={(e) => setNewService({...newService, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                  placeholder="Hizmet Adı" 
                  required
                />
              </div>
              {isOwner && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İşletme *</label>
                  <select 
                    value={newService.business_id}
                    onChange={(e) => setNewService({...newService, business_id: e.target.value})}
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
              {!isOwner && userBusinessId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İşletme</label>
                  <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600">
                    {businesses.find(b => b.id === userBusinessId)?.name || 'İşletme bilgisi yükleniyor...'}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (TL) *</label>
                <input 
                  type="number" 
                  value={newService.price_cents}
                  onChange={(e) => setNewService({...newService, price_cents: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                  placeholder="150" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Süre (dakika) *</label>
                <input 
                  type="number" 
                  value={newService.duration_minutes}
                  onChange={(e) => setNewService({...newService, duration_minutes: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                  placeholder="30" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapasite *</label>
                <input 
                  type="number" 
                  value={newService.capacity}
                  onChange={(e) => setNewService({...newService, capacity: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                  placeholder="1" 
                  min="1"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all duration-200"
                >
                  {submitting ? 'Ekleniyor...' : 'Hizmet Ekle'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Services List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Hizmet Listesi ({services.length})</h3>
          </div>
          
          <div className="p-6">
            {services.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔧</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Henüz hizmet eklenmemiş</h3>
                <p className="text-gray-600">Yeni hizmet eklemek için yukarıdaki butonu kullanın.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <div key={service.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <h4 className="font-semibold flex-1 min-w-0 truncate">{service.name}</h4>
                      <button 
                        onClick={() => deleteService(service.id)}
                        className="text-red-600 hover:text-red-800 flex-shrink-0 p-1"
                        title="Sil"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>🏢 {service.businesses?.name || 'Bilinmeyen İşletme'}</p>
                      <p>📍 {service.businesses?.district || 'Bilinmeyen İlçe'}</p>
                      <p>💰 {service.price_cents / 100} TL</p>
                      <p>⏱️ {service.duration_minutes} dakika</p>
                      <p>👥 Kapasite: {service.capacity || 1} kişi</p>
                      {service.description && (
                        <p>📝 {service.description}</p>
                      )}
                      <p className={`text-xs ${service.active ? 'text-green-600' : 'text-red-600'}`}>
                        {service.active ? '✅ Aktif' : '❌ Pasif'}
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