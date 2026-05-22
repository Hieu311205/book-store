from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .recommendation_engine import get_recommendations_for_user
from .analytics_engine import get_sales_overview, get_top_products

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
            'image_url': image_url,
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