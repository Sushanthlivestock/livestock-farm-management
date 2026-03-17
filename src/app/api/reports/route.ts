import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, access } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'full';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `farm_report_${timestamp}.pdf`;
    const outputPath = path.join('/home/z/my-project/download', filename);

    // Run the Python script to generate the PDF
    const scriptPath = '/home/z/my-project/scripts/generate_report.py';
    
    try {
      await access(scriptPath);
    } catch {
      return NextResponse.json({ error: 'Report script not found' }, { status: 500 });
    }

    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" "${outputPath}" "${reportType}"`, {
      timeout: 60000,
    });

    if (stderr && !stderr.includes('Report generated')) {
      console.error('Report generation stderr:', stderr);
    }

    // Read the generated PDF
    try {
      const pdfBuffer = await readFile(outputPath);
      
      // Return the PDF as a downloadable file
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    } catch (readError) {
      console.error('Error reading PDF:', readError);
      return NextResponse.json({ error: 'Failed to read generated report' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ 
      error: 'Failed to generate report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
