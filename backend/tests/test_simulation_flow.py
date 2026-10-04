import unittest

from api_helpers import request_json, reset_demo_scenario


class SimulationFlowTest(unittest.TestCase):
    def test_scenario_dam_break_and_alert_update_backend_data(self):
        self.addCleanup(reset_demo_scenario)
        status, baseline = request_json("/api/dashboard")
        self.assertEqual(status, 200)

        status, scenario = request_json(
            "/api/simulation/scenario",
            "POST",
            {"intensity": "moderate"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(scenario["risk_score"], 68.5)
        self.assertNotEqual(scenario["people_at_risk"], baseline["people_at_risk"])

        status, severe = request_json(
            "/api/simulation/scenario",
            "POST",
            {"intensity": "severe"},
        )
        self.assertEqual(status, 200)
        self.assertGreater(severe["risk_score"], scenario["risk_score"])
        self.assertGreater(severe["kpis"]["alertsActive"], scenario["kpis"]["alertsActive"])
        self.assertTrue(all(team["status"] == "deployed" for team in severe["rescue_teams"]))

        status, dam_result = request_json(
            "/api/simulation/dam-break",
            "POST",
            {"dam_name": "Kosi Barrage", "release_volume_mcm": 35},
        )
        self.assertEqual(status, 200)
        self.assertIn("Kosi Barrage", dam_result["event_name"])
        self.assertGreater(dam_result["risk_score"], severe["risk_score"])
        self.assertIn("Downstream Dam Corridor", {zone["name"] for zone in dam_result["zones"]})

        status, map_data = request_json("/api/map-data")
        self.assertEqual(status, 200)
        self.assertIn("Downstream Dam Corridor", {feature["properties"]["name"] for feature in map_data["zones_geojson"]["features"]})

        status, triggered = request_json("/api/alerts/trigger", "POST", {})
        self.assertEqual(status, 200)
        self.assertEqual(triggered["warning_source"], "SIMULATED / DEMONSTRATION")


if __name__ == "__main__":
    unittest.main()
