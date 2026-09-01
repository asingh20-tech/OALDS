from django.test import TestCase

from .models import Booster, LaunchSite, Mission, Rocket


class OALDSApplicationTests(TestCase):
    def test_seed_data_is_available(self):
        self.assertEqual(Rocket.objects.count(), 5)
        self.assertEqual(LaunchSite.objects.filter(active=True).count(), 6)
        self.assertEqual(Booster.objects.count(), 5)
        self.assertEqual(Mission.objects.count(), 5)

    def test_homepage_and_apis(self):
        self.assertEqual(self.client.get('/').status_code, 200)

        sites = self.client.get('/api/launch-sites/')
        self.assertEqual(sites.status_code, 200)
        self.assertEqual(len(sites.json()), 6)

        missions = self.client.get('/api/missions/')
        self.assertEqual(missions.status_code, 200)
        self.assertEqual(len(missions.json()), 5)

        boosters = self.client.get('/api/boosters/')
        self.assertEqual(boosters.status_code, 200)
        self.assertEqual(len(boosters.json()), 5)
