# Line 1
$Root = "C:\XAMPP11032025\htdocs\STIKWALLET11202025"
# Line 2 - choose the URI that matches the login page you are actually using
$Uri  = "http://localhost/STIKWALLET11202025"   # <-- change ONLY if needed
# Line 3
$User = "nathan"
# Line 4
$Drush = Join-Path $Root "vendor\bin\drush.php"

# Line 6 - unblock user (safe even if not blocked)
php $Drush user:unblock $User --uri=$Uri

# Line 9 - set a new password without putting it into your terminal history
$sec = Read-Host "New password for $User" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
$plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)

php $Drush user:password $User $plain --uri=$Uri

# Line 19 - clear caches
php $Drush cr --uri=$Uri

# Line 22 - generate a one-time login link (bypasses password once; fastest “override”)
php $Drush uli --name=$User --uri=$Uri
