from django.contrib import admin

from .models import (
    Commission,
    GeographicNode,
    Notification,
    OrgMembership,
    OrgUnit,
    PlannedEvent,
    Post,
    PostImage,
    PostLike,
)


class PostImageInline(admin.TabularInline):
    model = PostImage
    extra = 0


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['id', 'author_label', 'org_unit', 'event_category_id', 'created_at']
    list_filter = ['event_category_id', 'org_unit']
    search_fields = ['author_label', 'caption', 'event_title', 'event_description']
    raw_id_fields = ['author', 'org_unit']
    inlines = [PostImageInline]


@admin.register(PlannedEvent)
class PlannedEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'org_unit', 'start_at', 'status', 'created_by']
    search_fields = ['title', 'description', 'location']
    list_filter = ['status', 'org_unit']
    raw_id_fields = ['created_by', 'org_unit']


@admin.register(GeographicNode)
class GeographicNodeAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'level', 'parent']
    list_filter = ['level']
    search_fields = ['name', 'code']


@admin.register(Commission)
class CommissionAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'active']
    list_filter = ['active']


@admin.register(OrgUnit)
class OrgUnitAdmin(admin.ModelAdmin):
    list_display = ['id', 'geographic_node', 'branch', 'commission', 'ilce_code']
    list_filter = ['branch']
    raw_id_fields = ['geographic_node', 'commission']


@admin.register(OrgMembership)
class OrgMembershipAdmin(admin.ModelAdmin):
    list_display = ['user', 'org_unit', 'role', 'is_primary', 'title']
    list_filter = ['role', 'is_primary']
    raw_id_fields = ['user', 'org_unit']
    search_fields = ['user__username', 'title']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'read', 'created_at']
    list_filter = ['read']
    search_fields = ['title', 'body']
    raw_id_fields = ['user']


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ['post', 'user', 'created_at']
    raw_id_fields = ['post', 'user']
