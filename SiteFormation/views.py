from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate, get_user_model
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
import uuid
from .forms import CustomUserCreationForm, UserUpdateForm
from .models import User


# Create your views here.


def home(request):
    return render(request, 'Home.html')


def about(request):
    return render(request, 'AboutUs.html')


def course(request):
    return render(request, 'Course.html')


def contact(request):
    return render(request, 'Contact.html')


def register(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')

        errors = []

        if password1 != password2:
            errors.append("Les mots de passe ne correspondent pas")

        if not errors:

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password1
            )

            login(request, user)
            messages.success(request, 'Compte créé avec succès!')
            return redirect('profile')

        if errors:
            for error in errors:
                messages.error(request, error)

    return render(request, 'register.html')


def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)

        if user is not None:
            if user.is_active:
                login(request, user)
                messages.success(request, 'Connexion réussie!')
                return redirect('profile')
            else:
                messages.error(request, 'Compte non activé. Vérifiez votre email.')
        else:
            messages.error(request, 'Identifiants invalides.')

    return render(request, 'register.html')


@login_required
def logout(request):
    logout(request)
    messages.info(request, 'Vous avez été déconnecté.')
    return redirect('register')


@login_required
def profile(request):
    if request.method == 'POST':
        form = UserUpdateForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profil mis à jour avec succès!')
            return redirect('profile')
    else:
        form = UserUpdateForm(instance=request.user)

    return render(request, 'profile.html', {'form': form})


@user_passes_test(lambda u: u.role == 'admin')
def user_list_view(request):
    users = User.objects.all()
    return render(request, 'user_list.html', {'users': users})


@user_passes_test(lambda u: u.role == 'admin')
def user_toggle_active(request, user_id):
    user = get_object_or_404(User, id=user_id)
    user.is_active = not user.is_active
    user.save()
    return redirect('user_list')


def send_verification_email(email, verification_url):
    send_mail(
        'Vérifiez votre adresse email',
        f'Cliquez sur ce lien pour vérifier votre email: {verification_url}',
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )
