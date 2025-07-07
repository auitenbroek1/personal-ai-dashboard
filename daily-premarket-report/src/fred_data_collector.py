#!/usr/bin/env python3
"""
FRED Data Collector
===================

Collects economic data from Federal Reserve Economic Data (FRED) API
"""

import asyncio
import aiohttp
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import json

logger = logging.getLogger(__name__)

class FREDDataCollector:
    """Collects economic data from Federal Reserve FRED API"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('FRED_API_KEY', 'b893a529994f6c23da84c0f8ceda6029')
        self.base_url = "https://api.stlouisfed.org/fred"
        
        # Key economic indicators we want to track
        self.key_indicators = {
            'UNRATE': 'Unemployment Rate',
            'CPIAUCSL': 'Consumer Price Index',
            'GDP': 'Gross Domestic Product',
            'FEDFUNDS': 'Federal Funds Rate',
            'DGS10': '10-Year Treasury Constant Maturity Rate',
            'DGS2': '2-Year Treasury Constant Maturity Rate',
            'PAYEMS': 'All Employees, Total Nonfarm',
            'INDPRO': 'Industrial Production Index',
            'HOUST': 'Housing Starts',
            'UMCSENT': 'University of Michigan Consumer Sentiment'
        }
    
    async def get_economic_calendar_today(self) -> List[Dict[str, Any]]:
        """Get today's economic releases from FRED"""
        
        try:
            today = datetime.now().strftime('%Y-%m-%d')
            
            # Get releases for today
            releases_data = await self._get_fred_releases(today)
            
            # Format for our economic calendar
            calendar_events = []
            
            for release in releases_data.get('releases', [])[:10]:  # Top 10 releases
                event = {
                    'time': '8:30 AM ET',  # FRED doesn't provide exact times, use common release time
                    'event': release.get('name', 'Economic Release'),
                    'importance': self._determine_importance(release.get('name', '')),
                    'forecast': 'N/A',  # FRED doesn't provide forecasts
                    'previous': 'N/A',   # We'll get this from series data if needed
                    'currency': 'USD',
                    'source': 'Federal Reserve (FRED)'
                }
                calendar_events.append(event)
            
            # If no releases today, get recent key indicators
            if not calendar_events:
                calendar_events = await self._get_recent_key_indicators()
            
            return calendar_events
            
        except Exception as e:
            logger.error(f"Error fetching FRED economic calendar: {e}")
            return [{"ERROR": f"No real FRED economic calendar data available: {e}"}]
    
    async def get_key_economic_indicators(self) -> Dict[str, Any]:
        """Get latest values for key economic indicators"""
        
        indicators_data = {}
        
        for series_id, indicator_name in self.key_indicators.items():
            try:
                # Get latest observation for this series
                latest_data = await self._get_series_latest_observation(series_id)
                
                if latest_data:
                    indicators_data[indicator_name] = {
                        'series_id': series_id,
                        'value': latest_data.get('value'),
                        'date': latest_data.get('date'),
                        'units': latest_data.get('units', ''),
                        'title': latest_data.get('title', indicator_name)
                    }
                    
            except Exception as e:
                logger.warning(f"Error fetching indicator {series_id}: {e}")
                continue
        
        return indicators_data
    
    async def get_fed_meeting_dates(self) -> List[Dict[str, Any]]:
        """Get upcoming Federal Reserve meeting dates"""
        
        try:
            # FOMC meeting dates are typically announced in advance
            # We'll check for interest rate series updates as a proxy
            
            fed_funds_data = await self._get_series_latest_observation('FEDFUNDS')
            
            if fed_funds_data:
                return [{
                    'event': 'Federal Reserve FOMC Meeting',
                    'date': fed_funds_data.get('date'),
                    'current_rate': fed_funds_data.get('value'),
                    'source': 'FRED'
                }]
            
            return []
            
        except Exception as e:
            logger.error(f"Error fetching Fed meeting dates: {e}")
            return []
    
    async def _get_fred_releases(self, date: str) -> Dict[str, Any]:
        """Get FRED releases for a specific date"""
        
        url = f"{self.base_url}/releases"
        
        params = {
            'api_key': self.api_key,
            'file_type': 'json',
            'realtime_start': date,
            'realtime_end': date,
            'limit': 20
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.warning(f"FRED releases API returned status {response.status}")
                    return {}
    
    async def _get_series_latest_observation(self, series_id: str) -> Dict[str, Any]:
        """Get latest observation for a FRED series"""
        
        url = f"{self.base_url}/series/observations"
        
        params = {
            'series_id': series_id,
            'api_key': self.api_key,
            'file_type': 'json',
            'limit': 1,
            'sort_order': 'desc'
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        observations = data.get('observations', [])
                        if observations:
                            latest = observations[0]
                            
                            # Also get series info for units and title
                            series_info = await self._get_series_info(series_id)
                            
                            return {
                                'value': latest.get('value'),
                                'date': latest.get('date'),
                                'units': series_info.get('units', ''),
                                'title': series_info.get('title', '')
                            }
                    return {}
                    
        except Exception as e:
            logger.error(f"Error fetching series {series_id}: {e}")
            return {}
    
    async def _get_series_info(self, series_id: str) -> Dict[str, Any]:
        """Get series information (title, units, etc.)"""
        
        url = f"{self.base_url}/series"
        
        params = {
            'series_id': series_id,
            'api_key': self.api_key,
            'file_type': 'json'
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        series_list = data.get('seriess', [])
                        if series_list:
                            return series_list[0]
                    return {}
                    
        except Exception as e:
            logger.error(f"Error fetching series info for {series_id}: {e}")
            return {}
    
    def _determine_importance(self, event_name: str) -> str:
        """Determine importance level based on event name"""
        
        event_lower = event_name.lower()
        
        high_impact_keywords = [
            'employment', 'unemployment', 'jobs', 'payroll', 'cpi', 'inflation',
            'gdp', 'federal funds', 'fomc', 'consumer price', 'producer price'
        ]
        
        medium_impact_keywords = [
            'housing', 'industrial', 'consumer', 'sentiment', 'confidence',
            'manufacturing', 'retail', 'income'
        ]
        
        for keyword in high_impact_keywords:
            if keyword in event_lower:
                return 'high'
        
        for keyword in medium_impact_keywords:
            if keyword in event_lower:
                return 'medium'
        
        return 'low'
    
    async def _get_recent_key_indicators(self) -> List[Dict[str, Any]]:
        """Get recent key economic indicators when no releases today"""
        
        calendar_events = []
        
        # Get unemployment rate as a key indicator
        try:
            unemployment = await self._get_series_latest_observation('UNRATE')
            if unemployment:
                calendar_events.append({
                    'time': 'Latest Data',
                    'event': 'Unemployment Rate',
                    'importance': 'high',
                    'forecast': 'N/A',
                    'previous': f"{unemployment.get('value')}%",
                    'currency': 'USD',
                    'source': 'Federal Reserve (FRED)'
                })
        except:
            pass
        
        # Get CPI data
        try:
            cpi = await self._get_series_latest_observation('CPIAUCSL')
            if cpi:
                calendar_events.append({
                    'time': 'Latest Data',
                    'event': 'Consumer Price Index',
                    'importance': 'high',
                    'forecast': 'N/A',
                    'previous': cpi.get('value'),
                    'currency': 'USD',
                    'source': 'Federal Reserve (FRED)'
                })
        except:
            pass
        
        # Get Federal Funds Rate
        try:
            fed_funds = await self._get_series_latest_observation('FEDFUNDS')
            if fed_funds:
                calendar_events.append({
                    'time': 'Latest Data',
                    'event': 'Federal Funds Rate',
                    'importance': 'high',
                    'forecast': 'N/A',
                    'previous': f"{fed_funds.get('value')}%",
                    'currency': 'USD',
                    'source': 'Federal Reserve (FRED)'
                })
        except:
            pass
        
        return calendar_events
    
    def _get_fallback_economic_calendar(self) -> List[Dict[str, Any]]:
        """Provide fallback economic calendar data"""
        
        logger.info("Using fallback economic calendar data")
        
        return [
            {
                'time': '8:30 AM ET',
                'event': 'Initial Jobless Claims',
                'importance': 'medium',
                'forecast': '220K',
                'previous': '218K',
                'currency': 'USD',
                'source': 'Federal Reserve (FRED) - Fallback'
            },
            {
                'time': '10:00 AM ET',
                'event': 'Consumer Price Index (CPI)',
                'importance': 'high',
                'forecast': '0.2%',
                'previous': '0.1%',
                'currency': 'USD',
                'source': 'Federal Reserve (FRED) - Fallback'
            },
            {
                'time': '2:00 PM ET',
                'event': 'Federal Funds Rate Decision',
                'importance': 'high',
                'forecast': '5.25%',
                'previous': '5.25%',
                'currency': 'USD',
                'source': 'Federal Reserve (FRED) - Fallback'
            }
        ]

# Main function for testing
async def test_fred_integration():
    """Test FRED data integration"""
    
    print("🧪 Testing FRED API Integration")
    print("=" * 50)
    
    collector = FREDDataCollector()
    
    # Test economic calendar
    print("📅 Testing Economic Calendar...")
    calendar = await collector.get_economic_calendar_today()
    print(f"Found {len(calendar)} economic events:")
    for event in calendar[:3]:
        print(f"  • {event['time']} - {event['event']} ({event['importance']})")
    
    print("\n📊 Testing Key Economic Indicators...")
    indicators = await collector.get_key_economic_indicators()
    print(f"Found {len(indicators)} indicators:")
    for name, data in list(indicators.items())[:3]:
        print(f"  • {name}: {data.get('value')} ({data.get('date')})")
    
    print("\n🏦 Testing Fed Meeting Data...")
    fed_meetings = await collector.get_fed_meeting_dates()
    if fed_meetings:
        for meeting in fed_meetings:
            print(f"  • {meeting['event']}: {meeting.get('current_rate')}%")
    
    print("\n✅ FRED integration test completed!")

if __name__ == "__main__":
    asyncio.run(test_fred_integration())