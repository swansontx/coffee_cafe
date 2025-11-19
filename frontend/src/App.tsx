import { useState } from 'react';

// Define types inline to test
type BrewMethod = 'espresso' | 'batch' | 'pourover';

interface Coffee {
  id: string;
  roaster: string;
  name: string;
  days_off_roast?: number;
}

function App() {
  const [currentView, setCurrentView] = useState<'brew' | 'coffees'>('brew');
  const [coffees] = useState<Coffee[]>([
    { id: '1', roaster: 'Heart Coffee', name: 'Colombia', days_off_roast: 5 }
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">☕</span>
              <h1 className="text-2xl font-bold text-gray-800">Coffee Tracker</h1>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentView('brew')}
                className={`px-4 py-2 rounded ${currentView === 'brew' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Log Brew
              </button>
              <button
                onClick={() => setCurrentView('coffees')}
                className={`px-4 py-2 rounded ${currentView === 'coffees' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Coffees
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-8 max-w-4xl mx-auto">
        {currentView === 'brew' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Log Brew Session</h2>
            <p className="text-gray-600">Brew entry form coming soon...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Coffees</h2>
            {coffees.map(coffee => (
              <div key={coffee.id} className="p-4 border-b">
                <h3 className="font-semibold">{coffee.roaster} - {coffee.name}</h3>
                <p className="text-sm text-gray-500">{coffee.days_off_roast} days off roast</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
