#!/usr/bin/env python3
"""
Notion Setup Script
==================

Sets up the complete Notion workspace for Daily Premarket Reports
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.notion_integration import NotionIntegration
import json

def main():
    # Your Notion integration token
    NOTION_TOKEN = "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"
    
    # Extract page ID from URL: https://www.notion.so/Daily-Premarket-Reports-229bfe288ab580e9ba1bd9db16dbf71d
    PAGE_ID = "229bfe288ab580e9ba1bd9db16dbf71d"
    
    print("🚀 Setting up Notion Integration for Daily Premarket Reports")
    print("=" * 60)
    
    try:
        # Initialize Notion integration
        notion = NotionIntegration(NOTION_TOKEN)
        
        # Test connection
        print("📡 Testing Notion API connection...")
        if not notion.test_connection():
            print("❌ Connection failed! Please check your integration token.")
            return
        
        print("✅ Connected to Notion successfully!")
        
        # Set up workspace
        print("\n🏗️  Creating Notion workspace structure...")
        workspace = notion.setup_workspace(PAGE_ID)
        
        print("✅ Workspace setup complete!")
        print(f"📊 Database ID: {workspace['database_id']}")
        print(f"📈 Analytics Page ID: {workspace['analytics_page_id']}")
        
        # Save configuration
        config = {
            "notion_token": NOTION_TOKEN,
            "main_page_id": workspace['main_page_id'],
            "database_id": workspace['database_id'],
            "analytics_page_id": workspace['analytics_page_id']
        }
        
        config_file = "notion_config.json"
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"\n💾 Configuration saved to: {config_file}")
        
        print("\n🎯 Notion Workspace Ready!")
        print("=" * 60)
        print("📍 Your Notion workspace now includes:")
        print("   • 📊 Daily Reports Database")
        print("   • 📈 Analytics Dashboard")
        print("   • 🔄 Automated Report Saving")
        print("   • 📋 Structured Data Organization")
        print("\n🚀 The system will now automatically save reports to Notion!")
        
    except Exception as e:
        print(f"❌ Error setting up Notion workspace: {e}")
        print("\nPlease check:")
        print("1. Your integration token is correct")
        print("2. The integration has access to your page")
        print("3. Your internet connection is stable")

if __name__ == "__main__":
    main()