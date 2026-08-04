const fs = require('fs');

let content = fs.readFileSync('src/pages/BarrelVsFuel.tsx', 'utf8');

// Add imports
if (!content.includes('jsPDF')) {
  content = content.replace(
    /from 'lucide-react';/,
    "from 'lucide-react';\nimport { jsPDF } from 'jspdf';\nimport autoTable from 'jspdf-autotable';\nimport { getLogoBase64, drawPdfHeader } from '../utils/pdfUtils';\nimport { toCanvas } from 'html-to-image';"
  );
}

if (!content.includes('Download,')) {
  content = content.replace(
    /BarChart3, DollarSign, Fuel, ArrowRight/g,
    'BarChart3, DollarSign, Fuel, ArrowRight, Download, RefreshCw'
  );
}

// Add state and ref
if (!content.includes('isExporting')) {
  content = content.replace(
    /const \[filterMonth, setFilterMonth\] = useState<string>\('all'\);/,
    "const [filterMonth, setFilterMonth] = useState<string>('all');\n  const [isExporting, setIsExporting] = useState(false);\n  const chartRef = React.useRef<HTMLDivElement>(null);"
  );
}

// Add handleExportPDF
const handleExportPDF = `
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      
      const logo = await getLogoBase64();
      const pdf = new jsPDF('p', 'mm', 'a4'); 
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      
      let currentY = drawPdfHeader(pdf, 'Barrel vs Fuel Tracker Report', logo);

      // --- Report Title & Meta ---
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 114, 198); // Sierra Leone Blue
      pdf.text('Barrel vs Fuel Price Analysis', margin, currentY);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139); // slate-500
      currentY += 8;
      pdf.text(\`Generated on: \${new Date().toLocaleString()}\`, margin, currentY);

      // Accent Line
      currentY += 6;
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.setLineWidth(0.5);
      pdf.line(margin, currentY, pageWidth - margin, currentY);

      // --- Analysis Parameters ---
      currentY += 12;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 114, 198); // Sierra Leone Blue
      pdf.text('Analysis Parameters', margin, currentY);
      
      currentY += 6;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(71, 85, 105);
      
      const filters = [
        \`Benchmark: \${BENCHMARK_LABELS[benchmark]}\`,
        \`Year: \${filterYear === 'all' ? 'All Years' : filterYear}\`,
        \`Month: \${filterMonth === 'all' ? 'All Months' : filterMonth}\`
      ];
      
      filters.forEach(filter => {
        pdf.text(\`• \${filter}\`, margin + 2, currentY);
        currentY += 5;
      });
      currentY += 5;

      // --- Chart ---
      if (chartRef.current && viewMode !== 'table') {
        const canvas = await toCanvas(chartRef.current, { backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        
        const chartWidth = pageWidth - (margin * 2);
        const chartHeight = (canvas.height * chartWidth) / canvas.width;
        
        if (currentY + chartHeight > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.addImage(imgData, 'PNG', margin, currentY, chartWidth, chartHeight);
        currentY += chartHeight + 15;
      }

      // --- Table Data ---
      if (filteredRecords.length > 0) {
        if (currentY > pageHeight - 40) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 114, 198);
        pdf.text('Historical Data', margin, currentY);
        currentY += 5;

        const tableBody = filteredRecords.map(rec => {
          let bValue = 0;
          if (benchmark === 'brentUSD') bValue = rec.brentUSD;
          else if (benchmark === 'wtiUSD') bValue = rec.wtiUSD;
          else if (benchmark === 'opecUSD') bValue = rec.opecUSD;
          else bValue = (rec.brentUSD + rec.wtiUSD + rec.opecUSD) / 3;

          return [
            rec.monthLabel,
            \`$\${bValue.toFixed(2)}\`,
            \`Le \${rec.petrolNLe.toFixed(2)}\`,
            \`Le \${rec.dieselNLe.toFixed(2)}\`,
            rec.notes || '-'
          ];
        });

        autoTable(pdf, {
          startY: currentY,
          head: [['Month', BENCHMARK_LABELS[benchmark], 'Petrol (NLe)', 'Diesel (NLe)', 'Notes']],
          body: tableBody,
          theme: 'striped',
          headStyles: {
            fillColor: [0, 114, 198],
            textColor: 255,
            fontStyle: 'bold',
          },
          styles: {
            fontSize: 9,
            cellPadding: 4,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
        });
      }

      // --- Footer ---
      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        const footerText = \`Page \${i} of \${pageCount} • Salone Fuel Monitor\`;
        pdf.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      pdf.save(\`Barrel_vs_Fuel_Report_\${new Date().toISOString().split('T')[0]}.pdf\`);

    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };
`;

if (!content.includes('handleExportPDF')) {
  content = content.replace(
    /const filteredRecords = React.useMemo\(\(\) => \{/g,
    handleExportPDF + '\n  const filteredRecords = React.useMemo(() => {'
  );
}

// Add button to header and update chartRef
if (!content.includes('chartRef')) {
  content = content.replace(
    /className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"/g,
    'ref={chartRef} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"'
  );
}

// Ensure the Export button is next to the "Back to Price Trends" button
if (!content.includes('handleExportPDF}')) {
  const buttonHtml = `
              <button
                onClick={handleExportPDF}
                disabled={isExporting || loading || filteredRecords.length === 0}
                className="flex items-center justify-center gap-2 bg-white text-[#005aa0] hover:bg-gray-50 px-5 py-2.5 rounded-2xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
              >
                {isExporting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#005aa0]" />
                ) : (
                  <Download className="w-4 h-4 text-[#005aa0]" />
                )}
                <span>Export Report</span>
              </button>
`;
  content = content.replace(
    /← Back to Price Trends\n              <\/Link>/g,
    '← Back to Price Trends\n              </Link>\n' + buttonHtml
  );
}

fs.writeFileSync('src/pages/BarrelVsFuel.tsx', content);
console.log('Successfully patched BarrelVsFuel.tsx with PDF export');
