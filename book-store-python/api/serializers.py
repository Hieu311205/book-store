from rest_framework import serializers

class ProductSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    price = serializers.FloatField()
    image = serializers.CharField(allow_null=True)

class SalesOverviewSerializer(serializers.Serializer):
    total_revenue = serializers.FloatField()
    total_orders = serializers.IntegerField()
    daily_data = serializers.ListField()

class TopProductSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    sold = serializers.IntegerField()