# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Rocket(models.Model):
    rocket_id = models.AutoField(primary_key=True)
    rocket_name = models.CharField(max_length=100)
    rocket_type = models.CharField(max_length=100)
    max_payload_kg = models.FloatField(blank=True, null=True)
    status = models.CharField(max_length=50, blank=True, null=True)
    first_flight = models.DateField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'rockets'

    def __str__(self):
        return self.rocket_name


class LaunchSite(models.Model):
    site_id = models.AutoField(primary_key=True)
    site_name = models.CharField(max_length=150)
    location = models.CharField(max_length=200, blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    operator = models.CharField(max_length=100, blank=True, null=True)
    active = models.BooleanField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'launch_sites'

    def __str__(self):
        return self.site_name


class Booster(models.Model):
    booster_id = models.AutoField(primary_key=True)
    rocket = models.ForeignKey(Rocket, models.DO_NOTHING, db_column='rocket_id')
    serial_number = models.CharField(unique=True, max_length=50)
    status = models.CharField(max_length=50, blank=True, null=True)
    flight_count = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'boosters'

    def __str__(self):
        return self.serial_number


class Mission(models.Model):
    mission_id = models.AutoField(primary_key=True)
    rocket = models.ForeignKey(Rocket, models.DO_NOTHING, db_column='rocket_id')
    site = models.ForeignKey(LaunchSite, models.DO_NOTHING, db_column='site_id')
    mission_name = models.CharField(max_length=150)
    launch_date = models.DateField(blank=True, null=True)
    orbit_target = models.CharField(max_length=100, blank=True, null=True)
    outcome = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'missions'

    def __str__(self):
        return self.mission_name


class Payload(models.Model):
    payload_id = models.AutoField(primary_key=True)
    mission = models.ForeignKey(Mission, models.DO_NOTHING, db_column='mission_id')
    payload_name = models.CharField(max_length=150)
    mass_kg = models.FloatField(blank=True, null=True)
    orbit_achieved = models.BooleanField(blank=True, null=True)
    payload_type = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'payloads'

    def __str__(self):
        return self.payload_name


class BoosterFlight(models.Model):
    flight_id = models.AutoField(primary_key=True)
    booster = models.ForeignKey(Booster, models.DO_NOTHING, db_column='booster_id')
    mission = models.ForeignKey(Mission, models.DO_NOTHING, db_column='mission_id')
    role = models.CharField(max_length=100, blank=True, null=True)
    landing_outcome = models.CharField(max_length=50, blank=True, null=True)
    flight_number = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'booster_flights'

    def __str__(self):
        return f"Flight {self.flight_number} - {self.booster.serial_number}"