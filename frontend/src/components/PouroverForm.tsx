import { useState, useEffect } from 'react';
import { BrewFormData } from '../types';
import { calculateBrewMetrics, classifyExtraction } from '../utils/calculations';
import { brewApi } from '../api/client';

interface Props {
  coffeeId: string;
  onSubmit: (data: BrewFormData) => void;
  loading: boolean;
}

export default function PouroverForm({ coffeeId, onSubmit, loading }: Props) {
  const [dose, setDose] = useState<number>(20);
  const [yieldGrams, setYield] = useState<number>(320);
  const [time, setTime] = useState<number>(2.5);
  const [tds, setTds] = useState<number>(0);
  const [grind, setGrind] = useState<number>(0);
  const [temp, setTemp] = useState<number>(96);
  const [bloomTime, setBloomTime] = useState<number>(30);
  const [bloomWater, setBloomWater] = useState<number>(40);
  const [rating, setRating] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');

  // Load last brew for auto-populate
  useEffect(() => {
    if (coffeeId) {
      loadLastBrew();
    }
  }, [coffeeId]);

  const loadLastBrew = async () => {
    try {
      const lastBrew = await brewApi.getLastForCoffee(coffeeId, 'pourover');
      if (lastBrew) {
        setDose(lastBrew.dose || 20);
        setYield(lastBrew.yield || 320);
        setTime(lastBrew.brew_time || 2.5);
        setGrind(lastBrew.grind_setting || 0);
        setTemp(lastBrew.water_temp || 96);
        setBloomTime(lastBrew.bloom_time || 30);
        setBloomWater(lastBrew.bloom_water || 40);
      }
    } catch (err) {
      // No previous brews, use defaults
    }
  };

  // Calculate metrics in real-time
  const metrics = calculateBrewMetrics('pourover', dose, tds, yieldGrams);
  const extraction = metrics.extraction_yield || 0;
  const ratio = metrics.brew_ratio || '';

  // Determine extraction quality
  let extractionClass = '';
  let extractionLabel = '';

  if (extraction > 0) {
    const quality = classifyExtraction(tds, extraction);
    switch (quality) {
      case 'under':
        extractionClass = 'text-blue-600 bg-blue-50';
        extractionLabel = 'Under-extracted';
        break;
      case 'over':
        extractionClass = 'text-orange-600 bg-orange-50';
        extractionLabel = 'Over-extracted';
        break;
      case 'weak':
        extractionClass = 'text-yellow-600 bg-yellow-50';
        extractionLabel = 'Weak';
        break;
      case 'strong':
        extractionClass = 'text-purple-600 bg-purple-50';
        extractionLabel = 'Strong';
        break;
      case 'ideal':
        extractionClass = 'text-green-600 bg-green-50';
        extractionLabel = 'Ideal';
        break;
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData: BrewFormData = {
      coffee_id: coffeeId,
      method: 'pourover',
      dose,
      yield: yieldGrams,
      brew_time: time,
      tds,
      grind_setting: grind,
      water_temp: temp,
      bloom_time: bloomTime,
      bloom_water: bloomWater,
      rating,
      notes: notes || undefined
    };

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Real-time Extraction Display */}
      {extraction > 0 && (
        <div className={`p-4 rounded-lg ${extractionClass} border-2`}>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium">Extraction Yield</span>
              <p className="text-3xl font-bold">{extraction}%</p>
            </div>
            <div>
              <span className="text-sm font-medium">Ratio</span>
              <p className="text-2xl font-semibold">{ratio}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Quality</span>
              <p className="text-lg font-semibold">{extractionLabel}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Parameters */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dose (g) *
          </label>
          <input
            type="number"
            step="0.5"
            value={dose}
            onChange={(e) => setDose(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 number-input-no-arrows"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Yield (g) *
          </label>
          <input
            type="number"
            step="1"
            value={yieldGrams}
            onChange={(e) => setYield(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 number-input-no-arrows"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brew Time (min)
          </label>
          <input
            type="number"
            step="0.25"
            value={time}
            onChange={(e) => setTime(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 number-input-no-arrows"
          />
        </div>
      </div>

      {/* TDS and Settings */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            TDS (%) *
          </label>
          <input
            type="number"
            step="0.01"
            value={tds}
            onChange={(e) => setTds(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 number-input-no-arrows"
            required
            min="0.1"
            max="20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grind Setting
          </label>
          <input
            type="number"
            step="0.5"
            value={grind}
            onChange={(e) => setGrind(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 number-input-no-arrows"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Water Temperature (°C)
          </label>
          <input
            type="number"
            step="0.5"
            value={temp}
            onChange={(e) => setTemp(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 number-input-no-arrows"
          />
        </div>
      </div>

      {/* Bloom Parameters */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bloom Time (s)
          </label>
          <input
            type="number"
            step="5"
            value={bloomTime}
            onChange={(e) => setBloomTime(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 number-input-no-arrows"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bloom Water (g)
          </label>
          <input
            type="number"
            step="5"
            value={bloomWater}
            onChange={(e) => setBloomWater(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 number-input-no-arrows"
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating
        </label>
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-3xl ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              } hover:text-yellow-500 transition-colors`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Tasting notes, observations..."
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !tds}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg transition-colors"
      >
        {loading ? 'Saving...' : 'Log Brew'}
      </button>
    </form>
  );
}
