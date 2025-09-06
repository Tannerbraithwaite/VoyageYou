# VoyageYou Frontend

A React Native/Expo app for travel planning and recommendations.

## Project Structure

```
frontend/
├── app/                    # Expo Router file-based routing
│   ├── (tabs)/           # Tab navigation screens
│   ├── auth/             # Authentication screens
│   ├── _layout.tsx       # Root layout
│   └── index.tsx         # Home screen
├── components/            # Reusable UI components
│   ├── ui/               # Platform-specific UI components
│   └── index.ts          # Component exports
├── constants/             # App constants and configuration
│   ├── Colors.ts         # Color definitions
│   └── index.ts          # Constants exports
├── hooks/                 # Custom React hooks
│   ├── useColorScheme.ts
│   ├── useThemeColor.ts
│   └── index.ts          # Hook exports
├── services/              # API and external service integrations
│   └── index.ts          # Service layer
├── types/                 # TypeScript type definitions
│   └── index.ts          # Type exports
├── utils/                 # Utility functions
│   └── index.ts          # Utility exports
├── assets/                # Static assets
│   ├── images/           # Image assets
│   └── fonts/            # Font files
└── scripts/              # Build and utility scripts
```

## Key Features

- **Expo Router**: Modern file-based routing
- **TypeScript**: Full type safety
- **Component Organization**: Clean separation with index files for easy imports
- **Service Layer**: Centralized API calls and external integrations
- **Utility Functions**: Reusable helper functions
- **Type Definitions**: Centralized TypeScript interfaces

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on specific platforms:
   ```bash
   npm run ios
   npm run android
   npm run web
   ```

## Import Patterns

With the new structure, you can import components and utilities more cleanly:

```typescript
// Import components
import { TravelChatbot, ThemedText } from '@/components';

// Import hooks
import { useColorScheme, useThemeColor } from '@/hooks';

// Import utilities
import { formatPrice, debounce } from '@/utils';

// Import services
import { TravelService, ChatService } from '@/services';

// Import types
import { TravelDestination, User } from '@/types';
```

## Environment Variables

Create a `.env` file in the frontend directory:

```
EXPO_PUBLIC_API_URL=http://localhost:8000
```

## Development

- **Linting**: `npm run lint`
- **Reset Project**: `npm run reset-project`
