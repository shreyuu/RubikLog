from django.core.management.base import BaseCommand
from django.db import connection
from tracker.models import Solve
import time

class Command(BaseCommand):
    help = 'Test database connection and query performance'

    def handle(self, *args, **options):
        self.stdout.write('Testing database connection...')
        
        try:
            # Test connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                self.stdout.write(self.style.SUCCESS('Database connection successful'))
            
            # Test query performance
            start_time = time.time()
            
            # Test basic query
            solves = Solve.objects.all()
            count = solves.count()
            self.stdout.write(f'Total solves in database: {count}')
            
            # Test query with ordering
            solves = Solve.objects.order_by('-created_at')[:10]
            solves_list = list(solves)
            self.stdout.write(f'Retrieved {len(solves_list)} solves')
            
            # Test query execution time
            end_time = time.time()
            self.stdout.write(f'Query execution time: {end_time - start_time:.2f} seconds')
            
            # Show query plan
            with connection.cursor() as cursor:
                cursor.execute("EXPLAIN ANALYZE SELECT * FROM tracker_solve ORDER BY created_at DESC LIMIT 10")
                plan = cursor.fetchall()
                self.stdout.write('\nQuery plan:')
                for row in plan:
                    self.stdout.write(row[0])
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Database test failed: {str(e)}')) 