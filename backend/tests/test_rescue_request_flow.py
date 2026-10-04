import unittest
import uuid

from api_helpers import delete_report, request_json


class RescueRequestFlowTest(unittest.TestCase):
    def test_citizen_request_persists_and_rescue_team_updates_status(self):
        locality = f"Test locality {uuid.uuid4().hex[:8]}"
        status, result = request_json(
            "/api/reports",
            "POST",
            {
                "reporter": "Runtime test",
                "locality": locality,
                "issue_type": "rescue_request",
                "severity": "critical",
                "lat": 25.618,
                "lon": 85.156,
                "description": "Residents need an evacuation boat.",
            },
        )
        self.assertEqual(status, 200)
        report_id = result["report"]["id"]
        self.addCleanup(delete_report, report_id)
        self.assertEqual(result["report"]["status"], "pending")

        status, operations = request_json("/api/rescue-operations")
        self.assertEqual(status, 200)
        created = next(report for report in operations["reports"] if report["id"] == report_id)
        self.assertEqual(created["locality"], locality)

        for next_status in ("assigned", "in_progress", "resolved"):
            status, update = request_json(
                f"/api/reports/{report_id}/status",
                "PATCH",
                {"status": next_status},
            )
            self.assertEqual(status, 200)
            self.assertEqual(update["status"], next_status)

        status, dashboard = request_json("/api/dashboard")
        self.assertEqual(status, 200)
        persisted = next(report for report in dashboard["reports"] if report["id"] == report_id)
        self.assertEqual(persisted["status"], "resolved")
        self.assertTrue(persisted["resolved"])

        status, missing = request_json("/api/reports/99999999/status", "PATCH", {"status": "resolved"})
        self.assertEqual(status, 404)
        status, invalid = request_json("/api/reports", "POST", {"locality": "x"})
        self.assertEqual(status, 422)


if __name__ == "__main__":
    unittest.main()
