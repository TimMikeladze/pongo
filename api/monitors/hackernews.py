"""
Hacker News Monitor - Vercel Python Serverless Function

This monitor checks the availability and response time of Hacker News.
Uses the Vercel Python runtime (BaseHTTPRequestHandler).
"""

from http.server import BaseHTTPRequestHandler
import time
import urllib.request
import json


def check_hackernews():
    """
    Run the Hacker News monitor check

    Returns a dict with:
    - status: "up" | "down" | "degraded"
    - responseTime: int (milliseconds)
    - statusCode: int (optional HTTP status)
    - message: str (optional error/status message)
    """
    start = time.time()

    try:
        req = urllib.request.Request(
            "https://news.ycombinator.com",
            headers={"User-Agent": "Pongo-Monitor/1.0"},
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            status_code = response.getcode()
            response_time = int((time.time() - start) * 1000)

            if status_code != 200:
                return {
                    "status": "down",
                    "responseTime": response_time,
                    "statusCode": status_code,
                    "message": f"HTTP {status_code}",
                }

            # Mark as degraded if response time exceeds 2 seconds
            if response_time > 2000:
                return {
                    "status": "degraded",
                    "responseTime": response_time,
                    "statusCode": status_code,
                    "message": f"Slow response: {response_time}ms",
                }

            return {
                "status": "up",
                "responseTime": response_time,
                "statusCode": status_code,
            }

    except urllib.error.HTTPError as e:
        return {
            "status": "down",
            "responseTime": int((time.time() - start) * 1000),
            "statusCode": e.code,
            "message": f"HTTP {e.code}",
        }
    except Exception as e:
        return {
            "status": "down",
            "responseTime": int((time.time() - start) * 1000),
            "message": str(e),
        }


class handler(BaseHTTPRequestHandler):
    """Vercel serverless function handler"""

    def do_GET(self):
        """Handle GET request - run the monitor check"""
        result = check_hackernews()

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

    def do_POST(self):
        """Handle POST request - also run the monitor check"""
        self.do_GET()
