'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

function AppointmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('id');
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (appointmentId) {
      loadAppointment();
    } else {
      setError('Randevu ID bulunamadı');
      setLoading(false);
    }
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services (
            name,
            duration_minutes,
            price_cents,
            businesses (
              name,
              address,
              phone,
              email
            )
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (error) throw error;

      setAppointment(data);
    } catch (err) {
      console.error('Randevu yükleme hatası:', err);
      setError('Randevu bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Hata</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Randevunuz Oluşturuldu!</h1>
            <p className="text-gray-600">
              Randevunuz başarıyla kaydedildi. İşletme en kısa sürede randevunuzu onaylayacaktır.
            </p>
          </div>

          {/* Appointment Details */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Randevu Detayları</h2>
            
            <div className="space-y-4">
              {/* Business */}
              <div className="flex items-start">
                <div className="flex-shrink-0 w-24 text-gray-600 font-medium">İşletme:</div>
                <div className="flex-1">
                  <p className="text-gray-900 font-semibold">
                    {appointment.services?.businesses?.name || 'Bilinmiyor'}
                  </p>
                  {appointment.services?.businesses?.address && (
                    <p className="text-sm text-gray-600 mt-1">
                      📍 {appointment.services.businesses.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Service */}
              <div className="flex items-start">
                <div className="flex-shrink-0 w-24 text-gray-600 font-medium">Hizmet:</div>
                <div className="flex-1">
                  <p className="text-gray-900">{appointment.services?.name || 'Bilinmiyor'}</p>
                  <p className="text-sm text-gray-600">
                    ⏱️ {appointment.services?.duration_minutes} dakika
                  </p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-start">
                <div className="flex-shrink-0 w-24 text-gray-600 font-medium">Tarih:</div>
                <div className="flex-1">
                  <p className="text-gray-900">
                    📅 {new Date(appointment.appointment_date).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-gray-900 mt-1">
                    🕐 {appointment.appointment_time}
                  </p>
                </div>
              </div>

              {/* Price */}
              {appointment.services?.price_cents && (
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-24 text-gray-600 font-medium">Ücret:</div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-semibold">
                      💰 {appointment.services.price_cents / 100} TL
                    </p>
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div className="flex items-start">
                <div className="flex-shrink-0 w-24 text-gray-600 font-medium">Müşteri:</div>
                <div className="flex-1">
                  <p className="text-gray-900">{appointment.customer_name}</p>
                  <p className="text-sm text-gray-600">📧 {appointment.customer_email}</p>
                  <p className="text-sm text-gray-600">📞 {appointment.customer_phone}</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start">
                <div className="flex-shrink-0 w-24 text-gray-600 font-medium">Durum:</div>
                <div className="flex-1">
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    {appointment.status === 'bekleme' ? '⏳ Onay Bekliyor' : appointment.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          {appointment.services?.businesses && (
            <div className="border-t border-gray-200 mt-6 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">İletişim Bilgileri</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {appointment.services.businesses.phone && (
                  <p className="text-gray-700">
                    📞 <a href={`tel:${appointment.services.businesses.phone}`} className="hover:text-emerald-600">
                      {appointment.services.businesses.phone}
                    </a>
                  </p>
                )}
                {appointment.services.businesses.email && (
                  <p className="text-gray-700">
                    📧 <a href={`mailto:${appointment.services.businesses.email}`} className="hover:text-emerald-600">
                      {appointment.services.businesses.email}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Important Note */}
          <div className="border-t border-gray-200 mt-6 pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>📌 Önemli:</strong> İşletme randevunuzu onayladıktan sonra size e-posta ile bilgilendirme yapılacaktır. 
                Herhangi bir sorunuz olması durumunda yukarıdaki iletişim bilgilerinden işletme ile iletişime geçebilirsiniz.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-block bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors border-2 border-emerald-600 text-center"
          >
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/book"
            className="inline-block bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-center"
          >
            Yeni Randevu Al
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Yükleniyor...</p></div>}>
      <AppointmentContent />
    </Suspense>
  );
}

