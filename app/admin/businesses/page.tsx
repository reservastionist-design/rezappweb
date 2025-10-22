'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';

export default function AdminBusinessesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [availableBusinessOwners, setAvailableBusinessOwners] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [userBusinessId, setUserBusinessId] = useState<string | null>(null);
  
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    slug: '',
    description: '',
    address: '',
    district: '',
    phone: '',
    email: '',
    business_owner_id: '',
    // Çalışma saatleri
    monday_start: '',
    monday_end: '',
    tuesday_start: '',
    tuesday_end: '',
    wednesday_start: '',
    wednesday_end: '',
    thursday_start: '',
    thursday_end: '',
    friday_start: '',
    friday_end: '',
    saturday_start: '',
    saturday_end: '',
    sunday_start: '',
    sunday_end: ''
  });

  const districts = [
    'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler',
    'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü',
    'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt',
    'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane',
    'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer',
    'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla',
    'Ümraniye', 'Üsküdar', 'Zeytinburnu'
  ];

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('No session found, redirecting to login');
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Owner kontrolü - sadece owner ve super adminler erişebilir
      const isOwnerCheck = session.user.email === 'furkanaydemirie@gmail.com';
      setIsOwner(isOwnerCheck);
      
      console.log('User email:', session.user.email);
      console.log('Is owner check:', isOwnerCheck);
      
      // Owner ise direkt erişim ver
      if (isOwnerCheck) {
        console.log('Owner access granted, loading all data');
        await loadBusinesses(undefined, true);
        await loadAvailableBusinessOwners();
        return;
      }
      
      // Business owner kontrolü
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role, business_id')
        .eq('auth_user_id', session.user.id)
        .single();
      
      console.log('Profile data:', profile);
      console.log('Profile error:', profileError);
      
      const isBusinessOwner = profile?.role === 'business_owner';
      
      console.log('Is business owner:', isBusinessOwner);
      
      if (!isBusinessOwner) {
        console.log('Access denied - not owner or business owner, redirecting to home');
        router.push('/');
        return;
      }

      // Business owner için data yükle
      console.log('Loading data for business owner');
      setUserBusinessId(profile.business_id);
      await loadBusinesses(profile.business_id, false);
      
    } catch (error) {
      console.error('User check error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadBusinesses = async (businessId?: string, isOwnerParam?: boolean) => {
    try {
      let query = supabaseAdmin
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

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

  const loadAvailableBusinessOwners = async () => {
    try {
      // Business owner rolündeki kullanıcıları getir (business_id null olanlar)
      const { data: availableOwners, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('role', 'business_owner')
        .is('business_id', null)
        .order('email', { ascending: true });

      if (error) {
        console.error('Available business owners load error:', error);
        return;
      }

      setAvailableBusinessOwners(availableOwners || []);
    } catch (error) {
      console.error('Available business owners load error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    // Business owner seçimi kontrolü
    if (!newBusiness.business_owner_id) {
      setMessage('Hata: Lütfen bir business owner seçin!');
      setSubmitting(false);
      return;
    }

    try {
      const { data: business, error } = await supabaseAdmin
        .from('businesses')
        .insert({
          name: newBusiness.name,
          slug: newBusiness.slug,
          district: newBusiness.district,
          address: newBusiness.address,
          phone: newBusiness.phone,
          email: newBusiness.email,
          description: newBusiness.description,
          // Çalışma saatleri
          monday_start: newBusiness.monday_start || null,
          monday_end: newBusiness.monday_end || null,
          tuesday_start: newBusiness.tuesday_start || null,
          tuesday_end: newBusiness.tuesday_end || null,
          wednesday_start: newBusiness.wednesday_start || null,
          wednesday_end: newBusiness.wednesday_end || null,
          thursday_start: newBusiness.thursday_start || null,
          thursday_end: newBusiness.thursday_end || null,
          friday_start: newBusiness.friday_start || null,
          friday_end: newBusiness.friday_end || null,
          saturday_start: newBusiness.saturday_start || null,
          saturday_end: newBusiness.saturday_end || null,
          sunday_start: newBusiness.sunday_start || null,
          sunday_end: newBusiness.sunday_end || null
        })
        .select()
        .single();

      if (error) {
        setMessage('Hata: ' + error.message);
        return;
      }

      // Seçilen kullanıcıyı business_owner olarak güncelle
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'business_owner',
          business_id: business.id
        })
        .eq('id', newBusiness.business_owner_id);

      if (profileError) {
        setMessage('Hata: Business owner atama hatası - ' + profileError.message);
        return;
      }

      setMessage('İşletme başarıyla eklendi ve business owner atandı!');
      setNewBusiness({
        name: '',
        slug: '',
        description: '',
        address: '',
        district: '',
        phone: '',
        email: '',
        business_owner_id: '',
        // Çalışma saatleri
        monday_start: '',
        monday_end: '',
        tuesday_start: '',
        tuesday_end: '',
        wednesday_start: '',
        wednesday_end: '',
        thursday_start: '',
        thursday_end: '',
        friday_start: '',
        friday_end: '',
        saturday_start: '',
        saturday_end: '',
        sunday_start: '',
        sunday_end: ''
      });
      setShowAddForm(false);
      await loadBusinesses();
      await loadAvailableBusinessOwners();
    } catch (error) {
      setMessage('Bir hata oluştu: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBusiness = async (businessId: string) => {
    if (!confirm('Bu işletmeyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabaseAdmin
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (error) {
        setMessage('Hata: ' + error.message);
        return;
      }

      setMessage('İşletme başarıyla silindi!');
      loadBusinesses();
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
            <Link href="/admin/businesses" className="border-b-2 border-blue-600 text-blue-600 py-4">
              İşletmeler
            </Link>
            <Link href="/admin/services" className="text-gray-600 hover:text-blue-600 py-4">
              Hizmetler
            </Link>
            <Link href="/admin/staff" className="text-gray-600 hover:text-blue-600 py-4">
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
            <h2 className="text-3xl font-bold text-gray-900">İşletmeler</h2>
            <p className="text-gray-600">Sistemdeki tüm işletmeler ({businesses.length})</p>
          </div>
          <button 
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (!showAddForm) {
                loadAvailableBusinessOwners();
              }
            }}
            className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-all duration-200"
          >
            {showAddForm ? 'İptal' : '+ Yeni İşletme Ekle'}
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

        {/* Add Business Form */}
        {showAddForm && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Yeni İşletme Ekle</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İşletme Adı *</label>
                <input 
                  type="text" 
                  value={newBusiness.name}
                  onChange={(e) => setNewBusiness({...newBusiness, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                  placeholder="İşletme Adı" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input 
                  type="text" 
                  value={newBusiness.slug}
                  onChange={(e) => setNewBusiness({...newBusiness, slug: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                  placeholder="isletme-adi" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İlçe *</label>
                <select 
                  value={newBusiness.district}
                  onChange={(e) => setNewBusiness({...newBusiness, district: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">İlçe Seçin</option>
                  {districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                <input 
                  type="tel" 
                  value={newBusiness.phone}
                  onChange={(e) => setNewBusiness({...newBusiness, phone: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                  placeholder="5xx xxx xx xx" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input 
                  type="email" 
                  value={newBusiness.email}
                  onChange={(e) => setNewBusiness({...newBusiness, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                  placeholder="isletme@email.com" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Owner <span className="text-red-500">*</span>
                </label>
                <select 
                  value={newBusiness.business_owner_id}
                  onChange={(e) => setNewBusiness({...newBusiness, business_owner_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                  required
                >
                  <option value="">Business Owner Seçin</option>
                  {availableBusinessOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.email} {owner.role ? `(${owner.role})` : '(customer)'}
                    </option>
                  ))}
                </select>
                {availableBusinessOwners.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    Henüz işletme atanmamış business owner yok. Önce Business Owner Panel'den business owner oluşturun.
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Bu business owner bu işletmenin yöneticisi olacak.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tam Adres *</label>
                <input 
                  type="text" 
                  value={newBusiness.address}
                  onChange={(e) => setNewBusiness({...newBusiness, address: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                  placeholder="Tam Adres (Zorunlu - Harita için)" 
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea 
                  value={newBusiness.description}
                  onChange={(e) => setNewBusiness({...newBusiness, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                  placeholder="İşletme açıklaması" 
                  rows={3}
                />
              </div>
              
              {/* Çalışma Saatleri */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Çalışma Saatleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'monday', label: 'Pazartesi' },
                    { key: 'tuesday', label: 'Salı' },
                    { key: 'wednesday', label: 'Çarşamba' },
                    { key: 'thursday', label: 'Perşembe' },
                    { key: 'friday', label: 'Cuma' },
                    { key: 'saturday', label: 'Cumartesi' },
                    { key: 'sunday', label: 'Pazar' }
                  ].map((day) => (
                    <div key={day.key} className="flex items-center space-x-2">
                      <label className="w-20 text-sm font-medium text-gray-700">{day.label}:</label>
                      <input
                        type="time"
                        value={newBusiness[`${day.key}_start` as keyof typeof newBusiness] as string}
                        onChange={(e) => setNewBusiness({...newBusiness, [`${day.key}_start`]: e.target.value})}
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={newBusiness[`${day.key}_end` as keyof typeof newBusiness] as string}
                        onChange={(e) => setNewBusiness({...newBusiness, [`${day.key}_end`]: e.target.value})}
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all duration-200"
                >
                  {submitting ? 'Ekleniyor...' : 'İşletme Ekle'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Businesses List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">İşletme Listesi ({businesses.length})</h3>
          </div>
          
          <div className="p-6">
            {businesses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏢</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Henüz işletme eklenmemiş</h3>
                <p className="text-gray-600">Yeni işletme eklemek için yukarıdaki butonu kullanın.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map((business) => (
                  <div key={business.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{business.name}</h4>
                      <button 
                        onClick={() => deleteBusiness(business.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>📍 {business.district}, {business.city}</p>
                      <p>📞 {business.phone}</p>
                      {business.email && <p>📧 {business.email}</p>}
                      {business.address && <p>🏠 {business.address}</p>}
                      {business.description && <p>📝 {business.description}</p>}
                      <p className="text-xs text-gray-500">
                        Oluşturulma: {new Date(business.created_at).toLocaleDateString('tr-TR')}
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