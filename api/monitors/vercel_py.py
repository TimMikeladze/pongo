"""
Vercel Status Monitor - Vercel Python Serverless Function

This monitor checks Vercel's status page.
Uses the Vercel Python runtime (BaseHTTPRequestHandler).
"""

from http.server import BaseHTTPRequestHandler
import time
import urllib.request
import json


def check_vercel():
    """
    Run the Vercel status monitor check

    Returns a dict with:
    - status: "up" | "down" | "degraded"
    - responseTime: int (milliseconds)
    - statusCode: int (optional HTTP status)
    - message: str (optional error/status message)
    """
    start = time.time()

    try:
        req = urllib.request.Request(
            "https://www.vercel-status.com/api/v2/status.json",
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

            # Parse JSON response
            data = json.loads(response.read().decode("utf-8"))
            indicator = data.get("status", {}).get("indicator", "none")
            description = data.get("status", {}).get("description", "")

            # Map Atlassian Statuspage indicators to monitor status
            if indicator in ("critical", "major"):
                return {
                    "status": "down",
                    "responseTime": response_time,
                    "statusCode": status_code,
                    "message": description,
                }

            if indicator == "minor":
                return {
                    "status": "degraded",
                    "responseTime": response_time,
                    "statusCode": status_code,
                    "message": description,
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
        result = check_vercel()

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

    def do_POST(self):
        """Handle POST request - also run the monitor check"""
        self.do_GET()
