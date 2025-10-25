'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  business_id: string;
}

interface Business {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  services: Service[];
}

interface Staff {
  id: string;
  name: string;
  business_id: string;
}

interface StaffAvailability {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function BookPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Customer information
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [kvkkConsent, setKvkkConsent] = useState(false);
  const [etkConsent, setEtkConsent] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      
      // Doğrudan Supabase'den public verileri al (RLS public okumaya izin veriyor)
      const { data: businessesData, error: businessesError } = await supabase
        .from('businesses')
        .select(`
          id, 
          name, 
          address, 
          phone, 
          email,
          services (
            id,
            name,
            duration_minutes,
            price_cents,
            active
          )
        `)
        .order('created_at', { ascending: false });
      
      if (businessesError) {
        console.error('🔍 Businesses error:', businessesError);
        setError('İşletmeler yüklenemedi: ' + businessesError.message);
        return;
      }
      
      const allServices: Service[] = [];
      const allBusinesses: Business[] = [];
      
      (businessesData || []).forEach((business: any) => {
        if (business.services && business.services.length > 0) {
          // Sadece aktif hizmetleri ekle
          const activeServices = business.services.filter((s: any) => s.active);
          if (activeServices.length > 0) {
            allBusinesses.push({...business, services: activeServices});
            activeServices.forEach((service: any) => {
              allServices.push({
                ...service,
                business_id: business.id
              });
            });
          }
        }
      });
      
      setServices(allServices);
      setBusinesses(allBusinesses);
      
    } catch (err) {
      console.error('🔍 Load services error:', err);
      setError('Hizmetler yüklenirken hata oluştu: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async (serviceId: string) => {
    try {
      // Önce staff_services tablosundan staff_id'leri al
      const { data: staffServices, error: staffServicesError } = await supabase
        .from('staff_services')
        .select('staff_id')
        .eq('service_id', serviceId);

      if (staffServicesError) throw staffServicesError;

      if (!staffServices || staffServices.length === 0) {
        setStaff([]);
        return;
      }

      // Sonra staff tablosundan detayları al
      const staffIds = staffServices.map(item => item.staff_id);
      const { data: staffList, error: staffError } = await supabase
        .from('staff')
        .select('id, name, business_id')
        .in('id', staffIds);

      if (staffError) throw staffError;

      setStaff(staffList || []);
    } catch (err) {
      console.error('Staff yükleme hatası:', err);
      setError('Personel bilgileri yüklenemedi');
    }
  };

  const loadAvailableSlots = async (staffId: string, date: string) => {
    try {
      // Kullanıcının yerel zamanını al (Türkiye'deyse zaten UTC+3)
      const now = new Date();
      
      // Seçilen tarihi local time olarak parse et (timezone sorunlarını önlemek için)
      const [year, month, day] = date.split('-').map(Number);
      const selectedDateObj = new Date(year, month - 1, day);
      
      // Geçmiş tarihleri engelle
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const selectedDateOnly = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate());
      
      if (selectedDateOnly < today) {
        setAvailableSlots([]);
        setError('Geçmiş tarihler için randevu alınamaz');
        return;
      }
      
      const dayOfWeek = selectedDateObj.getDay();
      // JavaScript getDay: 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
      // DB'de de aynı: 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
      // Hiçbir dönüşüm gerekmiyor!

      const { data: availability, error } = await supabase
        .from('staff_availability')
        .select('*')
        .eq('staff_id', staffId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (error) throw error;

      if (!availability || availability.length === 0) {
        setAvailableSlots([]);
        setError('Bu personel için seçilen günde müsaitlik bulunmamaktadır');
        return;
      }

      // Generate time slots based on service duration
      const slots: TimeSlot[] = [];
      const serviceDuration = selectedService?.duration_minutes || 60; // minutes

      availability.forEach((slot) => {
        const startTime = new Date(`2000-01-01T${slot.start_time}`);
        const endTime = new Date(`2000-01-01T${slot.end_time}`);
        
        let currentTime = new Date(startTime);
        
        while (currentTime < endTime) {
          const timeString = currentTime.toTimeString().slice(0, 5);
          
          // Bugün için geçmiş saatleri ve 1 saat içindeki saatleri engelle
          const isToday = selectedDateOnly.getTime() === today.getTime();
          if (isToday) {
            const [hours, minutes] = timeString.split(':').map(Number);
            // Slot zamanını bugünün tarihi ile birleştir
            const slotTime = new Date(today);
            slotTime.setHours(hours, minutes, 0, 0);
            
            // Minimum randevu zamanı: şu andan 1 saat sonra
            const minimumBookingTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 saat sonra
            
            // Slot zamanı minimum booking time'dan önceyse skip et
            if (slotTime.getTime() < minimumBookingTime.getTime()) {
              currentTime = new Date(currentTime.getTime() + serviceDuration * 60000);
              continue; // Skip time slots less than 1 hour from now
            }
          }
          
          slots.push({
            time: timeString,
            available: true
          });
          
          currentTime = new Date(currentTime.getTime() + serviceDuration * 60000);
        }
      });

      if (slots.length === 0) {
        setError('Bu tarih için müsait zaman dilimi bulunmamaktadır');
      } else {
        setError(''); // Clear error if slots are found
      }
      
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Müsaitlik yükleme hatası:', err);
      setAvailableSlots([]);
      setError('Müsaitlik bilgileri yüklenirken hata oluştu');
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    const business = businesses.find(b => b.id === service.business_id);
    setSelectedBusiness(business || null);
    loadStaff(service.id);
    setStep(2);
  };

  const handleStaffSelect = (staff: Staff) => {
    setSelectedStaff(staff);
    setStep(3);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    if (selectedStaff) {
      loadAvailableSlots(selectedStaff.id, date);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(4);
    
    // Auto scroll to customer information
    setTimeout(() => {
      const customerSection = document.querySelector('[data-customer-section]');
      if (customerSection) {
        customerSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const createAppointment = async () => {
    if (!selectedService || !selectedBusiness || !selectedStaff || !selectedDate || !selectedTime) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    if (!customerName || !customerEmail || !customerPhone) {
      setError('Lütfen müşteri bilgilerini doldurun');
      return;
    }

    if (!kvkkConsent) {
      setError('KVKK onayı zorunludur');
      return;
    }

    try {
      const appointmentData = {
        customer_name: customerName,
        customer_email: customerEmail.trim().toLowerCase(),
        customer_phone: customerPhone,
        service_id: selectedService.id,
        business_id: selectedBusiness.id,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        status: 'bekleme',
        notes: `Hizmet: ${selectedService.name}, Süre: ${selectedService.duration_minutes} dakika`
      };

      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (error) throw error;

      // Create or update customer profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
          role: 'customer',
          kvkk_consent: kvkkConsent,
          etk_consent: etkConsent,
          consent_date: new Date().toISOString()
        }, {
          onConflict: 'email'
        });

      if (profileError) {
        console.error('Profile oluşturma hatası:', profileError);
      }

      // Redirect to confirmation page
      setTimeout(() => {
        router.push(`/appointment-confirmation?id=${newAppointment.id}`);
      }, 2000);

      setStep(5);
    } catch (err) {
      console.error('Randevu oluşturma hatası:', err);
      setError('Randevu oluşturulurken hata oluştu');
    }
  };

  const getWeekDates = () => {
    // Bugünden başlayarak 7 gün göster
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const dates = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const formatDate = (date: Date) => {
    // Local date formatı: YYYY-MM-DD (UTC timezone sorunlarını önlemek için)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (date: Date) => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()]
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Hizmetler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-600">📅 Randevu Al</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">İstediğiniz hizmeti seçin ve randevunuzu oluşturun</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link 
                href="/" 
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
              >
                Ana Sayfa
              </Link>
              <Link 
                href="/login" 
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm sm:text-base"
              >
                Giriş Yap
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">

        {/* Progress Steps */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 ${
                    step > stepNumber ? 'bg-emerald-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Hizmet Seçin</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{service.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-600 font-semibold">{service.price_cents / 100}₺</span>
                    <span className="text-gray-500 text-sm">{service.duration_minutes} dk</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Staff Selection */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Personel Seçin</h2>
              <button
                onClick={() => setStep(1)}
                className="text-emerald-600 hover:text-emerald-700"
              >
                ← Geri
              </button>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Seçilen Hizmet:</strong> {selectedService?.name} ({selectedService?.duration_minutes} dakika)
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staff.map((staffMember) => (
                <div
                  key={staffMember.id}
                  onClick={() => handleStaffSelect(staffMember)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all"
                >
                  <h3 className="font-semibold text-gray-900">{staffMember.name}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Date and Time Selection */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Tarih ve Saat Seçin</h2>
              <button
                onClick={() => setStep(2)}
                className="text-emerald-600 hover:text-emerald-700"
              >
                ← Geri
              </button>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Personel:</strong> {selectedStaff?.name}
              </p>
            </div>

            {/* Weekly Calendar */}
            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-medium mb-3">Tarih Seçin</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
                {getWeekDates().map((date) => {
                  const dateStr = formatDate(date);
                  const dateDisplay = formatDateDisplay(date);
                  const isSelected = selectedDate === dateStr;
                  
                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleDateSelect(dateStr)}
                      className={`p-2 sm:p-3 rounded-lg border text-center ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white border-gray-300 hover:border-emerald-500'
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-medium">{dateDisplay.day}</div>
                      <div className="text-base sm:text-lg font-bold">{dateDisplay.date}</div>
                      <div className="text-xs">{dateDisplay.month}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <h3 className="text-base sm:text-lg font-medium mb-3">Saat Seçin</h3>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => handleTimeSelect(slot.time)}
                        className={`p-2 sm:p-3 rounded-lg border text-center text-sm sm:text-base ${
                          slot.available
                            ? 'bg-white border-gray-300 hover:border-emerald-500 hover:bg-emerald-50'
                            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!slot.available}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Bu tarihte müsaitlik bulunamadı.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Customer Information */}
        {step === 4 && (
          <div className="bg-white rounded-lg shadow-md p-6" data-customer-section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Müşteri Bilgileri</h2>
              <button
                onClick={() => setStep(3)}
                className="text-emerald-600 hover:text-emerald-700"
              >
                ← Geri
              </button>
            </div>

            {/* Appointment Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Randevu Özeti</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Hizmet:</strong> {selectedService?.name}</p>
                <p><strong>Personel:</strong> {selectedStaff?.name}</p>
                <p><strong>Tarih:</strong> {selectedDate}</p>
                <p><strong>Saat:</strong> {selectedTime}</p>
                <p><strong>Süre:</strong> {selectedService?.duration_minutes} dakika</p>
                <p><strong>Ücret:</strong> {(selectedService?.price_cents || 0) / 100}₺</p>
              </div>
            </div>

            {/* Customer Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta *
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* KVKK Consent */}
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="kvkk"
                  checked={kvkkConsent}
                  onChange={(e) => setKvkkConsent(e.target.checked)}
                  className="mt-1"
                  required
                />
                <label htmlFor="kvkk" className="text-sm text-gray-700">
                  <a href="/kvkk" target="_blank" className="text-emerald-600 hover:underline">
                    KVKK Aydınlatma Metni
                  </a>'ni okudum ve kabul ediyorum. *
                </label>
              </div>

              {/* ETK Consent */}
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="etk"
                  checked={etkConsent}
                  onChange={(e) => setEtkConsent(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="etk" className="text-sm text-gray-700">
                  <a href="/etk" target="_blank" className="text-emerald-600 hover:underline">
                    ETK Aydınlatma Metni
                  </a>'ni okudum ve kabul ediyorum.
                </label>
              </div>

              <button
                onClick={createAppointment}
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 transition-colors font-medium"
              >
                Randevuyu Onayla
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-emerald-600 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Randevunuz Alındı!</h2>
            <p className="text-gray-600 mb-4">
              Randevu detaylarınız e-posta adresinize gönderilecektir.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-emerald-600 text-white py-2 px-6 rounded-md hover:bg-emerald-700 transition-colors"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
