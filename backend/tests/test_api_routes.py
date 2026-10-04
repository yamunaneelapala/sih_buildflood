import unittest

from api_helpers import request_json


class ApiRoutesTest(unittest.TestCase):
    def test_read_routes_and_map_layers(self):
        status, health = request_json("/api/health")
        self.assertEqual(status, 200)
        self.assertEqual(health["status"], "ok")

        status, dashboard = request_json("/api/dashboard")
        self.assertEqual(status, 200)
        self.assertGreater(dashboard["kpis"]["peopleAtRisk"], 0)
        self.assertEqual(dashboard["kpis"]["peopleAtRisk"], dashboard["people_at_risk"])
        self.assertTrue(dashboard["zones"])

        status, map_data = request_json("/api/map-data")
        self.assertEqual(status, 200)
        self.assertEqual(map_data["zones_geojson"]["type"], "FeatureCollection")
        self.assertTrue(map_data["zones_geojson"]["features"])
        self.assertTrue(all(feature["geometry"]["type"] == "Polygon" for feature in map_data["zones_geojson"]["features"]))
        self.assertTrue({"school", "hospital", "dam"}.issubset({facility["category"] for facility in map_data["facilities"]}))
        self.assertTrue(map_data["routes"][0]["coordinates"])
        self.assertEqual(map_data["source"], "SIMULATED / DEMONSTRATION")

        status, operations = request_json("/api/rescue-operations")
        self.assertEqual(status, 200)
        self.assertIn("teams", operations)
        self.assertIn("reports", operations)

        status, alerts = request_json("/api/alerts")
        self.assertEqual(status, 200)
        self.assertIn("alerts", alerts)


if __name__ == "__main__":
    unittest.main()

