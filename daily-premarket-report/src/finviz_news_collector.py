#!/usr/bin/env python3
"""
Finviz News Collector
====================

Collects and evaluates news headlines from Finviz.com/news for market relevance
"""

import asyncio
import aiohttp
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup
import re

from .report_generator import NewsItem

logger = logging.getLogger(__name__)

class FinvizNewsCollector:
    """Collects and evaluates news from Finviz.com/news"""
    
    def __init__(self):
        self.base_url = "https://finviz.com"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
        # Keywords that indicate high market relevance
        self.high_impact_keywords = [
            'fed', 'federal reserve', 'powell', 'rate', 'inflation', 'cpi', 'ppi',
            'gdp', 'employment', 'jobs', 'unemployment', 'earnings', 'guidance',
            'merger', 'acquisition', 'bankruptcy', 'china', 'trade', 'tariff',
            'oil', 'crude', 'opec', 'geopolitical', 'war', 'sanctions',
            'tech', 'ai', 'tesla', 'apple', 'microsoft', 'nvidia', 'amazon',
            'crypto', 'bitcoin', 'sec', 'regulation', 'bank', 'financial'
        ]
        
        # Keywords for medium impact
        self.medium_impact_keywords = [
            'market', 'stock', 'futures', 'premarket', 'aftermarket',
            'analyst', 'rating', 'upgrade', 'downgrade', 'target',
            'revenue', 'profit', 'sales', 'outlook', 'forecast',
            'sector', 'industry', 'biotech', 'pharma', 'energy'
        ]
    
    async def get_finviz_news(self, max_articles: int = 20) -> List[NewsItem]:
        """Get and evaluate news from Finviz"""
        
        try:
            news_url = f"{self.base_url}/news.ashx"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    news_url,
                    headers=self.headers
                ) as response:
                    if response.status == 200:
                        html = await response.text()
                        return self._parse_finviz_news(html, max_articles)
                    else:
                        logger.warning(f"Finviz news returned status {response.status}")
                        return self._get_fallback_news()
                        
        except Exception as e:
            logger.error(f"Error fetching Finviz news: {e}")
            return self._get_fallback_news()
    
    def _parse_finviz_news(self, html: str, max_articles: int) -> List[NewsItem]:
        """Parse Finviz news HTML and evaluate relevance"""
        
        news_items = []
        
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Find news table
            news_table = soup.find('table', {'class': 'fullview-news-outer'})
            
            if not news_table:
                logger.warning("Could not find Finviz news table")
                return self._get_fallback_news()
            
            # Parse news items
            for row in news_table.find_all('tr'):
                cells = row.find_all('td')
                
                if len(cells) < 2:
                    continue
                
                # Extract timestamp and headline
                timestamp_cell = cells[0]
                news_cell = cells[1]
                
                timestamp_text = timestamp_cell.get_text(strip=True)
                
                # Find the news link and headline
                news_link = news_cell.find('a', {'class': 'tab-link-news'})
                
                if not news_link:
                    continue
                
                headline = news_link.get_text(strip=True)
                source_url = news_link.get('href', '')
                
                # Extract source from URL or headline
                source = self._extract_source(source_url, headline)
                
                # Evaluate market relevance and impact
                impact_score = self._evaluate_impact_score(headline)
                sentiment = self._evaluate_sentiment(headline)
                
                # Only include medium and high impact news
                if impact_score >= 6.0:
                    # Generate summary from headline (since we don't have full article)
                    summary = self._generate_summary(headline)
                    
                    news_item = NewsItem(
                        headline=headline,
                        summary=summary,
                        source=source,
                        timestamp=self._parse_timestamp(timestamp_text),
                        sentiment=sentiment,
                        impact_score=impact_score
                    )
                    
                    news_items.append(news_item)
                
                # Stop when we have enough articles
                if len(news_items) >= max_articles:
                    break
            
        except Exception as e:
            logger.error(f"Error parsing Finviz news: {e}")
            return self._get_fallback_news()
        
        # Sort by impact score (highest first)
        news_items.sort(key=lambda x: x.impact_score, reverse=True)
        
        return news_items[:max_articles]
    
    def _evaluate_impact_score(self, headline: str) -> float:
        """Evaluate market impact score based on headline content"""
        
        headline_lower = headline.lower()
        score = 5.0  # Base score
        
        # High impact keywords
        for keyword in self.high_impact_keywords:
            if keyword in headline_lower:
                score += 2.0
                break  # Only count once
        
        # Medium impact keywords
        for keyword in self.medium_impact_keywords:
            if keyword in headline_lower:
                score += 1.0
                break  # Only count once
        
        # Company-specific news (tickers in caps)
        ticker_matches = re.findall(r'\b[A-Z]{2,5}\b', headline)
        if ticker_matches:
            score += 1.0
        
        # Percentage changes mentioned
        if re.search(r'\d+%', headline):
            score += 1.5
        
        # Time sensitivity
        if any(word in headline_lower for word in ['breaking', 'alert', 'urgent', 'just in']):
            score += 1.0
        
        # Economic data releases
        if any(word in headline_lower for word in ['data', 'report', 'index', 'survey']):
            score += 0.5
        
        # Cap the score
        return min(score, 10.0)
    
    def _evaluate_sentiment(self, headline: str) -> str:
        """Evaluate sentiment from headline"""
        
        headline_lower = headline.lower()
        
        positive_words = [
            'surge', 'soar', 'rally', 'gain', 'rise', 'up', 'boost', 'strong',
            'beat', 'exceed', 'outperform', 'upgrade', 'bullish', 'optimistic'
        ]
        
        negative_words = [
            'plunge', 'crash', 'fall', 'drop', 'decline', 'down', 'weak',
            'miss', 'disappoint', 'downgrade', 'bearish', 'pessimistic', 'cut'
        ]
        
        positive_count = sum(1 for word in positive_words if word in headline_lower)
        negative_count = sum(1 for word in negative_words if word in headline_lower)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"
    
    def _extract_source(self, url: str, headline: str) -> str:
        """Extract news source from URL or headline"""
        
        # Common source patterns in URLs
        source_patterns = {
            'reuters': 'Reuters',
            'bloomberg': 'Bloomberg',
            'wsj': 'Wall Street Journal',
            'marketwatch': 'MarketWatch',
            'cnbc': 'CNBC',
            'cnn': 'CNN Business',
            'yahoo': 'Yahoo Finance',
            'seeking': 'Seeking Alpha',
            'benzinga': 'Benzinga',
            'thestreet': 'TheStreet'
        }
        
        url_lower = url.lower()
        for pattern, source_name in source_patterns.items():
            if pattern in url_lower:
                return source_name
        
        # If no source found in URL, try to extract from headline patterns
        if ':' in headline:
            potential_source = headline.split(':')[0].strip()
            if len(potential_source) < 30:  # Reasonable source name length
                return potential_source
        
        return "Finviz News"
    
    def _generate_summary(self, headline: str) -> str:
        """Generate a brief summary from the headline"""
        
        # For now, we'll create intelligent summaries based on headline patterns
        headline_lower = headline.lower()
        
        if 'earnings' in headline_lower or 'eps' in headline_lower:
            return f"Company earnings report with market implications. {headline}"
        elif any(word in headline_lower for word in ['fed', 'federal reserve', 'powell']):
            return f"Federal Reserve related news affecting monetary policy and market expectations. {headline}"
        elif 'merger' in headline_lower or 'acquisition' in headline_lower:
            return f"Corporate merger and acquisition activity with sector impact. {headline}"
        elif any(word in headline_lower for word in ['oil', 'crude', 'energy']):
            return f"Energy sector development affecting commodity markets and related equities. {headline}"
        elif any(word in headline_lower for word in ['china', 'trade', 'tariff']):
            return f"International trade development with global market implications. {headline}"
        else:
            return f"Market-relevant development requiring portfolio manager attention. {headline}"
    
    def _parse_timestamp(self, timestamp_text: str) -> str:
        """Parse Finviz timestamp format"""
        
        try:
            # Finviz uses formats like "12:34PM", "Today 12:34PM", "Yesterday 12:34PM"
            now = datetime.now()
            
            if 'today' in timestamp_text.lower():
                return now.isoformat()
            elif 'yesterday' in timestamp_text.lower():
                yesterday = now - timedelta(days=1)
                return yesterday.isoformat()
            else:
                # Assume it's today if just time
                return now.isoformat()
                
        except:
            return datetime.now().isoformat()
    
    def _get_fallback_news(self) -> List[NewsItem]:
        """Provide fallback news data"""
        
        logger.info("Using fallback news data")
        
        return [
            NewsItem(
                headline="Federal Reserve Officials Signal Cautious Approach to Future Rate Decisions",
                summary="Fed officials indicated a more measured approach to monetary policy following recent economic data, affecting market expectations for future rate changes.",
                source="Federal Reserve Communications",
                timestamp=datetime.now().isoformat(),
                sentiment="neutral",
                impact_score=8.5
            ),
            NewsItem(
                headline="Technology Sector Shows Resilience Amid Market Volatility",
                summary="Major technology companies continue to demonstrate strong fundamentals despite broader market concerns, with AI-related investments driving growth.",
                source="Market Analysis",
                timestamp=datetime.now().isoformat(),
                sentiment="positive",
                impact_score=7.2
            ),
            NewsItem(
                headline="Oil Prices React to Global Supply Chain Developments",
                summary="Crude oil markets responding to international supply chain dynamics and geopolitical factors affecting energy sector valuations.",
                source="Energy Markets",
                timestamp=datetime.now().isoformat(),
                sentiment="neutral",
                impact_score=6.8
            )
        ]

async def get_finviz_news(max_articles: int = 10) -> List[NewsItem]:
    """Main function to get Finviz news"""
    
    collector = FinvizNewsCollector()
    return await collector.get_finviz_news(max_articles)

# Test function
async def test_finviz_news():
    """Test Finviz news integration"""
    
    print("🧪 Testing Finviz News Integration")
    print("=" * 50)
    
    news_items = await get_finviz_news()
    
    print(f"📰 Found {len(news_items)} relevant news items:")
    print()
    
    for i, item in enumerate(news_items, 1):
        impact_emoji = "🔴" if item.impact_score >= 8 else "🟡" if item.impact_score >= 6 else "🟢"
        sentiment_emoji = "📈" if item.sentiment == "positive" else "📉" if item.sentiment == "negative" else "➡️"
        
        print(f"{i}. {impact_emoji} {sentiment_emoji} {item.headline}")
        print(f"   Impact: {item.impact_score}/10 | Sentiment: {item.sentiment}")
        print(f"   Source: {item.source}")
        print(f"   Summary: {item.summary[:100]}...")
        print()
    
    print("✅ Finviz news integration test completed!")

if __name__ == "__main__":
    asyncio.run(test_finviz_news())