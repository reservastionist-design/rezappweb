-- B2B SaaS Randevu Sistemi Veritabanı Şeması

-- Kullanıcı rolleri
CREATE TYPE user_role AS ENUM ('super_admin', 'business_owner', 'staff', 'customer');

-- İşletme kategorileri
CREATE TYPE business_category AS ENUM ('berber', 'tenis_kortu', 'guzellik_salonu', 'spor_salonu', 'diger');

-- İstanbul bölgeleri
CREATE TYPE istanbul_district AS ENUM (
  'adalar', 'arnavutkoy', 'atasehir', 'avcilar', 'bagcilar', 'bahcelievler', 
  'bakirkoy', 'basaksehir', 'bayrampasa', 'besiktas', 'beykoz', 'beylikduzu',
  'beyoglu', 'buyukcekmece', 'catalca', 'cekmekoy', 'esenler', 'esenyurt',
  'fatih', 'gaziosmanpasa', 'gungoren', 'kadikoy', 'kagithane', 'kartal',
  'kucukcekmece', 'maltepe', 'pendik', 'sancaktepe', 'sariyer', 'silivri',
  'sultanbeyli', 'sultangazi', 'sisli', 'tuzla', 'umraniye', 'uskudar',
  'zeytinburnu'
);

-- Kullanıcı profilleri
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  business_id UUID REFERENCES businesses(id),
  kvkk_consent BOOLEAN DEFAULT FALSE,
  etk_consent BOOLEAN DEFAULT FALSE,
  consent_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İşletmeler
CREATE TABLE businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category business_category NOT NULL,
  district istanbul_district NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  description TEXT,
  -- Çalışma saatleri
  monday_start TIME,
  monday_end TIME,
  tuesday_start TIME,
  tuesday_end TIME,
  wednesday_start TIME,
  wednesday_end TIME,
  thursday_start TIME,
  thursday_end TIME,
  friday_start TIME,
  friday_end TIME,
  saturday_start TIME,
  saturday_end TIME,
  sunday_start TIME,
  sunday_end TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personeller
CREATE TABLE staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  specialization TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hizmetler
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personel hizmetleri (hangi personel hangi hizmeti verebilir)
CREATE TABLE staff_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personel müsaitlikleri
CREATE TABLE staff_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Pazar, 6=Cumartesi
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personel müsaitlikleri
CREATE TABLE staff_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Pazar, 6=Cumartesi
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Randevular
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) Politikaları
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Profil politikaları
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = auth_user_id);

-- İşletme politikaları
CREATE POLICY "Anyone can view active businesses" ON businesses FOR SELECT USING (is_active = true);
CREATE POLICY "Business owners can manage their business" ON businesses FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.business_id = businesses.id 
    AND profiles.auth_user_id = auth.uid() 
    AND profiles.role IN ('business_owner', 'super_admin')
  )
);

-- Personel politikaları
CREATE POLICY "Anyone can view active staff" ON staff FOR SELECT USING (is_active = true);
CREATE POLICY "Business owners can manage their staff" ON staff FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.business_id = staff.business_id 
    AND profiles.auth_user_id = auth.uid() 
    AND profiles.role IN ('business_owner', 'super_admin')
  )
);

-- Hizmet politikaları
CREATE POLICY "Anyone can view active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Business owners can manage their services" ON services FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.business_id = services.business_id 
    AND profiles.auth_user_id = auth.uid() 
    AND profiles.role IN ('business_owner', 'super_admin')
  )
);

-- Staff availability politikaları
CREATE POLICY "Staff can manage own availability" ON staff_availability FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.staff_id = staff_availability.staff_id 
    AND profiles.auth_user_id = auth.uid() 
    AND profiles.role = 'staff'
  )
);
CREATE POLICY "Business owners can manage staff availability" ON staff_availability FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.business_id = (
      SELECT business_id FROM staff WHERE staff.id = staff_availability.staff_id
    )
    AND profiles.auth_user_id = auth.uid() 
    AND profiles.role IN ('business_owner', 'super_admin')
  )
);
CREATE POLICY "Anyone can view active availability" ON staff_availability FOR SELECT USING (is_active = true);

-- Randevu politikaları
CREATE POLICY "Customers can create appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Business owners can view their appointments" ON appointments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.business_id = appointments.business_id 
    AND profiles.auth_user_id = auth.uid() 
    AND profiles.role IN ('business_owner', 'super_admin')
  )
);
CREATE POLICY "Business owners can update their appointments" ON appointments FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.business_id = appointments.business_id 
    AND profiles.auth_user_id = auth.uid() 
    AND profiles.role IN ('business_owner', 'super_admin')
  )
);

