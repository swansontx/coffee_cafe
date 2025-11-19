import { useState } from 'react';
import BrewEntry from './components/BrewEntry';
import SCAChart from './components/SCAChart';
import CoffeeManagement from './components/CoffeeManagement';

type View = 'brew' | 'analytics' | 'coffees';

function App() {
  const [currentView, setCurrentView] = useState<View>('brew');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center space-x-3">
              <span className="text-3xl">☕</span>
              <h1 className="text-2xl font-bold text-gray-800">Coffee Tracker</h1>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1">
              <NavButton
                active={currentView === 'brew'}
                onClick={() => setCurrentView('brew')}
              >
                Log Brew
              </NavButton>
              <NavButton
                active={currentView === 'analytics'}
                onClick={() => setCurrentView('analytics')}
              >
                Analytics
              </NavButton>
              <NavButton
                active={currentView === 'coffees'}
                onClick={() => setCurrentView('coffees')}
              >
                Coffees
              </NavButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8">
        {currentView === 'brew' && <BrewEntry />}
        {currentView === 'analytics' && <SCAChart />}
        {currentView === 'coffees' && <CoffeeManagement />}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-gray-500">
        <p>Coffee Tracking App - Track, analyze, and perfect your brews</p>
      </footer>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2 font-medium rounded-md transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

export default App;
