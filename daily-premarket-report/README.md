# Daily Premarket Report System

## Overview
Automated daily report generation system for portfolio managers and hedge funds, delivering comprehensive market intelligence at 5:00 AM Central Time.

## System Architecture

### Report Delivery
- **PDF Report**: Professional formatted document with charts and analysis
- **Audio File**: 15-20 minute podcast-style briefing
- **Distribution**: Email delivery, Notion integration, podcast platforms

### Target Audience
- Portfolio Managers (institutional)
- Hedge Fund Managers
- Investment Analysts
- Financial Advisors managing large portfolios

### Key Investment Focus Areas
- **Large Cap US Equities** (S&P 500, Russell 1000)
- **Fixed Income** (US Treasuries, Corporate Bonds, Municipal Bonds)
- **International Markets** (Developed: Europe, Japan; Emerging: China, India, Brazil)
- **Commodities** (Gold, Oil, Agricultural)
- **Currencies** (Major pairs: EUR/USD, USD/JPY, GBP/USD)
- **Real Estate** (REITs, Commercial Real Estate)
- **Alternative Investments** (Private Equity impacts, Hedge Fund flows)

## Report Structure

### Executive Summary (2 minutes / 1 page)
- Market sentiment overview
- Key overnight developments
- Top 3 actionable insights
- Risk assessment summary

### Market Performance Analysis (5 minutes / 2-3 pages)
- Overnight futures performance
- Asian markets recap
- European markets (if applicable)
- Currency movements
- Commodity updates
- Bond market movements

### News & Events Impact (5-8 minutes / 2-3 pages)
- Federal Reserve communications
- Economic data releases
- Corporate earnings highlights
- Geopolitical developments
- Regulatory changes
- Central bank activities (ECB, BoJ, BoE)

### Sector & Security Spotlight (3-5 minutes / 1-2 pages)
- Top performing sectors
- Notable individual stock moves
- Options flow analysis
- Institutional money flows
- Earnings calendar preview

### Technical Analysis (2-3 minutes / 1 page)
- Key support/resistance levels
- Market breadth indicators
- VIX and volatility measures
- Momentum indicators

### Economic Calendar & Risk Events (1-2 minutes / 1 page)
- Today's economic releases
- This week's key events
- Upcoming earnings
- Fed speakers and events

## Automation Features
- 5:00 AM Central Time execution
- Multi-source data aggregation
- AI-powered analysis and insights
- Automated PDF generation
- Text-to-speech audio generation
- Multi-channel distribution

## Premium Data Sources Integration

### ✅ Enhanced Data Sources (NEW!)
- **TradingView**: Professional-grade market data, charts, and technical analysis
  - Futures markets (ES, NQ, RTY, YM)
  - International indices (Nikkei, Hang Seng, FTSE, DAX, CAC)
  - Cryptocurrency markets (BTC, ETH, ADA, SOL)
  - Real-time pricing and volume data
- **Finviz.com**: Market overview, sector analysis, and curated news
  - Sector performance tracking
  - Top gainers and losers
  - Market breadth indicators
  - Volatility analysis
  - **News Headlines**: Intelligent evaluation of market-relevant news from finviz.com/news
- **ForexFactory.com**: Economic calendar with filtered events
  - **US Economic Events**: Filtered for medium and high impact only
  - Real-time event updates with importance indicators
  - Forecast vs. previous data comparisons
- **fiscal.ai**: Financial analysis and earnings calendar
  - Upcoming earnings releases
  - Financial metrics and ratios
  - Company fundamental data

### Standard Data Sources
- Yahoo Finance (fallback)
- News aggregation services
- Economic calendar APIs
- Social sentiment analysis

## Quick Start

### Installation
```bash
# Clone or navigate to the project directory
cd daily-premarket-report

# Install dependencies
pip install -r requirements.txt
```

### Environment Setup
```bash
# Required for audio generation (optional)
export OPENAI_API_KEY="your_openai_api_key_here"

# Notion integration (optional but recommended)
# Run the setup script after creating your Notion integration
python setup_notion.py
```

### Usage

#### Generate Example Report
```bash
# Standard example report
python main.py --example

# Enhanced example with premium data sources
python enhanced_main.py --enhanced-example

# 🎯 NEW: Notion page report (recommended!)
python main.py --notion-page
```

#### Start Daily Scheduler
```bash
# Start automated daily reports at 5:00 AM Central
python main.py --schedule

# Start with Notion integration (saves reports automatically)
python main.py --schedule-notion
```

#### Test Notion Integration
```bash
# Test saving reports to Notion
python main.py --test-notion
```

#### System Status
```bash
# Standard system status
python main.py --status

# Enhanced system status with premium data sources
python enhanced_main.py --enhanced-status
```

#### Setup Enhanced Data Sources
```bash
# Configure TradingView, fiscal.ai, and Finviz integration
python enhanced_main.py --setup-config
```

## Output Files

Each daily report generates:
- **📄 Notion Page**: Comprehensive, well-formatted page with interactive tables (recommended!)
- **🎧 Audio File**: 15-20 minute podcast (`daily_premarket_report_YYYYMMDD.mp3`)
- **📊 Metadata**: Report statistics and information (`report_metadata_YYYYMMDD.json`)
- **🔗 Shareable URL**: Direct link to Notion page for easy distribution

### 💡 Why Notion Pages vs PDFs?
- ✅ **Perfect Formatting**: No PDF layout issues
- ✅ **Interactive Tables**: Color-coded, sortable data
- ✅ **Mobile Friendly**: Readable on any device
- ✅ **Easy Sharing**: Direct URL links
- ✅ **Export Options**: Can generate PDF from Notion if needed
- ✅ **Searchable**: Find specific information quickly

## System Architecture

```
Daily Scheduler (5:00 AM CT)
    ↓
Enhanced Data Collection
    ├── Premium Market Data (TradingView)
    ├── Sector Analysis (Finviz)
    ├── Earnings Calendar (fiscal.ai)
    ├── News Analysis (AI-powered)
    ├── Technical Analysis (Enhanced)
    └── Economic Calendar
    ↓
Report Generation
    ├── PDF Generation (ReportLab)
    └── Audio Generation (OpenAI TTS)
    ↓
Output Delivery
    ├── Local File System
    ├── Notion Workspace (Automated)
    └── Distribution Channels (Spotify/YouTube/Substack)
```

## Integration with SAFLA & FACT

This system leverages the enhanced AI capabilities from:
- **SAFLA**: Memory management, pattern detection, performance optimization
- **FACT**: Fast data retrieval with intelligent caching
- **Claude-flow**: Enhanced workflow coordination and automation

## ✅ Notion Integration Complete

Your Notion workspace is now set up with:
- **📊 Reports Database**: Structured storage of all daily reports
- **📈 Analytics Dashboard**: Performance metrics and trends
- **🔄 Automated Saving**: Reports automatically saved at 5:00 AM Central
- **📋 Rich Data**: Executive summaries, insights, risks, and opportunities

### Notion Workspace URLs:
- **Main Database**: Check your Notion for "Daily Premarket Reports Database"
- **Analytics Page**: View system performance and trends
- **Individual Reports**: Each report gets its own detailed page

## Next Steps

1. **✅ Notion Integration**: ✅ COMPLETE - Reports auto-save to your workspace
2. **Distribution Setup**: Configure Spotify, YouTube, Substack publishing
3. **Enhanced Data Sources**: Integrate Bloomberg/Reuters APIs
4. **OpenAI Audio**: Add API key for actual audio file generation
5. **Performance Optimization**: Further SAFLA/FACT integration