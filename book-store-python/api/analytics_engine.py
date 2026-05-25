from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from .models import Orders, OrderItems

class SalesAnalytics:
    @staticmethod
    def get_sales_overview(days=30):
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        orders = Orders.objects.filter(
            created_at__gte=start_date,
            payment_status='paid'
        )
        total_revenue = orders.aggregate(total=Sum('total_amount'))['total'] or 0
        total_orders = orders.count()
        daily_data = (
            orders.extra({'date': "DATE(created_at)"})
            .values('date')
            .annotate(orders=Count('id'), revenue=Sum('total_amount'))
            .order_by('date')
        )
        return {
            'total_revenue': float(total_revenue),
            'total_orders': total_orders,
            'daily_data': list(daily_data)
        }

    @staticmethod
    def get_top_products(limit=10):
        top = (
            OrderItems.objects
            .filter(order__payment_status='paid')
            .values('product_id', 'product_title')
            .annotate(sold=Sum('quantity'))
            .order_by('-sold')[:limit]
        )
        return list(top)

# Wrapper functions cho views.py
def get_sales_overview(days=30):
    return SalesAnalytics.get_sales_overview(days)

def get_top_products(limit=10):
    return SalesAnalytics.get_top_products(limit)