'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function BusinessSetupPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  // İşletme bilgileri
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    description: '',
    address: '',
    district: '',
    phone: '',
    email: '',
    working_hours_start: '09:00',
    working_hours_end: '18:00'
  });

  // Business Owner bilgileri
  const [ownerInfo, setOwnerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Hizmetler
  const [services, setServices] = useState([
    { name: '', duration_minutes: 30, price_cents: 0, description: '' }
  ]);

  // Personeller
  const [staff, setStaff] = useState([
    { name: '', email: '', phone: '', services: [] }
  ]);

  // Müsaitlikler
  const [availability, setAvailability] = useState([
    { day_of_week: 1, start_time: '09:00', end_time: '18:00', is_active: true }
  ]);

  const addService = () => {
    setServices([...services, { name: '', duration_minutes: 30, price_cents: 0, description: '' }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: string, value: any) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const addStaff = () => {
    setStaff([...staff, { name: '', email: '', phone: '', services: [] }]);
  };

  const removeStaff = (index: number) => {
    setStaff(staff.filter((_, i) => i !== index));
  };

  const updateStaff = (index: number, field: string, value: any) => {
    const updated = [...staff];
    updated[index] = { ...updated[index], [field]: value };
    setStaff(updated);
  };

  const addAvailability = () => {
    setAvailability([...availability, { day_of_week: 1, start_time: '09:00', end_time: '18:00', is_active: true }]);
  };

  const removeAvailability = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const updateAvailability = (index: number, field: string, value: any) => {
    const updated = [...availability];
    updated[index] = { ...updated[index], [field]: value };
    setAvailability(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Business Owner profilini oluştur
      const { data: ownerProfile, error: ownerError } = await supabase
        .from('profiles')
        .insert({
          email: ownerInfo.email,
          full_name: ownerInfo.name,
          role: 'business_owner',
          auth_user_id: null
        })
        .select()
        .single();

      if (ownerError) {
        throw new Error('Business Owner oluşturma hatası: ' + ownerError.message);
      }

      // 2. İşletmeyi oluştur
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: businessInfo.name,
          description: businessInfo.description,
          address: businessInfo.address,
          district: businessInfo.district,
          phone: businessInfo.phone,
          email: businessInfo.email,
          working_hours_start: businessInfo.working_hours_start,
          working_hours_end: businessInfo.working_hours_end,
          business_owner_id: ownerProfile.id,
          slug: businessInfo.name.toLowerCase().replace(/\s+/g, '-')
        })
        .select()
        .single();

      if (businessError) {
        throw new Error('İşletme oluşturma hatası: ' + businessError.message);
      }

      // 3. Hizmetleri oluştur
      const servicesData = services.map(service => ({
        name: service.name,
        duration_minutes: service.duration_minutes,
        price_cents: service.price_cents,
        description: service.description,
        business_id: business.id
      }));

      const { data: createdServices, error: servicesError } = await supabase
        .from('services')
        .insert(servicesData)
        .select();

      if (servicesError) {
        throw new Error('Hizmetler oluşturma hatası: ' + servicesError.message);
      }

      // 4. Personelleri oluştur
      const staffData = staff.map(staffMember => ({
        name: staffMember.name,
        email: staffMember.email,
        phone: staffMember.phone,
        business_id: business.id
      }));

      const { data: createdStaff, error: staffError } = await supabase
        .from('staff')
        .insert(staffData)
        .select();

      if (staffError) {
        throw new Error('Personel oluşturma hatası: ' + staffError.message);
      }

      // 5. Personel-Hizmet bağlantılarını oluştur
      const staffServicesData = [];
      for (let i = 0; i < staff.length; i++) {
        const staffMember = staff[i];
        const createdStaffMember = createdStaff[i];
        
        // Tüm hizmetleri bu personele ata
        for (const service of createdServices) {
          staffServicesData.push({
            staff_id: createdStaffMember.id,
            service_id: service.id
          });
        }
      }

      if (staffServicesData.length > 0) {
        const { error: staffServicesError } = await supabase
          .from('staff_services')
          .insert(staffServicesData);

        if (staffServicesError) {
          throw new Error('Personel-Hizmet bağlantı hatası: ' + staffServicesError.message);
        }
      }

      // 6. Müsaitlikleri oluştur
      const availabilityData = [];
      for (const staffMember of createdStaff) {
        for (const avail of availability) {
          availabilityData.push({
            staff_id: staffMember.id,
            day_of_week: avail.day_of_week,
            start_time: avail.start_time,
            end_time: avail.end_time,
            is_active: avail.is_active
          });
        }
      }

      if (availabilityData.length > 0) {
        const { error: availabilityError } = await supabase
          .from('staff_availability')
          .insert(availabilityData);

        if (availabilityError) {
          throw new Error('Müsaitlik oluşturma hatası: ' + availabilityError.message);
        }
      }

      setSuccess('İşletme başarıyla kuruldu! Tüm veriler database\'e kaydedildi.');
      setCurrentStep(5);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  if (currentStep === 5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-xl p-8 border border-emerald-100">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">İşletme Kuruldu!</h2>
            <p className="text-gray-600 mb-6">{success}</p>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setCurrentStep(1);
                  setBusinessInfo({
                    name: '',
                    description: '',
                    address: '',
                    district: '',
                    phone: '',
                    email: '',
                    working_hours_start: '09:00',
                    working_hours_end: '18:00'
                  });
                  setOwnerInfo({ name: '', email: '', phone: '' });
                  setServices([{ name: '', duration_minutes: 30, price_cents: 0, description: '' }]);
                  setStaff([{ name: '', email: '', phone: '', services: [] }]);
                  setAvailability([{ day_of_week: 1, start_time: '09:00', end_time: '18:00', is_active: true }]);
                  setSuccess('');
                  setError('');
                }}
                className="block w-full bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Yeni İşletme Kur
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🏢 İşletme Kurulum</h1>
            <p className="text-gray-600">QR kod ile erişilen hızlı işletme kurulum sayfası</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`w-16 h-1 mx-2 ${
                      currentStep > step ? 'bg-emerald-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>İşletme</span>
              <span>Owner</span>
              <span>Hizmetler</span>
              <span>Personel</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}

          {/* Step 1: İşletme Bilgileri */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">1. İşletme Bilgileri</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">İşletme Adı *</label>
                  <input
                    type="text"
                    value={businessInfo.name}
                    onChange={(e) => setBusinessInfo({...businessInfo, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">İlçe *</label>
                  <select
                    value={businessInfo.district}
                    onChange={(e) => setBusinessInfo({...businessInfo, district: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value="">İlçe Seçin</option>
                    <option value="Beşiktaş">Beşiktaş</option>
                    <option value="Beyoğlu">Beyoğlu</option>
                    <option value="Fatih">Fatih</option>
                    <option value="Kadıköy">Kadıköy</option>
                    <option value="Şişli">Şişli</option>
                    <option value="Sarıyer">Sarıyer</option>
                    <option value="Kağıthane">Kağıthane</option>
                    <option value="Üsküdar">Üsküdar</option>
                    <option value="Maltepe">Maltepe</option>
                    <option value="Pendik">Pendik</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adres *</label>
                  <input
                    type="text"
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={businessInfo.phone}
                    onChange={(e) => setBusinessInfo({...businessInfo, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                  <input
                    type="email"
                    value={businessInfo.email}
                    onChange={(e) => setBusinessInfo({...businessInfo, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Çalışma Saati Başlangıç</label>
                  <input
                    type="time"
                    value={businessInfo.working_hours_start}
                    onChange={(e) => setBusinessInfo({...businessInfo, working_hours_start: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Çalışma Saati Bitiş</label>
                  <input
                    type="time"
                    value={businessInfo.working_hours_end}
                    onChange={(e) => setBusinessInfo({...businessInfo, working_hours_end: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                  <textarea
                    value={businessInfo.description}
                    onChange={(e) => setBusinessInfo({...businessInfo, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!businessInfo.name || !businessInfo.district || !businessInfo.address}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki Adım →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Business Owner */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Business Owner Bilgileri</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad *</label>
                  <input
                    type="text"
                    value={ownerInfo.name}
                    onChange={(e) => setOwnerInfo({...ownerInfo, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-posta *</label>
                  <input
                    type="email"
                    value={ownerInfo.email}
                    onChange={(e) => setOwnerInfo({...ownerInfo, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={ownerInfo.phone}
                    onChange={(e) => setOwnerInfo({...ownerInfo, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  ← Önceki Adım
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!ownerInfo.name || !ownerInfo.email}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki Adım →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Hizmetler */}
          {currentStep === 3 && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">3. Hizmetler</h2>
                <button
                  onClick={addService}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                >
                  + Hizmet Ekle
                </button>
              </div>
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Hizmet {index + 1}</h3>
                      {services.length > 1 && (
                        <button
                          onClick={() => removeService(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Sil
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hizmet Adı *</label>
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) => updateService(index, 'name', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Süre (dakika) *</label>
                        <input
                          type="number"
                          value={service.duration_minutes}
                          onChange={(e) => updateService(index, 'duration_minutes', parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          min="15"
                          step="15"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fiyat (kuruş)</label>
                        <input
                          type="number"
                          value={service.price_cents}
                          onChange={(e) => updateService(index, 'price_cents', parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                        <input
                          type="text"
                          value={service.description}
                          onChange={(e) => updateService(index, 'description', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  ← Önceki Adım
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  disabled={services.some(s => !s.name || !s.duration_minutes)}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki Adım →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Personel ve Müsaitlik */}
          {currentStep === 4 && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">4. Personel ve Müsaitlik</h2>
                <button
                  onClick={addStaff}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                >
                  + Personel Ekle
                </button>
              </div>
              
              {/* Personeller */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Personeller</h3>
                <div className="space-y-4">
                  {staff.map((staffMember, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Personel {index + 1}</h4>
                        {staff.length > 1 && (
                          <button
                            onClick={() => removeStaff(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Sil
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad *</label>
                          <input
                            type="text"
                            value={staffMember.name}
                            onChange={(e) => updateStaff(index, 'name', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">E-posta *</label>
                          <input
                            type="email"
                            value={staffMember.email}
                            onChange={(e) => updateStaff(index, 'email', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                          <input
                            type="tel"
                            value={staffMember.phone}
                            onChange={(e) => updateStaff(index, 'phone', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Müsaitlik */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Müsaitlik Zamanları</h3>
                  <button
                    onClick={addAvailability}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                  >
                    + Müsaitlik Ekle
                  </button>
                </div>
                <div className="space-y-4">
                  {availability.map((avail, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Müsaitlik {index + 1}</h4>
                        {availability.length > 1 && (
                          <button
                            onClick={() => removeAvailability(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Sil
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Gün</label>
                          <select
                            value={avail.day_of_week}
                            onChange={(e) => updateAvailability(index, 'day_of_week', parseInt(e.target.value))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                          >
                            <option value={1}>Pazartesi</option>
                            <option value={2}>Salı</option>
                            <option value={3}>Çarşamba</option>
                            <option value={4}>Perşembe</option>
                            <option value={5}>Cuma</option>
                            <option value={6}>Cumartesi</option>
                            <option value={7}>Pazar</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Saati</label>
                          <input
                            type="time"
                            value={avail.start_time}
                            onChange={(e) => updateAvailability(index, 'start_time', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Saati</label>
                          <input
                            type="time"
                            value={avail.end_time}
                            onChange={(e) => updateAvailability(index, 'end_time', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  ← Önceki Adım
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || staff.some(s => !s.name || !s.email)}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Kuruluyor...' : 'İşletmeyi Kur'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
