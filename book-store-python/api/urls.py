from django.urls import path
from . import views

urlpatterns = [
    path('recommendations/user/', views.recommendations_user),
    path('analytics_overview/overview/', views.analytics_overview),
    path('analytics/top-products/', views.analytics_top_products),
]