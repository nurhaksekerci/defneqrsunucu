/**
 * Görsel URL'ini backend base URL ile birleştirir
 */
export const getImageUrl = (imagePath: string | undefined | null): string | undefined => {
  if (!imagePath) return undefined;
  
  // Eğer zaten tam URL ise olduğu gibi döndür
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Backend base URL'i al
  const backendUrl = process.env.NEXT_PUBLIC_API_URL 
    ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
    : 'http://localhost:5000';
  
  // Relative path ise backend URL ile birleştir
  if (imagePath.startsWith('/uploads/')) {
    return `${backendUrl}${imagePath}`;
  }
  
  return imagePath;
};
