-- =====================================================
-- TÜRKİYE GENELİ AÇILIM MİGRATION
-- =====================================================
-- Bu migration, sistemi İstanbul'dan Türkiye geneline açar
-- ENUM district yerine TEXT city + district kullanılır
-- Mevcut İstanbul verileri korunur
-- =====================================================

-- ADIM 1: Yeni kolonları ekle
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS district_text TEXT;

-- ADIM 2: Mevcut district verilerini district_text'e kopyala
-- ve city'yi 'İstanbul' olarak set et
UPDATE businesses
SET 
  city = 'İstanbul',
  district_text = 
    CASE 
      WHEN district = 'adalar' THEN 'Adalar'
      WHEN district = 'arnavutkoy' THEN 'Arnavutköy'
      WHEN district = 'atasehir' THEN 'Ataşehir'
      WHEN district = 'avcilar' THEN 'Avcılar'
      WHEN district = 'bagcilar' THEN 'Bağcılar'
      WHEN district = 'bahcelievler' THEN 'Bahçelievler'
      WHEN district = 'bakirkoy' THEN 'Bakırköy'
      WHEN district = 'basaksehir' THEN 'Başakşehir'
      WHEN district = 'bayrampasa' THEN 'Bayrampaşa'
      WHEN district = 'besiktas' THEN 'Beşiktaş'
      WHEN district = 'beykoz' THEN 'Beykoz'
      WHEN district = 'beylikduzu' THEN 'Beylikdüzü'
      WHEN district = 'beyoglu' THEN 'Beyoğlu'
      WHEN district = 'buyukcekmece' THEN 'Büyükçekmece'
      WHEN district = 'catalca' THEN 'Çatalca'
      WHEN district = 'cekmekoy' THEN 'Çekmeköy'
      WHEN district = 'esenler' THEN 'Esenler'
      WHEN district = 'esenyurt' THEN 'Esenyurt'
      WHEN district = 'fatih' THEN 'Fatih'
      WHEN district = 'gaziosmanpasa' THEN 'Gaziosmanpaşa'
      WHEN district = 'gungoren' THEN 'Güngören'
      WHEN district = 'kadikoy' THEN 'Kadıköy'
      WHEN district = 'kagithane' THEN 'Kağıthane'
      WHEN district = 'kartal' THEN 'Kartal'
      WHEN district = 'kucukcekmece' THEN 'Küçükçekmece'
      WHEN district = 'maltepe' THEN 'Maltepe'
      WHEN district = 'pendik' THEN 'Pendik'
      WHEN district = 'sancaktepe' THEN 'Sancaktepe'
      WHEN district = 'sariyer' THEN 'Sarıyer'
      WHEN district = 'silivri' THEN 'Silivri'
      WHEN district = 'sultanbeyli' THEN 'Sultanbeyli'
      WHEN district = 'sultangazi' THEN 'Sultangazi'
      WHEN district = 'sisli' THEN 'Şişli'
      WHEN district = 'tuzla' THEN 'Tuzla'
      WHEN district = 'umraniye' THEN 'Ümraniye'
      WHEN district = 'uskudar' THEN 'Üsküdar'
      WHEN district = 'zeytinburnu' THEN 'Zeytinburnu'
      ELSE district::text
    END
WHERE city IS NULL;

-- ADIM 3: Eski district kolonunu drop et
ALTER TABLE businesses
DROP COLUMN IF EXISTS district;

-- ADIM 4: district_text'i district olarak yeniden adlandır
ALTER TABLE businesses
RENAME COLUMN district_text TO district;

-- ADIM 5: NOT NULL constraint ekle (yeni veriler için zorunlu)
ALTER TABLE businesses
ALTER COLUMN city SET NOT NULL,
ALTER COLUMN district SET NOT NULL;

-- ADIM 6: İndex ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
CREATE INDEX IF NOT EXISTS idx_businesses_district ON businesses(district);
CREATE INDEX IF NOT EXISTS idx_businesses_city_district ON businesses(city, district);

-- ADIM 7: Eski ENUM tipini drop et (artık kullanılmıyor)
-- NOT: Eğer başka tablolarda kullanılıyorsa drop etme!
-- DROP TYPE IF EXISTS istanbul_district CASCADE;

-- =====================================================
-- MİGRATION TAMAMLANDI ✅
-- =====================================================
-- Artık businesses tablosu:
-- - city (TEXT, NOT NULL): Şehir adı (örn: "İstanbul", "Ankara", "Antalya")
-- - district (TEXT, NOT NULL): İlçe adı (örn: "Kadıköy", "Çankaya", "Muratpaşa")
-- =====================================================

