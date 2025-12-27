"""
Example: Custom API Monitor with Authentication - Vercel Python Serverless Function

This example shows how to monitor an authenticated API endpoint.
Uses the Vercel Python runtime (BaseHTTPRequestHandler).
"""

from http.server import BaseHTTPRequestHandler
import time
import urllib.request
import json
import os


def check_api():
    """
    Check API health with authentication

    Returns a dict with:
    - status: "up" | "down" | "degraded"
    - responseTime: int (milliseconds)
    - statusCode: int (optional HTTP status)
    - message: str (optional error/status message)
    """
    start = time.time()

    try:
        # Get API key from environment variable
        api_key = os.environ.get("MY_API_KEY", "")

        # Create request with headers
        req = urllib.request.Request(
            "https://api.example.com/v1/health",
            headers={
                "Authorization": f"Bearer {api_key}",
                "User-Agent": "Pongo-Monitor/1.0",
                "Accept": "application/json",
            },
        )

        # Make request
        with urllib.request.urlopen(req, timeout=10) as response:
            response_time = int((time.time() - start) * 1000)
            status_code = response.getcode()

            # Parse JSON response
            data = json.loads(response.read().decode("utf-8"))

            # Check if response is successful
            if status_code != 200:
                return {
                    "status": "down",
                    "responseTime": response_time,
                    "statusCode": status_code,
                    "message": f"HTTP {status_code}",
                }

            # Check API-specific health indicator
            if data.get("status") != "healthy":
                return {
                    "status": "degraded",
                    "responseTime": response_time,
                    "statusCode": status_code,
                    "message": f"API status: {data.get('status')}",
                }

            # Check response time threshold (degraded if > 1 second)
            if response_time > 1000:
                return {
                    "status": "degraded",
                    "responseTime": response_time,
                    "statusCode": status_code,
                    "message": f"Slow response: {response_time}ms",
                }

            # All checks passed
            return {
                "status": "up",
                "responseTime": response_time,
                "statusCode": status_code,
            }

    except urllib.error.HTTPError as e:
        # HTTP error (4xx, 5xx)
        return {
            "status": "down",
            "responseTime": int((time.time() - start) * 1000),
            "statusCode": e.code,
            "message": f"HTTP {e.code}: {e.reason}",
        }

    except urllib.error.URLError as e:
        # Network error (DNS, connection, etc.)
        return {
            "status": "down",
            "responseTime": int((time.time() - start) * 1000),
            "message": f"Network error: {str(e.reason)}",
        }

    except Exception as e:
        # Unexpected error
        return {
            "status": "down",
            "responseTime": int((time.time() - start) * 1000),
            "message": f"Error: {str(e)}",
        }


class handler(BaseHTTPRequestHandler):
    """Vercel serverless function handler"""

    def do_GET(self):
        """Handle GET request - run the monitor check"""
        result = check_api()

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

    def do_POST(self):
        """Handle POST request - also run the monitor check"""
        self.do_GET()
