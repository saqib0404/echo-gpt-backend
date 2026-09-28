# EchoGPT Backend

[Live Health](https://echo-gpt-backend.onrender.com/api/v1/health) <br>
[Swagger documentation](https://echo-gpt-backend.onrender.com/docs)


A production-ready AI conversational backend built with **NestJS**, **PostgreSQL**, **Prisma ORM**, **JWT Authentication**, **Docker**, and **Cloud Deployment**.

EchoGPT provides a complete backend platform for building AI-powered chat applications with:

- User authentication
- Multi-provider AI integration
- Conversation management
- Subscription-based usage limits
- Web search capabilities
- API usage tracking
- Admin monitoring
- Secure provider credential management

The project is designed using a modular architecture following enterprise backend development practices.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Database Design](#database-design)
- [Authentication](#authentication)
- [AI Provider System](#ai-provider-system)
- [Chat System](#chat-system)
- [Web Search System](#web-search-system)
- [Subscription and Usage Management](#subscription-and-usage-management)
- [Admin Features](#admin-features)
- [API Documentation](#api-documentation)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Security Implementation](#security-implementation)
- [Testing](#testing)
- [Future Improvements](#future-improvements)
- [Conclusion](#conclusion)
- [Author](#author)

---

## Overview

EchoGPT Backend is a RESTful API platform that enables developers to build AI-powered applications similar to modern conversational AI systems.

The backend manages:

- User accounts
- Authentication lifecycle
- AI provider configuration
- Chat conversations
- Message history
- Search functionality
- Subscription plans
- Request quotas
- Administrative operations

The system supports multiple AI providers through a unified adapter architecture, allowing administrators to configure providers without changing application code.

---

## Key Features

### Authentication and User Management

Implemented features:

- User registration
- Secure login
- JWT access tokens
- Refresh token rotation
- Logout support
- Password hashing
- Profile management
- Password change
- Account deletion
- Role-based authorization

Authentication flow:

```text
User
 |
 | Login credentials
 |
 v
JWT Authentication
 |
 +----------------+
 |                |
Access Token   Refresh Token
 |
API Access
```

### Multi AI Provider Support

EchoGPT supports multiple AI providers using a provider abstraction layer.

Supported providers:

- OpenAI
- Anthropic Claude
- Google Gemini

Architecture:

```text
            Chat Request
                 |
                 v
        AI Provider Service
                 |
   +-------------+-------------+
   |             |             |
 OpenAI       Gemini        Claude
```

Benefits:

- Easy provider switching
- No code changes required
- Secure API key storage
- Provider health checking

---

## Technology Stack

### Backend

| Technology   | Purpose           |
| ------------ | ----------------- |
| NestJS       | Backend framework |
| TypeScript   | Programming language |
| Prisma ORM   | Database access   |
| PostgreSQL   | Primary database  |
| Passport JWT | Authentication    |
| Swagger      | API documentation |
| Docker       | Containerization  |

### Database

| Technology       | Purpose           |
| ---------------- | ----------------- |
| Neon PostgreSQL  | Hosted database   |
| Prisma Migration | Schema management |

### Deployment

| Technology | Purpose               |
| ---------- | --------------------- |
| Docker     | Application container |
| Render     | Cloud deployment      |
| GitHub     | Source control        |

---

## System Architecture

```text
            Client Application
                    |
                    |
                 REST API
                    |
              NestJS Backend
                    |
     +--------------+---------------+
     |              |               |
Authentication   AI Engine        Search
     |              |               |
     |              |               |
PostgreSQL       Providers     Search Cache
```

---

## Project Structure

```text
echogpt-backend
│
├── prisma
│   ├── schema.prisma
│   └── models
│       ├── user.prisma
│       ├── chat.prisma
│       ├── subscription.prisma
│       ├── ai-provider.prisma
│       ├── web-search.prisma
│       ├── api-usage-log.prisma
│       └── audit-log.prisma
│
├── src
│   ├── config
│   ├── database
│   ├── modules
│   │   ├── auth
│   │   ├── users
│   │   ├── chat
│   │   ├── ai-providers
│   │   ├── subscriptions
│   │   ├── web-search
│   │   └── admin
│   └── main.ts
│
├── Dockerfile
├── docker-compose.yml
├── render.yaml
├── package.json
└── README.md
```

---

## Database Design

EchoGPT uses Prisma ORM with a **separated schema design**.

Instead of maintaining one large schema file, each business domain has its own schema file.

```text
prisma/models/
```

| File                  | Stores                                  |
| --------------------- | --------------------------------------- |
| `user.prisma`         | Users, roles, account information       |
| `chat.prisma`         | Conversations, messages                 |
| `subscription.prisma` | Plans, user subscriptions               |
| `ai-provider.prisma`  | AI providers, encrypted credentials     |
| `web-search.prisma`   | Search history, search cache            |
| `api-usage-log.prisma`| Request tracking, usage analytics       |
| `audit-log.prisma`    | Administrative activities               |

---

## Authentication

EchoGPT uses JWT-based authentication.

Implemented security:

- Password hashing using bcrypt
- Access token authentication
- Refresh token mechanism
- Protected routes
- Role-based authorization

Example request header:

```http
Authorization: Bearer <access_token>
```

---

## AI Provider System

The AI provider system uses a unified adapter architecture that lets administrators:

- Configure OpenAI, Anthropic Claude, and Google Gemini providers
- Store provider API keys securely (encrypted)
- Switch providers without code changes
- Run provider health checks

---

## Chat System

The chat module provides:

- AI conversations
- Message history
- Multiple AI providers
- Usage tracking

Request flow:

```text
User Prompt
     |
Authentication
     |
Subscription Check
     |
AI Provider Selection
     |
AI Response
     |
Store Conversation
     |
Return Response
```

---

## Web Search System

EchoGPT includes an integrated search module.

Features:

- Search execution
- Search history
- Recent searches
- Personalized suggestions
- Result caching

Flow:

```text
Search Request
      |
 Cache Check
      |
 +-----------+-------------+
 |                         |
Cached Result          New Search
 |                         |
 |                  Search Provider
 |                         |
 +-----------+-------------+
      |
 Save History
      |
 Return Result
```

---

## Subscription and Usage Management

The subscription system controls:

- Available plans
- Monthly request limits
- Remaining quota
- Usage tracking

Tracked activities:

- AI chat requests
- Web searches

Example plans:

| Plan    | Limit              |
| ------- | ------------------ |
| Free    | 100 requests/month |
| Premium | 1000 requests/month|

---

## Admin Features

Administrative APIs provide:

### Dashboard

Displays:

- Total users
- Conversations
- Searches
- Providers
- API usage

### User Management

Admins can:

- View users
- Change roles
- Activate/deactivate accounts

### Analytics

Provides:

- API usage statistics
- Request monitoring

### Audit Logs

Tracks:

- Important system actions
- Administrative activities

---

## API Documentation

Swagger documentation is available at:

```text
/docs
```

Example:

```text
http://localhost:3000/docs
```

---

## Environment Setup

Create a `.env` file in the project root.

Example:

```env
NODE_ENV=development

PORT=3000

DATABASE_URL=
DIRECT_DATABASE_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

PROVIDER_ENCRYPTION_KEY=

SEARCH_CACHE_TTL_SECONDS=900
SEARCH_MAX_RESULTS=10
```

---

## Local Development

**1. Install dependencies**

```bash
npm install
```

**2. Generate Prisma Client**

```bash
npx prisma generate
```

**3. Run migrations**

```bash
npx prisma migrate deploy
```

**4. Start development server**

```bash
npm run start:dev
```

Application runs at: <http://localhost:3000>

---

## Docker Deployment

Build the container:

```bash
docker compose build
```

Run:

```bash
docker compose up
```

Application runs at: <http://localhost:3000>

Health check:

```http
GET /api/v1/health
```

Expected response:

```json
{
  "status": "ok"
}
```

---

## Cloud Deployment

Deployment architecture:

```text
GitHub Repository
        |
        v
  Docker Build
        |
        v
  Render Cloud
        |
        v
 NestJS Container
        |
        v
Neon PostgreSQL
```

- **Deployment platform:** Render
- **Database:** Neon PostgreSQL (Free Tier)

---

## Security Implementation

Implemented security practices:

- JWT authentication
- Password hashing
- Environment-based secrets
- Encrypted AI provider credentials
- Role-based authorization
- Request throttling
- Input validation
- Protected admin routes
- Secret exclusion from Docker image

---

## Testing

Verification includes:

**Authentication**

- Register user
- Login
- Refresh token
- Logout

**Chat**

- Send prompt
- Retrieve conversations

**Search**

- Execute search
- Verify caching
- Check history

**Admin**

- Dashboard access
- User management
- Analytics

**Deployment**

- Docker build
- Health check
- Production API testing

---

## Future Improvements

Possible improvements:

- Streaming AI responses
- WebSocket-based live chat
- Background job queue
- Email verification
- Two-factor authentication
- Advanced analytics dashboard
- File upload and document chat
- Vector database integration
- Retrieval-Augmented Generation (RAG)

---

## Conclusion

EchoGPT Backend demonstrates a complete backend architecture for an AI-powered application.

The project combines:

- Modern backend development practices
- Secure authentication
- Multi-provider AI integration
- Subscription management
- Usage analytics
- Container deployment
- Cloud hosting

The architecture is designed to be scalable, maintainable, and ready for future expansion.

---

## Author

**Saqib Ahmad**
Backend Developer

**Technologies:**

- NestJS
- TypeScript
- PostgreSQL
- Prisma
- Docker
- AI Integration