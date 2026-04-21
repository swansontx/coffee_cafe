import { useState, useEffect, useCallback } from 'react';
import type { InventoryItem, BrewingStatus, FreshnessStatus } from '../../types';
import { PROGRAM_LABELS } from '../../types';
import { inventoryApi } from '../../api/client';
import InventoryForm from './InventoryForm';

type FilterTab = 'all' | 'brewing' | 'retail';

const STATUS_COLORS: Record<BrewingStatus, string> = {
  Ordered: 'bg-gray-100 text-gray-600',
  'In Transit': 'bg-blue-100 text-blue-700',
  Resting: 'bg-purple-100 text-purple-700',
  Ready: 'bg-teal-100 text-teal-700',
  Active: 'bg-green-100 text-green-700',
  Finished: 'bg-gray-200 text-gray-500'
};

const FRESHNESS_COLORS: Record<FreshnessStatus, string> = {
  OK: 'bg-green-100 text-green-700',
  Watch: 'bg-yellow-100 text-yellow-700',
  Urgent: 'bg-orange-100 text-orange-700',
  Expired: 'bg-red-100 text-red-700'
};

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}


export default function InventorySheet() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>('all');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | undefined>();
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters = tab === 'all' ? {} : { type: tab };
      const data = await inventoryApi.getAll(filters);
      setItems(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(data: Partial<InventoryItem>) {
    if (editItem) {
      await inventoryApi.update(editItem.id, data);
    } else {
      await inventoryApi.create(data);
    }
    setShowForm(false);
    setEditItem(undefined);
    load();
  }

  async function handleDelete(item: InventoryItem) {
    if (!confirm(`Delete ${item.roaster} ${item.coffee_name}?`)) return;
    await inventoryApi.delete(item.id);
    load();
  }

  const brewing = items.filter(i => i.type === 'brewing');
  const retail = items.filter(i => i.type === 'retail');
  const displayed = tab === 'all' ? items : tab === 'brewing' ? brewing : retail;

  if (showForm) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          {editItem ? `Edit: ${editItem.roaster} ${editItem.coffee_name}` : 'Add to Inventory'}
        </h2>
        <InventoryForm
          item={editItem}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditItem(undefined); }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {(['all', 'brewing', 'retail'] as FilterTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded text-sm font-medium ${tab === t ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'all' ? ` (${items.length})` : t === 'brewing' ? ` (${brewing.length})` : ` (${retail.length})`}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditItem(undefined); setShowForm(true); }}
          className="px-4 py-1.5 bg-amber-600 text-white text-sm rounded hover:bg-amber-700"
        >
          + Add Entry
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No inventory entries yet.{' '}
          <button className="text-amber-600 underline" onClick={() => setShowForm(true)}>Add the first one.</button>
        </div>
      ) : (
        <div className="space-y-3">
          {(tab === 'all' || tab === 'brewing') && brewing.length > 0 && (
            <BrewingTable items={tab === 'brewing' ? displayed : brewing} onEdit={i => { setEditItem(i); setShowForm(true); }} onDelete={handleDelete} />
          )}
          {(tab === 'all' || tab === 'retail') && retail.length > 0 && (
            <RetailTable items={tab === 'retail' ? displayed : retail} onEdit={i => { setEditItem(i); setShowForm(true); }} onDelete={handleDelete} />
          )}
        </div>
      )}
    </div>
  );
}

function BrewingTable({ items, onEdit, onDelete }: {
  items: InventoryItem[];
  onEdit: (i: InventoryItem) => void;
  onDelete: (i: InventoryItem) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Brewing</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Coffee</th>
              <th className="px-3 py-2 text-left">Roast Date</th>
              <th className="px-3 py-2 text-left">Brew Ready</th>
              <th className="px-3 py-2 text-left">Program</th>
              <th className="px-3 py-2 text-left">Alloc.</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Activated</th>
              <th className="px-3 py-2 text-left">Est. End</th>
              <th className="px-3 py-2 text-left">Cost</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-amber-50">
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-800">{item.coffee_name}</div>
                  <div className="text-gray-500 text-xs">{item.roaster}</div>
                  {item.origin_process && <div className="text-gray-400 text-xs">{item.origin_process}</div>}
                </td>
                <td className="px-3 py-2 text-gray-600">{formatDate(item.roast_date)}</td>
                <td className="px-3 py-2 text-gray-600">{formatDate(item.brew_ready_date)}</td>
                <td className="px-3 py-2">
                  {item.primary_program && (
                    <div className="text-gray-700">{PROGRAM_LABELS[item.primary_program]}</div>
                  )}
                  {item.secondary_program && (
                    <div className="text-gray-400 text-xs">{PROGRAM_LABELS[item.secondary_program]}</div>
                  )}
                </td>
                <td className="px-3 py-2">
                  {item.allocated_lbs_primary != null && (
                    <div>{item.allocated_lbs_primary} lbs</div>
                  )}
                  {item.allocated_lbs_secondary != null && (
                    <div className="text-gray-400 text-xs">{item.allocated_lbs_secondary} lbs</div>
                  )}
                </td>
                <td className="px-3 py-2">
                  {item.status && (
                    <Badge label={item.status} colorClass={STATUS_COLORS[item.status as BrewingStatus] ?? 'bg-gray-100 text-gray-600'} />
                  )}
                </td>
                <td className="px-3 py-2 text-gray-600">{formatDate(item.activated_date)}</td>
                <td className="px-3 py-2 text-gray-600">{formatDate(item.est_end_date)}</td>
                <td className="px-3 py-2 text-gray-600">
                  {item.total_cost != null ? `$${item.total_cost.toFixed(2)}` : '—'}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => onEdit(item)} className="text-xs text-amber-600 hover:underline">Edit</button>
                    <button onClick={() => onDelete(item)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RetailTable({ items, onEdit, onDelete }: {
  items: InventoryItem[];
  onEdit: (i: InventoryItem) => void;
  onDelete: (i: InventoryItem) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Retail</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Coffee</th>
              <th className="px-3 py-2 text-left">Roast Date</th>
              <th className="px-3 py-2 text-left">Bags On Hand</th>
              <th className="px-3 py-2 text-left">Wks Supply</th>
              <th className="px-3 py-2 text-left">Cutoff</th>
              <th className="px-3 py-2 text-left">Days Left</th>
              <th className="px-3 py-2 text-left">Freshness</th>
              <th className="px-3 py-2 text-left">Price / Margin</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-amber-50">
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-800">{item.coffee_name}</div>
                  <div className="text-gray-500 text-xs">{item.roaster}</div>
                  {item.package_size && <div className="text-gray-400 text-xs">{item.package_size} oz bag</div>}
                </td>
                <td className="px-3 py-2 text-gray-600">{formatDate(item.roast_date)}</td>
                <td className="px-3 py-2">{item.bags_on_hand ?? '—'}</td>
                <td className="px-3 py-2">{item.weeks_of_supply != null ? `${item.weeks_of_supply}w` : '—'}</td>
                <td className="px-3 py-2 text-gray-600">{formatDate(item.freshness_cutoff_date)}</td>
                <td className="px-3 py-2">
                  {item.days_until_cutoff != null ? (
                    <span className={item.days_until_cutoff < 0 ? 'text-red-600' : item.days_until_cutoff <= 14 ? 'text-orange-600' : 'text-gray-600'}>
                      {item.days_until_cutoff < 0 ? `${Math.abs(item.days_until_cutoff)}d ago` : `${item.days_until_cutoff}d`}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-3 py-2">
                  {item.freshness_status && (
                    <Badge label={item.freshness_status} colorClass={FRESHNESS_COLORS[item.freshness_status]} />
                  )}
                </td>
                <td className="px-3 py-2 text-gray-600">
                  {item.retail_price_per_bag != null ? `$${item.retail_price_per_bag.toFixed(2)}` : '—'}
                  {item.margin_per_bag != null && (
                    <div className="text-xs text-green-600">+${item.margin_per_bag.toFixed(2)} margin</div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => onEdit(item)} className="text-xs text-amber-600 hover:underline">Edit</button>
                    <button onClick={() => onDelete(item)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
