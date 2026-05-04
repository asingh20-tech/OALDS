from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name='home'),
    path("api/launch-sites/", views.launch_sites_api, name='launch_sites_api'),
    path("api/missions/", views.missions_api, name='missions_api'),
    path("api/boosters/", views.boosters_api, name='boosters_api'),
]