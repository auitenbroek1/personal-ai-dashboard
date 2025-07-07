#!/usr/bin/env python3
"""
Test PDF Formatting
==================

Quick test to verify economic calendar and table formatting is clean
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.pdf_generator import PDFReportGenerator
from src.report_generator import ReportData, NewsItem, MarketData
from datetime import datetime

def create_test_report_data():
    """Create test report data with clean economic calendar"""
    
    # Create test news items
    news_items = [
        NewsItem(
            headline="Federal Reserve Maintains Interest Rates",
            summary="The Federal Reserve kept interest rates steady at 5.25-5.50% as expected by markets.",
            source="Federal Reserve",
            timestamp=datetime.now().isoformat(),
            sentiment="neutral",
            impact_score=8.5
        )
    ]
    
    # Create test market data
    test_market_data = {
        "S&P 500 Futures": MarketData(
            symbol="ES",
            current_price=4750.25,
            change=12.50,
            change_percent=0.26,
            volume=125000,
            timestamp=datetime.now().isoformat()
        ),
        "NASDAQ Futures": MarketData(
            symbol="NQ", 
            current_price=15250.75,
            change=-8.25,
            change_percent=-0.05,
            volume=85000,
            timestamp=datetime.now().isoformat()
        )
    }
    
    # Create clean economic calendar data
    economic_calendar = [
        {
            "time": "8:30 AM ET",
            "event": "Initial Jobless Claims",
            "importance": "medium",
            "forecast": "220K",
            "previous": "218K"
        },
        {
            "time": "10:00 AM ET",
            "event": "ISM Services PMI",
            "importance": "high", 
            "forecast": "52.5",
            "previous": "52.6"
        },
        {
            "time": "2:00 PM ET",
            "event": "Fed Chair Powell Speech",
            "importance": "high",
            "forecast": "N/A",
            "previous": "N/A"
        }
    ]
    
    # Create test report data
    report_data = ReportData(
        date=datetime.now().strftime("%Y-%m-%d"),
        executive_summary={
            "market_sentiment": "neutral",
            "key_insights": [
                "Markets showing consolidation ahead of Fed decision",
                "Technology sector displaying relative strength",
                "Volatility remains contained below 20 VIX level"
            ],
            "risk_level": "medium",
            "recommended_actions": [
                "Monitor Fed communications closely",
                "Watch for breakouts in key technical levels",
                "Maintain balanced portfolio positioning"
            ]
        },
        market_performance={
            "futures": test_market_data,
            "international": {},
            "currencies": {},
            "commodities": {}
        },
        news_events=news_items,
        sector_analysis={
            "overall_sentiment": "neutral",
            "average_impact_score": 7.5
        },
        technical_analysis={
            "vix_level": 18.5,
            "volatility_regime": "low",
            "market_breadth": "neutral"
        },
        economic_calendar=economic_calendar,
        risk_assessment={
            "overall_risk_level": "medium",
            "primary_risks": ["Fed Policy Uncertainty", "Earnings Season"],
            "opportunity_areas": ["Technology Sector", "International Markets"]
        }
    )
    
    return report_data

def test_pdf_formatting():
    """Test PDF generation with clean formatting"""
    
    print("🧪 Testing PDF Formatting")
    print("=" * 40)
    
    # Create test data
    report_data = create_test_report_data()
    
    # Generate PDF
    pdf_generator = PDFReportGenerator()
    output_path = "test_formatting_report.pdf"
    
    print("📄 Generating test PDF report...")
    pdf_generator.generate_pdf_report(report_data, output_path)
    
    print(f"✅ Test PDF generated: {output_path}")
    print("\n📋 Test Report Contents:")
    print("   • Clean economic calendar formatting")
    print("   • Proper table cell rendering")
    print("   • Color-coded importance levels")
    print("   • Professional market data tables")
    
    # Open the PDF
    os.system(f"open {output_path}")
    print(f"\n👀 PDF opened for review")
    print("🎯 Check the Economic Calendar section for clean formatting!")

if __name__ == "__main__":
    test_pdf_formatting()