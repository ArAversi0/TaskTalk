# Generated by Django 4.2.16 on 2025-06-18 04:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_notification'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notification',
            name='notif_type',
            field=models.CharField(choices=[('invite', 'Приглашение'), ('exclude', 'Исключение из группы')], max_length=20),
        ),
    ]
