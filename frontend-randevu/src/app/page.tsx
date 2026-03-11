import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">DefneRandevu</h1>
        <p className="text-gray-600 mb-8">
          Randevu yönetim sisteminiz. Kuaför, berber, klinik ve daha fazlası için.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            Giriş Yap
          </Link>
          <Link
            href="/auth/register"
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
          >
            Kayıt Ol
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 text-indigo-600 font-medium hover:underline"
          >
            Panel
          </Link>
        </div>
        <p className="mt-8 text-sm text-gray-500">
          Geçici adres: randevu.defneqr.com — Yakında defnerandevu.com
        </p>
      </div>
    </div>
  );
}
