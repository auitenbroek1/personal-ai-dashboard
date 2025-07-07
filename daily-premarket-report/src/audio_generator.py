#!/usr/bin/env python3
"""
Audio Report Generator
=====================

Generates podcast-style audio reports from daily market data
"""

import os
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Any
import openai
from pathlib import Path
import json
from report_generator import ReportData, MarketData, NewsItem

logger = logging.getLogger(__name__)

class AudioReportGenerator:
    """Generates podcast-style audio reports"""
    
    def __init__(self, openai_api_key: str = None):
        self.openai_api_key = openai_api_key or os.getenv('OPENAI_API_KEY')
        if self.openai_api_key:
            openai.api_key = self.openai_api_key
        
    def generate_audio_script(self, report_data: ReportData) -> str:
        """Generate a natural, podcast-style script from report data"""
        
        script_parts = []
        
        # Introduction
        intro = self._generate_introduction(report_data)
        script_parts.append(intro)
        
        # Executive Summary
        exec_summary = self._generate_executive_summary_audio(report_data)
        script_parts.append(exec_summary)
        
        # Market Performance
        market_performance = self._generate_market_performance_audio(report_data)
        script_parts.append(market_performance)
        
        # News and Events
        news_analysis = self._generate_news_analysis_audio(report_data)
        script_parts.append(news_analysis)
        
        # Technical Analysis
        technical = self._generate_technical_analysis_audio(report_data)
        script_parts.append(technical)
        
        # Risk Assessment & Conclusion
        conclusion = self._generate_conclusion_audio(report_data)
        script_parts.append(conclusion)
        
        # Combine all parts
        full_script = "\n\n".join(script_parts)
        
        return full_script
    
    def _generate_introduction(self, report_data: ReportData) -> str:
        """Generate introduction section"""
        
        date_str = datetime.now().strftime("%A, %B %d, %Y")
        
        intro = f"""
        Good morning, and welcome to your Daily Premarket Report for {date_str}. 
        It's 5 AM Central Time, and I'm here to give you everything you need to know 
        about what's happened in the markets over the last 24 hours.
        
        This morning's report covers overnight futures action, international market movements, 
        key news developments, and the technical picture as we head into today's trading session.
        
        Let's dive right in.
        """
        
        return intro.strip()
    
    def _generate_executive_summary_audio(self, report_data: ReportData) -> str:
        """Generate executive summary for audio"""
        
        exec_summary = report_data.executive_summary
        sentiment = exec_summary.get('market_sentiment', 'neutral')
        
        summary_text = f"""
        Starting with our executive summary - the market sentiment this morning is {sentiment}.
        
        Here are the three key things you need to know:
        """
        
        # Add key insights
        insights = exec_summary.get('key_insights', [])
        for i, insight in enumerate(insights[:3], 1):
            summary_text += f"\n\nNumber {i}: {insight}"
        
        # Add risk level
        risk_level = exec_summary.get('risk_level', 'medium')
        summary_text += f"\n\nOur overall risk assessment for today is {risk_level}."
        
        return summary_text.strip()
    
    def _generate_market_performance_audio(self, report_data: ReportData) -> str:
        """Generate market performance section for audio"""
        
        market_perf = report_data.market_performance
        
        performance_text = """
        Now let's look at market performance overnight.
        """
        
        # Futures
        if 'futures' in market_perf and market_perf['futures']:
            performance_text += "\n\nStarting with US futures:"
            
            for name, data in market_perf['futures'].items():
                if hasattr(data, 'change_percent'):
                    direction = "up" if data.change_percent > 0 else "down"
                    performance_text += f"\n{name} are {direction} {abs(data.change_percent):.1f} percent"
        
        # International
        if 'international' in market_perf and market_perf['international']:
            performance_text += "\n\nLooking at international markets:"
            
            for name, data in market_perf['international'].items():
                if hasattr(data, 'change_percent'):
                    direction = "gained" if data.change_percent > 0 else "fell"
                    performance_text += f"\nThe {name} {direction} {abs(data.change_percent):.1f} percent"
        
        # Currencies
        if 'currencies' in market_perf and market_perf['currencies']:
            performance_text += "\n\nIn currency markets:"
            
            for name, data in market_perf['currencies'].items():
                if hasattr(data, 'change_percent') and abs(data.change_percent) > 0.1:
                    direction = "stronger" if data.change_percent > 0 else "weaker"
                    performance_text += f"\nThe {name} is {direction}, {direction.replace('stronger', 'up').replace('weaker', 'down')} {abs(data.change_percent):.1f} percent"
        
        # Commodities
        if 'commodities' in market_perf and market_perf['commodities']:
            performance_text += "\n\nAnd in commodities:"
            
            for name, data in market_perf['commodities'].items():
                if hasattr(data, 'change_percent'):
                    direction = "higher" if data.change_percent > 0 else "lower"
                    performance_text += f"\n{name} is trading {direction} by {abs(data.change_percent):.1f} percent"
        
        return performance_text.strip()
    
    def _generate_news_analysis_audio(self, report_data: ReportData) -> str:
        """Generate news analysis section for audio"""
        
        news_text = """
        Moving on to the key news and events that are driving markets this morning.
        """
        
        # Overall sentiment
        sector_analysis = report_data.sector_analysis
        sentiment = sector_analysis.get('overall_sentiment', 'neutral')
        impact_score = sector_analysis.get('average_impact_score', 0)
        
        news_text += f"\n\nThe overall news sentiment is {sentiment} with an average impact score of {impact_score} out of 10."
        
        # Top news items
        top_news = report_data.news_events[:3]  # Top 3 news items
        
        for i, news_item in enumerate(top_news, 1):
            impact_desc = "high" if news_item.impact_score >= 8 else "moderate" if news_item.impact_score >= 6 else "low"
            
            news_text += f"\n\nStory number {i}: {news_item.headline}."
            news_text += f"\n{news_item.summary}"
            news_text += f"\nThis story has a {impact_desc} market impact rating."
        
        return news_text.strip()
    
    def _generate_technical_analysis_audio(self, report_data: ReportData) -> str:
        """Generate technical analysis section for audio"""
        
        tech_analysis = report_data.technical_analysis
        
        technical_text = """
        Let's look at the technical picture.
        """
        
        # VIX
        vix_level = tech_analysis.get('vix_level', 20)
        vol_regime = tech_analysis.get('volatility_regime', 'medium')
        
        technical_text += f"\n\nThe VIX is currently at {vix_level:.1f}, indicating {vol_regime} volatility conditions."
        
        # Market breadth
        breadth = tech_analysis.get('market_breadth', 'neutral')
        technical_text += f"\nMarket breadth is {breadth}."
        
        # Key levels
        if 'key_levels' in tech_analysis:
            technical_text += "\n\nLooking at key technical levels:"
            
            for symbol, levels in tech_analysis['key_levels'].items():
                support = levels.get('support')
                resistance = levels.get('resistance')
                if support and resistance:
                    technical_text += f"\nFor {symbol}, we're watching support at {support} and resistance at {resistance}."
        
        return technical_text.strip()
    
    def _generate_conclusion_audio(self, report_data: ReportData) -> str:
        """Generate conclusion and risk assessment"""
        
        risk_assessment = report_data.risk_assessment
        
        conclusion_text = """
        To wrap up, let's talk about risk management and opportunities.
        """
        
        # Risk level
        risk_level = risk_assessment.get('overall_risk_level', 'medium')
        conclusion_text += f"\n\nOur overall risk assessment remains {risk_level}."
        
        # Key risks
        primary_risks = risk_assessment.get('primary_risks', [])
        if primary_risks:
            conclusion_text += "\n\nThe main risks we're watching include:"
            for risk in primary_risks[:2]:  # Top 2 risks
                conclusion_text += f"\n{risk}."
        
        # Opportunities
        opportunities = risk_assessment.get('opportunity_areas', [])
        if opportunities:
            conclusion_text += "\n\nOn the opportunity side:"
            for opp in opportunities[:2]:  # Top 2 opportunities
                conclusion_text += f"\n{opp}."
        
        # Closing
        conclusion_text += """
        
        That wraps up your Daily Premarket Report. Remember to stay disciplined with your risk management, 
        and watch for any changes in volatility throughout the session.
        
        Trade safely, and have a profitable day.
        """
        
        return conclusion_text.strip()
    
    async def generate_audio_file(self, script: str, output_path: str) -> str:
        """Generate audio file from script using OpenAI TTS"""
        
        if not self.openai_api_key:
            logger.warning("OpenAI API key not provided. Saving script as text file.")
            text_path = output_path.replace('.mp3', '.txt')
            with open(text_path, 'w') as f:
                f.write(script)
            return text_path
        
        try:
            # Use OpenAI TTS API
            client = openai.OpenAI(api_key=self.openai_api_key)
            
            response = client.audio.speech.create(
                model="tts-1-hd",  # High quality model
                voice="onyx",      # Professional male voice
                input=script,
                speed=1.0
            )
            
            # Save audio file
            with open(output_path, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"Audio file generated: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error generating audio: {e}")
            # Fallback to text file
            text_path = output_path.replace('.mp3', '.txt')
            with open(text_path, 'w') as f:
                f.write(script)
            return text_path
    
    def estimate_audio_duration(self, script: str) -> float:
        """Estimate audio duration in minutes"""
        # Average speaking rate is about 150-160 words per minute for professional delivery
        words = len(script.split())
        duration_minutes = words / 155  # Using 155 WPM average
        return duration_minutes
    
    async def generate_complete_audio_report(self, report_data: ReportData, output_dir: str) -> Dict[str, str]:
        """Generate complete audio report with metadata"""
        
        # Generate script
        script = self.generate_audio_script(report_data)
        
        # Estimate duration
        duration = self.estimate_audio_duration(script)
        
        # Generate audio file
        timestamp = datetime.now().strftime("%Y%m%d")
        audio_filename = f"daily_premarket_report_{timestamp}.mp3"
        audio_path = os.path.join(output_dir, audio_filename)
        
        generated_file = await self.generate_audio_file(script, audio_path)
        
        # Create metadata
        metadata = {
            "title": f"Daily Premarket Report - {datetime.now().strftime('%B %d, %Y')}",
            "description": f"Comprehensive market analysis and insights for portfolio managers and hedge funds covering overnight developments, market performance, news analysis, and risk assessment.",
            "duration_minutes": round(duration, 1),
            "script_word_count": len(script.split()),
            "generated_at": datetime.now().isoformat(),
            "file_path": generated_file,
            "script": script
        }
        
        # Save metadata
        metadata_path = os.path.join(output_dir, f"audio_metadata_{timestamp}.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        return {
            "audio_file": generated_file,
            "metadata_file": metadata_path,
            "script": script,
            "duration_minutes": duration
        }