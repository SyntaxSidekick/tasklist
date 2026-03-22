# Deployment Guide - Sintacks Task Manager

This guide will walk you through deploying the Sintacks Task Manager to shared hosting (cPanel).

## Prerequisites

- cPanel hosting account with:
  - PHP 7.4+ with PDO extension
  - MySQL 5.7+ database
  - Apache with mod_rewrite
  - FTP/SSH access or File Manager
- MySQL database created via cPanel
- Domain or subdomain pointing to your hosting

## Step-by-Step Deployment

### Part 1: Database Setup

#### 1.1 Create Database

1. Login to cPanel
2. Go to **MySQL Databases**
3. Create a new database (e.g., `youruser_sintacks`)
4. Create a database user
5. Add user to database with ALL PRIVILEGES
6. Note down: database name, username, password

#### 1.2 Import Schema

**Option A: Using phpMyAdmin**
1. Go to cPanel → phpMyAdmin
2. Select your database
3. Click **Import** tab
4. Upload `database/schema.sql`
5. Click **Go**

**Option B: Using Terminal (SSH)**
```bash
mysql -u youruser_sintacks -p youruser_sintacks < database/schema.sql
```

### Part 2: Backend (API) Setup

#### 2.1 Configure Database Connection

1. Navigate to `api/config/`
2. Copy `database.example.php` to `database.php`
3. Edit `database.php`:

```php
<?php
return [
    'host' => 'localhost',           // Usually 'localhost'
    'database' => 'youruser_sintacks', // Your database name
    'username' => 'youruser_dbuser',   // Your database username
    'password' => 'your-db-password',  // Your database password
    'charset' => 'utf8mb4',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];
```

#### 2.2 Configure Application

Edit `api/config/app.php`:

```php
<?php
return [
    'app_name' => 'Sintacks Task Manager',
    'app_url' => 'https://yourdomain.com',  // Your domain
    
    // IMPORTANT: Generate a random 32+ character string
    'jwt_secret' => 'change-this-to-a-random-32-plus-character-string',
    'jwt_expiry' => 7 * 24 * 60 * 60,
    'jwt_cookie_name' => 'sintacks_token',
    
    'bcrypt_cost' => 12,
    
    // Add your domain(s)
    'cors_origins' => [
        'https://yourdomain.com',
        'https://www.yourdomain.com'
    ],
    
    'timezone' => 'UTC',
    'per_page' => 50,
];
```

**Generate JWT Secret:**
```bash
# On Linux/Mac
openssl rand -base64 32

# Or use any random string generator (min 32 characters)
```

#### 2.3 Upload API Files

Via FTP or File Manager:
1. Upload the entire `api/` folder to `/public_html/api/`
2. Ensure `.htaccess` is uploaded (check hidden files)
3. Set permissions:
   - Files: 644
   - Directories: 755

**Final API structure:**
```
/public_html/
└── api/
    ├── config/
    │   ├── app.php
    │   └── database.php
    ├── core/
    ├── controllers/
    ├── index.php
    └── .htaccess
```

### Part 3: Frontend Setup

#### 3.1 Build Frontend Locally

On your development machine:

```bash
# Install dependencies (if not done)
npm install

# Build for production
npm run build
```

This creates a `dist/` folder.

#### 3.2 Update Vite Config (Optional)

If deploying to a subdirectory, edit `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/app/',  // If deploying to yourdomain.com/app/
  // ... rest of config
})
```

Then rebuild: `npm run build`

#### 3.3 Upload Frontend Files

Upload contents of `dist/` folder:

**Option A: Deploy to root**
- Upload `dist/*` to `/public_html/`

**Option B: Deploy to subdirectory**
- Upload `dist/*` to `/public_html/app/`

#### 3.4 Create .htaccess for Frontend

Create `/public_html/.htaccess` (or `/public_html/app/.htaccess`):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Redirect to index.html for React Router
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### Part 4: SSL Certificate (HTTPS)

**Highly Recommended for Security**

1. In cPanel, go to **SSL/TLS Status**
2. Find your domain
3. Click **Run AutoSSL**
4. Wait for certificate to be issued

Or use **Let's Encrypt** via cPanel.

### Part 5: Testing

#### 5.1 Test API

Visit: `https://yourdomain.com/api/health`

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": 1234567890
  }
}
```

If you see errors:
- Check PHP error logs in cPanel
- Verify database credentials
- Ensure mod_rewrite is enabled

#### 5.2 Test Frontend

1. Visit: `https://yourdomain.com/` (or `/app/`)
2. You should see the login page
3. Try registering a new account
4. Create a test task

### Part 6: Troubleshooting

#### API returns 500 Error
- Check PHP error logs: cPanel → **Error Log**
- Verify database connection in `api/config/database.php`
- Ensure PDO extension is enabled

#### Login not working / No cookies
- Verify `app_url` in `api/config/app.php` matches your domain
- Check `cors_origins` includes your domain
- Ensure HTTPS is enabled (JWT cookies require secure connection)

#### 404 on routes
- Ensure `.htaccess` is present in both `/api/` and frontend directory
- Verify mod_rewrite is enabled

#### CORS errors
- Add your domain to `cors_origins` in `api/config/app.php`
- Clear browser cache
- Check browser console for exact CORS error

#### Tasks not loading
- Open browser DevTools → Network tab
- Check API responses
- Verify authentication is working

## Post-Deployment

### Security Checklist

- [ ] Changed `jwt_secret` to a random string (32+ chars)
- [ ] Verified database credentials are not default
- [ ] Enabled HTTPS/SSL
- [ ] Checked that `api/config/database.php` is not publicly accessible
- [ ] Set proper file permissions (644 for files, 755 for directories)
- [ ] Reviewed CORS origins

### Maintenance

#### Updating the App

1. Pull latest changes locally
2. Run `npm run build`
3. Upload new `dist/` files
4. Upload any changed API files
5. Run database migrations if needed

#### Backup

Regular backups:
- Database: Use cPanel → **Backup Wizard**
- Files: Download via FTP or cPanel File Manager

#### Monitoring

- Check error logs regularly
- Monitor disk space usage
- Keep PHP version updated

## Performance Optimization

### 1. Enable OPcache

In cPanel → **MultiPHP INI Editor**:
```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
```

### 2. Enable Gzip Compression

Already included in `.htaccess` - verify it's working:
```bash
curl -H "Accept-Encoding: gzip" -I https://yourdomain.com
```

Should see: `Content-Encoding: gzip`

### 3. CDN (Optional)

For faster global access:
- Cloudflare (free tier available)
- Configure in cPanel → **Cloudflare**

## Support

If you encounter issues:

1. Check PHP error logs in cPanel
2. Check browser console for JavaScript errors
3. Verify all configuration files are correct
4. Test API health endpoint
5. Review the troubleshooting section above

For additional help, open an issue on GitHub with:
- Error message
- Steps to reproduce
- Server environment details (PHP version, MySQL version)

---

**Congratulations! Your Sintacks Task Manager is now deployed!**

Create your first account and start managing tasks like a pro. 🚀
