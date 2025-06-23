from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth import authenticate
from api.models import Group
from django.db import models

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES)

    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'middle_name', 'email', 'password', 'password2', 'role']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Пароли не совпадают")
        if not data.get('role'):
            raise serializers.ValidationError("Роль пользователя обязательна")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        user.is_active = True
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Неверный логин или пароль")
        return {"user": user}

class UserGroupSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    class Meta:
        model = Group
        fields = ['id', 'name', 'role']

    def get_role(self, obj):
        user = self.context.get('user')
        if obj.admin == user:
            return 'admin'
        elif obj.teachers.filter(id=user.id).exists():
            return 'teacher'
        elif obj.students.filter(id=user.id).exists():
            return 'student'
        return None

class UserSerializer(serializers.ModelSerializer):
    fullName = serializers.SerializerMethodField()
    about = serializers.CharField(required=False, allow_blank=True)
    groups = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'fullName', 'role', 'about', 'first_name', 'last_name', 'middle_name', 'groups']
        read_only_fields = ['id', 'role']

    def get_fullName(self, obj):
        return f"{obj.last_name} {obj.first_name} {obj.middle_name}"

    def get_groups(self, obj):
        from api.models import Group
        user = obj
        groups = Group.objects.filter(models.Q(admin=user) | models.Q(teachers=user) | models.Q(students=user)).distinct()
        return UserGroupSerializer(groups, many=True, context={'user': user}).data

    def validate_email(self, value):
        user = self.instance
        if CustomUser.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует")
        return value