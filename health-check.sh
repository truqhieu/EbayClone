#!/bin/bash

# Health Check Script for Load Balancer
# This script checks the health of all services

echo "=== Load Balancer Health Check ==="
echo "Timestamp: $(date)"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $service_name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ Healthy${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗ Unhealthy${NC} (HTTP $response)"
        return 1
    fi
}

# Function to get detailed service info
get_service_info() {
    local service_name=$1
    local url=$2
    
    echo "--- $service_name Details ---"
    response=$(curl -s "$url" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "$response" | jq . 2>/dev/null || echo "$response"
    else
        echo "Failed to get service info"
    fi
    echo
}

# Check main load balancer
echo "1. Load Balancer Status:"
check_service "Nginx Load Balancer" "http://localhost/nginx-health"
echo

# Check backend services through load balancer
echo "2. Backend Services (through Load Balancer):"
for i in {1..5}; do
    echo -n "Request $i: "
    response=$(curl -s "http://localhost/" 2>/dev/null)
    if [ $? -eq 0 ]; then
        server_id=$(echo "$response" | jq -r '.server' 2>/dev/null)
        echo -e "${GREEN}✓${NC} Served by: $server_id"
    else
        echo -e "${RED}✗ Failed${NC}"
    fi
done
echo

# Check individual backend services
echo "3. Individual Backend Services:"
services=("app1:3000" "app2:3000" "app3:3000" "app4:3000")
for service in "${services[@]}"; do
    check_service "$service" "http://$service/health"
done
echo

# Check additional services
echo "4. Additional Services:"
check_service "Redis" "http://redis:6379" # This might not work without redis-cli
check_service "Prometheus" "http://localhost:9090/-/healthy"
check_service "Grafana" "http://localhost:3001/api/health"
echo

# Performance test
echo "5. Performance Test (10 concurrent requests):"
echo "Testing load distribution..."
for i in {1..10}; do
    curl -s "http://localhost/" | jq -r '.server' 2>/dev/null &
done
wait
echo

# API endpoint tests
echo "6. API Endpoint Tests:"
check_service "Users API" "http://localhost/api/users"
check_service "Heavy Computation API" "http://localhost/api/heavy"
echo

# Get detailed info from one backend
echo "7. Detailed Backend Info:"
get_service_info "Backend Service" "http://localhost/health"

echo "=== Health Check Complete ==="