'use client';

import Link from 'next/link';

export default function KVKKPage() {
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
            KVKK Aydınlatma Metni
          </h1>
          
          <div className="prose max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              <strong>Son Güncelleme:</strong> {new Date().toLocaleDateString('tr-TR')}
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Veri Sorumlusu</h2>
            <p className="text-gray-700 mb-4">
              RezApp randevu sistemi olarak, kişisel verilerinizin işlenmesi konusunda 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla hareket etmekteyiz.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Toplanan Kişisel Veriler</h2>
            <p className="text-gray-700 mb-4">
              Randevu alma sürecinde aşağıdaki kişisel verilerinizi toplamaktayız:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Ad ve soyad</li>
              <li>E-posta adresi</li>
              <li>Telefon numarası</li>
              <li>Randevu notları (isteğe bağlı)</li>
              <li>Randevu tarihi ve saati</li>
              <li>Seçilen hizmet bilgileri</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Kişisel Verilerin İşlenme Amaçları</h2>
            <p className="text-gray-700 mb-4">
              Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Randevu oluşturma ve yönetimi</li>
              <li>Randevu hatırlatmaları gönderme</li>
              <li>Hizmet kalitesini artırma</li>
              <li>Müşteri memnuniyeti değerlendirmesi</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Kişisel Verilerin Paylaşılması</h2>
            <p className="text-gray-700 mb-4">
              Kişisel verileriniz, randevu aldığınız işletme ile paylaşılmaktadır. Verileriniz üçüncü kişilerle paylaşılmamaktadır.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Veri Saklama Süresi</h2>
            <p className="text-gray-700 mb-4">
              Kişisel verileriniz, randevu işlemi tamamlandıktan sonra 2 yıl süreyle saklanmaktadır.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Haklarınız</h2>
            <p className="text-gray-700 mb-4">
              KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenen kişisel verileriniz hakkında bilgi talep etme</li>
              <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</li>
              <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
              <li>Belirtilen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
              <li>Düzeltme, silme ve yok edilme işlemlerinin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
              <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin aleyhine bir sonucun ortaya çıkmasına itiraz etme</li>
              <li>Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. İletişim</h2>
            <p className="text-gray-700 mb-4">
              KVKK kapsamındaki haklarınızı kullanmak için aşağıdaki iletişim bilgilerinden bize ulaşabilirsiniz:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>E-posta:</strong> kvkk@rezapp.com<br/>
                <strong>Adres:</strong> RezApp Teknoloji A.Ş., İstanbul, Türkiye
              </p>
            </div>

            <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-emerald-800 text-sm">
                <strong>Önemli:</strong> Bu aydınlatma metnini okuduktan sonra randevu alma işlemini tamamlayabilirsiniz. 
                Randevu oluşturarak bu metni kabul etmiş sayılırsınız.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
