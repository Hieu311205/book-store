# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Authors(models.Model):
    name = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100, blank=True, null=True)
    slug = models.CharField(unique=True, max_length=100, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    image_url = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'authors'


class CartItems(models.Model):
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    session_id = models.CharField(max_length=100, blank=True, null=True)
    product = models.ForeignKey('Products', models.DO_NOTHING, blank=True, null=True)
    quantity = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'cart_items'


class Categories(models.Model):
    parent = models.ForeignKey('self', models.DO_NOTHING, blank=True, null=True)
    name = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100, blank=True, null=True)
    slug = models.CharField(unique=True, max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    image_url = models.CharField(max_length=255, blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    sort_order = models.IntegerField(blank=True, null=True)
    is_active = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'categories'


class ContactMessages(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    email = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    subject = models.CharField(max_length=200, blank=True, null=True)
    message = models.TextField(blank=True, null=True)
    is_read = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'contact_messages'


class CouponUsage(models.Model):
    coupon = models.ForeignKey('Coupons', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    order = models.ForeignKey('Orders', models.DO_NOTHING, blank=True, null=True)
    used_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'coupon_usage'


class Coupons(models.Model):
    code = models.CharField(unique=True, max_length=50)
    type = models.CharField(max_length=10)
    value = models.DecimalField(max_digits=12, decimal_places=2)
    min_purchase = models.DecimalField(max_digits=12, decimal_places=0, blank=True, null=True)
    max_discount = models.DecimalField(max_digits=12, decimal_places=0, blank=True, null=True)
    usage_limit = models.IntegerField(blank=True, null=True)
    used_count = models.IntegerField(blank=True, null=True)
    per_user_limit = models.IntegerField(blank=True, null=True)
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    is_active = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'coupons'


class OrderItems(models.Model):
    order = models.ForeignKey('Orders', models.DO_NOTHING, blank=True, null=True)
    product = models.ForeignKey('Products', models.DO_NOTHING, blank=True, null=True)
    product_title = models.CharField(max_length=255, blank=True, null=True)
    product_image = models.CharField(max_length=255, blank=True, null=True)
    price = models.DecimalField(max_digits=12, decimal_places=0, blank=True, null=True)
    quantity = models.IntegerField(blank=True, null=True)
    total = models.DecimalField(max_digits=12, decimal_places=0, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'order_items'


class Orders(models.Model):
    order_number = models.CharField(unique=True, max_length=20)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    shipping_name = models.CharField(max_length=100, blank=True, null=True)
    shipping_phone = models.CharField(max_length=20, blank=True, null=True)
    shipping_province = models.CharField(max_length=50, blank=True, null=True)
    shipping_city = models.CharField(max_length=50, blank=True, null=True)
    shipping_postal_code = models.CharField(max_length=20, blank=True, null=True)
    shipping_address = models.TextField(blank=True, null=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=0)
    shipping_cost = models.DecimalField(max_digits=12, decimal_places=0, blank=True, null=True)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=0, blank=True, null=True)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=0, blank=True, null=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=0)
    coupon = models.ForeignKey(Coupons, models.DO_NOTHING, blank=True, null=True)
    coupon_code = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=10, blank=True, null=True)
    payment_status = models.CharField(max_length=8, blank=True, null=True)
    payment_method = models.CharField(max_length=13, blank=True, null=True)
    shipping_method = models.CharField(max_length=50, blank=True, null=True)
    tracking_code = models.CharField(max_length=100, blank=True, null=True)
    shipped_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    customer_note = models.TextField(blank=True, null=True)
    admin_note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'orders'


class Payments(models.Model):
    order = models.ForeignKey(Orders, models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    gateway = models.CharField(max_length=13)
    amount = models.DecimalField(max_digits=12, decimal_places=0)
    currency = models.CharField(max_length=3, blank=True, null=True)
    authority = models.CharField(max_length=100, blank=True, null=True)
    ref_id = models.CharField(max_length=100, blank=True, null=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=7, blank=True, null=True)
    gateway_response = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    verified_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'payments'


class ProductImages(models.Model):
    product = models.ForeignKey('Products', models.DO_NOTHING, blank=True, null=True)
    image_url = models.CharField(max_length=255, blank=True, null=True)
    alt_text = models.CharField(max_length=100, blank=True, null=True)
    sort_order = models.IntegerField(blank=True, null=True)
    is_primary = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'product_images'


class ProductTags(models.Model):
    product = models.OneToOneField('Products', models.DO_NOTHING, primary_key=True)  # The composite primary key (product_id, tag) found, that is not supported. The first column is selected.
    tag = models.CharField(max_length=50)

    class Meta:
        managed = False
        db_table = 'product_tags'
        unique_together = (('product', 'tag'),)


class Products(models.Model):
    ugid = models.CharField(unique=True, max_length=36)
    category = models.ForeignKey(Categories, models.DO_NOTHING, blank=True, null=True)
    author = models.ForeignKey(Authors, models.DO_NOTHING, blank=True, null=True)
    publisher = models.ForeignKey('Publishers', models.DO_NOTHING, blank=True, null=True)
    title = models.CharField(max_length=255)
    title_en = models.CharField(max_length=255, blank=True, null=True)
    slug = models.CharField(unique=True, max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    short_description = models.CharField(max_length=500, blank=True, null=True)
    isbn = models.CharField(max_length=20, blank=True, null=True)
    pages = models.IntegerField(blank=True, null=True)
    publish_year = models.IntegerField(blank=True, null=True)
    language = models.CharField(max_length=20, blank=True, null=True)
    translator = models.CharField(max_length=100, blank=True, null=True)
    edition = models.CharField(max_length=20, blank=True, null=True)
    format = models.CharField(max_length=9, blank=True, null=True)
    price = models.DecimalField(max_digits=12, decimal_places=0)
    compare_price = models.DecimalField(max_digits=12, decimal_places=0, blank=True, null=True)
    discount_percent = models.IntegerField(blank=True, null=True)
    stock = models.IntegerField(blank=True, null=True)
    sku = models.CharField(unique=True, max_length=50, blank=True, null=True)
    weight = models.IntegerField(blank=True, null=True)
    meta_title = models.CharField(max_length=255, blank=True, null=True)
    meta_description = models.CharField(max_length=500, blank=True, null=True)
    is_active = models.IntegerField(blank=True, null=True)
    is_featured = models.IntegerField(blank=True, null=True)
    is_bestseller = models.IntegerField(blank=True, null=True)
    views_count = models.IntegerField(blank=True, null=True)
    sales_count = models.IntegerField(blank=True, null=True)
    rating_avg = models.DecimalField(max_digits=2, decimal_places=1, blank=True, null=True)
    rating_count = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'products'


class Publishers(models.Model):
    name = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100, blank=True, null=True)
    slug = models.CharField(unique=True, max_length=100, blank=True, null=True)
    logo_url = models.CharField(max_length=255, blank=True, null=True)
    website = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'publishers'


class Reviews(models.Model):
    product = models.ForeignKey(Products, models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    rating = models.IntegerField(blank=True, null=True)
    title = models.CharField(max_length=100, blank=True, null=True)
    comment = models.TextField(blank=True, null=True)
    pros = models.TextField(blank=True, null=True)
    cons = models.TextField(blank=True, null=True)
    is_verified_purchase = models.IntegerField(blank=True, null=True)
    is_approved = models.IntegerField(blank=True, null=True)
    helpful_count = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'reviews'


class Settings(models.Model):
    key_name = models.CharField(unique=True, max_length=100, blank=True, null=True)
    value = models.TextField(blank=True, null=True)
    type = models.CharField(max_length=7, blank=True, null=True)
    group_name = models.CharField(max_length=50, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'settings'


class Sliders(models.Model):
    title = models.CharField(max_length=100, blank=True, null=True)
    subtitle = models.CharField(max_length=200, blank=True, null=True)
    image_url = models.CharField(max_length=255, blank=True, null=True)
    link = models.CharField(max_length=255, blank=True, null=True)
    button_text = models.CharField(max_length=50, blank=True, null=True)
    sort_order = models.IntegerField(blank=True, null=True)
    is_active = models.IntegerField(blank=True, null=True)
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'sliders'


class UserAddresses(models.Model):
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    title = models.CharField(max_length=50, blank=True, null=True)
    full_name = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    province = models.CharField(max_length=50, blank=True, null=True)
    city = models.CharField(max_length=50, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    is_default = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'user_addresses'


class Users(models.Model):
    ugid = models.CharField(unique=True, max_length=36)
    email = models.CharField(unique=True, max_length=100)
    password_hash = models.CharField(max_length=255, blank=True, null=True)
    first_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar_url = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=11, blank=True, null=True)
    is_active = models.IntegerField(blank=True, null=True)
    email_verified = models.IntegerField(blank=True, null=True)
    google_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'users'


class Wishlist(models.Model):
    user = models.ForeignKey(Users, models.DO_NOTHING, blank=True, null=True)
    product = models.ForeignKey(Products, models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'wishlist'
        unique_together = (('user', 'product'),)
