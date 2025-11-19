# Getting Started with Coffee Tracker

## Quick Start

Follow these steps to get the Coffee Tracker application running on your machine.

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies (already done)
npm install

# Initialize the database
npm run init-db

# (Optional) Seed with sample data
npm run seed

# Start the backend server
npm run dev
```

The backend API will be running at `http://localhost:3000`

### 2. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (already done)
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 3. Using the Application

#### Add Your First Coffee
1. Click on the "Coffees" tab
2. Click "Add Coffee" button
3. Fill in the details:
   - **Required**: Roaster, Coffee Name, Roast Date
   - **Optional**: Origin, Region, Process, Roast Level, Price, Notes
4. Click "Add Coffee"

#### Log Your First Brew
1. Navigate to "Log Brew" tab
2. Select a coffee from the dropdown
3. Choose your brew method (Espresso, Batch, or Pourover)
4. Enter your brew parameters:
   - **Required**: Dose, TDS
   - **Method-specific**: Yield (espresso/pourover), Water Volume (batch)
   - **Optional**: Temperature, grind setting, notes, rating
5. Watch the extraction yield calculate in real-time!
6. Click "Log Brew" to save

#### View Analytics
1. Click on the "Analytics" tab
2. See all your brews plotted on the SCA Brewing Control Chart
3. Filter by brew method (all, espresso, batch, pourover)
4. Hover over points to see details

## Sample Data

If you ran `npm run seed` in the backend, you'll have:
- 3 sample coffees from different roasters
- 6 sample brew sessions across different methods
- Data ready to explore in the analytics chart

## Tips for Best Results

### During Dial-In
- The app remembers your last brew settings for each coffee
- Use the real-time extraction calculator to guide adjustments
- Green background = ideal extraction (18-22%)
- Blue = under-extracted, Orange = over-extracted

### For Daily Use
- Log every brew to track consistency
- Use the star rating for quick quality feedback
- Check the analytics chart to spot trends
- Archive coffees when finished to keep the list clean

### Understanding the SCA Chart
- **X-axis**: TDS/Strength - how concentrated your coffee is
- **Y-axis**: Extraction Yield - how much you extracted from the grounds
- **Green zone**: Ideal range (18-22% extraction, 1.15-1.45% TDS)
- **Points**: Each represents one brew session

## Troubleshooting

### Backend won't start
- Make sure port 3000 is not in use
- Check that database was initialized: `npm run init-db`

### Frontend won't load data
- Ensure backend is running first
- Check browser console for API errors
- Verify CORS is working (should be enabled by default)

### Can't see coffees in dropdown
- Add a coffee first in the "Coffees" tab
- Make sure coffee state is "active"
- Refresh the page

## Next Steps

- Explore the different brew methods
- Track multiple coffees side-by-side
- Use the analytics to find your sweet spot
- Export your data for external analysis

## Development

### Backend API Endpoints

```
GET    /api/coffees          - List all coffees
POST   /api/coffees          - Create new coffee
GET    /api/coffees/:id      - Get coffee by ID
PUT    /api/coffees/:id      - Update coffee
DELETE /api/coffees/:id      - Archive coffee

GET    /api/brews            - List all brews
POST   /api/brews            - Create new brew
GET    /api/brews/:id        - Get brew by ID
GET    /api/brews/analytics  - Get analytics data
```

### Tech Stack
- **Backend**: Node.js + Express + SQLite
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts

Enjoy tracking your coffee! ☕
