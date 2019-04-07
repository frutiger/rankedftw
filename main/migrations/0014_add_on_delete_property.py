# Generated by Django 2.2 on 2019-04-07 17:04

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0013_fixing_indices'),
    ]

    operations = [
        migrations.AlterField(
            model_name='player',
            name='season',
            field=models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='main.Season'),
        ),
        migrations.AlterField(
            model_name='rankingdata',
            name='ranking',
            field=models.OneToOneField(null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='ranking_data', to='main.Ranking'),
        ),
        migrations.AlterField(
            model_name='rankingstats',
            name='ranking',
            field=models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='main.Ranking'),
        ),
        migrations.AlterField(
            model_name='team',
            name='season',
            field=models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='main.Season'),
        ),
    ]
