#!/usr/bin/env python3
"""
Polygon.io Rate Limit Experiment
================================

Simulates $29 plan coverage while respecting 5 calls/minute limit
This is a temporary experiment to assess data quality
"""

import asyncio
import logging
from datetime import datetime
import json
from polygon_collector import PolygonCollector

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def rate_limited_data_collection():
    """Collect all data that would be available with $29 plan, respecting rate limits"""
    
    collector = PolygonCollector()
    all_data = {
        'collection_started': datetime.now().isoformat(),
        'previous_close': {},
        'futures': {},
        'international': {},
        'sector_rotation': {},
        'collection_phases': []
    }
    
    # Phase 1: First 5 calls - Major indices
    phase1_start = datetime.now()
    logger.info("=== PHASE 1: Major Indices (5 calls) ===")
    
    symbols_phase1 = [
        ('SPY', 'S&P 500'),
        ('QQQ', 'NASDAQ'),
        ('IWM', 'Russell 2000'),
        ('DIA', 'Dow Jones'),
        ('VIX', 'Volatility Index')
    ]
    
    for symbol, name in symbols_phase1:
        if collector.requests_made >= 5:
            logger.warning(f"Rate limit reached in Phase 1, stopping at {symbol}")
            break
            
        try:
            data = await collector._get_previous_close(symbol)
            if data:
                all_data['previous_close'][name] = {
                    'symbol': symbol,
                    'close': data.get('c'),
                    'open': data.get('o'),
                    'high': data.get('h'),
                    'low': data.get('l'),
                    'volume': data.get('v'),
                    'change': data.get('c') - data.get('o'),
                    'change_percent': ((data.get('c') - data.get('o')) / data.get('o')) * 100
                }
                logger.info(f"✅ {name}: ${data.get('c')}")
            else:
                logger.warning(f"❌ No data for {name}")
        except Exception as e:
            logger.error(f"Error getting {symbol}: {e}")
    
    all_data['collection_phases'].append({
        'phase': 1,
        'description': 'Major Indices',
        'calls_made': collector.requests_made,
        'duration': (datetime.now() - phase1_start).total_seconds()
    })
    
    # Wait 60 seconds for rate limit reset
    logger.info("⏰ Waiting 60 seconds for rate limit reset...")
    await asyncio.sleep(60)
    collector.requests_made = 0
    
    # Phase 2: Sector ETFs (first 5)
    phase2_start = datetime.now()
    logger.info("\n=== PHASE 2: Sector ETFs Part 1 (5 calls) ===")
    
    sector_etfs_phase2 = [
        ('XLK', 'Technology'),
        ('XLF', 'Financial'),
        ('XLE', 'Energy'),
        ('XLV', 'Healthcare'),
        ('XLI', 'Industrial')
    ]
    
    for symbol, sector in sector_etfs_phase2:
        if collector.requests_made >= 5:
            break
            
        try:
            # Get weekly data for sector rotation
            historical = await collector._get_historical_data(symbol, days=7)
            if historical and len(historical) >= 2:
                week_start = historical[0].get('c', 0)
                week_end = historical[-1].get('c', 0)
                weekly_return = ((week_end - week_start) / week_start) * 100
                
                all_data['sector_rotation'][sector] = {
                    'symbol': symbol,
                    'weekly_return': round(weekly_return, 2),
                    'current_price': week_end,
                    'week_start_price': week_start
                }
                logger.info(f"✅ {sector}: {weekly_return:+.2f}% weekly")
            else:
                logger.warning(f"❌ No historical data for {sector}")
        except Exception as e:
            logger.error(f"Error getting {symbol}: {e}")
    
    all_data['collection_phases'].append({
        'phase': 2,
        'description': 'Sector ETFs Part 1',
        'calls_made': collector.requests_made,
        'duration': (datetime.now() - phase2_start).total_seconds()
    })
    
    # Wait 60 seconds
    logger.info("⏰ Waiting 60 seconds for rate limit reset...")
    await asyncio.sleep(60)
    collector.requests_made = 0
    
    # Phase 3: Remaining Sector ETFs
    phase3_start = datetime.now()
    logger.info("\n=== PHASE 3: Sector ETFs Part 2 (5 calls) ===")
    
    sector_etfs_phase3 = [
        ('XLP', 'Consumer Staples'),
        ('XLY', 'Consumer Discretionary'),
        ('XLU', 'Utilities'),
        ('XLB', 'Materials'),
        ('XLRE', 'Real Estate')
    ]
    
    for symbol, sector in sector_etfs_phase3:
        if collector.requests_made >= 5:
            break
            
        try:
            historical = await collector._get_historical_data(symbol, days=7)
            if historical and len(historical) >= 2:
                week_start = historical[0].get('c', 0)
                week_end = historical[-1].get('c', 0)
                weekly_return = ((week_end - week_start) / week_start) * 100
                
                all_data['sector_rotation'][sector] = {
                    'symbol': symbol,
                    'weekly_return': round(weekly_return, 2),
                    'current_price': week_end,
                    'week_start_price': week_start
                }
                logger.info(f"✅ {sector}: {weekly_return:+.2f}% weekly")
            else:
                logger.warning(f"❌ No historical data for {sector}")
        except Exception as e:
            logger.error(f"Error getting {symbol}: {e}")
    
    all_data['collection_phases'].append({
        'phase': 3,
        'description': 'Sector ETFs Part 2',
        'calls_made': collector.requests_made,
        'duration': (datetime.now() - phase3_start).total_seconds()
    })
    
    # Wait 60 seconds
    logger.info("⏰ Waiting 60 seconds for rate limit reset...")
    await asyncio.sleep(60)
    collector.requests_made = 0
    
    # Phase 4: International Markets
    phase4_start = datetime.now()
    logger.info("\n=== PHASE 4: International Markets (5 calls) ===")
    
    intl_etfs = [
        ('EWJ', 'Japan (Nikkei)'),
        ('EWH', 'Hong Kong (Hang Seng)'),
        ('EWU', 'UK (FTSE)'),
        ('EWG', 'Germany (DAX)'),
        ('EWQ', 'France (CAC)')
    ]
    
    for symbol, name in intl_etfs:
        if collector.requests_made >= 5:
            break
            
        try:
            data = await collector._get_previous_close(symbol)
            if data:
                all_data['international'][name] = {
                    'symbol': symbol,
                    'close': data.get('c'),
                    'open': data.get('o'),
                    'change': data.get('c') - data.get('o'),
                    'change_percent': ((data.get('c') - data.get('o')) / data.get('o')) * 100
                }
                logger.info(f"✅ {name}: ${data.get('c')}")
            else:
                logger.warning(f"❌ No data for {name}")
        except Exception as e:
            logger.error(f"Error getting {symbol}: {e}")
    
    all_data['collection_phases'].append({
        'phase': 4,
        'description': 'International Markets',
        'calls_made': collector.requests_made,
        'duration': (datetime.now() - phase4_start).total_seconds()
    })
    
    # Final summary
    all_data['collection_completed'] = datetime.now().isoformat()
    all_data['total_duration_seconds'] = (datetime.now() - datetime.fromisoformat(all_data['collection_started'])).total_seconds()
    
    # Calculate sector rotation leaders/laggards
    if all_data['sector_rotation']:
        sorted_sectors = sorted(all_data['sector_rotation'].items(), 
                              key=lambda x: x[1]['weekly_return'], 
                              reverse=True)
        all_data['sector_leaders'] = sorted_sectors[:3]
        all_data['sector_laggards'] = sorted_sectors[-3:]
    
    return all_data

async def main():
    """Run the rate limit experiment"""
    
    logger.info("🧪 Starting Polygon.io Rate Limit Experiment")
    logger.info("This simulates $29 plan coverage with current rate limits")
    logger.info("Total estimated time: ~4 minutes")
    logger.info("=" * 60)
    
    # Collect data with rate limiting
    results = await rate_limited_data_collection()
    
    # Save results
    filename = f"polygon_experiment_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    # Print summary
    logger.info("\n" + "=" * 60)
    logger.info("📊 EXPERIMENT COMPLETE - SUMMARY")
    logger.info("=" * 60)
    
    logger.info(f"\n📈 Market Data Collected: {len(results['previous_close'])} indices")
    for name, data in results['previous_close'].items():
        logger.info(f"  • {name}: ${data['close']} ({data['change_percent']:+.2f}%)")
    
    logger.info(f"\n🔄 Sector Rotation Data: {len(results['sector_rotation'])} sectors")
    if results.get('sector_leaders'):
        logger.info("  Top 3 Leaders:")
        for sector, data in results['sector_leaders']:
            logger.info(f"    • {sector}: {data['weekly_return']:+.2f}%")
    
    logger.info(f"\n🌍 International Markets: {len(results['international'])} markets")
    for name, data in results['international'].items():
        logger.info(f"  • {name}: ${data['close']} ({data['change_percent']:+.2f}%)")
    
    logger.info(f"\n⏱️ Total Collection Time: {results['total_duration_seconds']:.1f} seconds")
    logger.info(f"📄 Results saved to: {filename}")
    
    return results

if __name__ == "__main__":
    asyncio.run(main())