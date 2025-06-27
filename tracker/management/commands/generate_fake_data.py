from django.core.management.base import BaseCommand
from tracker.models import Solve
from faker import Faker
import random
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Generate fake solve data for testing and development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=50,
            help='Number of fake solves to create (default: 50)',
        )
        parser.add_argument(
            '--days-back',
            type=int,
            default=30,
            help='Generate solves from how many days back (default: 30)',
        )

    def handle(self, *args, **options):
        fake = Faker()
        count = options['count']
        days_back = options['days_back']

        # Realistic time ranges for different skill levels
        time_ranges = [
            (8, 15, 0.4),    # Expert: 8-15 seconds (40% chance)
            (15, 25, 0.4),   # Advanced: 15-25 seconds (40% chance)  
            (25, 45, 0.15),  # Intermediate: 25-45 seconds (15% chance)
            (45, 120, 0.05), # Beginner: 45-120 seconds (5% chance)
        ]

        scrambles = [
            "R U R' U' R' F R2 U' R' U' R U R' F'",
            "F R U' R' U' R U R' F' R U R' U' R' F R F'",
            "R U2 R' U' R U' R' F R F' U F R U R' U' F'",
            "R U R' F' R U R' U' R' F R2 U' R'",
            "F R U R' U' F' U F R U R' U' F'",
            "R U R' U R U2 R' U",
            "L' U' L U' L' U2 L U'",
            "F U R U' R' F' U' F R U R' U' F'",
            "R' U' R U' R' U2 R",
            "L U L' U L U2 L'",
        ]

        created_solves = 0
        start_date = datetime.now() - timedelta(days=days_back)

        self.stdout.write(f'Generating {count} fake solves...')

        for i in range(count):
            # Choose time based on weighted probability
            rand = random.random()
            cumulative = 0
            for min_time, max_time, probability in time_ranges:
                cumulative += probability
                if rand <= cumulative:
                    time_taken = round(random.uniform(min_time, max_time), 2)
                    break

            # Random date within the range
            random_date = fake.date_time_between(
                start_date=start_date,
                end_date='now'
            )

            solve = Solve.objects.create(
                time_taken=time_taken,
                scramble=random.choice(scrambles),
                created_at=random_date,
                note=fake.sentence() if random.random() < 0.2 else ""  # 20% chance of note
            )
            created_solves += 1

            if (i + 1) % 10 == 0:
                self.stdout.write(f'Created {i + 1}/{count} solves...')

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_solves} fake solves'
            )
        )
