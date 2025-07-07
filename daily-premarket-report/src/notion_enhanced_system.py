#!/usr/bin/env python3
"""
Notion Enhanced System
=====================

Main system that creates comprehensive Notion pages instead of PDFs
"""

import asyncio
import os
import json
import logging
from datetime import datetime
from pathlib import Path

from enhanced_report_generator import EnhancedReportGenerator
from notion_report_generator import NotionReportGenerator
from audio_generator import AudioReportGenerator

logger = logging.getLogger(__name__)

class NotionEnhancedReportSystem:
    """Enhanced report system that creates Notion pages instead of PDFs"""
    
    def __init__(self, output_dir: str = "notion_reports"):
        self.output_dir = output_dir
        
        # Load configurations
        self.notion_config = self._load_notion_config()
        self.enhanced_config = self._load_enhanced_config()
        
        # Initialize components
        self.report_generator = EnhancedReportGenerator(
            tradingview_username=self.enhanced_config.get("tradingview", {}).get("username", "auitenbroek"),
            tradingview_key=self.enhanced_config.get("tradingview", {}).get("password"),
            fiscal_ai_key=self.enhanced_config.get("fiscal_ai", {}).get("api_key")
        )
        self.notion_generator = NotionReportGenerator(self.notion_config['notion_token'])
        self.audio_generator = AudioReportGenerator()
        
        # Ensure output directory exists
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)
    
    def _load_notion_config(self) -> dict:
        """Load Notion configuration"""
        config_file = "notion_config.json"
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                return json.load(f)
        else:
            raise FileNotFoundError("Notion config not found. Run setup first!")
    
    def _load_enhanced_config(self) -> dict:
        """Load enhanced data configuration"""
        config_file = "enhanced_data_config.json"
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                return json.load(f)
        else:
            logger.warning("Enhanced config not found, using defaults")
            return {"tradingview": {"enabled": False}}
    
    async def generate_notion_daily_report(self) -> dict:
        """Generate comprehensive daily report as Notion page + audio"""
        
        try:
            logger.info("Starting Notion-based daily report generation...")
            
            # Generate enhanced report data
            logger.info("Collecting premium market data...")
            report_data = await self.report_generator.generate_enhanced_daily_report()
            
            # Create comprehensive Notion page
            logger.info("Creating comprehensive Notion page...")
            notion_page_id = self.notion_generator.create_comprehensive_daily_report(
                parent_page_id=self.notion_config['main_page_id'],
                report_data=report_data
            )
            
            # Generate audio report
            logger.info("Generating audio report...")
            timestamp = datetime.now().strftime("%Y%m%d")
            daily_dir = os.path.join(self.output_dir, timestamp)
            Path(daily_dir).mkdir(parents=True, exist_ok=True)
            
            audio_result = await self.audio_generator.generate_complete_audio_report(
                report_data, daily_dir
            )
            
            # Save metadata
            metadata = {
                "generation_type": "notion_enhanced",
                "notion_page_id": notion_page_id,
                "notion_page_url": f"https://notion.so/{notion_page_id.replace('-', '')}",
                "audio_file": audio_result["audio_file"],
                "audio_duration": audio_result["duration_minutes"],
                "data_sources": ["TradingView", "Finviz", "fiscal.ai"],
                "generation_timestamp": datetime.now().isoformat(),
                "report_stats": {
                    "market_sentiment": report_data.executive_summary.get("market_sentiment"),
                    "risk_level": report_data.risk_assessment.get("overall_risk_level"),
                    "news_items_count": len(report_data.news_events),
                    "audio_word_count": len(audio_result["script"].split())
                }
            }
            
            metadata_file = os.path.join(daily_dir, f"notion_report_metadata_{timestamp}.json")
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info("Notion daily report generation completed successfully!")
            
            return {
                "status": "success",
                "notion_page_id": notion_page_id,
                "notion_page_url": metadata["notion_page_url"],
                "audio_file": audio_result["audio_file"],
                "audio_duration": audio_result["duration_minutes"],
                "metadata_file": metadata_file,
                "generation_timestamp": timestamp
            }
            
        except Exception as e:
            logger.error(f"Error in Notion report generation: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def generate_example_notion_report(self):
        """Generate an example Notion report for approval"""
        
        logger.info("=== Generating Example Notion Daily Report ===")
        
        result = await self.generate_notion_daily_report()
        
        if result["status"] == "success":
            print("\n" + "="*70)
            print("NOTION DAILY PREMARKET REPORT GENERATED")
            print("="*70)
            print(f"📄 Notion Page URL: {result['notion_page_url']}")
            print(f"🎧 Audio File: {os.path.basename(result['audio_file'])}")
            print(f"⏱️  Audio Duration: {result['audio_duration']:.1f} minutes")
            print(f"📊 Page ID: {result['notion_page_id']}")
            
            print(f"\n🎯 Report Features:")
            print("   ✅ Comprehensive Notion page with professional formatting")
            print("   ✅ Interactive tables with color-coded performance")
            print("   ✅ Clean economic calendar with importance indicators")
            print("   ✅ Rich text formatting with emojis and callouts")
            print("   ✅ Collapsible sections and organized structure")
            print("   ✅ Premium data from TradingView and Finviz")
            print("   ✅ Podcast-style audio companion")
            
            print(f"\n💡 Benefits of Notion Format:")
            print("   • Easy to read and navigate")
            print("   • Can be exported to PDF if needed")
            print("   • Interactive and shareable")
            print("   • Mobile-friendly viewing")
            print("   • Searchable and organized")
            print("   • No formatting issues!")
            
            print(f"\n🔗 View your report: {result['notion_page_url']}")
            print("="*70)
            
        else:
            print(f"❌ Error generating Notion report: {result.get('error')}")
        
        return result

async def main():
    """Test the Notion-based system"""
    
    print("🚀 Notion Enhanced Daily Report System")
    print("=" * 50)
    
    try:
        system = NotionEnhancedReportSystem()
        await system.generate_example_notion_report()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nMake sure you have:")
        print("1. Run setup_notion.py for Notion integration")
        print("2. Run setup_enhanced_config.py for data sources")

if __name__ == "__main__":
    asyncio.run(main())