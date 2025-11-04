#!/bin/bash

set -e

if [ -z "$GITHUB_USERNAME" ]; then
    echo "Error: GITHUB_USERNAME environment variable is not set"
    echo "Usage: export GITHUB_USERNAME='your-github-username' && ./build-and-push.sh"
    exit 1
fi

if [ -z "$PUBLIC_CORE_ADDRESS" ]; then
    echo "Error: PUBLIC_CORE_ADDRESS environment variable is not set"
    exit 1
fi

if [ -z "$PUBLIC_AUTH_ADDRESS" ]; then
    echo "Error: PUBLIC_AUTH_ADDRESS environment variable is not set"
    exit 1
fi

if [ -z "$PUBLIC_MATCHMAKING_ADDRESS" ]; then
    echo "Error: PUBLIC_MATCHMAKING_ADDRESS environment variable is not set"
    exit 1
fi

REGISTRY="ghcr.io"
IMAGE_PREFIX="${REGISTRY}/${GITHUB_USERNAME}/chess-game"
TAG="${1:-latest}"

echo "========================================="
echo "Building and pushing Docker images"
echo "Registry: ${REGISTRY}"
echo "Username: ${GITHUB_USERNAME}"
echo "Tag: ${TAG}"
echo "========================================="
echo ""

cd "$(dirname "$0")/../.."

echo "Building backend common..."
docker build -f apps/backend/common/Dockerfile -t ${IMAGE_PREFIX}-common:${TAG} .

echo ""
echo "Building auth service..."
docker build -f apps/backend/auth/Dockerfile -t ${IMAGE_PREFIX}-auth:${TAG} .

echo ""
echo "Building core service..."
docker build -f apps/backend/core/Dockerfile -t ${IMAGE_PREFIX}-core:${TAG} .

echo ""
echo "Building matchmaking service..."
docker build -f apps/backend/matchmaking/Dockerfile -t ${IMAGE_PREFIX}-matchmaking:${TAG} .

echo ""
echo "Building migrations..."
docker build -f apps/backend/Dockerfile.migrations -t ${IMAGE_PREFIX}-migrations:${TAG} .

echo ""
echo "Building frontend..."
docker build -f apps/frontend/Dockerfile -t ${IMAGE_PREFIX}-frontend:${TAG} . \
          --build-arg NEXT_PUBLIC_CORE_ADDRESS=${PUBLIC_CORE_ADDRESS} \
          --build-arg NEXT_PUBLIC_AUTH_ADDRESS=${PUBLIC_AUTH_ADDRESS} \
          --build-arg NEXT_PUBLIC_MATCHMAKING_ADDRESS=${PUBLIC_MATCHMAKING_ADDRESS}

echo ""
echo "========================================="
echo "Pushing images to registry..."
echo "========================================="
echo ""

docker push ${IMAGE_PREFIX}-auth:${TAG}
docker push ${IMAGE_PREFIX}-core:${TAG}
docker push ${IMAGE_PREFIX}-matchmaking:${TAG}
docker push ${IMAGE_PREFIX}-migrations:${TAG}
docker push ${IMAGE_PREFIX}-frontend:${TAG}

echo ""
echo "========================================="
echo "✓ All images built and pushed successfully!"
echo "========================================="
echo ""
echo "Images:"
echo "  - ${IMAGE_PREFIX}-auth:${TAG}"
echo "  - ${IMAGE_PREFIX}-core:${TAG}"
echo "  - ${IMAGE_PREFIX}-matchmaking:${TAG}"
echo "  - ${IMAGE_PREFIX}-migrations:${TAG}"
echo "  - ${IMAGE_PREFIX}-frontend:${TAG}"
echo ""
echo "Next steps:"
echo "  1. Update k8s/helm/chess-game/values.yaml with your GITHUB_USERNAME"
echo "  2. Deploy: helm install chess-game ./k8s/helm/chess-game -f ./k8s/helm/chess-game/values-dev.yaml"
echo ""
