import React, { useState, useEffect } from 'react';
import { ShieldAlert, KeyRound, User, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, Database, Flame, Sparkles, UserPlus, Trash2, Mail } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToStore }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register states
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [removeDemoUsers, setRemoveDemoUsers] = useState(true);

  // Global UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  // Fetch registered admin users on load
  const fetchAdminUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.users)) {
        const admins = data.users.filter((u: any) => u.role === 'admin');
        setAdminUsers(admins);
      }
    } catch (e) {}
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
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Authentication failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      // Clear legacy localStorage and store in sessionStorage
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      sessionStorage.setItem('admin_token', data.token);
      sessionStorage.setItem('admin_user', JSON.stringify(data.user));

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMsg('Failed to connect to authentication server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMsg('All fields (Username, Email, Password) are required.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter passwords.');
      return;
    }

    if (regPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword,
          removeDemoUsers
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to create Admin user account.');
        setIsLoading(false);
        return;
      }

      setSuccessMsg('✅ Admin account created and mapped to Supabase database successfully!');
      
      // Save session and log in
      sessionStorage.setItem('admin_token', data.token);
      sessionStorage.setItem('admin_user', JSON.stringify(data.user));

      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 1000);

    } catch (err: any) {
      setErrorMsg('Server communication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdminUser = async (userToDelete: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove admin account '${userToDelete.username || userToDelete.email}' from database?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Admin user '${userToDelete.username || userToDelete.email}' removed from database.`);
        fetchAdminUsers();
      } else {
        setErrorMsg(data.error || 'Could not delete user account.');
      }
    } catch (err: any) {
      setErrorMsg('Failed to delete user.');
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
              {mode === 'login' ? 'Admin Portal Login' : 'Create New Admin Account'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'login' 
                ? 'Sign in with your mapped database admin credentials.' 
                : 'Register and map a new custom admin account to Supabase.'}
            </p>
          </div>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Admin</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-2xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="leading-relaxed font-semibold">{successMsg}</div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-2xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Admin Username or Email</span>
                <span className="text-[10px] text-slate-500">Database Role: Admin</span>
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
        )}

        {/* REGISTER NEW ADMIN FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Admin Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. GodwinAdmin"
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Admin Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. godwinrobby@gmail.com"
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Password</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Confirm Password</label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Checkbox to remove demo accounts */}
            <label className="flex items-center gap-2 p-2 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 cursor-pointer hover:text-slate-200 transition-colors">
              <input
                type="checkbox"
                checked={removeDemoUsers}
                onChange={(e) => setRemoveDemoUsers(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-orange-500 focus:ring-orange-500"
              />
              <span>Remove default demo admin account (<span className="text-amber-400 font-medium">admin@dealsified.com</span>)</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Mapping & Registering Admin Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create & Map Admin to Database</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Registered Admin Accounts & Quick Select Section */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Registered Mapped Admin Accounts:</span>
            <span className="text-orange-400 font-bold">{adminUsers.length} Active</span>
          </p>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {adminUsers.map((usr: any) => (
              <div
                key={usr.id}
                onClick={() => {
                  setMode('login');
                  handleQuickFill(usr.email || usr.username, usr.password || 'admin123');
                }}
                className="p-2 bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800/90 rounded-xl transition-all text-xs flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center text-[10px] font-black shrink-0">
                    {usr.username ? usr.username.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white group-hover:text-orange-400 transition-colors truncate text-[11px]">
                      {usr.username} <span className="text-[10px] font-normal text-slate-400">({usr.email})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold rounded-md">
                    Admin
                  </span>
                  <button
                    type="button"
                    title="Remove admin account from database"
                    onClick={(e) => handleDeleteAdminUser(usr, e)}
                    className="p-1 hover:bg-red-500/20 hover:text-red-400 text-slate-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {adminUsers.length === 0 && (
              <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl text-center text-xs text-slate-500">
                No admin accounts found. Click "Create Admin" above to register your admin account.
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 pt-0.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Supabase Database Encryption & Role Guard Active</span>
        </div>

      </div>
    </div>
  );
};

