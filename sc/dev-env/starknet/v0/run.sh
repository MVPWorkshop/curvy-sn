#!/bin/sh
set -e


# Env. variables
DOCKER_IMG_NAME="starknet-dev-env-img:latest"
PROJECT_DIR=$1

# ---------------------------------------

# Image build
docker buildx build --platform=linux/amd64 -t ${DOCKER_IMG_NAME} .

# Dev. Env. setup
export "DOCKER_IMG_NAME"=${DOCKER_IMG_NAME} "PROJECT_DIR"=${PROJECT_DIR} && docker compose up