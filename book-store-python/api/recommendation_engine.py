from django.db.models import Count, Q
from .models import Products, OrderItems

class RecommendationEngine:
    @staticmethod
    def get_user_purchased_products(user_id):
        return list(
            OrderItems.objects
            .filter(order__user_id=user_id, order__payment_status='paid')
            .values_list('product_id', flat=True)
            .distinct()
        )

    @staticmethod
    def get_popular_products(limit=10, exclude_ids=[]):
        qs = Products.objects.filter(is_active=1)
        if exclude_ids:
            qs = qs.exclude(id__in=exclude_ids)
        return qs.annotate(
            purchase_count=Count('orderitems__id', filter=Q(orderitems__order__payment_status='paid'))
        ).order_by('-purchase_count')[:limit]

    @staticmethod
    def get_recommendations_for_user(user_id, limit=6):
        purchased = RecommendationEngine.get_user_purchased_products(user_id)
        if not purchased:
            return RecommendationEngine.get_popular_products(limit)

        categories = list(
            Products.objects.filter(id__in=purchased, category__isnull=False)
            .values_list('category_id', flat=True)
            .distinct()
        )
        if not categories:
            return RecommendationEngine.get_popular_products(limit)

        recommended = (
            Products.objects.filter(category_id__in=categories, is_active=1)
            .exclude(id__in=purchased)
            .annotate(popularity=Count('orderitems__id', filter=Q(orderitems__order__payment_status='paid')))
            .order_by('-popularity')[:limit]
        )
        return recommended

# Wrapper functions cho views.py
def get_recommendations_for_user(user_id, limit=6):
    return RecommendationEngine.get_recommendations_for_user(user_id, limit)