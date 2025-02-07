from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),

    path('about/', views.about, name='about'),

    path('course/', views.course, name='course'),

    path('contact/', views.contact, name='contact'),

    path('register/', views.register, name='register'),
]
