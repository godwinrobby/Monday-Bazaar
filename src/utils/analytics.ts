// Helper functions to log outbound link clicks and deal views to the backend database

export async function recordLinkClick(deal: {
  id: string;
  title: string;
  store: string;
  dealUrl: string;
}): Promise<void> {
  try {
    await fetch('/api/clicks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dealId: deal.id,
        dealTitle: deal.title,
        store: deal.store,
        affiliateUrl: deal.dealUrl,
        userId: 'user_demo'
      })
    });
  } catch (err) {
    console.warn('Click logging error:', err);
  }
}

export async function recordDealView(dealId: string): Promise<void> {
  try {
    await fetch(`/api/deals/${dealId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user_demo' })
    });
  } catch (err) {
    console.warn('View logging error:', err);
  }
}
