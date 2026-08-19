import React, { useState, useEffect } from 'react';
import { ShieldAlert, KeyRound, User, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, Database, Flame, Sparkles } from 'lucide-react';

// Supabase REST API constants
const SUPABASE_URL = 'https://pmvnyxpyypifneqojlqq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_QdwxI3KvRW5Ro-vY5XPuQg_Cg4mLVdD';
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;

interface AdminLoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToStore }) => {
  // Login states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Global UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  // Fetch registered admin users directly from Supabase REST API
  const fetchAdminUsers = async () => {
    try {
      const res = await fetch(`${SUPABASE_REST_URL}/users?select=*&role=eq.admin`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAdminUsers(data);
      }
    } catch (e) {
      console.error('Supabase fetch admin users error:', e);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setErrorMsg('Please enter both Email/Username and Password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const input = usernameOrEmail.trim().toLowerCase();

      // 1. Try exact email match against Supabase REST API
      let userData = null;
      const emailRes = await fetch(`${SUPABASE_REST_URL}/users?select=*&email=eq.${encodeURIComponent(input)}&role=eq.admin&limit=1`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (emailRes.ok) {
        const emailData = await emailRes.json();
        if (Array.isArray(emailData) && emailData.length > 0) {
          userData = emailData[0];
        }
      }

      // If no email match, try username match
      if (!userData) {
        const usernameRes = await fetch(`${SUPABASE_REST_URL}/users?select=*&username=eq.${encodeURIComponent(input)}&role=eq.admin&limit=1`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (usernameRes.ok) {
          const usernameData = await usernameRes.json();
          if (Array.isArray(usernameData) && usernameData.length > 0) {
            userData = usernameData[0];
          }
        }
      }

      // Verify password
      if (!userData) {
        setErrorMsg('Invalid username/email. No matching admin account found in Supabase database.');
        setIsLoading(false);
        return;
      }

      const expectedPass = userData.password || 'admin123';
      if (password !== expectedPass) {
        setErrorMsg('Invalid password. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      // Build safe user object
      const safeUser = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        avatarUrl: userData.avatarurl || userData.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        createdAt: userData.created_at || userData.createdAt || new Date().toISOString()
      };

      // Generate session token
      const token = `admin_sess_${Date.now()}_${Array.from(userData.id).map(c => c.charCodeAt(0).toString(16)).join('')}`;

      // Store session
      sessionStorage.setItem('admin_token', token);
      sessionStorage.setItem('admin_user', JSON.stringify(safeUser));

      onLoginSuccess(safeUser, token);
    } catch (err: any) {
      setErrorMsg('Failed to connect to Supabase database. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (email: string, pass: string) => {
    setUsernameOrEmail(email);
    setPassword(pass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden">
      
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Back button */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-800 shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-orange-400" />
          <span>Return to Storefront</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20">
            <ShieldAlert className="w-7 h-7 text-white fill-white/20" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-extrabold uppercase tracking-widest rounded-full mb-1">
              <Database className="w-3 h-3 text-amber-400" />
              Authenticated Admin Portal
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">
              Admin Portal Login
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Sign in with your database admin credentials to access management console.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-2xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Admin Username or Email</span>
              <span className="text-[10px] text-slate-500">Role: Admin</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="admin-login-username"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="e.g. godwinrobby@gmail.com or admin"
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">
              <span>Password</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                id="admin-login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-10 py-2 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            id="admin-login-submit-btn"
            className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Sign In to Admin Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Select Admin Credentials mapped from Supabase */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Supabase Mapped Admin Accounts:</span>
            <span className="text-orange-400 font-bold">{adminUsers.length} Mapped</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-0.5">
            {adminUsers.map((usr: any) => (
              <button
                key={usr.id}
                type="button"
                onClick={() => handleQuickFill(usr.email || usr.username, usr.password || 'admin123')}
                className="p-2.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-all text-xs group cursor-pointer flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center text-[11px] font-black shrink-0">
                  {usr.username ? usr.username.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white group-hover:text-orange-400 transition-colors truncate text-[11px]">
                    {usr.username}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{usr.email}</div>
                </div>
              </button>
            ))}
            {adminUsers.length === 0 && (
              <div className="col-span-2 text-center p-2 text-xs text-slate-500">
                Loading mapped admin accounts from database...
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 pt-0.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Supabase Database Role Guard Active</span>
        </div>

      </div>
    </div>
  );
};

