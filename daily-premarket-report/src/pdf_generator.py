#!/usr/bin/env python3
"""
PDF Report Generator
===================

Professional PDF generation for Daily Premarket Reports
"""

import os
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
from typing import Dict, List, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
import base64
import pandas as pd
from report_generator import ReportData, MarketData, NewsItem

class PDFReportGenerator:
    """Generates professional PDF reports for portfolio managers"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            spaceAfter=20,
            textColor=colors.navy,
            alignment=TA_CENTER
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=12,
            spaceBefore=12,
            textColor=colors.darkblue,
            borderWidth=1,
            borderColor=colors.darkblue,
            borderPadding=5
        ))
        
        # Subsection style
        self.styles.add(ParagraphStyle(
            name='SubSection',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=8,
            spaceBefore=8,
            textColor=colors.darkgreen
        ))
        
        # Key insight style
        self.styles.add(ParagraphStyle(
            name='KeyInsight',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            leftIndent=20,
            bulletIndent=10,
            textColor=colors.darkred,
            bulletFontName='Symbol'
        ))
        
        # Data table style
        self.styles.add(ParagraphStyle(
            name='TableHeader',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.white,
            alignment=TA_CENTER
        ))
    
    def generate_pdf_report(self, report_data: ReportData, output_path: str):
        """Generate complete PDF report"""
        
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch
        )
        
        # Build story (content)
        story = []
        
        # Header
        story.extend(self._build_header(report_data))
        
        # Executive Summary
        story.extend(self._build_executive_summary(report_data))
        
        # Market Performance
        story.extend(self._build_market_performance(report_data))
        
        # News & Events
        story.extend(self._build_news_events(report_data))
        
        # Technical Analysis
        story.extend(self._build_technical_analysis(report_data))
        
        # Economic Calendar
        story.extend(self._build_economic_calendar(report_data))
        
        # Risk Assessment
        story.extend(self._build_risk_assessment(report_data))
        
        # Build PDF
        doc.build(story)
        
    def _build_header(self, report_data: ReportData) -> List:
        """Build report header"""
        story = []
        
        # Title
        title = Paragraph(
            f"Daily Premarket Report",
            self.styles['CustomTitle']
        )
        story.append(title)
        
        # Date and time
        date_str = datetime.now().strftime("%A, %B %d, %Y")
        time_str = "5:00 AM Central Time"
        
        date_para = Paragraph(
            f"<b>{date_str}</b><br/>{time_str}",
            self.styles['Normal']
        )
        story.append(date_para)
        story.append(Spacer(1, 0.2*inch))
        
        # Disclaimer
        disclaimer = Paragraph(
            "<i>This report is for institutional portfolio managers and hedge funds. "
            "All data and analysis are for informational purposes only and do not constitute investment advice.</i>",
            self.styles['Normal']
        )
        story.append(disclaimer)
        story.append(Spacer(1, 0.3*inch))
        
        return story
    
    def _build_executive_summary(self, report_data: ReportData) -> List:
        """Build executive summary section"""
        story = []
        
        # Section header
        header = Paragraph("Executive Summary", self.styles['SectionHeader'])
        story.append(header)
        
        exec_summary = report_data.executive_summary
        
        # Market sentiment
        sentiment = exec_summary.get('market_sentiment', 'neutral')
        sentiment_color = 'green' if sentiment == 'bullish' else 'red' if sentiment == 'bearish' else 'orange'
        
        sentiment_para = Paragraph(
            f"<b>Market Sentiment:</b> <font color='{sentiment_color}'>{sentiment.upper()}</font>",
            self.styles['Normal']
        )
        story.append(sentiment_para)
        story.append(Spacer(1, 0.1*inch))
        
        # Key insights
        insights_header = Paragraph("Key Insights:", self.styles['SubSection'])
        story.append(insights_header)
        
        for insight in exec_summary.get('key_insights', []):
            insight_para = Paragraph(f"• {insight}", self.styles['KeyInsight'])
            story.append(insight_para)
        
        story.append(Spacer(1, 0.1*inch))
        
        # Recommended actions
        actions_header = Paragraph("Recommended Actions:", self.styles['SubSection'])
        story.append(actions_header)
        
        for action in exec_summary.get('recommended_actions', []):
            action_para = Paragraph(f"• {action}", self.styles['Normal'])
            story.append(action_para)
        
        story.append(Spacer(1, 0.2*inch))
        
        return story
    
    def _build_market_performance(self, report_data: ReportData) -> List:
        """Build market performance section"""
        story = []
        
        header = Paragraph("Market Performance Analysis", self.styles['SectionHeader'])
        story.append(header)
        
        market_perf = report_data.market_performance
        
        # Overnight Futures
        if 'futures' in market_perf and market_perf['futures']:
            futures_header = Paragraph("Overnight Futures", self.styles['SubSection'])
            story.append(futures_header)
            
            futures_table = self._create_market_data_table(market_perf['futures'])
            story.append(futures_table)
            story.append(Spacer(1, 0.1*inch))
        
        # International Markets
        if 'international' in market_perf and market_perf['international']:
            intl_header = Paragraph("International Markets", self.styles['SubSection'])
            story.append(intl_header)
            
            intl_table = self._create_market_data_table(market_perf['international'])
            story.append(intl_table)
            story.append(Spacer(1, 0.1*inch))
        
        # Currencies
        if 'currencies' in market_perf and market_perf['currencies']:
            curr_header = Paragraph("Currency Markets", self.styles['SubSection'])
            story.append(curr_header)
            
            curr_table = self._create_market_data_table(market_perf['currencies'])
            story.append(curr_table)
            story.append(Spacer(1, 0.1*inch))
        
        # Commodities
        if 'commodities' in market_perf and market_perf['commodities']:
            comm_header = Paragraph("Commodities", self.styles['SubSection'])
            story.append(comm_header)
            
            comm_table = self._create_market_data_table(market_perf['commodities'])
            story.append(comm_table)
        
        story.append(Spacer(1, 0.2*inch))
        
        return story
    
    def _create_market_data_table(self, market_data: Dict[str, MarketData]) -> Table:
        """Create a formatted table for market data"""
        
        # Table headers
        data = [['Asset', 'Price', 'Change', 'Change %']]
        
        # Add data rows
        for name, data_obj in market_data.items():
            if hasattr(data_obj, 'current_price'):
                change_color = 'green' if data_obj.change >= 0 else 'red'
                
                # Create properly formatted cells
                name_cell = name
                price_cell = f"{data_obj.current_price:.2f}"
                change_cell = Paragraph(
                    f"<font color='{change_color}'>{data_obj.change:+.2f}</font>",
                    self.styles['Normal']
                )
                change_percent_cell = Paragraph(
                    f"<font color='{change_color}'>{data_obj.change_percent:+.2f}%</font>",
                    self.styles['Normal']
                )
                
                row = [name_cell, price_cell, change_cell, change_percent_cell]
                data.append(row)
        
        # Create table
        table = Table(data, colWidths=[2.5*inch, 1*inch, 1*inch, 1*inch])
        
        # Style table
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        return table
    
    def _build_news_events(self, report_data: ReportData) -> List:
        """Build news and events section"""
        story = []
        
        header = Paragraph("News & Events Impact", self.styles['SectionHeader'])
        story.append(header)
        
        # Sentiment analysis summary
        sector_analysis = report_data.sector_analysis
        sentiment = sector_analysis.get('overall_sentiment', 'neutral')
        impact_score = sector_analysis.get('average_impact_score', 0)
        
        sentiment_para = Paragraph(
            f"<b>Overall News Sentiment:</b> {sentiment.title()} "
            f"<b>Average Impact Score:</b> {impact_score}/10",
            self.styles['Normal']
        )
        story.append(sentiment_para)
        story.append(Spacer(1, 0.1*inch))
        
        # Key news items
        news_header = Paragraph("Key News Items:", self.styles['SubSection'])
        story.append(news_header)
        
        for i, news_item in enumerate(report_data.news_events[:5]):  # Top 5 news items
            impact_color = 'red' if news_item.impact_score >= 8 else 'orange' if news_item.impact_score >= 6 else 'green'
            
            news_para = Paragraph(
                f"<b>{news_item.headline}</b><br/>"
                f"{news_item.summary}<br/>"
                f"<i>Source: {news_item.source} | "
                f"Impact: <font color='{impact_color}'>{news_item.impact_score}/10</font></i>",
                self.styles['Normal']
            )
            story.append(news_para)
            story.append(Spacer(1, 0.1*inch))
        
        return story
    
    def _build_technical_analysis(self, report_data: ReportData) -> List:
        """Build technical analysis section"""
        story = []
        
        header = Paragraph("Technical Analysis", self.styles['SectionHeader'])
        story.append(header)
        
        tech_analysis = report_data.technical_analysis
        
        # VIX and volatility
        vix_level = tech_analysis.get('vix_level', 20)
        vol_regime = tech_analysis.get('volatility_regime', 'medium')
        vol_color = 'red' if vol_regime == 'high' else 'orange' if vol_regime == 'medium' else 'green'
        
        vix_para = Paragraph(
            f"<b>VIX Level:</b> {vix_level} "
            f"<b>Volatility Regime:</b> <font color='{vol_color}'>{vol_regime.title()}</font>",
            self.styles['Normal']
        )
        story.append(vix_para)
        story.append(Spacer(1, 0.1*inch))
        
        # Key levels
        if 'key_levels' in tech_analysis:
            levels_header = Paragraph("Key Technical Levels:", self.styles['SubSection'])
            story.append(levels_header)
            
            for symbol, levels in tech_analysis['key_levels'].items():
                levels_para = Paragraph(
                    f"<b>{symbol}:</b> Support: {levels.get('support', 'N/A')} | "
                    f"Resistance: {levels.get('resistance', 'N/A')}",
                    self.styles['Normal']
                )
                story.append(levels_para)
        
        story.append(Spacer(1, 0.2*inch))
        
        return story
    
    def _build_economic_calendar(self, report_data: ReportData) -> List:
        """Build economic calendar section"""
        story = []
        
        header = Paragraph("Today's Economic Calendar", self.styles['SectionHeader'])
        story.append(header)
        
        if report_data.economic_calendar:
            # Create table
            cal_data = [['Time (ET)', 'Event', 'Importance', 'Forecast', 'Previous']]
            
            for event in report_data.economic_calendar:
                importance_color = 'red' if event.get('importance') == 'high' else 'orange' if event.get('importance') == 'medium' else 'green'
                
                # Create properly formatted table cells
                time_cell = event.get('time', '')
                event_cell = event.get('event', '')
                importance_cell = Paragraph(
                    f"<font color='{importance_color}'>{event.get('importance', '').title()}</font>",
                    self.styles['Normal']
                )
                forecast_cell = event.get('forecast', 'N/A')
                previous_cell = event.get('previous', 'N/A')
                
                row = [time_cell, event_cell, importance_cell, forecast_cell, previous_cell]
                cal_data.append(row)
            
            cal_table = Table(cal_data, colWidths=[1*inch, 2*inch, 0.8*inch, 0.8*inch, 0.8*inch])
            cal_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            
            story.append(cal_table)
        else:
            no_events = Paragraph("No major economic events scheduled for today.", self.styles['Normal'])
            story.append(no_events)
        
        story.append(Spacer(1, 0.2*inch))
        
        return story
    
    def _build_risk_assessment(self, report_data: ReportData) -> List:
        """Build risk assessment section"""
        story = []
        
        header = Paragraph("Risk Assessment & Opportunities", self.styles['SectionHeader'])
        story.append(header)
        
        risk_assessment = report_data.risk_assessment
        
        # Overall risk level
        risk_level = risk_assessment.get('overall_risk_level', 'medium')
        risk_color = 'red' if risk_level == 'high' else 'orange' if risk_level == 'medium' else 'green'
        
        risk_para = Paragraph(
            f"<b>Overall Risk Level:</b> <font color='{risk_color}'>{risk_level.upper()}</font>",
            self.styles['Normal']
        )
        story.append(risk_para)
        story.append(Spacer(1, 0.1*inch))
        
        # Primary risks
        risks_header = Paragraph("Primary Risk Factors:", self.styles['SubSection'])
        story.append(risks_header)
        
        for risk in risk_assessment.get('primary_risks', []):
            risk_para = Paragraph(f"• {risk}", self.styles['Normal'])
            story.append(risk_para)
        
        story.append(Spacer(1, 0.1*inch))
        
        # Opportunities
        opps_header = Paragraph("Opportunity Areas:", self.styles['SubSection'])
        story.append(opps_header)
        
        for opp in risk_assessment.get('opportunity_areas', []):
            opp_para = Paragraph(f"• {opp}", self.styles['Normal'])
            story.append(opp_para)
        
        story.append(Spacer(1, 0.1*inch))
        
        # Hedging recommendations
        hedge_header = Paragraph("Hedging Recommendations:", self.styles['SubSection'])
        story.append(hedge_header)
        
        for hedge in risk_assessment.get('hedging_recommendations', []):
            hedge_para = Paragraph(f"• {hedge}", self.styles['Normal'])
            story.append(hedge_para)
        
        # Footer
        story.append(Spacer(1, 0.3*inch))
        footer = Paragraph(
            f"<i>Report generated at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} Central Time</i>",
            self.styles['Normal']
        )
        story.append(footer)
        
        return story