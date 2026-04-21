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
const SHEET_PLAN   = 'Program Planner';
const SHEET_DASH   = 'Coverage Dashboard';
const SHEET_STATUS = 'Current Status';

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
const PR = {
  HEADER:1,
  HOUSE_DROP:2, HOUSE_LBS:3,
  FEAT_DROP:4,  FEAT_BURN:5, FEAT_LBS:6,
  BATCH_DROP:7, BATCH_LBS:8,
  POUR_DROP:9,  POUR_LBS:10,
  NOTE:12
};

function onOpen() {
  SpreadsheetApp.getActiveSpreadsheet().addMenu('☕ Sometimes Coffee', [
    { name: 'Advance to Next Week',      functionName: 'advanceWeek'       },
    { name: 'Refresh Planner Dropdowns', functionName: 'refreshDropdowns'  },
    null,
    { name: 'Full Setup (first run)',    functionName: 'setupAll'          },
    { name: 'Rebuild Status Sheet',      functionName: 'rebuildStatusSheet'}
  ]);
}

function setupAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupInventorySheet(ss);
  setupPlannerSheet(ss);
  setupDashboardSheet(ss);
  setupStatusSheet(ss);
  refreshWeekDates();
  refreshDropdowns();
  SpreadsheetApp.getUi().alert(
    '✓ Sometimes Coffee is ready!\n\n' +
    '1. Add entries in the Inventory sheet\n' +
    '2. Use Program Planner to assign coffees each week\n' +
    '3. Check Coverage Dashboard for red/yellow flags\n' +
    '4. Check Current Status for live counts and lbs\n\n' +
    'Every Monday: ☕ menu → Advance to Next Week'
  );
}

function rebuildStatusSheet() {
  setupStatusSheet(SpreadsheetApp.getActiveSpreadsheet());
  SpreadsheetApp.getUi().alert('✓ Current Status sheet rebuilt.');
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
  if (!sheet) sheet = ss.insertSheet(SHEET_PLAN, 1);
  else { sheet.clear(); sheet.clearConditionalFormatRules(); }

  sheet.setColumnWidth(1, 185);
  [2,3,4,5].forEach(c => sheet.setColumnWidth(c, 215));
  sheet.setRowHeight(PR.HEADER, 40);
  [PR.HOUSE_DROP,PR.FEAT_DROP,PR.BATCH_DROP,PR.POUR_DROP].forEach(r => sheet.setRowHeight(r, 36));
  [PR.HOUSE_LBS,PR.FEAT_BURN,PR.FEAT_LBS,PR.BATCH_LBS,PR.POUR_LBS].forEach(r => sheet.setRowHeight(r, 26));

  // Header row background
  sheet.getRange(1,1,1,5).setBackground('#2C1810').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange(1,1).setValue('Program');

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
    sheet.getRange(row,2,1,4).setBackground(bg);
  });

  // Lbs-remaining formulas for each program × week column
  ['B','C','D','E'].forEach(col => {
    const wk = `${col}${PR.HEADER}`;
    sheet.getRange(`${col}${PR.HOUSE_LBS}`).setFormula(lbsEnd(`${col}${PR.HOUSE_DROP}`,wk,13.6,'House Espresso'));
    sheet.getRange(`${col}${PR.FEAT_LBS}`).setFormula(lbsEndVar(`${col}${PR.FEAT_DROP}`,wk,`${col}${PR.FEAT_BURN}`));
    sheet.getRange(`${col}${PR.BATCH_LBS}`).setFormula(lbsEnd(`${col}${PR.BATCH_DROP}`,wk,3.4,'Batch Drip'));
    sheet.getRange(`${col}${PR.POUR_LBS}`).setFormula(lbsEnd(`${col}${PR.POUR_DROP}`,wk,0.5,'Pour Over'));
  });

  [PR.HOUSE_LBS,PR.FEAT_LBS,PR.BATCH_LBS,PR.POUR_LBS].forEach(r =>
    sheet.getRange(r,2,1,4).setNumberFormat('0.0 "lbs"'));
  sheet.getRange(PR.FEAT_BURN,2,1,4).setNumberFormat('0.0')
       .setNote('Enter Featured Espresso burn rate in lbs/week (variable per coffee)');

  // Burn rates note row
  sheet.getRange(PR.NOTE,1,1,5).merge()
    .setValue('Burn rates: House Espresso 13.6 lbs/wk  |  Batch Drip 3.4 lbs/wk  |  Pour Over 0.5 lbs/wk  |  Featured: enter manually in row 5')
    .setFontSize(8).setFontColor('#888888').setBackground('#F8F8F8');

  // Conditional formatting on lbs cells
  const lbsRanges = [PR.HOUSE_LBS,PR.FEAT_LBS,PR.BATCH_LBS,PR.POUR_LBS]
    .map(r => sheet.getRange(r,2,1,4));
  sheet.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenNumberLessThanOrEqualTo(0)
      .setBackground('#F8D7DA').setFontColor('#721C24').setRanges(lbsRanges).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberBetween(0.01,5)
      .setBackground('#FFF3CD').setFontColor('#856404').setRanges(lbsRanges).build(),
  ]);

  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);
  Logger.log('✓ Planner sheet ready');
}

// Lbs at END of week — fixed burn rate program
function lbsEnd(dropCell, weekCell, burnRate, programName) {
  return `=IFERROR(IF(${dropCell}="","",LET(` +
    `r,MATCH(${dropCell},Inventory!$L:$L,0),` +
    `ip,INDEX(Inventory!$M:$M,r)="${programName}",` +
    `al,IF(ip,INDEX(Inventory!$O:$O,r),INDEX(Inventory!$P:$P,r)),` +
    `ac,INDEX(Inventory!$U:$U,r),` +
    `wk,IF(AND(ISNUMBER(ac),ac<=${weekCell}),MAX(0,INT((${weekCell}-ac)/7)),0),` +
    `s,MAX(0,ROUND(al-${burnRate}*wk,1)),` +
    `MAX(0,ROUND(s-${burnRate},1)))),"")`;
}

// Lbs at END of week — variable burn rate (Featured Espresso)
function lbsEndVar(dropCell, weekCell, burnRateCell) {
  return `=IFERROR(IF(OR(${dropCell}="",${burnRateCell}=""),"",LET(` +
    `r,MATCH(${dropCell},Inventory!$L:$L,0),` +
    `ip,INDEX(Inventory!$M:$M,r)="Featured Espresso",` +
    `al,IF(ip,INDEX(Inventory!$O:$O,r),INDEX(Inventory!$P:$P,r)),` +
    `ac,INDEX(Inventory!$U:$U,r),` +
    `br,${burnRateCell},` +
    `wk,IF(AND(ISNUMBER(ac),ac<=${weekCell}),MAX(0,INT((${weekCell}-ac)/7)),0),` +
    `s,MAX(0,ROUND(al-br*wk,1)),` +
    `MAX(0,ROUND(s-br,1)))),"")`;
}

// ================================================================
// SHEET 3: COVERAGE DASHBOARD
// ================================================================

function setupDashboardSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_DASH);
  if (!sheet) sheet = ss.insertSheet(SHEET_DASH, 2);
  else { sheet.clear(); sheet.clearConditionalFormatRules(); }

  sheet.setColumnWidth(1, 185);
  [2,3,4,5].forEach(c => sheet.setColumnWidth(c, 215));

  // Header — week dates mirror Planner
  sheet.getRange(1,1,1,5).setBackground('#2C1810').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange(1,1).setValue('Program');
  ['B','C','D','E'].forEach(col =>
    sheet.getRange(`${col}1`).setFormula(`='Program Planner'!${col}1`)
         .setNumberFormat('MMM D').setHorizontalAlignment('center')
         .setFontWeight('bold').setFontColor('#FFFFFF'));

  // Program rows
  const P = "'Program Planner'";
  [
    {row:2, name:'House Espresso',    dr:PR.HOUSE_DROP, lr:PR.HOUSE_LBS, br:13.6},
    {row:3, name:'Featured Espresso', dr:PR.FEAT_DROP,  lr:PR.FEAT_LBS,  br:null, brr:PR.FEAT_BURN},
    {row:4, name:'Batch Drip',        dr:PR.BATCH_DROP, lr:PR.BATCH_LBS, br:3.4},
    {row:5, name:'Pour Over',         dr:PR.POUR_DROP,  lr:PR.POUR_LBS,  br:0.5},
  ].forEach(prog => {
    sheet.getRange(prog.row,1).setValue(prog.name).setFontWeight('bold');
    sheet.setRowHeight(prog.row, 65);

    ['B','C','D','E'].forEach((col, wi) => {
      const coffee = `${P}!${col}${prog.dr}`;
      const lbs    = `${P}!${col}${prog.lr}`;
      const wk     = `${P}!${col}${PR.HEADER}`;
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
  ['B','C','D','E'].forEach((col, wi) => {
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

// Run every Monday — shifts selections left and opens up new Week 4
function advanceWeek() {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const plan = ss.getSheetByName(SHEET_PLAN);
  if (!plan) {
    SpreadsheetApp.getUi().alert('Planner sheet not found. Run Full Setup first.');
    return;
  }

  // Rows that hold operator-entered data (selections + featured burn rate)
  const dataRows = [PR.HOUSE_DROP, PR.FEAT_DROP, PR.FEAT_BURN, PR.BATCH_DROP, PR.POUR_DROP];

  // Shift Week 2→1, Week 3→2, Week 4→3, clear Week 4
  dataRows.forEach(row => {
    const vals = plan.getRange(row, 2, 1, 4).getValues()[0]; // [B, C, D, E]
    plan.getRange(row, 2).setValue(vals[1]); // C → B
    plan.getRange(row, 3).setValue(vals[2]); // D → C
    plan.getRange(row, 4).setValue(vals[3]); // E → D
    plan.getRange(row, 5).clearContent();    // E = blank new week
  });

  // Advance dates and refresh dropdowns
  refreshWeekDates();
  refreshDropdowns();

  SpreadsheetApp.getUi().alert(
    '✓ Advanced to next week!\n\n' +
    'Your existing selections have shifted forward.\n' +
    'Fill in Week 4 (rightmost column) to complete the plan.'
  );
}

// Updates week date headers in the Planner (called by advanceWeek and setupAll)
// Shows Wednesday as the week start — shop is open Wed–Sun
function refreshWeekDates() {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const plan = ss.getSheetByName(SHEET_PLAN);
  if (!plan) return;

  const today  = new Date();
  const day    = today.getDay();
  // Find this week's Monday, then step forward to Wednesday (+2)
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const wednesday = new Date(monday);
  wednesday.setDate(monday.getDate() + 2);

  [0,1,2,3].forEach(offset => {
    const d = new Date(wednesday);
    d.setDate(wednesday.getDate() + offset * 7);
    const end = new Date(d);
    end.setDate(d.getDate() + 4); // Wed + 4 = Sun

    const cell = plan.getRange(1, offset + 2);
    cell.setValue(d)
        .setNumberFormat('MMM D')
        .setHorizontalAlignment('center')
        .setFontWeight('bold')
        .setFontColor('#FFFFFF')
        .setNote(
          d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}) +
          ' – ' +
          end.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})
        );
  });
  Logger.log('✓ Week dates updated (Wed–Sun)');
}

// Refreshes planner dropdown options from current inventory state
function refreshDropdowns() {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const plan = ss.getSheetByName(SHEET_PLAN);
  const inv  = ss.getSheetByName(SHEET_INV);
  if (!plan || !inv) return;

  const lastRow = inv.getLastRow();
  if (lastRow < 2) { Logger.log('No inventory data yet'); return; }

  const invData = inv.getRange(2, 1, lastRow - 1, 33).getValues();
  const weeks   = [2,3,4,5].map(col => {
    const v = plan.getRange(1, col).getValue();
    return (v instanceof Date) ? v : null;
  });

  [
    {name:'House Espresso',    burnRate:13.6, dropRow:PR.HOUSE_DROP},
    {name:'Featured Espresso', burnRate:2,    dropRow:PR.FEAT_DROP },
    {name:'Batch Drip',        burnRate:3.4,  dropRow:PR.BATCH_DROP},
    {name:'Pour Over',         burnRate:0.5,  dropRow:PR.POUR_DROP },
  ].forEach(prog => {
    weeks.forEach((weekDate, wi) => {
      if (!weekDate) return;
      const available = getAvailableCoffees(invData, prog.name, weekDate, prog.burnRate);
      const list = available.length > 0 ? available : ['⚠ Nothing available'];
      plan.getRange(prog.dropRow, wi + 2).setDataValidation(
        SpreadsheetApp.newDataValidation()
          .requireValueInList(list, true)
          .setAllowInvalid(true)
          .setHelpText(available.length > 0
            ? `${available.length} option(s) ready for ${prog.name}`
            : `No coffees ready for ${prog.name} this week — check Inventory`)
          .build()
      );
    });
  });
  Logger.log('✓ Dropdowns refreshed');
}

// Returns display names of brewing inventory available for a program/week
function getAvailableCoffees(invData, programName, weekDate, burnRate) {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const result = [];

  for (const row of invData) {
    if (row[IC.TYPE] !== 'brewing') continue;
    const displayName = row[IC.DISPLAY_NAME];
    if (!displayName) continue;

    const primary   = row[IC.PRIMARY];
    const secondary = row[IC.SECONDARY];
    if (primary !== programName && secondary !== programName) continue;

    const actualEnd = row[IC.ACTUAL_END];
    if (actualEnd instanceof Date || (typeof actualEnd === 'string' && actualEnd !== '')) continue;

    const brewReady = row[IC.BREW_READY];
    if (brewReady instanceof Date && brewReady > weekDate) continue;

    const isPrimary = primary === programName;
    const alloc     = isPrimary ? row[IC.ALLOC_PRI] : row[IC.ALLOC_SEC];
    if (!alloc || alloc <= 0) continue;

    const activated = row[IC.ACTIVATED];
    let lbsLeft = alloc;
    if (activated instanceof Date && activated <= weekDate) {
      const wks = Math.floor((weekDate - activated) / msPerWeek);
      lbsLeft = Math.max(0, alloc - burnRate * wks);
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
  if (!sheet) sheet = ss.insertSheet(SHEET_STATUS, 3);
  else { sheet.clear(); sheet.clearConditionalFormatRules(); }

  sheet.setColumnWidth(1, 170);
  sheet.setColumnWidth(2, 85);
  sheet.setColumnWidth(3, 110);
  sheet.setColumnWidth(4, 135);

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

  // ── Section 2: By Program ──
  const p2 = 10;
  sheet.getRange(p2,1,1,4).merge()
    .setValue('BY PROGRAM')
    .setBackground(hdrBg).setFontColor(hdrFg).setFontWeight('bold').setFontSize(12);

  sheet.getRange(p2+1,1,1,4)
    .setValues([['Program','Active Coffee(s)','Ready to Pull','In Pipeline (not Finished)']])
    .setBackground(subBg).setFontColor(subFg).setFontWeight('bold');

  const programs = ['House Espresso','Featured Espresso','Batch Drip','Pour Over'];
  programs.forEach((prog, i) => {
    const row = p2 + 2 + i;
    sheet.getRange(row, 1).setValue(prog).setFontWeight('bold');
    sheet.getRange(row, 2).setFormula(
      `=IFERROR(TEXTJOIN(", ",TRUE,FILTER(Inventory!L:L,` +
      `(Inventory!A:A="brewing")*` +
      `((Inventory!M:M="${prog}")+(Inventory!N:N="${prog}"))*(Inventory!X:X="Active"))),"—")`);
    sheet.getRange(row, 3).setFormula(
      `=IFERROR(TEXTJOIN(", ",TRUE,FILTER(Inventory!L:L,` +
      `(Inventory!A:A="brewing")*` +
      `((Inventory!M:M="${prog}")+(Inventory!N:N="${prog}"))*(Inventory!X:X="Ready"))),"—")`);
    sheet.getRange(row, 4).setFormula(
      `=COUNTIFS(Inventory!A:A,"brewing",Inventory!M:M,"${prog}",Inventory!X:X,"<>Finished")+` +
      `COUNTIFS(Inventory!A:A,"brewing",Inventory!N:N,"${prog}",Inventory!X:X,"<>Finished")`);
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

  // Conditional formatting — freshness label column
  const freshLabelRange = [sheet.getRange(`A${p3+2}:A${p3+5}`)];
  sheet.setConditionalFormatRules([
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
