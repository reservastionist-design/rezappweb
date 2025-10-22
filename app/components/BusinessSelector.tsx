'use client';

import { useState, useEffect } from 'react';

interface Business {
  id: string;
  name: string;
  slug: string;
  city?: string;
  district?: string;
}

interface BusinessSelectorProps {
  selectedBusinessId: string | null;
  onBusinessChange: (businessId: string) => void;
}

export default function BusinessSelector({ selectedBusinessId, onBusinessChange }: BusinessSelectorProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      // Supabase client'ı import et
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No access token');
        return;
      }

      const response = await fetch('/api/businesses', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        setBusinesses(result.data);
        
        // İlk business'i otomatik seç
        if (!selectedBusinessId && result.data.length > 0) {
          onBusinessChange(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('Load businesses error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <p className="text-gray-500">İşletmeler yükleniyor...</p>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Size atanmış işletme bulunamadı. Owner ile iletişime geçin.</p>
      </div>
    );
  }

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">İşletme Seç:</label>
          <select
            value={selectedBusinessId || ''}
            onChange={(e) => onBusinessChange(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
                {business.city && business.district && ` (${business.city} / ${business.district})`}
              </option>
            ))}
          </select>
        </div>
        
        {selectedBusiness && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Seçili:</span> {selectedBusiness.name}
          </div>
        )}
      </div>
    </div>
  );
}

