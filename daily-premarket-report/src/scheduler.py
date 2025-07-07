#!/usr/bin/env python3
"""
Daily Report Scheduler
=====================

Automated scheduling system for daily premarket reports at 5:00 AM Central Time
"""

import asyncio
import os
import schedule
import time
import logging
from datetime import datetime, timezone
import pytz
from pathlib import Path
import json
from typing import Dict, Any

from report_generator import ReportGenerator
from pdf_generator import PDFReportGenerator  
from audio_generator import AudioReportGenerator

logger = logging.getLogger(__name__)

class DailyReportScheduler:
    """Schedules and executes daily premarket reports"""
    
    def __init__(self, output_dir: str = None):
        self.output_dir = output_dir or "daily_reports"
        self.central_tz = pytz.timezone('US/Central')
        self.report_generator = ReportGenerator()
        self.pdf_generator = PDFReportGenerator()
        self.audio_generator = AudioReportGenerator()
        
        # Ensure output directory exists
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)
        
        # Setup logging
        self._setup_logging()
        
    def _setup_logging(self):
        """Setup logging for scheduled operations"""
        log_file = os.path.join(self.output_dir, "scheduler.log")
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        
    async def generate_daily_report(self) -> Dict[str, Any]:
        """Generate complete daily report (PDF + Audio)"""
        
        try:
            logger.info("Starting daily premarket report generation...")
            
            # Generate timestamp for files
            now = datetime.now(self.central_tz)
            timestamp = now.strftime("%Y%m%d")
            date_str = now.strftime("%Y-%m-%d")
            
            # Create daily output directory
            daily_dir = os.path.join(self.output_dir, timestamp)
            Path(daily_dir).mkdir(parents=True, exist_ok=True)
            
            # Step 1: Generate report data
            logger.info("Collecting market data and generating report content...")
            report_data = await self.report_generator.generate_daily_report()
            
            # Step 2: Generate PDF report
            logger.info("Generating PDF report...")
            pdf_filename = f"daily_premarket_report_{timestamp}.pdf"
            pdf_path = os.path.join(daily_dir, pdf_filename)
            self.pdf_generator.generate_pdf_report(report_data, pdf_path)
            
            # Step 3: Generate audio report
            logger.info("Generating audio report...")
            audio_result = await self.audio_generator.generate_complete_audio_report(
                report_data, daily_dir
            )
            
            # Step 4: Save report metadata
            logger.info("Saving report metadata...")
            metadata = {
                "generation_date": date_str,
                "generation_time": now.isoformat(),
                "timezone": "US/Central",
                "files": {
                    "pdf_report": pdf_path,
                    "audio_file": audio_result["audio_file"],
                    "audio_metadata": audio_result["metadata_file"]
                },
                "report_stats": {
                    "audio_duration_minutes": audio_result["duration_minutes"],
                    "script_word_count": len(audio_result["script"].split()),
                    "news_items_count": len(report_data.news_events),
                    "market_sentiment": report_data.executive_summary.get("market_sentiment"),
                    "risk_level": report_data.risk_assessment.get("overall_risk_level")
                },
                "data_sources": {
                    "market_data": "Yahoo Finance",
                    "news_analysis": "Generated",
                    "technical_analysis": "YFinance + Custom",
                    "economic_calendar": "Sample Data"
                }
            }
            
            metadata_file = os.path.join(daily_dir, f"report_metadata_{timestamp}.json")
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"Daily report generation completed successfully!")
            logger.info(f"Files saved to: {daily_dir}")
            logger.info(f"PDF: {pdf_filename}")
            logger.info(f"Audio: {os.path.basename(audio_result['audio_file'])}")
            logger.info(f"Duration: {audio_result['duration_minutes']:.1f} minutes")
            
            return {
                "status": "success",
                "timestamp": timestamp,
                "output_directory": daily_dir,
                "files": metadata["files"],
                "stats": metadata["report_stats"]
            }
            
        except Exception as e:
            logger.error(f"Error generating daily report: {e}")
            return {
                "status": "error", 
                "error": str(e),
                "timestamp": timestamp
            }
    
    def run_daily_report_job(self):
        """Wrapper for async report generation"""
        logger.info("Triggered daily report job at 5:00 AM Central Time")
        
        # Run the async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(self.generate_daily_report())
            
            if result["status"] == "success":
                logger.info("Daily report job completed successfully")
            else:
                logger.error(f"Daily report job failed: {result.get('error')}")
                
        except Exception as e:
            logger.error(f"Daily report job exception: {e}")
        finally:
            loop.close()
    
    def schedule_daily_reports(self):
        """Schedule daily reports for 5:00 AM Central Time"""
        
        # Schedule the job for 5:00 AM every day
        schedule.every().day.at("05:00").do(self.run_daily_report_job)
        
        logger.info("Daily premarket reports scheduled for 5:00 AM Central Time")
        logger.info("Scheduler is now running...")
        
        # Keep the scheduler running
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    def run_test_report(self):
        """Generate a test report immediately"""
        logger.info("Running test report generation...")
        return self.run_daily_report_job()
    
    def get_next_scheduled_time(self) -> str:
        """Get the next scheduled report time"""
        
        central_tz = pytz.timezone('US/Central')
        now = datetime.now(central_tz)
        
        # Calculate next 5:00 AM Central
        next_run = now.replace(hour=5, minute=0, second=0, microsecond=0)
        
        # If it's past 5:00 AM today, schedule for tomorrow
        if now.hour >= 5:
            next_run = next_run.replace(day=next_run.day + 1)
        
        return next_run.strftime("%Y-%m-%d %H:%M:%S %Z")

def main():
    """Main entry point for scheduler"""
    
    import argparse
    
    parser = argparse.ArgumentParser(description="Daily Premarket Report Scheduler")
    parser.add_argument("--test", action="store_true", help="Run a test report immediately")
    parser.add_argument("--output-dir", default="daily_reports", help="Output directory for reports")
    parser.add_argument("--schedule", action="store_true", help="Start the scheduler (default)")
    
    args = parser.parse_args()
    
    scheduler = DailyReportScheduler(output_dir=args.output_dir)
    
    if args.test:
        # Run test report
        print("Generating test report...")
        scheduler.run_test_report()
        print("Test report completed!")
        
    else:
        # Start scheduler (default behavior)
        print(f"Next scheduled report: {scheduler.get_next_scheduled_time()}")
        scheduler.schedule_daily_reports()

if __name__ == "__main__":
    main()