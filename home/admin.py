from django.contrib import admin
from .models import Rocket, Booster, LaunchSite, Mission, Payload, BoosterFlight


@admin.register(Rocket)
class RocketAdmin(admin.ModelAdmin):
    list_display = ('rocket_name', 'rocket_type', 'status', 'first_flight', 'max_payload_kg')
    list_filter = ('status', 'rocket_type')
    search_fields = ('rocket_name', 'rocket_type')


@admin.register(LaunchSite)
class LaunchSiteAdmin(admin.ModelAdmin):
    list_display = ('site_name', 'location', 'operator', 'active')
    list_filter = ('active', 'operator')
    search_fields = ('site_name', 'location')


@admin.register(Booster)
class BoosterAdmin(admin.ModelAdmin):
    list_display = ('serial_number', 'rocket', 'status', 'flight_count')
    list_filter = ('status',)
    search_fields = ('serial_number',)


@admin.register(Mission)
class MissionAdmin(admin.ModelAdmin):
    list_display = ('mission_name', 'rocket', 'site', 'launch_date', 'outcome')
    list_filter = ('outcome', 'orbit_target')
    search_fields = ('mission_name',)
    date_hierarchy = 'launch_date'


@admin.register(Payload)
class PayloadAdmin(admin.ModelAdmin):
    list_display = ('payload_name', 'mission', 'mass_kg', 'payload_type', 'orbit_achieved')
    list_filter = ('payload_type', 'orbit_achieved')
    search_fields = ('payload_name',)


@admin.register(BoosterFlight)
class BoosterFlightAdmin(admin.ModelAdmin):
    list_display = ('flight_number', 'booster', 'mission', 'role', 'landing_outcome')
    list_filter = ('landing_outcome', 'role')