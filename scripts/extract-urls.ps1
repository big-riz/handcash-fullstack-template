$content = Get-Content "C:\Users\Miker\Documents\GitHub\squatzonedeuce\handcash-fullstack-template\conv.txt" -Raw

# Remove line numbers like "  123->" at start of lines
$content = $content -replace "(?m)^\s*\d+\s*-?>?\s*", ""

# Join continuation lines (lines starting with whitespace after URL start)
$content = $content -replace "`r?`n\s{2,}", ""

$pattern = 'https://minimax-algeng-chat-tts-us\.oss-us-east-1\.aliyuncs\.com/audio%2Ftts-[a-zA-Z0-9\-]+\.mp3\?Expires=\d+&OSSAccessKeyId=[^&]+&Signature=[^&\s"]+'
$matches = [regex]::Matches($content, $pattern)
Write-Output "Found $($matches.Count) URLs"
foreach ($m in $matches) {
    Write-Output $m.Value
}
