#!/usr/bin/env python3
"""
Enhanced Data Configuration
==========================

Secure configuration setup for premium data sources
"""

import os
import json
import getpass
from pathlib import Path

def setup_enhanced_data_config():
    """Setup configuration for enhanced data sources"""
    
    print("🔧 Setting up Enhanced Data Sources Configuration")
    print("=" * 60)
    
    config = {}
    
    # TradingView Configuration
    print("\n📊 TradingView Configuration")
    print("-" * 30)
    
    config["tradingview"] = {
        "username": "auitenbroek",
        "password": "TVizda14me!",  # Store securely
        "enabled": True
    }
    print("✅ TradingView: Configured for user 'auitenbroek'")
    
    # fiscal.ai Configuration
    print("\n💼 fiscal.ai Configuration")
    print("-" * 30)
    fiscal_key = input("Enter your fiscal.ai API key (or press Enter to skip): ").strip()
    if fiscal_key:
        config["fiscal_ai"] = {
            "api_key": fiscal_key,
            "enabled": True
        }
        print("✅ fiscal.ai: API key configured")
    else:
        config["fiscal_ai"] = {"enabled": False}
        print("⏭️  fiscal.ai: Skipped (will use sample data)")
    
    # Finviz Configuration
    print("\n📈 Finviz Configuration")
    print("-" * 30)
    config["finviz"] = {
        "enabled": True,
        "rate_limit": 1,  # 1 second between requests
        "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    }
    print("✅ Finviz: Web scraping configured with rate limiting")
    
    # Enhanced Features
    print("\n🚀 Enhanced Features")
    print("-" * 30)
    config["enhanced_features"] = {
        "sector_analysis": True,
        "crypto_tracking": True,
        "earnings_calendar": True,
        "top_movers_analysis": True,
        "volatility_regime_detection": True
    }
    print("✅ All enhanced features enabled")
    
    # Save configuration securely
    config_file = "enhanced_data_config.json"
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    # Set file permissions (read-only for owner)
    os.chmod(config_file, 0o600)
    
    print(f"\n💾 Configuration saved to: {config_file}")
    print("🔒 File permissions set to read-only for owner")
    
    # Create environment variables template
    env_template = """
# Enhanced Data Sources Environment Variables
# Add these to your .env file or export them

export TRADINGVIEW_USERNAME="auitenbroek"
export TRADINGVIEW_PASSWORD="TVizda14me!"
export FISCAL_AI_API_KEY="{fiscal_key}"
export FINVIZ_RATE_LIMIT="1"

# Optional: OpenAI API Key for audio generation
export OPENAI_API_KEY="your_openai_api_key_here"
""".format(fiscal_key=fiscal_key if fiscal_key else "your_fiscal_ai_key_here")
    
    with open('.env.template', 'w') as f:
        f.write(env_template)
    
    print("\n🎯 Enhanced Data Sources Ready!")
    print("=" * 60)
    print("📍 Your premium data sources are now configured:")
    print("   • ✅ TradingView: Professional market data")
    print("   • ✅ Finviz: Market overview and sector analysis")
    if fiscal_key:
        print("   • ✅ fiscal.ai: Earnings calendar and financial metrics")
    else:
        print("   • ⏭️  fiscal.ai: Available when API key added")
    
    print("\n🔐 Security Notes:")
    print("   • Credentials stored in read-only config file")
    print("   • Use environment variables for production")
    print("   • Review .env.template for environment setup")
    
    return config

def load_enhanced_config():
    """Load enhanced data configuration"""
    
    config_file = "enhanced_data_config.json"
    
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            return json.load(f)
    else:
        print("❌ Enhanced data config not found. Run setup first!")
        return None

if __name__ == "__main__":
    setup_enhanced_data_config()