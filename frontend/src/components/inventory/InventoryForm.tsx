import { useState } from 'react';
import type { InventoryItem, InventoryType } from '../../types';
import { PROGRAM_LABELS, PROGRAMS } from '../../types';

interface Props {
  item?: InventoryItem;
  onSave: (data: Partial<InventoryItem>) => Promise<void>;
  onCancel: () => void;
}

const EMPTY_BREWING: Partial<InventoryItem> = {
  type: 'brewing',
  roaster: '',
  coffee_name: '',
  origin_process: '',
  roast_date: '',
  package_size: undefined,
  package_count: 1,
  order_date: '',
  cost_per_package: undefined,
  primary_program: undefined,
  secondary_program: undefined,
  allocated_lbs_primary: undefined,
  allocated_lbs_secondary: undefined,
  min_rest_days: 10,
  arrival_date: '',
  in_transit: 0,
  activated_date: '',
  actual_end_date: ''
};

const EMPTY_RETAIL: Partial<InventoryItem> = {
  type: 'retail',
  roaster: '',
  coffee_name: '',
  origin_process: '',
  roast_date: '',
  package_size: undefined,
  package_count: 1,
  order_date: '',
  cost_per_package: undefined,
  bags_on_hand: undefined,
  weekly_sell_rate: undefined,
  retail_price_per_bag: undefined,
  freshness_window_days: 56
};

export default function InventoryForm({ item, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Partial<InventoryItem>>(
    item ?? EMPTY_BREWING
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const type = form.type as InventoryType;

  function set(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleTypeChange(newType: InventoryType) {
    setForm(newType === 'brewing' ? { ...EMPTY_BREWING } : { ...EMPTY_RETAIL });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const clean: Partial<InventoryItem> = {};
      for (const [k, v] of Object.entries(form)) {
        if (v === '' || v === undefined) {
          (clean as Record<string, unknown>)[k] = null;
        } else {
          (clean as Record<string, unknown>)[k] = v;
        }
      }
      await onSave(clean);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <label className={labelCls}>{label}</label>
        {children}
      </div>
    );
  }

  function SectionHeader({ title }: { title: string }) {
    return (
      <div className="col-span-full mt-2 mb-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b pb-1">{title}</h3>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      {!isEditing && (
        <div className="flex gap-2">
          {(['brewing', 'retail'] as InventoryType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={`px-4 py-1.5 rounded text-sm font-medium ${type === t ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <SectionHeader title="Identity" />

        <Field label="Roaster *">
          <input required className={inputCls} value={form.roaster ?? ''} onChange={e => set('roaster', e.target.value)} placeholder="e.g. Heart, Hex" />
        </Field>
        <Field label="Coffee Name *">
          <input required className={inputCls} value={form.coffee_name ?? ''} onChange={e => set('coffee_name', e.target.value)} placeholder="e.g. Flower Child" />
        </Field>
        <Field label="Origin / Process">
          <input className={inputCls} value={form.origin_process ?? ''} onChange={e => set('origin_process', e.target.value)} placeholder="e.g. Ethiopia Natural" />
        </Field>
        <Field label="Roast Date">
          <input type="date" className={inputCls} value={form.roast_date ?? ''} onChange={e => set('roast_date', e.target.value)} />
        </Field>
        <Field label={type === 'retail' ? 'Package Size (oz)' : 'Package Size (lbs)'}>
          <input type="number" step="0.01" min="0" className={inputCls} value={form.package_size ?? ''} onChange={e => set('package_size', e.target.value ? parseFloat(e.target.value) : undefined)} />
        </Field>
        <Field label="Package Count">
          <input type="number" min="1" className={inputCls} value={form.package_count ?? 1} onChange={e => set('package_count', parseInt(e.target.value))} />
        </Field>

        <SectionHeader title="Order Info" />

        <Field label="Order Date">
          <input type="date" className={inputCls} value={form.order_date ?? ''} onChange={e => set('order_date', e.target.value)} />
        </Field>
        <Field label="Cost per Package ($)">
          <input type="number" step="0.01" min="0" className={inputCls} value={form.cost_per_package ?? ''} onChange={e => set('cost_per_package', e.target.value ? parseFloat(e.target.value) : undefined)} />
        </Field>

        {type === 'brewing' && (
          <>
            <SectionHeader title="Program Assignment" />

            <Field label="Primary Program">
              <select className={inputCls} value={form.primary_program ?? ''} onChange={e => set('primary_program', e.target.value || undefined)}>
                <option value="">— None —</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{PROGRAM_LABELS[p]}</option>)}
              </select>
            </Field>
            <Field label="Secondary Program (optional)">
              <select className={inputCls} value={form.secondary_program ?? ''} onChange={e => set('secondary_program', e.target.value || undefined)}>
                <option value="">— None —</option>
                {PROGRAMS.filter(p => p !== form.primary_program).map(p => <option key={p} value={p}>{PROGRAM_LABELS[p]}</option>)}
              </select>
            </Field>
            <Field label="Allocated lbs — Primary">
              <input type="number" step="0.1" min="0" className={inputCls} value={form.allocated_lbs_primary ?? ''} onChange={e => set('allocated_lbs_primary', e.target.value ? parseFloat(e.target.value) : undefined)} />
            </Field>
            <Field label="Allocated lbs — Secondary">
              <input type="number" step="0.1" min="0" className={inputCls} value={form.allocated_lbs_secondary ?? ''} onChange={e => set('allocated_lbs_secondary', e.target.value ? parseFloat(e.target.value) : undefined)} />
            </Field>

            <SectionHeader title="Rest Window" />

            <Field label="Min Rest Days">
              <input type="number" min="0" className={inputCls} value={form.min_rest_days ?? ''} onChange={e => set('min_rest_days', e.target.value ? parseInt(e.target.value) : undefined)} />
            </Field>
            <div /> {/* spacer */}

            <SectionHeader title="Status Tracking" />

            <Field label="Arrival Date">
              <input type="date" className={inputCls} value={form.arrival_date ?? ''} onChange={e => set('arrival_date', e.target.value)} />
            </Field>
            <Field label="In Transit">
              <label className="flex items-center gap-2 pt-1.5">
                <input type="checkbox" checked={!!form.in_transit} onChange={e => set('in_transit', e.target.checked ? 1 : 0)} className="rounded" />
                <span className="text-sm text-gray-600">Mark as in transit</span>
              </label>
            </Field>
            <Field label="Activated Date">
              <input type="date" className={inputCls} value={form.activated_date ?? ''} onChange={e => set('activated_date', e.target.value)} />
            </Field>
            <Field label="Actual End Date">
              <input type="date" className={inputCls} value={form.actual_end_date ?? ''} onChange={e => set('actual_end_date', e.target.value)} />
            </Field>
          </>
        )}

        {type === 'retail' && (
          <>
            <SectionHeader title="Retail" />

            <Field label="Bags On Hand">
              <input type="number" min="0" className={inputCls} value={form.bags_on_hand ?? ''} onChange={e => set('bags_on_hand', e.target.value ? parseInt(e.target.value) : undefined)} />
            </Field>
            <Field label="Weekly Sell Rate">
              <input type="number" step="0.1" min="0" className={inputCls} value={form.weekly_sell_rate ?? ''} onChange={e => set('weekly_sell_rate', e.target.value ? parseFloat(e.target.value) : undefined)} />
            </Field>
            <Field label="Retail Price per Bag ($)">
              <input type="number" step="0.01" min="0" className={inputCls} value={form.retail_price_per_bag ?? ''} onChange={e => set('retail_price_per_bag', e.target.value ? parseFloat(e.target.value) : undefined)} />
            </Field>
            <Field label="Freshness Window (days)">
              <input type="number" min="1" className={inputCls} value={form.freshness_window_days ?? 56} onChange={e => set('freshness_window_days', e.target.value ? parseInt(e.target.value) : 56)} />
            </Field>
          </>
        )}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50">
          {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add to Inventory'}
        </button>
      </div>
    </form>
  );
}
