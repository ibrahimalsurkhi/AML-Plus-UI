@echo off
REM AML-Plus-UI QA Deployment Script for Google Cloud (Windows)
setlocal EnableDelayedExpansion

REM Configuration
set SERVICE_NAME=aml-plus-ui-qa
set REGION=us-central1
set API_URL=https://34.36.135.193/api

echo 🚀 Starting AML-Plus-UI QA deployment to Google Cloud...

REM Check if gcloud is installed
where gcloud >nul 2>nul
if errorlevel 1 (
    echo ❌ Google Cloud SDK is not installed. Please install it first.
    echo Visit: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

REM Check if Docker is installed
where docker >nul 2>nul
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install it first.
    pause
    exit /b 1
)

REM Get project ID
for /f "tokens=*" %%i in ('gcloud config get-value project 2^>nul') do set PROJECT_ID=%%i

if "%PROJECT_ID%"=="" (
    echo ❌ No Google Cloud project is set. Please set your project:
    echo gcloud config set project your-project-id
    pause
    exit /b 1
)

echo 📋 Using Project ID: %PROJECT_ID%
echo 🌍 Target Region: %REGION%
echo 🔗 API URL: %API_URL%

REM Check authentication
echo 🔐 Checking authentication...
gcloud auth list --filter=status:ACTIVE --format="value(account)" >nul 2>nul
if errorlevel 1 (
    echo Please authenticate with gcloud:
    gcloud auth login
)

REM Enable required APIs
echo 🔧 Enabling required Google Cloud APIs...
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

REM Build and deploy using Cloud Build
echo 🏗️ Building and deploying with Cloud Build...
gcloud builds submit --config cloudbuild.yaml --substitutions _SERVICE_NAME=%SERVICE_NAME%,_REGION=%REGION% .

if errorlevel 1 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

REM Get the service URL
echo 🔍 Getting service URL...
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(status.url)" 2^>nul') do set SERVICE_URL=%%i

if not "%SERVICE_URL%"=="" (
    echo ✅ Deployment successful!
    echo 🌐 QA Environment URL: %SERVICE_URL%
    echo 🔗 API configured to: %API_URL%
    echo.
    echo 📝 Next steps:
    echo 1. Test the application at: %SERVICE_URL%
    echo 2. Configure your domain if needed
    echo 3. Set up monitoring and logging
) else (
    echo ❌ Deployment failed or service URL not found
    pause
    exit /b 1
)

pause
