#!/bin/bash

# 📦 Rental Solutions - Dependencies Installation Script
# This script installs all required dependencies for the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}📦 Installing Dependencies${NC}"
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

# Check if running on Windows (Git Bash, WSL, etc.)
is_windows() {
    [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" || -n "$WSL_DISTRO_NAME" ]]
}

# Check if running on macOS
is_macos() {
    [[ "$OSTYPE" == "darwin"* ]]
}

# Check if running on Linux
is_linux() {
    [[ "$OSTYPE" == "linux-gnu"* ]]
}

install_node() {
    print_step "Installing Node.js..."
    
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        print_success "Node.js already installed: $node_version"
        
        # Check if version is 18 or higher
        local major_version=$(echo $node_version | cut -d'.' -f1 | sed 's/v//')
        if [ "$major_version" -lt 18 ]; then
            print_warning "Node.js version is too old. Please update to version 18 or higher."
            return 1
        fi
        return 0
    fi
    
    if is_macos; then
        if command -v brew &> /dev/null; then
            brew install node@18
        else
            print_error "Homebrew not found. Please install Homebrew first."
            return 1
        fi
    elif is_linux; then
        # Use NodeSource repository for latest Node.js
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif is_windows; then
        print_warning "Please install Node.js manually from https://nodejs.org/"
        return 1
    fi
    
    print_success "Node.js installed successfully!"
}

install_docker() {
    print_step "Installing Docker..."
    
    if command -v docker &> /dev/null; then
        print_success "Docker already installed"
        return 0
    fi
    
    if is_macos; then
        if command -v brew &> /dev/null; then
            brew install --cask docker
        else
            print_warning "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
        fi
    elif is_linux; then
        # Install Docker CE
        sudo apt-get update
        sudo apt-get install -y \
            apt-transport-https \
            ca-certificates \
            curl \
            gnupg \
            lsb-release
        
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
          $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io
        
        # Add user to docker group
        sudo usermod -aG docker $USER
        
        print_warning "Please log out and log back in for Docker group changes to take effect"
    elif is_windows; then
        print_warning "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    fi
    
    print_success "Docker installation completed!"
}

install_kubectl() {
    print_step "Installing kubectl..."
    
    if command -v kubectl &> /dev/null; then
        print_success "kubectl already installed"
        return 0
    fi
    
    if is_macos; then
        if command -v brew &> /dev/null; then
            brew install kubectl
        else
            curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"
            chmod +x kubectl
            sudo mv kubectl /usr/local/bin/
        fi
    elif is_linux; then
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
        chmod +x kubectl
        sudo mv kubectl /usr/local/bin/
    elif is_windows; then
        print_warning "Please install kubectl manually from https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/"
    fi
    
    print_success "kubectl installed successfully!"
}

install_aws_cli() {
    print_step "Installing AWS CLI..."
    
    if command -v aws &> /dev/null; then
        print_success "AWS CLI already installed"
        return 0
    fi
    
    if is_macos; then
        if command -v brew &> /dev/null; then
            brew install awscli
        else
            curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
            sudo installer -pkg AWSCLIV2.pkg -target /
            rm AWSCLIV2.pkg
        fi
    elif is_linux; then
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
        unzip awscliv2.zip
        sudo ./aws/install
        rm -rf awscliv2.zip aws/
    elif is_windows; then
        print_warning "Please install AWS CLI manually from https://aws.amazon.com/cli/"
    fi
    
    print_success "AWS CLI installed successfully!"
}

install_terraform() {
    print_step "Installing Terraform..."
    
    if command -v terraform &> /dev/null; then
        print_success "Terraform already installed"
        return 0
    fi
    
    if is_macos; then
        if command -v brew &> /dev/null; then
            brew tap hashicorp/tap
            brew install hashicorp/tap/terraform
        else
            print_warning "Please install Terraform manually from https://www.terraform.io/downloads.html"
        fi
    elif is_linux; then
        wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
        echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
        sudo apt update && sudo apt install terraform
    elif is_windows; then
        print_warning "Please install Terraform manually from https://www.terraform.io/downloads.html"
    fi
    
    print_success "Terraform installed successfully!"
}

install_npm_dependencies() {
    print_step "Installing npm dependencies..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root directory."
        return 1
    fi
    
    # Install dependencies
    npm ci
    
    print_success "npm dependencies installed successfully!"
}

install_playwright() {
    print_step "Installing Playwright browsers..."
    
    # Install Playwright browsers
    npx playwright install --with-deps
    
    print_success "Playwright browsers installed successfully!"
}

setup_git_hooks() {
    print_step "Setting up Git hooks..."
    
    # Install husky
    npm run prepare
    
    print_success "Git hooks setup completed!"
}

create_env_file() {
    print_step "Creating environment file..."
    
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            print_success "Environment file created from .env.example"
            print_warning "Please update .env.local with your actual configuration values"
        else
            print_warning ".env.example not found. Please create .env.local manually"
        fi
    else
        print_success "Environment file already exists"
    fi
}

setup_docker_compose() {
    print_step "Setting up Docker Compose services..."
    
    if [ -f "docker-compose.yml" ]; then
        print_step "Starting Docker Compose services..."
        docker-compose up -d
        print_success "Docker Compose services started"
    else
        print_warning "docker-compose.yml not found. Skipping Docker setup"
    fi
}

verify_installation() {
    print_step "Verifying installation..."
    
    local errors=0
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed or not in PATH"
        errors=$((errors + 1))
    else
        print_success "Node.js: $(node --version)"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed or not in PATH"
        errors=$((errors + 1))
    else
        print_success "npm: $(npm --version)"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed or not in PATH"
    else
        print_success "Docker: $(docker --version)"
    fi
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_warning "kubectl is not installed or not in PATH"
    else
        print_success "kubectl: $(kubectl version --client --short)"
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_warning "AWS CLI is not installed or not in PATH"
    else
        print_success "AWS CLI: $(aws --version)"
    fi
    
    # Check if project builds
    print_step "Testing project build..."
    if npm run build &> /dev/null; then
        print_success "Project builds successfully!"
    else
        print_error "Project build failed"
        errors=$((errors + 1))
    fi
    
    if [ $errors -eq 0 ]; then
        print_success "All verifications passed! 🎉"
    else
        print_error "$errors error(s) found during verification"
        return 1
    fi
}

show_next_steps() {
    echo ""
    echo -e "${BLUE}🎉 Installation completed successfully!${NC}"
    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo -e "1. Update your .env.local file with actual configuration values"
    echo -e "2. Run 'npm run dev' to start the development server"
    echo -e "3. Run 'npm test' to run the test suite"
    echo -e "4. Visit http://localhost:3000 to see your application"
    echo ""
    echo -e "${YELLOW}For production deployment:${NC}"
    echo -e "1. Configure your AWS credentials: aws configure"
    echo -e "2. Set up your Kubernetes cluster"
    echo -e "3. Run './scripts/deploy.sh deploy production'"
    echo ""
    echo -e "${BLUE}Documentation:${NC}"
    echo -e "- README.md - Project documentation"
    echo -e "- docs/ - Additional documentation"
    echo -e "- API documentation: http://localhost:3000/api/docs"
    echo ""
}

main() {
    print_header
    
    # Check if running in project directory
    if [ ! -f "package.json" ]; then
        print_error "This script must be run from the project root directory"
        exit 1
    fi
    
    # Install system dependencies
    install_node || exit 1
    install_docker
    install_kubectl
    install_aws_cli
    install_terraform
    
    # Install project dependencies
    install_npm_dependencies || exit 1
    install_playwright
    
    # Project setup
    setup_git_hooks
    create_env_file
    setup_docker_compose
    
    # Verify installation
    verify_installation || exit 1
    
    # Show next steps
    show_next_steps
}

# Run main function
main "$@" 