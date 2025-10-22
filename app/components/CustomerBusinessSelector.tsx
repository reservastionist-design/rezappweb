'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
// UI components removed - using simple HTML elements instead
import { MapPin, ArrowRight, Star, Clock, Building2 } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  slug: string;
  city?: string;
  district?: string;
  description?: string;
}

interface CustomerBusinessSelectorProps {
  selectedBusinessId?: string | null;
  onBusinessChange?: (businessId: string) => void;
  showAsCards?: boolean;
  showDistrictSelector?: boolean;
}

export default function CustomerBusinessSelector({ 
  selectedBusinessId, 
  onBusinessChange,
  showAsCards = false,
  showDistrictSelector = false
}: CustomerBusinessSelectorProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (showDistrictSelector) {
      loadDistricts();
    } else {
      loadBusinesses();
    }
  }, [showDistrictSelector]);

  useEffect(() => {
    if (selectedDistrict) {
      loadBusinessesByDistrict();
    }
  }, [selectedDistrict]);

  const loadDistricts = async () => {
    try {
      const response = await fetch('/api/businesses/public');
      const result = await response.json();
      
      if (result.success && result.data) {
        const uniqueDistricts = [...new Set(result.data.map((b: Business) => b.district).filter(Boolean))] as string[];
        setDistricts(uniqueDistricts.sort());
      }
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinesses = async () => {
    try {
      const response = await fetch('/api/businesses/public');
      const result = await response.json();
      
      if (result.success) {
        setBusinesses(result.data || []);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessesByDistrict = async () => {
    try {
      const response = await fetch('/api/businesses/public');
      const result = await response.json();
      
      if (result.success && result.data) {
        const filteredBusinesses = result.data.filter((b: Business) => b.district === selectedDistrict);
        setBusinesses(filteredBusinesses);
      }
    } catch (error) {
      console.error('Error loading businesses by district:', error);
    }
  };

  const handleBusinessClick = (business: Business) => {
    router.push(`/business/${business.slug}`);
  };

  const renderBusinessCard = (business: Business, index: number) => (
    <motion.div
      key={business.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="hover-lift cursor-pointer"
      onClick={() => handleBusinessClick(business)}
    >
      <div className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white rounded-lg">
        <div className="pb-3 px-6 pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {business.name}
              </h3>
              {business.city && business.district && (
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  {business.city} / {business.district}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium">4.8</span>
            </div>
          </div>
        </div>
        <div className="pt-0 px-6 pb-6">
          {business.description && (
            <p className="text-sm mb-4 text-gray-600">
              {business.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              <span>7/24 Açık</span>
            </div>
            <button className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors">
              Randevu Al
              <ArrowRight className="ml-1 h-3 w-3 inline" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-muted-foreground">Yükleniyor...</span>
      </div>
    );
  }

  if (showAsCards) {
    return (
      <div className="space-y-8">
        {showDistrictSelector && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">İlçe Seçin</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {districts.map((district) => (
                <button
                  key={district}
                  onClick={() => setSelectedDistrict(district)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center ${
                    selectedDistrict === district 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {district}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {businesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business, index) => renderBusinessCard(business, index))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {selectedDistrict ? `${selectedDistrict} ilçesinde` : 'Henüz'} işletme bulunmuyor
            </h3>
            <p className="text-muted-foreground">
              {selectedDistrict ? 'Farklı bir ilçe seçmeyi deneyin' : 'Yakında hizmetinizde olacağız'}
            </p>
          </motion.div>
        )}
      </div>
    );
  }

  // Dropdown version
  return (
    <div className="shadow-lg border-0 bg-white rounded-lg">
      <div className="px-6 pt-6">
        <h2 className="flex items-center text-xl font-semibold">
          <Building2 className="h-5 w-5 mr-2" />
          İşletme Seçin
        </h2>
        <p className="text-gray-600 mt-1">
          Randevu almak istediğiniz işletmeyi seçin
        </p>
      </div>
      <div className="px-6 pb-6">
        {showDistrictSelector && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İlçe Seçin
            </label>
            <select
              value={selectedDistrict || ''}
              onChange={(e) => setSelectedDistrict(e.target.value || null)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Tüm ilçeler</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedDistrict && businesses.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İşletme Seçin
            </label>
            <select
              value={selectedBusinessId || ''}
              onChange={(e) => {
                if (e.target.value && onBusinessChange) {
                  onBusinessChange(e.target.value);
                }
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">İşletme seçin...</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedDistrict && businesses.length === 0 && (
          <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg text-center">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {selectedDistrict} ilçesinde henüz işletme bulunmuyor.
          </div>
        )}

        {!showDistrictSelector && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İşletme Seçin
            </label>
            <select
              value={selectedBusinessId || ''}
              onChange={(e) => {
                if (e.target.value && onBusinessChange) {
                  onBusinessChange(e.target.value);
                }
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">İşletme seçin...</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}