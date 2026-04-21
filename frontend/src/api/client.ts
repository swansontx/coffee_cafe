import type { InventoryItem, BrewingProgram, PlannerGrid } from '../types';

const API_BASE = 'http://localhost:3000/api';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(res.status, err.error || err.message || 'Request failed');
  }
  return res.json();
}

function json(method: string, body: unknown) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

export const inventoryApi = {
  getAll(filters?: { type?: string; program?: string }): Promise<InventoryItem[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.set('type', filters.type);
    if (filters?.program) params.set('program', filters.program);
    const qs = params.toString() ? `?${params}` : '';
    return request(`${API_BASE}/inventory${qs}`);
  },

  getById(id: string): Promise<InventoryItem> {
    return request(`${API_BASE}/inventory/${id}`);
  },

  getAvailable(program: BrewingProgram, weekStart: string, featuredBurnRate?: number): Promise<InventoryItem[]> {
    const params = new URLSearchParams({ program, week_start: weekStart });
    if (featuredBurnRate != null) params.set('featured_burn_rate', String(featuredBurnRate));
    return request(`${API_BASE}/inventory/available?${params}`);
  },

  create(data: Partial<InventoryItem>): Promise<InventoryItem> {
    return request(`${API_BASE}/inventory`, json('POST', data));
  },

  update(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
    return request(`${API_BASE}/inventory/${id}`, json('PUT', data));
  },

  delete(id: string): Promise<void> {
    return request(`${API_BASE}/inventory/${id}`, { method: 'DELETE' });
  }
};

export const plannerApi = {
  getGrid(weekStartDates: string[]): Promise<PlannerGrid> {
    const params = new URLSearchParams({ weeks: weekStartDates.join(',') });
    return request(`${API_BASE}/planner?${params}`);
  },

  setEntry(weekStart: string, program: BrewingProgram, inventoryId: string | null, featuredBurnRate?: number | null) {
    return request(`${API_BASE}/planner/${weekStart}/${program}`, json('PUT', {
      inventory_id: inventoryId,
      featured_burn_rate: featuredBurnRate ?? null
    }));
  },

  clearEntry(weekStart: string, program: BrewingProgram) {
    return request(`${API_BASE}/planner/${weekStart}/${program}`, { method: 'DELETE' });
  }
};
