import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import PDFDocument from 'pdfkit';

// GET - Generate and return PDF report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'full';
    
    // Gather all data for the report
    const animals = await db.animal.findMany({
      include: {
        healthRecords: { orderBy: { date: 'desc' }, take: 5 },
      },
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
    
    const feedingRecords = await db.feedingRecord.findMany({
      include: { animal: { select: { name: true, tagNumber: true } } },
      orderBy: { date: 'desc' },
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
    
    // Create PDF document
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50,
      bufferPages: true 
    });
    
    // Collect PDF data in buffer
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    
    // Helper function to add text with color
    const addColoredText = (text: string, x: number, y: number, options: any = {}) => {
      doc.fontSize(options.size || 12)
         .fillColor(options.color || '#333333')
         .text(text, x, y, { width: 500, ...options });
    };
    
    // Helper to draw a table row
    const drawTableRow = (y: number, data: string[], widths: number[], isHeader = false) => {
      let x = 50;
      const rowHeight = 25;
      
      // Draw row background
      if (isHeader) {
        doc.fillColor('#059669').rect(x, y, 495, rowHeight).fill();
      } else {
        doc.fillColor('#ffffff').rect(x, y, 495, rowHeight).fill();
      }
      
      // Draw cell borders and text
      data.forEach((text, i) => {
        doc.strokeColor('#e5e7eb').lineWidth(0.5).rect(x, y, widths[i], rowHeight).stroke();
        
        if (isHeader) {
          doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold');
        } else {
          doc.fontSize(9).fillColor('#374151').font('Helvetica');
        }
        
        doc.text(text, x + 5, y + 7, { width: widths[i] - 10, ellipsis: true });
        x += widths[i];
      });
      
      return y + rowHeight;
    };
    
    // Title Page
    doc.fillColor('#059669').rect(0, 0, 595, 150).fill();
    
    doc.fontSize(28).fillColor('#ffffff').font('Helvetica-Bold')
       .text('Livestock Farm Report', 50, 50);
    
    doc.fontSize(14).fillColor('#d1fae5').font('Helvetica')
       .text('Complete Farm Management Report', 50, 90);
    
    doc.fontSize(11).fillColor('#d1fae5')
       .text(`Generated: ${new Date().toLocaleString()}`, 50, 115);
    
    // Statistics Section
    let y = 180;
    
    doc.fontSize(18).fillColor('#059669').font('Helvetica-Bold')
       .text('Farm Overview', 50, y);
    
    y += 35;
    
    // Stats boxes
    const stats = [
      { label: 'Total Animals', value: totalAnimals.toString(), color: '#059669' },
      { label: 'Goats', value: totalGoats.toString(), color: '#10b981' },
      { label: 'Pigs', value: totalPigs.toString(), color: '#f59e0b' },
      { label: 'Avg Weight', value: `${avgWeight.toFixed(1)} kg`, color: '#6366f1' },
    ];
    
    stats.forEach((stat, i) => {
      const x = 50 + (i * 125);
      doc.fillColor('#f9fafb').roundedRect(x, y, 115, 60, 8).fill();
      doc.fillColor(stat.color).fontSize(22).font('Helvetica-Bold').text(stat.value, x + 10, y + 10);
      doc.fillColor('#6b7280').fontSize(10).font('Helvetica').text(stat.label, x + 10, y + 40);
    });
    
    y += 90;
    
    // Health Status
    doc.fontSize(14).fillColor('#059669').font('Helvetica-Bold').text('Health Status', 50, y);
    y += 25;
    
    doc.fillColor('#d1fae5').rect(50, y, 150, 30).fill();
    doc.fillColor('#059669').fontSize(11).text(`Healthy: ${healthyCount}`, 60, y + 10);
    
    doc.fillColor('#fee2e2').rect(210, y, 150, 30).fill();
    doc.fillColor('#dc2626').fontSize(11).text(`Sick: ${sickCount}`, 220, y + 10);
    
    doc.fillColor('#fef3c7').rect(370, y, 150, 30).fill();
    doc.fillColor('#d97706').fontSize(11).text(`Pregnant: ${pregnantCount}`, 380, y + 10);
    
    y += 50;
    
    // Financial Summary
    doc.fontSize(18).fillColor('#059669').font('Helvetica-Bold').text('Financial Summary', 50, y);
    y += 35;
    
    doc.fillColor('#ffffff').rect(50, y, 495, 80).fill();
    doc.strokeColor('#e5e7eb').lineWidth(1).rect(50, y, 495, 80).stroke();
    
    doc.fontSize(12).fillColor('#6b7280').font('Helvetica').text('Total Expenses:', 70, y + 20);
    doc.fontSize(14).fillColor('#dc2626').font('Helvetica-Bold').text(`Rs. ${totalExpenses.toLocaleString()}`, 200, y + 20);
    
    doc.fontSize(12).fillColor('#6b7280').font('Helvetica').text('Total Income:', 70, y + 45);
    doc.fontSize(14).fillColor('#059669').font('Helvetica-Bold').text(`Rs. ${totalIncome.toLocaleString()}`, 200, y + 45);
    
    const profitColor = profit >= 0 ? '#059669' : '#dc2626';
    doc.fontSize(12).fillColor('#6b7280').font('Helvetica').text('Net Profit/Loss:', 320, y + 20);
    doc.fontSize(16).fillColor(profitColor).font('Helvetica-Bold').text(`Rs. ${Math.abs(profit).toLocaleString()}`, 420, y + 20);
    doc.fontSize(11).fillColor(profitColor).text(profit >= 0 ? '(Profit)' : '(Loss)', 420, y + 42);
    
    // Animals Table
    if (animals.length > 0) {
      doc.addPage();
      y = 50;
      
      doc.fontSize(18).fillColor('#059669').font('Helvetica-Bold').text('Animals List', 50, y);
      y += 30;
      
      const widths = [70, 80, 50, 100, 60, 60, 75];
      const headers = ['Tag #', 'Name', 'Type', 'Breed', 'Gender', 'Weight', 'Status'];
      
      y = drawTableRow(y, headers, widths, true);
      
      animals.slice(0, 25).forEach((animal) => {
        if (y > 750) {
          doc.addPage();
          y = 50;
          y = drawTableRow(y, headers, widths, true);
        }
        
        const status = animal.status.charAt(0).toUpperCase() + animal.status.slice(1);
        y = drawTableRow(y, [
          animal.tagNumber,
          animal.name || '-',
          animal.type.charAt(0).toUpperCase() + animal.type.slice(1),
          animal.breed,
          animal.gender.charAt(0).toUpperCase() + animal.gender.slice(1),
          `${animal.weight} kg`,
          status
        ], widths);
      });
    }
    
    // Health Records
    if (healthRecords.length > 0) {
      doc.addPage();
      y = 50;
      
      doc.fontSize(18).fillColor('#059669').font('Helvetica-Bold').text('Health Records', 50, y);
      y += 30;
      
      const widths = [80, 80, 80, 150, 105];
      const headers = ['Date', 'Animal', 'Type', 'Description', 'Veterinarian'];
      
      y = drawTableRow(y, headers, widths, true);
      
      healthRecords.slice(0, 25).forEach((record) => {
        if (y > 750) {
          doc.addPage();
          y = 50;
          y = drawTableRow(y, headers, widths, true);
        }
        
        y = drawTableRow(y, [
          new Date(record.date).toLocaleDateString(),
          record.animal?.tagNumber || '-',
          record.type.charAt(0).toUpperCase() + record.type.slice(1),
          record.description.substring(0, 40),
          record.veterinarian || '-'
        ], widths);
      });
    }
    
    // Breeding Records
    if (breedingRecords.length > 0) {
      doc.addPage();
      y = 50;
      
      doc.fontSize(18).fillColor('#059669').font('Helvetica-Bold').text('Breeding Records', 50, y);
      y += 30;
      
      const widths = [90, 90, 90, 90, 75, 60];
      const headers = ['Date', 'Male', 'Female', 'Expected Birth', 'Status', 'Offspring'];
      
      y = drawTableRow(y, headers, widths, true);
      
      breedingRecords.slice(0, 25).forEach((record) => {
        if (y > 750) {
          doc.addPage();
          y = 50;
          y = drawTableRow(y, headers, widths, true);
        }
        
        y = drawTableRow(y, [
          new Date(record.breedingDate).toLocaleDateString(),
          record.male?.tagNumber || '-',
          record.female?.tagNumber || '-',
          record.expectedBirth ? new Date(record.expectedBirth).toLocaleDateString() : '-',
          record.status.charAt(0).toUpperCase() + record.status.slice(1),
          record.offspringCount?.toString() || '-'
        ], widths);
      });
    }
    
    // Expenses Table
    if (expenses.length > 0) {
      doc.addPage();
      y = 50;
      
      doc.fontSize(18).fillColor('#059669').font('Helvetica-Bold').text('Recent Expenses', 50, y);
      y += 30;
      
      const widths = [90, 120, 200, 85];
      const headers = ['Date', 'Category', 'Description', 'Amount'];
      
      y = drawTableRow(y, headers, widths, true);
      
      expenses.slice(0, 30).forEach((expense) => {
        if (y > 750) {
          doc.addPage();
          y = 50;
          y = drawTableRow(y, headers, widths, true);
        }
        
        y = drawTableRow(y, [
          new Date(expense.date).toLocaleDateString(),
          expense.category.charAt(0).toUpperCase() + expense.category.slice(1),
          expense.description.substring(0, 50),
          `Rs. ${expense.amount.toLocaleString()}`
        ], widths);
      });
    }
    
    // Income Table
    if (income.length > 0) {
      doc.addPage();
      y = 50;
      
      doc.fontSize(18).fillColor('#059669').font('Helvetica-Bold').text('Recent Income', 50, y);
      y += 30;
      
      const widths = [90, 120, 200, 85];
      const headers = ['Date', 'Category', 'Description', 'Amount'];
      
      y = drawTableRow(y, headers, widths, true);
      
      income.slice(0, 30).forEach((inc) => {
        if (y > 750) {
          doc.addPage();
          y = 50;
          y = drawTableRow(y, headers, widths, true);
        }
        
        y = drawTableRow(y, [
          new Date(inc.date).toLocaleDateString(),
          inc.category.charAt(0).toUpperCase() + inc.category.slice(1),
          inc.description.substring(0, 50),
          `Rs. ${inc.amount.toLocaleString()}`
        ], widths);
      });
    }
    
    // Footer on all pages
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Page number
      doc.fontSize(9).fillColor('#9ca3af')
         .text(`Page ${i + 1} of ${pages.count}`, 50, 780, { align: 'center' });
      
      // Footer
      doc.fontSize(8).fillColor('#9ca3af')
         .text('Generated by Livestock Farm Management System', 50, 790, { align: 'center' });
    }
    
    // Finalize PDF
    doc.end();
    
    // Wait for PDF to be generated and convert to buffer
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
    
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
      details: error.message 
    }, { status: 500 });
  }
}
