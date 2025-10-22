'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function BusinessRegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: '',
    district: '',
    businessName: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const categories = [
    { name: 'Berber', slug: 'barber' },
    { name: 'Tenis Kortu', slug: 'tennis-court' },
    { name: 'Güzellik Salonu', slug: 'beauty-salon' },
    { name: 'Spor Salonu', slug: 'gym' },
  ];

  const istanbulDistricts = [
    'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir',
    'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy',
    'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane',
    'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli',
    'Sultangazi', 'Şile', 'Şişli', 'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu'
  ];

  const handleStep1 = () => {
    if (!formData.category || !formData.district) {
      setError('Lütfen kategori ve ilçe seçin');
      return;
    }
    setStep(2);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Mevcut kullanıcıyı al
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Lütfen önce giriş yapın');
        setLoading(false);
        return;
      }

      // Business oluştur
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          owner_id: session.user.id,
          name: formData.businessName,
          category: formData.category,
          district: formData.district,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website
        })
        .select()
        .single();

      if (businessError) {
        setError(`İşletme oluşturma hatası: ${businessError.message}`);
        setLoading(false);
        return;
      }

      // Profile'ı business_owner olarak güncelle
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'business_owner',
          business_id: business.id
        })
        .eq('auth_user_id', session.user.id);

      if (profileError) {
        setError(`Profil güncelleme hatası: ${profileError.message}`);
        setLoading(false);
        return;
      }

      // İşletme paneline yönlendir
      router.push('/business');
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-8">İşletme Kaydı</h1>
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                step >= 1 ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-2 ${
                step >= 2 ? 'bg-blue-500' : 'bg-gray-300'
              }`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                step >= 2 ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                2
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Kategori & İlçe</span>
              <span>İşletme Bilgileri</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">İşletme Kategorisi ve Konumu</h2>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  İşletme Kategorisi
                </label>
                <select
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="">Kategori Seçin</option>
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  İstanbul İlçesi
                </label>
                <select
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.district}
                  onChange={(e) => setFormData({...formData, district: e.target.value})}
                >
                  <option value="">İlçe Seçin</option>
                  {istanbulDistricts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleStep1}
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Devam Et
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <h2 className="text-xl font-semibold mb-6">İşletme Bilgileri</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  İşletme Adı
                </label>
                <input
                  type="text"
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.businessName}
                  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Adres
                </label>
                <textarea
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Website (Opsiyonel)
                </label>
                <input
                  type="url"
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                >
                  {loading ? 'Kaydediliyor...' : 'İşletmeyi Kaydet'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}