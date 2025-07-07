#!/usr/bin/env python3
"""
Publish Enhanced Premarket Report to Notion
===========================================

Generates and publishes comprehensive premarket report with Polygon.io Stocks Starter data
"""

import asyncio
import logging
from enhanced_premarket_generator import EnhancedPremarketGenerator
from notion_report_generator import NotionReportGenerator

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def main():
    """Generate and publish report to Notion"""
    
    print("🚀 Generating Enhanced Premarket Report with Polygon.io Stocks Starter...")
    
    # Generate the enhanced report with all upgraded features
    generator = EnhancedPremarketGenerator()
    report_data = await generator.generate_premarket_report()
    
    print("📄 Publishing to Notion...")
    
    # Create Notion page
    notion_gen = NotionReportGenerator("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")
    page_id = notion_gen.create_comprehensive_daily_report("229bfe288ab580e9ba1bd9db16dbf71d", report_data)
    
    print("✅ Report published to Notion!")
    clean_page_id = page_id.replace("-", "")
    print(f"🔗 URL: https://www.notion.so/{clean_page_id}")
    
    # Print summary of data quality
    print("\n📊 DATA QUALITY SUMMARY:")
    print(f"  • Market Data: {len(report_data.market_performance.get('previous_close', {}))} indices from Polygon.io")
    print(f"  • International: {len(report_data.market_performance.get('international', {}))} markets from Polygon.io") 
    print(f"  • Sector Rotation: {len(report_data.market_performance.get('sector_rotation', {}).get('weekly_performance', {}))} sectors")
    print(f"  • Economic Calendar: {len(report_data.economic_calendar)} events from FRED")
    print(f"  • Earnings Calendar: {len(report_data.earnings_calendar)} upcoming releases")
    
    return page_id

if __name__ == "__main__":
    asyncio.run(main())