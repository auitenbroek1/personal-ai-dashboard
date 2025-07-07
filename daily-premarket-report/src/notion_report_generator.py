#!/usr/bin/env python3
"""
Notion Report Generator
======================

Creates comprehensive Notion pages for daily premarket reports
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import requests

try:
    from .report_generator import ReportData, MarketData, NewsItem
    from .enhanced_premarket_generator import EnhancedPremarketGenerator, EarningsEvent
except ImportError:
    # For direct execution
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from report_generator import ReportData, MarketData, NewsItem
    from enhanced_premarket_generator import EnhancedPremarketGenerator, EarningsEvent

logger = logging.getLogger(__name__)

class NotionReportGenerator:
    """Generates comprehensive Notion pages instead of PDFs"""
    
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
    
    def create_comprehensive_daily_report(self, parent_page_id: str, report_data: ReportData) -> str:
        """Create a comprehensive daily report as a Notion page"""
        
        # Build the page content
        page_content = self._build_page_structure(report_data)
        
        page_data = {
            "parent": {"page_id": parent_page_id},
            "properties": {
                "title": {
                    "title": [
                        {
                            "type": "text",
                            "text": {"content": f"📊 Daily Premarket Report - {report_data.date}"}
                        }
                    ]
                }
            },
            "children": page_content
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/pages",
                headers=self.headers,
                json=page_data
            )
            response.raise_for_status()
            
            page = response.json()
            logger.info(f"Created comprehensive Notion report page: {page['id']}")
            return page['id']
            
        except Exception as e:
            logger.error(f"Error creating Notion report page: {e}")
            raise
    
    def _build_page_structure(self, report_data: ReportData) -> List[Dict]:
        """Build the complete page structure with all sections"""
        
        content = []
        
        # Header and date
        content.extend(self._build_header(report_data))
        
        # Executive summary
        content.extend(self._build_executive_summary_section(report_data))
        
        # Market performance
        content.extend(self._build_market_performance_section(report_data))
        
        # News and events
        content.extend(self._build_news_events_section(report_data))
        
        # Economic calendar
        content.extend(self._build_economic_calendar_section(report_data))
        
        # Earnings calendar (new section)
        content.extend(self._build_earnings_calendar_section(report_data))
        
        # Sector rotation analysis (new section)
        content.extend(self._build_sector_rotation_section(report_data))
        
        # Risk assessment
        content.extend(self._build_risk_assessment_section(report_data))
        
        # Footer
        content.extend(self._build_footer())
        
        return content
    
    def _build_header(self, report_data: ReportData) -> List[Dict]:
        """Build report header"""
        
        date_str = datetime.now().strftime("%A, %B %d, %Y")
        
        return [
            {
                "object": "block",
                "type": "heading_1",
                "heading_1": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": f"📊 Daily Premarket Report"},
                            "annotations": {"bold": True, "color": "blue"}
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
                            "text": {"content": f"📅 {date_str} • 🕐 5:00 AM Central Time"},
                            "annotations": {"italic": True}
                        }
                    ]
                }
            },
            {
                "object": "block",
                "type": "callout",
                "callout": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "Professional market intelligence for portfolio managers and hedge funds. All data sources include TradingView, Finviz, and premium financial APIs."}
                        }
                    ],
                    "icon": {"emoji": "🎯"}
                }
            },
            {
                "object": "block",
                "type": "divider",
                "divider": {}
            }
        ]
    
    def _build_executive_summary_section(self, report_data: ReportData) -> List[Dict]:
        """Build executive summary section"""
        
        exec_summary = report_data.executive_summary
        sentiment = exec_summary.get('market_sentiment', 'neutral')
        
        # Choose emoji and color based on sentiment
        sentiment_emoji = "🟢" if sentiment == "bullish" else "🔴" if sentiment == "bearish" else "🟡"
        sentiment_color = "green" if sentiment == "bullish" else "red" if sentiment == "bearish" else "yellow"
        
        content = [
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "📋 Executive Summary"},
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
                            "text": {"content": f"{sentiment_emoji} Market Sentiment: "},
                            "annotations": {"bold": True}
                        },
                        {
                            "type": "text", 
                            "text": {"content": sentiment.upper()},
                            "annotations": {"bold": True, "color": sentiment_color}
                        }
                    ]
                }
            }
        ]
        
        # Key insights
        content.append({
            "object": "block",
            "type": "heading_3",
            "heading_3": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {"content": "🎯 Key Insights"}
                    }
                ]
            }
        })
        
        for insight in exec_summary.get('key_insights', []):
            content.append({
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": insight}
                        }
                    ]
                }
            })
        
        # Recommended actions
        content.append({
            "object": "block",
            "type": "heading_3",
            "heading_3": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {"content": "📝 Recommended Actions"}
                    }
                ]
            }
        })
        
        for action in exec_summary.get('recommended_actions', []):
            content.append({
                "object": "block",
                "type": "numbered_list_item",
                "numbered_list_item": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": action}
                        }
                    ]
                }
            })
        
        return content
    
    def _build_market_performance_section(self, report_data: ReportData) -> List[Dict]:
        """Build market performance section with tables"""
        
        content = [
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "📈 Market Performance Analysis"},
                            "annotations": {"bold": True}
                        }
                    ]
                }
            }
        ]
        
        market_perf = report_data.market_performance
        
        # Previous session closing data (focus on major indices)
        previous_close_data = market_perf.get('previous_close')
        if previous_close_data:
            content.append({
                "object": "block",
                "type": "heading_3",
                "heading_3": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "📊 Previous Session Close (Major Indices)"}
                        }
                    ]
                }
            })
            
            content.extend(self._create_market_data_table(previous_close_data))
        else:
            # If no previous close data, show message
            content.append({
                "object": "block",
                "type": "heading_3",
                "heading_3": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "📊 Previous Session Close (Major Indices)"}
                        }
                    ]
                }
            })
            
            content.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "Previous session closing data will be available when markets reopen."},
                            "annotations": {"italic": True}
                        }
                    ]
                }
            })
        
        # Overnight Futures
        if market_perf.get('futures'):
            content.append({
                "object": "block",
                "type": "heading_3",
                "heading_3": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "🌙 Overnight Futures"}
                        }
                    ]
                }
            })
            
            content.extend(self._create_market_data_table(market_perf['futures']))
        
        # International Markets
        if market_perf.get('international'):
            content.append({
                "object": "block",
                "type": "heading_3",
                "heading_3": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "🌍 International Markets"}
                        }
                    ]
                }
            })
            
            content.extend(self._create_market_data_table(market_perf['international']))
        
        # Currencies
        if market_perf.get('currencies'):
            content.append({
                "object": "block",
                "type": "heading_3",
                "heading_3": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "💱 Currency Markets"}
                        }
                    ]
                }
            })
            
            content.extend(self._create_market_data_table(market_perf['currencies']))
        
        # Commodities
        if market_perf.get('commodities'):
            content.append({
                "object": "block",
                "type": "heading_3",
                "heading_3": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "🏗️ Commodities"}
                        }
                    ]
                }
            })
            
            content.extend(self._create_market_data_table(market_perf['commodities']))
        
        return content
    
    def _create_market_data_table(self, market_data: Dict[str, MarketData]) -> List[Dict]:
        """Create a Notion table for market data"""
        
        if not market_data:
            return [{
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "No data available for this session."},
                            "annotations": {"italic": True}
                        }
                    ]
                }
            }]
        
        # Create table header
        table_rows = []
        
        for name, data_obj in market_data.items():
            if hasattr(data_obj, 'current_price'):
                # Choose emoji and color based on change
                change_emoji = "🟢" if data_obj.change >= 0 else "🔴"
                change_color = "green" if data_obj.change >= 0 else "red"
                
                table_rows.append({
                    "object": "block",
                    "type": "table_row",
                    "table_row": {
                        "cells": [
                            [
                                {
                                    "type": "text",
                                    "text": {"content": name},
                                    "annotations": {"bold": True}
                                }
                            ],
                            [
                                {
                                    "type": "text",
                                    "text": {"content": f"{data_obj.current_price:.2f}"}
                                }
                            ],
                            [
                                {
                                    "type": "text",
                                    "text": {"content": f"{change_emoji} {data_obj.change:+.2f}"},
                                    "annotations": {"color": change_color}
                                }
                            ],
                            [
                                {
                                    "type": "text",
                                    "text": {"content": f"{data_obj.change_percent:+.2f}%"},
                                    "annotations": {"color": change_color, "bold": True}
                                }
                            ]
                        ]
                    }
                })
        
        if not table_rows:
            return [{
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "No market data available."},
                            "annotations": {"italic": True}
                        }
                    ]
                }
            }]
        
        # Create the table block
        table_content = [
            {
                "object": "block",
                "type": "table",
                "table": {
                    "table_width": 4,
                    "has_column_header": True,
                    "has_row_header": False,
                    "children": [
                        {
                            "object": "block",
                            "type": "table_row",
                            "table_row": {
                                "cells": [
                                    [
                                        {
                                            "type": "text",
                                            "text": {"content": "Asset"},
                                            "annotations": {"bold": True}
                                        }
                                    ],
                                    [
                                        {
                                            "type": "text",
                                            "text": {"content": "Price"},
                                            "annotations": {"bold": True}
                                        }
                                    ],
                                    [
                                        {
                                            "type": "text",
                                            "text": {"content": "Change"},
                                            "annotations": {"bold": True}
                                        }
                                    ],
                                    [
                                        {
                                            "type": "text",
                                            "text": {"content": "Change %"},
                                            "annotations": {"bold": True}
                                        }
                                    ]
                                ]
                            }
                        }
                    ] + table_rows
                }
            }
        ]
        
        return table_content
    
    def _build_news_events_section(self, report_data: ReportData) -> List[Dict]:
        """Build news and events section"""
        
        content = [
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "📰 News & Events Impact"},
                            "annotations": {"bold": True}
                        }
                    ]
                }
            }
        ]
        
        # Overall sentiment with key themes
        sector_analysis = report_data.sector_analysis
        sentiment = sector_analysis.get('overall_sentiment', 'neutral')
        impact_score = sector_analysis.get('average_impact_score', 0)
        key_themes = sector_analysis.get('key_themes', [])
        
        content.append({
            "object": "block",
            "type": "callout",
            "callout": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {"content": f"News Sentiment: {sentiment} with {len(key_themes)} key themes"}
                    }
                ],
                "icon": {"emoji": "📊"}
            }
        })
        
        # Add key themes as bulleted list immediately below
        if key_themes:
            for theme in key_themes:
                content.append({
                    "object": "block",
                    "type": "bulleted_list_item",
                    "bulleted_list_item": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {"content": theme}
                            }
                        ]
                    }
                })
        
        # Key news items
        for i, news_item in enumerate(report_data.news_events[:5], 1):
            impact_emoji = "🔴" if news_item.impact_score >= 8 else "🟡" if news_item.impact_score >= 6 else "🟢"
            impact_color = "red" if news_item.impact_score >= 8 else "yellow" if news_item.impact_score >= 6 else "green"
            
            content.extend([
                {
                    "object": "block",
                    "type": "heading_3",
                    "heading_3": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {"content": f"{i}. {news_item.headline}"}
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
                                "text": {"content": news_item.summary}
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
                                "text": {"content": f"Source: {news_item.source} | Impact: "},
                                "annotations": {"italic": True}
                            },
                            {
                                "type": "text",
                                "text": {"content": f"{impact_emoji} {news_item.impact_score}/10"},
                                "annotations": {"bold": True, "color": impact_color}
                            }
                        ]
                    }
                }
            ])
        
        return content
    
    
    def _build_economic_calendar_section(self, report_data: ReportData) -> List[Dict]:
        """Build economic calendar section"""
        
        content = [
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "📅 Today's Economic Calendar"},
                            "annotations": {"bold": True}
                        }
                    ]
                }
            }
        ]
        
        if not report_data.economic_calendar:
            content.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "No major economic events scheduled for today."},
                            "annotations": {"italic": True}
                        }
                    ]
                }
            })
            return content
        
        # Create calendar table
        table_rows = []
        
        for event in report_data.economic_calendar:
            importance = event.get('importance', 'low')
            importance_emoji = "🔴" if importance == 'high' else "🟡" if importance == 'medium' else "🟢"
            importance_color = "red" if importance == 'high' else "yellow" if importance == 'medium' else "green"
            
            table_rows.append({
                "object": "block",
                "type": "table_row",
                "table_row": {
                    "cells": [
                        [
                            {
                                "type": "text",
                                "text": {"content": event.get('time', '')},
                                "annotations": {"bold": True}
                            }
                        ],
                        [
                            {
                                "type": "text",
                                "text": {"content": event.get('event', '')}
                            }
                        ],
                        [
                            {
                                "type": "text",
                                "text": {"content": f"{importance_emoji} {importance.title()}"},
                                "annotations": {"color": importance_color}
                            }
                        ],
                        [
                            {
                                "type": "text",
                                "text": {"content": event.get('forecast', 'N/A')}
                            }
                        ],
                        [
                            {
                                "type": "text",
                                "text": {"content": event.get('previous', 'N/A')}
                            }
                        ]
                    ]
                }
            })
        
        content.append({
            "object": "block",
            "type": "table",
            "table": {
                "table_width": 5,
                "has_column_header": True,
                "has_row_header": False,
                "children": [
                    {
                        "object": "block",
                        "type": "table_row",
                        "table_row": {
                            "cells": [
                                [{"type": "text", "text": {"content": "Time (ET)"}, "annotations": {"bold": True}}],
                                [{"type": "text", "text": {"content": "Event"}, "annotations": {"bold": True}}],
                                [{"type": "text", "text": {"content": "Importance"}, "annotations": {"bold": True}}],
                                [{"type": "text", "text": {"content": "Forecast"}, "annotations": {"bold": True}}],
                                [{"type": "text", "text": {"content": "Previous"}, "annotations": {"bold": True}}]
                            ]
                        }
                    }
                ] + table_rows
            }
        })
        
        return content
    
    def _build_risk_assessment_section(self, report_data: ReportData) -> List[Dict]:
        """Build risk assessment section"""
        
        risk_assessment = report_data.risk_assessment
        
        content = [
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "⚖️ Risk Assessment & Opportunities"},
                            "annotations": {"bold": True}
                        }
                    ]
                }
            }
        ]
        
        # Overall risk level
        risk_level = risk_assessment.get('overall_risk_level', 'medium')
        risk_emoji = "🔴" if risk_level == 'high' else "🟡" if risk_level == 'medium' else "🟢"
        risk_color = "red" if risk_level == 'high' else "yellow" if risk_level == 'medium' else "green"
        
        content.append({
            "object": "block",
            "type": "callout",
            "callout": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {"content": f"Overall Risk Level: {risk_emoji} {risk_level.upper()}"},
                        "annotations": {"bold": True, "color": risk_color}
                    }
                ],
                "icon": {"emoji": "⚠️"}
            }
        })
        
        # Primary risks
        content.append({
            "object": "block",
            "type": "heading_3",
            "heading_3": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {"content": "⚠️ Primary Risk Factors"}
                    }
                ]
            }
        })
        
        for risk in risk_assessment.get('primary_risks', []):
            content.append({
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": risk}
                        }
                    ]
                }
            })
        
        # Opportunities
        content.append({
            "object": "block",
            "type": "heading_3",
            "heading_3": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {"content": "🎯 Opportunity Areas"}
                    }
                ]
            }
        })
        
        for opp in risk_assessment.get('opportunity_areas', []):
            content.append({
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": opp}
                        }
                    ]
                }
            })
        
        # Hedging recommendations
        if risk_assessment.get('hedging_recommendations'):
            content.append({
                "object": "block",
                "type": "heading_3",
                "heading_3": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "🛡️ Hedging Recommendations"}
                        }
                    ]
                }
            })
            
            for hedge in risk_assessment['hedging_recommendations']:
                content.append({
                    "object": "block",
                    "type": "numbered_list_item",
                    "numbered_list_item": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {"content": hedge}
                            }
                        ]
                    }
                })
        
        return content
    
    def _build_footer(self) -> List[Dict]:
        """Build report footer"""
        
        return [
            {
                "object": "block",
                "type": "divider",
                "divider": {}
            },
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": f"Report generated at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} Central Time"},
                            "annotations": {"italic": True, "color": "gray"}
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
                            "text": {"content": "🤖 Generated with Claude Code | Data Sources: TradingView, Finviz, Premium APIs"},
                            "annotations": {"italic": True, "color": "gray"}
                        }
                    ]
                }
            }
        ]
    
    def _build_earnings_calendar_section(self, report_data: ReportData) -> List[Dict]:
        """Build upcoming earnings calendar section"""
        
        content = [
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "📈 Upcoming Earnings Calendar (Next 5 Trading Sessions)"},
                            "annotations": {"bold": True}
                        }
                    ]
                }
            }
        ]
        
        earnings_calendar = getattr(report_data, 'earnings_calendar', [])
        
        if not earnings_calendar:
            content.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "No major earnings releases scheduled for the next 5 trading sessions."},
                            "annotations": {"italic": True}
                        }
                    ]
                }
            })
            return content
        
        # Create earnings table
        table_rows = []
        
        for earnings in earnings_calendar:
            timing = earnings.get('timing', 'AMC') if isinstance(earnings, dict) else getattr(earnings, 'timing', 'AMC')
            timing_emoji = "🌅" if timing == 'BMO' else "🌇" if timing == 'AMC' else "📊"
            timing_color = "blue" if timing == 'BMO' else "orange" if timing == 'AMC' else "default"
            
            table_rows.append({
                "object": "block",
                "type": "table_row",
                "table_row": {
                    "cells": [
                        [
                            {
                                "type": "text",
                                "text": {"content": earnings.get('symbol', 'N/A') if isinstance(earnings, dict) else getattr(earnings, 'symbol', 'N/A')},
                                "annotations": {"bold": True, "code": True}
                            }
                        ],
                        [
                            {
                                "type": "text",
                                "text": {"content": earnings.get('company_name', 'N/A') if isinstance(earnings, dict) else getattr(earnings, 'company_name', 'N/A')}
                            }
                        ],
                        [
                            {
                                "type": "text",
                                "text": {"content": f"{earnings.get('day_of_week', 'N/A') if isinstance(earnings, dict) else getattr(earnings, 'day_of_week', 'N/A')}, {earnings.get('date', 'N/A') if isinstance(earnings, dict) else getattr(earnings, 'date', 'N/A')}"}
                            }
                        ],
                        [
                            {
                                "type": "text",
                                "text": {"content": f"{timing_emoji} {timing}"},
                                "annotations": {"color": timing_color, "bold": True}
                            }
                        ],
                        [
                            {
                                "type": "text",
                                "text": {"content": earnings.get('sector', 'N/A') if isinstance(earnings, dict) else getattr(earnings, 'sector', 'N/A')}
                            }
                        ]
                    ]
                }
            })
        
        content.append({
            "object": "block",
            "type": "table",
            "table": {
                "table_width": 5,
                "has_column_header": True,
                "has_row_header": False,
                "children": [
                    {
                        "object": "block",
                        "type": "table_row",
                        "table_row": {
                            "cells": [
                                [{"type": "text", "text": {"content": "Symbol"}, "annotations": {"bold": True}}],
                                [{"type": "text", "text": {"content": "Company"}, "annotations": {"bold": True}}],
                                [{"type": "text", "text": {"content": "Date"}, "annotations": {"bold": True}}],
                                [{"type": "text", "text": {"content": "Timing"}, "annotations": {"bold": True}}],
                                [{"type": "text", "text": {"content": "Sector"}, "annotations": {"bold": True}}]
                            ]
                        }
                    }
                ] + table_rows
            }
        })
        
        # Add legend for BMO/AMC
        content.append({
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {"content": "🌅 BMO = Before Market Open | 🌇 AMC = After Market Close"},
                        "annotations": {"italic": True, "color": "gray"}
                    }
                ]
            }
        })
        
        return content
    
    def _build_sector_rotation_section(self, report_data: ReportData) -> List[Dict]:
        """Build sector rotation analysis section"""
        
        sector_rotation = report_data.market_performance.get('sector_rotation', {})
        
        content = [
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": f"🔄 Sector Rotation Analysis ({self._get_sector_date_range(sector_rotation)})"},
                            "annotations": {"bold": True}
                        }
                    ]
                }
            }
        ]
        
        # Get sector rotation data from market performance
        market_perf = report_data.market_performance
        sector_rotation = market_perf.get('sector_rotation', {})
        
        if not sector_rotation or not sector_rotation.get('weekly_performance'):
            content.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "Sector rotation analysis not available."},
                            "annotations": {"italic": True}
                        }
                    ]
                }
            })
            return content
        
        # Rotation strength indicator
        rotation_strength = sector_rotation.get('rotation_strength', 'moderate')
        strength_emoji = "🔥" if rotation_strength == 'strong' else "⚡" if rotation_strength == 'moderate' else "💧"
        strength_color = "red" if rotation_strength == 'strong' else "yellow" if rotation_strength == 'moderate' else "blue"
        
        content.append({
            "object": "block",
            "type": "callout",
            "callout": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {"content": f"Sector Rotation Strength: {strength_emoji} {rotation_strength.upper()}"},
                        "annotations": {"bold": True, "color": strength_color}
                    }
                ],
                "icon": {"emoji": "🎯"}
            }
        })
        
        # Leaders and laggards
        leaders = sector_rotation.get('leaders', [])
        laggards = sector_rotation.get('laggards', [])
        
        if leaders:
            content.append({
                "object": "block",
                "type": "heading_3",
                "heading_3": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "📈 Weekly Leaders"}
                        }
                    ]
                }
            })
            
            for sector_name, sector_data in leaders:
                weekly_return = sector_data.get('weekly_return', 0)
                content.append({
                    "object": "block",
                    "type": "bulleted_list_item",
                    "bulleted_list_item": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {"content": f"{sector_name}: "},
                                "annotations": {"bold": True}
                            },
                            {
                                "type": "text",
                                "text": {"content": f"+{weekly_return:.2f}%"},
                                "annotations": {"color": "green", "bold": True}
                            }
                        ]
                    }
                })
        
        if laggards:
            content.append({
                "object": "block",
                "type": "heading_3",
                "heading_3": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "📉 Weekly Laggards"}
                        }
                    ]
                }
            })
            
            for sector_name, sector_data in laggards:
                weekly_return = sector_data.get('weekly_return', 0)
                content.append({
                    "object": "block",
                    "type": "bulleted_list_item",
                    "bulleted_list_item": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {"content": f"{sector_name}: "},
                                "annotations": {"bold": True}
                            },
                            {
                                "type": "text",
                                "text": {"content": f"{weekly_return:.2f}%"},
                                "annotations": {"color": "red", "bold": True}
                            }
                        ]
                    }
                })
        
        return content

    def _get_sector_date_range(self, sector_rotation: Dict) -> str:
        """Get the actual date range for sector rotation analysis"""
        
        weekly_performance = sector_rotation.get("weekly_performance", {})
        if not weekly_performance:
            return "Weekly Timeframe"
            
        # Get dates from first sector with date info
        for sector_data in weekly_performance.values():
            start_date = sector_data.get("start_date")
            end_date = sector_data.get("end_date")
            if start_date and end_date:
                return f"{start_date} to {end_date}"
                
        return "Weekly Timeframe"
