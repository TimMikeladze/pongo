#!/usr/bin/env python3
"""Vercel status monitor - Python implementation"""

import time
import urllib.request
import json


class Monitor:
    """Monitor configuration and handler for Vercel"""

    name = "Vercel (Python)"
    interval = "15m"
    timeout = "30s"

    def check(self):
        """Run the monitor check"""
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


# Entry point for subprocess execution
if __name__ == "__main__":
    monitor = Monitor()
    result = monitor.check()
    print(json.dumps(result))
