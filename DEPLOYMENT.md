# AML-Plus-UI QA Deployment Guide

This guide provides instructions for deploying the AML-Plus-UI application to Google Cloud for the QA environment.

## Prerequisites

1. **Google Cloud SDK**: Install and configure the Google Cloud SDK
   ```bash
   # Install gcloud CLI
   curl https://sdk.cloud.google.com | bash
   source ~/.bashrc
   gcloud init
   ```

2. **Docker**: Ensure Docker is installed and running
   ```bash
   # Verify Docker installation
   docker --version
   ```

3. **Project Setup**: Ensure you have a Google Cloud project with billing enabled
   ```bash
   # Set your project ID
   export GOOGLE_CLOUD_PROJECT=your-project-id
   ```

## Deployment Options

### Option 1: Automated Deployment with Cloud Build (Recommended)

1. **Configure your project**:
   ```bash
   # Set your Google Cloud project ID
   export GOOGLE_CLOUD_PROJECT=your-actual-project-id
   ```

2. **Run the deployment script**:

   **For Linux/macOS**:
   ```bash
   chmod +x deploy-qa.sh
   ./deploy-qa.sh
   ```

   **For Windows**:
   ```batch
   deploy-qa.bat
   ```

   **Or using npm scripts**:
   ```bash
   # Linux/macOS
   npm run deploy:qa
   
   # Windows
   npm run deploy:qa:windows
   ```

3. **The script will**:
   - Enable required Google Cloud APIs
   - Build the Docker image with QA configuration
   - Deploy to Cloud Run
   - Provide you with the service URL

### Option 2: Manual Deployment

#### Step 1: Enable Required APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### Step 2: Build and Deploy
```bash
# Submit build to Cloud Build
gcloud builds submit --config cloudbuild.yaml .

# Alternative: Build locally and deploy
docker build \
  --build-arg VITE_APP_API_URL=http://34.36.135.193/api \
  --build-arg VITE_APP_ENVIRONMENT=qa \
  --build-arg VITE_APP_VERSION=9.1.2 \
  -t gcr.io/$GOOGLE_CLOUD_PROJECT/aml-plus-ui-qa .

docker push gcr.io/$GOOGLE_CLOUD_PROJECT/aml-plus-ui-qa

gcloud run deploy aml-plus-ui-qa \
  --image gcr.io/$GOOGLE_CLOUD_PROJECT/aml-plus-ui-qa \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1
```

### Option 3: App Engine Deployment

If you prefer App Engine over Cloud Run:

```bash
# Install dependencies and build
npm install
npm run build

# Deploy to App Engine
gcloud app deploy app.yaml
```

## Configuration

### Environment Variables

The QA environment is configured with:
- **API URL**: `https://34.36.135.193/api`
- **Environment**: `qa`
- **Version**: `9.1.2`

### Custom Domain (Optional)

To set up a custom domain:

1. **Map your domain**:
   ```bash
   gcloud run domain-mappings create \
     --service aml-plus-ui-qa \
     --domain qa.yourdomain.com \
     --region us-central1
   ```

2. **Configure DNS** with the provided CNAME record

## Monitoring and Logs

### View Application Logs
```bash
# Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=aml-plus-ui-qa" --limit 50

# Real-time logs
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=aml-plus-ui-qa"
```

### Monitor Performance
```bash
# Get service details
gcloud run services describe aml-plus-ui-qa --region us-central1

# View metrics in Cloud Console
# https://console.cloud.google.com/run/detail/us-central1/aml-plus-ui-qa
```

## Health Checks

The application includes a health check endpoint at `/health` that returns:
- Status: `200 OK`
- Response: `OK`

## Security Configuration

### HTTPS
- Cloud Run automatically provides HTTPS
- HTTP requests are redirected to HTTPS

### CORS
- Configured in nginx.conf for API requests
- Supports the API at `http://34.36.135.193/`

### Security Headers
The nginx configuration includes:
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Content-Security-Policy

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check build logs
   gcloud builds log --region us-central1
   ```

2. **Service Not Accessible**:
   ```bash
   # Check service status
   gcloud run services describe aml-plus-ui-qa --region us-central1
   ```

3. **API Connection Issues**:
   - Verify the API URL: `http://34.36.135.193/api`
   - Check CORS configuration
   - Verify network connectivity

### Rollback Deployment

```bash
# List revisions
gcloud run revisions list --service aml-plus-ui-qa --region us-central1

# Rollback to previous revision
gcloud run services update-traffic aml-plus-ui-qa \
  --to-revisions REVISION_NAME=100 \
  --region us-central1
```

## Cost Optimization

### Cloud Run Pricing
- **CPU**: $0.000024 per vCPU-second
- **Memory**: $0.0000025 per GiB-second
- **Requests**: $0.40 per million requests

### Optimization Tips
1. Set minimum instances to 0 for cost savings (increases cold start time)
2. Use appropriate CPU and memory allocation
3. Monitor usage with Cloud Monitoring

## Support

For deployment issues:
1. Check the application logs
2. Verify environment configuration
3. Test API connectivity
4. Review Google Cloud documentation

## Files Overview

- `Dockerfile`: Multi-stage Docker build configuration
- `nginx.conf`: Nginx web server configuration
- `cloudbuild.yaml`: Google Cloud Build configuration
- `app.yaml`: App Engine configuration (alternative)
- `deploy-qa.sh`: Automated deployment script
- `.dockerignore`: Docker build exclusions
- `.env.qa.example`: Example QA environment variables
