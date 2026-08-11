import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto my-16 px-4 text-center space-y-6">
      <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
        <Flame className="w-10 h-10 fill-orange-500 text-orange-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900">404</h1>
        <h2 className="text-xl font-bold text-slate-800">Page Not Found</h2>
        <p className="text-xs text-slate-500">
          The deal page or directory link you followed doesn't exist or has moved.
        </p>
      </div>
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
      >
        <Home className="w-4 h-4 text-orange-400" />
        Back to Home Deals
      </button>
    </div>
  );
};
