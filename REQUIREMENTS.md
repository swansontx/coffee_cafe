# Coffee Tracking App - Requirements Specification

## Module 1: Coffee Management

### Coffee Profiles
**Core Data Fields:**
- Roaster (dropdown + add new capability)
- Coffee Name
- Farm/Origin (optional)
- Region/Country
- Process (washed, natural, honey, anaerobic, etc.)
- Roast Date
- Roast Level (light/medium/dark)
- Price per kg
- Notes (roaster's tasting notes)

**Auto-Calculated Fields:**
- Days off roast (from roast date)
- Total brews logged
- Average extraction %
- Average star rating
- Best performing recipe (link to brew log)

**Coffee States:**
- Active - Currently in use
- Archive - Past coffees (data retained)
- Incoming - On order but not received

## Module 2: Brew Tracking

### Espresso Parameters
- Coffee Selection (dropdown from active coffees)
- Dose (grams)
- Yield (grams)
- Time (seconds)
- TDS (%)
- Grind Setting (numeric)
- Water Temperature (°C)
- Pre-infusion Time (seconds)
- Pre-infusion Pressure (bars)
- Full Pressure (bars)
- Star Rating (1-5)
- Notes (optional)

**Auto-calculated:**
- Extraction Yield %
- Brew Ratio

### Batch Brew (Fetco) Parameters
- Coffee Selection
- Water Volume (liters)
- Coffee Dose (grams)
- TDS (%)
- Brew Time (minutes)
- Water Temperature (°C)
- Grind Setting
- Star Rating (1-5)
- Notes

**Auto-calculated:**
- Extraction Yield %
- Brew Ratio

### Pourover Parameters
- Coffee Selection
- Dose (grams)
- Yield (grams)
- Brew Time (minutes:seconds)
- TDS (%)
- Grind Setting
- Water Temperature (°C)
- Bloom Time (seconds)
- Bloom Water (grams)
- Star Rating (1-5)
- Notes

**Auto-calculated:**
- Extraction Yield %
- Brew Ratio

## Module 3: Analytics & Visualization

### SCA Brewing Control Chart
- X-axis: TDS/Strength (%)
- Y-axis: Extraction Yield (%)
- Color zones:
  - Under-extracted
  - Ideal extraction
  - Over-extracted
- Plot all brews, filterable by:
  - Brew method
  - Coffee
  - Date range
  - Roaster

### Analytics Views
1. **Coffee Performance**
   - Extraction trends per coffee
   - Method comparison for same coffee
   - Optimal days off roast

2. **Daily Dial-In**
   - First brew vs final dial-in
   - Drift throughout service
   - Day-over-day comparison

3. **Equipment Patterns**
   - Grind drift over time
   - Extraction by time of day
   - Temperature stability

4. **Roaster Profiles**
   - Average extraction by roaster
   - Consistency scores
   - Performance comparison

## Module 4: Data Export/API

### Export Formats
- CSV (all brews)
- JSON (full data dump)
- PDF reports (analytics summary)

### API Endpoints
- `POST /api/brews` - Log new brew
- `GET /api/coffees` - List active coffees
- `GET /api/analytics` - Extraction trends
- `GET /api/export` - Data export

## UI/UX Requirements

### Design Principles
- Desktop-first, mobile-responsive
- Fast data entry (minimal clicks)
- Real-time calculations
- Visual feedback for extraction quality

### Critical Workflows

#### Morning Dial-In Mode
1. Select coffee from dropdown
2. Auto-populate last recipe
3. Enter dose/yield/time/TDS
4. See extraction % instantly
5. Quick star rating
6. Plot on chart immediately

#### Service Mode
1. Minimal fields (TDS + rating)
2. One-tap common recipes
3. Visual drift indicator

#### Analysis Mode
1. Full charts and trends
2. Coffee comparison
3. Export functions

### Smart Defaults
- Remember last settings per coffee
- Auto-suggest grind adjustments
- Template system for recipes
- Quick copy previous brew

## Data Integrity Requirements

### Validation
- TDS: 0.1% - 20%
- Extraction: 10% - 30%
- Ratios: 1:0.5 to 1:20
- Temperatures: 85°C - 100°C
- Dates: Roast date not in future

### Data Retention
- Keep all historical data
- Archive old coffees (not delete)
- Backup before major operations

## Performance Requirements
- Real-time calculation (< 100ms)
- Chart rendering (< 500ms)
- Brew entry save (< 200ms)
- Offline capability (localStorage)

## Future Integration Points
- Square POS (drink counts)
- Inventory management
- Customer feedback
- Weather API (environmental factors)
