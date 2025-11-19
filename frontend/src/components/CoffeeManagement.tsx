import { useState, useEffect } from 'react';
import { Coffee, CoffeeState } from '../types';
import { coffeeApi } from '../api/client';
import { formatDate } from '../utils/calculations';

export default function CoffeeManagement() {
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [stateFilter, setStateFilter] = useState<CoffeeState>('active');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCoffees();
  }, [stateFilter]);

  const loadCoffees = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await coffeeApi.getAll(stateFilter);
      setCoffees(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (confirm('Are you sure you want to archive this coffee?')) {
      try {
        await coffeeApi.archive(id);
        loadCoffees();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Coffee Management</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
            >
              + Add Coffee
            </button>
          </div>

          {/* State Filter */}
          <div className="mt-4 flex space-x-2">
            {(['active', 'archive', 'incoming'] as CoffeeState[]).map((state) => (
              <button
                key={state}
                onClick={() => setStateFilter(state)}
                className={`px-4 py-2 rounded-md font-medium capitalize ${
                  stateFilter === state
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="m-6 p-4 bg-red-100 text-red-700 rounded-md">
            Error: {error}
          </div>
        )}

        {/* Add Coffee Form Modal */}
        {showAddForm && (
          <AddCoffeeModal
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              setShowAddForm(false);
              loadCoffees();
            }}
          />
        )}

        {/* Coffee List */}
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading coffees...</div>
        ) : coffees.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No {stateFilter} coffees found. Add one to get started!
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {coffees.map((coffee) => (
              <CoffeeCard
                key={coffee.id}
                coffee={coffee}
                onArchive={handleArchive}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Coffee Card Component
function CoffeeCard({
  coffee,
  onArchive,
}: {
  coffee: Coffee;
  onArchive: (id: string) => void;
}) {
  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-bold text-gray-800">
              {coffee.roaster} - {coffee.name}
            </h3>
            {coffee.days_off_roast !== undefined && (
              <span
                className={`px-2 py-1 rounded text-sm font-medium ${
                  coffee.days_off_roast <= 7
                    ? 'bg-green-100 text-green-700'
                    : coffee.days_off_roast <= 14
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-orange-100 text-orange-700'
                }`}
              >
                {coffee.days_off_roast} days off roast
              </span>
            )}
          </div>

          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Origin:</span>{' '}
              <span className="font-medium">{coffee.origin || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Process:</span>{' '}
              <span className="font-medium">{coffee.process || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Roast Date:</span>{' '}
              <span className="font-medium">{formatDate(coffee.roast_date)}</span>
            </div>
            <div>
              <span className="text-gray-500">Roast Level:</span>{' '}
              <span className="font-medium">{coffee.roast_level || 'N/A'}</span>
            </div>
          </div>

          {coffee.notes && (
            <p className="mt-2 text-sm text-gray-600 italic">{coffee.notes}</p>
          )}

          {/* Statistics */}
          {coffee.total_brews !== undefined && coffee.total_brews > 0 && (
            <div className="mt-4 flex space-x-6 text-sm">
              <div>
                <span className="text-gray-500">Total Brews:</span>{' '}
                <span className="font-semibold">{coffee.total_brews}</span>
              </div>
              {coffee.avg_extraction && (
                <div>
                  <span className="text-gray-500">Avg Extraction:</span>{' '}
                  <span className="font-semibold">{coffee.avg_extraction}%</span>
                </div>
              )}
              {coffee.avg_rating && (
                <div>
                  <span className="text-gray-500">Avg Rating:</span>{' '}
                  <span className="font-semibold">
                    {'★'.repeat(Math.round(coffee.avg_rating))}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {coffee.state === 'active' && (
          <button
            onClick={() => onArchive(coffee.id)}
            className="ml-4 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            Archive
          </button>
        )}
      </div>
    </div>
  );
}

// Add Coffee Modal
function AddCoffeeModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    roaster: '',
    name: '',
    origin: '',
    region: '',
    process: '',
    roast_date: '',
    roast_level: '',
    price_per_kg: '',
    notes: '',
    state: 'active' as CoffeeState,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData: any = {
        roaster: formData.roaster,
        name: formData.name,
        roast_date: formData.roast_date,
        state: formData.state,
      };

      if (formData.origin) submitData.origin = formData.origin;
      if (formData.region) submitData.region = formData.region;
      if (formData.process) submitData.process = formData.process;
      if (formData.roast_level) submitData.roast_level = formData.roast_level;
      if (formData.price_per_kg) submitData.price_per_kg = parseFloat(formData.price_per_kg);
      if (formData.notes) submitData.notes = formData.notes;

      await coffeeApi.create(submitData);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Add New Coffee</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roaster *
              </label>
              <input
                type="text"
                value={formData.roaster}
                onChange={(e) => setFormData({ ...formData, roaster: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coffee Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origin/Farm
              </label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region/Country
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Process
              </label>
              <select
                value={formData.process}
                onChange={(e) => setFormData({ ...formData, process: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="washed">Washed</option>
                <option value="natural">Natural</option>
                <option value="honey">Honey</option>
                <option value="anaerobic">Anaerobic</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roast Date *
              </label>
              <input
                type="date"
                value={formData.roast_date}
                onChange={(e) => setFormData({ ...formData, roast_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roast Level
              </label>
              <select
                value={formData.roast_level}
                onChange={(e) => setFormData({ ...formData, roast_level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="light">Light</option>
                <option value="medium-light">Medium-Light</option>
                <option value="medium">Medium</option>
                <option value="medium-dark">Medium-Dark</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per kg
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price_per_kg}
                onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Roaster's tasting notes)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Flavor notes, description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value as CoffeeState })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="incoming">Incoming</option>
              <option value="archive">Archive</option>
            </select>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? 'Adding...' : 'Add Coffee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
