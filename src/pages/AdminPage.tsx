import React, { useState, useEffect } from 'react';
import { Deal } from '../types';
import { AdminDashboard } from '../components/AdminDashboard';
import { AdminLogin } from '../components/AdminLogin';
import { useNavigate } from 'react-router-dom';

// Supabase REST API constants
const SUPABASE_URL = 'https://pmvnyxpyypifneqojlqq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_QdwxI3KvRW5Ro-vY5XPuQg_Cg4mLVdD';
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;

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

    // Verify session directly against Supabase REST API
    const verifySession = async () => {
      try {
        if (parsedUser?.id) {
          // Fetch admin user directly from Supabase
          const res = await fetch(`${SUPABASE_REST_URL}/users?select=*&id=eq.${encodeURIComponent(parsedUser.id)}&role=eq.admin&limit=1`, {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            }
          });
          const data = await res.json();
          if (res.ok && Array.isArray(data) && data.length > 0) {
            const user = data[0];
            const safeUser = {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              avatarUrl: user.avatarurl || user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
              createdAt: user.created_at || user.createdAt || new Date().toISOString()
            };
            sessionStorage.setItem('admin_user', JSON.stringify(safeUser));
            setAdminUser(safeUser);
            setIsAuthenticated(true);
          } else {
            sessionStorage.removeItem('admin_token');
            sessionStorage.removeItem('admin_user');
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (e) {
        // Fallback to cached session if Supabase is unreachable
        if (parsedUser && parsedUser.role === 'admin') {
          setAdminUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };
    verifySession();
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
