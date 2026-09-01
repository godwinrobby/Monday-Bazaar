import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Supabase Edge Function: social-post
// Server-side Facebook Page / Instagram Business feed publishing so the Page
// Access Token is NEVER exposed to the browser.
// POST { platform: 'facebook'|'instagram', deal: {...}, caption?: string }
// -> { success, simulated?, postUrl?, postId?, message }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, origin, accept',
  'Access-Control-Max-Age': '86400',
}

const GRAPH = 'https://graph.facebook.com/v19.0';

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface DealInput {
  id?: string;
  title?: string;
  imageUrl?: string;
}

async function loadConfig(supabaseUrl: string, serviceKey: string): Promise<any> {
  const cfgRes = await fetch(
    `${supabaseUrl}/rest/v1/site_config?config_key=eq.social_config&select=config_value`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
  );
  if (!cfgRes.ok) throw new Error(`Failed to load social config (HTTP ${cfgRes.status}).`);
  const cfgRows = await cfgRes.json().catch(() => []);
  const raw = Array.isArray(cfgRows) && cfgRows[0]?.config_value ? cfgRows[0].config_value : null;
  if (!raw) return {};
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

async function writeLog(
  supabaseUrl: string, serviceKey: string,
  platform: string, dealId: string, dealTitle: string,
  status: string, message: string, postUrl?: string
) {
  try {
    await fetch(`${supabaseUrl}/rest/v1/social_logs`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        platform,
        deal_id: dealId || '',
        deal_title: dealTitle || 'Deal',
        status,
        post_url: postUrl ?? null,
        message,
        posted_at: new Date().toISOString(),
      }),
    });
  } catch {
    // Logging must never break the publish flow
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed. Use POST.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) {
    return json({ success: false, error: 'Supabase environment is not configured.' }, 500);
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  const platform = body?.platform;
  if (platform !== 'facebook' && platform !== 'instagram') {
    return json({ success: false, error: '"platform" must be "facebook" or "instagram".' }, 400);
  }
  const deal: DealInput = body?.deal ?? {};
  if (!deal || typeof deal !== 'object') {
    return json({ success: false, error: '"deal" object is required.' }, 400);
  }
  const caption = typeof body?.caption === 'string' && body.caption.trim()
    ? body.caption.slice(0, 2200)
    : '';

  let config: any;
  try {
    config = await loadConfig(supabaseUrl, serviceKey);
  } catch (e: any) {
    return json({ success: false, error: e?.message || 'Failed to load social config.' }, 502);
  }

  if (platform === 'facebook') {
    const pageId = config.facebookPageId;
    const token = config.facebookAccessToken;
    if (!pageId || !token) {
      const message = '[Test Mode] Post generated. Enter Facebook Page ID & Access Token in Admin to publish live.';
      await writeLog(supabaseUrl, serviceKey, platform, deal.id || '', deal.title || '', 'SIMULATED', message);
      return json({ success: true, simulated: true, message });
    }
    if (typeof pageId !== 'string' || !/^\d+(\.\d+)?$/.test(pageId.trim())) {
      const message = 'Facebook Page ID looks invalid. Use the numeric Page ID from your Page About/settings section.';
      await writeLog(supabaseUrl, serviceKey, platform, deal.id || '', deal.title || '', 'FAILED', message);
      return json({ success: false, message });
    }
    try {
      const usePhoto = Boolean(deal.imageUrl);
      const endpoint = usePhoto ? `${GRAPH}/${pageId}/photos` : `${GRAPH}/${pageId}/feed`;
      const payload: Record<string, string> = { access_token: token, caption };
      if (usePhoto) payload.url = deal.imageUrl!;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        const msg = data.error?.message || `Facebook Graph API HTTP ${res.status}`;
        let friendly = `Facebook publish failed: ${msg}`;
        if (data.error?.code === 190 || /access token|expired/i.test(msg)) {
          friendly = 'Facebook Access Token is invalid or expired. Generate a new long-lived Page Access Token and update it in Admin settings.';
        } else if (/permission|authorize|pages_manage/i.test(msg)) {
          friendly = 'Facebook Page token lacks required permissions (pages_manage_posts, pages_read_engagement). Re-authorize the token.';
        } else if (/image|photo|url/i.test(msg) && usePhoto) {
          friendly = 'Facebook rejected the image URL. The deal image must be publicly accessible over HTTPS.';
        }
        await writeLog(supabaseUrl, serviceKey, platform, deal.id || '', deal.title || '', 'FAILED', friendly);
        return json({ success: false, message: friendly });
      }
      const postId = data.post_id || data.id;
      const postUrl = `https://facebook.com/${postId}`;
      await writeLog(supabaseUrl, serviceKey, platform, deal.id || '', deal.title || '', 'SUCCESS', 'Published to Facebook Page feed.', postUrl);
      return json({ success: true, postId, postUrl, message: 'Published to Facebook Page feed!' });
    } catch (e: any) {
      const message = `Facebook publish failed: ${e?.message || 'network error'}`;
      await writeLog(supabaseUrl, serviceKey, platform, deal.id || '', deal.title || '', 'FAILED', message);
      return json({ success: false, message });
    }
  }

  // Instagram: container -> publish
  const accountId = config.instagramAccountId;
  const token = config.instagramAccessToken;
  if (!accountId || !token) {
    const message = '[Test Mode] Post generated. Enter Instagram Account ID & Access Token in Admin to publish live.';
    await writeLog(supabaseUrl, serviceKey, platform, deal.id || '', deal.title || '', 'SIMULATED', message);
    return json({ success: true, simulated: true, message });
  }
  if (!deal.imageUrl) {
    const message = 'Instagram Feed requires a valid public image URL.';
    await writeLog(supabaseUrl, serviceKey, platform, deal.id || '', deal.title || '', 'FAILED', message);
    return json({ success: false, message });
  }
  try {
    const containerRes = await fetch(`${GRAPH}/${accountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: deal.imageUrl, caption, access_token: token }),
    });
    const container = await containerRes.json().catch(() => ({}));
    if (!containerRes.ok || container.error) {
      const msg = container.error?.message || `Instagram container HTTP ${containerRes.status}`;
      let friendly = `Instagram media container failed: ${msg}`;
      if (container.error?.code === 190 || /access token|expired/i.test(msg)) {
        friendly = 'Instagram Access Token is invalid or expired. Generate a new token and update it in Admin settings.';
      } else if (/image|url/i.test(msg)) {
        friendly = 'Instagram rejected the image URL. It must be a publicly accessible HTTPS image (jpg/png).';
      }
      await writeLog(supabaseUrl, serviceKey, platform, deal.id || '', deal.title || '', 'FAILED', friendly);
      return json({ success: false, message: friendly });
    }
    const publishRes = await fetch(`${GRAPH}/${accountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: container.id, access_token: token }),
    });
    const published = await publishRes.json().catch(() => ({}));
    if (!publishRes.ok || published.error) {
      const friendly = `Instagram publish failed: ${published.error?.message || `HTTP ${publishRes.status}`}`;
      await writeLog(supabaseUrl, serviceKey, platform, deal.id || '', deal.title || '', 'FAILED', friendly);
      return json({ success: false, message: friendly });
    }
    const postUrl = `https://instagram.com/p/${published.id}`;
    await writeLog(supabaseUrl, serviceKey, platform, deal.id || '', deal.title || '', 'SUCCESS', 'Published to Instagram Business feed.', postUrl);
    return json({ success: true, postId: published.id, postUrl, message: 'Published to Instagram Business feed!' });
  } catch (e: any) {
    const message = `Instagram publish failed: ${e?.message || 'network error'}`;
    await writeLog(supabaseUrl, serviceKey, platform, deal.id || '', deal.title || '', 'FAILED', message);
    return json({ success: false, message });
  }
});