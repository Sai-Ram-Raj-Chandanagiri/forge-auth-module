# Forge Auth Module

A production-grade authentication module with email/password login, registration, and session management. Built for the **FORGE Marketplace**.

## Features

- Email + password authentication
- Bcrypt password hashing (12 rounds)
- PostgreSQL-backed sessions (connect-pg-simple)
- Server-side input validation (express-validator)
- Security headers (Helmet)
- Flash messages for user feedback
- Responsive UI with EJS templates
- Health check endpoint for container orchestration
- Auto-initializes database tables on startup

## Tech Stack

| Layer     | Technology                |
|-----------|---------------------------|
| Runtime   | Node.js 20               |
| Framework | Express 4                 |
| Database  | PostgreSQL 16             |
| Auth      | bcryptjs + express-session|
| Views     | EJS                       |
| Security  | Helmet + express-validator|

## Quick Start (Local)

### Prerequisites

- Node.js 18+
- PostgreSQL running locally

### Setup

```bash
# Install dependencies
npm install

# Create the database
psql -U postgres -c "CREATE DATABASE forge_auth;"

# Copy and edit env file
cp .env.example .env
# Edit .env with your database credentials

# Start the server
npm start
```

Visit `http://localhost:3000`

## Docker

```bash
# Using docker-compose (includes PostgreSQL)
docker-compose up --build

# Or build and run standalone (requires external PostgreSQL)
docker build -t forge-auth-module .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://postgres:password@host.docker.internal:5432/forge_auth \
  -e SESSION_SECRET=your-secret \
  forge-auth-module
```

## API Endpoints

| Method | Path        | Description         | Auth     |
|--------|-------------|---------------------|----------|
| GET    | `/`         | Redirect to login   | Public   |
| GET    | `/login`    | Login page          | Guest    |
| POST   | `/login`    | Process login       | Guest    |
| GET    | `/register` | Registration page   | Guest    |
| POST   | `/register` | Process registration| Guest    |
| GET    | `/dashboard`| User dashboard      | Required |
| POST   | `/logout`   | End session         | Required |
| GET    | `/health`   | Health check        | Public   |

## Environment Variables

| Variable         | Required | Default     | Description              |
|------------------|----------|-------------|--------------------------|
| `DATABASE_URL`   | Yes      | —           | PostgreSQL connection URL |
| `SESSION_SECRET` | Yes      | —           | Session encryption key   |
| `PORT`           | No       | `3000`      | Server port              |
| `NODE_ENV`       | No       | `development`| Environment mode        |

## Security

- Passwords hashed with bcrypt (12 salt rounds)
- Sessions stored server-side in PostgreSQL (not in cookies)
- HTTP-only, SameSite cookies
- Helmet security headers enabled
- Input sanitization and validation on all form inputs
- CSRF protection via SameSite cookie policy

## License

MIT
