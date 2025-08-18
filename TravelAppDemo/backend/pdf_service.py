from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
from io import BytesIO
import os
from typing import Dict, Any, List


class PDFService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Setup custom paragraph styles for the PDF"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#2563eb'),
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceBefore=20,
            spaceAfter=12,
            textColor=colors.HexColor('#1f2937')
        ))
        
        self.styles.add(ParagraphStyle(
            name='ItemDetail',
            parent=self.styles['Normal'],
            fontSize=10,
            leftIndent=20,
            spaceAfter=6
        ))

    def generate_itinerary_pdf(self, itinerary_data: Dict[str, Any], user_email: str = None) -> BytesIO:
        """Generate a PDF from itinerary data"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=18)
        
        # Build the document content
        story = []
        
        # Title
        title = Paragraph(f"Travel Itinerary: {itinerary_data.get('destination', 'Unknown Destination')}", 
                         self.styles['CustomTitle'])
        story.append(title)
        story.append(Spacer(1, 12))
        
        # Trip Summary
        story.append(Paragraph("Trip Summary", self.styles['SectionHeader']))
        summary_data = [
            ['Destination:', itinerary_data.get('destination', 'N/A')],
            ['Duration:', itinerary_data.get('duration', 'N/A')],
            ['Total Cost:', f"${itinerary_data.get('total_cost', 0):,.2f}"],
            ['Bookable Cost:', f"${itinerary_data.get('bookable_cost', 0):,.2f}"],
            ['Estimated Cost:', f"${itinerary_data.get('estimated_cost', 0):,.2f}"],
        ]
        
        if user_email:
            summary_data.append(['Generated for:', user_email])
        
        summary_data.append(['Generated on:', datetime.now().strftime('%B %d, %Y at %I:%M %p')])
        
        summary_table = Table(summary_data, colWidths=[2*inch, 4*inch])
        summary_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
        # Flights Section
        if itinerary_data.get('flights'):
            story.append(Paragraph("Flights", self.styles['SectionHeader']))
            for i, flight in enumerate(itinerary_data['flights']):
                flight_type = flight.get('type', 'flight').title()
                story.append(Paragraph(f"{flight_type} Flight {i+1}", self.styles['Heading3']))
                
                flight_details = [
                    ['Airline:', flight.get('airline', 'N/A')],
                    ['Flight:', flight.get('flight', 'N/A')],
                    ['Route:', flight.get('departure', 'N/A')],
                    ['Time:', flight.get('time', 'N/A')],
                    ['Price:', f"${flight.get('price', 0):,.2f}"]
                ]
                
                flight_table = Table(flight_details, colWidths=[1.5*inch, 4.5*inch])
                flight_table.setStyle(TableStyle([
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 20),
                ]))
                story.append(flight_table)
                story.append(Spacer(1, 12))
        
        # Hotel Section
        if itinerary_data.get('hotel'):
            hotel = itinerary_data['hotel']
            story.append(Paragraph("Accommodation", self.styles['SectionHeader']))
            
            hotel_details = [
                ['Hotel:', hotel.get('name', 'N/A')],
                ['Address:', hotel.get('address', 'N/A')],
                ['Room Type:', hotel.get('room_type', 'N/A')],
                ['Check-in:', hotel.get('check_in', 'N/A')],
                ['Check-out:', hotel.get('check_out', 'N/A')],
                ['Price per Night:', f"${hotel.get('price', 0):,.2f}"],
                ['Total Nights:', str(hotel.get('total_nights', 0))]
            ]
            
            hotel_table = Table(hotel_details, colWidths=[2*inch, 4*inch])
            hotel_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ]))
            story.append(hotel_table)
            story.append(Spacer(1, 20))
        
        # Daily Schedule
        if itinerary_data.get('schedule'):
            story.append(Paragraph("Daily Schedule", self.styles['SectionHeader']))
            
            for day in itinerary_data['schedule']:
                day_num = day.get('day', 1)
                day_date = day.get('date', 'N/A')
                
                story.append(Paragraph(f"Day {day_num} - {day_date}", self.styles['Heading3']))
                
                if day.get('activities'):
                    activities_data = []
                    for activity in day['activities']:
                        activities_data.append([
                            activity.get('time', 'N/A'),
                            activity.get('name', 'N/A'),
                            f"${activity.get('price', 0):,.2f}",
                            activity.get('type', 'N/A').title()
                        ])
                    
                    activities_table = Table(
                        [['Time', 'Activity', 'Price', 'Type']] + activities_data,
                        colWidths=[1*inch, 3*inch, 1*inch, 1*inch]
                    )
                    activities_table.setStyle(TableStyle([
                        # Header row
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 10),
                        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                        
                        # Data rows
                        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                        ('FONTSIZE', (0, 1), (-1, -1), 9),
                        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                        ('ALIGN', (2, 1), (2, -1), 'RIGHT'),  # Price column
                        ('ALIGN', (3, 1), (3, -1), 'CENTER'), # Type column
                        
                        # Grid
                        ('GRID', (0, 0), (-1, -1), 1, colors.black),
                        
                        # Alternating row colors
                        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
                    ]))
                    story.append(activities_table)
                else:
                    story.append(Paragraph("No activities scheduled", self.styles['ItemDetail']))
                
                story.append(Spacer(1, 16))
        
        # Footer
        story.append(Spacer(1, 30))
        footer_text = "Generated by Travel App - Your AI-powered travel assistant"
        story.append(Paragraph(footer_text, self.styles['Normal']))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer

    def generate_filename(self, destination: str, user_id: int = None) -> str:
        """Generate a safe filename for the PDF"""
        safe_destination = "".join(c for c in destination if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_destination = safe_destination.replace(' ', '_')
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if user_id:
            return f"itinerary_{safe_destination}_{user_id}_{timestamp}.pdf"
        else:
            return f"itinerary_{safe_destination}_{timestamp}.pdf"


# Create singleton instance
pdf_service = PDFService()
