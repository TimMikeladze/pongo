#!/usr/bin/env python3
"""
Example: Custom API Monitor with Authentication
This example shows how to monitor an authenticated API endpoint
"""

import time
import urllib.request
import json
import os


class Monitor:
    """Monitor configuration for authenticated API"""

    name = "My Custom API"
    interval = "5m"  # Check every 5 minutes
    timeout = "30s"

    def check(self):
        """Check API health with authentication"""
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


# Entry point for subprocess execution
if __name__ == "__main__":
    monitor = Monitor()
    result = monitor.check()
    print(json.dumps(result))
