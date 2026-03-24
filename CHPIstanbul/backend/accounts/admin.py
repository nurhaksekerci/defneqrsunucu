from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

from .models import UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    fk_name = "user"
    max_num = 1
    extra = 0
    fields = ("hat", "district", "is_provincial_official")


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)


if admin.site.is_registered(User):
    admin.site.unregister(User)
admin.site.register(User, UserAdmin)
