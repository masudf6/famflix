# FamFlix

FamFlix is a private family media streaming platform built as a full-stack DevOps project.

The application allows family members to log in, browse uploaded media, stream files, and download media. Admin users can upload media through a secure S3 presigned URL flow. The system is containerized with Docker, deployed to Kubernetes using k3s on EC2, and automated through GitHub Actions and Amazon ECR.

---

## Project Goals

The main goal of this project is to build a realistic cloud-native application while learning and applying DevOps practices.

This project demonstrates:

- Full-stack application development
- Authentication and protected routes
- Secure media upload using S3 presigned URLs
- Docker-based containerization
- Kubernetes deployments and services
- Ingress-based routing
- CI/CD automation from GitHub to Kubernetes
- Deployment to a self-managed EC2 + k3s environment

---

## Tech Stack

### Frontend

- React
- Vite
- TypeScript
- Material UI
- Axios
- React Router

### Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT authentication
- Boto3 for S3 integration

### Infrastructure and DevOps

- Docker
- Docker Compose
- Kubernetes
- k3s
- Traefik Ingress
- Amazon EC2
- Amazon ECR
- Amazon S3
- GitHub Actions
- GitHub self-hosted runner

---

## High-Level Architecture

```text
                Developer Machine
                VS Code / Git
                       |
                       | git push
                       v
                  GitHub Repository
                       |
                       | GitHub Actions
                       v
              Build Docker Images
                       |
                       | push images
                       v
                  Amazon ECR
                       |
                       | pull images
                       v
          EC2 Instance running k3s
                       |
                       v
              Kubernetes Cluster
                       |
        --------------------------------
        |                              |
        v                              v
   Frontend Pod                  Backend Pod
   React/Vite                    FastAPI
        |                              |
        | /api requests                |
        v                              v
      Ingress  ----------------> Backend Service
                                       |
                                       v
                               PostgreSQL Service
                                       |
                                       v
                                PostgreSQL Pod
                                       |
                                       v
                              Persistent Volume

 Backend also communicates with:

        Backend Pod
            |
            | presigned upload/download/stream URLs
            v
        Amazon S3 Private Bucket
```
