#!/bin/sh

set -e

# Wait for database to be ready
echo "Waiting for database at $DB_HOST:3306..."
until nc -z "$DB_HOST" 3306; do
  echo "Database not ready, waiting 15 seconds..."
  sleep 15
done
echo "Database is up!"

# Apply migrations
echo "Applying database migrations..."
#python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser if it does not exist
email=${DJANGO_SUPERUSER_EMAIL:-admin@sonali.com}
password=${DJANGO_SUPERUSER_PASSWORD:-admin12345@}

echo "Creating superuser if it does not exist..."
python manage.py shell -c "from django.contrib.auth import get_user_model; \
User = get_user_model(); \
User.objects.filter(email='$email').exists() or User.objects.create_superuser(email='$email', password='$password')"

# Start Gunicorn
echo "Starting Gunicorn..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8003 --workers 2 --timeout 120
