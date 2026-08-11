import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Deal } from '../types';
import { supabaseDb } from '../db/supabaseDb';
import { DealDetailPage } from '../components/DealDetailPage';

interface DealDetailsRouteProps {
  deals: Deal[];
  onVote: (dealId: string, type: 'up' | 'down') => void;
  onAddComment: (dealId: string, text: string) => void;
  onOpenPriceAlert: (deal: Deal) => void;
  savedDealIds: string[];
  onToggleSave: (deal: Deal) => void;
}

export const DealDetailsRoute: React.FC<DealDetailsRouteProps> = ({
  deals,
  onVote,
  onAddComment,
  onOpenPriceAlert,
  savedDealIds,
  onToggleSave,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) return;
    const found = deals.find(d => d.id === id);
    if (found) {
      setDeal(found);
      setLoading(false);
    } else {
      // Fetch directly from Supabase database if opened directly or refreshed
      supabaseDb.getDealById(id)
        .then(fetched => {
          if (fetched) {
            setDeal(fetched);
          } else {
            return supabaseDb.getDeals().then(allDeals => {
              const matched = allDeals.find(d => d.id === id);
              setDeal(matched || null);
            });
          }
        })
        .catch(err => console.error('Error fetching deal route detail:', err))
        .finally(() => setLoading(false));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, deals]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-semibold text-sm">Loading deal details from database...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 my-8 shadow-xs">
        <div className="text-4xl">🔍</div>
        <h2 className="text-xl font-bold text-slate-900">Deal Not Found</h2>
        <p className="text-slate-500 text-sm">The deal you are looking for might have expired or been removed.</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl text-xs hover:bg-orange-600 transition-colors"
        >
          Explore Live Deals
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-full overflow-x-hidden">
      <DealDetailPage
        deal={deal}
        onBack={() => navigate('/')}
        onVote={onVote}
        onAddComment={onAddComment}
        onOpenPriceAlert={onOpenPriceAlert}
        isSaved={savedDealIds.includes(deal.id)}
        onToggleSave={onToggleSave}
        allDeals={deals}
        onSelectDeal={(d) => {
          navigate(`/deal/${d.id}`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </main>
  );
};
