from django.db import migrations, models
import django.db.models.deletion


def create_default_cube_type(apps, schema_editor):
    CubeType = apps.get_model("tracker", "CubeType")
    if not CubeType.objects.exists():
        default_cube = CubeType.objects.create(
            name="3x3", description="Standard 3x3x3 cube"
        )

        # Update existing solves
        Solve = apps.get_model("tracker", "Solve")
        Solve.objects.filter(cube_type__isnull=True).update(cube_type=default_cube)


class Migration(migrations.Migration):
    dependencies = [
        ("tracker", "0004_cubetype_solve_is_pb_solve_session_solve_tags_and_more"),
    ]

    operations = [
        # First make the field nullable to avoid issues with existing data
        migrations.AlterField(
            model_name="solve",
            name="cube_type",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="solves",
                to="tracker.cubetype",
            ),
        ),
        # Create the default cube type and update existing solves
        migrations.RunPython(
            create_default_cube_type, reverse_code=migrations.RunPython.noop
        ),
    ]
