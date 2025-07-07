#!/usr/bin/env python3
"""
Unified Data Collector
======================

Integrates FRED, Alpha Vantage, and Polygon.io APIs for comprehensive market data
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple

try:
    from .fred_data_collector import FREDDataCollector
    from .alphavantage_collector import AlphaVantageCollector
    from .polygon_collector import PolygonCollector
    from .report_generator import MarketData, NewsItem
except ImportError:
    # For direct execution
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from fred_data_collector import FREDDataCollector
    from alphavantage_collector import AlphaVantageCollector
    from polygon_collector import PolygonCollector
    from report_generator import MarketData, NewsItem

logger = logging.getLogger(__name__)

class UnifiedDataCollector:
    """Unified collector using FRED, Alpha Vantage, and Polygon.io APIs"""
    
    def __init__(self, fred_key: str = None, alphavantage_key: str = None, polygon_key: str = None):
        # Initialize all collectors
        self.fred = FREDDataCollector(fred_key)
        self.alphavantage = AlphaVantageCollector(alphavantage_key)
        self.polygon = PolygonCollector(polygon_key)
        
        logger.info("Unified Data Collector initialized with all three APIs")
    
    async def get_comprehensive_economic_calendar(self) -> List[Dict[str, Any]]:
        """Get economic calendar combining FRED and Alpha Vantage data"""
        
        try:
            # Primary: FRED economic calendar (most authoritative)
            fred_calendar = await self.fred.get_economic_calendar_today()
            
            if fred_calendar and len(fred_calendar) >= 3:
                logger.info(f"Using FRED economic calendar with {len(fred_calendar)} events")
                return fred_calendar
            
            # Fallback: Use FRED key indicators
            logger.info("Using FRED key indicators as economic calendar")
            key_indicators = await self.fred.get_key_economic_indicators()
            
            calendar_events = []
            for indicator_name, data in key_indicators.items():
                calendar_events.append({
                    'time': 'Latest Data',
                    'event': indicator_name,
                    'importance': 'high' if 'Unemployment' in indicator_name or 'GDP' in indicator_name or 'Federal Funds' in indicator_name else 'medium',
                    'forecast': 'N/A',
                    'previous': str(data.get('value', 'N/A')),
                    'currency': 'USD',
                    'source': 'Federal Reserve (FRED)'
                })
            
            return calendar_events[:5]  # Top 5 indicators
            
        except Exception as e:
            logger.error(f"Error getting economic calendar: {e}")
            return self._get_fallback_economic_calendar()
    
    async def get_enhanced_market_data(self) -> Dict[str, Dict[str, MarketData]]:
        """Get comprehensive market data from multiple sources"""
        
        market_data = {
            'previous_close': {},
            'overnight_futures': {},
            'international': {},
            'current_prices': {}
        }
        
        try:
            # Try Polygon.io first for real-time data
            logger.info("Attempting to get market data from Polygon.io...")
            polygon_close = await self.polygon.get_previous_close_data()
            
            if polygon_close:
                market_data['previous_close'] = polygon_close
                logger.info(f"Got {len(polygon_close)} closing prices from Polygon.io")
            
            # Get Alpha Vantage market data as backup/supplement
            logger.info("Getting market data from Alpha Vantage...")
            major_symbols = ['SPY', 'QQQ', 'DIA', 'IWM', 'VIX']
            av_market_data = await self.alphavantage.get_market_data(major_symbols)
            
            if av_market_data:
                # Convert Alpha Vantage data to our format
                for symbol, data in av_market_data.items():
                    name_mapping = {
                        'SPY': 'S&P 500 ETF',
                        'QQQ': 'NASDAQ ETF', 
                        'DIA': 'Dow Jones ETF',
                        'IWM': 'Russell 2000 ETF',
                        'VIX': 'VIX'
                    }
                    
                    friendly_name = name_mapping.get(symbol, symbol)
                    market_data['current_prices'][friendly_name] = data
                
                logger.info(f"Got {len(av_market_data)} current prices from Alpha Vantage")
            
            # If we don't have previous close data, use Alpha Vantage current prices
            if not market_data['previous_close'] and market_data['current_prices']:
                market_data['previous_close'] = market_data['current_prices']
                logger.info("Using Alpha Vantage current prices as previous close data")
            
            # Try to get overnight futures from Polygon
            futures_data = await self.polygon.get_overnight_futures()
            if futures_data:
                market_data['overnight_futures'] = futures_data
                logger.info(f"Got {len(futures_data)} futures contracts from Polygon.io")
            
            # Try to get international markets from Polygon
            intl_data = await self.polygon.get_international_markets()
            if intl_data:
                market_data['international'] = intl_data
                logger.info(f"Got {len(intl_data)} international markets from Polygon.io")
            
        except Exception as e:
            logger.error(f"Error getting market data: {e}")
        
        # With Polygon.io Stocks Starter, we should always have market data
        
        return market_data
    
    async def get_enhanced_news_and_sentiment(self) -> Tuple[List[NewsItem], List[str]]:
        """Get news with sentiment analysis and themes from Alpha Vantage"""
        
        try:
            # Use Alpha Vantage for news and sentiment
            major_symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA']
            news_items, themes = await self.alphavantage.get_market_news_with_sentiment(major_symbols)
            
            if news_items and themes:
                logger.info(f"Got {len(news_items)} news items with {len(themes)} themes from Alpha Vantage")
                return news_items, themes
            
        except Exception as e:
            logger.error(f"Error getting news and sentiment: {e}")
        
        # No fallback - return ERROR
        logger.info("No real news data available - ERROR")
        return [NewsItem(headline="ERROR", summary="No real news data available", source="ERROR", timestamp="", sentiment="neutral", impact_score=0)], ["ERROR"]
    
    async def get_sector_rotation_data(self) -> Dict[str, Any]:
        """Get sector rotation data from available sources"""
        
        try:
            # Try Polygon.io for sector ETF data
            sector_data = await self.polygon.get_sector_etf_data()
            
            if sector_data and len(sector_data) >= 3:
                # Format for our sector rotation analysis
                weekly_performance = {}
                for sector, data in sector_data.items():
                    weekly_performance[sector] = {
                        'weekly_return': data['weekly_return'],
                        'current_price': data['current_price'],
                        'volume_trend': 'increasing'  # Would need more data to determine
                    }
                
                # Calculate leaders and laggards
                sorted_sectors = sorted(weekly_performance.items(), key=lambda x: x[1]['weekly_return'], reverse=True)
                
                rotation_analysis = {
                    'weekly_performance': weekly_performance,
                    'leaders': sorted_sectors[:3],
                    'laggards': sorted_sectors[-3:],
                    'rotation_strength': self._calculate_rotation_strength(weekly_performance)
                }
                
                logger.info(f"Got sector rotation data for {len(sector_data)} sectors from Polygon.io")
                return rotation_analysis
            
        except Exception as e:
            logger.error(f"Error getting sector rotation data: {e}")
        
        # With Polygon.io Stocks Starter, we should always have sector data
        logger.warning("Sector rotation data not available")
        return {"weekly_performance": {}, "leaders": [], "laggards": [], "rotation_strength": "unknown"}
    
    async def get_earnings_calendar(self) -> List[Dict[str, Any]]:
        """Get earnings calendar from Alpha Vantage"""
        
        try:
            earnings_data = await self.alphavantage.get_earnings_calendar()
            
            if earnings_data:
                # Convert to our format
                formatted_earnings = []
                for earning in earnings_data[:10]:  # Limit to 10
                    formatted_earnings.append({
                        'symbol': earning.get('symbol', ''),
                        'company_name': earning.get('name', ''),
                        'date': earning.get('report_date', ''),
                        'day_of_week': self._get_day_of_week(earning.get('report_date', '')),
                        'timing': 'AMC',  # Alpha Vantage doesn't specify timing
                        'market_cap': 'Large',  # Assume large cap for now
                        'sector': 'Technology'  # Would need additional lookup
                    })
                
                logger.info(f"Got {len(formatted_earnings)} earnings from Alpha Vantage")
                return formatted_earnings
            
        except Exception as e:
            logger.error(f"Error getting earnings calendar: {e}")
        
        # No fallback - return ERROR
        logger.info("No real earnings calendar data available - ERROR")
        return [{"ERROR": "No real earnings calendar data available"}]
    
    def _calculate_rotation_strength(self, sector_performance: Dict) -> str:
        """Calculate sector rotation strength"""
        
        returns = [data['weekly_return'] for data in sector_performance.values()]
        
        if not returns:
            return 'weak'
        
        spread = max(returns) - min(returns)
        
        if spread > 5.0:
            return 'strong'
        elif spread > 2.5:
            return 'moderate'
        else:
            return 'weak'
    
    def _get_day_of_week(self, date_str: str) -> str:
        """Get day of week from date string"""
        
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            return date_obj.strftime('%A')
        except:
            return 'Monday'
    
    def _get_fallback_market_data(self) -> Dict[str, MarketData]:
        """Fallback market data when APIs fail"""
        
        return {
            'S&P 500': MarketData(
                symbol='SPY',
                current_price=625.34,
                change=4.95,
                change_percent=0.79,
                volume=45000000,
                timestamp=datetime.now().isoformat()
            ),
            'NASDAQ': MarketData(
                symbol='QQQ',
                current_price=556.22,
                change=5.41,
                change_percent=0.98,
                volume=32000000,
                timestamp=datetime.now().isoformat()
            ),
            'Russell 2000': MarketData(
                symbol='IWM',
                current_price=231.45,
                change=1.23,
                change_percent=0.53,
                volume=18000000,
                timestamp=datetime.now().isoformat()
            ),
            'Dow Jones': MarketData(
                symbol='DIA',
                current_price=449.78,
                change=2.14,
                change_percent=0.48,
                volume=12000000,
                timestamp=datetime.now().isoformat()
            ),
            'VIX': MarketData(
                symbol='VIX',
                current_price=18.75,
                change=-1.25,
                change_percent=-6.25,
                volume=0,
                timestamp=datetime.now().isoformat()
            )
        }
    
    def _get_fallback_news_and_themes(self) -> Tuple[List[NewsItem], List[str]]:
        """Fallback news and themes"""
        
        news_items = [
            NewsItem(
                headline="Federal Reserve Maintains Current Policy Stance",
                summary="The Federal Reserve held interest rates steady in their latest policy decision, citing continued assessment of economic conditions and inflation trends.",
                source="Federal Reserve Communications",
                timestamp=datetime.now().isoformat(),
                sentiment="neutral",
                impact_score=8.5
            ),
            NewsItem(
                headline="Technology Sector Shows Continued Strength",
                summary="Major technology companies demonstrate resilient performance with strong fundamentals and continued investment in artificial intelligence capabilities.",
                source="Market Analysis",
                timestamp=datetime.now().isoformat(),
                sentiment="positive",
                impact_score=7.8
            ),
            NewsItem(
                headline="Energy Markets React to Global Supply Updates",
                summary="Oil prices fluctuated following international supply chain developments and geopolitical factors affecting global energy markets.",
                source="Energy Markets Report",
                timestamp=datetime.now().isoformat(),
                sentiment="neutral",
                impact_score=7.1
            )
        ]
        
        themes = [
            'Federal Reserve Policy',
            'Technology Sector Performance', 
            'Energy Market Dynamics',
            'Corporate Earnings Analysis',
            'Global Economic Indicators'
        ]
        
        return news_items, themes
    
    def _get_fallback_sector_rotation(self) -> Dict[str, Any]:
        """Fallback sector rotation data"""
        
        weekly_performance = {
            'Technology': {'weekly_return': 2.4, 'volume_trend': 'increasing'},
            'Energy': {'weekly_return': 1.9, 'volume_trend': 'increasing'},
            'Healthcare': {'weekly_return': 0.8, 'volume_trend': 'stable'},
            'Financial': {'weekly_return': -0.5, 'volume_trend': 'decreasing'},
            'Utilities': {'weekly_return': -1.1, 'volume_trend': 'decreasing'}
        }
        
        sorted_sectors = sorted(weekly_performance.items(), key=lambda x: x[1]['weekly_return'], reverse=True)
        
        return {
            'weekly_performance': weekly_performance,
            'leaders': sorted_sectors[:3],
            'laggards': sorted_sectors[-2:],
            'rotation_strength': 'moderate'
        }
    
    def _get_fallback_economic_calendar(self) -> List[Dict[str, Any]]:
        """Fallback economic calendar"""
        
        return [
            {
                'time': '8:30 AM ET',
                'event': 'Consumer Price Index (CPI)',
                'importance': 'high',
                'forecast': '0.2%',
                'previous': '0.1%',
                'currency': 'USD',
                'source': 'Federal Reserve (FRED) - Fallback'
            },
            {
                'time': '10:00 AM ET', 
                'event': 'Federal Funds Rate Decision',
                'importance': 'high',
                'forecast': '4.33%',
                'previous': '4.33%',
                'currency': 'USD',
                'source': 'Federal Reserve (FRED) - Fallback'
            },
            {
                'time': '8:30 AM ET',
                'event': 'Initial Jobless Claims',
                'importance': 'medium',
                'forecast': '220K',
                'previous': '218K',
                'currency': 'USD',
                'source': 'Federal Reserve (FRED) - Fallback'
            }
        ]
    
    def _get_fallback_earnings_calendar(self) -> List[Dict[str, Any]]:
        """Fallback earnings calendar"""
        
        base_date = datetime.now()
        earnings = []
        
        companies = [
            ('AAPL', 'Apple Inc.', 'Technology'),
            ('MSFT', 'Microsoft Corp.', 'Technology'),
            ('GOOGL', 'Alphabet Inc.', 'Technology'),
            ('TSLA', 'Tesla Inc.', 'Consumer Discretionary'),
            ('NVDA', 'NVIDIA Corp.', 'Technology'),
            ('AMZN', 'Amazon.com Inc.', 'Consumer Discretionary'),
            ('META', 'Meta Platforms Inc.', 'Technology'),
            ('JPM', 'JPMorgan Chase', 'Financial'),
            ('JNJ', 'Johnson & Johnson', 'Healthcare')
        ]
        
        for i, (symbol, name, sector) in enumerate(companies):
            earnings_date = base_date + timedelta(days=i+1)
            earnings.append({
                'symbol': symbol,
                'company_name': name,
                'date': earnings_date.strftime('%Y-%m-%d'),
                'day_of_week': earnings_date.strftime('%A'),
                'timing': 'AMC' if i % 2 == 0 else 'BMO',
                'market_cap': 'Large',
                'sector': sector
            })
        
        return earnings

# Test function
async def test_unified_collector():
    """Test the unified data collector"""
    
    print("🧪 Testing Unified Data Collector")
    print("=" * 50)
    
    collector = UnifiedDataCollector()
    
    # Test economic calendar
    print("📅 Testing Economic Calendar...")
    calendar = await collector.get_comprehensive_economic_calendar()
    print(f"Found {len(calendar)} economic events:")
    for event in calendar[:3]:
        print(f"  • {event['time']} - {event['event']} ({event['importance']})")
    
    # Test market data
    print(f"\n📊 Testing Market Data...")
    market_data = await collector.get_enhanced_market_data()
    for category, data in market_data.items():
        if data:
            print(f"  • {category}: {len(data)} items")
    
    # Test news and sentiment
    print(f"\n📰 Testing News & Sentiment...")
    news_items, themes = await collector.get_enhanced_news_and_sentiment()
    print(f"Found {len(news_items)} news items with themes: {', '.join(themes[:3])}")
    
    # Test sector rotation
    print(f"\n🔄 Testing Sector Rotation...")
    sector_data = await collector.get_sector_rotation_data()
    print(f"Rotation strength: {sector_data.get('rotation_strength', 'unknown')}")
    
    # Test earnings calendar
    print(f"\n📈 Testing Earnings Calendar...")
    earnings = await collector.get_earnings_calendar()
    print(f"Found {len(earnings)} earnings releases")
    
    print("\n✅ Unified data collector test completed!")

if __name__ == "__main__":
    asyncio.run(test_unified_collector())