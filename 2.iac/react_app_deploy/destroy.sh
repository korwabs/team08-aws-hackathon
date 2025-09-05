#!/bin/bash

set -e

cd terraform

echo "Getting S3 bucket name..."
BUCKET_NAME=$(terraform output -raw s3_bucket_name 2>/dev/null || echo "")

if [ ! -z "$BUCKET_NAME" ]; then
    echo "Emptying S3 bucket..."
    aws s3 rm s3://$BUCKET_NAME/ --recursive
fi

echo "Destroying infrastructure..."
terraform destroy -auto-approve

echo "Cleanup complete!"
