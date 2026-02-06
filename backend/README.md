# Real-Time Sport Engine Backend

A high-performance Node.js/TypeScript backend for real-time sports data management, featuring live match tracking, commentary streaming, and WebSocket-based updates.

## Author

**Kayode Odole**  
[GitHub](https://github.com/kayconfig)

## Overview

Real-Time Sport Engine is a backend service designed to handle live sports data, including match management, real-time score updates, and live commentary streaming. Built with modern technologies for scalability and performance.

## Features

- **RESTful API** for match management and commentary
- **Real-time WebSocket** connections for live updates
- **Drizzle ORM** for type-safe database operations
- **ArcJet** security integration
- **Pagination support** for efficient data retrieval
- **Timeout handling** for robust query management
- **Environment-based configuration**

## Tech Stack

- **Runtime:** Bun
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with Drizzle ORM
- **WebSocket:** ws
- **Validation:** Zod
- **Logging:** Pino
- **Security:** ArcJet, Helmet, CORS

## Project Structure

```
backend/
├── drizzle/
│   ├── meta/                 # Migration metadata
│   └── *.sql                 # Migration files
├── src/
│   ├── commentary/           # Commentary module
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── handler.ts        # WebSocket handler
│   │   ├── index.ts          # Module entry
│   │   ├── repository.ts     # Data access layer
│   │   ├── router.ts         # API routes
│   │   └── service.ts        # Business logic
│   ├── common/               # Shared utilities
│   │   ├── dtos/             # Common DTOs
│   │   ├── errors/           # Custom error classes
│   │   ├── http/             # HTTP utilities
│   │   ├── queries/          # Query helpers
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Utility functions
│   ├── config/               # Configuration
│   │   └── env.ts            # Environment variables
│   ├── db/                   # Database layer
│   │   ├── drizzle.ts        # Drizzle instance
│   │   └── schema.ts          # Database schema
│   ├── matches/              # Match management
│   │   ├── dtos/             # DTOs
│   │   ├── utils/            # Utilities
│   │   ├── controller.ts     # Request handlers
│   │   ├── index.ts          # Module entry
│   │   ├── repository.ts     # Data access layer
│   │   ├── routes.ts         # API routes
│   │   └── service.ts        # Business logic
│   ├── ws/                   # WebSocket layer
│   │   ├── event-types.ts    # Event type definitions
│   │   └── server.ts         # WebSocket server
│   ├── app.ts                # Express app setup
│   └── server.ts             # Server entry point
├── .env.example              # Environment template
├── .gitignore
├── arcjet.ts                 # ArcJet configuration
├── drizzle.config.ts         # Drizzle configuration
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Bun (v1.3.6+)
- Node.js (TypeScript support)
- PostgreSQL database

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
bun install
```

### Environment Setup

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Required environment variables:

```
DATABASE_URL=postgresql://user:password@localhost:5432/sport_engine
PORT=3000
NODE_ENV=development
```

### Database Setup

```bash
# Generate database migrations
bun db:generate

# Run migrations
bun db:migrate

# Open Drizzle Studio (optional)
bun db:studio
```

### Running the Server

```bash
# Development mode with hot reload
bun dev

# Production build
bun run src/server.ts
```

## API Documentation

### Matches API

| Method | Endpoint                | Description                     |
| ------ | ----------------------- | ------------------------------- |
| GET    | `/v1/matches`           | Get all matches with pagination |
| GET    | `/v1/matches/:id`       | Get a specific match            |
| POST   | `/v1/matches`           | Create a new match              |
| PATCH  | `/v1/matches/:id/score` | Update match score              |

### Commentary API

| Method | Endpoint                          | Description                                    |
| ------ | --------------------------------- | ---------------------------------------------- |
| GET    | `/v1/matches/:matchId/commentary` | Get all commentary for a match with pagination |
| POST   | `/v1/matches/:matchId/commentary` | Create commentary for a match                  |

### Query Parameters

For paginated endpoints:

```typescript
{
  page: number; // Page number (default: 1)
  limit: number; // Items per page (default: 10)
}
```

## WebSocket Events

Connect to the WebSocket server for real-time updates.

### Event Types

```typescript
// Connection
'connection': Client connects

// Match Events
'match_created': New match created
'match_score_updated': Match score changed ⏳
'match_status_changed': Match status changed (e.g., LIVE, FINISHED) ⏳

// Commentary Events
'commentary_created': New commentary added
```

### Client Usage Example

```typescript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('message', (data) => {
  const event = JSON.parse(data.toString());
  console.log('Received:', event.type, event.payload);
});

// Send subscription
ws.send(
  JSON.stringify({
    type: 'subscribe',
    matchId: 'match-123',
  })
);
```

## Database Schema

### Matches Table

```sql
- id: int
- homeTeam: string
- awayTeam: string
- homeScore: number
- awayScore: number
- status: enum (SCHEDULED, LIVE, HALFTIME, FINISHED)
- startTime: timestamp
- createdAt: timestamp
- updatedAt: timestamp
```

### Commentary Table

```sql
- id: int
- matchId: int (FK)
- content: text
- minute: number
- type: enum (GOAL, CARD, SUBSTITUTION, INFO, etc.)
- createdAt: timestamp
```

## Scripts

| Script            | Description                              |
| ----------------- | ---------------------------------------- |
| `bun dev`         | Start development server with hot reload |
| `bun db:generate` | Generate new migrations                  |
| `bun db:migrate`  | Run database migrations                  |
| `bun db:studio`   | Open Drizzle ORM Studio                  |

## Error Handling

The application uses a centralized error handling system:

- `ErrQueryTimeout` - Query timeout errors
- `ServerError` - General server errors

All errors return standardized responses:

```typescript
{
  error: {
    code: string;
    message: string;
    details?: unknown;
  }
}
```

## Middleware

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Pino HTTP** - Request logging
- **ArcJet** - Security inspection

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
