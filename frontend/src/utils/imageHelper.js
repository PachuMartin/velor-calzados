export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500';

/**
 * Formats any image URL (uploaded file, direct link, or protocol-less URL)
 * into a valid, loadable image source URL.
 */
export function formatImageUrl(url, apiBase = '') {
  if (!url || typeof url !== 'string') return FALLBACK_IMAGE;
  
  const trimmed = url.trim();
  if (!trimmed) return FALLBACK_IMAGE;

  // Base64 Data Image
  if (trimmed.startsWith('data:image')) return trimmed;

  // Uploaded file on backend server
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const cleanBase = apiBase ? apiBase.replace(/\/api\/?$/, '') : '';
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${cleanBase}${cleanPath}`;
  }

  // Protocol-relative URL (e.g. //images.unsplash.com/...)
  if (trimmed.startsWith('//')) return `https:${trimmed}`;

  // Complete HTTP/HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Domain without protocol (e.g. images.unsplash.com/...)
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }

  return FALLBACK_IMAGE;
}
