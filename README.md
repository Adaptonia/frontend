# Adaptonia Finance - Discord-like Groups & Channels

A highly optimized, accessible, and modern real-time chat application built with Next.js, TypeScript, and Appwrite. Features Discord-like channels, real-time messaging, contact integration, PWA capabilities, and comprehensive performance optimizations.

## 🚀 Features

### Core Features
- **Real-time Messaging**: Instant messaging with Appwrite Realtime subscriptions
- **Channel Management**: Create, join, and leave channels with admin controls
- **User Authentication**: Secure authentication with role-based permissions
- **Typing Indicators**: Live typing status with smart timeout management
- **Online Status**: Real-time online/offline status tracking
- **Message Reactions**: Emoji reactions on messages with optimistic updates
- **Message Replies**: Quote and reply to messages with threaded conversations
- **Message Search**: Debounced search with highlighting and filters
- **File Uploads**: Drag & drop file uploads with automatic compression
- **Markdown Support**: Rich text formatting with live preview

### Performance Optimizations ⚡
- **React.memo Components**: Optimized message rendering with smart memoization
- **Virtual Scrolling**: Handles thousands of messages efficiently
- **Debounced Search**: 300ms debouncing for search and typing indicators
- **Lazy Loading**: Progressive image loading and component mounting
- **Image Compression**: Automatic image optimization before upload
- **Adaptive Quality**: Adjusts animations based on device performance
- **Resource Preloading**: Smart preloading of fonts and critical images
- **Memory Management**: Automatic cleanup and garbage collection

### Accessibility Features ♿
- **Screen Reader Support**: Comprehensive ARIA labels and live regions
- **Keyboard Navigation**: Full keyboard support with logical tab order
- **Focus Management**: Proper focus trapping in modals and dialogs
- **High Contrast**: Support for high contrast and reduced motion
- **Screen Reader Announcements**: Live updates for new messages and actions
- **Semantic HTML**: Proper heading structure and landmarks
- **Color Accessibility**: WCAG 2.1 AA compliant color schemes

### Advanced Features
- **Toast Notifications**: Rich notifications with retry actions
- **Error Boundaries**: Graceful error handling with recovery options
- **Dark/Light Theme**: System preference detection with manual toggle
- **Keyboard Shortcuts**: Productivity shortcuts (Cmd+K, Cmd+Shift+N, etc.)
- **PWA Support**: Installable with offline capabilities
- **Cross-tab Sync**: Typing status and online presence across browser tabs
- **Network Adaptation**: Quality adjustments based on connection speed
- **Performance Monitoring**: Real-time FPS and memory usage tracking

### UI/UX Features
- **Micro-animations**: Subtle animations that enhance user experience
- **Responsive Design**: Mobile-first design with touch-friendly interactions
- **Loading States**: Professional skeleton loaders for all async operations
- **Empty States**: Helpful empty states with actionable guidance
- **Smooth Transitions**: Framer Motion animations with performance considerations
- **Mobile Optimizations**: Touch gestures and mobile-specific interactions

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **Animation**: Framer Motion with performance optimizations
- **Icons**: Lucide React
- **Backend**: Appwrite (Database, Authentication, Realtime)
- **State Management**: Custom React hooks with optimistic updates
- **Performance**: React.memo, virtual scrolling, lazy loading
- **Accessibility**: ARIA compliance, screen reader support
- **PWA**: Service Worker, Web App Manifest

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Appwrite instance (cloud or self-hosted)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd adaptonia-frontend
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id

# Collection IDs
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
NEXT_PUBLIC_APPWRITE_CHANNELS_COLLECTION_ID=channels
NEXT_PUBLIC_APPWRITE_CHANNEL_MEMBERS_COLLECTION_ID=channel-members
NEXT_PUBLIC_APPWRITE_CHANNEL_MESSAGES_COLLECTION_ID=channel-messages
```

### 4. Run the Application
```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000/groups` to see the application.

## ⌨️ Keyboard Shortcuts

- **Cmd/Ctrl + K**: Open search
- **Cmd/Ctrl + Shift + N**: Create new channel (admin only)
- **Cmd/Ctrl + Shift + T**: Toggle theme
- **Escape**: Close modals/search
- **Enter**: Send message
- **Tab/Shift+Tab**: Navigate between elements

## 🎯 Usage Guide

### Navigation
- **Sidebar**: Switch between chats and channels
- **Theme Toggle**: Click the moon/sun icon for dark/light mode
- **Search**: Use Cmd+K or click search icon for global search

### Channel Management
1. **Create Channel**: Click "+" icon or use Cmd+Shift+N (admin only)
2. **Join Channel**: Click on public channels in the suggestions
3. **Manage Members**: Click users icon in channel header

### Messaging
- **Send Message**: Type in input field and press Enter
- **Reply**: Hover over message and click reply icon
- **React**: Hover over message and click emoji icon
- **Search**: Use search overlay to find specific messages
- **Upload Files**: Drag & drop files or click "+" icon

### Performance Features
- **Adaptive Quality**: App automatically adjusts based on device performance
- **Virtual Scrolling**: Handles large message lists efficiently
- **Lazy Loading**: Images load as they come into view
- **Smart Caching**: Frequently accessed data is cached for speed

## 🎨 Customization

### Themes
The app supports both light and dark themes with system preference detection:

```css
/* Light theme variables */
:root {
  --color-primary: #3b82f6;
  --color-background: #ffffff;
  --color-text: #1f2937;
}

/* Dark theme variables */
.dark {
  --color-primary: #60a5fa;
  --color-background: #1f2937;
  --color-text: #f9fafb;
}
```

### Performance Settings
Adjust performance settings in `hooks/usePerformance.ts`:

```typescript
// Quality thresholds
const QUALITY_THRESHOLDS = {
  LOW_FPS: 20,
  MEDIUM_FPS: 40,
  HIGH_FPS: 60
}
```

### Accessibility
Configure accessibility features in `hooks/useUtils.ts`:

```typescript
// Screen reader settings
const SCREEN_READER_DELAY = 1000
const FOCUS_TRAP_ELEMENTS = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
```

## 📱 PWA Features

### Installation
The app can be installed as a PWA on:
- Mobile devices (iOS Safari, Android Chrome)
- Desktop browsers (Chrome, Edge, Firefox)

### Offline Support
- Cached static assets for offline viewing
- Service worker for background updates
- Offline message queue with sync when online

### Performance Monitoring
Built-in performance monitoring tracks:
- FPS (frames per second)
- Memory usage
- Render times
- Network quality

## 🔧 Performance Optimizations

### React Optimizations
```typescript
// Memoized components
const OptimizedMessage = memo(MessageComponent, (prev, next) => {
  return prev.message.$id === next.message.$id && 
         prev.isHovered === next.isHovered
})

// Virtual scrolling for large lists
const { visibleItems, offsetY } = useVirtualScroll(messages, 60, 400)
```

### Image Optimizations
```typescript
// Automatic image compression
const compressedFile = await compressImage(file, 800, 0.8)

// Lazy loading with intersection observer
const { ref, isVisible } = useLazyLoading()
```

### Network Optimizations
```typescript
// Debounced search
const debouncedQuery = useDebounce(searchQuery, 300)

// Adaptive quality based on connection
const quality = useNetworkQuality() // 'fast' | 'slow' | 'offline'
```

## 🧪 Testing

### Performance Testing
- Use browser DevTools Performance tab
- Monitor FPS with built-in performance hooks
- Test on slow devices and connections

### Accessibility Testing
- Use screen readers (NVDA, JAWS, VoiceOver)
- Test keyboard navigation
- Verify color contrast ratios
- Check focus management

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Performance Checklist
- [ ] Enable compression (gzip/brotli)
- [ ] Configure CDN for static assets
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Enable PWA caching strategies
- [ ] Configure performance budgets

## 📊 Performance Metrics

The app targets the following performance metrics:

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Time to Interactive**: < 3.5s

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the performance and accessibility guidelines
4. Test thoroughly on different devices
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework with excellent performance
- [Appwrite](https://appwrite.io/) - Backend-as-a-Service with real-time capabilities
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Production-ready motion library
- [Lucide React](https://lucide.dev/) - Beautiful & consistent icon library

## 📞 Support

For support and questions:
- Open an issue on GitHub
- Email: support@adaptonia.app
- Documentation: [docs.adaptonia.app](https://docs.adaptonia.app)

---

Built with ❤️, performance, and accessibility in mind by the Adaptonia Team
