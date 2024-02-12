#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Get command line arguments
environment=$1
releaseDate=$2

# Check for required arguments
if [ -z "$environment" ] || [ -z "$releaseDate" ]; then
  echo "Error: Missing required arguments. Usage: $0 (staging || production) \"<mention date>\""
  exit 1
fi

# GitHub API details
GITHUB_ORGANIZATION_NAME='aniruddh-214' #add your organization name here
REPO='unit_test'    # add your repo name where you want to run the workflow
GITHUB_TOKEN=${GITHUB_TOKEN}
workflowFileName="trigger-deployment.yml"

# GitHub API URL
url="https://api.github.com/repos/${GITHUB_ORGANIZATION_NAME}/${REPO}/actions/workflows/${workflowFileName}/dispatches"

# Trigger the GitHub Actions workflow
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url" \
-H "Authorization: Bearer ${GITHUB_TOKEN}" \
-H "Accept: application/vnd.github.v3+json" \
-d "{\"ref\":\"main\", \"inputs\": {\"environment\":\"${environment}\", \"releaseDate\":\"${releaseDate}\"}}")

# Check response status
if [ "$response" -eq 204 ]; then
  echo "Workflow dispatched successfully."
else
  echo "Failed to dispatch workflow: HTTP status $response"
fi
