# API URL Configuration

This document explains how the frontend is configured to use different API URLs for different environments.

## Overview

The API URL is injected at **build time** via the `VITE_API_URL` environment variable. This means the URL is baked into the production bundle, not loaded at runtime.

## Local Development

For local development, the API URL defaults to `http://localhost:8070`:

```bash
cat .env.local
# Output: VITE_API_URL=http://localhost:8070
```

To run the dev server with this configuration:

```bash
npm run dev
```

To use a different API endpoint locally, update `.env.local`:

```bash
echo "VITE_API_URL=http://localhost:8080" > .env.local
npm run dev
```

## Docker Build

When building the Docker image, pass the `VITE_API_URL` as a build argument:

### For testing locally with docker:
```bash
docker build --build-arg VITE_API_URL=http://localhost:8070 -t frontend:local .
```

### For production in AWS:
```bash
docker build \
  --build-arg VITE_API_URL=https://api.inreach.elsys.itgix.eu \
  -t frontend:prod .
```

## Kubernetes/Helm Deployment

The Helm chart is configured to use the backend service URL within the cluster:

```yaml
# helm/frontend-chart/values.yaml
env:
  VITE_API_URL: "http://backend-backend-chart:8080"
```

To override for a specific deployment:

```bash
helm install frontend helm/frontend-chart \
  --set env.VITE_API_URL=https://api.yourdomain.com
```

Or with ArgoCD, update your `argocd/frontend.yaml`:

```yaml
spec:
  source:
    helm:
      values: |
        env:
          VITE_API_URL: https://api.inreach.elsys.itgix.eu
```

## CI/CD Pipeline Integration

When building images in your CI/CD pipeline, ensure the `VITE_API_URL` is passed as a build argument:

### GitHub Actions Example:
```yaml
- name: Build Frontend Image
  run: |
    docker build \
      --build-arg VITE_API_URL=${{ secrets.API_URL }} \
      -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
      frontend/
```

### AWS CodeBuild Example:
```yaml
build:
  commands:
    - docker build --build-arg VITE_API_URL=$API_URL -t frontend:latest frontend/
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8070` |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key (existing) | `AIza...` |

## Default Values

- **Local Development**: `http://localhost:8070`
- **Docker Build**: `http://localhost:8080` (if not specified)
- **Kubernetes**: `http://backend-backend-chart:8080`

**Note**: The API URL must be accessible from the client's browser. For production AWS deployments with private backends, use internal URLs or set up proper ingress routing.
