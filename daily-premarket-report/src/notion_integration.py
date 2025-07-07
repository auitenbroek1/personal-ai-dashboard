#!/usr/bin/env python3
"""
Notion Integration for Daily Premarket Reports
==============================================

Automated Notion workspace creation and report saving
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import requests
from pathlib import Path
import base64

from report_generator import ReportData

logger = logging.getLogger(__name__)

class NotionIntegration:
    """Handles all Notion API interactions for daily reports"""
    
    def __init__(self, integration_token: str = None):
        self.token = integration_token or os.getenv('NOTION_TOKEN')
        if not self.token:
            raise ValueError("Notion integration token is required")
            
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
        }
        self.base_url = "https://api.notion.com/v1"
        
    def create_reports_database(self, parent_page_id: str) -> str:
        """Create the main reports database"""
        
        database_data = {
            "parent": {"page_id": parent_page_id},
            "title": [{"type": "text", "text": {"content": "Daily Premarket Reports Database"}}],
            "properties": {
                "Report Date": {
                    "title": {}
                },
                "Market Sentiment": {
                    "select": {
                        "options": [
                            {"name": "Bullish", "color": "green"},
                            {"name": "Bearish", "color": "red"},
                            {"name": "Neutral", "color": "yellow"}
                        ]
                    }
                },
                "Risk Level": {
                    "select": {
                        "options": [
                            {"name": "Low", "color": "green"},
                            {"name": "Medium", "color": "yellow"},
                            {"name": "High", "color": "red"}
                        ]
                    }
                },
                "Audio Duration": {
                    "number": {
                        "format": "number_with_commas"
                    }
                },
                "News Items": {
                    "number": {}
                },
                "Generation Time": {
                    "created_time": {}
                },
                "Status": {
                    "select": {
                        "options": [
                            {"name": "Generated", "color": "blue"},
                            {"name": "Reviewed", "color": "yellow"},
                            {"name": "Distributed", "color": "green"}
                        ]
                    }
                },
                "PDF Report": {
                    "files": {}
                },
                "Audio File": {
                    "files": {}
                },
                "Key Insights": {
                    "rich_text": {}
                },
                "Primary Risks": {
                    "rich_text": {}
                },
                "Opportunities": {
                    "rich_text": {}
                }
            }
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/databases",
                headers=self.headers,
                json=database_data
            )
            response.raise_for_status()
            
            database = response.json()
            logger.info(f"Created reports database: {database['id']}")
            return database['id']
            
        except Exception as e:
            logger.error(f"Error creating database: {e}")
            raise
    
    def create_analytics_page(self, parent_page_id: str) -> str:
        """Create analytics dashboard page"""
        
        page_data = {
            "parent": {"page_id": parent_page_id},
            "properties": {
                "title": {
                    "title": [
                        {
                            "type": "text",
                            "text": {"content": "📊 Reports Analytics Dashboard"}
                        }
                    ]
                }
            },
            "children": [
                {
                    "object": "block",
                    "type": "heading_1",
                    "heading_1": {
                        "rich_text": [{"type": "text", "text": {"content": "📈 Daily Reports Analytics"}}]
                    }
                },
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {"content": "This dashboard provides insights into daily premarket report trends, market sentiment patterns, and system performance metrics."}
                            }
                        ]
                    }
                },
                {
                    "object": "block",
                    "type": "heading_2",
                    "heading_2": {
                        "rich_text": [{"type": "text", "text": {"content": "🎯 Key Metrics"}}]
                    }
                },
                {
                    "object": "block",
                    "type": "bulleted_list_item",
                    "bulleted_list_item": {
                        "rich_text": [{"type": "text", "text": {"content": "Total Reports Generated"}}]
                    }
                },
                {
                    "object": "block",
                    "type": "bulleted_list_item",
                    "bulleted_list_item": {
                        "rich_text": [{"type": "text", "text": {"content": "Average Audio Duration: 15-20 minutes"}}]
                    }
                },
                {
                    "object": "block",
                    "type": "bulleted_list_item",
                    "bulleted_list_item": {
                        "rich_text": [{"type": "text", "text": {"content": "Market Sentiment Distribution"}}]
                    }
                },
                {
                    "object": "block",
                    "type": "bulleted_list_item",
                    "bulleted_list_item": {
                        "rich_text": [{"type": "text", "text": {"content": "Risk Level Trends"}}]
                    }
                },
                {
                    "object": "block",
                    "type": "heading_2",
                    "heading_2": {
                        "rich_text": [{"type": "text", "text": {"content": "⚙️ System Status"}}]
                    }
                },
                {
                    "object": "block",
                    "type": "bulleted_list_item",
                    "bulleted_list_item": {
                        "rich_text": [{"type": "text", "text": {"content": "✅ Daily Generation: 5:00 AM Central Time"}}]
                    }
                },
                {
                    "object": "block",
                    "type": "bulleted_list_item",
                    "bulleted_list_item": {
                        "rich_text": [{"type": "text", "text": {"content": "✅ PDF Generation: Professional Format"}}]
                    }
                },
                {
                    "object": "block",
                    "type": "bulleted_list_item",
                    "bulleted_list_item": {
                        "rich_text": [{"type": "text", "text": {"content": "✅ Audio Generation: Podcast Style"}}]
                    }
                },
                {
                    "object": "block",
                    "type": "bulleted_list_item",
                    "bulleted_list_item": {
                        "rich_text": [{"type": "text", "text": {"content": "✅ SAFLA & FACT Integration: Enhanced AI"}}]
                    }
                }
            ]
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/pages",
                headers=self.headers,
                json=page_data
            )
            response.raise_for_status()
            
            page = response.json()
            logger.info(f"Created analytics page: {page['id']}")
            return page['id']
            
        except Exception as e:
            logger.error(f"Error creating analytics page: {e}")
            raise
    
    def save_daily_report(self, database_id: str, report_data: ReportData, 
                         pdf_path: str, audio_path: str, metadata: Dict) -> str:
        """Save a daily report to the Notion database"""
        
        # Prepare key insights text
        insights_text = "\n".join([
            f"• {insight}" for insight in report_data.executive_summary.get('key_insights', [])
        ])
        
        # Prepare risks text
        risks_text = "\n".join([
            f"• {risk}" for risk in report_data.risk_assessment.get('primary_risks', [])
        ])
        
        # Prepare opportunities text
        opportunities_text = "\n".join([
            f"• {opp}" for opp in report_data.risk_assessment.get('opportunity_areas', [])
        ])
        
        page_data = {
            "parent": {"database_id": database_id},
            "properties": {
                "Report Date": {
                    "title": [
                        {
                            "type": "text",
                            "text": {"content": f"Daily Report - {report_data.date}"}
                        }
                    ]
                },
                "Market Sentiment": {
                    "select": {
                        "name": report_data.executive_summary.get('market_sentiment', 'neutral').title()
                    }
                },
                "Risk Level": {
                    "select": {
                        "name": report_data.risk_assessment.get('overall_risk_level', 'medium').title()
                    }
                },
                "Audio Duration": {
                    "number": metadata.get('report_stats', {}).get('audio_duration_minutes', 0)
                },
                "News Items": {
                    "number": len(report_data.news_events)
                },
                "Status": {
                    "select": {"name": "Generated"}
                },
                "Key Insights": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": insights_text}
                        }
                    ]
                },
                "Primary Risks": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": risks_text}
                        }
                    ]
                },
                "Opportunities": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": opportunities_text}
                        }
                    ]
                }
            },
            "children": [
                {
                    "object": "block",
                    "type": "heading_1",
                    "heading_1": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {"content": f"📊 Daily Premarket Report - {report_data.date}"}
                            }
                        ]
                    }
                },
                {
                    "object": "block",
                    "type": "heading_2",
                    "heading_2": {
                        "rich_text": [{"type": "text", "text": {"content": "📋 Executive Summary"}}]
                    }
                },
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {
                                    "content": f"Market Sentiment: {report_data.executive_summary.get('market_sentiment', 'neutral').title()}"
                                },
                                "annotations": {"bold": True}
                            }
                        ]
                    }
                },
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {
                                    "content": f"Risk Level: {report_data.risk_assessment.get('overall_risk_level', 'medium').title()}"
                                },
                                "annotations": {"bold": True}
                            }
                        ]
                    }
                },
                {
                    "object": "block",
                    "type": "heading_3",
                    "heading_3": {
                        "rich_text": [{"type": "text", "text": {"content": "🎯 Key Insights"}}]
                    }
                }
            ]
        }
        
        # Add insights as bullet points
        for insight in report_data.executive_summary.get('key_insights', []):
            page_data["children"].append({
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": [{"type": "text", "text": {"content": insight}}]
                }
            })
        
        # Add news section
        page_data["children"].extend([
            {
                "object": "block",
                "type": "heading_3",
                "heading_3": {
                    "rich_text": [{"type": "text", "text": {"content": "📰 Top News Items"}}]
                }
            }
        ])
        
        # Add top 3 news items
        for news_item in report_data.news_events[:3]:
            page_data["children"].append({
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": f"{news_item.headline} (Impact: {news_item.impact_score}/10)"},
                            "annotations": {"bold": True}
                        }
                    ]
                }
            })
            page_data["children"].append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": news_item.summary}}]
                }
            })
        
        try:
            response = requests.post(
                f"{self.base_url}/pages",
                headers=self.headers,
                json=page_data
            )
            response.raise_for_status()
            
            page = response.json()
            logger.info(f"Saved daily report to Notion: {page['id']}")
            return page['id']
            
        except Exception as e:
            logger.error(f"Error saving report to Notion: {e}")
            raise
    
    def setup_workspace(self, parent_page_id: str = None) -> Dict[str, str]:
        """Set up the complete Notion workspace"""
        
        if not parent_page_id:
            # Create main workspace page
            main_page_data = {
                "parent": {"type": "page_id", "page_id": "root"},
                "properties": {
                    "title": {
                        "title": [
                            {
                                "type": "text",
                                "text": {"content": "📊 Daily Premarket Reports Hub"}
                            }
                        ]
                    }
                }
            }
            
            try:
                response = requests.post(
                    f"{self.base_url}/pages",
                    headers=self.headers,
                    json=main_page_data
                )
                response.raise_for_status()
                main_page = response.json()
                parent_page_id = main_page['id']
                
            except Exception as e:
                logger.error(f"Error creating main page: {e}")
                raise
        
        # Create database and analytics page
        database_id = self.create_reports_database(parent_page_id)
        analytics_page_id = self.create_analytics_page(parent_page_id)
        
        return {
            "main_page_id": parent_page_id,
            "database_id": database_id,
            "analytics_page_id": analytics_page_id
        }
    
    def test_connection(self) -> bool:
        """Test the Notion API connection"""
        
        try:
            response = requests.get(
                f"{self.base_url}/users/me",
                headers=self.headers
            )
            response.raise_for_status()
            
            user = response.json()
            logger.info(f"Connected to Notion as: {user.get('name', 'Unknown')}")
            return True
            
        except Exception as e:
            logger.error(f"Notion connection test failed: {e}")
            return False