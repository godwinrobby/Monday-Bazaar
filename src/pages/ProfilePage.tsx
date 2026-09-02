import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCircle, ShoppingCart, Package, Heart, ShoppingBag, ChevronRight,
  MapPin, CreditCard, Tag, LogOut, Mail, Lock, Eye, EyeOff, KeyRound,
  ShieldCheck, AlertCircle, Loader2, CheckCircle2, User, Phone, RefreshCw,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ecommerce } from '../db/ecommerce';
import { EcOrder } from '../types/ecommerce';

type AuthMode = 'login' | 'register' | 'forgot';

export const ProfilePage: React.FC = () => {
  const { itemCount } = useCart();
  const { customer, isAuthenticated, loading, login, register, logout, updateProfile, refresh } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Account management states
  const [orders, setOrders] = useState<EcOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [passBusy, setPassBusy] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Load customer orders when authenticated
  useEffect(() => {
    if (isAuthenticated && customer) {
      setOrdersLoading(true);
      ecommerce.listOrdersByCustomer(customer.id)
        .then(setOrders)
        .catch(() => setOrders([]))
        .finally(() => setOrdersLoading(false));
    } else {
      setOrders([]);
    }
  }, [isAuthenticated, customer?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (mode === 'register') {
      if (!name.trim()) { setError('Please enter your name'); return; }
      if (password !== confirm) { setError('Passwords do not match'); return; }
    }
    if (mode === 'forgot') {
      if (!email.trim()) { setError('Please enter your email'); return; }
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        setSuccess('Welcome back! You are now logged in.');
      } else if (mode === 'register') {
        await register({ name, email, phone, password });
        setSuccess('Account created successfully! You are now logged in.');
      } else {
        await ecommerce.resetPassword(email, password);
        setSuccess('Password reset successful. You can now log in with your new password.');
        setMode('login');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    logout();
    setOrders([]);
    setSuccess(null);
    setError(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setError(null);
    setSuccess(null);
    if (newPass !== confirmNewPass) { setError('New passwords do not match'); return; }
    setPassBusy(true);
    try {
      await ecommerce.changePassword(customer.id, curPass, newPass);
      setShowChangePass(false);
      setCurPass(''); setNewPass(''); setConfirmNewPass('');
      setSuccess('Password changed successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setPassBusy(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await updateProfile({ name: editName, phone: editPhone });
      setEditingProfile(false);
      setSuccess('Profile updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setBusy(false);
    }
  };

  const statusColor: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-amber-100 text-amber-700',
    blocked: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return <div className="py-16 text-center text-slate-400"><Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />Loading account...</div>;
  }

  // ====== LOGGED OUT: AUTH SCREEN ======
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-6 pb-24 space-y-5">
        <div className="text-center space-y-1">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 mb-2">
            <UserCircle className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Customer Account</h1>
          <p className="text-xs text-slate-500">Login or create an account to manage your orders &amp; profile.</p>
        </div>

        {/* Mode tabs */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
          {(['login', 'register', 'forgot'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${mode === m ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              {m === 'forgot' ? 'Forgot' : m}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          {mode === 'register' && (
            <Field icon={<User className="w-4 h-4" />}>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name *" className="w-full bg-transparent focus:outline-none text-sm" />
            </Field>
          )}
          <Field icon={<Mail className="w-4 h-4" />}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email *" className="w-full bg-transparent focus:outline-none text-sm" />
          </Field>
          {mode === 'register' && (
            <Field icon={<Phone className="w-4 h-4" />}>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full bg-transparent focus:outline-none text-sm" />
            </Field>
          )}
          <Field icon={<Lock className="w-4 h-4" />}>
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'forgot' ? 'New Password *' : 'Password *'} className="w-full bg-transparent focus:outline-none text-sm" />
            <button type="button" onClick={() => setShowPass(v => !v)} className="text-slate-400 hover:text-slate-600">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </Field>
          {mode === 'register' && (
            <Field icon={<Lock className="w-4 h-4" />}>
              <input type={showPass ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm Password *" className="w-full bg-transparent focus:outline-none text-sm" />
            </Field>
          )}

          {error && <p className="flex items-center gap-1.5 text-xs text-red-600"><AlertCircle className="w-3.5 h-3.5" /> {error}</p>}
          {success && <p className="flex items-center gap-1.5 text-xs text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> {success}</p>}

          <button type="submit" disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-500 text-white text-sm font-black rounded-xl hover:bg-indigo-600 disabled:opacity-60 transition-colors">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Please wait...</> : mode === 'login' ? 'Login' : mode === 'register' ? 'Create Account' : 'Reset Password'}
          </button>

          <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Your password is securely hashed. We never store or display your actual password.
          </p>
        </form>

        <p className="text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <>Don't have an account? <button onClick={() => setMode('register')} className="text-indigo-600 font-bold">Register</button></>
          ) : mode === 'register' ? (
            <>Already have an account? <button onClick={() => setMode('login')} className="text-indigo-600 font-bold">Login</button></>
          ) : (
            <button onClick={() => setMode('login')} className="text-indigo-600 font-bold">Back to Login</button>
          )}
        </p>
      </div>
    );
  }

  // ====== LOGGED IN: ACCOUNT DASHBOARD ======
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <UserCircle className="w-9 h-9" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-slate-900 truncate">{customer.name || 'Customer'}</h1>
          <p className="text-xs text-slate-500 truncate">{customer.email}</p>
          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${statusColor[customer.status] || 'bg-slate-100 text-slate-600'}`}>
            <ShieldCheck className="w-3 h-3" /> {customer.status}
          </span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {error && <p className="flex items-center gap-1.5 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700"><AlertCircle className="w-4 h-4" /> {error}</p>}
      {success && <p className="flex items-center gap-1.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700"><CheckCircle2 className="w-4 h-4" /> {success}</p>}

      {/* Account info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><UserCircle className="w-4 h-4 text-indigo-500" /> Account Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 rounded-xl p-3"><span className="text-slate-500 block text-[10px] uppercase tracking-wide">Email</span><span className="font-bold text-slate-900 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {customer.email}</span></div>
          <div className="bg-slate-50 rounded-xl p-3"><span className="text-slate-500 block text-[10px] uppercase tracking-wide">Phone</span><span className="font-bold text-slate-900 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {customer.phone || '—'}</span></div>
          <div className="bg-slate-50 rounded-xl p-3"><span className="text-slate-500 block text-[10px] uppercase tracking-wide">Password</span><span className="font-bold text-slate-900 flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5 text-slate-400" /> •••••••• (secured)</span></div>
          <div className="bg-slate-50 rounded-xl p-3"><span className="text-slate-500 block text-[10px] uppercase tracking-wide">Member Since</span><span className="font-bold text-slate-900">{customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</span></div>
        </div>

        {/* Edit profile */}
        {!editingProfile ? (
          <button onClick={() => { setEditingProfile(true); setEditName(customer.name || ''); setEditPhone(customer.phone || ''); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-colors">
            <User className="w-4 h-4" /> Edit Profile
          </button>
        ) : (
          <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Field icon={<User className="w-4 h-4" />}><input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name" className="w-full bg-transparent focus:outline-none text-sm" /></Field>
            <Field icon={<Phone className="w-4 h-4" />}><input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Phone" className="w-full bg-transparent focus:outline-none text-sm" /></Field>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" disabled={busy} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save</button>
              <button type="button" onClick={() => setEditingProfile(false)} className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* Change password */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><KeyRound className="w-4 h-4 text-indigo-500" /> Security</h3>
        {!showChangePass ? (
          <button onClick={() => setShowChangePass(true)} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-4 h-4" /> Change Password
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-3">
            <Field icon={<Lock className="w-4 h-4" />}><input type="password" value={curPass} onChange={e => setCurPass(e.target.value)} placeholder="Current password *" className="w-full bg-transparent focus:outline-none text-sm" /></Field>
            <Field icon={<Lock className="w-4 h-4" />}><input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password *" className="w-full bg-transparent focus:outline-none text-sm" /></Field>
            <Field icon={<Lock className="w-4 h-4" />}><input type="password" value={confirmNewPass} onChange={e => setConfirmNewPass(e.target.value)} placeholder="Confirm new password *" className="w-full bg-transparent focus:outline-none text-sm" /></Field>
            <div className="flex gap-2">
              <button type="submit" disabled={passBusy} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl disabled:opacity-60">{passBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Update Password</button>
              <button type="button" onClick={() => setShowChangePass(false)} className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* My Orders */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Package className="w-4 h-4 text-indigo-500" /> My Orders</h3>
          <Link to="/orders" className="text-xs font-bold text-indigo-600 hover:underline">View all</Link>
        </div>
        {ordersLoading ? (
          <div className="py-8 text-center text-slate-400 text-xs"><Loader2 className="w-5 h-5 mx-auto animate-spin mb-2" />Loading orders...</div>
        ) : orders.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No orders yet. <Link to="/shop" className="text-indigo-600 font-bold">Start shopping</Link></p>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 3).map(o => (
              <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div>
                  <div className="font-bold text-slate-900 text-xs">#{o.order_number?.slice(-8) || o.id.slice(-8)}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{o.status}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-slate-900 text-sm">₹{Number(o.total || 0).toLocaleString('en-IN')}</div>
                  <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
        <Link to="/orders" className="flex items-center gap-4 p-4 hover:bg-slate-50"><div className="p-2.5 rounded-xl bg-slate-50 shrink-0"><Package className="w-5 h-5 text-indigo-500" /></div><div className="flex-1"><div className="font-bold text-slate-900 text-sm">All Orders</div><div className="text-xs text-slate-500">Track and manage your orders</div></div><ChevronRight className="w-4 h-4 text-slate-300" /></Link>
        <Link to="/cart" className="flex items-center gap-4 p-4 hover:bg-slate-50"><div className="p-2.5 rounded-xl bg-slate-50 shrink-0"><ShoppingCart className="w-5 h-5 text-emerald-500" /></div><div className="flex-1"><div className="font-bold text-slate-900 text-sm">Your Cart</div><div className="text-xs text-slate-500">{itemCount} item{itemCount === 1 ? '' : 's'} ready to checkout</div></div><ChevronRight className="w-4 h-4 text-slate-300" /></Link>
        <Link to="/watchlist" className="flex items-center gap-4 p-4 hover:bg-slate-50"><div className="p-2.5 rounded-xl bg-slate-50 shrink-0"><Heart className="w-5 h-5 text-rose-500" /></div><div className="flex-1"><div className="font-bold text-slate-900 text-sm">Watchlist</div><div className="text-xs text-slate-500">Deals you saved for later</div></div><ChevronRight className="w-4 h-4 text-slate-300" /></Link>
        <Link to="/shop" className="flex items-center gap-4 p-4 hover:bg-slate-50"><div className="p-2.5 rounded-xl bg-slate-50 shrink-0"><ShoppingBag className="w-5 h-5 text-amber-500" /></div><div className="flex-1"><div className="font-bold text-slate-900 text-sm">Continue Shopping</div><div className="text-xs text-slate-500">Browse the e-commerce store</div></div><ChevronRight className="w-4 h-4 text-slate-300" /></Link>
      </div>

      <p className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Your password is securely hashed and never displayed.</p>
    </div>
  );
};

const Field: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
    {icon}
    {children}
  </div>
);
