#!/bin/bash

# Install pnpm globally
npm install -g pnpm@8.15.9

# Navigate to app directory
cd app

# Install dependencies
pnpm install

# Build the application
pnpm build