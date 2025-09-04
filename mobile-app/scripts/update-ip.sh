#!/bin/bash

# Get current IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
else
    # Linux
    CURRENT_IP=$(hostname -I | awk '{print $1}')
fi

if [ -z "$CURRENT_IP" ]; then
    echo "Could not detect IP address"
    exit 1
fi

echo "Detected IP: $CURRENT_IP"

# Update .env.local file
ENV_FILE="../.env.local"
if [ -f "$ENV_FILE" ]; then
    # Update existing IP
    sed -i.bak "s/EXPO_PUBLIC_API_IP=.*/EXPO_PUBLIC_API_IP=$CURRENT_IP/" "$ENV_FILE"
    echo "Updated .env.local with IP: $CURRENT_IP"
else
    # Create new file
    echo "# Network Configuration" > "$ENV_FILE"
    echo "EXPO_PUBLIC_API_IP=$CURRENT_IP" >> "$ENV_FILE"
    echo "EXPO_PUBLIC_API_PORT=3001" >> "$ENV_FILE"
    echo "Created .env.local with IP: $CURRENT_IP"
fi

# Also update the api.ts file directly as a fallback
API_FILE="../src/services/api.ts"
if [ -f "$API_FILE" ]; then
    sed -i.bak "s/http:\/\/[0-9.]*:[0-9]*/http:\/\/$CURRENT_IP:3001/" "$API_FILE"
    echo "Updated api.ts with IP: $CURRENT_IP"
fi

echo "IP configuration updated successfully!"
echo "You may need to restart the Expo development server for changes to take effect."