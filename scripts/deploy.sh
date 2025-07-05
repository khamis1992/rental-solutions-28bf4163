#!/bin/bash

# 🚀 Rental Solutions Deployment Script
# This script handles deployment to different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="registry.rental-solutions.com"
PROJECT_NAME="rental-solutions"
NAMESPACE="rental-solutions"

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}🚀 Rental Solutions Deployment${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_step() {
    echo -e "${GREEN}➤ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install it first."
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check if aws cli is installed
    if ! command -v aws &> /dev/null; then
        print_error "aws cli is not installed. Please install it first."
        exit 1
    fi
    
    # Check if node is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    print_success "All prerequisites are met!"
}

install_dependencies() {
    print_step "Installing dependencies..."
    npm ci
    print_success "Dependencies installed successfully!"
}

run_tests() {
    print_step "Running tests..."
    
    # Type checking
    print_step "Running TypeScript checks..."
    npm run type-check
    
    # Linting
    print_step "Running ESLint..."
    npm run lint
    
    # Unit tests
    print_step "Running unit tests..."
    npm run test:unit
    
    # Integration tests
    print_step "Running integration tests..."
    npm run test:integration
    
    print_success "All tests passed!"
}

build_application() {
    print_step "Building application..."
    npm run build
    print_success "Application built successfully!"
}

build_docker_images() {
    local environment=$1
    print_step "Building Docker images for $environment..."
    
    # Get current commit hash
    local commit_hash=$(git rev-parse HEAD)
    local image_tag="${environment}-${commit_hash:0:8}"
    
    # Build API image
    print_step "Building API image..."
    docker build -t ${REGISTRY}/${PROJECT_NAME}/api:${image_tag} -f docker/Dockerfile.api .
    docker tag ${REGISTRY}/${PROJECT_NAME}/api:${image_tag} ${REGISTRY}/${PROJECT_NAME}/api:latest
    
    # Build Web image
    print_step "Building Web image..."
    docker build -t ${REGISTRY}/${PROJECT_NAME}/web:${image_tag} -f docker/Dockerfile.web .
    docker tag ${REGISTRY}/${PROJECT_NAME}/web:${image_tag} ${REGISTRY}/${PROJECT_NAME}/web:latest
    
    print_success "Docker images built successfully!"
    echo "Image tag: ${image_tag}"
}

push_docker_images() {
    local environment=$1
    print_step "Pushing Docker images to registry..."
    
    # Get current commit hash
    local commit_hash=$(git rev-parse HEAD)
    local image_tag="${environment}-${commit_hash:0:8}"
    
    # Push API image
    docker push ${REGISTRY}/${PROJECT_NAME}/api:${image_tag}
    docker push ${REGISTRY}/${PROJECT_NAME}/api:latest
    
    # Push Web image
    docker push ${REGISTRY}/${PROJECT_NAME}/web:${image_tag}
    docker push ${REGISTRY}/${PROJECT_NAME}/web:latest
    
    print_success "Docker images pushed successfully!"
}

deploy_to_k8s() {
    local environment=$1
    print_step "Deploying to Kubernetes ($environment)..."
    
    # Update kubeconfig
    if [ "$environment" == "production" ]; then
        aws eks update-kubeconfig --region me-south-1 --name rental-solutions-production
        local k8s_dir="k8s/production"
        local namespace="rental-solutions"
    else
        aws eks update-kubeconfig --region me-south-1 --name rental-solutions-staging
        local k8s_dir="k8s/staging"
        local namespace="rental-solutions-staging"
    fi
    
    # Get current commit hash
    local commit_hash=$(git rev-parse HEAD)
    local image_tag="${environment}-${commit_hash:0:8}"
    
    # Update deployment images
    sed -i "s|image: ${REGISTRY}/${PROJECT_NAME}/api:latest|image: ${REGISTRY}/${PROJECT_NAME}/api:${image_tag}|g" ${k8s_dir}/deployment.yaml
    sed -i "s|image: ${REGISTRY}/${PROJECT_NAME}/web:latest|image: ${REGISTRY}/${PROJECT_NAME}/web:${image_tag}|g" ${k8s_dir}/deployment.yaml
    
    # Apply Kubernetes manifests
    kubectl apply -f ${k8s_dir}/namespace.yaml
    kubectl apply -f ${k8s_dir}/secrets.yaml
    kubectl apply -f ${k8s_dir}/configmap.yaml
    kubectl apply -f ${k8s_dir}/deployment.yaml
    kubectl apply -f ${k8s_dir}/service.yaml
    kubectl apply -f ${k8s_dir}/ingress.yaml
    kubectl apply -f ${k8s_dir}/hpa.yaml
    
    # Wait for deployment to complete
    print_step "Waiting for deployment to complete..."
    kubectl rollout status deployment/rental-solutions-api -n ${namespace} --timeout=600s
    kubectl rollout status deployment/rental-solutions-web -n ${namespace} --timeout=600s
    
    print_success "Deployment completed successfully!"
}

run_smoke_tests() {
    local environment=$1
    print_step "Running smoke tests for $environment..."
    
    if [ "$environment" == "production" ]; then
        local base_url="https://rental-solutions.qa"
    else
        local base_url="https://staging.rental-solutions.qa"
    fi
    
    # Test API health
    print_step "Testing API health..."
    curl -f ${base_url}/api/health || {
        print_error "API health check failed!"
        exit 1
    }
    
    # Test web health
    print_step "Testing web health..."
    curl -f ${base_url}/health || {
        print_error "Web health check failed!"
        exit 1
    }
    
    print_success "Smoke tests passed!"
}

run_e2e_tests() {
    local environment=$1
    print_step "Running E2E tests for $environment..."
    
    if [ "$environment" == "production" ]; then
        local base_url="https://rental-solutions.qa"
    else
        local base_url="https://staging.rental-solutions.qa"
    fi
    
    # Install Playwright browsers
    npx playwright install --with-deps
    
    # Run E2E tests
    BASE_URL=${base_url} npm run test:e2e
    
    print_success "E2E tests completed!"
}

rollback_deployment() {
    local environment=$1
    print_step "Rolling back deployment for $environment..."
    
    if [ "$environment" == "production" ]; then
        aws eks update-kubeconfig --region me-south-1 --name rental-solutions-production
        local namespace="rental-solutions"
    else
        aws eks update-kubeconfig --region me-south-1 --name rental-solutions-staging
        local namespace="rental-solutions-staging"
    fi
    
    # Rollback deployments
    kubectl rollout undo deployment/rental-solutions-api -n ${namespace}
    kubectl rollout undo deployment/rental-solutions-web -n ${namespace}
    
    # Wait for rollback to complete
    kubectl rollout status deployment/rental-solutions-api -n ${namespace} --timeout=300s
    kubectl rollout status deployment/rental-solutions-web -n ${namespace} --timeout=300s
    
    print_success "Rollback completed successfully!"
}

show_help() {
    echo "Usage: $0 [command] [environment]"
    echo ""
    echo "Commands:"
    echo "  deploy     - Full deployment pipeline"
    echo "  build      - Build and push Docker images"
    echo "  test       - Run tests only"
    echo "  rollback   - Rollback to previous deployment"
    echo "  status     - Show deployment status"
    echo "  logs       - Show application logs"
    echo ""
    echo "Environments:"
    echo "  staging    - Deploy to staging environment"
    echo "  production - Deploy to production environment"
    echo ""
    echo "Examples:"
    echo "  $0 deploy staging"
    echo "  $0 build production"
    echo "  $0 test"
    echo "  $0 rollback production"
}

show_status() {
    local environment=$1
    print_step "Showing deployment status for $environment..."
    
    if [ "$environment" == "production" ]; then
        aws eks update-kubeconfig --region me-south-1 --name rental-solutions-production
        local namespace="rental-solutions"
    else
        aws eks update-kubeconfig --region me-south-1 --name rental-solutions-staging
        local namespace="rental-solutions-staging"
    fi
    
    echo "Pods:"
    kubectl get pods -n ${namespace}
    echo ""
    echo "Services:"
    kubectl get services -n ${namespace}
    echo ""
    echo "Ingress:"
    kubectl get ingress -n ${namespace}
    echo ""
    echo "HPA:"
    kubectl get hpa -n ${namespace}
}

show_logs() {
    local environment=$1
    local service=${2:-"api"}
    
    print_step "Showing logs for $service in $environment..."
    
    if [ "$environment" == "production" ]; then
        aws eks update-kubeconfig --region me-south-1 --name rental-solutions-production
        local namespace="rental-solutions"
    else
        aws eks update-kubeconfig --region me-south-1 --name rental-solutions-staging
        local namespace="rental-solutions-staging"
    fi
    
    kubectl logs -f deployment/rental-solutions-${service} -n ${namespace}
}

# Main script logic
main() {
    print_header
    
    case $1 in
        deploy)
            if [ -z "$2" ]; then
                print_error "Environment not specified. Use: staging or production"
                exit 1
            fi
            
            environment=$2
            print_step "Starting deployment to $environment..."
            
            check_prerequisites
            install_dependencies
            run_tests
            build_application
            build_docker_images $environment
            push_docker_images $environment
            deploy_to_k8s $environment
            run_smoke_tests $environment
            
            if [ "$environment" == "production" ]; then
                run_e2e_tests $environment
            fi
            
            print_success "Deployment to $environment completed successfully! 🎉"
            ;;
        build)
            if [ -z "$2" ]; then
                print_error "Environment not specified. Use: staging or production"
                exit 1
            fi
            
            environment=$2
            check_prerequisites
            install_dependencies
            build_application
            build_docker_images $environment
            push_docker_images $environment
            ;;
        test)
            check_prerequisites
            install_dependencies
            run_tests
            ;;
        rollback)
            if [ -z "$2" ]; then
                print_error "Environment not specified. Use: staging or production"
                exit 1
            fi
            
            environment=$2
            rollback_deployment $environment
            ;;
        status)
            if [ -z "$2" ]; then
                print_error "Environment not specified. Use: staging or production"
                exit 1
            fi
            
            environment=$2
            show_status $environment
            ;;
        logs)
            if [ -z "$2" ]; then
                print_error "Environment not specified. Use: staging or production"
                exit 1
            fi
            
            environment=$2
            service=$3
            show_logs $environment $service
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@" 