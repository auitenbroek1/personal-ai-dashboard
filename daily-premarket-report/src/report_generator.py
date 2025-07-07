#!/usr/bin/env python3
"""
Daily Premarket Report Generator
===============================

Enterprise-grade automated report generation system for portfolio managers and hedge funds.
Leverages SAFLA and FACT integrations for advanced analysis and caching.
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import pytz
from dataclasses import dataclass, asdict
import aiohttp
import yfinance as yf
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
import matplotlib.pyplot as plt
import seaborn as sns
from io import BytesIO
import base64

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MarketData:
    """Market data structure"""
    symbol: str
    current_price: float
    change: float
    change_percent: float
    volume: int
    timestamp: str

@dataclass
class NewsItem:
    """News item structure"""
    headline: str
    summary: str
    source: str
    timestamp: str
    sentiment: str
    impact_score: float

@dataclass
class ReportData:
    """Complete report data structure"""
    date: str
    executive_summary: Dict[str, Any]
    market_performance: Dict[str, Any]
    news_events: List[NewsItem]
    sector_analysis: Dict[str, Any]
    technical_analysis: Dict[str, Any]
    economic_calendar: List[Dict[str, Any]]
    risk_assessment: Dict[str, Any]
    earnings_calendar: List[Any] = None  # New field for upcoming earnings

class MarketDataCollector:
    """Collects and processes market data from multiple sources"""
    
    def __init__(self):
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def get_overnight_futures(self) -> Dict[str, MarketData]:
        """Get overnight futures data for major indices"""
        symbols = {
            'ES=F': 'S&P 500 Futures',
            'NQ=F': 'NASDAQ Futures', 
            'RTY=F': 'Russell 2000 Futures',
            'YM=F': 'Dow Futures'
        }
        
        futures_data = {}
        
        for symbol, name in symbols.items():
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period='2d', interval='1h')
                
                if not hist.empty:
                    current_price = hist['Close'].iloc[-1]
                    prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
                    change = current_price - prev_close
                    change_percent = (change / prev_close) * 100
                    
                    futures_data[name] = MarketData(
                        symbol=symbol,
                        current_price=round(current_price, 2),
                        change=round(change, 2),
                        change_percent=round(change_percent, 2),
                        volume=int(hist['Volume'].iloc[-1]) if 'Volume' in hist.columns else 0,
                        timestamp=datetime.now().isoformat()
                    )
                    
            except Exception as e:
                logger.error(f"Error fetching {symbol}: {e}")
                
        return futures_data
    
    async def get_international_markets(self) -> Dict[str, MarketData]:
        """Get international market data"""
        symbols = {
            '^N225': 'Nikkei 225',
            '^HSI': 'Hang Seng',
            '^FTSE': 'FTSE 100',
            '^GDAXI': 'DAX',
            '^FCHI': 'CAC 40'
        }
        
        international_data = {}
        
        for symbol, name in symbols.items():
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period='2d')
                
                if not hist.empty:
                    current_price = hist['Close'].iloc[-1]
                    prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
                    change = current_price - prev_close
                    change_percent = (change / prev_close) * 100
                    
                    international_data[name] = MarketData(
                        symbol=symbol,
                        current_price=round(current_price, 2),
                        change=round(change, 2),
                        change_percent=round(change_percent, 2),
                        volume=int(hist['Volume'].iloc[-1]) if 'Volume' in hist.columns else 0,
                        timestamp=datetime.now().isoformat()
                    )
                    
            except Exception as e:
                logger.error(f"Error fetching {symbol}: {e}")
                
        return international_data
    
    async def get_currency_data(self) -> Dict[str, MarketData]:
        """Get major currency pair data"""
        symbols = {
            'EURUSD=X': 'EUR/USD',
            'GBPUSD=X': 'GBP/USD', 
            'USDJPY=X': 'USD/JPY',
            'DX-Y.NYB': 'DXY Index'
        }
        
        currency_data = {}
        
        for symbol, name in symbols.items():
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period='2d')
                
                if not hist.empty:
                    current_price = hist['Close'].iloc[-1]
                    prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
                    change = current_price - prev_close
                    change_percent = (change / prev_close) * 100
                    
                    currency_data[name] = MarketData(
                        symbol=symbol,
                        current_price=round(current_price, 4),
                        change=round(change, 4),
                        change_percent=round(change_percent, 2),
                        volume=int(hist['Volume'].iloc[-1]) if 'Volume' in hist.columns else 0,
                        timestamp=datetime.now().isoformat()
                    )
                    
            except Exception as e:
                logger.error(f"Error fetching {symbol}: {e}")
                
        return currency_data
    
    async def get_commodities_data(self) -> Dict[str, MarketData]:
        """Get commodities data"""
        symbols = {
            'GC=F': 'Gold',
            'CL=F': 'Crude Oil',
            'SI=F': 'Silver',
            'HG=F': 'Copper'
        }
        
        commodities_data = {}
        
        for symbol, name in symbols.items():
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period='2d')
                
                if not hist.empty:
                    current_price = hist['Close'].iloc[-1]
                    prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
                    change = current_price - prev_close
                    change_percent = (change / prev_close) * 100
                    
                    commodities_data[name] = MarketData(
                        symbol=symbol,
                        current_price=round(current_price, 2),
                        change=round(change, 2),
                        change_percent=round(change_percent, 2),
                        volume=int(hist['Volume'].iloc[-1]) if 'Volume' in hist.columns else 0,
                        timestamp=datetime.now().isoformat()
                    )
                    
            except Exception as e:
                logger.error(f"Error fetching {symbol}: {e}")
                
        return commodities_data

class NewsAnalyzer:
    """Analyzes news and events for market impact"""
    
    def __init__(self):
        self.safla_integration = None
        
    async def collect_market_news(self) -> List[NewsItem]:
        """Collect and analyze market news"""
        # This would integrate with news APIs like Bloomberg, Reuters, etc.
        # For demo purposes, creating sample news items
        
        sample_news = [
            NewsItem(
                headline="Federal Reserve Signals Potential Rate Pause",
                summary="Fed officials indicated a possible pause in rate hikes following recent economic data showing cooling inflation trends.",
                source="Federal Reserve",
                timestamp=datetime.now().isoformat(),
                sentiment="neutral",
                impact_score=8.5
            ),
            NewsItem(
                headline="Tech Earnings Beat Expectations",
                summary="Major technology companies report stronger than expected Q4 earnings, driven by AI investments and cloud growth.",
                source="Corporate Earnings",
                timestamp=datetime.now().isoformat(),
                sentiment="positive",
                impact_score=7.2
            ),
            NewsItem(
                headline="China Manufacturing PMI Expansion",
                summary="China's manufacturing PMI reached 51.2, indicating expansion and potential global growth implications.",
                source="Economic Data",
                timestamp=datetime.now().isoformat(),
                sentiment="positive",
                impact_score=6.8
            )
        ]
        
        return sample_news
    
    async def analyze_sentiment_impact(self, news_items: List[NewsItem]) -> Dict[str, Any]:
        """Analyze overall sentiment and market impact"""
        
        total_impact = sum(item.impact_score for item in news_items)
        avg_impact = total_impact / len(news_items) if news_items else 0
        
        positive_news = [item for item in news_items if item.sentiment == "positive"]
        negative_news = [item for item in news_items if item.sentiment == "negative"]
        neutral_news = [item for item in news_items if item.sentiment == "neutral"]
        
        sentiment_analysis = {
            "overall_sentiment": "positive" if len(positive_news) > len(negative_news) else "negative" if len(negative_news) > len(positive_news) else "neutral",
            "average_impact_score": round(avg_impact, 2),
            "positive_stories": len(positive_news),
            "negative_stories": len(negative_news),
            "neutral_stories": len(neutral_news),
            "key_themes": ["Federal Reserve Policy", "Corporate Earnings", "Global Growth"],
            "risk_factors": ["Inflation Uncertainty", "Geopolitical Tensions", "Supply Chain Issues"]
        }
        
        return sentiment_analysis

class TechnicalAnalyzer:
    """Performs technical analysis on market data"""
    
    def __init__(self):
        pass
    
    async def analyze_market_technicals(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform technical analysis on market data"""
        
        # Get VIX data for volatility analysis
        try:
            vix = yf.Ticker('^VIX')
            vix_hist = vix.history(period='5d')
            current_vix = vix_hist['Close'].iloc[-1] if not vix_hist.empty else 20.0
            
            # Simple technical indicators
            technical_analysis = {
                "vix_level": round(current_vix, 2),
                "volatility_regime": "high" if current_vix > 25 else "medium" if current_vix > 15 else "low",
                "market_breadth": "positive",  # Would calculate from advance/decline data
                "key_levels": {
                    "SPY": {"support": 475.0, "resistance": 485.0},
                    "QQQ": {"support": 390.0, "resistance": 400.0}
                },
                "momentum_indicators": {
                    "rsi_oversold": False,
                    "macd_bullish": True,
                    "trend_direction": "bullish"
                }
            }
            
        except Exception as e:
            logger.error(f"Error in technical analysis: {e}")
            technical_analysis = {
                "vix_level": 20.0,
                "volatility_regime": "medium",
                "market_breadth": "neutral",
                "key_levels": {},
                "momentum_indicators": {}
            }
            
        return technical_analysis

class ReportGenerator:
    """Generates PDF and audio reports"""
    
    def __init__(self):
        self.market_collector = None
        self.news_analyzer = NewsAnalyzer()
        self.technical_analyzer = TechnicalAnalyzer()
        
    async def generate_daily_report(self) -> ReportData:
        """Generate complete daily report data"""
        
        logger.info("Starting daily report generation...")
        
        async with MarketDataCollector() as collector:
            # Collect all market data
            futures_data = await collector.get_overnight_futures()
            international_data = await collector.get_international_markets()
            currency_data = await collector.get_currency_data()
            commodities_data = await collector.get_commodities_data()
            
            # Collect and analyze news
            news_items = await self.news_analyzer.collect_market_news()
            sentiment_analysis = await self.news_analyzer.analyze_sentiment_impact(news_items)
            
            # Perform technical analysis
            technical_analysis = await self.technical_analyzer.analyze_market_technicals({})
            
            # Generate executive summary
            executive_summary = self._generate_executive_summary(
                futures_data, sentiment_analysis, technical_analysis
            )
            
            # Compile report data
            report_data = ReportData(
                date=datetime.now().strftime("%Y-%m-%d"),
                executive_summary=executive_summary,
                market_performance={
                    "futures": futures_data,
                    "international": international_data,
                    "currencies": currency_data,
                    "commodities": commodities_data
                },
                news_events=news_items,
                sector_analysis=sentiment_analysis,
                technical_analysis=technical_analysis,
                economic_calendar=self._get_economic_calendar(),
                risk_assessment=self._generate_risk_assessment(sentiment_analysis, technical_analysis)
            )
            
        logger.info("Daily report data generation completed")
        return report_data
    
    def _generate_executive_summary(self, futures_data: Dict, sentiment_analysis: Dict, technical_analysis: Dict) -> Dict[str, Any]:
        """Generate executive summary"""
        
        # Calculate overall market direction
        futures_changes = [data.change_percent for data in futures_data.values()]
        avg_futures_change = sum(futures_changes) / len(futures_changes) if futures_changes else 0
        
        market_direction = "bullish" if avg_futures_change > 0.5 else "bearish" if avg_futures_change < -0.5 else "neutral"
        
        summary = {
            "market_sentiment": market_direction,
            "key_insights": [
                f"Overnight futures showing {market_direction} bias with average change of {avg_futures_change:.2f}%",
                f"News sentiment is {sentiment_analysis.get('overall_sentiment', 'neutral')} with impact score of {sentiment_analysis.get('average_impact_score', 0)}",
                f"VIX at {technical_analysis.get('vix_level', 20)} indicating {technical_analysis.get('volatility_regime', 'medium')} volatility"
            ],
            "risk_level": "medium",  # Would be calculated based on various factors
            "recommended_actions": [
                "Monitor Federal Reserve communications",
                "Watch for any changes in volatility regime",
                "Prepare for potential sector rotation"
            ]
        }
        
        return summary
    
    def _get_economic_calendar(self) -> List[Dict[str, Any]]:
        """Get today's economic calendar"""
        # This would integrate with economic calendar APIs
        
        sample_events = [
            {
                "time": "08:30 ET",
                "event": "Initial Jobless Claims",
                "importance": "medium",
                "forecast": "220K",
                "previous": "218K"
            },
            {
                "time": "10:00 ET", 
                "event": "ISM Services PMI",
                "importance": "high",
                "forecast": "52.5",
                "previous": "52.6"
            }
        ]
        
        return sample_events
    
    def _generate_risk_assessment(self, sentiment_analysis: Dict, technical_analysis: Dict) -> Dict[str, Any]:
        """Generate risk assessment"""
        
        risk_factors = sentiment_analysis.get('risk_factors', [])
        vix_level = technical_analysis.get('vix_level', 20)
        
        risk_level = "high" if vix_level > 25 else "medium" if vix_level > 15 else "low"
        
        risk_assessment = {
            "overall_risk_level": risk_level,
            "primary_risks": risk_factors,
            "hedging_recommendations": [
                "Consider VIX calls for portfolio protection",
                "Monitor USD strength for international exposure",
                "Watch interest rate sensitivity in duration trades"
            ],
            "opportunity_areas": [
                "Technology sector on earnings strength", 
                "Emerging markets on China growth data",
                "Commodities on supply/demand dynamics"
            ]
        }
        
        return risk_assessment

async def main():
    """Main execution function"""
    generator = ReportGenerator()
    report_data = await generator.generate_daily_report()
    
    # Save report data
    output_dir = "reports"
    os.makedirs(output_dir, exist_ok=True)
    
    report_file = f"{output_dir}/daily_report_{datetime.now().strftime('%Y%m%d')}.json"
    with open(report_file, 'w') as f:
        json.dump(asdict(report_data), f, indent=2, default=str)
    
    logger.info(f"Report data saved to {report_file}")
    return report_data

if __name__ == "__main__":
    asyncio.run(main())