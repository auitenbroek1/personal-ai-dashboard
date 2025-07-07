#!/usr/bin/env python3
"""
Generate Enhanced Daily Premarket Report
========================================

Creates a new example report for tomorrow using the enhanced premarket generator
with all user feedback incorporated.
"""

import asyncio
import os
import json
import logging
from datetime import datetime, timedelta
from src.enhanced_premarket_generator import EnhancedPremarketGenerator
from src.notion_report_generator import NotionReportGenerator

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def main():
    """Generate new enhanced premarket report for tomorrow"""
    
    print("🚀 Generating Enhanced Daily Premarket Report")
    print("=" * 60)
    
    try:
        # Initialize enhanced premarket generator
        logger.info("Initializing enhanced premarket generator...")
        generator = EnhancedPremarketGenerator()
        
        # Generate enhanced report data
        logger.info("Generating enhanced premarket report data...")
        report_data = await generator.generate_premarket_report()
        
        # Save JSON report for review
        output_dir = "enhanced_reports"
        os.makedirs(output_dir, exist_ok=True)
        
        tomorrow = datetime.now() + timedelta(days=1)
        report_file = f"{output_dir}/enhanced_premarket_report_{tomorrow.strftime('%Y%m%d')}.json"
        
        with open(report_file, 'w') as f:
            # Convert dataclass to dict for JSON serialization
            from dataclasses import asdict
            json.dump(asdict(report_data), f, indent=2, default=str)
        
        logger.info(f"Enhanced report data saved to {report_file}")
        
        # Create Notion page if token is available
        notion_token = os.getenv('NOTION_TOKEN', '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')
        parent_page_id = "229bfe288ab580e9ba1bd9db16dbf71d"  # Daily Premarket Reports page
        
        if notion_token:
            try:
                logger.info("Creating Notion page with enhanced report...")
                notion_generator = NotionReportGenerator(notion_token)
                
                page_id = notion_generator.create_comprehensive_daily_report(
                    parent_page_id, report_data
                )
                
                notion_url = f"https://www.notion.so/{page_id.replace('-', '')}"
                
                print("✅ SUCCESS: Enhanced Premarket Report Generated!")
                print(f"📄 JSON Report: {report_file}")
                print(f"📋 Notion Page: {notion_url}")
                
            except Exception as e:
                logger.error(f"Error creating Notion page: {e}")
                print("⚠️ JSON report created but Notion page failed")
                print(f"📄 JSON Report: {report_file}")
        else:
            print("⚠️ No Notion token - only JSON report created")
            print(f"📄 JSON Report: {report_file}")
        
        # Display key improvements
        print("\n🎯 Key Enhancements Incorporated:")
        print("• Previous session closing prices for major indices (SPX, NDX, RUT, DJIA, VIX)")
        print("• Weekly sector rotation analysis (1-week timeframe)")
        print("• News themes listed immediately after sentiment")
        print("• Upcoming earnings calendar with BMO/AMC timing")
        print("• No explicit data source mentions")
        print("• Professional premarket focus")
        
        return report_data
        
    except Exception as e:
        logger.error(f"Error generating enhanced report: {e}")
        print(f"❌ ERROR: {e}")
        return None

if __name__ == "__main__":
    # Set environment variables for testing
    os.environ.setdefault('NOTION_TOKEN', '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')
    
    # Run the report generation
    asyncio.run(main())