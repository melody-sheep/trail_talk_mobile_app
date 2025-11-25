# 🎓 TRAILTALK - Campus Social Platform

## 📱 Project Overview

**TRAILTALK** is a comprehensive campus social platform developed as a final project for Mobile Programming & Technopreneurship. This production-ready mobile application facilitates communication, community building, and content sharing among students and faculty members within an academic environment.

### 🚀 Key Features

- **Dual User System**: Separate interfaces for Students and Faculty
- **Real-time Social Interactions**: Posts, comments, likes, and reposts
- **Community Management**: Create, join, and manage interest-based communities
- **Private Messaging**: Real-time chat functionality
- **Notification System**: Comprehensive alert system for user activities
- **Moderation Tools**: Reporting system and content moderation
- **Anonymous Posting**: Option to post content anonymously

---

## 🏗️ System Architecture

### 📁 Project Structure

```
TRAILTALK/
├── 📁 expo/                    # Expo configuration and device management
├── 📁 assets/                  # Application assets and icons
│   ├── 📁 developer_profiles/          # Team member profiles
│   ├── 📁 signing_signup_icons/        # Authentication UI assets
│   ├── 📁 std_fcty_homescreen_icons/   # Home screen icons
│   ├── 📁 bottom_navigation_icons/     # Navigation bar icons
│   ├── 📁 create_post_screen_icons/    # Post creation assets
│   ├── 📁 post_interaction_icons/      # Post engagement icons
│   └── 📁 profile_page_icons/          # Profile management assets
├── 📁 src/                     # Source code
│   ├── 📁 components/          # Reusable UI components
│   ├── 📁 constants/           # Application constants
│   ├── 📁 contexts/            # React Context providers
│   ├── 📁 hooks/               # Custom React hooks
│   ├── 📁 lib/                 # External library configurations
│   ├── 📁 navigation/          # App navigation setup
│   ├── 📁 screens/             # Application screens
│   │   ├── 📁 student/         # Student-specific screens
│   │   └── 📁 faculty/         # Faculty-specific screens
│   └── 📁 styles/              # Styling and theming
└── Configuration files         # Project configuration
```

---

## 🎯 Core Components

### 🔧 Reusable Components (`/src/components/`)

- **CustomButton.js**: Standardized button component
- **HeaderWithTabs.js**: Tab-based navigation header
- **BottomNavigation.js**: Main app navigation bar
- **PostCard.js**: Post display component with interaction options
- **ReportModal.js**: Content reporting interface
- **CommunityPostCard.js**: Community-specific post display
- **BannedWordModal.js**: Content filtering interface
- **FilterModal.js**: Content filtering options

### 🎨 Styling System (`/src/styles/`)

- **colors.js**: Color palette and theme definitions
- **fonts.js**: Typography system
- **globalStyles.js**: Global styling constants

### 🔗 State Management (`/src/contexts/` & `/src/hooks/`)

- **UserContext.js**: User authentication and profile management
- **usePost.js**: Post management and interactions
- **useSearch.js**: Search functionality
- **useComments.js**: Comment management
- **useCommunityPosts.js**: Community post handling
- **useNotifications.js**: Notification system
- **useReports.js**: Report management
- **useBannedWords.js**: Content moderation

---

## 📊 Database Schema

### 🗃️ Core Tables

#### User Management
- **profiles**: User account information and profiles
- **students**: Student-specific data (View)
- **faculty**: Faculty-specific data (View)

#### Content Management
- **posts**: Main feed posts
- **comments**: Post comments
- **post_likes**: Post engagement tracking
- **reposts**: Content sharing records
- **bookmarks**: Saved content tracking

#### Community System
- **communities**: Community definitions
- **community_members**: Community membership
- **community_posts**: Community-specific content
- **community_comments**: Community post comments

#### Messaging System
- **conversations**: Chat conversations
- **messages**: Individual messages
- **conversation_participants**: Chat participants

#### Moderation System
- **reports**: Content reports
- **report_actions**: Moderation actions
- **banned_words**: Content filter words

#### Notification System
- **notifications**: User notifications

### 🔐 Security Features

- **Row Level Security (RLS)**: Enabled on all tables
- **Authentication Policies**: Role-based access control
- **Data Validation**: Comprehensive input validation
- **Real-time Security**: Secure WebSocket connections

---

## 🎮 User Flows

### 👥 Student Experience

1. **Authentication**
   - Welcome Screen → Role Selection → Sign Up/Sign In
2. **Main Dashboard**
   - Home feed with posts and interactions
   - Community discovery and management
   - Real-time notifications
3. **Social Features**
   - Create posts (anonymous option available)
   - Engage with content (like, comment, repost)
   - Join and participate in communities
4. **Communication**
   - Private messaging with students and faculty
   - Community discussions
5. **Profile Management**
   - Edit profile information
   - Manage content and interactions

### 🎓 Faculty Experience

1. **Enhanced Features**
   - All student features plus:
   - Report management dashboard
   - Content moderation tools
   - Community administration
2. **Moderation Capabilities**
   - Review reported content
   - Take moderation actions
   - Manage banned words list

---

## 🔄 Real-time Features

### ⚡ Live Updates
- **Post interactions**: Instant like/comment counts
- **Messaging**: Real-time chat functionality
- **Notifications**: Immediate activity alerts
- **Community updates**: Live member and post counts

### 🔔 Notification Types
- New followers
- Post interactions (likes, comments, reposts)
- Community updates
- Message notifications

---

## 🛠️ Technical Stack

### Frontend
- **React Native** with Expo
- **React Navigation** for routing
- **React Context** for state management
- **Custom Hooks** for business logic

### Backend
- **Supabase** (PostgreSQL) for database
- **Real-time subscriptions** for live updates
- **Row Level Security** for data protection
- **Storage** for file uploads

### Key Libraries
- **Ionicons** for icon system
- **React Native Elements** for UI components
- **Expo AV** for media handling
- **React Native Gesture Handler** for interactions

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- Expo CLI
- Supabase account

### Installation Steps
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Set up Supabase project and database
5. Run development server: `expo start`

### Build Instructions
- **Development**: `expo start`
- **Production Build**: `expo build:android`
- **APK Generation**: Configured and ready for distribution

---

## 🎨 Design System

### Color Palette
- Primary brand colors defined in `colors.js`
- Consistent theming across all components
- Accessibility-compliant contrast ratios

### Typography
- Custom font definitions in `fonts.js`
- Hierarchical text scaling
- Consistent spacing and alignment

### Component Library
- Reusable UI components
- Consistent interaction patterns
- Responsive design for various screen sizes

---

## 🔒 Security Implementation

### Authentication
- Secure sign-up/sign-in flows
- Role-based access control
- Session management

### Data Protection
- Row-level security policies
- Input validation and sanitization
- Secure file upload handling

### Content Moderation
- Banned word filtering
- User reporting system
- Administrative oversight

---

## 📈 Performance Features

### Optimization
- Efficient database queries with proper indexing
- Image optimization and caching
- Lazy loading for content feeds
- Memory management for large lists

### Real-time Efficiency
- WebSocket connections for live updates
- Optimized re-rendering with proper state management
- Efficient notification delivery

---

## 🐛 Testing & Quality Assurance

### Code Quality
- Modular component architecture
- Consistent coding standards
- Comprehensive error handling
- Type-safe database interactions

### User Experience
- Intuitive navigation patterns
- Responsive design implementation
- Accessibility considerations
- Cross-platform compatibility

---

## 📋 Future Enhancements

### Planned Features
- Advanced analytics dashboard
- Enhanced community moderation tools
- Mobile payment integration for campus services
- Integration with campus management systems
- Advanced search and filtering options

### Scalability Considerations
- Modular architecture for easy feature additions
- Database optimization for large-scale deployment
- Cloud infrastructure ready for scaling

---

## 👥 Development Team

This project was developed by:
- **Alther** - UI/UX Design & Frontend, Backend & Database Architecture (LEAD DEVELOPER)
- **Jocelyn** - UI/UX Design & Frontend Development
- **Divine** - Feature Implementation & Testing
- **Faisal** - System Integration & Deployment
- **Harry** - Project Management & Documentation

---

## 📄 License & Documentation

### Project Status
- **Current Version**: 1.0.0
- **Status**: Production Ready
- **Last Updated**: November 25, 2025

### Documentation
- Comprehensive code documentation
- Database schema documentation
- API endpoint documentation
- User guide and administrator manual

---

## 🎉 Conclusion

**TRAILTALK** represents a complete, professional-grade mobile application demonstrating mastery of modern mobile development practices. The platform successfully delivers a robust social experience tailored for academic environments while maintaining high standards of security, performance, and user experience.

With 45+ screens, 15+ custom hooks, and comprehensive real-time features, this project stands as a testament to the technical capabilities and innovative thinking of the development team.

---

*For more information, deployment instructions, or technical documentation, please refer to the respective documentation files or contact the development team.*

---November 25, 2025---