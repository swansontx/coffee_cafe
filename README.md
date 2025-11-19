# Coffee Tracking App

A desktop-first coffee brew tracking application for specialty coffee shops to manage coffee profiles, log brew sessions, and analyze extraction performance.

## Tech Stack

- **Backend**: Node.js + Express + SQLite
- **Frontend**: React + TypeScript + Tailwind CSS
- **Charts**: Recharts for SCA brewing control visualization

## Features

### Core Modules
1. **Coffee Management** - Track roaster profiles, origins, roast dates, and coffee states
2. **Brew Tracking** - Log espresso, batch (Fetco), and pourover brews with full parameters
3. **Analytics/Visualization** - SCA brewing control charts and extraction trends
4. **Data Export** - CSV/JSON export capabilities

### Brew Methods Supported
- **Espresso**: Dose, yield, time, TDS, temperature, pre-infusion parameters
- **Batch Brew (Fetco)**: Water volume, coffee dose, TDS, brew time, temperature
- **Pourover**: Dose, yield, time, TDS, grind setting, temperature, bloom time

## Project Structure

```
coffee-tracker/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── models/   # Database models and CRUD operations
│   │   ├── routes/   # API endpoints
│   │   └── utils/    # Calculations and helpers
│   └── database/     # SQLite database file
├── frontend/         # React + TypeScript UI
│   └── src/
│       ├── components/  # React components
│       ├── utils/       # Frontend utilities
│       └── types/       # TypeScript definitions
└── docs/            # Additional documentation
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. **Backend Setup**
```bash
cd backend
npm install
npm run dev
```

2. **Frontend Setup** (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (frontend) with API at `http://localhost:3000`.

## Key Calculations

**Extraction Yield %** = (TDS × Beverage Weight) / Coffee Dose × 100

**Brew Ratio** = Beverage Weight / Coffee Dose

## Development Roadmap

- [x] Phase 1: Core tracking and database
- [ ] Phase 2: Visualization and analytics
- [ ] Phase 3: Advanced features and export

## Future Enhancements
- React Native mobile app
- Multi-location support (PostgreSQL migration)
- Integration with POS systems
- Predictive recipe adjustments
