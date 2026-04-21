import { useState, useEffect, useCallback } from 'react';
import type { InventoryItem, BrewingProgram, PlannerGrid, CoverageStatus, FreshnessStatus } from '../../types';
import { PROGRAM_LABELS, PROGRAMS, BURN_RATES } from '../../types';
import { inventoryApi, plannerApi } from '../../api/client';

function getWeekMonday(offsetWeeks = 0): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff + offsetWeeks * 7);
  return d.toISOString().split('T')[0];
}

function formatWeekLabel(isoDate: string): string {
  const start = new Date(isoDate + 'T12:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 5);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)}–${fmt(end)}`;
}

function getCoverageStatus(entry: PlannerGrid[BrewingProgram][string] | null, program: BrewingProgram): CoverageStatus {
  if (!entry || !entry.inventory_id) return 'Out';
  const burnRate = entry.featured_burn_rate ?? BURN_RATES[program];
  if (!burnRate) return 'Covered';

  const item = entry.inventory;
  if (item?.brew_ready_date) {
    const weekStart = entry.week_start_date;
    if (item.brew_ready_date > weekStart) return 'Not Brew-Ready';
  }

  const remaining = entry.lbs_at_week_end ?? 0;
  if (remaining <= 0) return 'Out';
  if (remaining < burnRate) return 'Low';
  return 'Covered';
}

const COVERAGE_STYLES: Record<CoverageStatus, { cell: string; badge: string; dot: string }> = {
  Covered: {
    cell: 'bg-green-50',
    badge: 'bg-green-100 text-green-800',
    dot: 'bg-green-500'
  },
  Low: {
    cell: 'bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-800',
    dot: 'bg-yellow-400'
  },
  Out: {
    cell: 'bg-red-50',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500'
  },
  'Not Brew-Ready': {
    cell: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-400'
  }
};

const FRESHNESS_STYLES: Record<FreshnessStatus, string> = {
  OK: 'bg-green-100 text-green-700',
  Watch: 'bg-yellow-100 text-yellow-700',
  Urgent: 'bg-orange-100 text-orange-700',
  Expired: 'bg-red-100 text-red-700'
};

export default function CoverageDashboard() {
  const weekStarts = [0, 1, 2, 3].map(getWeekMonday);

  const [grid, setGrid] = useState<PlannerGrid | null>(null);
  const [retailItems, setRetailItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [g, retail] = await Promise.all([
        plannerApi.getGrid(weekStarts),
        inventoryApi.getAll({ type: 'retail' })
      ]);
      setGrid(g);
      setRetailItems(retail);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading dashboard…</div>;
  if (!grid) return null;

  // Build per-week summary alerts
  const weekAlerts: Record<string, string[]> = {};
  for (const week of weekStarts) {
    const alerts: string[] = [];
    for (const program of PROGRAMS) {
      const entry = grid[program]?.[week];
      const status = getCoverageStatus(entry, program);
      if (status === 'Out') alerts.push(`${PROGRAM_LABELS[program]} has nothing assigned`);
      else if (status === 'Low') alerts.push(`${PROGRAM_LABELS[program]} running low`);
      else if (status === 'Not Brew-Ready') alerts.push(`${PROGRAM_LABELS[program]} coffee still resting`);
    }
    weekAlerts[week] = alerts;
  }

  const hasAnyAlert = Object.values(weekAlerts).some(a => a.length > 0);

  return (
    <div className="space-y-6">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Coverage grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="w-36 text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border border-gray-200">
                Program
              </th>
              {weekStarts.map((week, i) => (
                <th key={week} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border border-gray-200">
                  <div className="text-gray-700">Week {i + 1}</div>
                  <div className="font-normal normal-case text-gray-500">{formatWeekLabel(week)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROGRAMS.map(program => (
              <tr key={program}>
                <td className="px-3 py-3 font-medium text-gray-700 bg-gray-50 border border-gray-200">
                  {PROGRAM_LABELS[program]}
                </td>
                {weekStarts.map(week => {
                  const entry = grid[program]?.[week];
                  const status = getCoverageStatus(entry, program);
                  const styles = COVERAGE_STYLES[status];

                  return (
                    <td key={week} className={`px-3 py-3 border border-gray-200 ${styles.cell}`}>
                      <div className="space-y-1">
                        {entry?.inventory ? (
                          <>
                            <div className="font-medium text-gray-800 text-xs leading-snug">
                              {entry.inventory.roaster} · {entry.inventory.coffee_name}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full inline-block ${styles.dot}`} />
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${styles.badge}`}>{status}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Remaining: <span className={`font-medium ${
                                (entry.lbs_at_week_end ?? 0) <= 0 ? 'text-red-600' :
                                (entry.lbs_at_week_end ?? 99) < (BURN_RATES[program] ?? 99) ? 'text-yellow-700' :
                                'text-gray-700'
                              }`}>
                                {entry.lbs_at_week_end != null ? `${entry.lbs_at_week_end} lbs` : '—'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full inline-block ${styles.dot}`} />
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${styles.badge}`}>Out</span>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Summary row */}
            <tr className="bg-gray-50">
              <td className="px-3 py-2 text-xs font-semibold text-gray-500 border border-gray-200">Summary</td>
              {weekStarts.map(week => {
                const alerts = weekAlerts[week];
                const covered = PROGRAMS.filter(p => getCoverageStatus(grid[p]?.[week], p) === 'Covered').length;
                return (
                  <td key={week} className="px-3 py-2 border border-gray-200 text-xs">
                    <div className="font-medium text-gray-700">{covered}/{PROGRAMS.length} programs covered</div>
                    {alerts.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {alerts.map((a, i) => (
                          <li key={i} className="text-amber-700">⚠ {a}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Alert banner */}
      {hasAnyAlert && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">Action Required</h3>
          <ul className="space-y-1">
            {weekStarts.map((week, i) =>
              weekAlerts[week].map((alert, j) => (
                <li key={`${i}-${j}`} className="text-sm text-amber-700">
                  <span className="font-medium">Week {i + 1} ({formatWeekLabel(week)}):</span> {alert}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {!hasAnyAlert && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700 font-medium">
          All programs covered for the next 4 weeks.
        </div>
      )}

      {/* Retail freshness panel */}
      {retailItems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Retail Freshness</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Coffee</th>
                  <th className="px-3 py-2 text-left">Bags On Hand</th>
                  <th className="px-3 py-2 text-left">Wks Supply</th>
                  <th className="px-3 py-2 text-left">Days to Cutoff</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Suggested Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {retailItems.map(item => (
                  <tr key={item.id} className={item.freshness_status === 'Expired' || item.freshness_status === 'Urgent' ? 'bg-red-50' : item.freshness_status === 'Watch' ? 'bg-yellow-50' : ''}>
                    <td className="px-3 py-2">
                      <div className="font-medium">{item.coffee_name}</div>
                      <div className="text-gray-500 text-xs">{item.roaster}</div>
                    </td>
                    <td className="px-3 py-2">{item.bags_on_hand ?? '—'}</td>
                    <td className="px-3 py-2">{item.weeks_of_supply != null ? `${item.weeks_of_supply}w` : '—'}</td>
                    <td className="px-3 py-2">
                      {item.days_until_cutoff != null ? (
                        <span className={item.days_until_cutoff < 0 ? 'text-red-600 font-medium' : ''}>
                          {item.days_until_cutoff < 0 ? `${Math.abs(item.days_until_cutoff)}d overdue` : `${item.days_until_cutoff}d`}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {item.freshness_status && (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${FRESHNESS_STYLES[item.freshness_status]}`}>
                          {item.freshness_status}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {item.freshness_status === 'Expired' && 'Remove from shelf'}
                      {item.freshness_status === 'Urgent' && 'Discount or move to brewing'}
                      {item.freshness_status === 'Watch' && 'Monitor / consider discount'}
                      {item.freshness_status === 'OK' && '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
