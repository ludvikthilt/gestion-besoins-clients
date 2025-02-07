from django.shortcuts import render


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
    return render(request, 'Register.html')
