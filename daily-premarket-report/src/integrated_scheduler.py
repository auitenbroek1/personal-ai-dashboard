#!/usr/bin/env python3
"""
Integrated Scheduler with Notion
===============================

Enhanced scheduler that automatically saves reports to Notion
"""

import asyncio
import os
import json
import logging
from datetime import datetime
from pathlib import Path

from scheduler import DailyReportScheduler
from notion_integration import NotionIntegration

logger = logging.getLogger(__name__)

class IntegratedReportSystem(DailyReportScheduler):
    """Enhanced report system with Notion integration"""
    
    def __init__(self, output_dir: str = None, notion_config_path: str = "notion_config.json"):
        super().__init__(output_dir)
        
        # Load Notion configuration
        self.notion_config = self._load_notion_config(notion_config_path)
        self.notion = NotionIntegration(self.notion_config['notion_token'])
        
    def _load_notion_config(self, config_path: str) -> dict:
        """Load Notion configuration from file"""
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            logger.info("Notion configuration loaded successfully")
            return config
        except Exception as e:
            logger.error(f"Error loading Notion config: {e}")
            raise
    
    async def generate_daily_report_with_notion(self) -> dict:
        """Generate report and save to Notion"""
        
        try:
            logger.info("Starting integrated daily report generation with Notion...")
            
            # Generate the daily report (PDF + Audio)
            result = await self.generate_daily_report()
            
            if result["status"] == "success":
                # Load the report data for Notion
                metadata_file = None
                for file_path in result["files"].values():
                    if "metadata" in file_path:
                        metadata_file = file_path
                        break
                
                if metadata_file and os.path.exists(metadata_file):
                    with open(metadata_file, 'r') as f:
                        metadata = json.load(f)
                    
                    # Load the actual report data
                    report_data_file = os.path.join(
                        os.path.dirname(metadata_file), 
                        f"daily_report_{result['timestamp']}.json"
                    )
                    
                    if os.path.exists(report_data_file):
                        with open(report_data_file, 'r') as f:
                            report_data_dict = json.load(f)
                        
                        # Convert back to ReportData object for Notion
                        from report_generator import ReportData, NewsItem, MarketData
                        
                        # Reconstruct NewsItem objects
                        news_events = []
                        for news_dict in report_data_dict.get('news_events', []):
                            news_events.append(NewsItem(
                                headline=news_dict['headline'],
                                summary=news_dict['summary'],
                                source=news_dict['source'],
                                timestamp=news_dict['timestamp'],
                                sentiment=news_dict['sentiment'],
                                impact_score=news_dict['impact_score']
                            ))
                        
                        # Create ReportData object
                        report_data = ReportData(
                            date=report_data_dict['date'],
                            executive_summary=report_data_dict['executive_summary'],
                            market_performance=report_data_dict['market_performance'],
                            news_events=news_events,
                            sector_analysis=report_data_dict['sector_analysis'],
                            technical_analysis=report_data_dict['technical_analysis'],
                            economic_calendar=report_data_dict['economic_calendar'],
                            risk_assessment=report_data_dict['risk_assessment']
                        )
                        
                        # Save to Notion
                        logger.info("Saving report to Notion...")
                        notion_page_id = self.notion.save_daily_report(
                            database_id=self.notion_config['database_id'],
                            report_data=report_data,
                            pdf_path=result["files"].get("pdf_report", ""),
                            audio_path=result["files"].get("audio_file", ""),
                            metadata=metadata
                        )
                        
                        result["notion_page_id"] = notion_page_id
                        logger.info(f"Report successfully saved to Notion: {notion_page_id}")
                
            return result
            
        except Exception as e:
            logger.error(f"Error in integrated report generation: {e}")
            return {"status": "error", "error": str(e)}
    
    def run_integrated_report_job(self):
        """Wrapper for integrated async report generation"""
        logger.info("Triggered integrated daily report job (with Notion) at 5:00 AM Central Time")
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(self.generate_daily_report_with_notion())
            
            if result["status"] == "success":
                logger.info("Integrated daily report job completed successfully")
                logger.info(f"Notion page created: {result.get('notion_page_id')}")
            else:
                logger.error(f"Integrated daily report job failed: {result.get('error')}")
                
        except Exception as e:
            logger.error(f"Integrated daily report job exception: {e}")
        finally:
            loop.close()
    
    def schedule_integrated_daily_reports(self):
        """Schedule daily reports with Notion integration"""
        
        import schedule
        
        # Schedule the integrated job for 5:00 AM every day
        schedule.every().day.at("05:00").do(self.run_integrated_report_job)
        
        logger.info("Integrated daily premarket reports (with Notion) scheduled for 5:00 AM Central Time")
        logger.info("Scheduler is now running...")
        
        # Keep the scheduler running
        while True:
            schedule.run_pending()
            time.sleep(60)
    
    async def test_notion_integration(self):
        """Test the Notion integration with example report"""
        logger.info("Testing Notion integration with example report...")
        return await self.generate_daily_report_with_notion()

def main():
    """Main entry point for integrated system"""
    
    import argparse
    
    parser = argparse.ArgumentParser(description="Integrated Daily Premarket Report System with Notion")
    parser.add_argument("--test-notion", action="store_true", help="Test Notion integration")
    parser.add_argument("--schedule-integrated", action="store_true", help="Start integrated scheduler")
    parser.add_argument("--output-dir", default="daily_reports", help="Output directory for reports")
    
    args = parser.parse_args()
    
    try:
        system = IntegratedReportSystem(output_dir=args.output_dir)
        
        if args.test_notion:
            # Test Notion integration
            print("Testing Notion integration with example report...")
            system.test_notion_integration()
            print("Notion integration test completed!")
            
        elif args.schedule_integrated:
            # Start integrated scheduler
            print("Starting integrated scheduler with Notion...")
            print(f"Next scheduled report: {system.get_next_scheduled_time()}")
            print("Reports will be automatically saved to Notion!")
            system.schedule_integrated_daily_reports()
            
        else:
            print("Integrated Daily Premarket Report System with Notion")
            print("=" * 50)
            print("Available commands:")
            print("  --test-notion           Test Notion integration")
            print("  --schedule-integrated   Start integrated scheduler")
            
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure you have run setup_notion.py first!")

if __name__ == "__main__":
    main()