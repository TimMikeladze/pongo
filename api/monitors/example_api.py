from http.server import BaseHTTPRequestHandler
import json
import time
import urllib.request
import urllib.error


def check_example_api():
    """Check an example API endpoint"""
    start = time.time()

    try:
        # Using JSONPlaceholder as a reliable example API
        req = urllib.request.Request(
            "https://jsonplaceholder.typicode.com/posts/1",
            headers={"User-Agent": "Pongo-Monitor/1.0"},
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            response_time = int((time.time() - start) * 1000)
            status_code = response.getcode()

            # Validate JSON response
            data = json.loads(response.read().decode())
            if not isinstance(data, dict) or "id" not in data:
                return {
                    "status": "degraded",
                    "responseTime": response_time,
                    "statusCode": status_code,
                    "message": "Invalid response format",
                }

            # Degraded if response time > 1 second
            if response_time > 1000:
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
        result = check_example_api()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

    def do_POST(self):
        self.do_GET()
