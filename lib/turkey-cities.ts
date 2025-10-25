// Türkiye Şehirleri ve İlçeleri

export const TURKEY_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 
  'Antalya', 'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 
  'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 
  'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 
  'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 
  'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul', 'İzmir', 'Kahramanmaraş', 
  'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kilis', 'Kırıkkale', 
  'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 
  'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 
  'Rize', 'Sakarya', 'Samsun', 'Şanlıurfa', 'Siirt', 'Sinop', 'Şırnak', 'Sivas', 
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
];

// İstanbul ilçeleri (en çok kullanılacak)
export const ISTANBUL_DISTRICTS = [
  'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler',
  'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü',
  'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt',
  'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane',
  'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer',
  'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla',
  'Ümraniye', 'Üsküdar', 'Zeytinburnu'
];

// Ankara ilçeleri
export const ANKARA_DISTRICTS = [
  'Akyurt', 'Altındağ', 'Ayaş', 'Bala', 'Beypazarı', 'Çamlıdere', 'Çankaya',
  'Çubuk', 'Elmadağ', 'Etimesgut', 'Evren', 'Gölbaşı', 'Güdül', 'Haymana',
  'Kahramankazan', 'Kalecik', 'Keçiören', 'Kızılcahamam', 'Mamak', 'Nallıhan',
  'Polatlı', 'Pursaklar', 'Sincan', 'Şereflikoçhisar', 'Yenimahalle'
];

// İzmir ilçeleri
export const IZMIR_DISTRICTS = [
  'Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama', 'Beydağ', 'Bornova',
  'Buca', 'Çeşme', 'Çiğli', 'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar',
  'Karaburun', 'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz', 'Konak', 'Menderes',
  'Menemen', 'Narlıdere', 'Ödemiş', 'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla'
];

// Antalya ilçeleri
export const ANTALYA_DISTRICTS = [
  'Akseki', 'Aksu', 'Alanya', 'Demre', 'Döşemealtı', 'Elmalı', 'Finike', 'Gazipaşa',
  'Gündoğmuş', 'İbradı', 'Kaş', 'Kemer', 'Kepez', 'Konyaaltı', 'Korkuteli',
  'Kumluca', 'Manavgat', 'Muratpaşa', 'Serik'
];

// Şehre göre ilçe listesi döndürür
export function getDistrictsByCity(city: string): string[] {
  switch (city) {
    case 'İstanbul':
      return ISTANBUL_DISTRICTS;
    case 'Ankara':
      return ANKARA_DISTRICTS;
    case 'İzmir':
      return IZMIR_DISTRICTS;
    case 'Antalya':
      return ANTALYA_DISTRICTS;
    default:
      // Diğer şehirler için boş array döndür (kullanıcı manuel girecek)
      return [];
  }
}

