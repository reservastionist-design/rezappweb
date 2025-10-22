'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Leaflet CSS'i import et
import 'leaflet/dist/leaflet.css';

// Dinamik import ile SSR sorununu çöz
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// İstanbul koordinatları
const ISTANBUL_CENTER: [number, number] = [41.0082, 28.9784];
const ISTANBUL_BOUNDS: [[number, number], [number, number]] = [
  [40.8, 28.5], // Güneybatı
  [41.3, 29.5]  // Kuzeydoğu
];

// İlçe koordinatları (örnek)
const DISTRICT_COORDINATES: { [key: string]: [number, number] } = {
  'Beşiktaş': [41.0426, 29.0077],
  'Şişli': [41.0603, 28.9877],
  'Kadıköy': [40.9903, 29.0277],
  'Beyoğlu': [41.0369, 28.9850],
  'Fatih': [41.0056, 28.9769],
  'Üsküdar': [41.0214, 29.0128],
  'Bakırköy': [40.9833, 28.8667],
  'Maltepe': [40.9333, 29.1500],
  'Pendik': [40.8667, 29.2500],
  'Kartal': [40.8833, 29.1833],
  'Ataşehir': [40.9833, 29.1167],
  'Sancaktepe': [40.9833, 29.2167],
  'Sultanbeyli': [40.9667, 29.2667],
  'Sultangazi': [41.1167, 28.8667],
  'Esenler': [41.0500, 28.8500],
  'Bağcılar': [41.0333, 28.8500],
  'Güngören': [41.0167, 28.8667],
  'Zeytinburnu': [41.0000, 28.9000],
  'Bayrampaşa': [41.0167, 28.9167],
  'Eyüpsultan': [41.0500, 28.9333],
  'Gaziosmanpaşa': [41.0667, 28.9167],
  'Esenyurt': [41.0333, 28.6667],
  'Büyükçekmece': [41.0167, 28.5833],
  'Küçükçekmece': [41.0000, 28.7500],
  'Avcılar': [40.9833, 28.7167],
  'Başakşehir': [41.0833, 28.8000],
  'Arnavutköy': [41.1833, 28.7333],
  'Sarıyer': [41.1500, 29.0500],
  'Çatalca': [41.1333, 28.4667],
  'Silivri': [41.0667, 28.2500],
  'Beykoz': [41.1333, 29.1000],
  'Ümraniye': [41.0167, 29.1167],
  'Çekmeköy': [41.0333, 29.1833],
  'Tuzla': [40.8833, 29.3167],
  'Adalar': [40.8667, 29.0833]
};

interface Business {
  id: string;
  name: string;
  district: string;
  address?: string;
  description?: string;
  phone?: string;
  email?: string;
  services?: Service[];
  coordinates?: [number, number];
}

interface Service {
  id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
}

export default function MapPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [services, setServices] = useState<Service[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>(ISTANBUL_CENTER);
  const [mapZoom, setMapZoom] = useState(10);

  useEffect(() => {
    // Leaflet fix'i client-side'da yükle
    if (typeof window !== 'undefined') {
      import('@/lib/leaflet-fix');
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // İşletmeleri ve hizmetlerini yükle
      const { data: businessesData, error: businessesError } = await supabase
        .from('businesses')
        .select(`
          *,
          services (
            id,
            name,
            price_cents,
            duration_minutes
          )
        `);

      if (businessesError) {
        console.error('Businesses yüklenemedi:', businessesError);
        return;
      }

      // Hizmetleri yükle
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (servicesError) {
        console.error('Services yüklenemedi:', servicesError);
        return;
      }

      // Business coordinates'leri yükle
      const businessesWithCoords = await Promise.all(
        (businessesData || []).map(async (business) => {
          const coords = await getBusinessCoordinates(business);
          return { ...business, coordinates: coords };
        })
      );

      setBusinesses(businessesWithCoords);
      setServices(servicesData || []);

      // İlçeleri çıkar
      const uniqueDistricts = [...new Set((businessesData || []).map(b => b.district).filter(Boolean))];
      setDistricts(uniqueDistricts.sort());

    } catch (error) {
      console.error('Data yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBusinesses = () => {
    let filtered = businesses;

    if (selectedService !== 'all') {
      filtered = filtered.filter(business => 
        business.services?.some(service => service.id === selectedService)
      );
    }

    if (selectedDistrict !== 'all') {
      filtered = filtered.filter(business => business.district === selectedDistrict);
    }

    return filtered;
  };

  const getBusinessCoordinates = async (business: Business): Promise<[number, number]> => {
    // Eğer tam adres varsa geocoding dene
    if (business.address && business.address.trim() !== '') {
      try {
        console.log('Geocoding for:', business.name, business.address);
        const response = await fetch(`/api/geocode?address=${encodeURIComponent(business.address)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.lat && data.lng) {
            console.log('Geocoding success:', business.name, data.lat, data.lng);
            return [data.lat, data.lng];
          }
        } else {
          console.log('Geocoding API error:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Geocoding failed for business:', business.name, error);
      }
    }

    // Geocoding başarısız olursa ilçe koordinatlarını kullan
    const districtCoords = DISTRICT_COORDINATES[business.district];
    if (districtCoords) {
      // İlçe merkezinden küçük rastgele offset ekle (daha küçük yapalım)
      const offsetLat = (Math.random() - 0.5) * 0.002; // 0.005'ten 0.002'ye düşürdük
      const offsetLng = (Math.random() - 0.5) * 0.002;
      console.log('Using district coordinates for:', business.name, business.district);
      return [districtCoords[0] + offsetLat, districtCoords[1] + offsetLng];
    }
    
    console.log('Using Istanbul center for:', business.name);
    return ISTANBUL_CENTER;
  };

  const getMarkerColor = (business: Business) => {
    if (selectedService !== 'all') {
      return '#ef4444'; // Kırmızı - seçilen hizmet
    }
    return '#10b981'; // Yeşil - genel
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    if (district !== 'all' && DISTRICT_COORDINATES[district]) {
      setMapCenter(DISTRICT_COORDINATES[district]);
      setMapZoom(13);
    } else {
      setMapCenter(ISTANBUL_CENTER);
      setMapZoom(10);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Harita Yükleniyor...</h2>
          <p className="text-gray-600">İşletmeler ve hizmetler getiriliyor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-emerald-600 hover:text-emerald-800">
                ← Ana Sayfa
              </Link>
              <h1 className="text-2xl font-bold text-emerald-700">🗺️ İstanbul Haritası</h1>
            </div>
            <Link 
              href="/book" 
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all duration-200"
            >
              Randevu Al
            </Link>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white shadow-sm border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Hizmet:</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">Tüm Hizmetler</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.price_cents / 100} TL
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">İlçe:</label>
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">Tüm İlçeler</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600">
              {getFilteredBusinesses().length} işletme bulundu
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-[calc(100vh-140px)]">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          bounds={ISTANBUL_BOUNDS}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {getFilteredBusinesses().map((business) => {
            // Geocoding için state kullan
            const [lat, lng] = business.coordinates || [0, 0];
            return (
              <Marker key={business.id} position={[lat, lng]}>
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{business.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">📍 {business.district}</p>
                    {business.address && (
                      <p className="text-xs text-gray-500 mb-2">🏠 {business.address}</p>
                    )}
                    
                    {business.description && (
                      <p className="text-sm text-gray-700 mb-3">{business.description}</p>
                    )}
                    
                    {business.phone && (
                      <p className="text-sm text-gray-600 mb-1">📞 {business.phone}</p>
                    )}
                    
                    {business.email && (
                      <p className="text-sm text-gray-600 mb-3">📧 {business.email}</p>
                    )}
                    
                    <div className="mb-3">
                      <h4 className="font-medium text-sm text-gray-800 mb-1">Hizmetler:</h4>
                      {business.services && business.services.length > 0 ? (
                        <div className="space-y-1">
                          {business.services.map(service => (
                            <div key={service.id} className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                              {service.name} - {service.price_cents / 100} TL ({service.duration_minutes} dk)
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Hizmet bilgisi yok</p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 mt-3">
                      <Link 
                        href={`/book?business=${business.id}`}
                        className="inline-block bg-emerald-600 text-white text-xs px-3 py-1 rounded hover:bg-emerald-700 transition-colors"
                      >
                        Randevu Al
                      </Link>
                      <button
                        onClick={() => {
                          const [lat, lng] = business.coordinates || [0, 0];
                          const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                          window.open(googleMapsUrl, '_blank');
                        }}
                        className="inline-block bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                      >
                        🧭 Yol Tarifi
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
