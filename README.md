# Backend Microservice Checklist

An intelligent, interactive checklist application for backend microservice development best practices with GitHub Pull Request integration.

## 🚀 Features

### Core Functionality
- **Comprehensive Checklist**: Best practices for microservice development across 6 key areas
- **Category Filtering**: Focus on specific areas (Code Standards, Testing, Documentation, Deployment, Security, Performance)
- **Progress Tracking**: Real-time progress tracking for each section and overall completion
- **Auto-Advancement**: Automatically advance to next incomplete section when one is completed
- **Dark Mode**: Full dark mode support with seamless theme switching

### GitHub Integration
- **GitHub Authentication**: Secure OAuth-based login to save user progress
- **PR-Based Checklists**: Create intelligent checklists directly from GitHub Pull Request URLs
- **Smart Analysis**: Automatically analyzes PR content (files, commits, changes) to suggest relevant checklist items
- **PR Context Display**: Shows PR information with direct links to GitHub
- **Multi-Checklist Management**: Create and manage multiple checklists with easy switching

### User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Sync**: Progress automatically synced to cloud storage
- **Offline Support**: Local storage backup ensures data persistence
- **Toast Notifications**: Contextual feedback for all user actions
- **Loading States**: Smooth loading indicators and error handling

## 🎯 GitHub PR Integration

### How It Works
1. **Create from PR**: Click "+" → Select "From PR" tab
2. **Paste URL**: Enter GitHub PR URL (e.g., `https://github.com/owner/repo/pull/123`)
3. **Auto-Analysis**: System fetches PR data and analyzes changes
4. **Smart Checklist**: Generates checklist with relevant items based on PR content
5. **PR Context**: Displays PR information with direct GitHub link
6. **Progress Tracking**: Check off items as you complete the review

### Intelligent Analysis
The system analyzes PR content to automatically activate relevant checklist items:

- **Code Standards**: Activated for TypeScript/JavaScript files
- **Testing**: Triggered by test files or large changes (>50 lines)
- **Documentation**: Activated by README changes or API modifications
- **Deployment**: Triggered by config files or deployment-related changes
- **Security**: Activated by auth changes or dependency updates
- **Performance**: Triggered by large changes or many files

### Example Usage
```
Input: https://github.com/microsoft/vscode/pull/12345
Analysis: 15 TypeScript files changed, 3 test files added
Result: Checklist "PR-12345-vscode" with activated sections:
  ✓ Code Standards (TypeScript files detected)
  ✓ Testing (Test files found)
  ✓ Documentation (Large PR with API changes)
  ✓ Security (Dependency changes detected)
```

## 🏗️ Architecture

### Frontend Components
- **App.tsx**: Main application wrapper with context providers
- **ChecklistSwitcher**: Dual-mode checklist creation (Manual/PR) with dropdown management
- **PRInfo**: Displays GitHub PR information and metadata
- **ChecklistWorkspace**: Manages category tabs and checklist display
- **MainContent**: Layout container for main application content
- **NotificationManager**: Centralized toast notification handling
- **LoadingIndicator**: Reusable loading component
- **ErrorIndicator**: Centralized error display

### Backend Functions (Azure Functions)
- **githubAuth**: Handles GitHub OAuth authentication flow
- **createChecklistFromPR**: Analyzes GitHub PRs and creates intelligent checklists
- **addChecklist**: Creates new manual checklists
- **getChecklist**: Retrieves specific checklist data
- **getAllChecklists**: Lists all user checklists
- **updateChecklist**: Updates existing checklist progress
- **deleteChecklist**: Removes checklists
- **setChecklistItemStatus**: Updates individual item completion status

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 22.x or higher
- Azure Functions Core Tools
- GitHub account for OAuth setup

### 1. Install Dependencies
```bash
npm install
cd api && npm install
```

### 2. GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Backend Microservice Checklist
   - **Homepage URL**: `http://localhost:5173` (for development)
   - **Authorization callback URL**: Your Azure Function URL + `/api/githubAuth`
4. Copy the Client ID and Client Secret

### 3. Azure Function Configuration
```bash
cd api
```

Create `local.settings.json`:
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "GITHUB_CLIENT_ID": "your-client-id",
    "GITHUB_CLIENT_SECRET": "your-client-secret",
    "ALLOWED_ORIGINS": "http://localhost:5173",
    "AZURE_STORAGE_ACCOUNT_NAME": "your-storage-account",
    "AZURE_STORAGE_ACCOUNT_KEY": "your-storage-key"
  }
}
```

### 4. Start Development Servers
```bash
# Terminal 1: Start Azure Functions
cd api
npm start

# Terminal 2: Start React App
npm run dev
```

### 5. Configure Frontend
Update `src/contexts/AuthContext.tsx`:
- Replace `YOUR_GITHUB_CLIENT_ID` with your actual Client ID
- Update `AZURE_FUNCTION_URL` with your local function URL

## 🚀 Production Deployment

### 1. Deploy Azure Functions
```bash
cd api
./deploy.sh
```

The deployment script will:
- Create Azure resources (Resource Group, Storage Account, Function App)
- Deploy all functions with proper configuration
- Set up CORS for your domain
- Output the function URL for frontend configuration

### 2. Update GitHub OAuth App
- Update the Authorization callback URL with your deployed Azure Function URL
- Example: `https://your-function-app.azurewebsites.net/api/githubAuth`

### 3. Configure Production Frontend
Update `src/contexts/ChecklistContext.tsx`:
```typescript
const API_BASE_URL = 'https://your-function-app.azurewebsites.net/api';
```

Update `src/contexts/AuthContext.tsx`:
```typescript
const AZURE_FUNCTION_URL = 'https://your-function-app.azurewebsites.net/api/githubAuth';
const GITHUB_CLIENT_ID = 'your-production-client-id';
```

### 4. Deploy Frontend
Build and deploy to your hosting service:
```bash
npm run build
# Deploy dist/ folder to Netlify, Vercel, or your preferred hosting
```

## 🔒 Security Features

### Authentication & Authorization
- **GitHub OAuth**: Secure authentication flow with no client secrets exposed
- **User Isolation**: Each user can only access their own checklists
- **CORS Protection**: Configured to only allow requests from approved origins
- **API Authentication**: All API calls require valid GitHub user authentication

### Data Protection
- **Encrypted Storage**: All data stored in Azure Table Storage with encryption at rest
- **No Sensitive Data**: GitHub tokens are only used for authentication, not stored
- **Input Validation**: Comprehensive validation for all user inputs and API calls

## 🎨 UI/UX Features

### Design System
- **Modern Interface**: Clean, professional design with intuitive navigation
- **Dark Mode**: Complete dark mode support with proper contrast ratios
- **Responsive Layout**: Mobile-first design that works on all screen sizes
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

### User Experience
- **Smart Defaults**: Intelligent suggestions based on PR analysis
- **Contextual Help**: Tooltips and guidance throughout the interface
- **Error Handling**: Graceful error handling with helpful error messages
- **Performance**: Optimized loading with minimal API calls and efficient state management

## 📊 Checklist Categories

### 1. Code Standards
- Code review completion
- Naming conventions adherence
- Error handling implementation
- Code documentation

### 2. Testing
- Unit test coverage
- Integration test completion
- End-to-end test verification
- Performance testing

### 3. Documentation
- API documentation updates
- README file maintenance
- Code comments
- Architecture documentation

### 4. Deployment
- Staging environment testing
- Production deployment plan
- Rollback strategy
- Environment configuration

### 5. Security
- Security review completion
- Dependency vulnerability check
- Authentication/authorization verification
- Data protection compliance

### 6. Performance
- Performance testing completion
- Memory usage optimization
- Database query optimization
- Caching strategy implementation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Check the documentation
- Review existing issues for solutions

---

**Built with ❤️ for better code review practices** 