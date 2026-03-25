from django.urls import path

from . import views

urlpatterns = [
    path('feed/', views.FeedListView.as_view(), name='feed'),
    path('posts/<int:pk>/', views.PostDetailView.as_view(), name='post-detail'),
    path('posts/<int:pk>/like/', views.post_like, name='post-like'),
    path('planned/<int:pk>/complete/', views.planned_complete, name='planned-complete'),
    path('planned/<int:pk>/', views.PlannedDetailView.as_view(), name='planned-detail'),
    path('planned/', views.PlannedListCreateView.as_view(), name='planned-list'),
    path(
        'notifications/unread-count/',
        views.notifications_unread_count,
        name='notifications-unread-count',
    ),
    path(
        'notifications/read-all/',
        views.notifications_mark_all_read,
        name='notifications-read-all',
    ),
    path(
        'notifications/<int:pk>/read/',
        views.notification_mark_read,
        name='notification-mark-read',
    ),
    path('notifications/', views.NotificationListView.as_view(), name='notifications'),
    path('auth/login/', views.auth_login, name='auth-login'),
    path('auth/me/', views.CurrentUserView.as_view(), name='auth-me'),
    path('meta/org-context/', views.OrgContextView.as_view(), name='org-context'),
    path('meta/branches/', views.BranchChoicesView.as_view(), name='branches'),
    path(
        'meta/commissions/',
        views.CommissionListView.as_view(),
        name='commissions',
    ),
    path(
        'meta/event-categories/',
        views.EventCategoriesView.as_view(),
        name='event-categories',
    ),
    path('org-units/', views.OrgUnitListView.as_view(), name='org-units'),
]
