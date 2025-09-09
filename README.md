# Project Topic Shuffler 🎓

A comprehensive academic research and project management platform built with React, TypeScript, and Supabase. This application allows students and administrators to manage academic projects, track submissions, and organize research topics with advanced search and filtering capabilities.

## ✨ Features

- **User Authentication**: Secure email/password authentication with role-based access
- **Project Management**: Submit, view, and manage academic projects
- **Advanced Search**: Filter projects by department, year, tags, and more
- **Admin Dashboard**: Comprehensive admin interface for managing users, projects, and departments
- **File Upload**: Secure project file uploads with Supabase Storage
- **Duplicate Detection**: AI-powered duplicate project detection
- **Audit Logging**: Track user actions and system events
- **Responsive Design**: Mobile-first design with dark/light mode support
- **Real-time Updates**: Live updates using Supabase real-time features

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Authentication, Storage, Edge Functions)
- **State Management**: React Context API
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18 or higher - [Download here](https://nodejs.org/)
- **npm**: Comes with Node.js
- **Git**: For version control - [Download here](https://git-scm.com/)

## 🚀 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/project-topic-shuffler.git
cd project-topic-shuffler
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

The application uses Supabase for backend services. The Supabase configuration is already included in the project:

- **Supabase URL**: `https://apfuakxrbijhlktyasqv.supabase.co`
- **Supabase Anon Key**: Already configured in `src/integrations/supabase/client.ts`

No additional environment variables are needed for local development.

### 4. Database Setup

The Supabase database is already configured with:
- User profiles and authentication
- Projects table with RLS policies
- Departments management
- File storage buckets
- Admin user roles

The database migrations and policies are pre-configured. If you need to set up your own Supabase instance:

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL migrations found in `supabase/migrations/`
3. Update the Supabase URL and keys in `src/integrations/supabase/client.ts`

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 6. Default Admin Access

For testing, use these credentials:
- **Email**: `kaurajamb2018@gmail.com`
- **Password**: [Contact admin for password]

## 📦 Building for Production

```bash
# Build the application
npm run build

# Preview the production build locally
npm run preview
```

## 🌐 Deployment to Vercel

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub** (see GitHub setup below)

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the framework settings

3. **Configure Build Settings**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy**:
   - Click "Deploy"
   - Your app will be live at `https://your-app-name.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
vercel --prod
```

### Environment Variables on Vercel

No additional environment variables are needed since Supabase configuration is included in the code. For production with your own Supabase instance, add:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## 🔗 GitHub Integration

### Connect to GitHub

1. **In Lovable Editor**:
   - Click "GitHub" → "Connect to GitHub"
   - Authorize the Lovable GitHub App
   - Select your GitHub account/organization
   - Click "Create Repository"

2. **Or manually push to existing repo**:
```bash
git remote add origin https://github.com/your-username/your-repo-name.git
git branch -M main
git push -u origin main
```

### Continuous Deployment

Once connected to GitHub and Vercel:
- Push to `main` branch automatically deploys to production
- Pull requests create preview deployments
- Lovable changes auto-sync to GitHub

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Custom components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Utility functions
├── pages/              # Page components
│   └── admin/          # Admin-only pages
└── main.tsx           # Application entry point
```

## 🔐 Authentication & Authorization

### User Roles
- **Student**: Can submit and view projects
- **Admin**: Full access to all features and admin dashboard

### Authentication Features
- Email/password authentication
- Profile management with matriculation numbers
- Department assignment
- Role-based access control
- Password visibility toggle

## 📊 Admin Features

Administrators have access to:
- **User Management**: View, edit, and delete users
- **Project Management**: Moderate all project submissions
- **Department Management**: Add and manage departments
- **System Monitoring**: View audit logs and system metrics
- **Advanced Analytics**: Project statistics and trends

## 🔍 Key Features Details

### Advanced Search
- Filter by department, year, student, and tags
- Full-text search across titles and abstracts
- Export search results

### File Management
- Secure file uploads to Supabase Storage
- Support for various document formats
- File preview and download capabilities

### Duplicate Detection
- AI-powered similarity detection
- Prevents duplicate project submissions
- Configurable similarity thresholds

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and commit: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**:
   - Ensure Node.js version 18+
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

2. **Authentication Issues**:
   - Check Supabase project status
   - Verify URL configuration in Supabase dashboard

3. **Deployment Issues**:
   - Check build logs in Vercel dashboard
   - Ensure all environment variables are set

### Getting Help

- Check the [Lovable Documentation](https://docs.lovable.dev/)
- Join the [Lovable Discord Community](https://discord.com/channels/1119885301872070706/1280461670979993613)
- Open an issue on GitHub

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚀 What's Next?

- [ ] Add more authentication providers (Google, GitHub)
- [ ] Implement real-time notifications
- [ ] Add project collaboration features
- [ ] Enhanced analytics dashboard
- [ ] Mobile application
- [ ] API documentation with Swagger

---

**Built with ❤️ using [Lovable](https://lovable.dev)**

For questions or support, please open an issue or contact the development team.