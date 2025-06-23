from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'tiles', views.TileViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('my-groups/', views.my_groups, name='my-groups'),
    path('create-group/', views.create_group, name='create-group'),
    path('groups/<int:group_id>/posts/', views.group_posts, name='group-posts'),
    path('groups/<int:group_id>/posts/<int:post_id>/', views.group_post_detail, name='group-post-detail'),
    path('groups/<int:group_id>/posts/<int:post_id>/comments/', views.add_comment, name='add-comment'),
    path('groups/<int:group_id>/posts/<int:post_id>/comments/<int:comment_id>/', views.delete_comment, name='delete-comment'),
    path('groups/<int:group_id>/', views.delete_group, name='delete-group'),
    path('groups/<int:group_id>/invite/', views.invite_to_group, name='invite-to-group'),
    path('groups/<int:group_id>/exclude/', views.exclude_member, name='exclude-member'),
    path('notifications/', views.get_notifications, name='get-notifications'),
    path('notifications/mark_viewed/', views.mark_notifications_viewed, name='mark-notifications-viewed'),
    path('notifications/<int:notif_id>/delete/', views.delete_notification, name='delete-notification'),
    path('invitations/<int:invite_id>/<str:action>/', views.invitation_action, name='invitation-action'),
    path('users/', include('users.urls')),
    path('groups/<int:group_id>/leave/', views.leave_group, name='leave-group'),
]