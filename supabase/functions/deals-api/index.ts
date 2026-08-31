import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Supabase Edge Function: deals-api
// Paginated product/deal listing API for the User App (Home page + Category pages).
// POST { page, limit, category, store, search, sortBy, onlyLoot, onlyCoupons }
// -> { success, deals, page, limit, total, totalPages, hasMore }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, origin, accept, prefer',
  'Access-Control-Max-Age': '86400',
}

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 12;

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Map a PostgREST sort key from the app's sortBy values (must match the
// client-side sorting semantics used by the app today).
function orderForSort(sortBy?: string): string {
  switch (sortBy) {
    case 'hot': return 'upvotes.desc.aiscore.desc';
    case 'discount': return 'discountpercentage.desc';
    case 'ai_score': return 'aiscore.desc';
    case 'price_low': return 'dealprice.asc';
    case 'price_high': return 'dealprice.desc';
    case 'oldest': return 'created_at.asc';
    case 'newest':
    default: return 'created_at.desc';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  // Prefer service role (bypasses RLS for public catalog reads); fall back to anon key.
  const apiKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  if (!supabaseUrl || !apiKey) {
    return jsonResponse({ success: false, error: 'Supabase is not configured (missing SUPABASE_URL or key).' }, 500);
  }

  try {
    let params: any = {};
    if (req.method === 'POST') {
      params = await req.json().catch(() => ({}));
    } else {
      params = Object.fromEntries(new URL(req.url).searchParams.entries());
    }

    const page = Math.max(1, Math.floor(Number(params.page) || 1));
    const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(Number(params.limit) || DEFAULT_LIMIT)));
    const from = (page - 1) * limit;

    const searchParams = new URLSearchParams();
    searchParams.set('select', '*');
    // Only active deals are shown in the User App
    searchParams.set('isactive', 'eq.true');

    if (params.category && params.category !== 'All') {
      searchParams.set('category', `ilike.${params.category}`);
    }
    if (params.store && params.store !== 'All') {
      searchParams.set('store', `eq.${params.store}`);
    }
    if (params.onlyLoot === true || params.onlyLoot === 'true') {
      searchParams.set('islootdeal', 'eq.true');
    }
    if (params.onlyCoupons === true || params.onlyCoupons === 'true') {
      searchParams.set('couponcode', 'neq.');
      searchParams.append('couponcode', 'not.is');
    }
    if (params.search && String(params.search).trim()) {
      const q = String(params.search).trim().replace(/[(),*]/g, ' ').trim();
      if (q) {
        searchParams.set(
          'or',
          `(title.ilike.*${q}*,store.ilike.*${q}*,category.ilike.*${q}*,description.ilike.*${q}*,couponcode.ilike.*${q}*)`
        );
      }
    }

    searchParams.set('order', orderForSort(params.sortBy));
    searchParams.set('limit', String(limit));
    searchParams.set('offset', String(from));

    const restUrl = `${supabaseUrl}/rest/v1/deals?${searchParams.toString()}`;
    const res = await fetch(restUrl, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        // Ask PostgREST for the exact total row count of the filtered query
        Prefer: 'count=exact',
      },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return jsonResponse({
        success: false,
        error: `Database query failed (HTTP ${res.status}): ${errText.slice(0, 300)}`,
      }, 502);
    }

    const totalHeader = res.headers.get('content-range'); // e.g. "0-11/245"
    const rows = await res.json();

    let total = Array.isArray(rows) ? rows.length : 0;
    if (totalHeader && totalHeader.includes('/')) {
      const parsed = Number(totalHeader.split('/')[1]);
      if (!Number.isNaN(parsed)) total = parsed;
    }
    const totalPages = Math.ceil(total / limit) || 0;

    return jsonResponse({
      success: true,
      deals: Array.isArray(rows) ? rows : [],
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    });
  } catch (e: any) {
    return jsonResponse({ success: false, error: e?.message || 'Unexpected server error' }, 500);
  }
});