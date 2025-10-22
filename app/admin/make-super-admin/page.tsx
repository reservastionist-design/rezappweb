'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function MakeSuperAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [superAdmins, setSuperAdmins] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  
  const [newSuperAdmin, setNewSuperAdmin] = useState({
    email: '',
    business_id: ''
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

      // Owner kontrolü - sadece owner super admin yapabilir
      const isOwner = session.user.email === 'furkanaydemirie@gmail.com';
      
      if (!isOwner) {
        router.push('/admin'); // Owner değilse admin paneline yönlendir
        return;
      }

      await loadSuperAdmins();
      await loadBusinesses();
    } catch (error) {
      console.error('User check error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadSuperAdmins = async () => {
    try {
      // Profiles tablosundan super_admin rolündeki kullanıcıları al
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'super_admin')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Super admins load error:', error);
        return;
      }

      // Her super admin için business bilgilerini al
      const adminsWithBusinesses = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: businessAdmin } = await supabase
            .from('business_admins')
            .select(`
              business_id,
              businesses (
                name,
                district
              )
            `)
            .eq('user_id', profile.id)
            .single();

          return {
            id: profile.id,
            email: profile.email,
            created_at: profile.created_at,
            businesses: businessAdmin?.businesses || null
          };
        })
      );

      setSuperAdmins(adminsWithBusinesses);
    } catch (error) {
      console.error('Super admins load error:', error);
    }
  };

  const loadBusinesses = async () => {
    try {
      const { data: businesses, error } = await supabase
        .from('businesses')
        .select('*')
        .order('name', { ascending: true });

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
      const response = await fetch('/api/make-super-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newSuperAdmin.email,
          business_id: newSuperAdmin.business_id
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setMessage('Hata: ' + result.error);
        return;
      }

      setMessage('Super admin başarıyla oluşturuldu!');
      setNewSuperAdmin({
        email: '',
        business_id: ''
      });
      loadSuperAdmins();
    } catch (error) {
      setMessage('Bir hata oluştu: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const removeSuperAdmin = async (adminId: string) => {
    if (!confirm('Bu super admin yetkisini kaldırmak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      // Profiles tablosunda rolü customer'a çevir
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'customer' })
        .eq('id', adminId);

      if (error) {
        setMessage('Hata: ' + error.message);
        return;
      }

      setMessage('Super admin yetkisi kaldırıldı!');
      loadSuperAdmins();
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
              <h1 className="text-2xl font-bold text-slate-700">📅 RezApp Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Hoş geldin, {user?.email}</span>
              <Link 
                href="/" 
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Ana Sayfa
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link href="/admin" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200">
              Dashboard
            </Link>
            <Link href="/admin/businesses" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200">
              İşletmeler
            </Link>
            <Link href="/admin/services" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200">
              Hizmetler
            </Link>
            <Link href="/admin/staff" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200">
              Personel
            </Link>
            <Link href="/admin/appointments" className="text-slate-500 hover:text-slate-700 py-4 transition-colors duration-200">
              Randevular
            </Link>
            <Link href="/admin/make-super-admin" className="border-b-2 border-slate-600 text-slate-600 py-4 font-medium">
              Super Admin Yap
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Super Admin Yönetimi</h2>
          <p className="text-slate-600">Kullanıcıları super admin yapın</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Hata') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}

        {/* Current Super Admins */}
        <div className="bg-white rounded-xl shadow-lg mb-8 border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">Mevcut Super Adminler ({superAdmins.length})</h3>
          </div>
          
          <div className="p-6">
            {superAdmins.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👑</div>
                <h3 className="text-xl font-medium text-slate-800 mb-2">Henüz super admin yok</h3>
                <p className="text-slate-600">Yeni super admin eklemek için aşağıdaki formu kullanın.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {superAdmins.map((admin) => (
                  <div key={admin.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-800">👑 {admin.email}</h4>
                      <button 
                        onClick={() => removeSuperAdmin(admin.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <p>📧 {admin.email}</p>
                      <p>🏢 {admin.businesses?.name || 'Bilinmeyen İşletme'}</p>
                      <p>📍 {admin.businesses?.district || 'Bilinmeyen İlçe'}</p>
                      <p>📅 Üyelik: {new Date(admin.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Make Super Admin Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Yeni Super Admin Yap</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-posta Adresi *</label>
              <input 
                type="email" 
                value={newSuperAdmin.email}
                onChange={(e) => setNewSuperAdmin({...newSuperAdmin, email: e.target.value})}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-slate-500 focus:border-slate-500 transition-all duration-200" 
                placeholder="ayca@gmail.com" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">İşletme *</label>
              <select 
                value={newSuperAdmin.business_id}
                onChange={(e) => setNewSuperAdmin({...newSuperAdmin, business_id: e.target.value})}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-slate-500 focus:border-slate-500 transition-all duration-200"
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
            <div className="md:col-span-2">
              <button 
                type="submit" 
                disabled={submitting}
                className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-all duration-200"
              >
                {submitting ? 'İşleniyor...' : 'Super Admin Yap'}
              </button>
            </div>
          </form>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">ℹ️ Bilgilendirme</h3>
          <ul className="text-slate-700 space-y-1">
            <li>• Super admin yapılan kullanıcılar kendi işletmelerini yönetebilir</li>
            <li>• Super adminler personel ekleyebilir, hizmet oluşturabilir</li>
            <li>• Super adminler randevuları görüntüleyebilir ve yönetebilir</li>
            <li>• Sadece owner (siz) super admin yetkisi verebilir</li>
            <li>• Kullanıcı önce sisteme kayıt olmalı, sonra super admin yapılmalı</li>
          </ul>
        </div>
      </main>
    </div>
  );
}