import React from 'react';
import { Deal } from '../types';
import { AdminDashboard } from '../components/AdminDashboard';
import { useNavigate } from 'react-router-dom';

interface AdminPageProps {
  deals: Deal[];
  onAddDeal: (newDealData: Partial<Deal>) => Promise<{ success: boolean; error?: string; deal?: Deal }>;
  onUpdateDeal: (updatedDeal: Deal) => void;
  onDeleteDeal: (dealId: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  deals,
  onAddDeal,
  onUpdateDeal,
  onDeleteDeal,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 selection:bg-orange-500 selection:text-white">
      <AdminDashboard
        deals={deals}
        onAddDeal={onAddDeal}
        onUpdateDeal={onUpdateDeal}
        onDeleteDeal={onDeleteDeal}
        onCloseAdmin={() => navigate('/')}
      />
    </div>
  );
};
