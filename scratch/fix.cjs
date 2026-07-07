const fs = require('fs');
let content = fs.readFileSync('src/app-react/pages/admin/AdminDashboard.tsx', 'utf8');

content = content.replace('  // Old calculations removed in favor of API', `  const [selectedReportStore, setSelectedReportStore] = useState<string>("all");
  const [selectedReportDate, setSelectedReportDate] = useState<string>(
    new Date().toLocaleDateString("en-CA"),
  );`);

fs.writeFileSync('src/app-react/pages/admin/AdminDashboard.tsx', content);
