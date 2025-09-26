#!/bin/bash

# AML-Plus-UI QA Deployment Script for Google Cloud
set -e

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-your-project-id}"
SERVICE_NAME="aml-plus-ui-qa"
REGION="us-central1"
API_URL="https://34.36.135.193/api"

echo "🚀 Starting AML-Plus-UI QA deployment to Google Cloud..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK is not installed. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install it first."
    exit 1
fi

# Check if project ID is set
if [ "$PROJECT_ID" = "your-project-id" ]; then
    echo "❌ Please set your Google Cloud Project ID:"
    echo "export GOOGLE_CLOUD_PROJECT=your-actual-project-id"
    exit 1
fi

echo "📋 Using Project ID: $PROJECT_ID"
echo "🌍 Target Region: $REGION"
echo "🔗 API URL: $API_URL"

# Authenticate with gcloud (if not already authenticated)
echo "🔐 Checking authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "Please authenticate with gcloud:"
    gcloud auth login
fi

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy using Cloud Build
echo "🏗️ Building and deploying with Cloud Build..."
gcloud builds submit \
    --config cloudbuild.yaml \
    --substitutions _SERVICE_NAME=$SERVICE_NAME,_REGION=$REGION \
    .

# Get the service URL
echo "🔍 Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

if [ -n "$SERVICE_URL" ]; then
    echo "✅ Deployment successful!"
    echo "🌐 QA Environment URL: $SERVICE_URL"
    echo "🔗 API configured to: $API_URL"
    echo ""
    echo "📝 Next steps:"
    echo "1. Test the application at: $SERVICE_URL"
    echo "2. Configure your domain if needed"
    echo "3. Set up monitoring and logging"
else
    echo "❌ Deployment failed or service URL not found"
    exit 1
fi
