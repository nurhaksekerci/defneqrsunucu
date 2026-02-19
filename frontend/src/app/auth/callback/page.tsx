'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken') || searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      // Hata durumunda login sayfasına yönlendir
      const errorMessages: Record<string, string> = {
        'authentication_failed': 'Kimlik doğrulama başarısız oldu.',
        'google_auth_failed': 'Google ile giriş başarısız oldu.'
      };
      
      const errorMessage = errorMessages[error] || 'Bir hata oluştu.';
      router.push(`/auth/login?error=${encodeURIComponent(errorMessage)}`);
      return;
    }

    if (accessToken) {
      // Token'ları localStorage'a kaydet
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('token', accessToken); // Backward compatibility
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // Kullanıcı bilgilerini al (token'ı manuel olarak header'a ekle)
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(response => {
          if (response.success && response.data) {
            const role = response.data.role;
            
            // Rol bazlı yönlendirme
            switch (role) {
              case 'ADMIN':
              case 'STAFF':
                router.push('/admin');
                break;
              case 'RESTAURANT_OWNER':
                // Kullanıcının restoranı var mı kontrol et
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/restaurants/my`, {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`
                  }
                })
                  .then(res => res.json())
                  .then(data => {
                    if (data.success && data.data && data.data.length > 0) {
                      router.push('/dashboard');
                    } else {
                      // Restoranı yoksa restoran oluşturma sayfasına yönlendir
                      router.push('/dashboard/restaurant/create');
                    }
                  })
                  .catch(() => {
                    router.push('/dashboard/restaurant/create');
                  });
                break;
              case 'WAITER':
                router.push('/waiter');
                break;
              case 'COOK':
              case 'BARISTA':
                router.push('/kitchen');
                break;
              case 'CASHIER':
                router.push('/cashier');
                break;
              default:
                router.push('/');
            }
          } else {
            console.error('User fetch failed:', response);
            router.push('/auth/login?error=user_fetch_failed');
          }
        })
        .catch((error) => {
          console.error('User fetch error:', error);
          router.push('/auth/login?error=user_fetch_failed');
        });
    } else {
      // Token yoksa login'e yönlendir
      router.push('/auth/login');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Giriş yapılıyor...</h2>
        <p className="text-gray-600">Lütfen bekleyin, hesabınıza yönlendiriliyorsunuz.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Yükleniyor...</h2>
          <p className="text-gray-600">Lütfen bekleyin...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
