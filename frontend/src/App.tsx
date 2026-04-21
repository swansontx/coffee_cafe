import { useState } from 'react';
import InventorySheet from './components/inventory/InventorySheet';
import ProgramPlanner from './components/planner/ProgramPlanner';
import CoverageDashboard from './components/dashboard/CoverageDashboard';

type Sheet = 'inventory' | 'planner' | 'dashboard';

const SHEETS: { id: Sheet; label: string; number: string; description: string }[] = [
  { id: 'inventory', number: '1', label: 'Inventory', description: 'What do I have?' },
  { id: 'planner', number: '2', label: 'Program Planner', description: "What's running when?" },
  { id: 'dashboard', number: '3', label: 'Coverage Dashboard', description: 'Am I covered?' }
];

export default function App() {
  const [sheet, setSheet] = useState<Sheet>('inventory');

  const current = SHEETS.find(s => s.id === sheet)!;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <span className="text-2xl">☕</span>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">Sometimes Coffee</h1>
                <p className="text-xs text-gray-400 leading-tight">Inventory & Planning System</p>
              </div>
            </div>

            <div className="flex gap-1">
              {SHEETS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSheet(s.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                    sheet === s.id
                      ? 'bg-amber-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ${
                    sheet === s.id ? 'bg-amber-700 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>{s.number}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Sheet header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-semibold text-gray-800">{current.label}</h2>
            <span className="text-sm text-gray-400">{current.description}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {sheet === 'inventory' && <InventorySheet />}
        {sheet === 'planner' && <ProgramPlanner />}
        {sheet === 'dashboard' && <CoverageDashboard />}
      </main>
    </div>
  );
}
