# Generated by Django 5.1.5 on 2025-01-18 17:22

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='solve',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('time_taken', models.FloatField()),
                ('date_solved', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
