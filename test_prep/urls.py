from django.views.decorators.csrf import csrf_exempt
from django.urls import path
from django.views.generic import TemplateView
from .views import ExamListView, ExamDetailView
from django.http import HttpResponse
from django.conf import settings

@csrf_exempt
def health_check(request):
    if settings.DEBUG:
        return HttpResponse("OK")
    # In production, you might want to add more checks here
    return HttpResponse("OK")

urlpatterns = [

    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('api/exams/', ExamListView.as_view(), name='exam-list'),
    path('api/exams/<str:exam_key>/', ExamDetailView.as_view(), name='exam-detail'),
    # Health check endpoint
    path('health/', health_check, name='health_check'),
    
]