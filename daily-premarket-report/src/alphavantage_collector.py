#!/usr/bin/env python3
"""
Alpha Vantage Data Collector
============================

Collects market data, news, and sentiment analysis from Alpha Vantage API
"""

import asyncio
import aiohttp
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import json

try:
    from .report_generator import MarketData, NewsItem
except ImportError:
    # For direct execution
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from report_generator import MarketData, NewsItem

logger = logging.getLogger(__name__)

class AlphaVantageCollector:
    """Collects market data and news from Alpha Vantage API"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('ALPHAVANTAGE_API_KEY', 'LYQY5DMJAL22MX06')
        self.base_url = "https://www.alphavantage.co/query"
        
        # Rate limiting: 25 requests per day on free tier
        self.requests_made = 0
        self.max_requests = 25
    
    async def get_market_news_with_sentiment(self, symbols: List[str] = None, limit: int = 10) -> tuple[List[NewsItem], List[str]]:
        """Get market news with sentiment analysis and extract themes"""
        
        if self.requests_made >= self.max_requests:
            logger.warning("Alpha Vantage rate limit reached - ERROR")
            return [NewsItem(headline="ERROR", summary="Alpha Vantage rate limit reached", source="ERROR", timestamp="", sentiment="neutral", impact_score=0)], ["ERROR"]
        
        try:
            # Get news and sentiment data
            params = {
                'function': 'NEWS_SENTIMENT',
                'apikey': self.api_key,
                'limit': limit
            }
            
            # Add tickers if provided
            if symbols:
                params['tickers'] = ','.join(symbols[:5])  # Limit to 5 symbols
            
            self.requests_made += 1
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_news_sentiment(data)
                    else:
                        logger.warning(f"Alpha Vantage news API returned status {response.status}")
                        return [NewsItem(headline="ERROR", summary=f"Alpha Vantage API error: {response.status}", source="ERROR", timestamp="", sentiment="neutral", impact_score=0)], ["ERROR"]
                        
        except Exception as e:
            logger.error(f"Error fetching Alpha Vantage news: {e}")
            return [NewsItem(headline="ERROR", summary=f"Alpha Vantage error: {e}", source="ERROR", timestamp="", sentiment="neutral", impact_score=0)], ["ERROR"]
    
    async def get_economic_indicators(self) -> Dict[str, Any]:
        """Get key economic indicators from Alpha Vantage"""
        
        if self.requests_made >= self.max_requests:
            logger.warning("Alpha Vantage rate limit reached")
            return {}
        
        indicators = {}
        
        # Get key economic indicators
        indicator_functions = {
            'REAL_GDP': 'Real GDP',
            'CPI': 'Consumer Price Index',
            'UNEMPLOYMENT': 'Unemployment Rate',
            'FEDERAL_FUNDS_RATE': 'Federal Funds Rate'
        }
        
        for function, name in indicator_functions.items():
            if self.requests_made >= self.max_requests:
                break
                
            try:
                params = {
                    'function': function,
                    'apikey': self.api_key,
                    'interval': 'annual' if function == 'REAL_GDP' else 'monthly'
                }
                
                self.requests_made += 1
                
                async with aiohttp.ClientSession() as session:
                    async with session.get(self.base_url, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            latest_value = self._extract_latest_indicator_value(data)
                            if latest_value:
                                indicators[name] = latest_value
                        
                # Small delay to respect rate limits
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.warning(f"Error fetching {function}: {e}")
                continue
        
        return indicators
    
    async def get_earnings_calendar(self) -> List[Dict[str, Any]]:
        """Get earnings calendar from Alpha Vantage"""
        
        if self.requests_made >= self.max_requests:
            logger.warning("Alpha Vantage rate limit reached")
            return []
        
        try:
            params = {
                'function': 'EARNINGS_CALENDAR',
                'apikey': self.api_key
            }
            
            self.requests_made += 1
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params) as response:
                    if response.status == 200:
                        # Alpha Vantage returns CSV for earnings calendar
                        csv_data = await response.text()
                        return self._parse_earnings_csv(csv_data)
                    else:
                        logger.warning(f"Alpha Vantage earnings API returned status {response.status}")
                        return []
                        
        except Exception as e:
            logger.error(f"Error fetching Alpha Vantage earnings: {e}")
            return []
    
    async def get_market_data(self, symbols: List[str]) -> Dict[str, MarketData]:
        """Get real-time market data for symbols"""
        
        market_data = {}
        
        for symbol in symbols[:3]:  # Limit to 3 symbols to conserve API calls
            if self.requests_made >= self.max_requests:
                break
                
            try:
                params = {
                    'function': 'GLOBAL_QUOTE',
                    'symbol': symbol,
                    'apikey': self.api_key
                }
                
                self.requests_made += 1
                
                async with aiohttp.ClientSession() as session:
                    async with session.get(self.base_url, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            quote_data = data.get('Global Quote', {})
                            
                            if quote_data:
                                market_data[symbol] = MarketData(
                                    symbol=symbol,
                                    current_price=float(quote_data.get('05. price', 0)),
                                    change=float(quote_data.get('09. change', 0)),
                                    change_percent=float(quote_data.get('10. change percent', '0%').replace('%', '')),
                                    volume=int(float(quote_data.get('06. volume', 0))),
                                    timestamp=datetime.now().isoformat()
                                )
                
                # Small delay to respect rate limits
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.warning(f"Error fetching market data for {symbol}: {e}")
                continue
        
        return market_data
    
    def _parse_news_sentiment(self, data: Dict) -> tuple[List[NewsItem], List[str]]:
        """Parse news sentiment data from Alpha Vantage"""
        
        news_items = []
        themes = set()
        
        try:
            items = data.get('items', [])
            
            for item in items:
                # Extract news item data
                headline = item.get('title', '')
                summary = item.get('summary', '')
                source = item.get('source', 'Alpha Vantage')
                timestamp = item.get('time_published', datetime.now().isoformat())
                
                # Get sentiment analysis
                sentiment_score = float(item.get('overall_sentiment_score', 0))
                sentiment_label = item.get('overall_sentiment_label', 'Neutral')
                
                # Convert sentiment to our format
                if sentiment_label.lower() == 'bullish':
                    sentiment = 'positive'
                elif sentiment_label.lower() == 'bearish':
                    sentiment = 'negative'
                else:
                    sentiment = 'neutral'
                
                # Calculate impact score (convert from -1 to 1 scale to 1-10 scale)
                impact_score = max(1, min(10, 5 + (sentiment_score * 5)))
                
                # Extract themes from topics
                topics = item.get('topics', [])
                for topic in topics:
                    theme_name = topic.get('topic', '')
                    if theme_name:
                        themes.add(self._normalize_theme_name(theme_name))
                
                news_item = NewsItem(
                    headline=headline,
                    summary=summary[:200] + '...' if len(summary) > 200 else summary,
                    source=source,
                    timestamp=timestamp,
                    sentiment=sentiment,
                    impact_score=round(impact_score, 1)
                )
                
                news_items.append(news_item)
            
            # Convert themes set to list and limit to 5
            themes_list = list(themes)[:5]
            
            # Fill out themes if we don't have enough
            if len(themes_list) < 5:
                default_themes = [
                    'Market Sentiment Analysis', 
                    'Economic Policy Updates',
                    'Corporate Earnings Focus',
                    'Global Market Dynamics',
                    'Financial Sector Trends'
                ]
                
                for theme in default_themes:
                    if theme not in themes_list and len(themes_list) < 5:
                        themes_list.append(theme)
            
            return news_items[:10], themes_list[:5]
            
        except Exception as e:
            logger.error(f"Error parsing news sentiment: {e}")
            return [NewsItem(headline="ERROR", summary=f"News parsing error: {e}", source="ERROR", timestamp="", sentiment="neutral", impact_score=0)], ["ERROR"]
    
    def _normalize_theme_name(self, theme: str) -> str:
        """Normalize theme names to be more readable"""
        
        theme_mapping = {
            'earnings': 'Corporate Earnings',
            'mergers_and_acquisitions': 'M&A Activity',
            'federal_reserve': 'Federal Reserve Policy',
            'energy': 'Energy Markets',
            'technology': 'Technology Sector',
            'finance': 'Financial Services',
            'manufacturing': 'Manufacturing Sector',
            'real_estate': 'Real Estate Markets',
            'retail_wholesale': 'Retail & Consumer',
            'life_sciences': 'Healthcare & Biotech'
        }
        
        return theme_mapping.get(theme.lower(), theme.replace('_', ' ').title())
    
    def _extract_latest_indicator_value(self, data: Dict) -> Optional[Dict]:
        """Extract latest value from economic indicator data"""
        
        try:
            # Alpha Vantage economic data structure varies by indicator
            for key, value in data.items():
                if isinstance(value, list) and value:
                    # Get the most recent data point
                    latest = value[0]
                    return {
                        'value': latest.get('value'),
                        'date': latest.get('date'),
                        'period': latest.get('period', '')
                    }
                elif isinstance(value, dict):
                    # Some indicators return dict format
                    dates = list(value.keys())
                    if dates:
                        latest_date = max(dates)
                        return {
                            'value': value[latest_date],
                            'date': latest_date,
                            'period': latest_date
                        }
            
            return None
            
        except Exception as e:
            logger.warning(f"Error extracting indicator value: {e}")
            return None
    
    def _parse_earnings_csv(self, csv_data: str) -> List[Dict[str, Any]]:
        """Parse earnings calendar CSV data"""
        
        earnings = []
        
        try:
            lines = csv_data.strip().split('\n')
            if len(lines) < 2:
                return []
            
            headers = lines[0].split(',')
            
            for line in lines[1:21]:  # Limit to 20 earnings
                values = line.split(',')
                if len(values) >= len(headers):
                    earnings_data = dict(zip(headers, values))
                    
                    # Extract key information
                    symbol = earnings_data.get('symbol', '')
                    name = earnings_data.get('name', '')
                    report_date = earnings_data.get('reportDate', '')
                    
                    if symbol and report_date:
                        earnings.append({
                            'symbol': symbol,
                            'company_name': name,
                            'report_date': report_date,
                            'source': 'Alpha Vantage'
                        })
            
            return earnings
            
        except Exception as e:
            logger.error(f"Error parsing earnings CSV: {e}")
            return []
    
    def _get_fallback_news_with_themes(self) -> tuple[List[NewsItem], List[str]]:
        """Provide fallback news data with themes"""
        
        logger.info("Using Alpha Vantage fallback news data")
        
        news_items = [
            NewsItem(
                headline="Federal Reserve Maintains Current Interest Rate Policy",
                summary="The Federal Reserve held interest rates steady, citing ongoing assessment of economic conditions and inflation trends in their latest policy decision.",
                source="Alpha Vantage Economic Analysis",
                timestamp=datetime.now().isoformat(),
                sentiment="neutral",
                impact_score=8.2
            ),
            NewsItem(
                headline="Technology Sector Shows Strong Earnings Performance",
                summary="Major technology companies exceeded earnings expectations, driven by continued growth in cloud computing and artificial intelligence investments.",
                source="Alpha Vantage Market Analysis",
                timestamp=datetime.now().isoformat(),
                sentiment="positive",
                impact_score=7.8
            ),
            NewsItem(
                headline="Energy Markets React to Global Supply Developments",
                summary="Oil prices fluctuated following international supply chain updates and geopolitical developments affecting energy sector valuations.",
                source="Alpha Vantage Energy Report",
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

# Main function for testing
async def test_alphavantage_integration():
    """Test Alpha Vantage integration"""
    
    print("🧪 Testing Alpha Vantage API Integration")
    print("=" * 50)
    
    collector = AlphaVantageCollector()
    
    # Test news and sentiment
    print("📰 Testing News & Sentiment Analysis...")
    news_items, themes = await collector.get_market_news_with_sentiment(['AAPL', 'MSFT', 'GOOGL'])
    print(f"Found {len(news_items)} news items with {len(themes)} themes:")
    
    for item in news_items[:2]:
        print(f"  • {item.headline} ({item.sentiment}, impact: {item.impact_score})")
    
    print(f"\nKey Themes: {', '.join(themes)}")
    
    # Test economic indicators
    print(f"\n📊 Testing Economic Indicators...")
    indicators = await collector.get_economic_indicators()
    print(f"Found {len(indicators)} indicators:")
    for name, data in indicators.items():
        print(f"  • {name}: {data.get('value')} ({data.get('date')})")
    
    # Test market data
    print(f"\n📈 Testing Market Data...")
    market_data = await collector.get_market_data(['SPY', 'QQQ'])
    for symbol, data in market_data.items():
        print(f"  • {symbol}: ${data.current_price} ({data.change_percent:+.2f}%)")
    
    print(f"\n📅 Rate limiting: {collector.requests_made}/{collector.max_requests} requests used")
    print("\n✅ Alpha Vantage integration test completed!")

if __name__ == "__main__":
    asyncio.run(test_alphavantage_integration())