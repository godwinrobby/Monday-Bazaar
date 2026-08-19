import { Deal } from '../types';

/**
 * Updates Open Graph and Twitter meta tags dynamically with the deal's image,
 * title, and description so that shared links render the correct preview image
 * instead of the generic site-wide og-image.png.
 */
export function updateOgMetaForDeal(deal: Deal) {
  const ogImage = deal.imageUrl || 'https://mondaybazaar.in/og-image.png';
  const ogTitle = `${deal.title} - ₹${deal.dealPrice.toLocaleString('en-IN')} (${deal.discountPercentage}% OFF) | Monday Bazaar`;
  const ogDesc = `🔥 ${deal.title} - ₹${deal.dealPrice.toLocaleString('en-IN')} (${deal.discountPercentage}% OFF) on ${deal.store}. Verified deal with AI price analysis.`;

  const tags: [string, string, string | null][] = [
    ['property', 'og:title', ogTitle],
    ['property', 'og:description', ogDesc],
    ['property', 'og:image', ogImage],
    ['property', 'og:image:width', '1200'],
    ['property', 'og:image:height', '630'],
    ['name', 'twitter:title', ogTitle],
    ['name', 'twitter:description', ogDesc],
    ['name', 'twitter:image', ogImage],
    ['name', 'twitter:card', 'summary_large_image'],
  ];

  tags.forEach(([attr, selectorOrContent, content]) => {
    // Find existing meta tag by attribute pair
    let meta: HTMLMetaElement | null = null;
    if (attr === 'property') {
      meta = document.querySelector(`meta[property="${selectorOrContent}"]`);
    } else {
      meta = document.querySelector(`meta[name="${selectorOrContent}"]`);
    }

    if (meta) {
      meta.content = content || '';
    } else {
      // Create the meta tag if it doesn't exist
      meta = document.createElement('meta') as HTMLMetaElement;
      if (attr === 'property') {
        meta.setAttribute('property', selectorOrContent || '');
      } else {
        meta.setAttribute('name', selectorOrContent || '');
      }
      meta.content = content || '';
      document.head.appendChild(meta);
    }
  });
}

/**
 * Restores the original site-wide OG tags after a share has been completed.
 */
export function restoreDefaultOgMeta() {
  const defaults: [string, string, string][] = [
    ['property', 'og:title', 'Monday Bazaar - Best Online Deals, Loot Deals & Discount Coupons in India'],
    ['property', 'og:description', 'Discover the hottest deals, loot deals, and discount coupons on Amazon, Flipkart, Myntra & more. AI-verified price drops with price history tracking.'],
    ['property', 'og:image', 'https://mondaybazaar.in/og-image.png'],
    ['name', 'twitter:title', 'Monday Bazaar - Best Online Deals, Loot Deals & Discount Coupons in India'],
    ['name', 'twitter:description', 'Discover the hottest deals, loot deals, and discount coupons on Amazon, Flipkart, Myntra & more with AI-powered price analysis.'],
    ['name', 'twitter:image', 'https://mondaybazaar.in/og-image.png'],
  ];

  defaults.forEach(([attr, selector, content]) => {
    let meta: HTMLMetaElement | null = null;
    if (attr === 'property') {
      meta = document.querySelector(`meta[property="${selector}"]`);
    } else {
      meta = document.querySelector(`meta[name="${selector}"]`);
    }
    if (meta) meta.content = content;
  });
}

/**
 * Fetches the deal's image and converts it into a File object so it can be
 * attached directly in the Web Share API. This ensures WhatsApp, Telegram,
 * and other chat apps share the actual product image — not just a URL string.
 */
export async function fetchImageAsFile(imageUrl: string, dealId: string): Promise<File | null> {
  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (!response.ok) return null;
    
    const blob = await response.blob();
    if (!blob || blob.size === 0) return null;

    // Determine file extension from content-type
    const contentType = blob.type || 'image/jpeg';
    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/avif': 'avif',
    };
    const ext = extensionMap[contentType] || 'jpg';
    const fileName = `monday-bazaar-deal-${dealId}.${ext}`;

    return new File([blob], fileName, { type: contentType });
  } catch (err) {
    console.warn('Failed to fetch share image:', err);
    return null;
  }
}

/**
 * Shares a deal with its image linked in the share data.
 * Attaches the actual image as a file when the Web Share API supports files,
 * and updates OG meta tags so social previews show the correct image.
 */
export async function shareDeal(deal: Deal): Promise<boolean> {
  const shareUrl = window.location.origin +
    (window.location.pathname !== '/' ? window.location.pathname : '') +
    '?deal=' + deal.id;

  // Update OG tags with deal-specific image before sharing
  updateOgMetaForDeal(deal);

  // Build share text (without raw image URL clutter — the image is attached as a file)
  const shareText = `🔥 ${deal.title} for ₹${deal.dealPrice.toLocaleString('en-IN')} (${deal.discountPercentage}% OFF) on ${deal.store}!\n\nGrab: ${deal.dealUrl || shareUrl}`;

  // Try Web Share API with files (image) support where available
  const imageFile = await fetchImageAsFile(deal.imageUrl, deal.id);

  if (imageFile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
    try {
      await navigator.share({
        title: `Deal: ${deal.title}`,
        text: shareText,
        url: shareUrl,
        files: [imageFile],
      });
      restoreDefaultOgMeta();
      return true;
    } catch (err) {
      const e = err as Error;
      if (e.name !== 'AbortError') {
        console.error('Web share with image failed:', e);
      }
    }
  }

  // Fallback: try navigator.share without files
  if (navigator.share) {
    try {
      await navigator.share({ title: `Deal: ${deal.title}`, text: shareText, url: shareUrl });
      restoreDefaultOgMeta();
      return true;
    } catch (err) {
      const e = err as Error;
      if (e.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(`${shareText}\n${deal.imageUrl}\n${shareUrl}`);
        } catch (clipErr) {
          console.error('Clipboard copy failed:', clipErr);
        }
      }
    }
  } else {
    // Final fallback: copy to clipboard with image URL included for manual sharing
    try {
      await navigator.clipboard.writeText(`${shareText}\n\nImage: ${deal.imageUrl}\n\nLink: ${shareUrl}`);
    } catch (clipErr) {
      console.error('Clipboard copy failed:', clipErr);
    }
  }

  restoreDefaultOgMeta();
  return false;
}