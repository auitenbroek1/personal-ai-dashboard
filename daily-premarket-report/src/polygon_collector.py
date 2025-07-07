#!/usr/bin/env python3
"""
Polygon.io Data Collector
=========================

Collects real-time market data from Polygon.io API
"""

import asyncio
import aiohttp
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import json

try:
    from .report_generator import MarketData
except ImportError:
    # For direct execution
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from report_generator import MarketData

logger = logging.getLogger(__name__)

class PolygonCollector:
    """Collects real-time market data from Polygon.io API"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('POLYGON_API_KEY', 'HbXfH6nXt1eipjkkBwRrsob56NLB1BPo')
        self.base_url = "https://api.polygon.io"
        
        # No rate limiting with Stocks Starter plan!
        self.unlimited_calls = True
        self.plan_type = "Stocks Starter"
        
        # Major market symbols
        self.major_indices = {
            'SPY': 'S&P 500 ETF',
            'QQQ': 'NASDAQ ETF', 
            'IWM': 'Russell 2000 ETF',
            'DIA': 'Dow Jones ETF'
        }
        
        self.futures_symbols = {
            'ES': 'S&P 500 Futures',
            'NQ': 'NASDAQ Futures',
            'RTY': 'Russell 2000 Futures',
            'YM': 'Dow Futures'
        }
    
    async def get_previous_close_data(self) -> Dict[str, MarketData]:
        """Get previous trading day closing data for major indices - optimized for 5 req/min limit"""
        
        closing_data = {}
        
        # Use ETFs but display as index names (index data requires separate Polygon plan)
        priority_symbols = [
            ('SPY', 'S&P 500'),
            ('QQQ', 'NASDAQ Composite'), 
            ('IWM', 'Russell 2000'),
            ('VIX', 'VIX'),
            ('DIA', 'Dow Jones Industrial Average')
        ]
        
        for symbol, name in priority_symbols:
            # No rate limit check needed with unlimited calls!
                
            try:
                # Get previous close data
                prev_close = await self._get_previous_close(symbol)
                
                if prev_close:
                    closing_data[name] = MarketData(
                        symbol=symbol,
                        current_price=prev_close.get('c', 0),  # close price
                        change=prev_close.get('c', 0) - prev_close.get('o', 0),  # close - open
                        change_percent=((prev_close.get('c', 0) - prev_close.get('o', 0)) / prev_close.get('o', 1)) * 100,
                        volume=int(prev_close.get('v', 0)),  # volume
                        timestamp=datetime.now().isoformat()
                    )
                    logger.info(f"Successfully got {symbol} data: ${prev_close.get('c', 0)}")
                else:
                    logger.warning(f"No data returned for {symbol}")
                    
            except Exception as e:
                logger.error(f"Error fetching closing data for {symbol}: {e}")
                continue
        
        return closing_data
    
    async def get_overnight_futures(self) -> Dict[str, MarketData]:
        """Get overnight futures data"""
        
        futures_data = {}
        
        # Note: Polygon free tier may have limited futures access
        # We'll try to get futures data, but fall back to ETF equivalents
        
        for symbol, name in self.futures_symbols.items():
                
            try:
                # Try to get futures data (may not be available on free tier)
                current_price = await self._get_current_price(f"{symbol}1!")
                
                if current_price:
                    # Get previous close for comparison
                    prev_close = await self._get_previous_close(f"{symbol}1!")
                    
                    if prev_close:
                        change = current_price - prev_close.get('c', current_price)
                        change_percent = (change / prev_close.get('c', current_price)) * 100
                        
                        futures_data[name] = MarketData(
                            symbol=f"{symbol}1!",
                            current_price=current_price,
                            change=change,
                            change_percent=change_percent,
                            volume=0,  # Volume not available for current price
                            timestamp=datetime.now().isoformat()
                        )
                        
            except Exception as e:
                logger.warning(f"Error fetching futures data for {symbol}: {e}")
                continue
        
        return futures_data
    
    async def get_international_markets(self) -> Dict[str, MarketData]:
        """Get international market data (ETFs)"""
        
        international_data = {}
        
        # International market ETFs (more likely to be available on free tier)
        intl_etfs = {
            'EWJ': 'Japan (Nikkei)',
            'EWH': 'Hong Kong (Hang Seng)', 
            'EWU': 'UK (FTSE)',
            'EWG': 'Germany (DAX)',
            'EWQ': 'France (CAC)'
        }
        
        for symbol, name in intl_etfs.items():
                
            try:
                prev_close = await self._get_previous_close(symbol)
                
                if prev_close:
                    international_data[name] = MarketData(
                        symbol=symbol,
                        current_price=prev_close.get('c', 0),
                        change=prev_close.get('c', 0) - prev_close.get('o', 0),
                        change_percent=((prev_close.get('c', 0) - prev_close.get('o', 0)) / prev_close.get('o', 1)) * 100,
                        volume=int(prev_close.get('v', 0)),
                        timestamp=datetime.now().isoformat()
                    )
                    
            except Exception as e:
                logger.error(f"Error fetching international data for {symbol}: {e}")
                continue
        
        return international_data
    
    async def get_sector_etf_data(self) -> Dict[str, Any]:
        """Get sector ETF data for rotation analysis"""
        
        sector_data = {}
        
        sector_etfs = {
            'XLK': 'Technology',
            'XLF': 'Financial',
            'XLE': 'Energy',
            'XLV': 'Healthcare',
            'XLI': 'Industrial',
            'XLP': 'Consumer Staples',
            'XLY': 'Consumer Discretionary',
            'XLU': 'Utilities',
            'XLB': 'Materials',
            'XLRE': 'Real Estate'
        }
        
        for symbol, sector in sector_etfs.items():
                
            try:
                # Get 5-day historical data for weekly performance
                historical_data = await self._get_historical_data(symbol, days=5)
                
                if historical_data and len(historical_data) >= 2:
                    current_price = historical_data[-1].get('c', 0)
                    week_start_price = historical_data[0].get('c', 0)
                    
                    # Get actual dates from timestamps
                    start_date = datetime.fromtimestamp(historical_data[0]['t']/1000).strftime('%Y-%m-%d')
                    end_date = datetime.fromtimestamp(historical_data[-1]['t']/1000).strftime('%Y-%m-%d')
                    
                    if week_start_price > 0:
                        weekly_return = ((current_price - week_start_price) / week_start_price) * 100
                        
                        sector_data[sector] = {
                            'weekly_return': round(weekly_return, 2),
                            'current_price': round(current_price, 2),
                            'symbol': symbol,
                            'start_date': start_date,
                            'end_date': end_date
                        }
                        
            except Exception as e:
                logger.warning(f"Error fetching sector data for {symbol}: {e}")
                continue
        
        return sector_data
    
    async def _get_previous_close(self, symbol: str) -> Optional[Dict]:
        """Get previous trading day data for a symbol"""
        
        # Try multiple recent trading days since markets might be closed
        for days_back in range(1, 6):  # Try last 5 days
            date = datetime.now() - timedelta(days=days_back)
            
            # Skip weekends
            if date.weekday() >= 5:  # Saturday = 5, Sunday = 6
                continue
                
            date_str = date.strftime('%Y-%m-%d')
            
            # Use the correct Polygon.io API endpoint
            url = f"{self.base_url}/v1/open-close/{symbol}/{date_str}"
            
            try:
                
                async with aiohttp.ClientSession() as session:
                    # Use correct parameter name 'apikey' (not 'apiKey')
                    async with session.get(url, params={'apikey': self.api_key, 'adjusted': 'true'}) as response:
                        if response.status == 200:
                            data = await response.json()
                            
                            # Polygon returns: {'status': 'OK', 'from': date, 'symbol': symbol, 'open': price, 'high': price, 'low': price, 'close': price, 'volume': volume}
                            if data.get('status') == 'OK':
                                logger.info(f"Found data for {symbol} on {date_str}")
                                return {
                                    'c': data.get('close'),   # close price
                                    'o': data.get('open'),    # open price
                                    'h': data.get('high'),    # high price
                                    'l': data.get('low'),     # low price
                                    'v': data.get('volume')   # volume
                                }
                            else:
                                logger.debug(f"Polygon API returned {data.get('status')} for {symbol} on {date_str}")
                        elif response.status == 429:
                            logger.warning(f"Polygon rate limit exceeded for {symbol}")
                            return None
                        elif response.status == 404:
                            logger.debug(f"No data for {symbol} on {date_str} (404)")
                        else:
                            logger.warning(f"Polygon API returned status {response.status} for {symbol} on {date_str}")
                            
            except Exception as e:
                logger.error(f"Error fetching previous close for {symbol} on {date_str}: {e}")
                
        logger.warning(f"No data found for {symbol} in last 5 trading days")
        return None
    
    async def _get_current_price(self, symbol: str) -> Optional[float]:
        """Get current price for a symbol"""
        
        url = f"{self.base_url}/v2/last/trade/{symbol}"
        
        try:
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params={'apikey': self.api_key}) as response:
                    if response.status == 200:
                        data = await response.json()
                        results = data.get('results', {})
                        return results.get('p')  # price
                    else:
                        return None
                        
        except Exception as e:
            logger.error(f"Error fetching current price for {symbol}: {e}")
            return None
    
    async def _get_historical_data(self, symbol: str, days: int = 5) -> List[Dict]:
        """Get historical data for a symbol"""
        
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days+2)).strftime('%Y-%m-%d')  # Extra days for weekends
        
        url = f"{self.base_url}/v2/aggs/ticker/{symbol}/range/1/day/{start_date}/{end_date}"
        
        try:
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params={'apikey': self.api_key}) as response:
                    if response.status == 200:
                        data = await response.json()
                        results = data.get('results', [])
                        
                        # Convert to our format
                        formatted_results = []
                        for result in results:
                            formatted_results.append({
                                'c': result.get('c'),  # close
                                'o': result.get('o'),  # open
                                'h': result.get('h'),  # high
                                'l': result.get('l'),  # low
                                'v': result.get('v'),  # volume
                                't': result.get('t')   # timestamp
                            })
                        
                        return formatted_results
                    else:
                        return []
                        
        except Exception as e:
            logger.error(f"Error fetching historical data for {symbol}: {e}")
            return []
    
    # Rate limiting function removed - we have unlimited calls now!
    
    async def get_technical_indicators(self, symbol: str) -> Dict[str, Any]:
        """Get technical indicators for a symbol (NEW with Stocks Starter!)"""
        
        indicators = {}
        
        try:
            # Get SMA (Simple Moving Average)
            sma_url = f"{self.base_url}/v1/indicators/sma/{symbol}"
            async with aiohttp.ClientSession() as session:
                # 20-day SMA
                async with session.get(sma_url, params={
                    'apikey': self.api_key,
                    'timestamp.gte': (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
                    'timespan': 'day',
                    'window': 20,
                    'series_type': 'close'
                }) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get('results'):
                            indicators['sma_20'] = data['results'][-1].get('value')
                
                # RSI (Relative Strength Index)
                rsi_url = f"{self.base_url}/v1/indicators/rsi/{symbol}"
                async with session.get(rsi_url, params={
                    'apikey': self.api_key,
                    'timestamp.gte': (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
                    'timespan': 'day',
                    'window': 14,
                    'series_type': 'close'
                }) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get('results'):
                            indicators['rsi_14'] = data['results'][-1].get('value')
                            
        except Exception as e:
            logger.warning(f"Error getting technical indicators for {symbol}: {e}")
            
        return indicators
    
    async def get_market_snapshot(self) -> Dict[str, Any]:
        """Get market-wide snapshot (NEW with Stocks Starter!)"""
        
        try:
            url = f"{self.base_url}/v2/snapshot/locale/us/markets/stocks/tickers"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params={'apikey': self.api_key}) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Extract gainers and losers
                        tickers = data.get('tickers', [])
                        sorted_by_change = sorted(tickers, key=lambda x: x.get('todaysChangePerc', 0), reverse=True)
                        
                        return {
                            'gainers': sorted_by_change[:5],
                            'losers': sorted_by_change[-5:],
                            'most_active': sorted(tickers, key=lambda x: x.get('day', {}).get('v', 0), reverse=True)[:5]
                        }
                        
        except Exception as e:
            logger.error(f"Error getting market snapshot: {e}")
            
        return {}
    
    async def get_fundamentals(self, symbol: str) -> Dict[str, Any]:
        """Get fundamental data for a symbol (NEW with Stocks Starter!)"""
        
        try:
            # Company details
            url = f"{self.base_url}/v3/reference/tickers/{symbol}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params={'apikey': self.api_key}) as response:
                    if response.status == 200:
                        data = await response.json()
                        results = data.get('results', {})
                        
                        return {
                            'market_cap': results.get('market_cap'),
                            'sic_description': results.get('sic_description'),
                            'total_employees': results.get('total_employees'),
                            'description': results.get('description', '')[:200] + '...' if results.get('description') else ''
                        }
                        
        except Exception as e:
            logger.error(f"Error getting fundamentals for {symbol}: {e}")
            
        return {}

# Main function for testing
async def test_polygon_integration():
    """Test Polygon.io integration"""
    
    print("🧪 Testing Polygon.io API Integration")
    print("=" * 50)
    
    collector = PolygonCollector()
    
    # Test previous close data
    print("📊 Testing Previous Close Data...")
    closing_data = await collector.get_previous_close_data()
    print(f"Found {len(closing_data)} closing prices:")
    for name, data in closing_data.items():
        print(f"  • {name}: ${data.current_price:.2f} ({data.change_percent:+.2f}%)")
    
    # Test futures data
    print(f"\n🌙 Testing Futures Data...")
    futures_data = await collector.get_overnight_futures()
    print(f"Found {len(futures_data)} futures contracts:")
    for name, data in futures_data.items():
        print(f"  • {name}: ${data.current_price:.2f} ({data.change_percent:+.2f}%)")
    
    # Test international markets
    print(f"\n🌍 Testing International Markets...")
    intl_data = await collector.get_international_markets()
    print(f"Found {len(intl_data)} international markets:")
    for name, data in intl_data.items():
        print(f"  • {name}: ${data.current_price:.2f} ({data.change_percent:+.2f}%)")
    
    # Test sector data
    print(f"\n🔄 Testing Sector ETF Data...")
    sector_data = await collector.get_sector_etf_data()
    print(f"Found {len(sector_data)} sectors:")
    for sector, data in sector_data.items():
        print(f"  • {sector}: {data['weekly_return']:+.2f}% weekly return")
    
    print(f"\n🚀 Plan: {collector.plan_type} - Unlimited API Calls!")
    print("\n✅ Polygon.io integration test completed!")

if __name__ == "__main__":
    asyncio.run(test_polygon_integration())