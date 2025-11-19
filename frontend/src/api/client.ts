const API_BASE_URL = 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(response.status, error.error || error.message);
  }

  return response.json();
}

// Coffee API
export const coffeeApi = {
  async getAll(state?: string) {
    const url = state
      ? `${API_BASE_URL}/coffees?state=${state}`
      : `${API_BASE_URL}/coffees`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  async getById(id: string) {
    const response = await fetch(`${API_BASE_URL}/coffees/${id}`);
    return handleResponse(response);
  },

  async create(data: any) {
    const response = await fetch(`${API_BASE_URL}/coffees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async update(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/coffees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async archive(id: string) {
    const response = await fetch(`${API_BASE_URL}/coffees/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  async getRoasters() {
    const response = await fetch(`${API_BASE_URL}/coffees/roasters`);
    return handleResponse(response);
  }
};

// Brew API
export const brewApi = {
  async getAll(filters?: {
    coffee_id?: string;
    method?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const url = params.toString()
      ? `${API_BASE_URL}/brews?${params}`
      : `${API_BASE_URL}/brews`;

    const response = await fetch(url);
    return handleResponse(response);
  },

  async getById(id: string) {
    const response = await fetch(`${API_BASE_URL}/brews/${id}`);
    return handleResponse(response);
  },

  async create(data: any) {
    const response = await fetch(`${API_BASE_URL}/brews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async update(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/brews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async delete(id: string) {
    const response = await fetch(`${API_BASE_URL}/brews/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  async getLastForCoffee(coffeeId: string, method?: string) {
    const url = method
      ? `${API_BASE_URL}/brews/coffee/${coffeeId}/last?method=${method}`
      : `${API_BASE_URL}/brews/coffee/${coffeeId}/last`;

    const response = await fetch(url);
    return handleResponse(response);
  },

  async getAnalytics(filters?: {
    method?: string;
    coffee_id?: string;
    start_date?: string;
    end_date?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value);
        }
      });
    }

    const url = params.toString()
      ? `${API_BASE_URL}/brews/analytics?${params}`
      : `${API_BASE_URL}/brews/analytics`;

    const response = await fetch(url);
    return handleResponse(response);
  }
};
