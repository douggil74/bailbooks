const XLSX = require('xlsx');

// Create workbook and worksheet
const wb = XLSX.utils.book_new();

// Headers
const headers = ['Name', 'Date of Bond', 'Amt', '12%', 'My Take', 'To Jail', 'To GA'];

// Create data with formulas (rows 2-50 pre-filled with formulas)
const data = [headers];

for (let i = 2; i <= 50; i++) {
  data.push([
    '',  // Name
    '',  // Date of Bond
    '',  // Amt
    { f: `C${i}*0.12` },           // 12%
    { f: `(C${i}*0.06)+30` },      // My Take (6% + $30 fee)
    { f: `C${i}*0.02` },           // To Jail (2%)
    { f: `C${i}*0.04` },           // To GA (4%)
  ]);
}

// Create worksheet from data
const ws = XLSX.utils.aoa_to_sheet(data);

// Set column widths
ws['!cols'] = [
  { wch: 20 },  // Name
  { wch: 14 },  // Date of Bond
  { wch: 12 },  // Amt
  { wch: 12 },  // 12%
  { wch: 12 },  // My Take
  { wch: 12 },  // To Jail
  { wch: 12 },  // To GA
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Bonds');

// Write file
XLSX.writeFile(wb, 'BailBonds_Tracker.xlsx');

console.log('Created: BailBonds_Tracker.xlsx');
