$url = "http://tkt-tsg-alb-761412931.ap-south-1.elb.amazonaws.com/"
$response = Invoke-WebRequest -Uri $url -UseBasicParsing

if ($response.StatusCode -eq 200) {
    Write-Host "PASS: HTTP 200 OK" -ForegroundColor Green
} else {
    Write-Host "FAIL: Got status $($response.StatusCode)" -ForegroundColor Red
    exit 1
}

if ($response.Content -match "Tickette") {
    Write-Host "PASS: App content found" -ForegroundColor Green
} else {
    Write-Host "FAIL: Expected content not found" -ForegroundColor Red
    exit 1
}

Write-Host "Smoke test passed."