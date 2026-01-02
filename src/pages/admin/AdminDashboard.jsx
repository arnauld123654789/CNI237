import React from 'react';

export const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl md:text-3xl font-bold">Tableau de bord</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <p className="text-sm text-slate-600">Points de retrait</p>
          <p className="text-3xl font-bold">—</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <p className="text-sm text-slate-600">Enregistrements</p>
          <p className="text-3xl font-bold">—</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <p className="text-sm text-slate-600">Utilisateurs</p>
          <p className="text-3xl font-bold">—</p>
        </div>
      </div>
      <p className="text-slate-600 text-sm">Utilisez la navigation pour gérer les points de retrait et les données.</p>
    </div>
  );
};