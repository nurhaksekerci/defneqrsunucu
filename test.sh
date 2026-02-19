#!/bin/bash

# Test Runner Script for Docker
# Usage: ./test.sh [backend|frontend|all]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Defne Qr - Docker Test Runner${NC}"
echo "=================================="

TEST_TARGET=${1:-all}

cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up test containers...${NC}"
    docker compose -f docker-compose.test.yml down -v
}

trap cleanup EXIT

case $TEST_TARGET in
    backend)
        echo -e "${GREEN}🔧 Running Backend Tests...${NC}"
        docker compose -f docker-compose.test.yml up --build --abort-on-container-exit backend-test
        ;;
    
    frontend)
        echo -e "${GREEN}⚛️  Running Frontend Tests...${NC}"
        docker compose -f docker-compose.test.yml up --build --abort-on-container-exit frontend-test
        ;;
    
    all)
        echo -e "${GREEN}🔧 Running Backend Tests...${NC}"
        docker compose -f docker-compose.test.yml up --build --abort-on-container-exit backend-test
        
        echo -e "\n${GREEN}⚛️  Running Frontend Tests...${NC}"
        docker compose -f docker-compose.test.yml up --build --abort-on-container-exit frontend-test
        ;;
    
    *)
        echo -e "${RED}❌ Invalid argument. Use: backend, frontend, or all${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}✅ Tests completed!${NC}"
