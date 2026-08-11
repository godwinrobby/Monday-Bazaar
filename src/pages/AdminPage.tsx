import React, { useState, useEffect } from 'react';
import { Deal } from '../types';
import { AdminDashboard } from '../components/AdminDashboard';
import { AdminLogin } from '../components/AdminLogin';
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Check saved admin session token on mount
  useEffect(() => {
    // Clear legacy localStorage keys
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');

    const token = sessionStorage.getItem('admin_token');
    const savedUser = sessionStorage.getItem('admin_user');

    if (!token) {
      setIsCheckingAuth(false);
      setIsAuthenticated(false);
      return;
    }

    let parsedUser = null;
    try {
      if (savedUser) parsedUser = JSON.parse(savedUser);
    } catch (e) {}

    // Verify token with server
    fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId: parsedUser?.id })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setAdminUser(data.user);
          setIsAuthenticated(true);
        } else {
          sessionStorage.removeItem('admin_token');
          sessionStorage.removeItem('admin_user');
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        if (parsedUser && parsedUser.role === 'admin') {
          setAdminUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAdminUser(null);
    setIsAuthenticated(false);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-white font-sans">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-slate-300">Verifying Database Admin Credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLogin
        onLoginSuccess={(user) => {
          setAdminUser(user);
          setIsAuthenticated(true);
        }}
        onBackToStore={() => navigate('/')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 selection:bg-orange-500 selection:text-white">
      <AdminDashboard
        deals={deals}
        onAddDeal={onAddDeal}
        onUpdateDeal={onUpdateDeal}
        onDeleteDeal={onDeleteDeal}
        onCloseAdmin={() => navigate('/')}
        adminUser={adminUser}
        onLogout={handleLogout}
      />
    </div>
  );
};
