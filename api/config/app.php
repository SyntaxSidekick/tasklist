<?php
// Application Configuration

return [
    'app_name' => 'Syntax Sidekick Task Manager',
    'app_url' => 'http://localhost',
    
    // JWT Configuration
    'jwt_secret' => 'your-secret-key-change-this-in-production-use-random-string-min-32-chars',
    'jwt_expiry' => 7 * 24 * 60 * 60, // 7 days in seconds
    'jwt_cookie_name' => 'sintacks_token',
    
    // Security
    'bcrypt_cost' => 12,
    
    // CORS
    'cors_origins' => ['http://localhost:3000', 'http://localhost'],
    
    // Timezone
    'timezone' => 'UTC',
    
    // Pagination
    'per_page' => 50,
];
