#!/usr/bin/env python3
"""
Livestock Farm Management - PDF Report Generator
Generates comprehensive reports for the farm management system.
"""

import sys
import os
import sqlite3
from datetime import datetime, date
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    PageBreak, Image
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Register fonts
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/calibri-regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('Calibri', normal='Calibri', bold='Calibri')

# Color scheme
HEADER_COLOR = colors.HexColor('#1F4E79')
HEADER_TEXT = colors.white
ROW_EVEN = colors.white
ROW_ODD = colors.HexColor('#F5F5F5')
ACCENT_GREEN = colors.HexColor('#10b981')
ACCENT_AMBER = colors.HexColor('#f59e0b')
ACCENT_RED = colors.HexColor('#ef4444')

def get_db_path():
    """Get the database path"""
    return '/home/z/my-project/db/custom.db'

def get_farm_data():
    """Fetch all data from the database"""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    data = {}
    
    # Overview counts
    cursor.execute("SELECT COUNT(*) as count FROM Animal")
    data['total_animals'] = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM Animal WHERE type = 'goat'")
    data['total_goats'] = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM Animal WHERE type = 'pig'")
    data['total_pigs'] = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM Animal WHERE status = 'healthy'")
    data['healthy_count'] = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM Animal WHERE status = 'sick'")
    data['sick_count'] = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM Animal WHERE status = 'pregnant'")
    data['pregnant_count'] = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM Animal WHERE gender = 'male'")
    data['male_count'] = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM Animal WHERE gender = 'female'")
    data['female_count'] = cursor.fetchone()['count']
    
    # Weight statistics
    cursor.execute("SELECT AVG(weight) as avg, MIN(weight) as min, MAX(weight) as max, SUM(weight) as sum FROM Animal")
    row = cursor.fetchone()
    data['weight_avg'] = round(row['avg'], 1) if row['avg'] else 0
    data['weight_min'] = round(row['min'], 1) if row['min'] else 0
    data['weight_max'] = round(row['max'], 1) if row['max'] else 0
    data['weight_total'] = round(row['sum'], 1) if row['sum'] else 0
    
    cursor.execute("SELECT AVG(weight) as avg, SUM(weight) as sum FROM Animal WHERE type = 'goat'")
    row = cursor.fetchone()
    data['goat_weight_avg'] = round(row['avg'], 1) if row['avg'] else 0
    data['goat_weight_total'] = round(row['sum'], 1) if row['sum'] else 0
    
    cursor.execute("SELECT AVG(weight) as avg, SUM(weight) as sum FROM Animal WHERE type = 'pig'")
    row = cursor.fetchone()
    data['pig_weight_avg'] = round(row['avg'], 1) if row['avg'] else 0
    data['pig_weight_total'] = round(row['sum'], 1) if row['sum'] else 0
    
    # Financial data
    cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM Expense")
    data['total_expenses'] = cursor.fetchone()['total']
    
    cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM Income")
    data['total_income'] = cursor.fetchone()['total']
    
    data['profit'] = data['total_income'] - data['total_expenses']
    
    # Expense by category
    cursor.execute("SELECT category, SUM(amount) as total FROM Expense GROUP BY category ORDER BY total DESC")
    data['expenses_by_category'] = [dict(row) for row in cursor.fetchall()]
    
    # Income by category
    cursor.execute("SELECT category, SUM(amount) as total FROM Income GROUP BY category ORDER BY total DESC")
    data['income_by_category'] = [dict(row) for row in cursor.fetchall()]
    
    # Breed distribution
    cursor.execute("""
        SELECT type, breed, COUNT(*) as count 
        FROM Animal 
        GROUP BY type, breed 
        ORDER BY type, count DESC
    """)
    data['breed_distribution'] = [dict(row) for row in cursor.fetchall()]
    
    # Pen distribution
    cursor.execute("""
        SELECT penNumber, COUNT(*) as count 
        FROM Animal 
        WHERE penNumber IS NOT NULL
        GROUP BY penNumber 
        ORDER BY penNumber
    """)
    data['pen_distribution'] = [dict(row) for row in cursor.fetchall()]
    
    # Recent health records
    cursor.execute("""
        SELECT hr.date, hr.type, hr.description, hr.veterinarian, hr.cost,
               a.tagNumber, a.name, a.type
        FROM HealthRecord hr
        JOIN Animal a ON hr.animalId = a.id
        ORDER BY hr.date DESC
        LIMIT 20
    """)
    data['recent_health_records'] = [dict(row) for row in cursor.fetchall()]
    
    # Upcoming breedings
    cursor.execute("""
        SELECT br.breedingDate, br.expectedBirth, br.status,
               m.tagNumber as male_tag, m.name as male_name,
               f.tagNumber as female_tag, f.name as female_name
        FROM BreedingRecord br
        JOIN Animal m ON br.maleId = m.id
        JOIN Animal f ON br.femaleId = f.id
        WHERE br.expectedBirth >= date('now')
        ORDER BY br.expectedBirth ASC
        LIMIT 10
    """)
    data['upcoming_breedings'] = [dict(row) for row in cursor.fetchall()]
    
    # All animals for the detailed list
    cursor.execute("""
        SELECT tagNumber, name, type, breed, gender, weight, status, penNumber, purchasePrice
        FROM Animal
        ORDER BY type, tagNumber
    """)
    data['animals'] = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return data

def format_currency(amount):
    """Format number as Indian Rupees"""
    if amount is None:
        return '₹0'
    return f'₹{amount:,.0f}'

def format_date(date_str):
    """Format date string"""
    if not date_str:
        return 'N/A'
    try:
        # Handle integer timestamp
        if isinstance(date_str, (int, float)):
            dt = datetime.fromtimestamp(date_str / 1000 if date_str > 1000000000000 else date_str)
            return dt.strftime('%d %b %Y')
        # Handle ISO format string
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.strftime('%d %b %Y')
    except:
        return str(date_str)[:10] if len(str(date_str)) >= 10 else str(date_str)

def create_styles():
    """Create paragraph styles"""
    styles = getSampleStyleSheet()
    
    # Title style
    styles.add(ParagraphStyle(
        name='ReportTitle',
        fontName='Times New Roman',
        fontSize=28,
        leading=34,
        alignment=TA_CENTER,
        textColor=HEADER_COLOR,
        spaceAfter=12
    ))
    
    # Subtitle style
    styles.add(ParagraphStyle(
        name='ReportSubtitle',
        fontName='Times New Roman',
        fontSize=14,
        leading=18,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#666666'),
        spaceAfter=24
    ))
    
    # Section heading
    styles.add(ParagraphStyle(
        name='SectionHeading',
        fontName='Times New Roman',
        fontSize=16,
        leading=20,
        alignment=TA_LEFT,
        textColor=HEADER_COLOR,
        spaceBefore=18,
        spaceAfter=12
    ))
    
    # Subsection heading
    styles.add(ParagraphStyle(
        name='SubHeading',
        fontName='Times New Roman',
        fontSize=12,
        leading=16,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#333333'),
        spaceBefore=12,
        spaceAfter=8
    ))
    
    # Body text
    styles.add(ParagraphStyle(
        name='CustomBody',
        fontName='Times New Roman',
        fontSize=10,
        leading=14,
        alignment=TA_LEFT,
        textColor=colors.black
    ))
    
    # Table header
    styles.add(ParagraphStyle(
        name='TableHeader',
        fontName='Times New Roman',
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
        textColor=colors.white
    ))
    
    # Table cell
    styles.add(ParagraphStyle(
        name='TableCell',
        fontName='Times New Roman',
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
        textColor=colors.black
    ))
    
    # Table cell left
    styles.add(ParagraphStyle(
        name='TableCellLeft',
        fontName='Times New Roman',
        fontSize=9,
        leading=12,
        alignment=TA_LEFT,
        textColor=colors.black
    ))
    
    return styles

def create_cover_page(story, styles, data):
    """Create the cover page"""
    story.append(Spacer(1, 2*inch))
    
    # Title
    story.append(Paragraph("<b>INTEGRATED LIVESTOCK FARM</b>", styles['ReportTitle']))
    story.append(Paragraph("<b>Management Report</b>", styles['ReportTitle']))
    
    story.append(Spacer(1, 0.5*inch))
    
    # Subtitle
    story.append(Paragraph(
        f"Goat & Pig Farm Operations Overview",
        styles['ReportSubtitle']
    ))
    
    story.append(Spacer(1, 1*inch))
    
    # Quick stats box
    stats_data = [
        [Paragraph('<b>Total Animals</b>', styles['TableHeader']),
         Paragraph('<b>Goats</b>', styles['TableHeader']),
         Paragraph('<b>Pigs</b>', styles['TableHeader']),
         Paragraph('<b>Healthy</b>', styles['TableHeader'])],
        [Paragraph(str(data['total_animals']), styles['TableCell']),
         Paragraph(str(data['total_goats']), styles['TableCell']),
         Paragraph(str(data['total_pigs']), styles['TableCell']),
         Paragraph(str(data['healthy_count']), styles['TableCell'])]
    ]
    
    stats_table = Table(stats_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#E8F4EA')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(stats_table)
    
    story.append(Spacer(1, 1.5*inch))
    
    # Date
    story.append(Paragraph(
        f"<b>Report Generated:</b> {datetime.now().strftime('%d %B %Y at %H:%M')}",
        styles['CustomBody']
    ))
    
    story.append(PageBreak())

def create_overview_section(story, styles, data):
    """Create the overview section"""
    story.append(Paragraph("<b>1. Farm Overview</b>", styles['SectionHeading']))
    
    # Summary statistics table
    overview_data = [
        [Paragraph('<b>Metric</b>', styles['TableHeader']),
         Paragraph('<b>Value</b>', styles['TableHeader'])],
        [Paragraph('Total Animals', styles['TableCellLeft']),
         Paragraph(str(data['total_animals']), styles['TableCell'])],
        [Paragraph('Total Goats', styles['TableCellLeft']),
         Paragraph(str(data['total_goats']), styles['TableCell'])],
        [Paragraph('Total Pigs', styles['TableCellLeft']),
         Paragraph(str(data['total_pigs']), styles['TableCell'])],
        [Paragraph('Healthy Animals', styles['TableCellLeft']),
         Paragraph(str(data['healthy_count']), styles['TableCell'])],
        [Paragraph('Sick Animals', styles['TableCellLeft']),
         Paragraph(str(data['sick_count']), styles['TableCell'])],
        [Paragraph('Pregnant Animals', styles['TableCellLeft']),
         Paragraph(str(data['pregnant_count']), styles['TableCell'])],
        [Paragraph('Male Animals', styles['TableCellLeft']),
         Paragraph(str(data['male_count']), styles['TableCell'])],
        [Paragraph('Female Animals', styles['TableCellLeft']),
         Paragraph(str(data['female_count']), styles['TableCell'])],
    ]
    
    overview_table = Table(overview_data, colWidths=[3*inch, 2*inch])
    overview_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, 1), ROW_EVEN),
        ('BACKGROUND', (0, 2), (-1, 2), ROW_ODD),
        ('BACKGROUND', (0, 3), (-1, 3), ROW_EVEN),
        ('BACKGROUND', (0, 4), (-1, 4), ROW_ODD),
        ('BACKGROUND', (0, 5), (-1, 5), ROW_EVEN),
        ('BACKGROUND', (0, 6), (-1, 6), ROW_ODD),
        ('BACKGROUND', (0, 7), (-1, 7), ROW_EVEN),
        ('BACKGROUND', (0, 8), (-1, 8), ROW_ODD),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(overview_table)
    story.append(Spacer(1, 18))
    
    # Weight statistics
    story.append(Paragraph("<b>Weight Statistics</b>", styles['SubHeading']))
    
    weight_data = [
        [Paragraph('<b>Category</b>', styles['TableHeader']),
         Paragraph('<b>Avg (kg)</b>', styles['TableHeader']),
         Paragraph('<b>Total (kg)</b>', styles['TableHeader'])],
        [Paragraph('All Animals', styles['TableCellLeft']),
         Paragraph(str(data['weight_avg']), styles['TableCell']),
         Paragraph(str(data['weight_total']), styles['TableCell'])],
        [Paragraph('Goats', styles['TableCellLeft']),
         Paragraph(str(data['goat_weight_avg']), styles['TableCell']),
         Paragraph(str(data['goat_weight_total']), styles['TableCell'])],
        [Paragraph('Pigs', styles['TableCellLeft']),
         Paragraph(str(data['pig_weight_avg']), styles['TableCell']),
         Paragraph(str(data['pig_weight_total']), styles['TableCell'])],
    ]
    
    weight_table = Table(weight_data, colWidths=[2.5*inch, 1.25*inch, 1.25*inch])
    weight_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), ROW_EVEN),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(weight_table)
    story.append(Spacer(1, 18))

def create_breed_section(story, styles, data):
    """Create the breed distribution section"""
    story.append(Paragraph("<b>2. Breed Distribution</b>", styles['SectionHeading']))
    
    # Group by type
    goat_breeds = [b for b in data['breed_distribution'] if b['type'] == 'goat']
    pig_breeds = [b for b in data['breed_distribution'] if b['type'] == 'pig']
    
    # Goat breeds
    if goat_breeds:
        story.append(Paragraph("<b>Goat Breeds</b>", styles['SubHeading']))
        goat_data = [
            [Paragraph('<b>Breed</b>', styles['TableHeader']),
             Paragraph('<b>Count</b>', styles['TableHeader'])]
        ]
        for i, breed in enumerate(goat_breeds):
            goat_data.append([
                Paragraph(breed['breed'], styles['TableCellLeft']),
                Paragraph(str(breed['count']), styles['TableCell'])
            ])
        
        goat_table = Table(goat_data, colWidths=[3*inch, 2*inch])
        goat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), ACCENT_GREEN),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ] + [(f'BACKGROUND', (0, i+1), (-1, i+1), ROW_ODD if i % 2 else ROW_EVEN) for i in range(len(goat_breeds))]))
        story.append(goat_table)
        story.append(Spacer(1, 12))
    
    # Pig breeds
    if pig_breeds:
        story.append(Paragraph("<b>Pig Breeds</b>", styles['SubHeading']))
        pig_data = [
            [Paragraph('<b>Breed</b>', styles['TableHeader']),
             Paragraph('<b>Count</b>', styles['TableHeader'])]
        ]
        for i, breed in enumerate(pig_breeds):
            pig_data.append([
                Paragraph(breed['breed'], styles['TableCellLeft']),
                Paragraph(str(breed['count']), styles['TableCell'])
            ])
        
        pig_table = Table(pig_data, colWidths=[3*inch, 2*inch])
        pig_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), ACCENT_AMBER),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ] + [(f'BACKGROUND', (0, i+1), (-1, i+1), ROW_ODD if i % 2 else ROW_EVEN) for i in range(len(pig_breeds))]))
        story.append(pig_table)
        story.append(Spacer(1, 18))

def create_financial_section(story, styles, data):
    """Create the financial section"""
    story.append(Paragraph("<b>3. Financial Summary</b>", styles['SectionHeading']))
    
    # Financial overview
    fin_overview = [
        [Paragraph('<b>Category</b>', styles['TableHeader']),
         Paragraph('<b>Amount</b>', styles['TableHeader'])],
        [Paragraph('Total Income', styles['TableCellLeft']),
         Paragraph(format_currency(data['total_income']), styles['TableCell'])],
        [Paragraph('Total Expenses', styles['TableCellLeft']),
         Paragraph(format_currency(data['total_expenses']), styles['TableCell'])],
        [Paragraph('<b>Net Profit/Loss</b>', styles['TableCellLeft']),
         Paragraph(f"<b>{format_currency(data['profit'])}</b>", styles['TableCell'])],
    ]
    
    fin_table = Table(fin_overview, colWidths=[3*inch, 2*inch])
    fin_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#E8F4EA')),
        ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#FEEAEA')),
        ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#E3F2FD')),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(fin_table)
    story.append(Spacer(1, 12))
    
    # Expenses by category
    if data['expenses_by_category']:
        story.append(Paragraph("<b>Expenses by Category</b>", styles['SubHeading']))
        exp_data = [
            [Paragraph('<b>Category</b>', styles['TableHeader']),
             Paragraph('<b>Amount</b>', styles['TableHeader'])]
        ]
        for i, exp in enumerate(data['expenses_by_category']):
            exp_data.append([
                Paragraph(exp['category'].capitalize(), styles['TableCellLeft']),
                Paragraph(format_currency(exp['total']), styles['TableCell'])
            ])
        
        exp_table = Table(exp_data, colWidths=[3*inch, 2*inch])
        exp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), ACCENT_RED),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ] + [(f'BACKGROUND', (0, i+1), (-1, i+1), ROW_ODD if i % 2 else ROW_EVEN) for i in range(len(data['expenses_by_category']))]))
        story.append(exp_table)
        story.append(Spacer(1, 18))

def create_health_section(story, styles, data):
    """Create the health records section"""
    story.append(Paragraph("<b>4. Recent Health Records</b>", styles['SectionHeading']))
    
    if data['recent_health_records']:
        health_data = [
            [Paragraph('<b>Date</b>', styles['TableHeader']),
             Paragraph('<b>Animal</b>', styles['TableHeader']),
             Paragraph('<b>Type</b>', styles['TableHeader']),
             Paragraph('<b>Description</b>', styles['TableHeader']),
             Paragraph('<b>Cost</b>', styles['TableHeader'])]
        ]
        
        for i, record in enumerate(data['recent_health_records'][:15]):  # Limit to 15 records
            health_data.append([
                Paragraph(format_date(record['date']), styles['TableCell']),
                Paragraph(f"{record['tagNumber']} - {record['name'] or 'N/A'}", styles['TableCellLeft']),
                Paragraph(record['type'].capitalize(), styles['TableCell']),
                Paragraph(record['description'][:40] + '...' if len(record['description'] or '') > 40 else record['description'], styles['TableCellLeft']),
                Paragraph(format_currency(record['cost']), styles['TableCell'])
            ])
        
        health_table = Table(health_data, colWidths=[0.8*inch, 1.3*inch, 0.7*inch, 2*inch, 0.7*inch])
        health_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HEADER_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (2, 0), (2, -1), 'CENTER'),
            ('ALIGN', (4, 0), (4, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
        ] + [(f'BACKGROUND', (0, i+1), (-1, i+1), ROW_ODD if i % 2 else ROW_EVEN) for i in range(min(15, len(data['recent_health_records'])))]))
        story.append(health_table)
    else:
        story.append(Paragraph("No health records found.", styles['CustomBody']))
    
    story.append(Spacer(1, 18))

def create_breeding_section(story, styles, data):
    """Create the breeding section"""
    story.append(Paragraph("<b>5. Upcoming Births</b>", styles['SectionHeading']))
    
    if data['upcoming_breedings']:
        breeding_data = [
            [Paragraph('<b>Female</b>', styles['TableHeader']),
             Paragraph('<b>Male</b>', styles['TableHeader']),
             Paragraph('<b>Bred Date</b>', styles['TableHeader']),
             Paragraph('<b>Expected</b>', styles['TableHeader']),
             Paragraph('<b>Status</b>', styles['TableHeader'])]
        ]
        
        for i, record in enumerate(data['upcoming_breedings']):
            breeding_data.append([
                Paragraph(f"{record['female_tag']} - {record['female_name'] or 'N/A'}", styles['TableCellLeft']),
                Paragraph(f"{record['male_tag']} - {record['male_name'] or 'N/A'}", styles['TableCellLeft']),
                Paragraph(format_date(record['breedingDate']), styles['TableCell']),
                Paragraph(format_date(record['expectedBirth']), styles['TableCell']),
                Paragraph(record['status'].capitalize(), styles['TableCell'])
            ])
        
        breeding_table = Table(breeding_data, colWidths=[1.3*inch, 1.3*inch, 1*inch, 1*inch, 0.8*inch])
        breeding_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EC4899')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ] + [(f'BACKGROUND', (0, i+1), (-1, i+1), ROW_ODD if i % 2 else ROW_EVEN) for i in range(len(data['upcoming_breedings']))]))
        story.append(breeding_table)
    else:
        story.append(Paragraph("No upcoming births scheduled.", styles['CustomBody']))
    
    story.append(Spacer(1, 18))

def create_animal_list_section(story, styles, data):
    """Create the animal list section"""
    story.append(PageBreak())
    story.append(Paragraph("<b>6. Complete Animal Inventory</b>", styles['SectionHeading']))
    
    # Split into goats and pigs
    goats = [a for a in data['animals'] if a['type'] == 'goat']
    pigs = [a for a in data['animals'] if a['type'] == 'pig']
    
    # Goats list
    story.append(Paragraph(f"<b>Goats ({len(goats)} animals)</b>", styles['SubHeading']))
    
    goat_header = [
        [Paragraph('<b>Tag #</b>', styles['TableHeader']),
         Paragraph('<b>Name</b>', styles['TableHeader']),
         Paragraph('<b>Breed</b>', styles['TableHeader']),
         Paragraph('<b>Gender</b>', styles['TableHeader']),
         Paragraph('<b>Weight</b>', styles['TableHeader']),
         Paragraph('<b>Status</b>', styles['TableHeader']),
         Paragraph('<b>Pen</b>', styles['TableHeader'])]
    ]
    
    goat_rows = []
    for i, animal in enumerate(goats):
        goat_rows.append([
            Paragraph(animal['tagNumber'], styles['TableCell']),
            Paragraph(animal['name'] or '-', styles['TableCellLeft']),
            Paragraph(animal['breed'], styles['TableCellLeft']),
            Paragraph(animal['gender'].capitalize(), styles['TableCell']),
            Paragraph(f"{animal['weight']} kg", styles['TableCell']),
            Paragraph(animal['status'].capitalize(), styles['TableCell']),
            Paragraph(animal['penNumber'] or '-', styles['TableCell'])
        ])
    
    if goat_rows:
        goat_table = Table(goat_header + goat_rows, colWidths=[0.9*inch, 1*inch, 0.9*inch, 0.7*inch, 0.7*inch, 0.7*inch, 0.5*inch])
        goat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), ACCENT_GREEN),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (3, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('FONTSIZE', (0, 0), (-1, -1), 7),
        ] + [(f'BACKGROUND', (0, i+1), (-1, i+1), ROW_ODD if i % 2 else ROW_EVEN) for i in range(len(goat_rows))]))
        story.append(goat_table)
    
    story.append(Spacer(1, 18))
    
    # Pigs list
    story.append(Paragraph(f"<b>Pigs ({len(pigs)} animals)</b>", styles['SubHeading']))
    
    pig_header = [
        [Paragraph('<b>Tag #</b>', styles['TableHeader']),
         Paragraph('<b>Name</b>', styles['TableHeader']),
         Paragraph('<b>Breed</b>', styles['TableHeader']),
         Paragraph('<b>Gender</b>', styles['TableHeader']),
         Paragraph('<b>Weight</b>', styles['TableHeader']),
         Paragraph('<b>Status</b>', styles['TableHeader']),
         Paragraph('<b>Pen</b>', styles['TableHeader'])]
    ]
    
    pig_rows = []
    for i, animal in enumerate(pigs):
        pig_rows.append([
            Paragraph(animal['tagNumber'], styles['TableCell']),
            Paragraph(animal['name'] or '-', styles['TableCellLeft']),
            Paragraph(animal['breed'], styles['TableCellLeft']),
            Paragraph(animal['gender'].capitalize(), styles['TableCell']),
            Paragraph(f"{animal['weight']} kg", styles['TableCell']),
            Paragraph(animal['status'].capitalize(), styles['TableCell']),
            Paragraph(animal['penNumber'] or '-', styles['TableCell'])
        ])
    
    if pig_rows:
        pig_table = Table(pig_header + pig_rows, colWidths=[0.9*inch, 1*inch, 0.9*inch, 0.7*inch, 0.7*inch, 0.7*inch, 0.5*inch])
        pig_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), ACCENT_AMBER),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (3, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('FONTSIZE', (0, 0), (-1, -1), 7),
        ] + [(f'BACKGROUND', (0, i+1), (-1, i+1), ROW_ODD if i % 2 else ROW_EVEN) for i in range(len(pig_rows))]))
        story.append(pig_table)

def generate_report(output_path, report_type='full'):
    """Main function to generate the PDF report"""
    # Get data
    data = get_farm_data()
    
    # Create document
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        title='Livestock Farm Report',
        author='Z.ai',
        creator='Z.ai',
        subject='Integrated Livestock Farm Management Report',
        leftMargin=0.75*inch,
        rightMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )
    
    # Create styles
    styles = create_styles()
    
    # Build story
    story = []
    
    # Cover page
    create_cover_page(story, styles, data)
    
    # Overview section
    create_overview_section(story, styles, data)
    
    # Breed distribution
    create_breed_section(story, styles, data)
    
    # Financial summary
    create_financial_section(story, styles, data)
    
    # Health records
    create_health_section(story, styles, data)
    
    # Breeding section
    create_breeding_section(story, styles, data)
    
    # Complete animal inventory
    create_animal_list_section(story, styles, data)
    
    # Build PDF
    doc.build(story)
    
    print(f"Report generated: {output_path}")
    return output_path

if __name__ == '__main__':
    if len(sys.argv) < 2:
        output = '/home/z/my-project/download/farm_report.pdf'
    else:
        output = sys.argv[1]
    
    report_type = sys.argv[2] if len(sys.argv) > 2 else 'full'
    
    os.makedirs(os.path.dirname(output), exist_ok=True)
    generate_report(output, report_type)
