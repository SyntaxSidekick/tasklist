<?php
// Generate proper bcrypt hash for password
echo password_hash('password123', PASSWORD_BCRYPT, ['cost' => 12]);
