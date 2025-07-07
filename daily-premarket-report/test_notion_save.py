#!/usr/bin/env python3
"""
Test Notion Integration
======================

Test saving the example report to Notion
"""

import sys
import os
import json
import asyncio
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.notion_integration import NotionIntegration
from src.report_generator import ReportData, NewsItem

async def test_notion_save():
    """Test saving example report to Notion"""
    
    print("🧪 Testing Notion Integration")
    print("=" * 40)
    
    try:
        # Load Notion configuration
        with open('notion_config.json', 'r') as f:
            config = json.load(f)
        
        # Initialize Notion integration
        notion = NotionIntegration(config['notion_token'])
        
        # Create sample report data (similar to what was generated)
        sample_report = ReportData(
            date="2025-07-06",
            executive_summary={
                "market_sentiment": "neutral",
                "key_insights": [
                    "Overnight futures showing neutral bias with average change of 0.00%",
                    "News sentiment is positive with impact score of 7.5",
                    "VIX at 20 indicating medium volatility"
                ],
                "risk_level": "medium",
                "recommended_actions": [
                    "Monitor Federal Reserve communications",
                    "Watch for any changes in volatility regime",
                    "Prepare for potential sector rotation"
                ]
            },
            market_performance={
                "futures": {},
                "international": {},
                "currencies": {},
                "commodities": {}
            },
            news_events=[
                NewsItem(
                    headline="Federal Reserve Signals Potential Rate Pause",
                    summary="Fed officials indicated a possible pause in rate hikes following recent economic data showing cooling inflation trends.",
                    source="Federal Reserve",
                    timestamp="2025-07-06T23:00:00",
                    sentiment="neutral",
                    impact_score=8.5
                ),
                NewsItem(
                    headline="Tech Earnings Beat Expectations",
                    summary="Major technology companies report stronger than expected Q4 earnings, driven by AI investments and cloud growth.",
                    source="Corporate Earnings",
                    timestamp="2025-07-06T22:30:00",
                    sentiment="positive",
                    impact_score=7.2
                ),
                NewsItem(
                    headline="China Manufacturing PMI Expansion",
                    summary="China's manufacturing PMI reached 51.2, indicating expansion and potential global growth implications.",
                    source="Economic Data",
                    timestamp="2025-07-06T21:00:00",
                    sentiment="positive",
                    impact_score=6.8
                )
            ],
            sector_analysis={
                "overall_sentiment": "positive",
                "average_impact_score": 7.5,
                "positive_stories": 2,
                "negative_stories": 0,
                "neutral_stories": 1
            },
            technical_analysis={
                "vix_level": 20.0,
                "volatility_regime": "medium",
                "market_breadth": "positive",
                "key_levels": {
                    "SPY": {"support": 475.0, "resistance": 485.0},
                    "QQQ": {"support": 390.0, "resistance": 400.0}
                }
            },
            economic_calendar=[
                {
                    "time": "08:30 ET",
                    "event": "Initial Jobless Claims",
                    "importance": "medium",
                    "forecast": "220K",
                    "previous": "218K"
                }
            ],
            risk_assessment={
                "overall_risk_level": "medium",
                "primary_risks": [
                    "Inflation Uncertainty",
                    "Geopolitical Tensions"
                ],
                "opportunity_areas": [
                    "Technology sector on earnings strength",
                    "Emerging markets on China growth data"
                ],
                "hedging_recommendations": [
                    "Consider VIX calls for portfolio protection",
                    "Monitor USD strength for international exposure"
                ]
            }
        )
        
        # Sample metadata
        metadata = {
            "report_stats": {
                "audio_duration_minutes": 2.5,
                "script_word_count": 350,
                "news_items_count": 3,
                "market_sentiment": "neutral",
                "risk_level": "medium"
            }
        }
        
        print("📤 Saving example report to Notion...")
        
        # Save to Notion
        page_id = notion.save_daily_report(
            database_id=config['database_id'],
            report_data=sample_report,
            pdf_path="daily_reports/examples/20250706_example/example_daily_premarket_report_20250706_example.pdf",
            audio_path="daily_reports/examples/20250706_example/daily_premarket_report_20250706.txt",
            metadata=metadata
        )
        
        print("✅ SUCCESS!")
        print(f"📄 Report saved to Notion page: {page_id}")
        print(f"🔗 View your report: https://notion.so/{page_id.replace('-', '')}")
        print("\n🎯 What was saved:")
        print("   • Complete report entry in database")
        print("   • Executive summary with key insights")
        print("   • Market sentiment and risk level")
        print("   • Top 3 news items with impact scores")
        print("   • Technical analysis data")
        print("   • Risk assessment and opportunities")
        
        print("\n📊 Check your Notion workspace:")
        print(f"   • Database: https://notion.so/{config['database_id'].replace('-', '')}")
        print(f"   • Analytics: https://notion.so/{config['analytics_page_id'].replace('-', '')}")
        
    except Exception as e:
        print(f"❌ Error testing Notion integration: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure you ran setup_notion.py successfully")
        print("2. Check that notion_config.json exists")
        print("3. Verify your Notion integration has proper permissions")

if __name__ == "__main__":
    asyncio.run(test_notion_save())