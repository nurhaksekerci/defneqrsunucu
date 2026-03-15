'use client';

import { useState } from 'react';
import { getImageUrl } from '@/lib/imageHelper';

interface Product {
  id: string;
  name: string;
  basePrice: number | null;
  stocks?: Array<{ price: number }>;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  images?: string[] | null;
  products: Product[];
}

interface Restaurant {
  name: string;
  description?: string;
}

type TemplateType = 'cafe-playful' | 'dark-vintage' | 'cutout-collage' | 'neon-retro' | 'organic-sketch';

const getProductPrice = (p: Product) => (p.stocks?.[0]?.price ?? p.basePrice ?? 0);

export default function MenuTemplateMarjinal({
  restaurant,
  categories,
  formatPrice,
  siteName,
  template,
}: {
  restaurant: Restaurant;
  categories: Category[];
  formatPrice: (n: number) => string;
  siteName: string;
  template: TemplateType;
}) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const filtered = activeCategory === 'all' ? categories : categories.filter((c) => c.id === activeCategory);

  const getCategoryImages = (cat: Category): string[] => {
    const imgs = cat.images;
    if (Array.isArray(imgs) && imgs.length > 0) return imgs.slice(0, 4).map((u) => getImageUrl(u) || u);
    if (cat.image) return [getImageUrl(cat.image) || cat.image];
    return [];
  };

  const getNavStyle = (active: boolean) => {
    if (!active) {
      if (template === 'cafe-playful') return { background: 'rgba(255,152,0,0.2)', color: '#ff9800', border: '2px solid #ff9800' };
      if (template === 'dark-vintage') return { background: 'transparent', color: '#d4a574', border: '1px solid #d4a57460' };
      if (template === 'cutout-collage') return { background: '#f5f0e8', color: '#1a1a1a', border: '2px solid #1a1a1a' };
      if (template === 'neon-retro') return { background: 'transparent', color: '#00ffff', border: '2px solid #00ffff' };
      if (template === 'organic-sketch') return { background: '#fff', color: '#5c4033', border: '2px solid #8b5a2b' };
      return {};
    }
    if (template === 'cafe-playful') return { background: '#ff9800', color: '#1a0f00', border: '2px solid #ff9800' };
    if (template === 'dark-vintage') return { background: '#d4a574', color: '#0d0d0d', border: '1px solid #d4a574' };
    if (template === 'cutout-collage') return { background: '#1a1a1a', color: '#f5f0e8', border: '2px solid #1a1a1a' };
    if (template === 'neon-retro') return { background: '#00ffff', color: '#0a0a0f', border: '2px solid #00ffff' };
    if (template === 'organic-sketch') return { background: '#8b5a2b', color: '#faf8f5', border: '2px solid #8b5a2b' };
    return {};
  };

  const navButtons = (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
      <button type="button" onClick={() => setActiveCategory('all')} className="flex-shrink-0 min-h-[48px] px-4 rounded-xl font-medium transition-all" style={getNavStyle(activeCategory === 'all')}>
        Tümü
      </button>
      {categories.map((c) => (
        <button key={c.id} type="button" onClick={() => setActiveCategory(c.id)} className="flex-shrink-0 min-h-[48px] px-4 rounded-xl font-medium transition-all" style={getNavStyle(activeCategory === c.id)}>
          {c.name}
        </button>
      ))}
    </div>
  );

  if (template === 'cafe-playful') {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg,#2d1810 0%,#1a0f00 100%)', color: '#fff' }}>
        <div className="fixed inset-0 -z-10 opacity-40" style={{ background: 'url(https://images.unsplash.com/photo-1599229809585-f92ea053b547?w=1200&q=60) center 40%/cover' }} />
        <header className="text-center py-6 px-4">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ textShadow: '0 0 20px rgba(255,152,0,0.5)' }}>
            {restaurant.name}
          </h1>
          {restaurant.description && <p className="text-sm opacity-90 mt-1">{restaurant.description}</p>}
        </header>
        <nav className="sticky top-0 z-20 px-4 py-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
          {navButtons}
        </nav>
        <main className="max-w-[480px] mx-auto px-4 py-4">
          {filtered.map((cat) => {
            const imgs = getCategoryImages(cat);
            return (
              <section key={cat.id} className="mb-8">
                <h2 className="text-lg font-bold mb-3 text-[#ff9800] border-l-4 border-[#ff9800] pl-3">
                  ★ {cat.name}
                </h2>
                <div className="rounded-lg p-4 border-2 border-[#ff980040]" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  {imgs.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {imgs.map((url, i) => (
                        <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded-lg border-2 border-[#ff980050]" loading="lazy" />
                      ))}
                    </div>
                  )}
                  {cat.products.map((p) => (
                    <div key={p.id} className="flex justify-between py-2 border-b border-dashed border-[#ff980050] last:border-0 min-h-[44px] items-center">
                      <span className="font-semibold">{p.name}</span>
                      <span className="bg-[#ff9800] text-[#1a0f00] px-2 py-0.5 rounded font-bold text-sm">
                        {formatPrice(getProductPrice(p))}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </main>
        <footer className="text-center py-6 text-sm opacity-60">Powered by {siteName}</footer>
      </div>
    );
  }

  if (template === 'dark-vintage') {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-[#d4a574]">
        <header className="text-center py-6 px-4 border-b border-[#d4a574]">
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-[#e8c9a0]">{restaurant.name}</h1>
          {restaurant.description && <p className="text-sm opacity-70 mt-1">{restaurant.description}</p>}
        </header>
        <nav className="sticky top-0 z-20 px-4 py-3 bg-[#0d0d0d] border-b border-dashed border-[#d4a57440]">
          {navButtons}
        </nav>
        <main className="max-w-[480px] mx-auto px-4 py-4">
          {filtered.map((cat) => {
            const imgs = getCategoryImages(cat);
            return (
              <section key={cat.id} className="mb-8">
                <h2 className="text-xl font-serif font-semibold mb-3 text-[#e8c9a0] border-b border-[#d4a57440] pb-1">
                  {cat.name}
                </h2>
                <div className="p-4 border border-[#d4a57430] rounded" style={{ background: 'rgba(212,165,116,0.05)' }}>
                  {imgs.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {imgs.map((url, i) => (
                        <img key={i} src={url} alt="" className="w-full aspect-square object-cover border border-[#d4a57420]" style={{ filter: 'sepia(0.3)' }} loading="lazy" />
                      ))}
                    </div>
                  )}
                  {cat.products.map((p) => (
                    <div key={p.id} className="flex justify-between py-2 border-b border-dotted border-[#d4a57430] last:border-0 min-h-[44px] items-center">
                      <span>{p.name}</span>
                      <span className="font-bold text-[#e8c9a0]">{formatPrice(getProductPrice(p))}</span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </main>
        <footer className="text-center py-6 text-xs opacity-50">Powered by {siteName}</footer>
      </div>
    );
  }

  if (template === 'cutout-collage') {
    return (
      <div className="min-h-screen bg-[#f5f0e8] text-[#1a1a1a]">
        <header className="text-center py-6 px-4 bg-[#1a1a1a] text-[#f5f0e8]">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-widest">{restaurant.name}</h1>
          {restaurant.description && <p className="text-sm opacity-80 mt-1">{restaurant.description}</p>}
        </header>
        <nav className="sticky top-0 z-20 px-4 py-3 bg-[#1a1a1a]">
          {navButtons}
        </nav>
        <main className="max-w-[480px] mx-auto px-4 py-4">
          {filtered.map((cat) => {
            const imgs = getCategoryImages(cat);
            return (
              <section key={cat.id} className="mb-8">
                <h2 className="inline-block bg-[#1a1a1a] text-[#f5f0e8] px-4 py-2 mb-3 font-bold tracking-widest text-sm">
                  {cat.name}
                </h2>
                <div className="bg-white p-4 border-[3px] border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a]">
                  {imgs.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {imgs.map((url, i) => (
                        <img key={i} src={url} alt="" className="w-full aspect-square object-cover border-2 border-[#1a1a1a]" loading="lazy" />
                      ))}
                    </div>
                  )}
                  {cat.products.map((p) => (
                    <div key={p.id} className="flex justify-between py-2 border-b border-[#1a1a1a20] last:border-0 min-h-[44px] items-center">
                      <span>{p.name}</span>
                      <span className="font-medium">{formatPrice(getProductPrice(p))}</span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </main>
        <footer className="text-center py-6 text-xs opacity-60">Powered by {siteName}</footer>
      </div>
    );
  }

  if (template === 'neon-retro') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#e0e0ff]">
        <header className="text-center py-6 px-4 border-b-2 border-[#ff00ff]" style={{ boxShadow: '0 0 20px rgba(255,0,255,0.3)' }}>
          <h1 className="text-xl sm:text-2xl font-bold tracking-widest text-white" style={{ textShadow: '0 0 10px #ff00ff' }}>
            {restaurant.name}
          </h1>
          {restaurant.description && <p className="text-sm text-[#00ffff] opacity-90 mt-1">{restaurant.description}</p>}
        </header>
        <nav className="sticky top-0 z-20 px-4 py-3 bg-[#0a0a0f] border-b border-[#ff00ff50]">
          {navButtons}
        </nav>
        <main className="max-w-[480px] mx-auto px-4 py-4">
          {filtered.map((cat) => {
            const imgs = getCategoryImages(cat);
            return (
              <section key={cat.id} className="mb-8">
                <h2 className="text-lg font-bold mb-3 text-[#ff00ff] pl-4 border-l-4 border-[#ff00ff]">
                  {cat.name}
                </h2>
                <div className="p-4 rounded border border-[#ff00ff50]" style={{ background: 'rgba(255,0,255,0.05)' }}>
                  {imgs.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {imgs.map((url, i) => (
                        <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded border border-[#00ffff60]" loading="lazy" />
                      ))}
                    </div>
                  )}
                  {cat.products.map((p) => (
                    <div key={p.id} className="flex justify-between py-2 border-b border-[#ff00ff30] last:border-0 min-h-[44px] items-center">
                      <span className="font-medium">{p.name}</span>
                      <span className="font-semibold text-[#00ffff]">{formatPrice(getProductPrice(p))}</span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </main>
        <footer className="text-center py-6 text-xs opacity-50">Powered by {siteName}</footer>
      </div>
    );
  }

  if (template === 'organic-sketch') {
    return (
      <div className="min-h-screen bg-[#faf8f5] text-[#2c2416]">
        <header className="text-center py-6 px-4 border-b-2 border-[#8b5a2b]">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#5c4033]">{restaurant.name}</h1>
          {restaurant.description && <p className="text-sm text-[#6b5344] mt-1">{restaurant.description}</p>}
        </header>
        <nav className="sticky top-0 z-20 px-4 py-3 bg-[#faf8f5] border-b-2 border-dashed border-[#8b5a2b40]">
          {navButtons}
        </nav>
        <main className="max-w-[480px] mx-auto px-4 py-4">
          {filtered.map((cat) => {
            const imgs = getCategoryImages(cat);
            return (
              <section key={cat.id} className="mb-8">
                <h2 className="text-xl font-bold mb-3 text-[#5c4033] pl-4 border-l-4 border-[#8b5a2b]">
                  {cat.name}
                </h2>
                <div className="bg-white p-4 border-2 border-[#8b5a2b] rounded-br-3xl rounded-bl-3xl" style={{ boxShadow: '4px 4px 0 rgba(139,90,43,0.15)' }}>
                  {imgs.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {imgs.map((url, i) => (
                        <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded-xl border-2 border-[#8b5a2b]" loading="lazy" />
                      ))}
                    </div>
                  )}
                  {cat.products.map((p) => (
                    <div key={p.id} className="flex justify-between py-2 border-b border-[#8b5a2b30] last:border-0 min-h-[44px] items-center">
                      <span className="text-lg">{p.name}</span>
                      <span className="font-bold text-[#5c4033] px-2 py-0.5 rounded-lg bg-[#8b5a2b20]">
                        {formatPrice(getProductPrice(p))}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </main>
        <footer className="text-center py-6 text-sm text-[#8b5a2b] opacity-60">Powered by {siteName}</footer>
      </div>
    );
  }

  return null;
}
