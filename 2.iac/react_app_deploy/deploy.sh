#!/bin/bash

set -e

echo "Building React app..."
cd ../../1.code/react-app
npm install
npm run build

echo "Deploying infrastructure..."
cd ../../2.iac/react_app_deploy/terraform
terraform init
terraform plan
terraform apply -auto-approve

echo "Getting S3 bucket name..."
BUCKET_NAME=$(terraform output -raw s3_bucket_name)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)

echo "Uploading React build to S3..."
aws s3 sync ../../../1.code/react-app/dist/ s3://$BUCKET_NAME/ --delete

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"

echo "Deployment complete!"
terraform output website_url
