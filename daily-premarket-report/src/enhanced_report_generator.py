#!/usr/bin/env python3
"""
Enhanced Report Generator
========================

Enhanced report generation using TradingView, fiscal.ai, and Finviz data
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import pytz
from dataclasses import dataclass, asdict

from report_generator import ReportData, MarketData, NewsItem, ReportGenerator
from enhanced_data_collector import EnhancedDataCollector, TradingViewData
from forexfactory_collector import get_forexfactory_calendar
from finviz_news_collector import get_finviz_news

logger = logging.getLogger(__name__)

class EnhancedReportGenerator(ReportGenerator):
    """Enhanced report generator using premium data sources"""
    
    def __init__(self, tradingview_username: str = "auitenbroek", 
                 tradingview_key: str = None, fiscal_ai_key: str = None):
        super().__init__()
        
        self.tradingview_username = tradingview_username
        self.data_collector = EnhancedDataCollector(
            tradingview_key=tradingview_key,
            fiscal_ai_key=fiscal_ai_key
        )
        
    async def generate_enhanced_daily_report(self) -> ReportData:
        """Generate daily report using enhanced data sources"""
        
        logger.info("Starting enhanced daily report generation with premium data sources...")
        
        try:
            # Collect enhanced data from all premium sources
            enhanced_data = await self.data_collector.collect_comprehensive_data()
            
            # Convert TradingView data to MarketData format
            market_performance = self._convert_enhanced_data(enhanced_data)
            
            # Get enhanced news analysis from Finviz
            logger.info("Collecting news from Finviz...")
            news_items = await get_finviz_news(max_articles=10)
            
            # Perform enhanced technical analysis
            technical_analysis = await self._enhanced_technical_analysis(enhanced_data)
            
            # Generate enhanced sentiment analysis
            sentiment_analysis = await self._enhanced_sentiment_analysis(news_items, enhanced_data)
            
            # Generate executive summary with enhanced insights
            executive_summary = self._generate_enhanced_executive_summary(
                market_performance, sentiment_analysis, technical_analysis, enhanced_data
            )
            
            # Enhanced economic calendar from ForexFactory
            logger.info("Collecting economic calendar from ForexFactory...")
            economic_calendar = await get_forexfactory_calendar()
            
            # Enhanced risk assessment
            risk_assessment = self._generate_enhanced_risk_assessment(
                sentiment_analysis, technical_analysis, enhanced_data
            )
            
            # Compile enhanced report data
            report_data = ReportData(
                date=datetime.now().strftime("%Y-%m-%d"),
                executive_summary=executive_summary,
                market_performance=market_performance,
                news_events=news_items,
                sector_analysis=sentiment_analysis,
                technical_analysis=technical_analysis,
                economic_calendar=economic_calendar,
                risk_assessment=risk_assessment
            )
            
            logger.info("Enhanced daily report generation completed")
            return report_data
            
        except Exception as e:
            logger.error(f"Error in enhanced report generation: {e}")
            # Fallback to standard report generation
            logger.info("Falling back to standard report generation...")
            return await super().generate_daily_report()
    
    def _convert_enhanced_data(self, enhanced_data: Dict) -> Dict[str, Any]:
        """Convert enhanced data to standard MarketData format"""
        
        market_performance = {
            "futures": {},
            "international": {},
            "currencies": {},
            "commodities": {},
            "crypto": {},
            "enhanced_metrics": {}
        }
        
        # Convert TradingView futures data
        if "futures" in enhanced_data:
            for symbol, tv_data in enhanced_data["futures"].items():
                if isinstance(tv_data, dict):  # TradingViewData object as dict
                    market_performance["futures"][symbol] = MarketData(
                        symbol=tv_data.get("symbol", symbol),
                        current_price=tv_data.get("price", 0),
                        change=tv_data.get("change", 0),
                        change_percent=tv_data.get("change_percent", 0),
                        volume=tv_data.get("volume", 0),
                        timestamp=datetime.now().isoformat()
                    )
        
        # Convert international indices
        if "international" in enhanced_data:
            for symbol, tv_data in enhanced_data["international"].items():
                if isinstance(tv_data, dict):
                    market_performance["international"][symbol] = MarketData(
                        symbol=tv_data.get("symbol", symbol),
                        current_price=tv_data.get("price", 0),
                        change=tv_data.get("change", 0),
                        change_percent=tv_data.get("change_percent", 0),
                        volume=tv_data.get("volume", 0),
                        timestamp=datetime.now().isoformat()
                    )
        
        # Add crypto data
        if "crypto" in enhanced_data:
            for symbol, tv_data in enhanced_data["crypto"].items():
                if isinstance(tv_data, dict):
                    market_performance["crypto"][symbol] = MarketData(
                        symbol=tv_data.get("symbol", symbol),
                        current_price=tv_data.get("price", 0),
                        change=tv_data.get("change", 0),
                        change_percent=tv_data.get("change_percent", 0),
                        volume=tv_data.get("volume", 0),
                        timestamp=datetime.now().isoformat()
                    )
        
        # Add enhanced metrics from Finviz
        if "market_overview" in enhanced_data:
            market_performance["enhanced_metrics"]["finviz_overview"] = enhanced_data["market_overview"]
        
        if "sector_performance" in enhanced_data:
            market_performance["enhanced_metrics"]["sector_performance"] = enhanced_data["sector_performance"]
        
        if "top_movers" in enhanced_data:
            market_performance["enhanced_metrics"]["top_movers"] = enhanced_data["top_movers"]
        
        return market_performance
    
    async def _enhanced_technical_analysis(self, enhanced_data: Dict) -> Dict[str, Any]:
        """Enhanced technical analysis using premium data"""
        
        technical_analysis = {
            "data_sources": ["TradingView", "Finviz"],
            "vix_level": 20.0,  # Would get from TradingView
            "volatility_regime": "medium",
            "market_breadth": "neutral",
            "sector_rotation": {},
            "key_levels": {},
            "momentum_indicators": {},
            "enhanced_insights": []
        }
        
        # Analyze sector performance from Finviz
        if "sector_performance" in enhanced_data:
            sector_perf = enhanced_data["sector_performance"]
            if sector_perf:
                best_sector = max(sector_perf.items(), key=lambda x: x[1])
                worst_sector = min(sector_perf.items(), key=lambda x: x[1])
                
                technical_analysis["sector_rotation"] = {
                    "best_performing": {"sector": best_sector[0], "performance": best_sector[1]},
                    "worst_performing": {"sector": worst_sector[0], "performance": worst_sector[1]},
                    "overall_sentiment": "positive" if sum(sector_perf.values()) > 0 else "negative"
                }
                
                technical_analysis["enhanced_insights"].append(
                    f"Sector rotation favors {best_sector[0]} (+{best_sector[1]:.1f}%) over {worst_sector[0]} ({worst_sector[1]:.1f}%)"
                )
        
        # Analyze top movers for momentum
        if "top_movers" in enhanced_data:
            movers = enhanced_data["top_movers"]
            if movers.get("gainers"):
                technical_analysis["enhanced_insights"].append(
                    f"Top gainers show strong momentum: {', '.join(movers['gainers'][:3])}"
                )
        
        # Enhanced VIX analysis from market overview
        if "market_overview" in enhanced_data:
            overview = enhanced_data["market_overview"]
            if "VIX" in overview:
                try:
                    vix_value = float(overview["VIX"].replace('%', ''))
                    technical_analysis["vix_level"] = vix_value
                    technical_analysis["volatility_regime"] = (
                        "high" if vix_value > 25 else 
                        "medium" if vix_value > 15 else "low"
                    )
                except:
                    pass
        
        # TradingView futures analysis
        if "futures" in enhanced_data:
            futures_data = enhanced_data["futures"]
            for symbol, data in futures_data.items():
                if isinstance(data, dict) and "price" in data:
                    # Simplified support/resistance calculation
                    price = data["price"]
                    technical_analysis["key_levels"][symbol] = {
                        "current": price,
                        "support": round(price * 0.98, 2),  # 2% below
                        "resistance": round(price * 1.02, 2)  # 2% above
                    }
        
        return technical_analysis
    
    async def _enhanced_sentiment_analysis(self, news_items: List[NewsItem], 
                                         enhanced_data: Dict) -> Dict[str, Any]:
        """Enhanced sentiment analysis using multiple data sources"""
        
        # Use the news analyzer from parent class
        sentiment_analysis = await self.news_analyzer.analyze_sentiment_impact(news_items)
        
        # Add enhanced insights from market data
        sentiment_analysis["data_sources"] = ["News Analysis", "TradingView", "Finviz"]
        
        # Incorporate sector sentiment from Finviz
        if "sector_performance" in enhanced_data:
            sector_perf = enhanced_data["sector_performance"]
            positive_sectors = [s for s, p in sector_perf.items() if p > 0]
            negative_sectors = [s for s, p in sector_perf.items() if p < 0]
            
            sentiment_analysis["sector_sentiment"] = {
                "positive_sectors": positive_sectors,
                "negative_sectors": negative_sectors,
                "sector_balance": len(positive_sectors) - len(negative_sectors)
            }
        
        # Enhanced market themes based on data
        enhanced_themes = sentiment_analysis.get("key_themes", [])
        
        if "top_movers" in enhanced_data:
            movers = enhanced_data["top_movers"]
            if movers.get("gainers"):
                enhanced_themes.append("Strong Individual Stock Performance")
            if movers.get("losers"):
                enhanced_themes.append("Selective Weakness in Equities")
        
        sentiment_analysis["enhanced_themes"] = enhanced_themes
        
        return sentiment_analysis
    
    def _generate_enhanced_executive_summary(self, market_performance: Dict, 
                                           sentiment_analysis: Dict, 
                                           technical_analysis: Dict,
                                           enhanced_data: Dict) -> Dict[str, Any]:
        """Generate enhanced executive summary with premium insights"""
        
        # Calculate enhanced market direction
        futures_changes = []
        if "futures" in market_performance:
            for data in market_performance["futures"].values():
                if hasattr(data, 'change_percent'):
                    futures_changes.append(data.change_percent)
        
        avg_futures_change = sum(futures_changes) / len(futures_changes) if futures_changes else 0
        
        # Enhanced market sentiment based on multiple factors
        sector_sentiment = sentiment_analysis.get("sector_sentiment", {})
        sector_balance = sector_sentiment.get("sector_balance", 0)
        
        market_direction = "bullish" if (avg_futures_change > 0.3 and sector_balance > 0) else \
                          "bearish" if (avg_futures_change < -0.3 and sector_balance < 0) else "neutral"
        
        # Enhanced key insights
        enhanced_insights = [
            f"Overnight futures showing {market_direction} bias with average change of {avg_futures_change:.2f}%",
            f"Sector rotation: {sector_balance} net positive sectors with {technical_analysis.get('sector_rotation', {}).get('best_performing', {}).get('sector', 'Technology')} leading",
            f"Volatility regime: {technical_analysis.get('volatility_regime', 'medium')} (VIX: {technical_analysis.get('vix_level', 20):.1f})",
            f"News sentiment: {sentiment_analysis.get('overall_sentiment', 'neutral')} with {len(sentiment_analysis.get('enhanced_themes', []))} key themes"
        ]
        
        # Add TradingView specific insights
        if enhanced_data.get("futures"):
            enhanced_insights.append(f"TradingView data shows {len(enhanced_data['futures'])} futures contracts tracked")
        
        # Enhanced recommended actions
        enhanced_actions = [
            "Monitor sector rotation dynamics for positioning opportunities",
            f"Watch {technical_analysis.get('sector_rotation', {}).get('best_performing', {}).get('sector', 'leading')} sector momentum",
            "Track volatility regime changes for risk management",
            "Review top movers for individual stock opportunities"
        ]
        
        # Add Finviz-specific actions
        if enhanced_data.get("top_movers"):
            enhanced_actions.append("Consider top gainers for momentum plays")
        
        summary = {
            "market_sentiment": market_direction,
            "key_insights": enhanced_insights,
            "risk_level": "medium",  # Enhanced calculation would go here
            "recommended_actions": enhanced_actions,
            "data_quality": "premium",
            "sources": ["TradingView", "fiscal.ai", "Finviz"]
        }
        
        return summary
    
    def _get_enhanced_economic_calendar(self, enhanced_data: Dict) -> List[Dict[str, Any]]:
        """Enhanced economic calendar with earnings from fiscal.ai"""
        
        calendar_events = super()._get_economic_calendar()
        
        # Add earnings data from fiscal.ai
        if "earnings_calendar" in enhanced_data:
            earnings = enhanced_data["earnings_calendar"]
            for earning in earnings[:5]:  # Top 5 earnings
                calendar_events.append({
                    "time": earning.get("time", "Market Open"),
                    "event": f"{earning.get('symbol', 'Unknown')} Earnings",
                    "importance": "high" if earning.get("market_cap", 0) > 10e9 else "medium",
                    "forecast": earning.get("eps_estimate", "N/A"),
                    "previous": earning.get("eps_previous", "N/A"),
                    "source": "fiscal.ai"
                })
        
        return calendar_events
    
    def _generate_enhanced_risk_assessment(self, sentiment_analysis: Dict, 
                                         technical_analysis: Dict,
                                         enhanced_data: Dict) -> Dict[str, Any]:
        """Enhanced risk assessment using premium data"""
        
        base_assessment = super()._generate_risk_assessment(sentiment_analysis, technical_analysis)
        
        # Enhanced risk factors based on premium data
        enhanced_risks = base_assessment.get("primary_risks", [])
        
        # Add sector-specific risks
        if "sector_performance" in enhanced_data:
            sector_perf = enhanced_data["sector_performance"]
            weak_sectors = [s for s, p in sector_perf.items() if p < -2.0]
            if weak_sectors:
                enhanced_risks.append(f"Sector weakness in {', '.join(weak_sectors[:2])}")
        
        # Add volatility-based risks
        vix_level = technical_analysis.get("vix_level", 20)
        if vix_level > 25:
            enhanced_risks.append("Elevated volatility environment (VIX > 25)")
        
        # Enhanced opportunities
        enhanced_opportunities = base_assessment.get("opportunity_areas", [])
        
        if "top_movers" in enhanced_data:
            movers = enhanced_data["top_movers"]
            if movers.get("gainers"):
                enhanced_opportunities.append("Momentum opportunities in top gainers")
        
        # Sector opportunities
        if technical_analysis.get("sector_rotation", {}).get("best_performing"):
            best_sector = technical_analysis["sector_rotation"]["best_performing"]["sector"]
            enhanced_opportunities.append(f"{best_sector} sector showing relative strength")
        
        base_assessment.update({
            "primary_risks": enhanced_risks,
            "opportunity_areas": enhanced_opportunities,
            "data_quality": "premium",
            "risk_sources": ["TradingView", "Finviz", "fiscal.ai"]
        })
        
        return base_assessment

async def main():
    """Test enhanced report generation"""
    
    # Test with your TradingView username
    generator = EnhancedReportGenerator(
        tradingview_username="auitenbroek"
        # Add API keys as environment variables or parameters
    )
    
    report_data = await generator.generate_enhanced_daily_report()
    
    # Save enhanced report
    output_dir = "enhanced_reports"
    os.makedirs(output_dir, exist_ok=True)
    
    report_file = f"{output_dir}/enhanced_daily_report_{datetime.now().strftime('%Y%m%d')}.json"
    with open(report_file, 'w') as f:
        json.dump(asdict(report_data), f, indent=2, default=str)
    
    logger.info(f"Enhanced report saved to {report_file}")
    return report_data

if __name__ == "__main__":
    asyncio.run(main())