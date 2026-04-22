// ================================================================
// Sometimes Coffee — Inventory & Planning System
// Google Apps Script
//
// HOW TO USE:
//   1. Open a new Google Sheet
//   2. Extensions > Apps Script
//   3. Paste this entire file, replacing any existing code
//   4. Save (Ctrl+S), then run setupAll() from the Run menu
//   5. After that, use the "☕ Sometimes Coffee" menu weekly
// ================================================================

const SHEET_INV    = 'Inventory';
const SHEET_PLAN   = 'Daily Planner';      // 20-day selection grid
const SHEET_DASH   = 'Coverage Dashboard';
const SHEET_STATUS = 'Program Planner';    // inventory summary by category

// Inventory column indices — 0-based for array/getValues() access
const IC = {
  TYPE:0, ROASTER:1, COFFEE_NAME:2, ORIGIN:3, ROAST_DATE:4,
  PKG_SIZE:5, PKG_COUNT:6, TOTAL:7, ORDER_DATE:8, COST_PKG:9,
  TOTAL_COST:10, DISPLAY_NAME:11,
  PRIMARY:12, SECONDARY:13, ALLOC_PRI:14, ALLOC_SEC:15,
  MIN_REST:16, BREW_READY:17, ARRIVAL:18, IN_TRANSIT:19,
  ACTIVATED:20, ACTUAL_END:21, EST_END:22, STATUS:23,
  BAGS:24, SELL_RATE:25, RETAIL_PRICE:26, MARGIN:27,
  FRESH_WINDOW:28, FRESH_CUTOFF:29, DAYS_CUTOFF:30,
  WEEKS_SUPPLY:31, FRESH_STATUS:32
};

// Planner sheet row numbers (1-indexed)
// Row 1 = merged week group header, Row 2 = individual day headers
const PR = {
  WEEK_HDR:1, DAY_HDR:2,
  HOUSE_DROP:3, HOUSE_LBS:4,
  FEAT_DROP:5,  FEAT_BURN:6, FEAT_LBS:7,
  BATCH_DROP:8, BATCH_LBS:9,
  POUR_DROP:10, POUR_LBS:11,
  NOTE:13
};

// 1-indexed column for week w (0–3) and day d (0–4, Wed–Sun)
function planCol(w, d) { return 2 + w * 5 + d; }
// Column letter for 1-indexed column (works A–Z)
function colLetter(n) { return String.fromCharCode(64 + n); }

function onOpen() {
  SpreadsheetApp.getActiveSpreadsheet().addMenu('☕ Sometimes Coffee', [
    { name: 'Advance / Catch Up to Today',   functionName: 'advanceWeek'        },
    { name: 'Refresh Daily Planner Dropdowns', functionName: 'refreshDropdowns' },
    null,
    { name: 'Full Setup (first run)',         functionName: 'setupAll'           },
    { name: 'Rebuild Program Planner Sheet',  functionName: 'rebuildStatusSheet' }
  ]);
}

function setupAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupInventorySheet(ss);
  setupStatusSheet(ss);
  setupPlannerSheet(ss);
  setupDashboardSheet(ss);
  refreshWeekDates();
  refreshDropdowns();
  SpreadsheetApp.getUi().alert(
    '✓ Sometimes Coffee is ready!\n\n' +
    '1. Inventory — add all your coffees here\n' +
    '2. Program Planner — live counts/lbs by category\n' +
    '3. Daily Planner — assign coffees day-by-day (20 working days)\n' +
    '4. Coverage Dashboard — weekly coverage check\n\n' +
    'Every Monday: ☕ menu → Advance / Catch Up to Today'
  );
}

function rebuildStatusSheet() {
  setupStatusSheet(SpreadsheetApp.getActiveSpreadsheet());
  SpreadsheetApp.getUi().alert('✓ Program Planner sheet rebuilt.');
}

// ================================================================
// SHEET 1: INVENTORY
// ================================================================

function setupInventorySheet(ss) {
  let sheet = ss.getSheetByName(SHEET_INV);
  if (!sheet) sheet = ss.insertSheet(SHEET_INV, 0);
  else { sheet.clear(); sheet.clearConditionalFormatRules(); }

  // Expand to 33 columns — new sheets only have 26 (A-Z) by default
  const neededCols = 33;
  if (sheet.getMaxColumns() < neededCols) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), neededCols - sheet.getMaxColumns());
  }

  // Column widths (1-indexed, A through AG)
  [[1,80],[2,100],[3,140],[4,130],[5,90],[6,75],[7,55],[8,80],
   [9,90],[10,80],[11,80],[12,160],
   [13,140],[14,140],[15,85],[16,85],[17,70],[18,95],
   [19,90],[20,75],[21,90],[22,90],[23,90],[24,80],
   [25,85],[26,85],[27,85],[28,75],[29,100],[30,100],[31,85],[32,85],[33,90]
  ].forEach(([c,w]) => sheet.setColumnWidth(c, w));

  // Header row
  const headers = [
    'Type','Roaster','Coffee Name','Origin / Process','Roast Date',
    'Pkg Size','Count','Total lbs/oz','Order Date','Cost/Pkg','Total Cost',
    'Display Name',
    'Primary Program','Secondary Program','Alloc lbs — Primary','Alloc lbs — Secondary',
    'Min Rest Days','Brew-Ready Date','Arrival Date','In Transit','Activated Date',
    'Actual End Date','Est. End Date','Status',
    'Bags On Hand','Wkly Sell Rate','Retail Price','Margin/Bag',
    'Fresh Window (days)','Freshness Cutoff','Days to Cutoff','Wks of Supply','Freshness Status'
  ];
  const hdr = sheet.getRange(1, 1, 1, headers.length);
  hdr.setValues([headers]).setBackground('#2C1810').setFontColor('#FFFFFF')
     .setFontWeight('bold').setFontSize(10);
  sheet.getRange(1,13,1,12).setBackground('#4A2C17');
  sheet.getRange(1,25,1,9).setBackground('#1A3A2A');

  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(3);

  // Array formulas — one per calculated column, spills down automatically
  [
    [2, 8,  '=ARRAYFORMULA(IF((F2:F<>"")*(G2:G<>""),F2:F*G2:G,""))'],
    [2, 11, '=ARRAYFORMULA(IF((J2:J<>"")*(G2:G<>""),J2:J*G2:G,""))'],
    [2, 12, '=ARRAYFORMULA(IF((B2:B<>"")*(C2:C<>""),B2:B&" · "&C2:C,""))'],
    [2, 18, '=ARRAYFORMULA(IF((E2:E<>"")*(Q2:Q<>""),E2:E+Q2:Q,""))'],
    [2, 23, '=ARRAYFORMULA(IF((U2:U="")+(M2:M="")+(O2:O=""),"",IF(M2:M="House Espresso",U2:U+ROUND(O2:O/13.6*7,0),IF(M2:M="Batch Drip",U2:U+ROUND(O2:O/3.4*7,0),IF(M2:M="Pour Over",U2:U+ROUND(O2:O/0.5*7,0),"")))))'],
    [2, 24, '=ARRAYFORMULA(IF(A2:A<>"brewing","",IF(V2:V<>"","Finished",IF(U2:U<>"","Active",IF(S2:S<>"",IF((R2:R<>"")*(R2:R>TODAY()),"Resting","Ready"),IF(T2:T=TRUE,"In Transit",IF(I2:I<>"","Ordered","\")))))))'],
    [2, 28, '=ARRAYFORMULA(IF((AA2:AA<>"")*(J2:J<>""),AA2:AA-J2:J,""))'],
    [2, 30, '=ARRAYFORMULA(IF((E2:E<>"")*(AC2:AC<>""),E2:E+AC2:AC,""))'],
    [2, 31, '=ARRAYFORMULA(IF(AD2:AD="","",AD2:AD-TODAY()))'],
    [2, 32, '=ARRAYFORMULA(IF((Y2:Y<>"")*(Z2:Z<>"")*(Z2:Z<>0),ROUND(Y2:Y/Z2:Z,1),""))'],
    [2, 33, '=ARRAYFORMULA(IF(AE2:AE="","",IF(AE2:AE<0,"Expired",IF(AE2:AE<=7,"Urgent",IF(AE2:AE<=14,"Watch","OK")))))']
  ].forEach(([r,c,f]) => sheet.getRange(r,c).setFormula(f));

  // Data validation
  const programs = ['House Espresso','Featured Espresso','Batch Drip','Pour Over'];
  sheet.getRange(2,1,1000,1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['brewing','retail'],true).setAllowInvalid(false).build());
  // Pkg Size col F — brewing uses lbs, retail uses oz
  sheet.getRange(2,6,1000,1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['8 oz','10 oz','1 lb','2 lb','5 lb'],true).setAllowInvalid(true).build());
  // Count col G — 1-8 bags/bags (can still type higher number if needed)
  sheet.getRange(2,7,1000,1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['1','2','3','4','5','6','7','8'],true).setAllowInvalid(true).build());
  sheet.getRange(2,13,1000,2).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(programs,true).setAllowInvalid(false).build());
  sheet.getRange(2,20,1000,1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireCheckbox().build());

  // Number formats
  [5,9,18,19,21,22,23,30].forEach(c => sheet.getRange(2,c,1000,1).setNumberFormat('M/D/YYYY'));
  [10,11,27,28].forEach(c => sheet.getRange(2,c,1000,1).setNumberFormat('"$"#,##0.00'));
  [8,15,16,32].forEach(c => sheet.getRange(2,c,1000,1).setNumberFormat('0.0'));

  // Hide display name helper column L
  sheet.hideColumns(12);

  // Conditional formatting
  const sR = [sheet.getRange('X2:X1001')];
  const fR = [sheet.getRange('AG2:AG1001')];
  sheet.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Active').setBackground('#D4EDDA').setFontColor('#155724').setRanges(sR).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Resting').setBackground('#E2D9F3').setFontColor('#4B2B7A').setRanges(sR).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Ready').setBackground('#CCF5F1').setFontColor('#0C5460').setRanges(sR).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('In Transit').setBackground('#CCE5FF').setFontColor('#004085').setRanges(sR).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Finished').setBackground('#E2E3E5').setFontColor('#383D41').setRanges(sR).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Ordered').setBackground('#F8F9FA').setFontColor('#6C757D').setRanges(sR).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('OK').setBackground('#D4EDDA').setFontColor('#155724').setRanges(fR).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Watch').setBackground('#FFF3CD').setFontColor('#856404').setRanges(fR).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Urgent').setBackground('#FFE8CC').setFontColor('#7D3A00').setRanges(fR).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Expired').setBackground('#F8D7DA').setFontColor('#721C24').setRanges(fR).build(),
  ]);
  Logger.log('✓ Inventory sheet ready');
}

// ================================================================
// SHEET 2: PROGRAM PLANNER
// ================================================================

function setupPlannerSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_PLAN);
  if (!sheet) sheet = ss.insertSheet(SHEET_PLAN, 2);
  else { sheet.clear(); sheet.clearConditionalFormatRules(); }

  // Need col A + 20 day columns = 21 total
  if (sheet.getMaxColumns() < 21) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), 21 - sheet.getMaxColumns());
  }

  // Reset frozen rows/columns — sheet.clear() doesn't clear these,
  // and frozen-boundary merges fail if freeze state carries over from a prior run
  try { sheet.setFrozenRows(0);    } catch(e) {}
  try { sheet.setFrozenColumns(0); } catch(e) {}

  // Break any pre-existing merges (sheet.clear() doesn't touch merges)
  try { sheet.getRange(1,1,sheet.getMaxRows(),sheet.getMaxColumns()).breakApart(); } catch(e) {}

  sheet.setColumnWidth(1, 175);
  for (let c = 2; c <= 21; c++) sheet.setColumnWidth(c, 95);

  sheet.setRowHeight(PR.WEEK_HDR, 28);
  sheet.setRowHeight(PR.DAY_HDR, 32);
  [PR.HOUSE_DROP,PR.FEAT_DROP,PR.BATCH_DROP,PR.POUR_DROP].forEach(r => sheet.setRowHeight(r, 36));
  [PR.HOUSE_LBS,PR.FEAT_BURN,PR.FEAT_LBS,PR.BATCH_LBS,PR.POUR_LBS].forEach(r => sheet.setRowHeight(r, 24));

  // Label column A
  sheet.getRange(PR.WEEK_HDR,1).setBackground('#2C1810');
  sheet.getRange(PR.DAY_HDR,1).setValue('Program').setBackground('#4A2C17')
    .setFontColor('#FFFFFF').setFontWeight('bold');

  // Row labels and colors
  [
    [PR.HOUSE_DROP, 'House Espresso',       '#155724','#D4EDDA', true ],
    [PR.HOUSE_LBS,  '  lbs remaining',      '#4A7C59','#F0FAF3', false],
    [PR.FEAT_DROP,  'Featured Espresso',    '#7D4A1F','#E8D5C4', true ],
    [PR.FEAT_BURN,  '  burn rate (lbs/wk)','#9B6940','#FBF0E7', false],
    [PR.FEAT_LBS,   '  lbs remaining',      '#9B6940','#FBF0E7', false],
    [PR.BATCH_DROP, 'Batch Drip',           '#0C5460','#D1ECF1', true ],
    [PR.BATCH_LBS,  '  lbs remaining',      '#2D7A8A','#E8F6F8', false],
    [PR.POUR_DROP,  'Pour Over',            '#4B2B7A','#E2D9F3', true ],
    [PR.POUR_LBS,   '  lbs remaining',      '#6B4A9A','#EDE8F5', false],
  ].forEach(([row,label,fg,bg,bold]) => {
    sheet.getRange(row,1).setValue(label).setFontColor(fg).setBackground(bg)
         .setFontWeight(bold?'bold':'normal').setFontSize(bold?11:9);
    sheet.getRange(row,2,1,20).setBackground(bg);
  });

  // Lbs-remaining formulas for all 20 day columns
  for (let w = 0; w < 4; w++) {
    for (let d = 0; d < 5; d++) {
      const col     = planCol(w, d);
      const cl      = colLetter(col);
      const wk      = `${cl}${PR.DAY_HDR}`;
      const burnCol = colLetter(planCol(w, 0)); // always use that week's Wed burn rate
      sheet.getRange(PR.HOUSE_LBS, col).setFormula(lbsEnd(`${cl}${PR.HOUSE_DROP}`,wk,13.6,'House Espresso'));
      sheet.getRange(PR.FEAT_LBS,  col).setFormula(lbsEndVar(`${cl}${PR.FEAT_DROP}`,wk,`${burnCol}${PR.FEAT_BURN}`));
      sheet.getRange(PR.BATCH_LBS, col).setFormula(lbsEnd(`${cl}${PR.BATCH_DROP}`,wk,3.4,'Batch Drip'));
      sheet.getRange(PR.POUR_LBS,  col).setFormula(lbsEnd(`${cl}${PR.POUR_DROP}`,wk,0.5,'Pour Over'));
    }
  }

  [PR.HOUSE_LBS,PR.FEAT_LBS,PR.BATCH_LBS,PR.POUR_LBS].forEach(r =>
    sheet.getRange(r,2,1,20).setNumberFormat('0.0 "lbs"'));
  sheet.getRange(PR.FEAT_BURN,2,1,20).setNumberFormat('0.0');

  // Propagate Featured burn rate from Wednesday to Thu–Sun within each week.
  // This lets the per-day yellow CF threshold (B6) work across all 5 columns.
  for (let w = 0; w < 4; w++) {
    const wedRef = `${colLetter(planCol(w, 0))}${PR.FEAT_BURN}`;
    for (let d = 1; d < 5; d++) {
      sheet.getRange(PR.FEAT_BURN, planCol(w, d))
        .setFormula(`=IF(${wedRef}<>"",${wedRef},"")`);
    }
  }

  sheet.getRange(PR.FEAT_BURN,1).setNote(
    'Enter Featured Espresso burn rate in lbs/week.\n' +
    'Fill the Wednesday cell of each week — Thu–Sun auto-copy it.');

  // Note row
  sheet.getRange(PR.NOTE,1,1,21).merge()
    .setValue('Fixed burn rates: House 13.6  |  Batch 3.4  |  Pour Over 0.5  (lbs/wk)  |  Featured: enter in each Wed cell')
    .setFontSize(8).setFontColor('#888888').setBackground('#F8F8F8');

  // Conditional formatting — dropdown rows: color by coffee's readiness status in Inventory
  // Formula uses relative ref (B{row}) so it adjusts for each cell across the 20-day range
  const dropRules = [];
  [PR.HOUSE_DROP, PR.FEAT_DROP, PR.BATCH_DROP, PR.POUR_DROP].forEach(row => {
    const range = [sheet.getRange(row, 2, 1, 20)];
    const ref   = `B${row}`;
    [
      ['Active',     '#D4EDDA', '#155724'],
      ['Ready',      '#CCF5F1', '#0C5460'],
      ['Resting',    '#E2D9F3', '#4B2B7A'],
      ['In Transit', '#CCE5FF', '#004085'],
      ['Ordered',    '#F8F9FA', '#6C757D'],
    ].forEach(([status, bg, fg]) => {
      dropRules.push(
        SpreadsheetApp.newConditionalFormatRule()
          .whenFormulaSatisfied(
            `=IFERROR(INDEX(Inventory!$X:$X,MATCH(${ref},Inventory!$L:$L,0))="${status}",FALSE)`)
          .setBackground(bg).setFontColor(fg).setRanges(range).build()
      );
    });
  });

  // Conditional formatting — lbs rows
  // Red: depleted (≤ 0). Yellow: < 2 days of burn remaining, per program.
  // Each program gets its own formula rule so the threshold matches its burn rate.
  // Relative refs (e.g. B4, B6) shift column-by-column across the 20-day range.
  const allLbsRanges = [PR.HOUSE_LBS, PR.FEAT_LBS, PR.BATCH_LBS, PR.POUR_LBS]
    .map(r => sheet.getRange(r, 2, 1, 20));
  const lbsLowRules = [
    // House: 2 days = 2 × (13.6/7) ≈ 3.9 lbs
    [PR.HOUSE_LBS, `=AND(B${PR.HOUSE_LBS}>0,B${PR.HOUSE_LBS}<(13.6/7)*2)`],
    // Featured: burn rate entered per-week in FEAT_BURN row; Thu–Sun copy Wed value
    [PR.FEAT_LBS,  `=AND(B${PR.FEAT_LBS}>0,B${PR.FEAT_LBS}<(B${PR.FEAT_BURN}/7)*2)`],
    // Batch: 2 days = 2 × (3.4/7) ≈ 1.0 lbs
    [PR.BATCH_LBS, `=AND(B${PR.BATCH_LBS}>0,B${PR.BATCH_LBS}<(3.4/7)*2)`],
    // Pour Over: 2 days = 2 × (0.5/7) ≈ 0.14 lbs
    [PR.POUR_LBS,  `=AND(B${PR.POUR_LBS}>0,B${PR.POUR_LBS}<(0.5/7)*2)`],
  ].map(([row, formula]) =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(formula)
      .setBackground('#FFF3CD').setFontColor('#856404')
      .setRanges([sheet.getRange(row, 2, 1, 20)]).build()
  );

  sheet.setConditionalFormatRules([
    ...dropRules,
    SpreadsheetApp.newConditionalFormatRule().whenNumberLessThanOrEqualTo(0)
      .setBackground('#F8D7DA').setFontColor('#721C24').setRanges(allLbsRanges).build(),
    ...lbsLowRules,
  ]);

  sheet.setFrozenRows(2);
  sheet.setFrozenColumns(1);

  // Populate week/day header dates so the sheet is usable immediately
  // (setupAll also calls refreshWeekDates later, but call here for safety)
  _writeHeaderDates(sheet);

  Logger.log('✓ Planner sheet ready (daily, 20 working days)');
}

// Writes week group headers (row 1 merged) + day headers (row 2) for 20 days.
// Pulled out so both setupPlannerSheet and refreshWeekDates can use it.
function _writeHeaderDates(plan) {
  const tz        = Session.getScriptTimeZone();
  const today     = new Date();
  const dayOfWeek = today.getDay();

  // Find this week's Monday (local time), then Wednesday
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  const wednesday = new Date(monday);
  wednesday.setDate(monday.getDate() + 2);
  wednesday.setHours(0, 0, 0, 0);

  const DAY_NAMES = ['Wed','Thu','Fri','Sat','Sun'];

  for (let w = 0; w < 4; w++) {
    const wedDate = new Date(wednesday);
    wedDate.setDate(wednesday.getDate() + w * 7);
    wedDate.setHours(0, 0, 0, 0);

    const sunDate = new Date(wedDate);
    sunDate.setDate(wedDate.getDate() + 4);
    sunDate.setHours(0, 0, 0, 0);

    const wStartCol = planCol(w, 0);
    const wLabel =
      Utilities.formatDate(wedDate, tz, 'MMM d') + ' – ' +
      Utilities.formatDate(sunDate, tz, 'MMM d');

    try { plan.getRange(PR.WEEK_HDR, wStartCol, 1, 5).breakApart(); } catch(e) {}
    plan.getRange(PR.WEEK_HDR, wStartCol, 1, 5).merge()
      .setValue(wLabel)
      .setBackground('#2C1810').setFontColor('#FFFFFF')
      .setFontWeight('bold').setHorizontalAlignment('center').setFontSize(10);

    for (let d = 0; d < 5; d++) {
      const col     = planCol(w, d);
      const dayDate = new Date(wedDate);
      dayDate.setDate(wedDate.getDate() + d);
      dayDate.setHours(0, 0, 0, 0);
      plan.getRange(PR.DAY_HDR, col)
        .setValue(dayDate)
        .setNumberFormat(`"${DAY_NAMES[d]}" M/D`)
        .setHorizontalAlignment('center')
        .setFontWeight('bold')
        .setFontColor('#FFFFFF')
        .setBackground('#4A2C17');
    }
  }

  plan.getRange(PR.DAY_HDR, 1).setValue('Program')
    .setBackground('#4A2C17').setFontColor('#FFFFFF').setFontWeight('bold');
  Logger.log('✓ Header dates written for week of ' + Utilities.formatDate(wednesday, tz, 'MMM d, yyyy'));
}

// Lbs remaining at a specific day — fixed burn rate program
// dy = days since activation (Sheets dates are serial numbers, subtraction gives days directly)
function lbsEnd(dropCell, dayCell, burnRate, programName) {
  return `=IFERROR(IF(${dropCell}="","",LET(` +
    `r,MATCH(${dropCell},Inventory!$L:$L,0),` +
    `ip,INDEX(Inventory!$M:$M,r)="${programName}",` +
    `al,IF(ip,INDEX(Inventory!$O:$O,r),INDEX(Inventory!$P:$P,r)),` +
    `ac,INDEX(Inventory!$U:$U,r),` +
    `dy,IF(AND(ISNUMBER(ac),ac<=${dayCell}),${dayCell}-ac,0),` +
    `MAX(0,ROUND(al-(${burnRate}/7)*dy,1)))),"")`;
}

// Lbs remaining at a specific day — variable burn rate (Featured Espresso)
// burnRateCell holds lbs/wk entered by user; divide by 7 for daily rate
function lbsEndVar(dropCell, dayCell, burnRateCell) {
  return `=IFERROR(IF(OR(${dropCell}="",${burnRateCell}=""),"",LET(` +
    `r,MATCH(${dropCell},Inventory!$L:$L,0),` +
    `ip,INDEX(Inventory!$M:$M,r)="Featured Espresso",` +
    `al,IF(ip,INDEX(Inventory!$O:$O,r),INDEX(Inventory!$P:$P,r)),` +
    `ac,INDEX(Inventory!$U:$U,r),` +
    `br,${burnRateCell}/7,` +
    `dy,IF(AND(ISNUMBER(ac),ac<=${dayCell}),${dayCell}-ac,0),` +
    `MAX(0,ROUND(al-br*dy,1)))),"")`;
}

// ================================================================
// SHEET 3: COVERAGE DASHBOARD
// ================================================================

function setupDashboardSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_DASH);
  if (!sheet) sheet = ss.insertSheet(SHEET_DASH, 3);
  else { sheet.clear(); sheet.clearConditionalFormatRules(); }

  try { sheet.setFrozenRows(0);    } catch(e) {}
  try { sheet.setFrozenColumns(0); } catch(e) {}
  try { sheet.getRange(1,1,sheet.getMaxRows(),sheet.getMaxColumns()).breakApart(); } catch(e) {}

  sheet.setColumnWidth(1, 185);
  [2,3,4,5].forEach(c => sheet.setColumnWidth(c, 215));

  // Dashboard shows one column per week, referencing the Wednesday (first day) of each week
  // Planner week starts: col B (wk1), G (wk2), L (wk3), Q (wk4)
  const WED_COLS = ['B','G','L','Q'];

  sheet.getRange(1,1,1,5).setBackground('#2C1810').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange(1,1).setValue('Program');
  WED_COLS.forEach((col, wi) =>
    sheet.getRange(1, wi+2)
      .setFormula(`='Daily Planner'!${col}${PR.DAY_HDR}`)
      .setNumberFormat('"Wk" MMM D')
      .setHorizontalAlignment('center').setFontWeight('bold').setFontColor('#FFFFFF'));

  // Program rows
  const P = "'Daily Planner'";
  [
    {row:2, name:'House Espresso',    dr:PR.HOUSE_DROP, lr:PR.HOUSE_LBS, br:13.6},
    {row:3, name:'Featured Espresso', dr:PR.FEAT_DROP,  lr:PR.FEAT_LBS,  br:null, brr:PR.FEAT_BURN},
    {row:4, name:'Batch Drip',        dr:PR.BATCH_DROP, lr:PR.BATCH_LBS, br:3.4},
    {row:5, name:'Pour Over',         dr:PR.POUR_DROP,  lr:PR.POUR_LBS,  br:0.5},
  ].forEach(prog => {
    sheet.getRange(prog.row,1).setValue(prog.name).setFontWeight('bold');
    sheet.setRowHeight(prog.row, 65);

    WED_COLS.forEach((col, wi) => {
      const coffee = `${P}!${col}${prog.dr}`;
      const lbs    = `${P}!${col}${prog.lr}`;
      const wk     = `${P}!${col}${PR.DAY_HDR}`;
      const br     = prog.br
        ? prog.br
        : `IF(ISNUMBER(${P}!${col}${prog.brr}),${P}!${col}${prog.brr},2)`;

      const status =
        `IF(${coffee}="","Out",IFERROR(LET(` +
        `l,IF(ISNUMBER(${lbs}),${lbs},0),` +
        `rr,INDEX(Inventory!$R:$R,MATCH(${coffee},Inventory!$L:$L,0)),` +
        `IF(AND(ISNUMBER(rr),rr>${wk}),"Not Brew-Ready",` +
        `IF(l<=0,"Out",IF(l<${br},"Low","Covered")))),"Out"))`;

      sheet.getRange(prog.row, wi+2)
        .setFormula(
          `=IF(${coffee}="","⚠ Nothing assigned",` +
          `${coffee}&CHAR(10)&${status}&CHAR(10)&` +
          `IF(ISNUMBER(${lbs}),TEXT(${lbs},"0.0")&" lbs",""))`)
        .setWrap(true).setVerticalAlignment('middle').setHorizontalAlignment('center');
    });
  });

  // Summary row
  sheet.setRowHeight(6, 80);
  sheet.getRange(6,1).setValue('Weekly Summary').setFontWeight('bold').setBackground('#F5F5F5');
  WED_COLS.forEach((col, wi) => {
    sheet.getRange(6, wi+2).setFormula(
      `=LET(hl,IF(ISNUMBER(${P}!${col}${PR.HOUSE_LBS}),${P}!${col}${PR.HOUSE_LBS},0),` +
      `fl,IF(ISNUMBER(${P}!${col}${PR.FEAT_LBS}),${P}!${col}${PR.FEAT_LBS},0),` +
      `bl,IF(ISNUMBER(${P}!${col}${PR.BATCH_LBS}),${P}!${col}${PR.BATCH_LBS},0),` +
      `pl,IF(ISNUMBER(${P}!${col}${PR.POUR_LBS}),${P}!${col}${PR.POUR_LBS},0),` +
      `ho,AND(${P}!${col}${PR.HOUSE_DROP}<>"",hl>=13.6),` +
      `fo,${P}!${col}${PR.FEAT_DROP}<>"",` +
      `bo,AND(${P}!${col}${PR.BATCH_DROP}<>"",bl>=3.4),` +
      `po,AND(${P}!${col}${PR.POUR_DROP}<>"",pl>=0.5),` +
      `n,IF(ho,1,0)+IF(fo,1,0)+IF(bo,1,0)+IF(po,1,0),` +
      `TEXT(n,"0")&"/4 programs covered"&` +
      `IF(NOT(ho),CHAR(10)&"⚠ House Espresso","")&` +
      `IF(NOT(fo),CHAR(10)&"⚠ Featured Espresso","")&` +
      `IF(NOT(bo),CHAR(10)&"⚠ Batch Drip","")&` +
      `IF(NOT(po),CHAR(10)&"⚠ Pour Over",""))`)
      .setWrap(true).setBackground('#F5F5F5').setFontSize(9);
  });

  // Coverage conditional formatting
  const cov = [sheet.getRange('B2:E5')];
  const covRules = [
    SpreadsheetApp.newConditionalFormatRule().whenTextContains('Covered').setBackground('#D4EDDA').setFontColor('#155724').setRanges(cov).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains('Low').setBackground('#FFF3CD').setFontColor('#856404').setRanges(cov).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains('Not Brew-Ready').setBackground('#CCE5FF').setFontColor('#004085').setRanges(cov).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains('Out').setBackground('#F8D7DA').setFontColor('#721C24').setRanges(cov).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains('Nothing assigned').setBackground('#F5C6CB').setFontColor('#721C24').setRanges(cov).build(),
  ];

  // Retail freshness section
  sheet.getRange(8,1,1,5).merge().setValue('RETAIL FRESHNESS')
    .setBackground('#1A3A2A').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(11);
  sheet.getRange(9,1,1,5)
    .setValues([['Coffee','Bags On Hand','Wks Supply','Days to Cutoff','Freshness Status']])
    .setBackground('#2A5A3A').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange(10,1).setFormula(
    '=IFERROR(SORT(FILTER(' +
    '{Inventory!L2:L500,Inventory!Y2:Y500,Inventory!AF2:AF500,Inventory!AE2:AE500,Inventory!AG2:AG500},' +
    '(Inventory!A2:A500="retail")*(Inventory!L2:L500<>"")),4,TRUE),' +
    '{"No retail inventory yet","","","",""})');

  const fresh = [sheet.getRange('E10:E60')];
  sheet.setConditionalFormatRules([...covRules,
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('OK').setBackground('#D4EDDA').setFontColor('#155724').setRanges(fresh).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Watch').setBackground('#FFF3CD').setFontColor('#856404').setRanges(fresh).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Urgent').setBackground('#FFE8CC').setFontColor('#7D3A00').setRanges(fresh).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Expired').setBackground('#F8D7DA').setFontColor('#721C24').setRanges(fresh).build(),
  ]);

  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);
  Logger.log('✓ Dashboard sheet ready');
}

// ================================================================
// WEEKLY WORKFLOW FUNCTIONS
// ================================================================

// Auto-detects how many weeks have passed and catches up in one shot.
// Past weeks are cleared; lbs rows are formulas and auto-update.
function advanceWeek() {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const plan = ss.getSheetByName(SHEET_PLAN);
  if (!plan) {
    SpreadsheetApp.getUi().alert('Planner sheet not found. Run Full Setup first.');
    return;
  }

  // Col B = day 0 of week 0 (this week's Wednesday)
  const colBVal = plan.getRange(PR.DAY_HDR, 2).getValue();
  if (!(colBVal instanceof Date)) {
    SpreadsheetApp.getUi().alert('No date found in planner. Run Full Setup first.');
    return;
  }

  const today  = new Date();
  const day    = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const thisWed = new Date(monday);
  thisWed.setDate(monday.getDate() + 2);

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksOld  = Math.round((thisWed - colBVal) / msPerWeek);

  if (weeksOld <= 0) {
    SpreadsheetApp.getUi().alert('Planner is already current — nothing to advance.');
    return;
  }

  // Only user-entered rows need shifting (lbs rows are formulas, they auto-update)
  const dataRows = [PR.HOUSE_DROP, PR.FEAT_DROP, PR.FEAT_BURN, PR.BATCH_DROP, PR.POUR_DROP];

  // Each week = 5 day-columns; shift left by 5 per elapsed week
  for (let w = 0; w < weeksOld; w++) {
    dataRows.forEach(row => {
      const vals = plan.getRange(row, 2, 1, 20).getValues()[0]; // 20 day cols B–U
      for (let c = 0; c < 15; c++) {                           // shift left by 5
        plan.getRange(row, 2 + c).setValue(vals[c + 5] !== undefined ? vals[c + 5] : '');
      }
      plan.getRange(row, 17, 1, 5).clearContent();             // clear new week 4
    });
  }

  refreshWeekDates();
  refreshDropdowns();

  const wkLabel = weeksOld === 1 ? '1 week' : `${weeksOld} weeks`;
  SpreadsheetApp.getUi().alert(
    `✓ Advanced ${wkLabel} — planner is now current.\n\n` +
    'Past week selections have been cleared.\n' +
    'Fill in the new rightmost week to complete the plan.'
  );
}

// Writes week group headers (row 1, merged) and day headers (row 2) for all 20 days
function refreshWeekDates() {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const plan = ss.getSheetByName(SHEET_PLAN);
  if (!plan) return;
  _writeHeaderDates(plan);
  Logger.log('✓ Week dates updated (daily Wed–Sun)');
}

// Refreshes planner dropdown options from current inventory.
// Each of the 20 day-columns gets its own filtered list based on that day's date,
// so depleted coffees disappear from dropdowns as lbs run out day by day.
function refreshDropdowns() {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const plan = ss.getSheetByName(SHEET_PLAN);
  const inv  = ss.getSheetByName(SHEET_INV);
  if (!plan || !inv) return;

  const lastRow = inv.getLastRow();
  if (lastRow < 2) { Logger.log('No inventory data yet'); return; }

  const invData = inv.getRange(2, 1, lastRow - 1, 33).getValues();

  // Read all 20 individual day dates from the header row
  const dayDates = [];
  for (let w = 0; w < 4; w++) {
    dayDates[w] = [];
    for (let d = 0; d < 5; d++) {
      const v = plan.getRange(PR.DAY_HDR, planCol(w, d)).getValue();
      dayDates[w][d] = (v instanceof Date) ? v : null;
    }
  }

  [
    {name:'House Espresso',    burnRate:13.6, dropRow:PR.HOUSE_DROP},
    {name:'Featured Espresso', burnRate:2,    dropRow:PR.FEAT_DROP },
    {name:'Batch Drip',        burnRate:3.4,  dropRow:PR.BATCH_DROP},
    {name:'Pour Over',         burnRate:0.5,  dropRow:PR.POUR_DROP },
  ].forEach(prog => {
    for (let w = 0; w < 4; w++) {
      for (let d = 0; d < 5; d++) {
        const dayDate = dayDates[w][d];
        if (!dayDate) continue;
        const available = getAvailableCoffees(invData, prog.name, dayDate, prog.burnRate);
        const list = available.length > 0 ? available : ['— nothing available —'];
        const validation = SpreadsheetApp.newDataValidation()
          .requireValueInList(list, true)
          .setAllowInvalid(false)   // enforce: only listed coffees allowed
          .setHelpText(available.length > 0
            ? `${available.length} coffee(s) available for ${prog.name} this day`
            : `No coffees available for ${prog.name} — check brew-ready date and lbs`)
          .build();
        plan.getRange(prog.dropRow, planCol(w, d)).setDataValidation(validation);
      }
    }
  });
  Logger.log('✓ Dropdowns refreshed — per-day availability (20 days)');
}

// Returns display names of coffees available for a program on a specific day.
// Filters: must be brewing type, match program (primary or secondary),
// not finished, brew-ready by that day, and have lbs remaining at that day.
function getAvailableCoffees(invData, programName, dayDate, burnRate) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const result   = [];

  for (const row of invData) {
    if (row[IC.TYPE] !== 'brewing') continue;
    const displayName = row[IC.DISPLAY_NAME];
    if (!displayName) continue;

    // Must match program in either primary or secondary slot
    const primary   = row[IC.PRIMARY];
    const secondary = row[IC.SECONDARY];
    if (primary !== programName && secondary !== programName) continue;

    // Skip finished coffees
    const actualEnd = row[IC.ACTUAL_END];
    if (actualEnd instanceof Date || (typeof actualEnd === 'string' && actualEnd !== '')) continue;

    // Skip coffees that aren't brew-ready yet on this day
    const brewReady = row[IC.BREW_READY];
    if (brewReady instanceof Date && brewReady > dayDate) continue;

    // Use primary alloc if this is the primary program, secondary otherwise
    const isPrimary = primary === programName;
    const alloc     = isPrimary ? row[IC.ALLOC_PRI] : row[IC.ALLOC_SEC];
    if (!alloc || alloc <= 0) continue;

    // Day-level depletion: lbs = alloc - (burnRate/7) * daysActive
    const activated = row[IC.ACTIVATED];
    let lbsLeft = alloc;
    if (activated instanceof Date && activated <= dayDate) {
      const days = Math.round((dayDate - activated) / msPerDay);
      lbsLeft = Math.max(0, alloc - (burnRate / 7) * days);
    }

    if (lbsLeft > 0) result.push(displayName);
  }
  return result;
}

// ================================================================
// SHEET 4: CURRENT STATUS
// ================================================================

function setupStatusSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_STATUS);
  if (!sheet) sheet = ss.insertSheet(SHEET_STATUS, 1);
  else { sheet.clear(); sheet.clearConditionalFormatRules(); }

  try { sheet.setFrozenRows(0);    } catch(e) {}
  try { sheet.setFrozenColumns(0); } catch(e) {}
  try { sheet.getRange(1,1,sheet.getMaxRows(),sheet.getMaxColumns()).breakApart(); } catch(e) {}

  sheet.setColumnWidth(1, 155);
  sheet.setColumnWidth(2, 165);
  sheet.setColumnWidth(3, 165);
  sheet.setColumnWidth(4, 165);

  const hdrBg = '#2C1810', hdrFg = '#FFFFFF';
  const subBg = '#4A2C17', subFg = '#FFFFFF';
  const greenBg = '#1A3A2A', greenSub = '#2A5A3A';

  // ── Section 1: Brewing Pipeline by Status ──
  sheet.getRange(1,1,1,4).merge()
    .setValue('BREWING PIPELINE')
    .setBackground(hdrBg).setFontColor(hdrFg).setFontWeight('bold').setFontSize(12);

  sheet.getRange(2,1,1,4)
    .setValues([['Status','# Coffees','Total Alloc lbs','Notes']])
    .setBackground(subBg).setFontColor(subFg).setFontWeight('bold');

  const brewStatuses = [
    ['Active',      'Currently on bar'],
    ['Ready',       'Rested — ready to activate'],
    ['Resting',     'Waiting for rest window'],
    ['In Transit',  'Ordered, en route'],
    ['Ordered',     'Order placed, not shipped'],
    ['Finished',    'All lbs used'],
  ];
  brewStatuses.forEach(([status, note], i) => {
    const row = i + 3;
    sheet.getRange(row, 1).setValue(status).setFontWeight('bold');
    sheet.getRange(row, 2).setFormula(
      `=COUNTIFS(Inventory!A:A,"brewing",Inventory!X:X,"${status}")`);
    sheet.getRange(row, 3).setFormula(
      `=IFERROR(SUMPRODUCT((Inventory!A2:A1000="brewing")*(Inventory!X2:X1000="${status}"),` +
      `IF(ISNUMBER(Inventory!O2:O1000),Inventory!O2:O1000,0)+` +
      `IF(ISNUMBER(Inventory!P2:P1000),Inventory!P2:P1000,0)),0)`);
    sheet.getRange(row, 3).setNumberFormat('0.0 "lbs"');
    sheet.getRange(row, 4).setValue(note).setFontColor('#888888').setFontSize(9);
    if (i % 2 === 0) sheet.getRange(row, 1, 1, 4).setBackground('#FAFAFA');
  });

  // ── Section 2: Planning Horizon — Now / +2 Weeks / ~1 Month ──
  // Each column references a different Wednesday in the Daily Planner:
  //   Now      = week 1 Wed (col B)
  //   +2 Weeks = week 3 Wed (col L)
  //   ~1 Month = week 4 Wed (col Q)
  const p2     = 10;
  const P      = "'Daily Planner'";
  const hCols  = [
    colLetter(planCol(0, 0)),   // B  — Now
    colLetter(planCol(2, 0)),   // L  — +2 Weeks
    colLetter(planCol(3, 0)),   // Q  — ~1 Month
  ];
  const hLabels = ['Now', '+2 Weeks', '~1 Month'];

  sheet.getRange(p2,1,1,4).merge()
    .setValue('PLANNING HORIZON')
    .setBackground(hdrBg).setFontColor(hdrFg).setFontWeight('bold').setFontSize(12);

  // Column headers: label + date pulled live from Daily Planner
  sheet.getRange(p2+1, 1).setValue('Program')
    .setBackground(subBg).setFontColor(subFg).setFontWeight('bold');
  hCols.forEach((col, j) => {
    sheet.getRange(p2+1, j+2)
      .setFormula(`="${hLabels[j]}"&CHAR(10)&IFERROR(TEXT(${P}!${col}${PR.DAY_HDR},"MMM d"),"")`)
      .setBackground(subBg).setFontColor(subFg).setFontWeight('bold')
      .setWrap(true).setHorizontalAlignment('center');
  });
  sheet.setRowHeight(p2+1, 36);

  // Program rows — each cell: coffee name + status + lbs remaining
  const progData = [
    { name:'House Espresso',    dr:PR.HOUSE_DROP, lr:PR.HOUSE_LBS },
    { name:'Featured Espresso', dr:PR.FEAT_DROP,  lr:PR.FEAT_LBS  },
    { name:'Batch Drip',        dr:PR.BATCH_DROP, lr:PR.BATCH_LBS },
    { name:'Pour Over',         dr:PR.POUR_DROP,  lr:PR.POUR_LBS  },
  ];

  const horizonRanges = [];
  progData.forEach((prog, i) => {
    const row = p2 + 2 + i;
    sheet.setRowHeight(row, 60);
    sheet.getRange(row, 1).setValue(prog.name).setFontWeight('bold').setVerticalAlignment('middle');

    hCols.forEach((col, j) => {
      const coffee = `${P}!${col}${prog.dr}`;
      const lbs    = `${P}!${col}${prog.lr}`;
      const status = `IFERROR(INDEX(Inventory!$X:$X,MATCH(${coffee},Inventory!$L:$L,0)),"")`;
      const cell   = sheet.getRange(row, j+2);
      cell.setFormula(
        `=IF(${coffee}="","⚠ Not planned",` +
        `${coffee}&CHAR(10)&${status}&` +
        `IF(ISNUMBER(${lbs})," — "&TEXT(${lbs},"0.0")&" lbs",""))`)
        .setWrap(true).setVerticalAlignment('middle').setHorizontalAlignment('center');
      horizonRanges.push(cell);
    });

    if (i % 2 === 0) sheet.getRange(row, 1, 1, 4).setBackground('#FAFAFA');
  });

  // ── Section 3: Retail Inventory ──
  const p3 = 16;
  sheet.getRange(p3,1,1,4).merge()
    .setValue('RETAIL INVENTORY')
    .setBackground(greenBg).setFontColor(hdrFg).setFontWeight('bold').setFontSize(12);

  sheet.getRange(p3+1,1,1,4)
    .setValues([['Freshness','# Coffees','Bags On Hand','Avg Wks Supply']])
    .setBackground(greenSub).setFontColor(hdrFg).setFontWeight('bold');

  const freshStatuses = ['OK','Watch','Urgent','Expired'];
  freshStatuses.forEach((status, i) => {
    const row = p3 + 2 + i;
    sheet.getRange(row, 1).setValue(status).setFontWeight('bold');
    sheet.getRange(row, 2).setFormula(
      `=COUNTIFS(Inventory!A:A,"retail",Inventory!AG:AG,"${status}")`);
    sheet.getRange(row, 3).setFormula(
      `=IFERROR(SUMPRODUCT((Inventory!A2:A1000="retail")*(Inventory!AG2:AG1000="${status}"),` +
      `IF(ISNUMBER(Inventory!Y2:Y1000),Inventory!Y2:Y1000,0)),0)`);
    sheet.getRange(row, 4).setFormula(
      `=IFERROR(AVERAGEIFS(Inventory!AF:AF,Inventory!A:A,"retail",Inventory!AG:AG,"${status}"),"—")`);
    sheet.getRange(row, 4).setNumberFormat('0.0');
    if (i % 2 === 0) sheet.getRange(row, 1, 1, 4).setBackground('#F0FAF3');
  });

  // Total row
  const totalRow = p3 + 2 + freshStatuses.length + 1;
  sheet.getRange(totalRow,1,1,4)
    .setValues([['TOTAL','=COUNTIF(Inventory!A:A,"retail")',
      '=IFERROR(SUMPRODUCT((Inventory!A2:A1000="retail")*IF(ISNUMBER(Inventory!Y2:Y1000),Inventory!Y2:Y1000,0)),0)',
      '']])
    .setBackground('#E8F6EE').setFontWeight('bold');
  sheet.getRange(totalRow, 3).setNumberFormat('0');

  // Conditional formatting — planning horizon cells
  const horizonRangeList = [sheet.getRange(p2+2, 2, 4, 3)];
  const horizonRules = [
    SpreadsheetApp.newConditionalFormatRule().whenTextContains('⚠ Not planned')
      .setBackground('#FFF3CD').setFontColor('#856404').setRanges(horizonRangeList).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains('Active')
      .setBackground('#D4EDDA').setFontColor('#155724').setRanges(horizonRangeList).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains('Ready')
      .setBackground('#CCF5F1').setFontColor('#0C5460').setRanges(horizonRangeList).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains('Resting')
      .setBackground('#E2D9F3').setFontColor('#4B2B7A').setRanges(horizonRangeList).build(),
  ];

  // Conditional formatting — freshness label column
  const freshLabelRange = [sheet.getRange(`A${p3+2}:A${p3+5}`)];
  sheet.setConditionalFormatRules([
    ...horizonRules,
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('OK')
      .setBackground('#D4EDDA').setFontColor('#155724').setRanges(freshLabelRange).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Watch')
      .setBackground('#FFF3CD').setFontColor('#856404').setRanges(freshLabelRange).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Urgent')
      .setBackground('#FFE8CC').setFontColor('#7D3A00').setRanges(freshLabelRange).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Expired')
      .setBackground('#F8D7DA').setFontColor('#721C24').setRanges(freshLabelRange).build(),
  ]);

  // Brewing status label column conditional formatting
  const brewLabelRange = [sheet.getRange('A3:A8')];
  const existingRules = sheet.getConditionalFormatRules();
  sheet.setConditionalFormatRules([...existingRules,
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Active')
      .setBackground('#D4EDDA').setFontColor('#155724').setRanges(brewLabelRange).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Ready')
      .setBackground('#CCF5F1').setFontColor('#0C5460').setRanges(brewLabelRange).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Resting')
      .setBackground('#E2D9F3').setFontColor('#4B2B7A').setRanges(brewLabelRange).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('In Transit')
      .setBackground('#CCE5FF').setFontColor('#004085').setRanges(brewLabelRange).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Ordered')
      .setBackground('#F8F9FA').setFontColor('#6C757D').setRanges(brewLabelRange).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Finished')
      .setBackground('#E2E3E5').setFontColor('#383D41').setRanges(brewLabelRange).build(),
  ]);

  sheet.setFrozenRows(2);
  Logger.log('✓ Status sheet ready');
}
