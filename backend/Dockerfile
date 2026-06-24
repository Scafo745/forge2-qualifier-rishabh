FROM php:8.3-cli-alpine

# Install SQLite dependencies and PHP extension
RUN apk add --no-cache zip unzip git sqlite-dev && \
    docker-php-ext-install pdo_sqlite

# Copy Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Setup SQLite database and run migrations with seed data
RUN touch database/database.sqlite && \
    chmod -R 777 database && \
    php artisan migrate --seed --force

EXPOSE 80

# Run PHP built-in server bound to Render's dynamic port
CMD php -S 0.0.0.0:$PORT -t public
