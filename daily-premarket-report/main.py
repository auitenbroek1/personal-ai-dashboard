#!/usr/bin/env python3
"""
Daily Premarket Report - Main Orchestrator
==========================================

Main entry point for the Daily Premarket Report system.
Coordinates data collection, PDF generation, audio generation, and scheduling.
"""

import asyncio
import os
import sys
import logging
from pathlib import Path
from datetime import datetime
import pytz
import argparse

# Add src directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.report_generator import ReportGenerator
from src.pdf_generator import PDFReportGenerator
from src.audio_generator import AudioReportGenerator
from src.scheduler import DailyReportScheduler
from src.integrated_scheduler import IntegratedReportSystem
from src.notion_enhanced_system import NotionEnhancedReportSystem

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DailyPremarketReportOrchestrator:
    """Main orchestrator for the Daily Premarket Report system"""
    
    def __init__(self, output_dir: str = "daily_reports"):
        self.output_dir = output_dir
        self.central_tz = pytz.timezone('US/Central')
        
        # Initialize components
        self.report_generator = ReportGenerator()
        self.pdf_generator = PDFReportGenerator()
        self.audio_generator = AudioReportGenerator()
        self.scheduler = DailyReportScheduler(output_dir)
        
        # Ensure output directory exists
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)
    
    async def generate_example_report(self):
        """Generate an example report for user approval"""
        
        logger.info("=== Generating Example Daily Premarket Report ===")
        
        try:
            # Generate report data
            logger.info("Step 1: Collecting market data and generating analysis...")
            report_data = await self.report_generator.generate_daily_report()
            
            # Create example output directory
            now = datetime.now(self.central_tz)
            timestamp = now.strftime("%Y%m%d_example")
            example_dir = os.path.join(self.output_dir, "examples", timestamp)
            Path(example_dir).mkdir(parents=True, exist_ok=True)
            
            # Generate PDF
            logger.info("Step 2: Generating professional PDF report...")
            pdf_filename = f"example_daily_premarket_report_{timestamp}.pdf"
            pdf_path = os.path.join(example_dir, pdf_filename)
            self.pdf_generator.generate_pdf_report(report_data, pdf_path)
            
            # Generate audio
            logger.info("Step 3: Generating podcast-style audio report...")
            audio_result = await self.audio_generator.generate_complete_audio_report(
                report_data, example_dir
            )
            
            # Print summary
            logger.info("=== Example Report Generation Complete ===")
            print("\n" + "="*60)
            print("EXAMPLE DAILY PREMARKET REPORT GENERATED")
            print("="*60)
            print(f"📁 Output Directory: {example_dir}")
            print(f"📄 PDF Report: {pdf_filename}")
            print(f"🎧 Audio File: {os.path.basename(audio_result['audio_file'])}")
            print(f"⏱️  Audio Duration: {audio_result['duration_minutes']:.1f} minutes")
            print(f"📊 Market Sentiment: {report_data.executive_summary.get('market_sentiment', 'N/A').title()}")
            print(f"⚠️  Risk Level: {report_data.risk_assessment.get('overall_risk_level', 'N/A').title()}")
            print(f"📰 News Items: {len(report_data.news_events)}")
            print("\n📋 Report Structure:")
            print("   • Executive Summary")
            print("   • Market Performance Analysis")
            print("   • News & Events Impact")
            print("   • Technical Analysis")
            print("   • Economic Calendar")
            print("   • Risk Assessment & Opportunities")
            print("\n🎯 Target Audience: Portfolio Managers & Hedge Funds")
            print("⏰ Scheduled Time: 5:00 AM Central Time (Daily)")
            print("📡 Distribution: PDF + Audio (Podcast Format)")
            print("="*60)
            
            return {
                "pdf_path": pdf_path,
                "audio_path": audio_result["audio_file"],
                "duration": audio_result["duration_minutes"],
                "example_dir": example_dir
            }
            
        except Exception as e:
            logger.error(f"Error generating example report: {e}")
            raise
    
    def start_scheduler(self):
        """Start the daily scheduler"""
        logger.info("Starting Daily Premarket Report Scheduler...")
        print(f"\n⏰ Next Scheduled Report: {self.scheduler.get_next_scheduled_time()}")
        print("🔄 Scheduler Status: RUNNING")
        print("💡 The system will automatically generate reports at 5:00 AM Central Time")
        print("\nPress Ctrl+C to stop the scheduler")
        
        try:
            self.scheduler.schedule_daily_reports()
        except KeyboardInterrupt:
            print("\n🛑 Scheduler stopped by user")
            logger.info("Scheduler stopped by user")
    
    def show_system_status(self):
        """Show system status and configuration"""
        
        print("\n" + "="*60)
        print("DAILY PREMARKET REPORT SYSTEM STATUS")
        print("="*60)
        print(f"📁 Output Directory: {os.path.abspath(self.output_dir)}")
        print(f"🕐 Current Time: {datetime.now(self.central_tz).strftime('%Y-%m-%d %H:%M:%S %Z')}")
        print(f"⏰ Next Report: {self.scheduler.get_next_scheduled_time()}")
        print(f"🎯 Target: Portfolio Managers & Hedge Funds")
        print(f"📊 Data Sources: Yahoo Finance, Economic APIs, News Feeds")
        print(f"🤖 AI Framework: SAFLA + FACT Enhanced")
        print("\n📋 Report Components:")
        print("   ✅ Market Data Collection")
        print("   ✅ News Analysis & Sentiment")
        print("   ✅ Technical Analysis")
        print("   ✅ Risk Assessment")
        print("   ✅ PDF Generation")
        print("   ✅ Audio Generation (Podcast Style)")
        print("   ✅ Automated Scheduling")
        print("\n🔧 System Configuration:")
        print("   • Schedule: Daily at 5:00 AM Central")
        print("   • Audio Duration: 15-20 minutes")
        print("   • PDF Format: Professional, Multi-section")
        print("   • Audio Voice: Professional (OpenAI TTS)")
        print("   • Distribution: Ready for Spotify/YouTube/Substack")
        print("="*60)

async def main():
    """Main entry point"""
    
    parser = argparse.ArgumentParser(description="Daily Premarket Report System")
    parser.add_argument("--example", action="store_true", 
                       help="Generate an example report for approval")
    parser.add_argument("--schedule", action="store_true",
                       help="Start the daily scheduler")
    parser.add_argument("--schedule-notion", action="store_true",
                       help="Start the daily scheduler with Notion integration")
    parser.add_argument("--test-notion", action="store_true",
                       help="Test Notion integration with example report")
    parser.add_argument("--notion-page", action="store_true",
                       help="Generate Notion page report (instead of PDF)")
    parser.add_argument("--status", action="store_true",
                       help="Show system status")
    parser.add_argument("--output-dir", default="daily_reports",
                       help="Output directory for reports")
    
    args = parser.parse_args()
    
    # Initialize orchestrator
    orchestrator = DailyPremarketReportOrchestrator(args.output_dir)
    
    if args.example:
        # Generate example report
        await orchestrator.generate_example_report()
        
    elif args.schedule:
        # Start scheduler
        orchestrator.start_scheduler()
        
    elif args.schedule_notion:
        # Start scheduler with Notion integration
        try:
            integrated_system = IntegratedReportSystem(args.output_dir)
            print("🚀 Starting Daily Scheduler with Notion Integration")
            print(f"⏰ Next Report: {integrated_system.get_next_scheduled_time()}")
            print("💾 Reports will be automatically saved to Notion!")
            integrated_system.schedule_integrated_daily_reports()
        except Exception as e:
            print(f"❌ Error starting integrated scheduler: {e}")
            print("💡 Make sure you've run the Notion setup first!")
        
    elif args.test_notion:
        # Test Notion integration
        try:
            integrated_system = IntegratedReportSystem(args.output_dir)
            print("🧪 Testing Notion Integration...")
            result = await integrated_system.test_notion_integration()
            if result and result.get("status") == "success":
                print("✅ Notion integration test completed!")
                print(f"📄 Report saved to Notion: {result.get('notion_page_id')}")
            else:
                print("⚠️  Test completed with issues. Check logs for details.")
        except Exception as e:
            print(f"❌ Error testing Notion integration: {e}")
            print("💡 Make sure you've run the Notion setup first!")
    
    elif args.notion_page:
        # Generate Notion page report
        try:
            notion_system = NotionEnhancedReportSystem()
            print("📄 Generating comprehensive Notion page report...")
            result = await notion_system.generate_example_notion_report()
            if result.get("status") == "success":
                print("🎉 Notion page report generated successfully!")
            else:
                print("⚠️  Report generation completed with issues.")
        except Exception as e:
            print(f"❌ Error generating Notion page report: {e}")
            print("💡 Make sure you've run both Notion and enhanced data setup!")
        
    elif args.status:
        # Show status
        orchestrator.show_system_status()
        
    else:
        # Default: show help and status
        print("Daily Premarket Report System")
        print("=" * 40)
        print("\nAvailable commands:")
        print("  --example         Generate example report")
        print("  --schedule        Start daily scheduler")
        print("  --schedule-notion Start scheduler with Notion integration")
        print("  --test-notion     Test Notion integration")
        print("  --notion-page     Generate Notion page report (instead of PDF)")
        print("  --status          Show system status")
        print("\nFor detailed help: python main.py --help")
        
        orchestrator.show_system_status()

if __name__ == "__main__":
    asyncio.run(main())