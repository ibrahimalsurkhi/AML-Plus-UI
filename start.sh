#!/bin/sh

# Start nginx
echo "Starting nginx on port 8080..."
nginx -t && nginx -g 'daemon off;'
