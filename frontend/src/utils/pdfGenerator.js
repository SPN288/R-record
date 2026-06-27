import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePDFReport = (renters) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;

  // Helpers for page numbering and footers
  const addHeaderAndFooter = (doc, pageNum, totalPages) => {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    
    // Header
    doc.text('SPN Rent Management - Admin System Report', margin, 10);
    doc.line(margin, 12, pageWidth - margin, 12);
    
    // Footer
    const footerText = `Page ${pageNum} of ${totalPages}`;
    doc.text(footerText, pageWidth - margin - 20, pageHeight - 10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, pageHeight - 10);
  };

  // 1. COVER PAGE / SUMMARY HEADER
  // Document Header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(16, 185, 129); // primary color (Emerald)
  doc.text('SPN Rent Management Report', margin, 25);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Report Scope: All active renters and historical billing statements`, margin, 31);
  
  // Draw separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 35, pageWidth - margin, 35);

  // Global Statistics Calculations
  const totalRenters = renters.length;
  let totalRevenueCollected = 0;
  let totalOutstandingDues = 0;
  let totalElectricityUsage = 0;

  renters.forEach(renter => {
    if (renter.bills && renter.bills.length > 0) {
      renter.bills.forEach(bill => {
        totalRevenueCollected += bill.amountPaid;
        totalOutstandingDues += bill.balance;
        totalElectricityUsage += (bill.currentReading - bill.lastReading);
      });
    }
  });

  // Render Stats Grid
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, 40, pageWidth - (margin * 2), 30, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, 40, pageWidth - (margin * 2), 30, 'D');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL RENTERS', margin + 5, 47);
  doc.text('REVENUE COLLECTED', margin + 45, 47);
  doc.text('OUTSTANDING BALANCE', margin + 95, 47);
  doc.text('POWER DISPATCHED', margin + 145, 47);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalRenters}`, margin + 5, 57);
  doc.setTextColor(16, 185, 129); // green for revenue
  doc.text(`$${totalRevenueCollected.toFixed(2)}`, margin + 45, 57);
  doc.setTextColor(239, 68, 68); // red for dues
  doc.text(`$${totalOutstandingDues.toFixed(2)}`, margin + 95, 57);
  doc.setTextColor(6, 182, 212); // blue for electric
  doc.text(`${totalElectricityUsage.toFixed(1)} units`, margin + 145, 57);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Active in system', margin + 5, 65);
  doc.text('Total payments received', margin + 45, 65);
  doc.text('Total pending amount', margin + 95, 65);
  doc.text('Aggregate meter consumption', margin + 145, 65);

  let currentY = 80;

  // 2. RENTERS PROFILE & HISTORY SECTIONS
  renters.forEach((renter, index) => {
    // Add page break if necessary
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 25;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`${index + 1}. ${renter.name}`, margin, currentY);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Contact: ${renter.contactNumber}  |  Base Rent: $${renter.baseRent}/mo  |  Electricity Rate: $${renter.electricityRate}/unit`, margin, currentY + 5);

    // Calculate renter's outstanding dues
    const outstanding = renter.bills ? renter.bills.reduce((sum, b) => sum + b.balance, 0) : 0;
    doc.setFont('Helvetica', 'bold');
    if (outstanding > 0) {
      doc.setTextColor(239, 68, 68);
      doc.text(`Outstanding Balance: $${outstanding.toFixed(2)}`, pageWidth - margin - 60, currentY);
    } else {
      doc.setTextColor(16, 185, 129);
      doc.text(`Outstanding Balance: $0.00 (Fully Paid)`, pageWidth - margin - 65, currentY);
    }

    currentY += 10;

    // Billing Table
    const tableHeaders = [['Month', 'Meter Readings', 'Elec Bill', 'Rent Due', 'Total Due', 'Paid Amount', 'Balance']];
    const tableRows = renter.bills && renter.bills.length > 0
      ? [...renter.bills].sort((a, b) => (Date.parse(a.month) || 0) - (Date.parse(b.month) || 0)).map(bill => {
          const units = bill.currentReading - bill.lastReading;
          return [
            bill.month,
            `${bill.lastReading} to ${bill.currentReading} (${units.toFixed(1)} units)`,
            `$${bill.electricityBillDue.toFixed(2)}`,
            `$${bill.rentDue.toFixed(2)}`,
            `$${bill.totalDue.toFixed(2)}`,
            `$${bill.amountPaid.toFixed(2)}`,
            { content: `$${bill.balance.toFixed(2)}`, style: { textColor: bill.balance > 0 ? [239, 68, 68] : [15, 23, 42], fontStyle: bill.balance > 0 ? 'bold' : 'normal' } }
          ];
        })
      : [];

    if (tableRows.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: tableHeaders,
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
        styles: { overflow: 'linebreak', cellPadding: 1.5 },
        columnStyles: {
          1: { cellWidth: 45 }, // Expand Meter readings column
        },
        didDrawPage: (data) => {
          // Adjust currentY to table bottom
          currentY = data.cursor.y + 12;
        }
      });
      // Set currentY to the end of the table
      currentY = doc.lastAutoTable.finalY + 12;
    } else {
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('No billing periods or payments recorded for this renter.', margin, currentY);
      currentY += 10;
    }

    // Divider line between renters
    if (index < renters.length - 1) {
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, currentY - 5, pageWidth - margin, currentY - 5);
    }
  });

  // 3. PAGE NUMBERING INSERTS
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderAndFooter(doc, i, totalPages);
  }

  // Save the report
  const cleanDate = new Date().toISOString().split('T')[0];
  doc.save(`SPN_Rent_Report_${cleanDate}.pdf`);
};
