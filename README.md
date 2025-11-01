# Expressify Frontend

A Next.js 16 Progressive Web App (PWA) for AI-powered communication training, designed to help introverts build confidence through interactive learning experiences.

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Firebase Auth (Google OAuth, Email/Password)
- **Database**: Firebase Realtime Database
- **Animations**: Framer Motion, GSAP
- **State Management**: React Context API
- **Icons**: Lucide React

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── landing/             # Landing page
│   │   ├── start/               # Authentication (sign in/up)
│   │   ├── me/                  # User dashboard section
│   │   │   ├── home/           # User home dashboard
│   │   │   ├── learning-path/  # Progress tracking & learning paths
│   │   │   └── history/        # Activity history
│   │   ├── learning/           # Main training sections
│   │   │   ├── textual/        # Text-based training modules
│   │   │   ├── vocal/          # Voice-based training modules
│   │   │   └── visual/         # Visual communication training
│   │   ├── training/           # Additional training features
│   │   │   ├── ai-calling/     # AI phone conversation practice
│   │   │   └── social/         # Multiplayer features
│   │   │       └── collaborate/
│   │   │           └── [gameCode]/  # Real-time collaborative games
│   │   └── clarity-cafe/       # FAQ & Help Center
│   ├── components/             # Reusable React components
│   │   ├── ui/                # shadcn/ui components
│   │   │   ├── expressify-sidebar.tsx  # Main navigation sidebar
│   │   │   ├── training-bento.tsx      # Training cards grid
│   │   │   └── learning-header.tsx     # Page headers
│   │   ├── games/             # Game components
│   │   └── ProtectedRoute.tsx # Auth guard wrapper
│   ├── contexts/              # React contexts
│   │   └── AuthContext.tsx   # Firebase auth state
│   ├── hooks/                 # Custom React hooks
│   │   ├── useCollaboration.ts  # Real-time game sessions
│   │   └── use-mobile.ts       # Responsive utilities
│   └── lib/                   # Utilities & services
│       ├── firebase.ts        # Firebase configuration
│       ├── wikipediaService.ts # Wikipedia API integration
│       └── utils.ts           # Helper functions
```

## 🎯 Key Features

### Three-Track Learning System
1. **Textual Practice** (`/learning/textual`)
   - Chat Simulator, Debate Master, Story Builder
   - Grammar Challenge, Vocabulary Quest, Word Puzzles

2. **Vocal Practice** (`/learning/vocal`)
   - Pronunciation Lab, Accent Coach, Tone Trainer
   - Pitch Perfect, Speed Speaking, Vocal Variety

3. **Visual Practice** (`/learning/visual`)
   - Body Language Lab, Gesture Guide
   - Presentation Posture, Eye Contact

### User Dashboard (`/me`)
- **Home**: Daily stats, recent activities, quick actions
- **Learning Path**: Progress tracking with 4 structured learning paths
  - Foundation Builder (Beginner)
  - Confidence Developer (Intermediate)
  - Presence Master (Advanced)
  - Social Strategist (Expert)
- **History**: Activity logs and performance analytics

### Help & Support
- **Clarity Cafe** (`/clarity-cafe`): FAQ page with searchable help topics
  - Category filters (Getting Started, Training, AI Features, etc.)
  - Expandable FAQ items
  - Contact support options

### Real-Time Collaboration
- **Sentence Builder Game** (`/training/social/collaborate/[gameCode]`)
  - Real-time multiplayer word placement
  - Live cursor tracking across players
  - Firebase-synced game state
  - Timer system with automatic game end
  - Results page with podium rankings
  - Chat functionality
  - Inactivity penalties

### AI Features
- **AI Calling** (`/training/ai-calling`)
  - Phone-based conversation practice
  - Real-time speech recognition
  - AI-powered feedback

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ installed
- Firebase project configured
- Environment variables set up

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
```

## 🎨 Design System

### Components
- Built with **shadcn/ui** for consistent, accessible design
- Custom animations using **Framer Motion** and **GSAP**
- Responsive design with mobile-first approach
- Dark/light mode support via **next-themes**

### Navigation
- **ExpressifySidebar**: Collapsible sidebar with tree navigation
- Hover-to-expand dropdown menus (2.5s auto-close)
- Search functionality to filter training modules
- Tooltips in collapsed mode

### Layout Patterns
```tsx
<ProtectedRoute>
  <SidebarProvider>
    <ExpressifySidebar />
    <SidebarInset>
      <LearningHeader trainingType="textual" />
      <TrainingBento cards={trainingData} />
    </SidebarInset>
  </SidebarProvider>
</ProtectedRoute>
```

## 🔥 Firebase Integration

### Authentication
- Google OAuth sign-in
- Email/password authentication
- Protected routes with `ProtectedRoute` wrapper

### Realtime Database Structure
```
gameSessions/
  {gameId}/
    ├── timer/              # Authoritative game timer
    ├── gameState/          # Current sentence & progress
    ├── playerScores/       # Individual player scores
    ├── cursors/            # Real-time cursor positions
    └── status/             # Game status (waiting/playing/finished)

gameChats/
  {gameId}/                 # Chat messages for game session
```

## 📱 PWA Features
- Installable on mobile devices
- Offline-ready with service workers
- Responsive design for all screen sizes
- Touch-optimized interactions

## 🚢 Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start

# Build and export static files
npm run build && npm run export
```

## 🧪 Development Commands

```bash
# Run development server with Turbopack
npm run dev

# Type checking
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

## 📄 Key Files to Know

- **`src/app/layout.tsx`**: Root layout with AuthProvider
- **`src/contexts/AuthContext.tsx`**: Firebase auth state management
- **`src/components/ui/expressify-sidebar.tsx`**: Main navigation component
- **`src/hooks/useCollaboration.ts`**: Real-time game session hooks
- **`src/lib/firebase.ts`**: Firebase configuration & initialization

## 🎯 Routing Convention

- `/landing` - Public landing page
- `/start/signin` - Sign in page
- `/start/signup` - Sign up page
- `/me/*` - User dashboard (protected)
- `/learning/{type}` - Training tracks (protected)
- `/training/*` - Additional training features (protected)
- `/clarity-cafe` - Help & FAQ (protected)

## 🤝 Contributing

1. Create feature branches from `main`
2. Follow TypeScript strict mode
3. Use shadcn/ui components for consistency
4. Test authentication flows
5. Verify real-time Firebase synchronization

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
