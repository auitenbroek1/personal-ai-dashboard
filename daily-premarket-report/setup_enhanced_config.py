#!/usr/bin/env python3
"""
Setup Enhanced Configuration
===========================

Non-interactive setup for enhanced data sources
"""

import os
import json

def setup_config():
    """Setup enhanced data configuration"""
    
    print("🔧 Setting up Enhanced Data Sources Configuration")
    print("=" * 60)
    
    config = {
        "tradingview": {
            "username": "auitenbroek",
            "password": "TVizda14me!",
            "enabled": True
        },
        "fiscal_ai": {
            "enabled": False,  # Will enable when API key is provided
            "api_key": ""
        },
        "finviz": {
            "enabled": True,
            "rate_limit": 1,
            "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        },
        "enhanced_features": {
            "sector_analysis": True,
            "crypto_tracking": True,
            "earnings_calendar": False,  # Requires fiscal.ai
            "top_movers_analysis": True,
            "volatility_regime_detection": True
        }
    }
    
    # Save configuration
    config_file = "enhanced_data_config.json"
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    # Set secure permissions
    os.chmod(config_file, 0o600)
    
    print("✅ TradingView: Configured for user 'auitenbroek'")
    print("✅ Finviz: Web scraping enabled with rate limiting")
    print("⏭️  fiscal.ai: Available when API key added")
    print(f"💾 Configuration saved to: {config_file}")
    
    # Create environment template
    env_content = """# Enhanced Data Sources Environment Variables
export TRADINGVIEW_USERNAME="auitenbroek"
export TRADINGVIEW_PASSWORD="TVizda14me!"
export FISCAL_AI_API_KEY=""
export FINVIZ_RATE_LIMIT="1"
export OPENAI_API_KEY=""
"""
    
    with open('.env.template', 'w') as f:
        f.write(env_content)
    
    print("\n🎯 Enhanced Data Sources Ready!")
    print("📍 Configured premium data sources:")
    print("   • ✅ TradingView: Professional market data and charts")
    print("   • ✅ Finviz: Market overview, sector analysis, top movers")
    print("   • ⏭️  fiscal.ai: Add API key for earnings calendar")
    
    return config

if __name__ == "__main__":
    setup_config()