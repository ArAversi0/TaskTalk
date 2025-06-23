from django.db import models
from users.models import CustomUser

# Create your models here.
class Tile(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.title)

class Group(models.Model):
    name = models.CharField(max_length=100)
    info = models.TextField(blank=True)
    admin = models.ForeignKey(CustomUser, related_name='admin_groups', on_delete=models.CASCADE)
    teachers = models.ManyToManyField(CustomUser, related_name='teaching_groups', blank=True)
    students = models.ManyToManyField(CustomUser, related_name='student_groups', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Post(models.Model):
    group = models.ForeignKey(Group, related_name='posts', on_delete=models.CASCADE)
    author = models.ForeignKey(CustomUser, related_name='posts', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    content = models.TextField()
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.group.name}"

class PostFile(models.Model):
    post = models.ForeignKey(Post, related_name='files', on_delete=models.CASCADE)
    file = models.FileField(upload_to='post_files/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name

class Comment(models.Model):
    post = models.ForeignKey(Post, related_name='comments', on_delete=models.CASCADE)
    author = models.ForeignKey(CustomUser, related_name='comments', on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    parent = models.ForeignKey('self', null=True, blank=True, related_name='replies', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.author} ({self.post}): {self.text[:30]}"

class Notification(models.Model):
    NOTIF_TYPE_CHOICES = [
        ('invite', 'Приглашение'),
        ('exclude', 'Исключение из группы'),
        ('reminder', 'Напоминание о дедлайне (только для студентов)'),
        # Можно добавить другие типы: ('deadline', 'Дедлайн'), ...
    ]
    notif_type = models.CharField(max_length=20, choices=NOTIF_TYPE_CHOICES)
    to_user = models.ForeignKey(CustomUser, related_name='notifications', on_delete=models.CASCADE)
    from_user = models.ForeignKey(CustomUser, related_name='sent_notifications', on_delete=models.SET_NULL, null=True, blank=True)
    group = models.ForeignKey(Group, related_name='notifications', on_delete=models.CASCADE, null=True, blank=True)
    post = models.ForeignKey('Post', related_name='reminder_notifications', on_delete=models.CASCADE, null=True, blank=True)
    deadline_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Ожидание'), 
        ('accepted', 'Принято'), 
        ('declined', 'Отклонено'),
        ('viewed', 'Просмотрено')
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    message = models.TextField(blank=True)

    def __str__(self):
        return f"{self.notif_type} для {self.to_user} ({self.status})"