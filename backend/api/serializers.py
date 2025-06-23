from rest_framework import serializers
from .models import Tile, Group, Post, PostFile, Comment, Notification
from users.models import CustomUser
from django.utils import timezone

class TileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tile
        fields = ['id', 'title', 'description', 'created_at']

class PostFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostFile
        fields = ['id', 'file', 'uploaded_at']

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_role = serializers.SerializerMethodField()
    parent = serializers.PrimaryKeyRelatedField(queryset=Comment.objects.all(), required=False, allow_null=True)
    class Meta:
        model = Comment
        fields = ['id', 'text', 'created_at', 'author', 'author_name', 'author_role', 'parent']
        read_only_fields = ['author', 'author_name', 'author_role', 'created_at']

    def get_author_name(self, obj):
        def fio(user):
            initials = ''
            if user.first_name:
                initials += user.first_name[0] + '.'
            if hasattr(user, 'middle_name') and user.middle_name:
                initials += user.middle_name[0] + '.'
            return f"{user.last_name} {initials}".strip()
        return fio(obj.author)

    def get_author_role(self, obj):
        if hasattr(obj.author, 'role'):
            if obj.author.role == 'teacher':
                return 'Преподаватель'
            elif obj.author.role == 'student':
                return ''
            elif obj.author.role == 'admin':
                return 'Админ'
        return ''

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    files = PostFileSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'deadline', 'author', 'author_name', 'created_at', 'updated_at', 'files', 'comments']
        read_only_fields = ['author']

    def get_author_name(self, obj):
        def fio(user):
            initials = ''
            if user.first_name:
                initials += user.first_name[0] + '.'
            if hasattr(user, 'middle_name') and user.middle_name:
                initials += user.middle_name[0] + '.'
            return f"{user.last_name} {initials}".strip()
        return fio(obj.author)

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)

class GroupSerializer(serializers.ModelSerializer):
    admin = serializers.StringRelatedField()
    teachers = serializers.StringRelatedField(many=True, read_only=True)
    students = serializers.StringRelatedField(many=True, read_only=True)
    adminId = serializers.IntegerField(source='admin.id', read_only=True)
    members = serializers.SerializerMethodField()
    posts = PostSerializer(many=True, read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'info', 'admin', 'adminId', 'teachers', 'students', 'members', 'posts', 'created_at']
        read_only_fields = ['id', 'admin', 'adminId', 'teachers', 'students', 'members', 'posts', 'created_at']

    def get_members(self, obj):
        def fio(user):
            initials = ''
            if user.first_name:
                initials += user.first_name[0] + '.'
            if hasattr(user, 'middle_name') and user.middle_name:
                initials += user.middle_name[0] + '.'
            return f"{user.last_name} {initials}".strip()
        members = []
        members.append({'id': obj.admin.id, 'name': fio(obj.admin), 'role': 'admin'})
        for t in obj.teachers.all():
            if t != obj.admin:
                members.append({'id': t.id, 'name': fio(t), 'role': 'teacher'})
        for s in obj.students.all():
            members.append({'id': s.id, 'name': fio(s), 'role': 'student'})
        return members

class NotificationSerializer(serializers.ModelSerializer):
    from_user_name = serializers.SerializerMethodField()
    group_name = serializers.SerializerMethodField()
    post_title = serializers.SerializerMethodField()
    current_date = serializers.SerializerMethodField()
    class Meta:
        model = Notification
        fields = ['id', 'notif_type', 'to_user', 'from_user', 'from_user_name', 'group', 'group_name', 'post', 'post_title', 'deadline_date', 'current_date', 'status', 'created_at', 'message']

    def get_from_user_name(self, obj):
        if obj.from_user:
            initials = ''
            if obj.from_user.first_name:
                initials += obj.from_user.first_name[0] + '.'
            if hasattr(obj.from_user, 'middle_name') and obj.from_user.middle_name:
                initials += obj.from_user.middle_name[0] + '.'
            return f"{obj.from_user.last_name} {initials}".strip()
        return None
    def get_group_name(self, obj):
        return obj.group.name if obj.group else None
    def get_post_title(self, obj):
        return obj.post.title if obj.post else None
    def get_current_date(self, obj):
        return timezone.now().date()