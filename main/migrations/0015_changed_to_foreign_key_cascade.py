# Generated by Django 2.2 on 2019-04-23 15:17

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0014_add_on_delete_property'),
    ]

    operations = [
        migrations.AlterField(
            model_name='rankingdata',
            name='ranking',
            field=models.OneToOneField(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='ranking_data', to='main.Ranking'),
        ),
        migrations.AlterField(
            model_name='rankingstats',
            name='ranking',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='main.Ranking'),
        ),
    ]
