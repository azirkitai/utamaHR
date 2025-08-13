#!/usr/bin/env python3
"""
Manual PDF Payslip Generator using ReportLab
Generates A4 portrait payslips with exact layout matching reference format
"""

import sys
import json
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from io import BytesIO

class PayslipPDFGenerator:
    def __init__(self):
        # A4 dimensions: 210mm x 297mm
        self.pagesize = A4
        self.width = A4[0]
        self.height = A4[1]
        
        # Margins as requested: 10mm left/right, 12mm top/bottom
        self.left_margin = 10 * mm
        self.right_margin = 10 * mm
        self.top_margin = 12 * mm
        self.bottom_margin = 12 * mm
        
        # Content area
        self.content_width = self.width - self.left_margin - self.right_margin
        self.content_height = self.height - self.top_margin - self.bottom_margin
        
    def generate_payslip(self, data_json, output_path):
        """Generate PDF payslip from JSON data"""
        try:
            data = json.loads(data_json) if isinstance(data_json, str) else data_json
            
            # Create PDF document
            doc = SimpleDocTemplate(
                output_path,
                pagesize=self.pagesize,
                leftMargin=self.left_margin,
                rightMargin=self.right_margin,
                topMargin=self.top_margin,
                bottomMargin=self.bottom_margin
            )
            
            # Build content elements
            elements = []
            
            # Add CONFIDENTIAL header
            confidential_style = ParagraphStyle(
                'Confidential',
                parent=getSampleStyleSheet()['Normal'],
                fontName='Helvetica',
                fontSize=8,
                alignment=TA_RIGHT,
                spaceAfter=6
            )
            elements.append(Paragraph("STRICTLY PRIVATE & CONFIDENTIAL", confidential_style))
            
            # Company header section
            elements.extend(self._build_company_header(data))
            elements.append(Spacer(1, 15))
            
            # Employee details section
            elements.extend(self._build_employee_details(data))
            elements.append(Spacer(1, 15))
            
            # Income vs Deduction section (side by side)
            elements.extend(self._build_income_deduction_section(data))
            elements.append(Spacer(1, 15))
            
            # Net Pay section
            elements.extend(self._build_net_pay_section(data))
            elements.append(Spacer(1, 15))
            
            # Employer Contribution section
            elements.extend(self._build_employer_contribution_section(data))
            elements.append(Spacer(1, 15))
            
            # YTD Summary section
            elements.extend(self._build_ytd_summary_section(data))
            elements.append(Spacer(1, 20))
            
            # Footer
            elements.extend(self._build_footer())
            
            # Build PDF
            doc.build(elements)
            return True
            
        except Exception as e:
            print(f"Error generating PDF: {str(e)}", file=sys.stderr)
            return False
    
    def _build_company_header(self, data):
        """Build company header with logo and details"""
        elements = []
        
        # Company header table (logo + info)
        company_data = [
            ["", data['company']['name']],
            ["", data['company']['regNo']],
            ["", data['company']['address']]
        ]
        
        company_table = Table(company_data, colWidths=[60, self.content_width - 60])
        company_table.setStyle(TableStyle([
            ('FONTNAME', (1, 0), (1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (1, 0), (1, 0), 12),
            ('FONTNAME', (1, 1), (1, 2), 'Helvetica'),
            ('FONTSIZE', (1, 1), (1, 2), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        
        elements.append(company_table)
        return elements
    
    def _build_employee_details(self, data):
        """Build employee information section"""
        elements = []
        
        # Employee details in two columns
        emp_data = [
            ["NAME:", data['employee']['name'], "MONTH:", data['period']['month']],
            ["", "", "YEAR:", str(data['period']['year'])],
            ["I/C NO.:", data['employee'].get('icNo', 'N/A'), "", ""],
            ["POSITION:", data['employee']['position'], "", ""]
        ]
        
        emp_table = Table(emp_data, colWidths=[70, 140, 70, 80])
        emp_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),  # Labels bold
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),  # Labels bold
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        
        elements.append(emp_table)
        return elements
    
    def _build_income_deduction_section(self, data):
        """Build income and deduction sections side by side"""
        elements = []
        
        # Income section data
        income_data = [
            ["INCOME", ""],
            ["", ""],
            ["Basic Salary", f"RM {data['income']['basic']}"]
        ]
        
        # Add additional income items if any
        for item in data['income']['items']:
            if item.get('show', False) and float(item['amount'].replace(',', '')) > 0:
                income_data.append([item['label'], f"RM {item['amount']}"])
        
        income_data.append(["", ""])
        income_data.append(["TOTAL GROSS", f"RM {data['income']['totalGross']}"])
        
        # Deduction section data
        deduction_data = [
            ["DEDUCTION", ""],
            ["", ""],
            ["EPF Employee", f"RM {data['deduction']['epfEmp']}"],
            ["", ""],
            ["SOCSO Employee", f"RM {data['deduction']['socsoEmp']}"],
            ["", ""],
            ["EIS Employee", f"RM {data['deduction']['eisEmp']}"]
        ]
        
        # Add additional deduction items if any
        for item in data['deduction']['items']:
            if item.get('show', False) and float(item['amount'].replace(',', '')) > 0:
                deduction_data.append([item['label'], f"RM {item['amount']}"])
        
        deduction_data.append(["", ""])
        deduction_data.append(["TOTAL DEDUCTION", f"RM {data['deduction']['total']}"])
        
        # Create side-by-side table
        max_rows = max(len(income_data), len(deduction_data))
        
        # Pad shorter section with empty rows
        while len(income_data) < max_rows:
            income_data.append(["", ""])
        while len(deduction_data) < max_rows:
            deduction_data.append(["", ""])
        
        # Combine into single table
        combined_data = []
        for i in range(max_rows):
            combined_data.append([
                income_data[i][0], income_data[i][1],
                deduction_data[i][0], deduction_data[i][1]
            ])
        
        combined_table = Table(combined_data, colWidths=[120, 70, 120, 70])
        combined_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),  # INCOME header
            ('FONTNAME', (2, 0), (2, 0), 'Helvetica-Bold'),  # DEDUCTION header
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),  # Income amounts right align
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),  # Deduction amounts right align
            ('FONTNAME', (0, -1), (1, -1), 'Helvetica-Bold'),  # TOTAL GROSS bold
            ('FONTNAME', (2, -1), (3, -1), 'Helvetica-Bold'),  # TOTAL DEDUCTION bold
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        
        elements.append(combined_table)
        return elements
    
    def _build_net_pay_section(self, data):
        """Build NET PAY section"""
        elements = []
        
        net_pay_data = [
            ["NET PAY", f"RM {data['netIncome']}"]
        ]
        
        net_pay_table = Table(net_pay_data, colWidths=[self.content_width - 100, 100])
        net_pay_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(net_pay_table)
        return elements
    
    def _build_employer_contribution_section(self, data):
        """Build EMPLOYER CONTRIBUTION section"""
        elements = []
        
        # Header
        header_style = ParagraphStyle(
            'EmployerContribHeader',
            parent=getSampleStyleSheet()['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            spaceAfter=8
        )
        elements.append(Paragraph("EMPLOYER CONTRIBUTION", header_style))
        
        # Three columns for employer contributions
        contrib_data = [
            ["EPF EMPLOYER", "SOCSO EMPLOYER", "EIS EMPLOYER"],
            [f"RM {data['employerContrib']['epfEr']}", 
             f"RM {data['employerContrib']['socsoEr']}", 
             f"RM {data['employerContrib']['eisEr']}"]
        ]
        
        contrib_table = Table(contrib_data, colWidths=[self.content_width/3] * 3)
        contrib_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        
        elements.append(contrib_table)
        return elements
    
    def _build_ytd_summary_section(self, data):
        """Build YEAR TO DATE SUMMARY section"""
        elements = []
        
        # Header
        header_style = ParagraphStyle(
            'YTDHeader',
            parent=getSampleStyleSheet()['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            spaceAfter=8
        )
        elements.append(Paragraph("YEAR TO DATE SUMMARY", header_style))
        
        # Two columns for YTD
        ytd_data = [
            ["EMPLOYEE CONTRIBUTION YTD", "EMPLOYER CONTRIBUTION YTD"],
            ["", ""],
            [f"EPF Employee               RM {data['ytd']['breakdown']['epfEmployee']}", 
             f"EPF Employer                   RM {data['ytd']['breakdown']['epfEmployer']}"],
            ["", ""],
            [f"SOCSO Employee              RM {data['ytd']['breakdown']['socsoEmployee']}", 
             f"SOCSO Employer                 RM {data['ytd']['breakdown']['socsoEmployer']}"],
            ["", ""],
            [f"EIS Employee                 RM {data['ytd']['breakdown']['eisEmployee']}", 
             f"EIS Employer                    RM {data['ytd']['breakdown']['eisEmployer']}"],
            ["", ""],
            [f"PCB/MTD                      RM {data['ytd']['breakdown']['pcb']}", ""]
        ]
        
        ytd_table = Table(ytd_data, colWidths=[self.content_width/2] * 2)
        ytd_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        
        elements.append(ytd_table)
        return elements
    
    def _build_footer(self):
        """Build footer with auto-generation note"""
        elements = []
        
        current_date = datetime.now().strftime("%-d/%-m/%Y")
        footer_text = f"Dokumen ini dijana secara automatik dan tidak memerlukan tandatangan.\nGenerated on: {current_date}"
        
        footer_style = ParagraphStyle(
            'Footer',
            parent=getSampleStyleSheet()['Normal'],
            fontName='Helvetica',
            fontSize=8,
            alignment=TA_CENTER,
            leading=10
        )
        
        elements.append(Paragraph(footer_text, footer_style))
        return elements

def main():
    """Main function to generate PDF from command line arguments"""
    if len(sys.argv) != 3:
        print("Usage: python payslip-pdf-generator.py <json_data> <output_path>", file=sys.stderr)
        sys.exit(1)
    
    json_data = sys.argv[1]
    output_path = sys.argv[2]
    
    generator = PayslipPDFGenerator()
    success = generator.generate_payslip(json_data, output_path)
    
    if success:
        print(f"PDF generated successfully: {output_path}")
        sys.exit(0)
    else:
        print("Failed to generate PDF", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()