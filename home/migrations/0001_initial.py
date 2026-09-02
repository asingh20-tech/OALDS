from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='LaunchSite',
            fields=[
                ('site_id', models.AutoField(primary_key=True, serialize=False)),
                ('site_name', models.CharField(max_length=150)),
                ('location', models.CharField(blank=True, max_length=200, null=True)),
                ('latitude', models.FloatField(blank=True, null=True)),
                ('longitude', models.FloatField(blank=True, null=True)),
                ('operator', models.CharField(blank=True, max_length=100, null=True)),
                ('active', models.BooleanField(blank=True, null=True)),
            ],
            options={'db_table': 'launch_sites', 'managed': True},
        ),
        migrations.CreateModel(
            name='Rocket',
            fields=[
                ('rocket_id', models.AutoField(primary_key=True, serialize=False)),
                ('rocket_name', models.CharField(max_length=100)),
                ('rocket_type', models.CharField(max_length=100)),
                ('max_payload_kg', models.FloatField(blank=True, null=True)),
                ('status', models.CharField(blank=True, max_length=50, null=True)),
                ('first_flight', models.DateField(blank=True, null=True)),
            ],
            options={'db_table': 'rockets', 'managed': True},
        ),
        migrations.CreateModel(
            name='Booster',
            fields=[
                ('booster_id', models.AutoField(primary_key=True, serialize=False)),
                ('serial_number', models.CharField(max_length=50, unique=True)),
                ('status', models.CharField(blank=True, max_length=50, null=True)),
                ('flight_count', models.IntegerField(blank=True, null=True)),
                ('rocket', models.ForeignKey(db_column='rocket_id', on_delete=django.db.models.deletion.DO_NOTHING, to='home.rocket')),
            ],
            options={'db_table': 'boosters', 'managed': True},
        ),
        migrations.CreateModel(
            name='Mission',
            fields=[
                ('mission_id', models.AutoField(primary_key=True, serialize=False)),
                ('mission_name', models.CharField(max_length=150)),
                ('launch_date', models.DateField(blank=True, null=True)),
                ('orbit_target', models.CharField(blank=True, max_length=100, null=True)),
                ('outcome', models.CharField(blank=True, max_length=50, null=True)),
                ('rocket', models.ForeignKey(db_column='rocket_id', on_delete=django.db.models.deletion.DO_NOTHING, to='home.rocket')),
                ('site', models.ForeignKey(db_column='site_id', on_delete=django.db.models.deletion.DO_NOTHING, to='home.launchsite')),
            ],
            options={'db_table': 'missions', 'managed': True},
        ),
        migrations.CreateModel(
            name='Payload',
            fields=[
                ('payload_id', models.AutoField(primary_key=True, serialize=False)),
                ('payload_name', models.CharField(max_length=150)),
                ('mass_kg', models.FloatField(blank=True, null=True)),
                ('orbit_achieved', models.BooleanField(blank=True, null=True)),
                ('payload_type', models.CharField(blank=True, max_length=100, null=True)),
                ('mission', models.ForeignKey(db_column='mission_id', on_delete=django.db.models.deletion.DO_NOTHING, to='home.mission')),
            ],
            options={'db_table': 'payloads', 'managed': True},
        ),
        migrations.CreateModel(
            name='BoosterFlight',
            fields=[
                ('flight_id', models.AutoField(primary_key=True, serialize=False)),
                ('role', models.CharField(blank=True, max_length=100, null=True)),
                ('landing_outcome', models.CharField(blank=True, max_length=50, null=True)),
                ('flight_number', models.IntegerField(blank=True, null=True)),
                ('booster', models.ForeignKey(db_column='booster_id', on_delete=django.db.models.deletion.DO_NOTHING, to='home.booster')),
                ('mission', models.ForeignKey(db_column='mission_id', on_delete=django.db.models.deletion.DO_NOTHING, to='home.mission')),
            ],
            options={'db_table': 'booster_flights', 'managed': True},
        ),
    ]
