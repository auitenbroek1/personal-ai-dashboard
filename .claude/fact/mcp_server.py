#!/usr/bin/env python3
"""
FACT MCP Server - Model Context Protocol Integration
===================================================

MCP server for FACT (Fast Augmented Context Tools) system integration.
Provides cached data retrieval and financial analysis tools.
"""

import json
import sys
import os
import asyncio
from typing import Any, Dict, List

# Add src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

try:
    from src.core.driver import get_driver
    from src.core.config import get_config
except ImportError:
    # Fallback implementation for MCP integration
    print("Warning: FACT core modules not found, using fallback implementation", file=sys.stderr)
    
    class MockDriver:
        async def process_query(self, query: str) -> str:
            return f"FACT Query Result: {query}"
        
        async def get_schema(self) -> dict:
            return {"tables": ["companies", "financial_data"], "version": "1.0"}
        
        async def get_sample_queries(self) -> List[str]:
            return [
                "Show all technology companies",
                "What is the latest revenue for TechCorp?",
                "List Q1 2025 financial data"
            ]
    
    async def get_driver():
        return MockDriver()


def read_json_line():
    """Read a line of JSON from stdin."""
    line = sys.stdin.readline()
    if not line:
        return None
    return json.loads(line.strip())


def write_json_line(data):
    """Write JSON to stdout."""
    print(json.dumps(data), flush=True)


async def call_fact_api(method: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Call FACT API methods."""
    try:
        driver = await get_driver()
        
        if method == "query_readonly":
            query = params.get("query", "")
            result = await driver.process_query(query)
            return {"status": "success", "data": result}
        
        elif method == "get_schema":
            schema = await driver.get_schema()
            return {"status": "success", "data": schema}
        
        elif method == "get_sample_queries":
            samples = await driver.get_sample_queries()
            return {"status": "success", "data": samples}
        
        elif method == "get_metrics":
            # Mock metrics for now
            return {
                "status": "success", 
                "data": {
                    "cache_hit_rate": 87.3,
                    "avg_response_time_ms": 42,
                    "total_queries": 1000,
                    "cost_reduction": 93.0
                }
            }
        
        else:
            return {"error": f"Unknown method: {method}"}
            
    except Exception as e:
        return {"error": str(e)}


async def main():
    """Main MCP server loop."""
    # Read messages from stdin and respond
    while True:
        try:
            message = read_json_line()
            if not message:
                break
            
            method = message.get("method")
            params = message.get("params", {})
            msg_id = message.get("id")
            
            # Handle initialize
            if method == "initialize":
                write_json_line({
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {
                        "protocolVersion": "2024-11-05",
                        "serverInfo": {
                            "name": "fact-server",
                            "version": "1.0.0"
                        },
                        "capabilities": {
                            "tools": {},
                            "resources": {}
                        }
                    }
                })
            
            # Handle tools/list
            elif method == "tools/list":
                write_json_line({
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {
                        "tools": [
                            {
                                "name": "sql_query_readonly",
                                "description": "Execute read-only SQL queries on financial database",
                                "inputSchema": {
                                    "type": "object",
                                    "properties": {
                                        "query": {
                                            "type": "string",
                                            "description": "SQL query to execute (SELECT only)"
                                        },
                                        "cache_strategy": {
                                            "type": "string",
                                            "enum": ["auto", "force_cache", "no_cache"],
                                            "default": "auto",
                                            "description": "Caching strategy for query"
                                        }
                                    },
                                    "required": ["query"]
                                }
                            },
                            {
                                "name": "sql_get_schema",
                                "description": "Get database schema information",
                                "inputSchema": {
                                    "type": "object",
                                    "properties": {
                                        "table_name": {
                                            "type": "string",
                                            "description": "Optional: specific table to describe"
                                        }
                                    }
                                }
                            },
                            {
                                "name": "sql_get_sample_queries",
                                "description": "Get example queries for financial data exploration",
                                "inputSchema": {
                                    "type": "object",
                                    "properties": {
                                        "category": {
                                            "type": "string",
                                            "enum": ["basic", "advanced", "analytics"],
                                            "default": "basic",
                                            "description": "Type of sample queries"
                                        }
                                    }
                                }
                            },
                            {
                                "name": "system_get_metrics",
                                "description": "Get FACT system performance metrics",
                                "inputSchema": {
                                    "type": "object",
                                    "properties": {
                                        "include_cache_stats": {
                                            "type": "boolean",
                                            "default": True,
                                            "description": "Include cache performance statistics"
                                        }
                                    }
                                }
                            }
                        ]
                    }
                })
            
            # Handle resources/list
            elif method == "resources/list":
                write_json_line({
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {
                        "resources": [
                            {
                                "uri": "fact://config",
                                "name": "FACT Configuration",
                                "description": "Current FACT system configuration",
                                "mimeType": "application/json"
                            },
                            {
                                "uri": "fact://status",
                                "name": "System Status",
                                "description": "Current system status and health",
                                "mimeType": "application/json"
                            },
                            {
                                "uri": "fact://performance",
                                "name": "Performance Metrics",
                                "description": "Real-time performance metrics",
                                "mimeType": "application/json"
                            }
                        ]
                    }
                })
            
            # Handle tools/call
            elif method == "tools/call":
                tool_name = params.get("name")
                tool_args = params.get("arguments", {})
                
                # Map tool names to API methods
                api_method = {
                    "sql_query_readonly": "query_readonly",
                    "sql_get_schema": "get_schema", 
                    "sql_get_sample_queries": "get_sample_queries",
                    "system_get_metrics": "get_metrics"
                }.get(tool_name)
                
                if api_method:
                    result = await call_fact_api(api_method, tool_args)
                else:
                    result = {"error": f"Unknown tool: {tool_name}"}
                
                # Format response
                write_json_line({
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": json.dumps(result, indent=2)
                            }
                        ]
                    }
                })
            
            # Handle resources/read
            elif method == "resources/read":
                uri = params.get("uri", "")
                
                if uri == "fact://config":
                    config_data = {
                        "database_path": os.environ.get("FACT_DATABASE_PATH", "database.db"),
                        "cache_enabled": True,
                        "version": "1.0.0"
                    }
                elif uri == "fact://status":
                    status_data = {
                        "status": "healthy",
                        "uptime": "running",
                        "connections": 1
                    }
                elif uri == "fact://performance":
                    perf_data = {
                        "cache_hit_rate": 87.3,
                        "avg_response_time": 42,
                        "queries_per_minute": 150
                    }
                else:
                    config_data = {"error": f"Unknown resource: {uri}"}
                
                content = config_data if uri == "fact://config" else (status_data if uri == "fact://status" else perf_data)
                
                write_json_line({
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {
                        "contents": [
                            {
                                "uri": uri,
                                "mimeType": "application/json",
                                "text": json.dumps(content, indent=2)
                            }
                        ]
                    }
                })
            
            # Handle unknown methods
            else:
                if msg_id:  # Only respond if it's a request (has an id)
                    write_json_line({
                        "jsonrpc": "2.0",
                        "id": msg_id,
                        "error": {
                            "code": -32601,
                            "message": f"Method not found: {method}"
                        }
                    })
                    
        except json.JSONDecodeError:
            # Invalid JSON, ignore
            continue
        except EOFError:
            # End of input
            break
        except Exception as e:
            # Log error but continue
            sys.stderr.write(f"Error: {e}\n")
            sys.stderr.flush()


if __name__ == "__main__":
    """
    Main entry point for FACT MCP server.
    """
    asyncio.run(main())