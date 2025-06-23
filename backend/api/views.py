from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Tile, Group, Post, PostFile, Comment, Notification
from .serializers import TileSerializer, GroupSerializer, PostSerializer, CommentSerializer, NotificationSerializer
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from datetime import timedelta
from django.utils import timezone
from django.db import models
User = get_user_model()

class TileViewSet(viewsets.ModelViewSet):
    queryset = Tile.objects.all()
    serializer_class = TileSerializer
    permission_classes = [IsAuthenticated]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_groups(request):
    user = request.user
    groups = (Group.objects.filter(admin=user) | Group.objects.filter(teachers=user) | Group.objects.filter(students=user)).distinct()
    serializer = GroupSerializer(groups, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_group(request):
    serializer = GroupSerializer(data=request.data)
    if serializer.is_valid():
        group = serializer.save(admin=request.user)
        group.teachers.add(request.user)
        return Response(GroupSerializer(group).data)
    return Response(serializer.errors, status=400)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def group_posts(request, group_id):
    group = get_object_or_404(Group, id=group_id)
    
    if request.method == 'GET':
        posts = group.posts.all().order_by('-created_at')
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if request.user != group.admin:
            return Response({'error': 'Только администратор группы может создавать посты'}, status=403)
        print('FILES:', request.FILES)
        print('FILES LIST:', request.FILES.getlist('files'))
        serializer = PostSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            post = serializer.save(group=group)
            for file in request.FILES.getlist('files'):
                PostFile.objects.create(post=post, file=file)
            post.refresh_from_db()
            print('POST FILES:', post.files.all())
            return Response(PostSerializer(post).data)
        return Response(serializer.errors, status=400)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_group(request, group_id):
    group = get_object_or_404(Group, id=group_id)
    if request.user != group.admin:
        return Response({'error': 'Удалять группу может только админ'}, status=status.HTTP_403_FORBIDDEN)
    group.delete()
    return Response({'success': True})

@api_view(['GET', 'DELETE', 'PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def group_post_detail(request, group_id, post_id):
    group = get_object_or_404(Group, id=group_id)
    post = get_object_or_404(Post, id=post_id, group=group)
    if request.method == 'GET':
        serializer = PostSerializer(post)
        return Response(serializer.data)
    elif request.method == 'DELETE':
        if request.user != group.admin:
            return Response({'error': 'Удалять пост может только админ'}, status=status.HTTP_403_FORBIDDEN)
        post.delete()
        return Response({'success': True})
    elif request.method in ['PATCH', 'PUT']:
        if request.user != group.admin:
            return Response({'error': 'Редактировать пост может только админ'}, status=status.HTTP_403_FORBIDDEN)
        data = dict(request.data.copy())
        # Преобразуем все значения, кроме файлов, к строке (берём первый элемент, если список)
        for k, v in data.items():
            if isinstance(v, list):
                data[k] = v[0]
        # Удаление файлов по id (ожидаем список file_ids_to_delete)
        file_ids_to_delete = data.pop('file_ids_to_delete', None)
        print('file_ids_to_delete RAW:', file_ids_to_delete, type(file_ids_to_delete))
        if file_ids_to_delete:
            import json
            ids = []
            # Если это список, то парсим каждый элемент
            if isinstance(file_ids_to_delete, list):
                for el in file_ids_to_delete:
                    try:
                        ids.extend(json.loads(el))
                    except Exception:
                        pass
            elif isinstance(file_ids_to_delete, str):
                try:
                    ids = json.loads(file_ids_to_delete)
                except Exception:
                    try:
                        ids = [int(file_ids_to_delete)]
                    except Exception:
                        ids = []
            # Оставляем только числа
            file_ids_to_delete = [int(fid) for fid in ids if str(fid).isdigit()]
            for file_id in file_ids_to_delete:
                pf = PostFile.objects.filter(id=file_id, post=post).first()
                if pf:
                    pf.delete()
        # Удаляем file_ids_to_delete из data, если вдруг осталось
        data.pop('file_ids_to_delete', None)
        # Обновление основных полей
        serializer = PostSerializer(post, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Добавление новых файлов
            for file in request.FILES.getlist('files'):
                PostFile.objects.create(post=post, file=file)
            post.refresh_from_db()
            return Response(PostSerializer(post).data)
        return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_comment(request, group_id, post_id):
    post = get_object_or_404(Post, id=post_id, group_id=group_id)
    data = request.data.copy()
    data['author'] = request.user.id
    data['post'] = post.id
    serializer = CommentSerializer(data=data)
    if serializer.is_valid():
        serializer.save(author=request.user, post=post)
        return Response(serializer.data, status=201)
    else:
        print('COMMENT ERRORS:', serializer.errors)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_comment(request, group_id, post_id, comment_id):
    post = get_object_or_404(Post, id=post_id, group_id=group_id)
    comment = get_object_or_404(Comment, id=comment_id, post=post)
    user = request.user
    # Только админ группы или автор комментария может удалить
    if user == post.group.admin or user == comment.author:
        comment.delete()
        return Response({'success': True})
    return Response({'error': 'Нет прав на удаление'}, status=status.HTTP_403_FORBIDDEN)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_to_group(request, group_id):
    group = get_object_or_404(Group, id=group_id)
    if request.user != group.admin:
        return Response({'error': 'Только админ может приглашать в пустую группу'}, status=403)
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email обязателен'}, status=400)
    try:
        to_user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'Пользователь с таким email не найден'}, status=404)
    # Проверяем, состоит ли пользователь в группе
    in_teachers = group.teachers.filter(id=to_user.id).exists()
    in_students = group.students.filter(id=to_user.id).exists()
    print(f'DEBUG: Пользователь состоит в группе? Преподаватель: {in_teachers}, Студент: {in_students}')
    # Отладочный вывод всех приглашений пользователя в эту группу
    invites = Notification.objects.filter(
        notif_type='invite',
        to_user=to_user,
        group=group
    )
    print('DEBUG: Все приглашения в группу:', list(invites.values('id', 'status', 'created_at')))
    # Переводим все старые приглашения в этой группе для пользователя в 'declined'
    invites.filter(status='pending').update(status='declined')
    # Создаём только одно новое приглашение со статусом 'pending'
    try:
        notif = Notification.objects.create(
            notif_type='invite',
            to_user=to_user,
            from_user=request.user,
            group=group,
            message=f"Вас пригласили в группу '{group.name}'",
            status='pending'
        )
        print('DEBUG: Новое приглашение создано:', notif.id, notif.status)
    except Exception as e:
        print('ERROR: Не удалось создать приглашение:', e)
        return Response({'error': 'Ошибка создания приглашения'}, status=500)
    return Response(NotificationSerializer(notif).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    # Очистка старых уведомлений (accepted/declined/исключение старше 7 дней)
    week_ago = timezone.now() - timedelta(days=7)
    Notification.objects.filter(
        (
            (models.Q(status__in=['accepted', 'declined']) | models.Q(notif_type='exclude')) &
            models.Q(created_at__lt=week_ago)
        )
    ).delete()
    # Генерация напоминаний о дедлайне
    from .models import Post
    today = timezone.now().date()
    posts = Post.objects.filter(deadline__isnull=False)
    for post in posts:
        if not post.deadline:
            continue
        days_left = (post.deadline - today).days
        # Напоминание за 1 день до дедлайна, в день дедлайна и после дедлайна
        if days_left <= 1:
            group = post.group
            # Только для студентов
            users = list(group.students.all())
            for user in users:
                exists = Notification.objects.filter(
                    notif_type='reminder',
                    to_user=user,
                    post=post,
                    deadline_date=post.deadline
                ).exists()
                if not exists:
                    Notification.objects.create(
                        notif_type='reminder',
                        to_user=user,
                        group=group,
                        post=post,
                        deadline_date=post.deadline,
                        message=f"Напоминание о дедлайне по посту '{post.title}' в группе '{group.name}'"
                    )
    notifs = Notification.objects.filter(to_user=request.user).order_by('-created_at')
    return Response(NotificationSerializer(notifs, many=True).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invitation_action(request, invite_id, action):
    notif = get_object_or_404(Notification, id=invite_id, to_user=request.user, notif_type='invite')
    if notif.status != 'pending':
        return Response({'error': 'Приглашение уже обработано'}, status=400)
    if action == 'accept':
        notif.status = 'accepted'
        notif.save()
        # Добавляем в группу с учётом роли
        if hasattr(request.user, 'role') and request.user.role == 'teacher':
            notif.group.teachers.add(request.user)
        else:
            notif.group.students.add(request.user)
        return Response({'success': True, 'status': 'accepted'})
    elif action == 'decline':
        notif.status = 'declined'
        notif.save()
        return Response({'success': True, 'status': 'declined'})
    else:
        return Response({'error': 'Некорректное действие'}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def exclude_member(request, group_id):
    group = get_object_or_404(Group, id=group_id)
    if request.user != group.admin:
        return Response({'error': 'Только админ может исключать участников'}, status=403)
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'error': 'user_id обязателен'}, status=400)
    try:
        member = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Пользователь не найден'}, status=404)
    # Нельзя исключить себя
    if member == group.admin:
        return Response({'error': 'Нельзя исключить администратора'}, status=400)
    group.teachers.remove(member)
    group.students.remove(member)
    # Создаём уведомление об исключении
    Notification.objects.create(
        notif_type='exclude',
        to_user=member,
        from_user=request.user,
        group=group,
        message=f"Вас исключили из группы '{group.name}'",
        status='pending'
    )
    return Response({'success': True})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_group(request, group_id):
    group = get_object_or_404(Group, id=group_id)
    user = request.user
    # Админ не может выйти из своей группы
    if user == group.admin:
        return Response({'error': 'Админ не может выйти из своей группы'}, status=400)
    if group.teachers.filter(id=user.id).exists():
        group.teachers.remove(user)
        return Response({'success': True})
    elif group.students.filter(id=user.id).exists():
        group.students.remove(user)
        return Response({'success': True})
    else:
        return Response({'error': 'Вы не являетесь участником этой группы'}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notifications_viewed(request):
    Notification.objects.filter(
        to_user=request.user,
        status='pending'
    ).exclude(notif_type='invite').update(status='viewed')
    return Response({'success': True})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notif_id):
    notif = get_object_or_404(Notification, id=notif_id, to_user=request.user)
    notif.delete()
    return Response({'success': True})