from http.server import BaseHTTPRequestHandler
import json
import time
import urllib.request
import urllib.error


def check_hackernews():
    """Check Hacker News availability"""
    start = time.time()

    try:
        req = urllib.request.Request(
            "https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty",
            headers={"User-Agent": "Pongo-Monitor/1.0"},
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            response_time = int((time.time() - start) * 1000)
            status_code = response.getcode()

            # Check if response is valid JSON array of story IDs
            data = json.loads(response.read().decode())
            if not isinstance(data, list) or len(data) == 0:
                return {
                    "status": "degraded",
                    "responseTime": response_time,
                    "statusCode": status_code,
                    "message": "Invalid response format",
                }

            # Degraded if response time > 2 seconds
            if response_time > 2000:
                return {
                    "status": "degraded",
                    "responseTime": response_time,
                    "statusCode": status_code,
                    "message": "Slow response time",
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
            "message": str(e.reason),
        }
    except Exception as e:
        return {
            "status": "down",
            "responseTime": int((time.time() - start) * 1000),
            "message": str(e),
        }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        result = check_hackernews()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

    def do_POST(self):
        self.do_GET()
