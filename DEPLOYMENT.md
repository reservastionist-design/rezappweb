# 🚀 RezApp Deployment Guide

Bu guide, RezApp projesini Vercel'e deploy etmek için gerekli adımları içerir.

## 📋 Ön Hazırlık

### 1. Gerekli Bilgiler
Supabase Dashboard'dan aşağıdaki bilgileri hazırlayın:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase proje URL'i
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (gizli!)

Bu bilgileri `.env.local` dosyanızda bulabilirsiniz.

---

## 🌐 Vercel Deployment Adımları

### Adım 1: GitHub'a Push
```bash
git add .
git commit -m "Production ready: Cleaned debug code and prepared for deployment"
git push origin main
```

### Adım 2: Vercel'e Bağlanma
1. [vercel.com](https://vercel.com) adresine gidin
2. GitHub hesabınızla giriş yapın
3. **"Add New Project"** tıklayın
4. Repo listesinden `rezapp-web`'i seçin
5. **"Import"** tıklayın

### Adım 3: Environment Variables Ekleme
Vercel project settings'de:

1. **"Environment Variables"** sekmesine gidin
2. Aşağıdaki 3 değişkeni ekleyin:

**Variable 1:**
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://sbityfrhgfqhebssljtk.supabase.co`
- Environment: Production, Preview, Development (hepsini seç)

**Variable 2:**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (anon key'iniz)
- Environment: Production, Preview, Development (hepsini seç)

**Variable 3:**
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (service role key'iniz)
- Environment: Production, Preview, Development (hepsini seç)

> ⚠️ **ÖNEMLİ:** Service role key'i asla public yapmayın! Sadece server-side'da kullanılır.

### Adım 4: Deploy
1. **"Deploy"** butonuna tıklayın
2. Vercel otomatik olarak build alacak ve deploy edecek
3. Deploy tamamlandığında `https://rezapp-web.vercel.app` gibi bir URL alacaksınız

---

## ✅ Deployment Sonrası Kontroller

### 1. Ana Sayfa Testi
- [ ] `https://your-domain.vercel.app/` açılıyor mu?
- [ ] Loading state düzgün çalışıyor mu?

### 2. Randevu Sistemi Testi
- [ ] `/book` sayfası açılıyor mu?
- [ ] Hizmetler listeleniyor mu?
- [ ] Personeller yükleniyor mu?
- [ ] Müsait saatler görünüyor mu?
- [ ] Randevu oluşturuluyor mu?

### 3. Admin Paneli Testi
- [ ] `/login` ile giriş yapılabiliyor mu?
- [ ] Admin dashboard açılıyor mu?
- [ ] Randevular görüntüleniyor mu?

### 4. Harita Testi
- [ ] `/map` sayfası açılıyor mu?
- [ ] İşletmeler haritada görünüyor mu?

---

## 🔧 Sorun Giderme

### Build Hatası
Eğer Vercel'de build hatası alırsanız:
1. Vercel logs'u kontrol edin
2. Local'de `npm run build` çalıştırın
3. Hataları düzeltin ve tekrar push edin

### Environment Variables Hatası
Eğer "Missing Supabase environment variables!" hatası alırsanız:
1. Vercel Dashboard → Settings → Environment Variables
2. Tüm 3 değişkeni doğru girdiğinizden emin olun
3. **Redeploy** edin (Deployments → ... → Redeploy)

### RLS (Row Level Security) Sorunları
Eğer staff/services yüklenmiyor ise:
1. Supabase Dashboard → SQL Editor'a gidin
2. Aşağıdaki komutları çalıştırın:

```sql
-- staff_services tablosu RLS'yi kapat
ALTER TABLE staff_services DISABLE ROW LEVEL SECURITY;

-- staff_availability tablosu RLS'yi kapat  
ALTER TABLE staff_availability DISABLE ROW LEVEL SECURITY;
```

---

## 📊 Production Monitoring

### Vercel Analytics
Vercel otomatik olarak:
- Page load times
- Core Web Vitals
- Error tracking
sağlar.

### Supabase Dashboard
- Database queries
- Auth logs
- API usage

kontrol edebilirsiniz.

---

## 🎯 Domain Bağlama (Opsiyonel)

Kendi domain'inizi bağlamak için:

1. Vercel Dashboard → Settings → Domains
2. **"Add Domain"** tıklayın
3. Domain'inizi girin (örn: `rezapp.com`)
4. DNS ayarlarını domain provider'ınızda yapın
5. Vercel otomatik SSL sertifikası kuracak

---

## 📱 Sonraki Adımlar

### Önerilen İyileştirmeler:
- [ ] Google Analytics ekleme
- [ ] Sentry error tracking
- [ ] Email bildirim sistemi (SendGrid/Resend)
- [ ] SMS bildirim (Twilio)
- [ ] WhatsApp bildirimi
- [ ] Custom domain kurulumu
- [ ] SEO optimizasyonu

---

## 🆘 Destek

Sorun yaşarsanız:
- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Supabase Documentation: https://supabase.com/docs

---

**Tebrikler! 🎉 RezApp artık canlıda!**

