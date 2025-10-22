'use client';

import Link from 'next/link';

export default function ETKPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <Link 
              href="/book" 
              className="text-emerald-600 hover:text-emerald-800 font-medium"
            >
              ← Randevu Almaya Dön
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Elektronik Ticaret Kanunu Aydınlatma Metni
          </h1>
          
          <div className="prose max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              <strong>Son Güncelleme:</strong> {new Date().toLocaleDateString('tr-TR')}
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Hizmet Sağlayıcı Bilgileri</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700">
                <strong>Şirket Adı:</strong> RezApp Teknoloji A.Ş.<br/>
                <strong>Adres:</strong> İstanbul, Türkiye<br/>
                <strong>E-posta:</strong> info@rezapp.com<br/>
                <strong>Telefon:</strong> +90 (212) 000 00 00
              </p>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Hizmet Kapsamı</h2>
            <p className="text-gray-700 mb-4">
              RezApp, çeşitli işletmeler için online randevu alma hizmeti sunmaktadır. 
              Bu hizmet kapsamında:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Randevu oluşturma ve yönetimi</li>
              <li>İşletme ve hizmet bilgilerini görüntüleme</li>
              <li>Randevu hatırlatmaları</li>
              <li>Müşteri destek hizmetleri</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Sözleşme Koşulları</h2>
            <p className="text-gray-700 mb-4">
              Bu hizmeti kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Randevu bilgilerinizin doğru ve güncel olması</li>
              <li>Randevu saatlerine uygun davranmanız</li>
              <li>İptal durumunda en az 2 saat önceden bildirim yapmanız</li>
              <li>Hizmet şartlarımıza uygun davranmanız</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Fiyatlandırma</h2>
            <p className="text-gray-700 mb-4">
              RezApp platformu ücretsizdir. Randevu aldığınız işletmenin hizmet bedeli 
              doğrudan işletme ile aranızda belirlenir.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. İptal ve İade Koşulları</h2>
            <p className="text-gray-700 mb-4">
              Randevu iptal işlemleri aşağıdaki koşullara tabidir:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Randevu saatinden 2 saat öncesine kadar ücretsiz iptal</li>
              <li>2 saatten az kalan sürede iptal durumunda işletme politikası geçerli</li>
              <li>İptal işlemi telefon veya e-posta ile yapılabilir</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Sorumluluk Sınırları</h2>
            <p className="text-gray-700 mb-4">
              RezApp, aşağıdaki durumlardan sorumlu değildir:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>İşletmelerin hizmet kalitesi</li>
              <li>Randevu saatlerinde yaşanan gecikmeler</li>
              <li>İşletmelerin kendi politikaları</li>
              <li>Teknik arızalar nedeniyle oluşan geçici kesintiler</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Gizlilik ve Güvenlik</h2>
            <p className="text-gray-700 mb-4">
              Kişisel verilerinizin korunması için gerekli teknik ve idari tedbirleri almaktayız. 
              Detaylı bilgi için KVKK Aydınlatma Metni'ni inceleyebilirsiniz.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Uygulanacak Hukuk</h2>
            <p className="text-gray-700 mb-4">
              Bu sözleşme Türk Hukuku'na tabidir. Uyuşmazlıklar İstanbul Mahkemeleri'nde çözülecektir.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. İletişim</h2>
            <p className="text-gray-700 mb-4">
              Sorularınız için aşağıdaki iletişim bilgilerinden bize ulaşabilirsiniz:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>E-posta:</strong> info@rezapp.com<br/>
                <strong>Telefon:</strong> +90 (212) 000 00 00<br/>
                <strong>Adres:</strong> RezApp Teknoloji A.Ş., İstanbul, Türkiye
              </p>
            </div>

            <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-emerald-800 text-sm">
                <strong>Önemli:</strong> Bu metni okuduktan sonra randevu alma işlemini tamamlayabilirsiniz. 
                Randevu oluşturarak bu koşulları kabul etmiş sayılırsınız.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
