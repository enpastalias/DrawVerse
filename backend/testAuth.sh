#!/bin/bash
# Test Authentication Flow (Registration -> Login -> Profile)

API_URL="http://localhost:5000/api"

echo "=== Registering User ==="
REGISTER_RES=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}')
echo $REGISTER_RES

echo -e "\n=== Logging in User ==="
LOGIN_RES=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}')
echo $LOGIN_RES

# Extract token assuming jq is installed, else use simple node script
TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

echo -e "\n=== Fetching Protected Profile ==="
PROFILE_RES=$(curl -s -X GET $API_URL/users/profile \
  -H "Authorization: Bearer $TOKEN")
echo $PROFILE_RES
