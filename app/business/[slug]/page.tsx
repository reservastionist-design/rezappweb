'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Business {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price_cents: number;
  active: boolean;
}

export default function BusinessPage() {
  const params = useParams();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.slug) {
      loadBusiness();
    }
  }, [params.slug]);

  const loadBusiness = async () => {
    try {
      setLoading(true);
      setError(null);

      // Business bilgilerini al
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', params.slug)
        .single();

      if (businessError) {
        console.error('Business yüklenemedi:', businessError);
        setError('İşletme bulunamadı');
        return;
      }

      if (!businessData) {
        setError('İşletme bulunamadı');
        return;
      }

      setBusiness(businessData);

      // Business'a ait hizmetleri al
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessData.id)
        .eq('active', true)
        .order('name', { ascending: true });

      if (servicesError) {
        console.error('Services yüklenemedi:', servicesError);
      } else {
        setServices(servicesData || []);
      }

    } catch (error) {
      console.error('Business page error:', error);
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">İşletme Bulunamadı</h1>
          <p className="text-gray-600 mb-6">{error || 'Aradığınız işletme mevcut değil.'}</p>
          <Link 
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
              {business.city && business.district && (
                <p className="text-gray-600 mt-1">
                  📍 {business.city} / {business.district}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900"
              >
                Ana Sayfa
              </Link>
              <Link 
                href="/book" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Randevu Al
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Business Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Hakkımızda</h2>
              {business.description ? (
                <p className="text-gray-700 leading-relaxed">{business.description}</p>
              ) : (
                <p className="text-gray-500 italic">Açıklama eklenmemiş.</p>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">İletişim Bilgileri</h2>
              <div className="space-y-2">
                {business.address && (
                  <div className="flex items-start">
                    <span className="text-gray-500 mr-2">📍</span>
                    <span className="text-gray-700">{business.address}</span>
                  </div>
                )}
                {business.phone && (
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">📞</span>
                    <a href={`tel:${business.phone}`} className="text-blue-600 hover:text-blue-800">
                      {business.phone}
                    </a>
                  </div>
                )}
                {business.email && (
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">✉️</span>
                    <a href={`mailto:${business.email}`} className="text-blue-600 hover:text-blue-800">
                      {business.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Hizmetlerimiz</h2>
          
          {services.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔧</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Henüz hizmet eklenmemiş</h3>
              <p className="text-gray-600">Yakında hizmetlerimiz burada görünecek.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                  {service.description && (
                    <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {service.duration_minutes} dakika
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {service.price_cents / 100} ₺
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Randevu Almaya Hazır mısınız?
            </h3>
            <p className="text-gray-600 mb-4">
              Hizmetlerimizden birini seçin ve randevunuzu oluşturun.
            </p>
            <Link
              href="/book"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors inline-block"
            >
              Randevu Al
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
