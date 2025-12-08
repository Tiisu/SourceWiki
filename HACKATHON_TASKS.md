# WikiSourceVerifier Hackathon Tasks - Coding Focus

Welcome to the WikiSourceVerifier end-of-year hack challenge! Below are the available **coding and bug fix tasks** categorized by difficulty. Each completed task earns points once validated by mentors.

## Scoring System
- **Beginner task** → 1 point
- **Intermediate task** → 3 points  
- **Difficult task** → 5 points

---

## 🔧 CODING TASKS

### Backend Development

#### Beginner Tasks (1 point each)

**1. Fix Environment Configuration**
- Create `.env.example` file with all required environment variables
- Add proper environment variable validation in config.js
- Add startup checks to ensure MongoDB connection works

**2. Add Input Validation**
- Enhance validation middleware for better error messages
- Add URL format validation for submission endpoints
- Add file size and type validation for PDF uploads

**3. Improve Error Handling**
- Standardize error response format across all controllers
- Add specific error codes for different failure types
- Improve error logging with timestamps and request IDs

**4. Add Basic Health Checks**
- Expand health endpoint to include database connectivity status
- Add memory usage and uptime information
- Create endpoint for checking external service dependencies

#### Intermediate Tasks (3 points each)

**5. Implement File Upload System**
- Set up multer middleware for actual PDF file uploads
- Create file storage system (local or cloud)
- Add file metadata tracking and cleanup jobs

**6. Add Email Notification System**
- Set up email service (nodemailer or similar)
- Send verification notifications to submitters
- Send pending review notifications to country verifiers

**7. Implement API Rate Limiting by User**
- Create user-specific rate limiting (not just IP-based)
- Add different limits for different user roles
- Track and display rate limit status in headers

**10. Add Caching System**
- Implement Redis caching for frequent queries
- Cache submission lists and statistics
- Add cache invalidation strategies

#### Difficult Tasks (5 points each)

**11. Implement Real-time Notifications**
- Set up WebSocket/Socket.io for live notifications
- Create notification system for verifiers when submissions arrive
- Add real-time dashboard updates

**12. Add OAuth Integration**
- Implement Wikimedia OAuth authentication
- Allow users to link their Wikipedia accounts
- Add Wikipedia edit history verification

**13. Create API Documentation System**
- Set up Swagger/OpenAPI documentation
- Add interactive API testing interface
- Generate comprehensive endpoint documentation

**14. Implement Testing Framework**
- Set up Jest for backend testing
- Add integration tests for API endpoints
- Create test data seeding and cleanup

### Frontend Development

#### Beginner Tasks (1 point each)

**15. Fix API Integration Issues**
- Ensure frontend correctly connects to backend on port 5000
- Fix authentication flow with real backend instead of mock data
- Handle loading states and error messages properly

**16. Improve Mobile Responsiveness**
- Fix mobile layout issues on submission form
- Improve navigation menu for mobile devices
- Add touch-friendly interactions

**17. Add Loading Skeletons**
- Create skeleton components for data loading states
- Add loading indicators for form submissions
- Implement progressive loading for large lists

**18. Enhance Form Validation**
- Add client-side validation with real-time feedback
- Improve error message display
- Add form field auto-completion and suggestions

**19. Fix Navigation and Routing**
- Ensure all routes work correctly
- Add proper 404 handling
- Fix page transitions and state management

#### Intermediate Tasks (3 points each)

**21. Create User Profile Dashboard**
- Build comprehensive user stats dashboard
- Add submission history with status tracking
- Create points and badges display system

**22. Implement Real-time Updates**
- Connect to WebSocket for live submission updates
- Add real-time notification system
- Update UI automatically when data changes

**23. Add Data Export Features**
- Create CSV/JSON export for submission data
- Add filtering options for exports
- Implement batch operations for admin users

#### Difficult Tasks (5 points each)

**25. Create Interactive Analytics Dashboard**
- Build comprehensive charts using recharts
- Add country-wise performance metrics
- Create interactive data visualization

**26. Implement Offline Support**
- Add service worker for offline functionality
- Cache submissions for offline viewing
- Queue actions for when connection returns

**27. Add Advanced Admin Features**
- Create bulk user management interface
- Add system-wide settings configuration
- Implement audit logging and user activity tracking

---

## 🐛 BUG FIXES & IMPROVEMENTS

### Critical Fixes (1 point each)

**29. Fix Form Submission Integration**
- Connect submission form to real backend API
- Fix data format issues between frontend and backend
- Ensure proper error handling and user feedback

**30. Fix Authentication Flow**
- Resolve JWT token handling between frontend and backend
- Fix login/logout state management
- Ensure protected routes work correctly

**31. Fix Data Loading Issues**
- Replace mock data usage with real API calls
- Fix async data loading and error states
- Ensure proper loading indicators

**32. Fix Country Dropdown Issues**
- Fix missing countries in submission and search forms (Ghana, etc. not showing)
- Connect country dropdown to backend API instead of hardcoded list
- Ensure all countries are properly seeded in the database
- Add fallback to comprehensive country list when API fails

### Performance & UX Improvements (3 points each)

**33. Optimize API Performance**
- Fix slow loading times in submission lists
- Optimize database queries and indexing
- Implement proper pagination

**34. Fix Mobile Experience**
- Resolve responsive design issues
- Fix touch interactions and mobile navigation
- Ensure forms work properly on mobile devices

### Advanced Fixes (5 points each)

**35. Security Improvements**
- Fix CORS configuration issues
- Implement proper input sanitization
- Add rate limiting and security headers

**36. Database Optimization**
- Optimize MongoDB queries and indexes
- Fix data consistency issues
- Implement proper transaction handling

## How to Claim and Work on Tasks

### Step 1: Claim Your Task
1. **Choose your task** from the list above
2. **Go to the Phabricator dashboard** and mark the task as "claimed" 
3. **Add your username** to the task assignee field to prevent others from taking it
4. **Announce your selection** to your team mentor for confirmation

### Step 2: Set Up Your Work Environment
1. **Fork the repository** to your own GitHub account
2. **Clone your fork** locally: `git clone https://github.com/YOUR-USERNAME/wikisourceverifier.git`
3. **Create a new branch** with the task number: `git checkout -b task-XX-description`
   - Example: `git checkout -b task-15-api-integration`
   - Example: `git checkout -b task-32-country-dropdown-fix`

### Step 3: Complete the Task
1. **Work on your assigned task** following best practices
2. **Test thoroughly** to ensure functionality works
3. **Document your changes** in commit messages
4. **Follow the coding standards** used in the project

### Step 4: Submit Your Work
1. **Push your branch** to your forked repository
2. **Create a Pull Request** against the main repository with:
   - Clear title: "Task XX: Description"
   - Detailed description of what you implemented
   - Reference to the Phabricator task number
   - Screenshots/demo if applicable
3. **Update Phabricator** to mark task as "In Review"
4. **Notify your mentor** that your PR is ready

### Step 5: Get Points Awarded
1. **Mentor reviews** your Pull Request
2. **Address any feedback** if requested
3. **Get approval** and merge
4. **Points are awarded** once validated by mentors
5. **Phabricator task** marked as "Resolved"

## Important Workflow Rules

⚠️ **CRITICAL**: Always check Phabricator before claiming a task to avoid conflicts!

✅ **DO:**
- Check Phabricator dashboard first
- Mark your task as claimed immediately
- Communicate with mentors regularly
- Test your code thoroughly
- Write clear commit messages

❌ **DON'T:**
- Start working without claiming in Phabricator
- Work on already claimed tasks
- Submit untested code
- Skip documentation

## Point Summary

**Total Available Points: 145**
- Beginner Tasks (1 point): 20 tasks = 20 points
- Intermediate Tasks (3 points): 17 tasks = 51 points  
- Difficult Tasks (5 points): 14 tasks = 70 points

## Current System Status

✅ **Working:**
- Backend API running on port 5000 with MongoDB connection
- Frontend React app running on port 3000
- User registration and authentication working
- Basic submission endpoints functional
- Database with sample data

🔧 **Needs Immediate Attention:**
- Frontend still using mock data instead of real API calls
- Authentication not fully integrated between frontend/backend
- Form submissions not connecting to backend
- Country dropdown missing countries (Ghana, etc.) - Task 32
- Mobile responsiveness issues

❌ **Missing/Incomplete:**
- File upload functionality
- Real-time features
- Comprehensive testing
- Search and advanced filtering
- Admin dashboard features

## Quick Start Issues to Fix First

**Priority 1 (Critical):** Tasks 15, 29, 30, 31, 32
**Priority 2 (High):** Tasks 16, 18, 19, 33, 34
**Priority 3 (Medium):** Tasks 1, 2, 3, 17

## Resources

- **Main Repository**: [WikiSourceVerifier GitHub]([https://github.com/wikimedia/wikisourceverifier](https://github.com/Tiisu/SourceWiki)
- **Phabricator Dashboard**: [Hackathon Tasks Board](https://phabricator.wikimedia.org/project/wikisourceverifier/)
- **Development Setup**: See README.md for local development instructions
- **Mentor Contact**: Available in your team channels

## Troubleshooting

**Common Issues:**
- **Backend won't start**: Check MongoDB connection and environment variables
- **Frontend API errors**: Ensure backend is running on port 5000
- **Country dropdown empty**: This is Task 32 - a known issue to be fixed!
- **Authentication issues**: This is Task 30 - needs frontend/backend integration

**Getting Help:**
- Ask in your team channel first
- Tag mentors for technical guidance
- Check existing issues in the repository
- Review the project documentation

---

**Good luck, and happy hacking! 🚀**

*Remember: This hackathon is about learning, collaboration, and improving Wikipedia's source quality. Every contribution matters, no matter how small. Focus on coding tasks that improve functionality and fix bugs!*

**Track your progress on Phabricator and celebrate your achievements! 🏆**
