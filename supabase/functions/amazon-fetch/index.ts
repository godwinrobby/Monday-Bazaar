import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, origin, accept',
  'Access-Control-Max-Age': '86400',
}

function hmacSHA256(key: string | Uint8Array, message: string): Uint8Array {
  const encoder = new TextEncoder();
  const keyBytes = typeof key === 'string' ? encoder.encode(key) : key;
  const messageBytes = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBytes);
  return new Uint8Array(signature);
}

function sha256(message: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Uint8Array {
  const kDate = await hmacSHA256(`AWS4${key}`, dateStamp);
  const kRegion = await hmacSHA256(kDate, regionName);
  const kService = await hmacSHA256(kRegion, serviceName);
  const kSigning = await hmacSHA256(kService, 'aws4_request');
  return kSigning;
}

async function signPAAPIRequest(
  accessKey: string,
  secretKey: string,
  region: string,
  payload: any
): Promise<{ headers: Record<string, string>; body: string }> {
  const method = 'POST';
  const service = 'ProductAdvertisingAPI';
  const host = 'webservices.amazon.com';
  const uri = '/paapi5/getitems';
  const algorithm = 'AWS4-HMAC-SHA256';
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);
  
  const payloadHash = sha256(JSON.stringify(payload));
  
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-date';
  
  const canonicalRequest = `${method}\n${uri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${sha256(canonicalRequest)}`;
  
  const signingKey = await getSignatureKey(secretKey, dateStamp, region, service);
  const signatureBytes = await hmacSHA256(signingKey, stringToSign);
  const signature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const authorizationHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    headers: {
      'Content-Type': 'application/json',
      'X-Amz-Date': amzDate,
      'Authorization': authorizationHeader,
    },
    body: JSON.stringify(payload),
  };
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '*'

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': origin,
      },
    })
  }

  try {
    const { urlOrAsin, paapi } = await req.json()

    if (!urlOrAsin || typeof urlOrAsin !== 'string' || !urlOrAsin.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please provide a valid Amazon product URL or ASIN.' }),
        {
          headers: {
            ...corsHeaders,
            'Access-Control-Allow-Origin': origin,
            'Content-Type': 'application/json',
          },
          status: 400,
        }
      )
    }

    const input = urlOrAsin.trim()

    const asinMatch = input.match(/(?:dp|gp\/product|asin|product-reviews|d|link\.amazon[^\/]*|amzn[^\/]*|amazon[^\/]*)\/([A-Z0-9]{8,12})/i) ||
                      input.match(/\b(B[A-Z0-9]{8,11})\b/i) ||
                      input.match(/([A-Z0-9]{9,12})$/i)
    const asin = asinMatch ? asinMatch[1].toUpperCase() : null

    if (!asin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract a valid Amazon ASIN from the provided input.' }),
        {
          headers: {
            ...corsHeaders,
            'Access-Control-Allow-Origin': origin,
            'Content-Type': 'application/json',
          },
          status: 400,
        }
      )
    }

    const productUrl = `https://www.amazon.in/dp/${asin}`

    // Try PA-API if credentials are provided
    if (paapi?.accessKey && paapi?.secretKey && paapi?.partnerTag) {
      try {
        const payload = {
          ItemIds: [asin],
          Resources: [
            'Images.Primary.Large',
            'ItemInfo.Title',
            'ItemInfo.Features',
            'Offers.Listings.Price',
            'CustomerReviews.Count',
            'CustomerReviews.StarRating',
            'ItemInfo.ProductInfo',
          ],
          PartnerTag: paapi.partnerTag,
          PartnerType: 'Associates',
          Marketplace: paapi.marketplace || 'www.amazon.in',
        };

        const { headers, body } = await signPAAPIRequest(
          paapi.accessKey,
          paapi.secretKey,
          paapi.region || 'us-east-1',
          payload
        );

        const paapiRes = await fetch('https://webservices.amazon.com/paapi5/getitems', {
          method: 'POST',
          headers,
          body,
        });

        if (paapiRes.ok) {
          const paapiData = await paapiRes.json();
          const item = paapiData.ItemsResult?.Items?.[0];
          
          if (item) {
            const title = item.ItemInfo?.Title?.DisplayValue || `Amazon Product ${asin}`;
            const image = item.Images?.Primary?.Large?.URL || item.Images?.Primary?.Medium?.URL || '';
            const priceAmount = item.Offers?.Listings?.[0]?.Price?.Amount || 0;
            const priceCurrency = item.Offers?.Listings?.[0]?.Price?.Currency || 'INR';
            const features = item.ItemInfo?.Features?.DisplayValues || [];
            const description = features.join('. ');
            const rating = item.CustomerReviews?.StarRating || 0;
            const reviewCount = item.CustomerReviews?.Count || 0;

            const productData = {
              asin,
              product_url: productUrl,
              title,
              brand: item.ItemInfo?.ProductInfo?.ByLineInfo?.Brand?.DisplayValue || '',
              description,
              price: {
                current: priceAmount,
                original: priceAmount,
                currency: priceCurrency,
                formatted: priceAmount ? `₹${priceAmount.toLocaleString('en-IN')}` : '₹0'
              },
              availability: item.Offers?.Listings?.[0]?.Availability?.Type || 'Unknown',
              rating: { value: rating, count: reviewCount },
              images: image ? [{ url: image, type: 'main' }] : [],
              features,
              categories: [],
              seller: { name: 'Amazon', url: productUrl },
              delivery: { available: true, estimated_date: '' },
              metadata: { source: 'amazon-paapi', fetched_at: new Date().toISOString() }
            };

            return new Response(
              JSON.stringify({ success: true, data: productData }),
              {
                headers: {
                  ...corsHeaders,
                  'Access-Control-Allow-Origin': origin,
                  'Content-Type': 'application/json',
                },
              }
            )
          }
        }
      } catch (paapiErr) {
        console.warn('PA-API request failed, falling back to scraping:', paapiErr);
      }
    }

    // Fallback: scrape Amazon product page
    let productData: any = null
    try {
      const amazonRes = await fetch(productUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-IN,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      })

      if (amazonRes.ok) {
        const html = await amazonRes.text()

        const titleMatch = html.match(/<title>([^<]+)<\/title>/i) ||
                           html.match(/<meta name="title" content="([^"]+)"/i) ||
                           html.match(/<meta property="og:title" content="([^"]+)"/i)
        const title = titleMatch ? titleMatch[1].replace(/&/g, '&').replace(/"/g, '"').trim() : ''

        const descMatch = html.match(/<meta name="description" content="([^"]+)"/i) ||
                          html.match(/<meta property="og:description" content="([^"]+)"/i)
        const description = descMatch ? descMatch[1].replace(/&/g, '&').trim() : ''

        const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/i) ||
                         html.match(/"hiRes":"([^"]+)"/i) ||
                         html.match(/"large":"([^"]+)"/i)
        const imageUrl = imgMatch ? imgMatch[1] : ''

        let currentPrice = 0
        let originalPrice = 0

        const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)
        if (jsonLdMatch) {
          try {
            const jsonLd = JSON.parse(jsonLdMatch[1])
            if (jsonLd.offers) {
              currentPrice = parseFloat(jsonLd.offers.price) || 0
              if (jsonLd.offers.highPrice) originalPrice = parseFloat(jsonLd.offers.highPrice) || 0
              if (jsonLd.offers.lowPrice) originalPrice = parseFloat(jsonLd.offers.lowPrice) || 0
            }
          } catch (e) {}
        }

        if (!currentPrice) {
          const priceMatch = html.match(/"priceAmount":\s*"?([\d.]+)"?/i) ||
                             html.match(/₹\s*([\d,]+\.?\d*)/i) ||
                             html.match(/"displayPrice":\s*"₹([\d,]+\.?\d*)"/i)
          currentPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0
        }

        if (!originalPrice) {
          const origMatch = html.match(/"originalPrice":\s*"?([\d.]+)"?/i) ||
                            html.match(/MRP\s*₹?\s*([\d,]+\.?\d*)/i) ||
                            html.match(/₹\s*([\d,]+\.?\d*)\s*\(/)
          originalPrice = origMatch ? parseFloat(origMatch[1].replace(/,/g, '')) : currentPrice * 1.2
        }

        productData = {
          asin,
          product_url: productUrl,
          title: title || `Amazon Product ${asin}`,
          brand: '',
          description: description || `Amazon product ${asin}`,
          price: {
            current: currentPrice,
            original: originalPrice || currentPrice,
            currency: 'INR',
            formatted: currentPrice ? `₹${currentPrice.toLocaleString('en-IN')}` : '₹0'
          },
          availability: 'In Stock',
          rating: { value: 0, count: 0 },
          images: imageUrl ? [{ url: imageUrl, type: 'main' }] : [],
          features: [],
          categories: [],
          seller: { name: 'Amazon', url: productUrl },
          delivery: { available: true, estimated_date: '' },
          metadata: { source: 'amazon-scrape', fetched_at: new Date().toISOString() }
        }
      }
    } catch (err) {
      console.warn('Amazon fetch error:', err)
    }

    if (!productData || (!productData.title && !productData.price?.current)) {
      productData = {
        asin,
        product_url: productUrl,
        title: `Amazon Product ${asin}`,
        brand: '',
        description: `Amazon product ${asin}. Click to view details on Amazon.`,
        price: {
          current: 0,
          original: 0,
          currency: 'INR',
          formatted: '₹0'
        },
        availability: 'Unknown',
        rating: { value: 0, count: 0 },
        images: [],
        features: [],
        categories: [],
        seller: { name: 'Amazon', url: productUrl },
        delivery: { available: false, estimated_date: '' },
        metadata: { source: 'fallback', fetched_at: new Date().toISOString() }
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: productData }),
      {
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Origin': origin,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Origin': origin,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    )
  }
})
