#!/usr/bin/env python3
"""
Enhanced Daily Premarket Report - Main System
============================================

Enhanced main entry point using TradingView, fiscal.ai, and Finviz data
"""

import asyncio
import os
import sys
import logging
import json
from pathlib import Path
from datetime import datetime
import pytz
import argparse

# Add src directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.enhanced_report_generator import EnhancedReportGenerator
from src.pdf_generator import PDFReportGenerator
from src.audio_generator import AudioReportGenerator
from src.integrated_scheduler import IntegratedReportSystem
from src.notion_integration import NotionIntegration

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EnhancedDailyReportSystem:
    """Enhanced daily report system with premium data sources"""
    
    def __init__(self, output_dir: str = "enhanced_reports"):
        self.output_dir = output_dir
        self.central_tz = pytz.timezone('US/Central')
        
        # Load enhanced configuration
        self.config = self._load_enhanced_config()
        
        # Initialize enhanced components
        self.report_generator = EnhancedReportGenerator(
            tradingview_username=self.config.get("tradingview", {}).get("username", "auitenbroek"),
            tradingview_key=self.config.get("tradingview", {}).get("password"),
            fiscal_ai_key=self.config.get("fiscal_ai", {}).get("api_key")
        )
        self.pdf_generator = PDFReportGenerator()
        self.audio_generator = AudioReportGenerator()
        
        # Ensure output directory exists
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)
    
    def _load_enhanced_config(self) -> dict:
        """Load enhanced data configuration"""
        
        config_file = "enhanced_data_config.json"
        
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                return json.load(f)
        else:
            logger.warning("Enhanced config not found, using defaults")
            return {"tradingview": {"enabled": False}, "finviz": {"enabled": True}}
    
    async def generate_enhanced_example_report(self):
        """Generate an enhanced example report using premium data"""
        
        logger.info("=== Generating Enhanced Example Report with Premium Data ===")
        
        try:
            # Generate enhanced report data
            logger.info("Step 1: Collecting premium market data (TradingView, Finviz)...")
            report_data = await self.report_generator.generate_enhanced_daily_report()
            
            # Create enhanced output directory
            now = datetime.now(self.central_tz)
            timestamp = now.strftime("%Y%m%d_enhanced")
            example_dir = os.path.join(self.output_dir, "examples", timestamp)
            Path(example_dir).mkdir(parents=True, exist_ok=True)
            
            # Generate enhanced PDF
            logger.info("Step 2: Generating enhanced PDF report...")
            pdf_filename = f"enhanced_daily_premarket_report_{timestamp}.pdf"
            pdf_path = os.path.join(example_dir, pdf_filename)
            self.pdf_generator.generate_pdf_report(report_data, pdf_path)
            
            # Generate enhanced audio
            logger.info("Step 3: Generating enhanced audio report...")
            audio_result = await self.audio_generator.generate_complete_audio_report(
                report_data, example_dir
            )
            
            # Save enhanced metadata
            metadata = {
                "report_type": "enhanced",
                "data_sources": ["TradingView", "Finviz", "fiscal.ai"],
                "generation_date": now.strftime("%Y-%m-%d"),
                "generation_time": now.isoformat(),
                "enhanced_features": {
                    "sector_analysis": bool(report_data.technical_analysis.get("sector_rotation")),
                    "top_movers": bool(report_data.market_performance.get("enhanced_metrics", {}).get("top_movers")),
                    "volatility_analysis": bool(report_data.technical_analysis.get("volatility_regime")),
                    "crypto_data": bool(report_data.market_performance.get("crypto"))
                },
                "files": {
                    "pdf": pdf_path,
                    "audio": audio_result["audio_file"]
                }
            }
            
            metadata_file = os.path.join(example_dir, f"enhanced_metadata_{timestamp}.json")
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            # Print enhanced summary
            logger.info("=== Enhanced Example Report Generation Complete ===")
            print("\n" + "="*70)
            print("ENHANCED DAILY PREMARKET REPORT GENERATED")
            print("="*70)
            print(f"📁 Output Directory: {example_dir}")
            print(f"📄 Enhanced PDF Report: {pdf_filename}")
            print(f"🎧 Audio File: {os.path.basename(audio_result['audio_file'])}")
            print(f"⏱️  Audio Duration: {audio_result['duration_minutes']:.1f} minutes")
            
            # Enhanced insights
            exec_summary = report_data.executive_summary
            print(f"\n📊 Enhanced Market Analysis:")
            print(f"   • Market Sentiment: {exec_summary.get('market_sentiment', 'N/A').title()}")
            print(f"   • Data Quality: {exec_summary.get('data_quality', 'Enhanced')}")
            print(f"   • Sources: {', '.join(exec_summary.get('sources', ['Premium']))}")
            
            # Technical analysis insights
            tech_analysis = report_data.technical_analysis
            if tech_analysis.get("sector_rotation"):
                sector_data = tech_analysis["sector_rotation"]
                print(f"   • Leading Sector: {sector_data.get('best_performing', {}).get('sector', 'N/A')}")
                print(f"   • Volatility Regime: {tech_analysis.get('volatility_regime', 'N/A')}")
            
            # Enhanced features summary
            print(f"\n🚀 Enhanced Features Included:")
            for feature, enabled in metadata["enhanced_features"].items():
                status = "✅" if enabled else "⏭️"
                print(f"   {status} {feature.replace('_', ' ').title()}")
            
            print(f"\n💾 Data Sources: TradingView, Finviz" + 
                  (", fiscal.ai" if self.config.get("fiscal_ai", {}).get("enabled") else ""))
            print("="*70)
            
            return {
                "pdf_path": pdf_path,
                "audio_path": audio_result["audio_file"],
                "duration": audio_result["duration_minutes"],
                "example_dir": example_dir,
                "enhanced_features": metadata["enhanced_features"]
            }
            
        except Exception as e:
            logger.error(f"Error generating enhanced example report: {e}")
            raise
    
    def show_enhanced_system_status(self):
        """Show enhanced system status"""
        
        print("\n" + "="*70)
        print("ENHANCED DAILY PREMARKET REPORT SYSTEM STATUS")
        print("="*70)
        print(f"📁 Output Directory: {os.path.abspath(self.output_dir)}")
        print(f"🕐 Current Time: {datetime.now(self.central_tz).strftime('%Y-%m-%d %H:%M:%S %Z')}")
        print(f"🎯 Target: Portfolio Managers & Hedge Funds")
        
        # Enhanced data sources status
        print(f"\n📊 Premium Data Sources:")
        
        # TradingView status
        tv_config = self.config.get("tradingview", {})
        tv_status = "✅ ENABLED" if tv_config.get("enabled") else "❌ DISABLED"
        print(f"   • TradingView: {tv_status}")
        if tv_config.get("username"):
            print(f"     └─ User: {tv_config['username']}")
        
        # Finviz status
        finviz_config = self.config.get("finviz", {})
        finviz_status = "✅ ENABLED" if finviz_config.get("enabled") else "❌ DISABLED"
        print(f"   • Finviz: {finviz_status}")
        
        # fiscal.ai status
        fiscal_config = self.config.get("fiscal_ai", {})
        fiscal_status = "✅ ENABLED" if fiscal_config.get("enabled") and fiscal_config.get("api_key") else "⏭️ AVAILABLE"
        print(f"   • fiscal.ai: {fiscal_status}")
        
        # Enhanced features
        print(f"\n🚀 Enhanced Features:")
        features = self.config.get("enhanced_features", {})
        for feature, enabled in features.items():
            status = "✅" if enabled else "⏭️"
            print(f"   {status} {feature.replace('_', ' ').title()}")
        
        # System capabilities
        print(f"\n📋 System Capabilities:")
        print("   ✅ Professional Market Data (TradingView)")
        print("   ✅ Sector Analysis & Top Movers (Finviz)")
        print("   ✅ Enhanced Technical Analysis")
        print("   ✅ Volatility Regime Detection")
        print("   ✅ Crypto Market Tracking")
        print("   ✅ PDF Generation (Professional)")
        print("   ✅ Audio Generation (Podcast Style)")
        print("   ✅ Notion Integration")
        print("   ✅ Automated Scheduling (5:00 AM Central)")
        
        print("="*70)

async def main():
    """Enhanced main entry point"""
    
    parser = argparse.ArgumentParser(description="Enhanced Daily Premarket Report System")
    parser.add_argument("--enhanced-example", action="store_true", 
                       help="Generate enhanced example report with premium data")
    parser.add_argument("--enhanced-status", action="store_true",
                       help="Show enhanced system status")
    parser.add_argument("--setup-config", action="store_true",
                       help="Setup enhanced data configuration")
    parser.add_argument("--output-dir", default="enhanced_reports",
                       help="Output directory for reports")
    
    args = parser.parse_args()
    
    if args.setup_config:
        # Setup enhanced configuration
        print("🔧 Setting up enhanced data configuration...")
        os.system("python3 setup_enhanced_config.py")
        return
    
    # Initialize enhanced system
    system = EnhancedDailyReportSystem(args.output_dir)
    
    if args.enhanced_example:
        # Generate enhanced example report
        await system.generate_enhanced_example_report()
        
    elif args.enhanced_status:
        # Show enhanced status
        system.show_enhanced_system_status()
        
    else:
        # Default: show help and status
        print("Enhanced Daily Premarket Report System")
        print("=" * 45)
        print("\nAvailable commands:")
        print("  --enhanced-example    Generate enhanced example report")
        print("  --enhanced-status     Show enhanced system status")
        print("  --setup-config        Setup enhanced data configuration")
        print("\nFor detailed help: python enhanced_main.py --help")
        
        system.show_enhanced_system_status()

if __name__ == "__main__":
    asyncio.run(main())