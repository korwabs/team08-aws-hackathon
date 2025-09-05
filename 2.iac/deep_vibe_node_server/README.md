# Deep Vibe Node Server Infrastructure

This directory contains the Terraform infrastructure code and deployment scripts for the Deep Vibe Node Server application.

## Directory Structure

```
2.iac/deep_vibe_node_server/
├── terraform/          # Terraform infrastructure code
├── deploy.sh           # Full deployment script (infrastructure + application)
├── destroy.sh          # Infrastructure destruction script
├── start.sh            # Start ECS service
├── stop.sh             # Stop ECS service
└── README.md           # This file
```

## Usage

### Deploy Infrastructure and Application
```bash
cd 2.iac/deep_vibe_node_server
./deploy.sh
```

### Destroy Infrastructure
```bash
cd 2.iac/deep_vibe_node_server
./destroy.sh
```

### Start/Stop ECS Service
```bash
cd 2.iac/deep_vibe_node_server
./start.sh    # Start the service
./stop.sh     # Stop the service
```

## Prerequisites

- AWS CLI configured with appropriate permissions
- Docker installed and running
- Terraform installed

## Notes

- The deployment script builds the Docker image from `../../1.code/deep_vibe_node_server`
- All scripts should be run from this directory (`2.iac/deep_vibe_node_server`)
