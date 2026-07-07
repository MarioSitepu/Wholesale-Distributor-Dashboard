const fs = require('fs');
let content = fs.readFileSync('src/app-react/pages/admin/AdminDashboard.tsx', 'utf8');

// The original one is likely near '  const handleRefresh = () => {' or near '  const handleExportExcel = () => {'
// Let's remove any instance that occurs after the first 200 lines.
let lines = content.split('\n');
let newLines = [];
let foundCount = 0;
for (let line of lines) {
  if (line.includes('const [selectedReportStore, setSelectedReportStore]')) {
    foundCount++;
    if (foundCount > 1) continue;
  }
  if (line.includes('const [selectedReportDate, setSelectedReportDate]')) {
    if (foundCount > 1) {
      // skip this and next two lines
      continue;
    }
  }
  if (foundCount > 1 && (line.trim() === 'new Date().toLocaleDateString("en-CA"),' || line.trim() === ');')) {
     continue;
  }
  newLines.push(line);
}

fs.writeFileSync('src/app-react/pages/admin/AdminDashboard.tsx', newLines.join('\n'));
