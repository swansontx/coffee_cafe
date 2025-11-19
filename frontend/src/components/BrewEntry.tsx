import { useState, useEffect } from 'react';
import { Coffee, BrewMethod, BrewFormData } from '../types';
import { calculateBrewMetrics } from '../utils/calculations';
import { coffeeApi, brewApi } from '../api/client';
import EspressoForm from './EspressoForm';
import BatchForm from './BatchForm';
import PouroverForm from './PouroverForm';

export default function BrewEntry() {
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [selectedCoffee, setSelectedCoffee] = useState<string>('');
  const [method, setMethod] = useState<BrewMethod>('espresso');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load active coffees on mount
  useEffect(() => {
    loadCoffees();
  }, []);

  const loadCoffees = async () => {
    try {
      const data = await coffeeApi.getAll('active');
      setCoffees(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (formData: BrewFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await brewApi.create(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Log Brew Session</h2>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
            Brew session logged successfully!
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            Error: {error}
          </div>
        )}

        {/* Coffee Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coffee *
          </label>
          <select
            value={selectedCoffee}
            onChange={(e) => setSelectedCoffee(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select a coffee...</option>
            {coffees.map((coffee) => (
              <option key={coffee.id} value={coffee.id}>
                {coffee.roaster} - {coffee.name}
                {coffee.days_off_roast !== undefined && ` (${coffee.days_off_roast} days off roast)`}
              </option>
            ))}
          </select>
        </div>

        {/* Method Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setMethod('espresso')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  method === 'espresso'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Espresso
              </button>
              <button
                onClick={() => setMethod('batch')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  method === 'batch'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Batch (Fetco)
              </button>
              <button
                onClick={() => setMethod('pourover')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  method === 'pourover'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pourover
              </button>
            </nav>
          </div>
        </div>

        {/* Method-specific Forms */}
        {selectedCoffee && (
          <div className="mt-6">
            {method === 'espresso' && (
              <EspressoForm
                coffeeId={selectedCoffee}
                onSubmit={handleSubmit}
                loading={loading}
              />
            )}
            {method === 'batch' && (
              <BatchForm
                coffeeId={selectedCoffee}
                onSubmit={handleSubmit}
                loading={loading}
              />
            )}
            {method === 'pourover' && (
              <PouroverForm
                coffeeId={selectedCoffee}
                onSubmit={handleSubmit}
                loading={loading}
              />
            )}
          </div>
        )}

        {!selectedCoffee && (
          <div className="text-center text-gray-500 py-8">
            Select a coffee to begin logging a brew session
          </div>
        )}
      </div>
    </div>
  );
}
