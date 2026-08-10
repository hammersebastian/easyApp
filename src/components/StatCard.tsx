import type { ReactNode } from 'react';

export function StatCard({ label, value, helper, icon }: { label: string; value: string; helper?: string; icon?: ReactNode }) {
  return (
    <article className="stat-card">
      <div className="stat-card__top">{icon}<span>{label}</span></div>
      <strong>{value}</strong>
      {helper && <small>{helper}</small>}
    </article>
  );
}
