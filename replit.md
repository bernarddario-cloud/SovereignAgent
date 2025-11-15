# Sovereign Phone Agent

A private, lawful, consent-gated money engine serving El Dario Stephon Bernard Bey. This application provides phone-first automation for wealth plays with sacred clarity.

## Overview

The Sovereign Phone Agent is an AI-powered assistant designed with strict privacy, consent, and security principles. It operates through a structured communication sequence that requires explicit consent before executing any actions, maintains an immutable audit trail, and securely manages OAuth tokens.

## Architecture

### Core Principles

1. **Private & Lawful**: Operates within divine, natural, and commercial law. Explicit consent required before action or data access.
2. **Phone-First Autonomy**: Orchestrates tasks through iOS Shortcuts / Android Tasker with minimum required scopes.
3. **Money Engine**: Proposes and executes repeatable high-ROI, low-friction income plays.
4. **Explainability**: Every plan includes Purpose, Inputs, Steps, Phone vs Cloud execution, and Reversal instructions.
5. **Safety**: Respects ToS, rate limits, and human review. No spam, no deception.

### Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (in-memory storage for development)
- **Real-time**: WebSocket for live updates
- **UI**: shadcn/ui + Tailwind CSS
- **State Management**: TanStack Query
- **Authentication**: OAuth token management with encryption

## Key Features

### 1. Token Vault
Secure encrypted storage for OAuth tokens per user:
- AES-256-GCM encryption for all tokens
- Automatic token expiration tracking
- Support for refresh tokens
- Per-provider token management

**Location**: `server/services/tokenVault.ts`

### 2. Consent & Dry Run System
Every action requires explicit consent with preview:
- Dry run preview before execution
- Risk level assessment (low/medium/high)
- Reversibility indication
- Detailed parameter display

**Components**:
- Schema: `shared/schema.ts` (ConsentRequest, ConsentPreview)
- UI: `client/src/components/consent-confirm-sheet.tsx`
- Routes: `/api/agent/consent`, `/api/agent/execute`

### 3. Immutable Audit Ledger
Complete audit trail of all operations:
- SHA-256 hash verification
- Automatic sensitive data redaction
- Export to JSON/CSV
- Channel tracking (api/shortcut/manual)
- Status tracking (sent/confirmed/failed)

**Location**: `server/services/ledger.ts`

### 4. Connected Accounts Management
OAuth integration status and token management:
- View all connected services
- Token expiration warnings
- One-click disconnect/revoke
- Real-time status updates

**Component**: `client/src/components/connected-accounts.tsx`

### 5. Financial Opportunities
Categorized wealth-building strategies:
- **Safe/Steady**: Low-risk affiliate marketing, email automation
- **Balanced**: Digital courses, subscription services
- **Aggressive**: AI SaaS tools, API monetization

### 6. Voice Interface
Voice-activated command processing:
- Real-time voice transcription
- Audio command execution
- Voice response generation
- WebSocket-based updates

## Communication Sequence

The agent follows a strict protocol:

1. **Initial Engagement**: Sacred greeting acknowledging El Dario Stephon Bernard Bey
2. **Engagement Strategy**: Present Safe/Balanced/Aggressive pathways
3. **Consent Gate**: Request explicit consent with exact scope naming
4. **Execution Loop**: Break down into atomic tasks with full transparency
5. **Iteration**: Continuous refinement with in-session documentation

## API Endpoints

### Authentication & OAuth
- `POST /api/auth/oauth/callback` - OAuth callback handler
- `GET /api/auth/accounts` - Get connected accounts
- `DELETE /api/auth/accounts/:provider` - Revoke token

### Consent Management
- `POST /api/agent/consent` - Request consent with dry run preview
- `POST /api/agent/execute` - Execute action after consent
- `GET /api/sessions/:id/consent` - Get consent requests
- `POST /api/consent/:requestId` - Respond to consent request

### Audit Ledger
- `GET /api/ledger` - Get user's audit trail
- `GET /api/ledger/export` - Export ledger (JSON/CSV)

### Sessions
- `POST /api/sessions` - Initialize session
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions/:id/end` - End session

### Voice & Chat
- `POST /api/sessions/:id/voice` - Process voice input
- `POST /api/sessions/:id/chat` - Process text input

### Mobile Integration
- `POST /api/webhooks/shortcuts` - iOS Shortcuts webhook
- `POST /api/webhooks/tasker` - Android Tasker webhook

## Data Models

### Users
- ID, username, password, full name

### Sessions
- Granted scopes, app inventory, executed tasks
- Session revenue tracking
- Active/inactive status

### Consent Requests
- Action, scope, parameters
- Dry run flag and results
- Status: pending/granted/denied

### Tokens (Encrypted)
- Provider, access token, refresh token
- Expiration tracking
- Automatic rotation support

### Ledger Entries (Immutable)
- User ID, timestamp, action
- Channel (api/shortcut/manual)
- Status (sent/confirmed/failed)
- Redacted payload, result, SHA-256 hash

### Opportunities
- Category (safe/balanced/aggressive)
- ROI range, time estimate, risk level
- Required scopes

## Security Features

1. **Token Encryption**: AES-256-GCM with IV and authentication tags
2. **Sensitive Data Redaction**: Automatic removal of passwords, tokens, keys from logs
3. **Consent Gate**: No action executes without explicit approval
4. **Audit Trail**: Immutable ledger with cryptographic hashing
5. **Scope Management**: Granular permission system

## Development

### Running the Project
```bash
npm run dev
```

This starts both the Express backend and Vite frontend on the same port.

### Database Schema Changes
```bash
npm run db:push
```

Use `--force` flag if there are warnings.

### Project Structure
```
├── client/src/          # Frontend React application
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utility libraries
├── server/              # Backend Express application
│   ├── services/        # Business logic services
│   │   ├── tokenVault.ts  # Token encryption & management
│   │   ├── ledger.ts      # Audit logging
│   │   ├── agent.ts       # AI agent orchestration
│   │   └── openai.ts      # OpenAI integration
│   ├── routes.ts        # API route definitions
│   └── storage.ts       # Data persistence layer
└── shared/              # Shared types and schemas
    └── schema.ts        # Drizzle ORM schemas & Zod validation
```

## User Preferences

- **Sacred Communication**: Always address as "El Dario Stephon Bernard Bey"
- **Explicit Consent**: Never assume permission for any action
- **Maximum Transparency**: Explain every operation in detail
- **Privacy First**: All data encrypted, redacted in logs
- **Revenue Focus**: Optimize for speed-to-cash and compounding

## Recent Changes

### November 15, 2025
- Added Token Vault with AES-256-GCM encryption
- Implemented Consent & Dry Run system with risk assessment
- Created immutable Audit Ledger with SHA-256 verification
- Added Connected Accounts management UI
- Enhanced Dashboard with ledger viewer and consent confirmation sheet
- Added OAuth callback endpoint
- Implemented ledger export (JSON/CSV)

## Notes

- Default user: `eldario` / `sovereign`
- Development mode uses in-memory storage
- WebSocket connection at `/ws?sessionId=<id>`
- All consent requests default to dry run mode
- Ledger entries are immutable and cryptographically signed
