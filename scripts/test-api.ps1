param(
    [string]$BaseUrl = "http://127.0.0.1:8080"
)

$ErrorActionPreference = "Stop"

$username = "smoke_$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
$password = "Test123!"
$authUrl = "$BaseUrl/api/auth"

function Invoke-JsonPost {
    param(
        [string]$Uri,
        [hashtable]$Body,
        [int]$ExpectedStatus
    )

    try {
        $response = Invoke-WebRequest `
            -UseBasicParsing `
            -Method Post `
            -Uri $Uri `
            -ContentType "application/json" `
            -Body ($Body | ConvertTo-Json)

        $status = [int]$response.StatusCode
        $content = $response.Content
    }
    catch {
        if ($null -eq $_.Exception.Response) {
            throw
        }

        $status = [int]$_.Exception.Response.StatusCode
        $content = $_.ErrorDetails.Message
    }

    if ($status -ne $ExpectedStatus) {
        throw "Expected HTTP $ExpectedStatus from $Uri but received $status. Body: $content"
    }

    return [PSCustomObject]@{
        Status = $status
        Body = $content
    }
}

Write-Host "Testing API at $BaseUrl" -ForegroundColor Cyan
Write-Host "Generated username: $username"

$credentials = @{ username = $username; password = $password }

$register = Invoke-JsonPost `
    -Uri "$authUrl/register" `
    -Body $credentials `
    -ExpectedStatus 200
$registerJson = $register.Body | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace($registerJson.token)) {
    throw "Registration succeeded but did not return a JWT."
}
Write-Host "PASS register: HTTP 200 and JWT returned" -ForegroundColor Green

$login = Invoke-JsonPost `
    -Uri "$authUrl/login" `
    -Body $credentials `
    -ExpectedStatus 200
$loginJson = $login.Body | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace($loginJson.token)) {
    throw "Login succeeded but did not return a JWT."
}
Write-Host "PASS login: HTTP 200 and JWT returned" -ForegroundColor Green

Invoke-JsonPost `
    -Uri "$authUrl/login" `
    -Body @{ username = $username; password = "Wrong123!" } `
    -ExpectedStatus 401 | Out-Null
Write-Host "PASS wrong password: HTTP 401" -ForegroundColor Green

Invoke-JsonPost `
    -Uri "$authUrl/register" `
    -Body $credentials `
    -ExpectedStatus 400 | Out-Null
Write-Host "PASS duplicate username: HTTP 400" -ForegroundColor Green

Invoke-JsonPost `
    -Uri "$authUrl/register" `
    -Body @{ username = "x"; password = "123" } `
    -ExpectedStatus 400 | Out-Null
Write-Host "PASS invalid request: HTTP 400" -ForegroundColor Green

Write-Host "All API smoke tests passed." -ForegroundColor Green
