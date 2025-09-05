# React App Deployment

This Terraform configuration deploys a React application to AWS using S3 for static hosting and CloudFront for CDN with HTTPS.

## Architecture

- **S3 Bucket**: Hosts the React build files
- **CloudFront**: CDN with HTTPS support
- **Route 53**: Optional domain configuration

## Prerequisites

- AWS CLI configured
- Terraform installed
- Node.js and npm installed

## Deployment

```bash
# Make scripts executable
chmod +x deploy.sh destroy.sh

# Deploy
./deploy.sh
```

## Manual Steps

1. Build React app:
```bash
cd ../../1.code/react-app
npm install
npm run build
```

2. Deploy infrastructure:
```bash
cd terraform
terraform init
terraform apply
```

3. Upload build files:
```bash
aws s3 sync ../../../1.code/react-app/build/ s3://BUCKET_NAME/ --delete
```

4. Invalidate CloudFront cache:
```bash
aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*"
```

## Cleanup

```bash
./destroy.sh
```
