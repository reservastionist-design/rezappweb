'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CustomerAppointments() {
  const [email, setEmail] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searched, setSearched] = useState(false);

  const searchAppointments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage('Lütfen email adresinizi giriniz');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Direkt randevuları email ile ara (profile kontrolü gereksiz - çünkü herkes randevu alabilir)
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services (
            name,
            duration_minutes,
            price_cents,
            businesses (
              name,
              district
            )
          )
        `)
        .eq('customer_email', email.trim().toLowerCase())
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) {
        console.error('Appointments fetch error:', error);
        setMessage('Randevular yüklenirken hata oluştu');
        return;
      }

      setAppointments(appointmentsData || []);
      setSearched(true);
      
      if (!appointmentsData || appointmentsData.length === 0) {
        setMessage('Bu email adresi ile kayıtlı randevu bulunamadı');
      } else {
        setMessage(`${appointmentsData.length} randevu bulundu`);
      }
    } catch (error) {
      console.error('Search error:', error);
      setMessage('Arama sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM formatında
  };

  const formatPrice = (priceCents: number) => {
    return (priceCents / 100).toFixed(2) + ' ₺';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Onaylandı';
      case 'pending':
        return 'Beklemede';
      case 'cancelled':
        return 'İptal Edildi';
      case 'completed':
        return 'Tamamlandı';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Randevu Geçmişim</h1>
          
          {/* Arama Formu */}
          <form onSubmit={searchAppointments} className="mb-8">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Adresiniz
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="randevu@example.com"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? 'Aranıyor...' : 'Randevularımı Bul'}
                </button>
              </div>
            </div>
          </form>

          {/* Mesaj */}
          {message && (
            <div className={`p-4 rounded-md mb-6 ${
              message.includes('bulundu') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {/* Randevu Listesi */}
          {searched && appointments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Randevularım</h2>
              {appointments.map((appointment) => (
                <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {appointment.services?.businesses?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {appointment.services?.name}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Tarih:</span>
                      <p className="text-gray-600">{formatDate(appointment.appointment_date)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Saat:</span>
                      <p className="text-gray-600">{formatTime(appointment.appointment_time)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Süre:</span>
                      <p className="text-gray-600">{appointment.services?.duration_minutes} dk</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Fiyat:</span>
                      <p className="text-gray-600">{formatPrice(appointment.services?.price_cents || 0)}</p>
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">Notlar:</span>
                      <p className="text-gray-600 text-sm">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Yeni Randevu Butonu */}
          <div className="mt-8 text-center">
            <a
              href="/book"
              className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-md hover:bg-emerald-700 transition-colors"
            >
              Yeni Randevu Al
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
