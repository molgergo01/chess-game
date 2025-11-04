#!/bin/bash

set -e

ENVIRONMENT="${1:-dev}"
RELEASE_NAME="chess-game"
NAMESPACE="chess-game-${ENVIRONMENT}"
CHART_PATH="./k8s/helm/chess-game"

if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ]; then
    echo "Error: Invalid environment '${ENVIRONMENT}'"
    echo "Usage: ./deploy.sh [dev|prod]"
    exit 1
fi

echo "========================================="
echo "Deploying Chess Game"
echo "Environment: ${ENVIRONMENT}"
echo "Release: ${RELEASE_NAME}"
echo "Namespace: ${NAMESPACE}"
echo "========================================="
echo ""

cd "$(dirname "$0")/../.."

if ! command -v helm &> /dev/null; then
    echo "Error: Helm is not installed"
    echo "Install Helm: https://helm.sh/docs/intro/install/"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed"
    echo "Install kubectl: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

echo "Checking Kubernetes connection..."
if ! kubectl cluster-info &> /dev/null; then
    echo "Error: Cannot connect to Kubernetes cluster"
    echo "Please configure kubectl to connect to your cluster"
    exit 1
fi

echo "✓ Kubernetes cluster connected"
echo ""

VALUES_FILE="${CHART_PATH}/values-${ENVIRONMENT}.yaml"

if [ ! -f "$VALUES_FILE" ]; then
    echo "Error: Values file not found: ${VALUES_FILE}"
    exit 1
fi

kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

echo ""
echo "Deploying with Helm..."
echo ""

if [ "$ENVIRONMENT" = "prod" ]; then
    echo "WARNING: Deploying to PRODUCTION environment!"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Deployment cancelled"
        exit 0
    fi
    echo ""

    if [ -z "$JWT_SECRET" ] || [ -z "$DB_PASSWORD" ]; then
        echo "Error: Production secrets not set"
        echo "Please set environment variables:"
        echo "  export JWT_SECRET='your-jwt-secret'"
        echo "  export DB_PASSWORD='your-db-password'"
        echo "  export GOOGLE_CLIENT_ID='your-google-client-id'"
        echo "  export GOOGLE_CLIENT_SECRET='your-google-client-secret'"
        exit 1
    fi

    helm upgrade --install ${RELEASE_NAME} ${CHART_PATH} \
        -f ${VALUES_FILE} \
        --namespace ${NAMESPACE} \
        --set secrets.jwtSecret="${JWT_SECRET}" \
        --set secrets.postgresPassword="${DB_PASSWORD}" \
        --set secrets.googleClientId="${GOOGLE_CLIENT_ID:-}" \
        --set secrets.googleClientSecret="${GOOGLE_CLIENT_SECRET:-}" \
        --wait \
        --timeout 10m
else
    helm upgrade --install ${RELEASE_NAME} ${CHART_PATH} \
        -f ${VALUES_FILE} \
        --namespace ${NAMESPACE} \
        --wait \
        --timeout 10m
fi

echo ""
echo "========================================="
echo "✓ Deployment successful!"
echo "========================================="
echo ""

echo "Checking deployment status..."
kubectl get pods -n ${NAMESPACE}

echo ""
echo "To view logs:"
echo "  kubectl logs -n ${NAMESPACE} -l app.kubernetes.io/component=core -f"
echo ""
echo "To access the application:"
if [ "$ENVIRONMENT" = "dev" ]; then
    echo "  kubectl port-forward -n ${NAMESPACE} service/${RELEASE_NAME}-frontend 3000:3000"
    echo "  Visit: http://localhost:3000"
else
    echo "  The application should be accessible via your configured ingress domain"
fi
echo ""
