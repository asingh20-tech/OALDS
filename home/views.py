from django.shortcuts import render, HttpResponse
from django.http import JsonResponse
from .models import LaunchSite


def index(request):
    return render(request, 'index.html')


def launch_sites_api(request):
    sites = LaunchSite.objects.filter(active=True)
    
    data = []
    for site in sites:
        data.append({
            'name': site.site_name,
            'location': site.location,
            'lat': site.latitude,
            'lon': site.longitude,
            'operator': site.operator,
        })

    return JsonResponse(data, safe=False)

def missions_api(request):
    from .models import Mission
    
    missions = Mission.objects.all()
    data = []
    for m in missions:
        data.append({
            'name': m.mission_name,
            'rocket': m.rocket.rocket_name if m.rocket else None,
            'site': m.site.site_name if m.site else None,
            'orbit_target': m.orbit_target,
            'outcome': m.outcome,
        })
    return JsonResponse(data, safe=False)

def boosters_api(request):
    from .models import Booster
    
    boosters = Booster.objects.all()
    data = []
    for b in boosters:
        data.append({
            'serial': b.serial_number,
            'rocket': b.rocket.rocket_name if b.rocket else None,
            'status': b.status,
            'flights': b.flight_count,
        })
    return JsonResponse(data, safe=False)