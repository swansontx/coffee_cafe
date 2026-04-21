import { useState, useEffect, useCallback } from 'react';
import type { InventoryItem, BrewingProgram, PlannerGrid } from '../../types';
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

export default function ProgramPlanner() {
  const weekStarts = [0, 1, 2, 3].map(getWeekMonday);

  const [grid, setGrid] = useState<PlannerGrid | null>(null);
  const [available, setAvailable] = useState<Record<string, InventoryItem[]>>({});
  const [featuredRates, setFeaturedRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadGrid = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const g = await plannerApi.getGrid(weekStarts);
      setGrid(g);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load planner');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGrid(); }, [loadGrid]);

  // Load available coffees for each program/week combination
  useEffect(() => {
    const load = async () => {
      const result: Record<string, InventoryItem[]> = {};
      for (const program of PROGRAMS) {
        for (const week of weekStarts) {
          const key = `${program}__${week}`;
          const burnRate = program === 'featured_espresso' ? (featuredRates[week] ?? undefined) : undefined;
          try {
            result[key] = await inventoryApi.getAvailable(program, week, burnRate);
          } catch {
            result[key] = [];
          }
        }
      }
      setAvailable(result);
    };
    load();
  }, [featuredRates]);

  async function handleSelect(program: BrewingProgram, weekStart: string, inventoryId: string) {
    const key = `${program}__${weekStart}`;
    setSaving(key);
    setError('');
    try {
      const burnRate = program === 'featured_espresso' ? (featuredRates[weekStart] ?? null) : null;
      if (!inventoryId) {
        await plannerApi.clearEntry(weekStart, program);
      } else {
        await plannerApi.setEntry(weekStart, program, inventoryId, burnRate);
      }
      await loadGrid();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(null);
    }
  }

  async function handleFeaturedBurnRateChange(weekStart: string, value: number) {
    setFeaturedRates(prev => ({ ...prev, [weekStart]: value }));
    const entry = grid?.featured_espresso?.[weekStart];
    if (entry?.inventory_id) {
      setSaving(`featured_espresso__${weekStart}`);
      try {
        await plannerApi.setEntry(weekStart, 'featured_espresso', entry.inventory_id, value);
        await loadGrid();
      } finally {
        setSaving(null);
      }
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading planner…</div>;

  return (
    <div>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <p className="text-sm text-gray-500 mb-4">
        Fill in which coffee runs in each program each week. Dropdowns show only coffees that are brew-ready and have lbs remaining.
      </p>

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
              <tr key={program} className="border-b border-gray-100">
                <td className="px-3 py-3 font-medium text-gray-700 bg-gray-50 border border-gray-200 align-top">
                  <div>{PROGRAM_LABELS[program]}</div>
                  {BURN_RATES[program] && (
                    <div className="text-xs text-gray-400">{BURN_RATES[program]} lbs/wk</div>
                  )}
                  {!BURN_RATES[program] && (
                    <div className="text-xs text-gray-400">Variable burn</div>
                  )}
                </td>
                {weekStarts.map(week => {
                  const key = `${program}__${week}`;
                  const entry = grid?.[program]?.[week];
                  const options = available[key] ?? [];
                  const isSaving = saving === key;
                  const currentId = entry?.inventory_id ?? '';

                  return (
                    <td key={week} className="px-3 py-3 border border-gray-200 align-top min-w-[200px]">
                      <PlannerCell
                        program={program}
                        week={week}
                        currentId={currentId}
                        options={options}
                        entry={entry ?? null}
                        isSaving={isSaving}
                        featuredRate={featuredRates[week]}
                        onSelect={id => handleSelect(program, week, id)}
                        onFeaturedRateChange={v => handleFeaturedBurnRateChange(week, v)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlannerCell({
  program,
  currentId,
  options,
  entry,
  isSaving,
  featuredRate,
  onSelect,
  onFeaturedRateChange
}: {
  program: BrewingProgram;
  week: string;
  currentId: string;
  options: InventoryItem[];
  entry: { inventory?: InventoryItem; lbs_at_week_start?: number | null; lbs_at_week_end?: number | null } | null;
  isSaving: boolean;
  featuredRate?: number;
  onSelect: (id: string) => void;
  onFeaturedRateChange: (v: number) => void;
}) {
  const noOptions = options.length === 0 && !currentId;

  return (
    <div className="space-y-1">
      <select
        value={currentId}
        onChange={e => onSelect(e.target.value)}
        disabled={isSaving}
        className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 ${
          noOptions && !currentId ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-300'
        } disabled:opacity-50`}
      >
        {noOptions ? (
          <option value="">⚠️ Nothing available</option>
        ) : (
          <>
            <option value="">— Unassigned —</option>
            {options.map(item => (
              <option key={item.id} value={item.id}>
                {item.roaster} · {item.coffee_name}
              </option>
            ))}
            {/* Keep current selection visible even if it fell off the available list */}
            {currentId && !options.find(o => o.id === currentId) && entry?.inventory && (
              <option value={currentId}>
                {entry.inventory.roaster} · {entry.inventory.coffee_name} (low)
              </option>
            )}
          </>
        )}
      </select>

      {isSaving && <div className="text-xs text-gray-400">Saving…</div>}

      {entry?.inventory && !isSaving && (
        <div className="text-xs text-gray-500 space-y-0.5">
          <div>
            Start: <span className="font-medium">{entry.lbs_at_week_start != null ? `${entry.lbs_at_week_start} lbs` : '—'}</span>
            {' '}→ End: <span className={`font-medium ${(entry.lbs_at_week_end ?? 0) <= 0 ? 'text-red-500' : (entry.lbs_at_week_end ?? 99) < (BURN_RATES[program] ?? 99) ? 'text-yellow-600' : 'text-green-600'}`}>
              {entry.lbs_at_week_end != null ? `${entry.lbs_at_week_end} lbs` : '—'}
            </span>
          </div>
        </div>
      )}

      {program === 'featured_espresso' && entry?.inventory && (
        <div className="flex items-center gap-1 mt-1">
          <label className="text-xs text-gray-500">Burn:</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={featuredRate ?? entry?.lbs_at_week_start ?? ''}
            onChange={e => onFeaturedRateChange(parseFloat(e.target.value))}
            className="w-16 border border-gray-300 rounded px-1.5 py-0.5 text-xs"
            placeholder="lbs/wk"
          />
          <span className="text-xs text-gray-400">lbs/wk</span>
        </div>
      )}
    </div>
  );
}
