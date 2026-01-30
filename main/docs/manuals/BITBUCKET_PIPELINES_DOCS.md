# 🚀 Bitbucket CI/CD Pipeline Documentation

This document outlines the automated build and deployment pipeline for the **StoreAI** project.

## 1. Overview
StoreAI uses **Bitbucket Pipelines** to ensure that every change pushed to the `main` branch is automatically built and validated. This prevents broken code from being integrated and generates ready-to-deploy artifacts.

## 2. Configuration (`bitbucket-pipelines.yml`)
The pipeline is defined at the root of the project with the following logic:

```yaml
image: node:22

pipelines:
  branches:
    main:
      - step:
          name: Build and Test Full Stack
          caches:
            - node
          script:
            - cd server
            - npm install
            - npx prisma generate
            - npm run build
            - cd ../client
            - npm install
            - npm run build
          artifacts:
            - client/dist/**
            - server/dist/**
```

## 3. Pipeline Stages

### A. Environment Initialization
*   **Base Image**: Uses `node:22`, ensuring a modern environment for the TypeScript build process.
*   **Caching**: Caches `node_modules` to speed up subsequent builds.

### B. Server Build (Backend)
1.  Navigate to `/server`.
2.  Install dependencies using `npm install`.
3.  Execute `npx prisma generate` to create the type-safe client required for the build.
4.  Run `npm run build` to compile TypeScript into JavaScript.

### C. Client Build (Frontend)
1.  Navigate to `/client`.
2.  Install UI dependencies.
3.  Run `npm run build` to generate the production-ready static assets.

## 4. Artifact Generation
Upon successful completion, the pipeline generates and stores the following artifacts for **14 days**:
*   `client/dist/`: The optimized frontend bundle.
*   `server/dist/`: The compiled backend server code.

These artifacts can be downloaded directly from the Bitbucket UI or used by deployment services (like Render or AWS) to launch the application.

## 5. Maintenance
*   To update the Node version, modify the `image` tag on line 1.
*   The pipeline only triggers on the `main` branch; to add feature branch testing, add a `default` pipeline or specific branch filters.
