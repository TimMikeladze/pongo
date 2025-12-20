#!/usr/bin/env python3
"""
Hacker News Monitor - Python Implementation

This monitor checks the availability and response time of Hacker News.
It demonstrates the basic structure of a Python monitor for Pongo.

Python monitors must:
1. Define a Monitor class with name, interval, and timeout attributes
2. Implement a check() method that returns a dict with status/responseTime
3. Print JSON to stdout when run as __main__
"""

import time
import urllib.request
import json


class Monitor:
    """
    Monitor configuration and handler for Hacker News

    Class attributes define the monitor metadata:
    - name: Display name in the dashboard
    - interval: How often to check (e.g., "15m", "5m", "1h")
    - timeout: Maximum execution time (e.g., "30s", "1m")
    """

    name = "Hacker News (Python)"
    interval = "15m"  # Check every 15 minutes
    timeout = "30s"   # Kill if takes longer than 30 seconds

    def check(self):
        """
        Run the monitor check

        Returns a dict with required fields:
        - status: "up" | "down" | "degraded"
        - responseTime: int (milliseconds)
        - statusCode: int (optional HTTP status)
        - message: str (optional error/status message)
        """
        start = time.time()  # Track start time for response time calculation

        try:
            # Create HTTP request with custom User-Agent
            # Some sites block default Python user agents
            req = urllib.request.Request(
                "https://news.ycombinator.com",
                headers={"User-Agent": "Pongo-Monitor/1.0"},
            )

            # Make the request with a 10 second timeout
            with urllib.request.urlopen(req, timeout=10) as response:
                status_code = response.getcode()
                # Calculate response time in milliseconds
                response_time = int((time.time() - start) * 1000)

                # Check if HTTP status is not OK
                if status_code != 200:
                    return {
                        "status": "down",
                        "responseTime": response_time,
                        "statusCode": status_code,
                        "message": f"HTTP {status_code}",
                    }

                # Mark as degraded if response time exceeds 2 seconds
                # This helps identify slow but functional endpoints
                if response_time > 2000:
                    return {
                        "status": "degraded",
                        "responseTime": response_time,
                        "statusCode": status_code,
                        "message": f"Slow response: {response_time}ms",
                    }

                # All checks passed - service is up
                return {
                    "status": "up",
                    "responseTime": response_time,
                    "statusCode": status_code,
                }

        except urllib.error.HTTPError as e:
            # HTTP error (4xx, 5xx status codes)
            return {
                "status": "down",
                "responseTime": int((time.time() - start) * 1000),
                "statusCode": e.code,
                "message": f"HTTP {e.code}",
            }
        except Exception as e:
            # Network errors, timeouts, or other exceptions
            return {
                "status": "down",
                "responseTime": int((time.time() - start) * 1000),
                "message": str(e),
            }


# Entry point for subprocess execution
# When this file is run directly (not imported), execute the monitor
# and print the result as JSON to stdout for the TypeScript runner to parse
if __name__ == "__main__":
    monitor = Monitor()
    result = monitor.check()
    print(json.dumps(result))  # Print JSON to stdout
