import { Metadata } from 'next';
import MenuClient from './MenuClient';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://defneqr.com';
const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const previewParam = resolvedSearchParams?.preview;

  // Preview mode: noindex, nofollow
  const isPreview = !!previewParam;

  if (isPreview) {
    return {
      robots: { index: false, follow: false },
      title: `${slug} - Önizleme`
    };
  }

  // Normal mode: fetch restaurant for metadata
  try {
    const res = await fetch(`${apiUrl}/restaurants/slug/${slug}`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) {
      return {
        title: 'Menü',
        alternates: { canonical: `${baseUrl}/${slug}/menu` }
      };
    }
    const data = await res.json();
    const restaurant = data?.data;
    if (!restaurant) {
      return {
        title: 'Menü',
        alternates: { canonical: `${baseUrl}/${slug}/menu` }
      };
    }

    return {
      title: `${restaurant.name} - Menü`,
      description: restaurant.description || `${restaurant.name} dijital menüsü. QR kod ile menüyü görüntüleyin.`,
      alternates: {
        canonical: `${baseUrl}/${slug}/menu`
      },
      openGraph: {
        title: `${restaurant.name} - Menü`,
        description: restaurant.description || `${restaurant.name} dijital menüsü`,
        url: `${baseUrl}/${slug}/menu`,
        images: restaurant.logo ? [restaurant.logo] : undefined
      }
    };
  } catch {
    return {
      title: 'Menü',
      alternates: { canonical: `${baseUrl}/${slug}/menu` }
    };
  }
}

export default function MenuPage() {
  return <MenuClient />;
}
