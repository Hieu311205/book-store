from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .recommendation_engine import get_recommendations_for_user
from .analytics_engine import get_sales_overview, get_top_products
from .support_engine import get_support_faq

@csrf_exempt
def recommendations_user(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    user_id = request.GET.get('user_id')
    if not user_id:
        return JsonResponse({'error': 'Missing user_id'}, status=400)
    try:
        user_id = int(user_id)
    except:
        return JsonResponse({'error': 'Invalid user_id'}, status=400)

    limit = int(request.GET.get('limit', 6))
    products_qs = get_recommendations_for_user(user_id, limit)
    data = []
    for p in products_qs:
        image_url = None
        primary_img = p.productimages_set.filter(is_primary=1).first()
        if primary_img:
            image_url = primary_img.image_url
        elif p.productimages_set.first():
            image_url = p.productimages_set.first().image_url

        data.append({
            'id': p.id,
            'title': p.title,
            'slug': p.slug,
            'price': float(p.price),
            'compare_price': float(p.compare_price) if p.compare_price is not None else None,
            'discount_percent': p.discount_percent or 0,
            'stock': p.stock or 0,
            'rating_avg': float(p.rating_avg) if p.rating_avg is not None else 0,
            'rating_count': p.rating_count or 0,
            'image_url': image_url,
            'primary_image': image_url,
            'author_name': p.author.name if p.author else None,
        })
    return JsonResponse({'success': True, 'data': data})

@csrf_exempt
def analytics_overview(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    days = int(request.GET.get('days', 30))
    result = get_sales_overview(days)
    return JsonResponse({'success': True, 'data': result})

@csrf_exempt
def analytics_top_products(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    limit = int(request.GET.get('limit', 5))
    products = get_top_products(limit)
    return JsonResponse({'success': True, 'data': products})

@csrf_exempt
def support_faq(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    limit = request.GET.get('limit')
    try:
        limit = int(limit) if limit else None
    except:
        return JsonResponse({'error': 'Invalid limit'}, status=400)
    return JsonResponse({'success': True, 'data': get_support_faq(limit)})
