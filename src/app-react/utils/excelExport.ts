export interface ExcelExportOptions {
  filename: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  alignments?: ("left" | "center" | "right")[];
  types?: ("text" | "number" | "currency")[];
  showTotalRow?: boolean;
  totalRowSumColumns?: number[];
  totalRowLabelColumn?: number;
}

export function exportToExcel(options: ExcelExportOptions) {
  const {
    filename,
    title,
    subtitle,
    headers,
    rows,
    alignments = [],
    types = [],
    showTotalRow = false,
    totalRowSumColumns,
    totalRowLabelColumn = 0,
  } = options;

  // Generate Excel-compatible HTML content
  let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Laporan</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #1e293b;
    }
    .title {
      font-size: 16pt;
      font-weight: bold;
      color: #1e3a8a;
    }
    .subtitle {
      font-size: 10pt;
      color: #475569;
      font-style: italic;
    }
    table {
      border-collapse: collapse;
      margin-top: 15px;
    }
    th {
      background-color: #2563eb;
      color: #ffffff;
      font-weight: bold;
      border: 1px solid #94a3b8;
      padding: 8px 12px;
      font-size: 11pt;
    }
    td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      font-size: 10pt;
    }
    .text-left {
      text-align: left;
    }
    .text-center {
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
    /* Excel number formats */
    .currency {
      mso-number-format: "\\Rp\\ *\\ #\\,\\#\\#0\\;\\(Rp\\ *\\ #\\,\\#\\#0\\)\\;\\(Rp\\ *\\ \\\"-\\\"\\)\\;\\@";
      text-align: right;
    }
    .number {
      mso-number-format: "\\#\\,\\#\\#0";
      text-align: right;
    }
    .total-row td {
      background-color: #f1f5f9;
      font-weight: bold;
      border-top: 2px solid #64748b;
      border-bottom: 2px double #64748b;
      color: #0f172a;
    }
  </style>
</head>
<body>
  <table>
    <tr>
      <td colspan="${headers.length}" class="title">${title}</td>
    </tr>
  `;

  if (subtitle) {
    html += `
    <tr>
      <td colspan="${headers.length}" class="subtitle">${subtitle}</td>
    </tr>
    `;
  }

  // Spacer row
  html += `<tr><td colspan="${headers.length}" style="border: none; height: 10px;"></td></tr>`;

  // Headers
  html += "<tr>";
  headers.forEach((header) => {
    html += `<th>${header}</th>`;
  });
  html += "</tr>";

  // Rows
  rows.forEach((row) => {
    html += "<tr>";
    row.forEach((cell, idx) => {
      const align = alignments[idx] || "left";
      const type = types[idx] || "text";

      let cellClass = `text-${align}`;
      if (type === "currency") {
        cellClass = "currency";
      } else if (type === "number") {
        cellClass = "number";
      }

      html += `<td class="${cellClass}">${cell}</td>`;
    });
    html += "</tr>";
  });

  // Optional Total Row
  if (showTotalRow && rows.length > 0) {
    const sumColumns =
      totalRowSumColumns && totalRowSumColumns.length > 0
        ? new Set(totalRowSumColumns)
        : null;

    html += '<tr class="total-row">';
    headers.forEach((_, idx) => {
      const type = types[idx] || "text";

      if (idx === totalRowLabelColumn) {
        html += '<td class="text-left">TOTAL</td>';
      } else if (!sumColumns || sumColumns.has(idx)) {
        // Calculate sum
        const sum = rows.reduce((acc, row) => {
          const val = Number(row[idx]);
          return acc + (isNaN(val) ? 0 : val);
        }, 0);

        const cellClass = type === "currency" ? "currency" : "number";
        html += `<td class="${cellClass}">${sum}</td>`;
      } else {
        html += '<td style="background-color: #f1f5f9;"></td>';
      }
    });
    html += "</tr>";
  }

  html += `
  </table>
</body>
</html>
  `;

  // Create download link
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename.endsWith(".xls") ? filename : `${filename}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
