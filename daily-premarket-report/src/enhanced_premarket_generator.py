#!/usr/bin/env python3
"""
Enhanced Premarket Report Generator
==================================

Improved report generator incorporating feedback for premarket analysis
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import pytz
from dataclasses import dataclass, asdict
import yfinance as yf
import pandas as pd

try:
    from .report_generator import ReportData, MarketData, NewsItem, ReportGenerator
    from .unified_data_collector import UnifiedDataCollector
except ImportError:
    # For direct execution
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from report_generator import ReportData, MarketData, NewsItem, ReportGenerator
    from unified_data_collector import UnifiedDataCollector

logger = logging.getLogger(__name__)

@dataclass
class EarningsEvent:
    """Earnings event structure"""
    symbol: str
    company_name: str
    date: str
    day_of_week: str
    timing: str  # BMO (Before Market Open) or AMC (After Market Close)
    market_cap: Optional[str] = None
    sector: Optional[str] = None

class EnhancedPremarketGenerator(ReportGenerator):
    """Enhanced premarket report generator with improved analysis"""
    
    def __init__(self, schwab_credentials: Dict = None, tos_credentials: Dict = None):
        super().__init__()
        
        # Additional credentials for enhanced data
        self.schwab_creds = schwab_credentials
        self.tos_creds = tos_credentials
        
        # Initialize unified data collector with all three APIs
        self.data_collector = UnifiedDataCollector()
        
        # Major indices for closing data
        self.major_indices = {
            '^GSPC': 'S&P 500',
            '^IXIC': 'NASDAQ',
            '^RUT': 'Russell 2000', 
            '^DJI': 'Dow Jones',
            '^VIX': 'VIX'
        }
    
    async def generate_premarket_report(self) -> ReportData:
        """Generate enhanced premarket report with feedback incorporated"""
        
        logger.info("Starting enhanced premarket report generation...")
        
        try:
            # Get comprehensive market data from unified collector
            logger.info("Collecting comprehensive market data from all APIs...")
            market_data = await self.data_collector.get_enhanced_market_data()
            
            # Get sector rotation analysis from unified collector
            logger.info("Analyzing sector rotation...")
            sector_rotation = await self.data_collector.get_sector_rotation_data()
            
            # Get upcoming earnings from unified collector
            logger.info("Collecting upcoming earnings calendar...")
            earnings_calendar = await self.data_collector.get_earnings_calendar()
            
            # Get enhanced news with themes from unified collector
            logger.info("Collecting and analyzing market news...")
            news_items, news_themes = await self.data_collector.get_enhanced_news_and_sentiment()
            
            # Get economic calendar from unified collector
            logger.info("Collecting economic calendar...")
            economic_calendar = await self.data_collector.get_comprehensive_economic_calendar()
            
            # Generate enhanced sentiment analysis
            sentiment_analysis = await self._enhanced_sentiment_analysis(news_items, news_themes)
            
            # Generate executive summary
            executive_summary = self._generate_premarket_executive_summary(
                market_data.get('previous_close', {}), 
                market_data.get('overnight_futures', {}), 
                sentiment_analysis, 
                sector_rotation
            )
            
            # Enhanced risk assessment
            risk_assessment = self._generate_premarket_risk_assessment(
                sentiment_analysis, sector_rotation, earnings_calendar
            )
            
            # Compile enhanced report data
            report_data = ReportData(
                date=datetime.now().strftime("%Y-%m-%d"),
                executive_summary=executive_summary,
                market_performance={
                    "previous_close": market_data.get('previous_close', {}),
                    "overnight_futures": market_data.get('overnight_futures', {}),
                    "international": market_data.get('international', {}),
                    "current_prices": market_data.get('current_prices', {}),
                    "sector_rotation": sector_rotation
                },
                news_events=news_items,
                sector_analysis=sentiment_analysis,
                technical_analysis={},  # Empty dict to maintain compatibility
                economic_calendar=economic_calendar,
                risk_assessment=risk_assessment,
                earnings_calendar=earnings_calendar  # New field
            )
            
            logger.info("Enhanced premarket report generation completed")
            return report_data
            
        except Exception as e:
            logger.error(f"Error in enhanced premarket report generation: {e}")
            # Fallback to standard generation
            return await super().generate_daily_report()
    
    
    
    
    
    
    
    async def _enhanced_sentiment_analysis(self, news_items: List[NewsItem], themes: List[str]) -> Dict[str, Any]:
        """Enhanced sentiment analysis with themes"""
        
        # Base sentiment analysis
        total_impact = sum(item.impact_score for item in news_items)
        avg_impact = total_impact / len(news_items) if news_items else 0
        
        positive_news = [item for item in news_items if item.sentiment == "positive"]
        negative_news = [item for item in news_items if item.sentiment == "negative"]
        neutral_news = [item for item in news_items if item.sentiment == "neutral"]
        
        # Determine overall sentiment
        if len(positive_news) > len(negative_news):
            overall_sentiment = "positive"
        elif len(negative_news) > len(positive_news):
            overall_sentiment = "negative"
        else:
            overall_sentiment = "neutral"
        
        return {
            "overall_sentiment": overall_sentiment,
            "average_impact_score": round(avg_impact, 1),
            "positive_stories": len(positive_news),
            "negative_stories": len(negative_news),
            "neutral_stories": len(neutral_news),
            "key_themes": themes,
            "total_stories_analyzed": len(news_items)
        }
    
    def _generate_premarket_executive_summary(self, closing_data: Dict, futures_data: Dict, 
                                            sentiment_analysis: Dict, sector_rotation: Dict) -> Dict[str, Any]:
        """Generate executive summary for premarket analysis"""
        
        # Calculate market direction from futures
        futures_changes = [data.change_percent for data in futures_data.values()]
        avg_futures_change = sum(futures_changes) / len(futures_changes) if futures_changes else 0
        
        # Determine market sentiment
        if avg_futures_change > 0.3:
            market_sentiment = "bullish"
        elif avg_futures_change < -0.3:
            market_sentiment = "bearish"
        else:
            market_sentiment = "neutral"
        
        # Get sector leaders from rotation analysis
        leaders = sector_rotation.get('leaders', [])
        leader_sectors = [leader[0] for leader in leaders[:2]]
        
        # Key insights incorporating feedback
        key_insights = [
            f"Overnight futures {market_sentiment} with average change of {avg_futures_change:.2f}%",
            f"Previous session: {self._format_closing_summary(closing_data)}",
            f"Sector rotation: {leader_sectors[0] if leader_sectors else 'Technology'} leading weekly performance",
            f"News sentiment: {sentiment_analysis.get('overall_sentiment', 'neutral')} across {sentiment_analysis.get('total_stories_analyzed', 0)} stories",
            f"VIX closed at {closing_data.get('VIX').current_price if closing_data.get('VIX') else 20:.1f} indicating {'low volatility' if (closing_data.get('VIX').current_price if closing_data.get('VIX') else 20) < 20 else 'normal conditions'}"
        ]
        
        return {
            "market_sentiment": market_sentiment,
            "key_insights": key_insights,
            "recommended_actions": [
                f"Monitor {leader_sectors[0] if leader_sectors else 'Technology'} sector for continued leadership",
                "Watch futures reaction to overnight developments",
                "Prepare for volatility around upcoming earnings releases",
                "Review sector allocation based on weekly rotation patterns"
            ]
        }
    
    def _format_closing_summary(self, closing_data: Dict) -> str:
        """Format previous session closing summary"""
        
        spx_data = closing_data.get('S&P 500')
        
        if spx_data:
            direction = "higher" if spx_data.change > 0 else "lower"
            return f"S&P 500 closed {direction} at {spx_data.current_price} ({spx_data.change_percent:+.2f}%)"
        else:
            return "mixed session with sector rotation"
    
    def _generate_premarket_risk_assessment(self, sentiment_analysis: Dict, sector_rotation: Dict, 
                                          earnings_calendar: List) -> Dict[str, Any]:
        """Generate risk assessment incorporating earnings and sector rotation"""
        
        # Assess risk from various factors
        risk_factors = []
        opportunities = []
        
        # VIX-based risk - simplified without technical analysis
        # Note: VIX risk assessment would be done with real VIX data in production
        
        # Earnings risk
        if earnings_calendar:
            high_profile_earnings = [e for e in earnings_calendar if isinstance(e, dict) and e.get('market_cap') == 'Large']
            if len(high_profile_earnings) >= 3:
                risk_factors.append(f"Heavy earnings calendar with {len(high_profile_earnings)} major releases")
        
        # Sector rotation risk/opportunity
        rotation_strength = sector_rotation.get('rotation_strength', 'moderate')
        if rotation_strength == 'strong':
            opportunities.append("Strong sector rotation creating alpha opportunities")
        elif rotation_strength == 'weak':
            risk_factors.append("Weak sector rotation suggesting broad market uncertainty")
        
        # News sentiment risk
        if sentiment_analysis.get('negative_stories', 0) > sentiment_analysis.get('positive_stories', 0):
            risk_factors.append("Negative news sentiment bias")
        
        # Default risk factors if none detected
        if not risk_factors:
            risk_factors = ["Standard market volatility", "Geopolitical uncertainties"]
        
        # Default opportunities if none detected  
        if not opportunities:
            opportunities = ["Sector rotation opportunities", "Individual stock selection alpha"]
        
        return {
            "overall_risk_level": "medium",  # Could be enhanced with scoring
            "primary_risks": risk_factors,
            "opportunity_areas": opportunities,
            "earnings_focus": [f"{e.get('symbol', 'N/A')} ({e.get('timing', 'AMC')})" if isinstance(e, dict) else str(e) for e in earnings_calendar[:3]]
        }

async def main():
    """Test enhanced premarket generator"""
    
    generator = EnhancedPremarketGenerator()
    report_data = await generator.generate_premarket_report()
    
    # Save report
    output_dir = "enhanced_premarket_reports"
    os.makedirs(output_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d")
    report_file = f"{output_dir}/enhanced_premarket_report_{timestamp}.json"
    
    with open(report_file, 'w') as f:
        json.dump(asdict(report_data), f, indent=2, default=str)
    
    logger.info(f"Enhanced premarket report saved to {report_file}")
    return report_data

if __name__ == "__main__":
    asyncio.run(main())