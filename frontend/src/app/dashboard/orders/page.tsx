'use client';

export default function OrdersPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-8xl mb-4">🚧</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Bu Özellik MVP'de Aktif Değil</h2>
        <p className="text-gray-600 mb-6">
          Sipariş yönetimi özelliği şu an geliştirme aşamasındadır.
        </p>
        <a
          href="/dashboard"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          ← Dashboard'a Dön
        </a>
      </div>
    </div>
  );
}
