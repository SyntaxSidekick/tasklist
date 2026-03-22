# Sintacks Task Manager

A **full-stack Todoist-style task manager** built for **shared hosting (LAMP stack)** with a modern React + TypeScript frontend and PHP + MySQL backend.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

### Core Features
- ✅ **Task Management** - Create, edit, delete, and organize tasks
- 📅 **Due Dates & Times** - Set deadlines with optional time
- 🎯 **Priority Levels** - P1 (Urgent) to P4 (Low)
- 🏷️ **Labels & Tags** - Organize with custom labels
- 📂 **Projects** - Group tasks into projects
- 🔄 **Recurring Tasks** - Daily, weekly, monthly, yearly recurrence
- 📝 **Subtasks** - Break down tasks into smaller pieces
- 🔔 **Reminders** - Browser notifications for upcoming tasks

### Productivity Features
- 🍅 **Pomodoro Timer** - Built-in focus timer with session tracking
- 📊 **Progress Tracking** - View completion stats
- 📱 **Mobile-First Design** - Optimized for all devices
- 🌗 **Dark Mode** - System, light, or dark theme

### Technical Features
- 🔐 **JWT Authentication** - Secure with HTTP-only cookies
- 🎨 **Lucide Icons** - Consistent, professional iconography
- ⚡ **Fast & Lightweight** - Optimized for shared hosting
- 📦 **Zero Node.js Backend** - Pure PHP REST API

## Tech Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Zustand** - Lightweight state management
- **date-fns** - Date utilities

### Backend
- **PHP 7.4+** - Server-side logic
- **MySQL 5.7+** - Database
- **JWT** - Authentication
- **PDO** - Database access

## Requirements

### Development
- Node.js 18+
- PHP 7.4+ with PDO
- MySQL 5.7+
- Composer (optional)

### Production (Shared Hosting)
- cPanel or similar hosting control panel
- PHP 7.4+ with PDO
- MySQL database
- Apache with mod_rewrite

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/sintacks-task-manager.git
cd sintacks-task-manager
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Setup Database

1. Create a MySQL database via cPanel or phpMyAdmin
2. Import the schema:

```bash
mysql -u your_username -p your_database < database/schema.sql
```

3. Configure database connection:

```bash
cp api/config/database.example.php api/config/database.php
```

Edit `api/config/database.php` with your credentials:

```php
<?php
return [
    'host' => 'localhost',
    'database' => 'your_database_name',
    'username' => 'your_username',
    'password' => 'your_password',
    // ...
];
```

### 4. Configure API

Edit `api/config/app.php`:

- Change `jwt_secret` to a random 32+ character string
- Update `app_url` to your domain
- Add your domain to `cors_origins`

### 5. Development

```bash
# Start development server
npm run dev

# The app will run on http://localhost:3000
# API requests will proxy to http://localhost/api
```

For local development, ensure your local Apache/XAMPP is running and the `api` folder is accessible.

## Deployment to Shared Hosting

### 1. Build Frontend

```bash
npm run build
```

This creates a `dist` folder with optimized static files.

### 2. Upload Files

Via FTP/cPanel File Manager:

- Upload `dist/*` contents to `/public_html/app/` (or root)
- Upload `api/` folder to `/public_html/api/`

### 3. Setup .htaccess

The API already includes `.htaccess`. For the frontend, create `/public_html/app/.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /app/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /app/index.html [L]
</IfModule>
```

### 4. Update API Configuration

Edit `api/config/app.php` on the server:

```php
'app_url' => 'https://yourdomain.com',
'cors_origins' => ['https://yourdomain.com'],
'jwt_secret' => 'your-production-secret-key-min-32-chars',
```

### 5. Test

Visit `https://yourdomain.com/app/` and register a new account.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - List tasks
- `GET /api/tasks/today` - Today's tasks
- `GET /api/tasks/upcoming` - Upcoming tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `PATCH /api/tasks/{id}/complete` - Mark complete
- `DELETE /api/tasks/{id}` - Delete task

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Labels
- `GET /api/labels` - List labels
- `POST /api/labels` - Create label
- `PUT /api/labels/{id}` - Update label
- `DELETE /api/labels/{id}` - Delete label

### Pomodoro
- `GET /api/pomodoro/stats` - Get statistics
- `POST /api/pomodoro/sessions` - Save session
- `GET /api/pomodoro/sessions` - List sessions

### Notifications
- `GET /api/notifications` - List notifications
- `PATCH /api/notifications/{id}/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read

## Project Structure

```
sintacks-task-manager/
├── api/                      # PHP Backend
│   ├── config/              # Configuration files
│   ├── core/                # Core classes (Router, Auth, JWT)
│   ├── controllers/         # API controllers
│   ├── index.php            # API entry point
│   └── .htaccess           # Apache rewrite rules
│
├── src/                     # React Frontend
│   ├── components/          # React components
│   │   ├── ui/             # Base UI components
│   │   ├── tasks/          # Task components
│   │   ├── projects/       # Project components
│   │   └── pomodoro/       # Pomodoro timer
│   ├── pages/              # Page components
│   ├── layouts/            # Layout components
│   ├── lib/                # Utilities & API client
│   ├── hooks/              # Custom React hooks
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript types
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
│
├── database/               # Database schema
├── public/                 # Static assets
└── dist/                   # Build output (generated)
```

## Design System

### Colors

```css
Primary:     #A7D08C
Hover:       #94C973
Active:      #87BC5C
Success:     #A7D08C
Warning:     #F4A623
Error:       #E05565
Info:        #4A90E2
```

### Icons

All icons use **Lucide React** for consistency. No emojis or inline SVGs.

### Typography

- Font: **Inter** (Google Fonts)
- Fallback: System font stack

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security

- JWT tokens stored in HTTP-only cookies
- CSRF protection via SameSite cookies
- Password hashing with bcrypt (cost: 12)
- SQL injection prevention via PDO prepared statements
- XSS protection via React's default escaping

## Performance

- Optimized Vite build (~200KB gzipped)
- Lazy loading for routes
- Debounced API calls
- Efficient state management with Zustand

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

For issues and questions:
- Open an [issue on GitHub](https://github.com/yourusername/sintacks-task-manager/issues)
- Email: support@sintacks.com

## Acknowledgments

- Inspired by Todoist and Linear
- Icons by [Lucide](https://lucide.dev/)
- UI styling with [Tailwind CSS](https://tailwindcss.com/)

---

**Built with ❤️ for productivity enthusiasts**
