import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// GET - Generate and return PDF report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'full';
    
    console.log('Generating PDF report...');
    
    // Gather all data for the report
    const animals = await db.animal.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    const healthRecords = await db.healthRecord.findMany({
      include: { animal: { select: { name: true, tagNumber: true, type: true } } },
      orderBy: { date: 'desc' },
      take: 50,
    });
    
    const breedingRecords = await db.breedingRecord.findMany({
      include: {
        male: { select: { name: true, tagNumber: true } },
        female: { select: { name: true, tagNumber: true } },
      },
      orderBy: { breedingDate: 'desc' },
      take: 50,
    });
    
    const expenses = await db.expense.findMany({ orderBy: { date: 'desc' }, take: 50 });
    const income = await db.income.findMany({ orderBy: { date: 'desc' }, take: 50 });
    
    // Calculate statistics
    const totalAnimals = animals.length;
    const totalGoats = animals.filter(a => a.type === 'goat').length;
    const totalPigs = animals.filter(a => a.type === 'pig').length;
    const totalWeight = animals.reduce((sum, a) => sum + a.weight, 0);
    const avgWeight = totalAnimals > 0 ? totalWeight / totalAnimals : 0;
    
    const healthyCount = animals.filter(a => a.status === 'healthy').length;
    const sickCount = animals.filter(a => a.status === 'sick').length;
    const pregnantCount = animals.filter(a => a.status === 'pregnant').length;
    
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const profit = totalIncome - totalExpenses;
    
    console.log('Data collected, creating PDF...');
    
    // Create PDF document
    const doc = new jsPDF();
    let yPos = 20;
    
    // Title
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, 220, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Livestock Farm Report', 20, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Complete Farm Management Report', 20, 30);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 38);
    
    yPos = 55;
    
    // Farm Overview Section
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Farm Overview', 20, yPos);
    
    yPos += 10;
    
    // Stats boxes
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(15, yPos, 45, 25, 3, 3, 'F');
    doc.roundedRect(65, yPos, 45, 25, 3, 3, 'F');
    doc.roundedRect(115, yPos, 45, 25, 3, 3, 'F');
    doc.roundedRect(165, yPos, 45, 25, 3, 3, 'F');
    
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(String(totalAnimals), 25, yPos + 10);
    doc.text(String(totalGoats), 75, yPos + 10);
    doc.text(String(totalPigs), 125, yPos + 10);
    doc.text(avgWeight.toFixed(1), 175, yPos + 10);
    
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Animals', 25, yPos + 18);
    doc.text('Goats', 75, yPos + 18);
    doc.text('Pigs', 125, yPos + 18);
    doc.text('Avg Weight (kg)', 175, yPos + 18);
    
    yPos += 35;
    
    // Health Status
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Health Status', 20, yPos);
    
    yPos += 8;
    
    doc.setFillColor(209, 250, 229);
    doc.roundedRect(15, yPos, 60, 12, 2, 2, 'F');
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(10);
    doc.text(`Healthy: ${healthyCount}`, 20, yPos + 8);
    
    doc.setFillColor(254, 226, 226);
    doc.roundedRect(80, yPos, 60, 12, 2, 2, 'F');
    doc.setTextColor(220, 38, 38);
    doc.text(`Sick: ${sickCount}`, 85, yPos + 8);
    
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(145, yPos, 60, 12, 2, 2, 'F');
    doc.setTextColor(217, 119, 6);
    doc.text(`Pregnant: ${pregnantCount}`, 150, yPos + 8);
    
    yPos += 22;
    
    // Financial Summary
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary', 20, yPos);
    
    yPos += 8;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Amount']],
      body: [
        ['Total Expenses', `Rs. ${totalExpenses.toLocaleString()}`],
        ['Total Income', `Rs. ${totalIncome.toLocaleString()}`],
        ['Net Profit/Loss', `Rs. ${Math.abs(profit).toLocaleString()} (${profit >= 0 ? 'Profit' : 'Loss'})`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 80, halign: 'right' },
      },
      margin: { left: 15 },
    });
    
    // Animals Table
    if (animals.length > 0) {
      doc.addPage();
      yPos = 20;
      
      doc.setTextColor(5, 150, 105);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Animals List', 20, yPos);
      
      yPos += 5;
      
      const animalData = animals.map(a => [
        a.tagNumber,
        a.name || '-',
        a.type.charAt(0).toUpperCase() + a.type.slice(1),
        a.breed,
        a.gender.charAt(0).toUpperCase() + a.gender.slice(1),
        `${a.weight} kg`,
        a.status.charAt(0).toUpperCase() + a.status.slice(1),
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Tag #', 'Name', 'Type', 'Breed', 'Gender', 'Weight', 'Status']],
        body: animalData,
        theme: 'grid',
        headStyles: { fillColor: [5, 150, 105], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 10, right: 10 },
        styles: { cellPadding: 2 },
      });
    }
    
    // Health Records
    if (healthRecords.length > 0) {
      doc.addPage();
      yPos = 20;
      
      doc.setTextColor(5, 150, 105);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Health Records', 20, yPos);
      
      yPos += 5;
      
      const healthData = healthRecords.map(h => [
        new Date(h.date).toLocaleDateString(),
        h.animal?.tagNumber || '-',
        h.type.charAt(0).toUpperCase() + h.type.slice(1),
        h.description.substring(0, 30),
        h.veterinarian || '-',
        h.cost ? `Rs. ${h.cost}` : '-',
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Animal', 'Type', 'Description', 'Vet', 'Cost']],
        body: healthData,
        theme: 'grid',
        headStyles: { fillColor: [5, 150, 105], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 10, right: 10 },
        styles: { cellPadding: 2 },
      });
    }
    
    // Breeding Records
    if (breedingRecords.length > 0) {
      doc.addPage();
      yPos = 20;
      
      doc.setTextColor(5, 150, 105);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Breeding Records', 20, yPos);
      
      yPos += 5;
      
      const breedingData = breedingRecords.map(b => [
        new Date(b.breedingDate).toLocaleDateString(),
        b.male?.tagNumber || '-',
        b.female?.tagNumber || '-',
        b.expectedBirth ? new Date(b.expectedBirth).toLocaleDateString() : '-',
        b.status.charAt(0).toUpperCase() + b.status.slice(1),
        b.offspringCount?.toString() || '-',
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Male', 'Female', 'Expected Birth', 'Status', 'Offspring']],
        body: breedingData,
        theme: 'grid',
        headStyles: { fillColor: [5, 150, 105], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 10, right: 10 },
        styles: { cellPadding: 2 },
      });
    }
    
    // Expenses
    if (expenses.length > 0) {
      doc.addPage();
      yPos = 20;
      
      doc.setTextColor(5, 150, 105);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Recent Expenses', 20, yPos);
      
      yPos += 5;
      
      const expenseData = expenses.map(e => [
        new Date(e.date).toLocaleDateString(),
        e.category.charAt(0).toUpperCase() + e.category.slice(1),
        e.description.substring(0, 40),
        `Rs. ${e.amount.toLocaleString()}`,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Category', 'Description', 'Amount']],
        body: expenseData,
        theme: 'grid',
        headStyles: { fillColor: [5, 150, 105], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 10, right: 10 },
        styles: { cellPadding: 2 },
      });
    }
    
    // Income
    if (income.length > 0) {
      doc.addPage();
      yPos = 20;
      
      doc.setTextColor(5, 150, 105);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Recent Income', 20, yPos);
      
      yPos += 5;
      
      const incomeData = income.map(i => [
        new Date(i.date).toLocaleDateString(),
        i.category.charAt(0).toUpperCase() + i.category.slice(1),
        i.description.substring(0, 40),
        `Rs. ${i.amount.toLocaleString()}`,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Category', 'Description', 'Amount']],
        body: incomeData,
        theme: 'grid',
        headStyles: { fillColor: [5, 150, 105], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 10, right: 10 },
        styles: { cellPadding: 2 },
      });
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('Generated by Livestock Farm Management System', 105, 295, { align: 'center' });
    }
    
    console.log('PDF created successfully');
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    const timestamp = new Date().toISOString().slice(0, 10);
    
    // Return the PDF as a downloadable file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="farm_report_${timestamp}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
    
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({ 
      error: 'Failed to generate report',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
