# Generated by Django 5.1.5 on 2025-01-20 18:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tracker', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='solve',
            name='scramble',
            field=models.TextField(default='No scramble provided'),
        ),
    ]
