from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),

    path('about/', views.about, name='about'),

    path('course/', views.course, name='course'),

    path('contact/', views.contact, name='contact'),

    path('register/', views.register, name='register'),

    path('login/', views.login_view, name='login'),

    path('logout/', views.logout, name='logout'),

    path('profile/', views.profile, name='profile'),

    #path('users/', views.user_list, name='user_list'),

    #path('users/<int:user_id>/toggle-active/', views.user_toggle_active, name='user_toggle_active'),
]
