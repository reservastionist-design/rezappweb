'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import CustomerBusinessSelector from '@/app/components/CustomerBusinessSelector';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDistricts();
  }, []);

  useEffect(() => {
    if (selectedDistrict) {
      loadBusinessesByDistrict();
    } else {
      setBusinesses([]);
      setSelectedBusinessId(null);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    loadServices();
  }, [selectedBusinessId]);

  const loadDistricts = async () => {
    try {
      const response = await fetch('/api/businesses/public');
      const result = await response.json();
      
      if (result.success && result.data) {
        const uniqueDistricts = [...new Set(result.data.map((b: any) => b.district).filter(Boolean))] as string[];
        setDistricts(uniqueDistricts.sort());
      }
    } catch (error) {
      console.error('Districts yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessesByDistrict = async () => {
    if (!selectedDistrict) return;

    try {
      const response = await fetch('/api/businesses/public');
      const result = await response.json();
      
      if (result.success && result.data) {
        const districtBusinesses = result.data.filter((b: any) => b.district === selectedDistrict);
        setBusinesses(districtBusinesses);
        
        // İlk işletmeyi otomatik seç
        if (districtBusinesses.length > 0) {
          setSelectedBusinessId(districtBusinesses[0].id);
        }
      }
    } catch (error) {
      console.error('Businesses yüklenemedi:', error);
    }
  };

  const loadServices = async () => {
    if (!selectedBusinessId) {
      setServices([]);
      return;
    }

    try {
      const { data: services, error } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .eq('business_id', selectedBusinessId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Services yüklenemedi:', error);
        return;
      }

      setServices(services || []);
    } catch (error) {
      console.error('Services yüklenemedi:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Hizmetlerimiz</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Size en iyi hizmeti sunmak için çeşitli seçenekler sunuyoruz. 
            Hizmetlerimizi inceleyin ve randevunuzu oluşturun.
          </p>
        </div>

        {/* İlçe Seçimi */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            İlçe Seçin
          </label>
          <select
            value={selectedDistrict || ''}
            onChange={(e) => {
              setSelectedDistrict(e.target.value || null);
              setSelectedBusinessId(null);
            }}
            className="w-full max-w-md border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">İlçe seçin...</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        {/* İşletme Seçimi */}
        {selectedDistrict && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İşletme Seçin
            </label>
            {businesses.length > 0 ? (
              <select
                value={selectedBusinessId || ''}
                onChange={(e) => setSelectedBusinessId(e.target.value || null)}
                className="w-full max-w-md border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">İşletme seçin...</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-md max-w-md">
                {selectedDistrict} ilçesinde henüz işletme bulunmuyor.
              </div>
            )}
          </div>
        )}

        {!selectedDistrict ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">İlçe Seçin</h3>
            <p className="text-gray-600">Hizmetleri görmek için önce bir ilçe seçin.</p>
          </div>
        ) : !selectedBusinessId ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">İşletme Seçin</h3>
            <p className="text-gray-600">Hizmetleri görmek için önce bir işletme seçin.</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Henüz hizmet eklenmemiş</h3>
            <p className="text-gray-600">Yakında hizmetlerimiz burada görünecek.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span className="text-sm text-green-600 font-medium">Aktif</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{service.duration_minutes} dakika</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Kapasite: {service.capacity || 1} kişi</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span className="text-lg font-semibold text-gray-900">{service.price_cents / 100} ₺</span>
                    </div>
                  </div>

                  <Link
                    href="/book"
                    className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Randevu Al
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Hangi hizmeti arıyorsunuz?
            </h2>
            <p className="text-gray-600 mb-6">
              Aradığınız hizmeti bulamadınız mı? Bizimle iletişime geçin, 
              size özel çözümler sunalım.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/book"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Randevu Al
              </Link>
              <a
                href="tel:+905321234567"
                className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
              >
                Bizi Arayın
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}