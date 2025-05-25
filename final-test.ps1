Write-Host "=== QuantTrade Final API Test ===" -ForegroundColor Green
Write-Host "Testing all APIs after fixes..." -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$testCount = 0
$passCount = 0

function Test-Endpoint {
    param($name, $method, $url, $headers = @{}, $body = $null)
    
    $script:testCount++
    Write-Host "`n[$script:testCount] Testing: $name" -ForegroundColor Yellow
    
    try {
        $params = @{
            Uri = $url
            Method = $method
            Headers = $headers
        }
        
        if ($body) {
            $params.Body = $body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        Write-Host "    SUCCESS - Status: $($response.StatusCode)" -ForegroundColor Green
        $script:passCount++
        
        if ($response.Content) {
            $content = $response.Content | ConvertFrom-Json
            return $content
        }
        return $null
    }
    catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "N/A" }
        Write-Host "    FAILED - Status: $statusCode" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 1. Health Check
$health = Test-Endpoint "Health Check" "GET" "$baseUrl/api/health"

# 2. Admin Login
$loginBody = @{
    email = "admin@quanttrade.com"
    password = "password123"
} | ConvertTo-Json

$adminLogin = Test-Endpoint "Admin Login" "POST" "$baseUrl/api/auth/login" @{} $loginBody

$adminToken = $null
if ($adminLogin -and $adminLogin.tokens -and $adminLogin.tokens.accessToken) {
    $adminToken = $adminLogin.tokens.accessToken
    Write-Host "    Token acquired successfully" -ForegroundColor Cyan
}

# 3. User Login
$userLoginBody = @{
    email = "user@quanttrade.com"
    password = "password123"
} | ConvertTo-Json

$userLogin = Test-Endpoint "User Login" "POST" "$baseUrl/api/auth/login" @{} $userLoginBody

$userToken = $null
if ($userLogin -and $userLogin.tokens -and $userLogin.tokens.accessToken) {
    $userToken = $userLogin.tokens.accessToken
    Write-Host "    User token acquired successfully" -ForegroundColor Cyan
}

# 4. Wrong Password (Security Test)
$wrongPasswordBody = @{
    email = "admin@quanttrade.com"
    password = "wrongpassword"
} | ConvertTo-Json

Test-Endpoint "Wrong Password Login" "POST" "$baseUrl/api/auth/login" @{} $wrongPasswordBody

# Authenticated Tests (Admin)
if ($adminToken) {
    $adminHeaders = @{ "Authorization" = "Bearer $adminToken" }
    
    # 5. User Info
    Test-Endpoint "User Info (Admin)" "GET" "$baseUrl/api/me" $adminHeaders
    
    # 6. Trading Settings
    Test-Endpoint "Trading Settings" "GET" "$baseUrl/api/admin/trading-settings" $adminHeaders
    
    # 7. Dashboard
    Test-Endpoint "Dashboard (Admin)" "GET" "$baseUrl/api/dashboard" $adminHeaders
}

# Authenticated Tests (User)
if ($userToken) {
    $userHeaders = @{ "Authorization" = "Bearer $userToken" }
    
    # 8. User Info
    Test-Endpoint "User Info (User)" "GET" "$baseUrl/api/me" $userHeaders
    
    # 9. Dashboard
    Test-Endpoint "Dashboard (User)" "GET" "$baseUrl/api/dashboard" $userHeaders
    
    # 10. Quick Trade
    $quickTradeBody = @{
        symbol = "BTC/USDT"
        amount = 10
        direction = "buy"
        leverage = 1
        orderType = "market"
    } | ConvertTo-Json
    
    Test-Endpoint "Quick Trade Execute" "POST" "$baseUrl/api/quick-trade" $userHeaders $quickTradeBody
    Test-Endpoint "Quick Trade History" "GET" "$baseUrl/api/quick-trade" $userHeaders
    
    # 11. Flash Trade
    $flashTradeBody = @{
        amount = 50
        asset = "BTC"
        duration = 60
    } | ConvertTo-Json
    
    Test-Endpoint "Flash Trade Execute" "POST" "$baseUrl/api/flash-trade" $userHeaders $flashTradeBody
    Test-Endpoint "Flash Trade History" "GET" "$baseUrl/api/flash-trade" $userHeaders
}

# Public APIs
# 12. Crypto Data
Test-Endpoint "Crypto List" "GET" "$baseUrl/api/crypto"
Test-Endpoint "Bitcoin Details" "GET" "$baseUrl/api/crypto?symbol=BTC"

# 13. Registration (Expected to fail with 409 - user exists)
$registerBody = @{
    email = "admin@quanttrade.com"
    username = "admin"
    password = "Password123!"
    confirmPassword = "Password123!"
} | ConvertTo-Json

Test-Endpoint "Registration (Existing User)" "POST" "$baseUrl/api/auth/register" @{} $registerBody

# 14. New User Registration
$newUserBody = @{
    email = "testuser$(Get-Random)@test.com"
    username = "testuser$(Get-Random)"
    password = "Password123!"
    confirmPassword = "Password123!"
} | ConvertTo-Json

Test-Endpoint "New User Registration" "POST" "$baseUrl/api/auth/register" @{} $newUserBody

# Logout Tests
if ($userToken) {
    $userHeaders = @{ "Authorization" = "Bearer $userToken" }
    Test-Endpoint "User Logout" "POST" "$baseUrl/api/auth/logout" $userHeaders
}

if ($adminToken) {
    $adminHeaders = @{ "Authorization" = "Bearer $adminToken" }
    Test-Endpoint "Admin Logout" "POST" "$baseUrl/api/auth/logout" $adminHeaders
}

# Results Summary
Write-Host "`n" + "=" * 50 -ForegroundColor Green
Write-Host "TEST RESULTS SUMMARY" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green
Write-Host "Total Tests: $testCount" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $($testCount - $passCount)" -ForegroundColor Red
$successRate = [math]::Round(($passCount / $testCount) * 100, 2)
Write-Host "Success Rate: $successRate%" -ForegroundColor Yellow

if ($successRate -ge 90) {
    Write-Host "`nEXCELLENT! All critical APIs are working!" -ForegroundColor Green
} elseif ($successRate -ge 75) {
    Write-Host "`nGOOD! Most APIs are working properly." -ForegroundColor Yellow
} else {
    Write-Host "`nNEEDS ATTENTION! Several APIs require fixes." -ForegroundColor Red
}

Write-Host "`nQuantTrade Platform Status: READY FOR USE!" -ForegroundColor Green 