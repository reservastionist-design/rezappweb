'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (forgotPassword) {
        // Şifre sıfırlama
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          setError(error.message);
          return;
        }

        setSuccess('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!');
        setForgotPassword(false);
        return;
      }

      if (isLogin) {
        // Giriş yap
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
          return;
        }

        if (data.user) {
          setSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
          
          // Kullanıcının rolünü kontrol et ve uygun sayfaya yönlendir
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('auth_user_id', data.user.id)
            .single();
          
          setTimeout(() => {
            if (profile?.role === 'staff') {
              router.push('/staff');
            } else if (profile?.role === 'business_owner' || data.user.email === 'furkanaydemirie@gmail.com') {
              router.push('/admin');
            } else {
              router.push('/');
            }
          }, 1000);
        }
      } else {
        // Kayıt ol
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            }
          }
        });

        if (error) {
          setError(error.message);
          return;
        }

        if (data.user) {
          // Profil oluştur
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              auth_user_id: data.user.id,
              email: email,
              role: 'customer'
            });

          if (profileError) {
            console.error('Profil oluşturma hatası:', profileError);
          }

          setSuccess('Kayıt başarılı! Şifreniz ile giriş yapabilirsiniz.');
        }
      }
    } catch (error) {
      setError('Bir hata oluştu: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-slate-700">📅 RezApp</Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {forgotPassword ? 'Şifre Sıfırlama' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {forgotPassword ? 'E-posta adresinizi girin' : (isLogin ? 'Hesabınıza giriş yapın' : 'Yeni hesap oluşturun')}
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && !forgotPassword && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Ad Soyad
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={!isLogin}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500 transition-all duration-200"
                  placeholder="Adınız Soyadınız"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-posta
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500 transition-all duration-200"
                placeholder="ornek@email.com"
              />
            </div>

            {!forgotPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Şifre
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required={!forgotPassword}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500 transition-all duration-200"
                  placeholder="Şifreniz"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all duration-200"
              >
                {loading ? 'İşleniyor...' : (forgotPassword ? 'Şifre Sıfırlama Bağlantısı Gönder' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol'))}
              </button>
            </div>

            <div className="text-center space-y-3">
              {isLogin && !forgotPassword && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPassword(true);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-emerald-600 hover:text-emerald-500 text-sm transition-colors duration-200"
                  >
                    Şifremi unuttum
                  </button>
                </div>
              )}
              
              {forgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotPassword(false);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-slate-600 hover:text-slate-500 text-sm transition-colors duration-200"
                >
                  ← Giriş sayfasına dön
                </button>
              )}
              
              {!forgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-slate-600 hover:text-slate-500 text-sm transition-colors duration-200"
                >
                  {isLogin ? 'Hesabınız yok mu? Kayıt olun' : 'Zaten hesabınız var mı? Giriş yapın'}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="text-center">
          <Link href="/" className="text-slate-600 hover:text-slate-500 text-sm transition-colors duration-200">
            ← Ana sayfaya dön
          </Link>
        </div>
      </div>
    </div>
  );
}