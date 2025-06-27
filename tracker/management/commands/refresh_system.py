from django.core.management.base import BaseCommand
from django.db import connection
from django.core.cache import cache


class Command(BaseCommand):
    help = 'Clear application caches and reset database connections'

    def add_arguments(self, parser):
        parser.add_argument(
            '--cache-only',
            action='store_true',
            help='Only clear caches, don\'t reset database connections',
        )

    def handle(self, *args, **options):
        # Clear caches
        self.stdout.write('Clearing caches...')
        cache.clear()
        self.stdout.write(
            self.style.SUCCESS('Successfully cleared caches')
        )

        if not options['cache_only']:
            # Close database connections
            self.stdout.write('Closing database connections...')
            connection.close()
            self.stdout.write(
                self.style.SUCCESS('Successfully reset database connections')
            )

        self.stdout.write(
            self.style.SUCCESS('System refresh completed')
        )
