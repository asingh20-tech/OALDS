from django.db import migrations


def seed_data(apps, schema_editor):
    Rocket = apps.get_model('home', 'Rocket')
    LaunchSite = apps.get_model('home', 'LaunchSite')
    Booster = apps.get_model('home', 'Booster')
    Mission = apps.get_model('home', 'Mission')
    Payload = apps.get_model('home', 'Payload')
    BoosterFlight = apps.get_model('home', 'BoosterFlight')

    rockets = [
        (1, 'Falcon 9', 'Reusable Heavy', 22800.0, 'Active', '2010-06-04'),
        (2, 'Falcon Heavy', 'Reusable Heavy', 63800.0, 'Active', '2018-02-06'),
        (3, 'Starship', 'Super Heavy', 150000.0, 'Testing', '2023-04-20'),
        (4, 'Atlas V', 'Expendable Medium', 18850.0, 'Active', '2002-08-21'),
        (5, 'Soyuz-2', 'Expendable Medium', 8200.0, 'Active', '2004-11-08'),
    ]
    for pk, name, rocket_type, payload, status, first_flight in rockets:
        Rocket.objects.update_or_create(
            pk=pk,
            defaults={'rocket_name': name, 'rocket_type': rocket_type, 'max_payload_kg': payload,
                      'status': status, 'first_flight': first_flight},
        )

    sites = [
        (1, 'Kennedy Space Center LC-39A', 'Florida, USA', 28.608, -80.604, 'SpaceX'),
        (2, 'Vandenberg SLC-4E', 'California, USA', 34.632, -120.6107, 'SpaceX'),
        (3, 'Boca Chica Starbase', 'Texas, USA', 25.997, -97.156, 'SpaceX'),
        (4, 'Baikonur LC-1', 'Kazakhstan', 45.965, 63.305, 'Roscosmos'),
        (5, 'Kourou ELA-3', 'French Guiana', 5.236, -52.775, 'Arianespace'),
        (6, 'Tanegashima', 'Japan', 30.4, 130.975, 'JAXA'),
    ]
    for pk, name, location, latitude, longitude, operator in sites:
        LaunchSite.objects.update_or_create(
            pk=pk,
            defaults={'site_name': name, 'location': location, 'latitude': latitude,
                      'longitude': longitude, 'operator': operator, 'active': True},
        )

    boosters = [
        (1, 1, 'B1062', 'Active', 22),
        (2, 1, 'B1058', 'Retired', 19),
        (3, 1, 'B1067', 'Active', 18),
        (4, 1, 'B1071', 'Active', 15),
        (5, 2, 'B1080', 'Active', 8),
    ]
    for pk, rocket_id, serial, status, flights in boosters:
        Booster.objects.update_or_create(
            pk=pk,
            defaults={'rocket_id': rocket_id, 'serial_number': serial,
                      'status': status, 'flight_count': flights},
        )

    missions = [
        (1, 1, 1, 'Starlink G6-42', '2024-03-15', 'LEO', 'Success'),
        (2, 1, 1, 'CRS-31 Resupply', '2024-11-04', 'LEO', 'Success'),
        (3, 1, 2, 'USSF-124', '2024-02-14', 'LEO', 'Success'),
        (4, 2, 1, 'Intelsat 40E', '2023-04-07', 'GTO', 'Success'),
        (5, 1, 1, 'Crew-9', '2024-09-28', 'LEO', 'Success'),
    ]
    for pk, rocket_id, site_id, name, launch_date, orbit, outcome in missions:
        Mission.objects.update_or_create(
            pk=pk,
            defaults={'rocket_id': rocket_id, 'site_id': site_id, 'mission_name': name,
                      'launch_date': launch_date, 'orbit_target': orbit, 'outcome': outcome},
        )

    payloads = [
        (1, 1, 'Starlink Satellites v2', 17400.0, 'Satellite'),
        (2, 2, 'Dragon Cargo Capsule', 5500.0, 'Cargo'),
        (3, 3, 'USSF Classified', 6000.0, 'Military'),
        (4, 4, 'Intelsat 40E Satellite', 5500.0, 'Communications'),
        (5, 5, 'Crew Dragon Endurance', 12500.0, 'Crew'),
    ]
    for pk, mission_id, name, mass, payload_type in payloads:
        Payload.objects.update_or_create(
            pk=pk,
            defaults={'mission_id': mission_id, 'payload_name': name, 'mass_kg': mass,
                      'orbit_achieved': True, 'payload_type': payload_type},
        )

    flights = [
        (1, 1, 1, 'First Stage', 'Success - Drone Ship', 22),
        (2, 2, 2, 'First Stage', 'Success - LZ-1', 19),
        (3, 3, 3, 'First Stage', 'Success - Drone Ship', 18),
        (4, 5, 4, 'Side Booster', 'Success - LZ-1', 8),
        (5, 4, 5, 'First Stage', 'Success - Drone Ship', 15),
    ]
    for pk, booster_id, mission_id, role, landing, number in flights:
        BoosterFlight.objects.update_or_create(
            pk=pk,
            defaults={'booster_id': booster_id, 'mission_id': mission_id, 'role': role,
                      'landing_outcome': landing, 'flight_number': number},
        )


class Migration(migrations.Migration):
    dependencies = [('home', '0001_initial')]

    operations = [migrations.RunPython(seed_data, migrations.RunPython.noop)]
