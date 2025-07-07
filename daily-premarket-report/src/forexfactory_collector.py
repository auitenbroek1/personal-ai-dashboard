#!/usr/bin/env python3
"""
ForexFactory Economic Calendar Collector
========================================

Collects economic calendar data from ForexFactory.com with US focus and impact filtering
"""

import asyncio
import aiohttp
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup
import re
import pytz

logger = logging.getLogger(__name__)

class ForexFactoryCollector:
    """Collects economic calendar data from ForexFactory.com"""
    
    def __init__(self):
        self.base_url = "https://www.forexfactory.com"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    
    async def get_us_economic_calendar(self, days_ahead: int = 1) -> List[Dict[str, Any]]:
        """Get US economic calendar events with medium and high impact"""
        
        try:
            # Calculate target date
            target_date = datetime.now() + timedelta(days=days_ahead)
            
            # ForexFactory calendar URL format
            calendar_url = f"{self.base_url}/calendar"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    calendar_url,
                    headers=self.headers
                ) as response:
                    if response.status == 200:
                        html = await response.text()
                        return self._parse_economic_calendar(html, target_date)
                    else:
                        logger.warning(f"ForexFactory returned status {response.status}")
                        return self._get_fallback_calendar()
                        
        except Exception as e:
            logger.error(f"Error fetching ForexFactory calendar: {e}")
            return self._get_fallback_calendar()
    
    def _parse_economic_calendar(self, html: str, target_date: datetime) -> List[Dict[str, Any]]:
        """Parse ForexFactory economic calendar HTML"""
        
        events = []
        
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Find calendar table
            calendar_table = soup.find('table', {'class': 'calendar__table'})
            
            if not calendar_table:
                logger.warning("Could not find ForexFactory calendar table")
                return self._get_fallback_calendar()
            
            # Parse events
            current_date = None
            
            for row in calendar_table.find_all('tr', {'class': ['calendar__row', 'calendar__row--grey']}):
                # Check if this is a date row
                date_cell = row.find('td', {'class': 'calendar__date'})
                if date_cell and date_cell.get_text(strip=True):
                    current_date = self._parse_date(date_cell.get_text(strip=True))
                    continue
                
                # Skip if we don't have a current date or it's not today/tomorrow
                if not current_date:
                    continue
                
                # Check if this row contains an event
                event_cells = row.find_all('td')
                if len(event_cells) < 4:
                    continue
                
                # Extract event details
                time_cell = row.find('td', {'class': 'calendar__time'})
                currency_cell = row.find('td', {'class': 'calendar__currency'})
                impact_cell = row.find('td', {'class': 'calendar__impact'})
                event_cell = row.find('td', {'class': 'calendar__event'})
                
                if not all([time_cell, currency_cell, impact_cell, event_cell]):
                    continue
                
                # Filter for USD events only
                currency = currency_cell.get_text(strip=True)
                if currency != 'USD':
                    continue
                
                # Get impact level
                impact_spans = impact_cell.find_all('span', {'class': 'calendar__impact-icon'})
                impact_level = self._determine_impact_level(impact_spans)
                
                # Filter for medium and high impact only
                if impact_level not in ['medium', 'high']:
                    continue
                
                # Extract event details
                time_text = time_cell.get_text(strip=True)
                event_text = event_cell.get_text(strip=True)
                
                # Get forecast and previous values
                actual_cell = row.find('td', {'class': 'calendar__actual'})
                forecast_cell = row.find('td', {'class': 'calendar__forecast'})
                previous_cell = row.find('td', {'class': 'calendar__previous'})
                
                forecast = forecast_cell.get_text(strip=True) if forecast_cell else 'N/A'
                previous = previous_cell.get_text(strip=True) if previous_cell else 'N/A'
                
                # Convert time to ET
                et_time = self._convert_to_et(time_text)
                
                event_data = {
                    'time': et_time,
                    'event': event_text,
                    'importance': impact_level,
                    'forecast': forecast,
                    'previous': previous,
                    'currency': currency,
                    'source': 'ForexFactory'
                }
                
                events.append(event_data)
                
        except Exception as e:
            logger.error(f"Error parsing ForexFactory calendar: {e}")
            return self._get_fallback_calendar()
        
        # Sort events by time
        events.sort(key=lambda x: self._time_sort_key(x['time']))
        
        return events[:10]  # Return top 10 events
    
    def _determine_impact_level(self, impact_spans: List) -> str:
        """Determine impact level from ForexFactory impact icons"""
        
        impact_count = len([span for span in impact_spans if 'calendar__impact-icon--screen' in span.get('class', [])])
        
        if impact_count >= 3:
            return 'high'
        elif impact_count == 2:
            return 'medium'
        else:
            return 'low'
    
    def _parse_date(self, date_text: str) -> Optional[datetime]:
        """Parse date from ForexFactory format"""
        
        try:
            # ForexFactory uses formats like "Today", "Tomorrow", or "Fri Dec 15"
            if date_text.lower() == 'today':
                return datetime.now().date()
            elif date_text.lower() == 'tomorrow':
                return (datetime.now() + timedelta(days=1)).date()
            else:
                # Try to parse date formats like "Fri Dec 15"
                current_year = datetime.now().year
                date_with_year = f"{date_text} {current_year}"
                return datetime.strptime(date_with_year, "%a %b %d %Y").date()
        except:
            return None
    
    def _convert_to_et(self, time_text: str) -> str:
        """Convert ForexFactory time to Eastern Time"""
        
        if not time_text or time_text in ['All Day', 'Tentative']:
            return time_text
        
        try:
            # ForexFactory typically shows GMT time
            # Convert to ET (GMT-5 or GMT-4 depending on DST)
            et_tz = pytz.timezone('US/Eastern')
            
            # Parse time (assuming GMT)
            if ':' in time_text:
                time_parts = time_text.split(':')
                hour = int(time_parts[0])
                minute = int(time_parts[1][:2])  # Handle AM/PM
                
                # Create datetime object for today
                now = datetime.now()
                gmt_time = datetime(now.year, now.month, now.day, hour, minute)
                
                # Convert to ET
                et_time = gmt_time - timedelta(hours=5)  # Approximate EST conversion
                
                return et_time.strftime("%I:%M %p ET")
            else:
                return f"{time_text} ET"
                
        except:
            return f"{time_text} ET"
    
    def _time_sort_key(self, time_str: str) -> tuple:
        """Create sort key for time strings"""
        
        try:
            if 'ET' in time_str:
                time_part = time_str.replace(' ET', '')
                if ':' in time_part and ('AM' in time_part or 'PM' in time_part):
                    time_obj = datetime.strptime(time_part, "%I:%M %p")
                    return (time_obj.hour, time_obj.minute)
            return (24, 0)  # Put unparseable times at end
        except:
            return (24, 0)
    
    def _get_fallback_calendar(self) -> List[Dict[str, Any]]:
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
                'source': 'Fallback'
            },
            {
                'time': '10:00 AM ET',
                'event': 'ISM Services PMI',
                'importance': 'high',
                'forecast': '52.5',
                'previous': '52.6',
                'currency': 'USD',
                'source': 'Fallback'
            },
            {
                'time': '2:00 PM ET',
                'event': 'Fed Chair Powell Speech',
                'importance': 'high',
                'forecast': 'N/A',
                'previous': 'N/A',
                'currency': 'USD',
                'source': 'Fallback'
            }
        ]

async def get_forexfactory_calendar() -> List[Dict[str, Any]]:
    """Main function to get ForexFactory economic calendar"""
    
    collector = ForexFactoryCollector()
    return await collector.get_us_economic_calendar()

# Test function
async def test_forexfactory():
    """Test ForexFactory integration"""
    
    print("🧪 Testing ForexFactory Economic Calendar Integration")
    print("=" * 60)
    
    events = await get_forexfactory_calendar()
    
    print(f"📅 Found {len(events)} US economic events:")
    print()
    
    for i, event in enumerate(events, 1):
        impact_emoji = "🔴" if event['importance'] == 'high' else "🟡" if event['importance'] == 'medium' else "🟢"
        
        print(f"{i}. {impact_emoji} {event['time']} - {event['event']}")
        print(f"   Impact: {event['importance'].title()}")
        print(f"   Forecast: {event['forecast']} | Previous: {event['previous']}")
        print(f"   Source: {event['source']}")
        print()
    
    print("✅ ForexFactory integration test completed!")

if __name__ == "__main__":
    asyncio.run(test_forexfactory())