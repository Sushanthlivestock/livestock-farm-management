import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Generate and return report data
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
    
    // Generate HTML report
    const html = generateHTMLReport({
      reportType,
      generatedAt: new Date().toLocaleString(),
      stats: { totalAnimals, totalGoats, totalPigs, totalWeight, avgWeight, healthyCount, sickCount, pregnantCount, totalExpenses, totalIncome, profit },
      animals,
      healthRecords,
      breedingRecords,
      feedingRecords,
      expenses,
      income,
    });
    
    // Return HTML that can be printed to PDF
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
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

function generateHTMLReport(data: any) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Farm Report - ${data.generatedAt}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f8fafc; color: #1e293b; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #059669; }
    .header h1 { color: #059669; font-size: 28px; margin-bottom: 10px; }
    .header p { color: #64748b; font-size: 14px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
    .stat-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
    .stat-card h3 { font-size: 32px; color: #059669; margin-bottom: 5px; }
    .stat-card p { color: #64748b; font-size: 13px; }
    .section { background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .section h2 { color: #1e293b; font-size: 18px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #059669; color: white; padding: 12px 10px; text-align: left; font-weight: 600; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .profit { color: #059669; font-weight: bold; }
    .loss { color: #dc2626; font-weight: bold; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-healthy { background: #d1fae5; color: #059669; }
    .badge-sick { background: #fee2e2; color: #dc2626; }
    .badge-pregnant { background: #fef3c7; color: #d97706; }
    .print-btn { position: fixed; top: 20px; right: 20px; background: #059669; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; }
    .print-btn:hover { background: #047857; }
    @media print {
      .print-btn { display: none; }
      body { padding: 20px; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
  
  <div class="header">
    <h1>🐄 Integrated Livestock Farm Report</h1>
    <p>Generated on: ${data.generatedAt} | Report Type: ${data.reportType.toUpperCase()}</p>
  </div>
  
  <div class="stats-grid">
    <div class="stat-card">
      <h3>${data.stats.totalAnimals}</h3>
      <p>Total Animals</p>
    </div>
    <div class="stat-card">
      <h3>${data.stats.totalGoats}</h3>
      <p>Goats</p>
    </div>
    <div class="stat-card">
      <h3>${data.stats.totalPigs}</h3>
      <p>Pigs</p>
    </div>
    <div class="stat-card">
      <h3>${data.stats.avgWeight.toFixed(1)} kg</h3>
      <p>Avg Weight</p>
    </div>
  </div>
  
  <div class="stats-grid">
    <div class="stat-card">
      <h3>${data.stats.healthyCount}</h3>
      <p>Healthy</p>
    </div>
    <div class="stat-card">
      <h3>${data.stats.sickCount}</h3>
      <p>Sick</p>
    </div>
    <div class="stat-card">
      <h3>${data.stats.pregnantCount}</h3>
      <p>Pregnant</p>
    </div>
    <div class="stat-card">
      <h3 class="${data.stats.profit >= 0 ? 'profit' : 'loss'}">₹${data.stats.profit.toLocaleString()}</h3>
      <p>${data.stats.profit >= 0 ? 'Profit' : 'Loss'}</p>
    </div>
  </div>
  
  ${data.animals.length > 0 ? `
  <div class="section">
    <h2>🐐 Animals (${data.animals.length})</h2>
    <table>
      <thead>
        <tr>
          <th>Tag #</th>
          <th>Name</th>
          <th>Type</th>
          <th>Breed</th>
          <th>Gender</th>
          <th>Weight</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.animals.map((a: any) => `
          <tr>
            <td>${a.tagNumber}</td>
            <td>${a.name || '-'}</td>
            <td>${a.type}</td>
            <td>${a.breed}</td>
            <td>${a.gender}</td>
            <td>${a.weight} kg</td>
            <td><span class="badge badge-${a.status}">${a.status}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}
  
  ${data.healthRecords.length > 0 ? `
  <div class="section">
    <h2>💉 Health Records (${data.healthRecords.length})</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Animal</th>
          <th>Type</th>
          <th>Description</th>
          <th>Veterinarian</th>
          <th>Cost</th>
        </tr>
      </thead>
      <tbody>
        ${data.healthRecords.map((h: any) => `
          <tr>
            <td>${new Date(h.date).toLocaleDateString()}</td>
            <td>${h.animal?.tagNumber || '-'}</td>
            <td>${h.type}</td>
            <td>${h.description}</td>
            <td>${h.veterinarian || '-'}</td>
            <td>${h.cost ? '₹' + h.cost : '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}
  
  ${data.breedingRecords.length > 0 ? `
  <div class="section">
    <h2>🐣 Breeding Records (${data.breedingRecords.length})</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Male</th>
          <th>Female</th>
          <th>Expected Birth</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.breedingRecords.map((b: any) => `
          <tr>
            <td>${new Date(b.breedingDate).toLocaleDateString()}</td>
            <td>${b.male?.tagNumber || '-'}</td>
            <td>${b.female?.tagNumber || '-'}</td>
            <td>${b.expectedBirth ? new Date(b.expectedBirth).toLocaleDateString() : '-'}</td>
            <td><span class="badge badge-${b.status === 'completed' ? 'healthy' : b.status === 'failed' ? 'sick' : 'pregnant'}">${b.status}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}
  
  <div class="section">
    <h2>💰 Financial Summary</h2>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Total Expenses</strong></td>
          <td class="loss">₹${data.stats.totalExpenses.toLocaleString()}</td>
        </tr>
        <tr>
          <td><strong>Total Income</strong></td>
          <td class="profit">₹${data.stats.totalIncome.toLocaleString()}</td>
        </tr>
        <tr style="background: #f0fdf4;">
          <td><strong>Net ${data.stats.profit >= 0 ? 'Profit' : 'Loss'}</strong></td>
          <td><strong class="${data.stats.profit >= 0 ? 'profit' : 'loss'}">₹${Math.abs(data.stats.profit).toLocaleString()}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>
  
  ${data.expenses.length > 0 ? `
  <div class="section">
    <h2>📤 Recent Expenses (${data.expenses.length})</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Category</th>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${data.expenses.map((e: any) => `
          <tr>
            <td>${new Date(e.date).toLocaleDateString()}</td>
            <td>${e.category}</td>
            <td>${e.description}</td>
            <td>₹${e.amount.toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}
  
  ${data.income.length > 0 ? `
  <div class="section">
    <h2>📥 Recent Income (${data.income.length})</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Category</th>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${data.income.map((i: any) => `
          <tr>
            <td>${new Date(i.date).toLocaleDateString()}</td>
            <td>${i.category}</td>
            <td>${i.description}</td>
            <td>₹${i.amount.toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}
  
  <div class="section" style="text-align: center; color: #64748b;">
    <p>This report was automatically generated by the Livestock Farm Management System</p>
    <p style="margin-top: 10px; font-size: 12px;">© ${new Date().getFullYear()} Integrated Livestock Farm</p>
  </div>
</body>
</html>`;
}
