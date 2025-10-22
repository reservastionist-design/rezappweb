'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SuperAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  
  const [newBusinessOwner, setNewBusinessOwner] = useState({
    email: ''
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

      // Sadece owner erişebilir
      const isOwnerCheck = session.user.email === 'furkanaydemirie@gmail.com';
      setIsOwner(isOwnerCheck);
      
      if (!isOwnerCheck) {
        router.push('/');
        return;
      }

      await loadUsers();
    } catch (error) {
      console.error('User check error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };


  const loadUsers = async () => {
    try {
      // Sadece business_owner rolündeki kullanıcıları getir
      const { data: users, error } = await supabase
        .from('profiles')
        .select(`
          *,
          businesses!profiles_business_id_fkey (
            name,
            district
          )
        `)
        .eq('role', 'business_owner')
        .order('email', { ascending: true });

      if (error) {
        console.error('Users load error:', error);
        return;
      }

      console.log('Business owners loaded:', users);
      setUsers(users || []);
    } catch (error) {
      console.error('Users load error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      console.log('Adding business owner:', newBusinessOwner.email);
      
      // Önce profil var mı kontrol et
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newBusinessOwner.email)
        .single();

      console.log('Existing profile:', existingProfile);

      if (existingProfile) {
        // Profil varsa güncelle
        console.log('Updating existing profile');
        const { error } = await supabase
          .from('profiles')
          .update({
            role: 'business_owner',
            business_id: null
          })
          .eq('email', newBusinessOwner.email);

        if (error) {
          console.error('Update error:', error);
          setMessage('Hata: ' + error.message);
          return;
        }
      } else {
        // Profil yoksa oluştur
        console.log('Creating new profile');
        const { error } = await supabase
          .from('profiles')
          .insert({
            email: newBusinessOwner.email,
            role: 'business_owner',
            business_id: null,
            auth_user_id: null
          });

        if (error) {
          console.error('Insert error:', error);
          setMessage('Hata: ' + error.message);
          return;
        }
      }

      setMessage('Kullanıcı başarıyla business owner yapıldı!');
      setNewBusinessOwner({
        email: ''
      });
      setShowAddForm(false);
      await loadUsers();
    } catch (error) {
      console.error('Business owner yapma hatası:', error);
      setMessage('Hata: ' + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const removeBusinessOwner = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı business owner olmaktan çıkarmak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'customer'
        })
        .eq('id', userId);

      if (error) {
        setMessage('Hata: ' + error.message);
        return;
      }

      setMessage('Kullanıcı business owner olmaktan çıkarıldı!');
      await loadUsers();
    } catch (error) {
      console.error('Business owner çıkarma hatası:', error);
      setMessage('Hata: ' + (error as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erişim Reddedildi</h1>
          <p className="text-gray-600 mb-4">Bu sayfaya erişim yetkiniz yok.</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
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
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-slate-700">👑 Business Owner Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Hoş geldin, {user?.email}</span>
              <Link 
                href="/admin" 
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Admin Panel
              </Link>
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
                className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Business Owner Panel</h1>
          <p className="mt-2 text-gray-600">Business owner'ları yönetin</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.includes('Hata') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Business Owner'lar</h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {showAddForm ? 'İptal' : 'Yeni Business Owner Ekle'}
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    E-posta Adresi
                  </label>
                  <input
                    type="email"
                    required
                    value={newBusinessOwner.email}
                    onChange={(e) => setNewBusinessOwner({...newBusinessOwner, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="kullanici@example.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Ekleniyor...' : 'Business Owner Yap'}
                </button>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-posta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşletme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-4xl mb-4">👥</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz business owner eklenmemiş</h3>
                      <p className="text-gray-600">Yeni business owner eklemek için yukarıdaki butonu kullanın.</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.businesses ? (
                          <div>
                            <div className="font-medium">{user.businesses.name}</div>
                            <div className="text-gray-500 text-xs">{user.businesses.district}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">İşletme atanmamış</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => removeBusinessOwner(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Kaldır
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800">
            ← Admin Paneline Dön
          </Link>
        </div>
      </div>
    </div>
  );
}