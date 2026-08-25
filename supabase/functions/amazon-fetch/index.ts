import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, origin, accept',
  'Access-Control-Max-Age': '86400',
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
    const { urlOrAsin } = await req.json()

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
          metadata: { source: 'amazon-api', fetched_at: new Date().toISOString() }
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
