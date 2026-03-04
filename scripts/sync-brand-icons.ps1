param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$logoPath = Join-Path $ProjectRoot "public\logo.jpg"
$iconDir = Join-Path $ProjectRoot "public\icon"
$faviconPath = Join-Path $ProjectRoot "src\app\favicon.ico"

if (!(Test-Path $logoPath)) {
  throw "Brand logo not found at: $logoPath"
}

if (!(Test-Path $iconDir)) {
  New-Item -ItemType Directory -Path $iconDir | Out-Null
}

function Save-ContainPng {
  param(
    [System.Drawing.Image]$SourceImage,
    [int]$Size,
    [double]$MarginRatio,
    [string]$OutputPath
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  $graphics.Clear([System.Drawing.Color]::White)

  $innerSize = $Size * (1 - (2 * $MarginRatio))
  $ratio = $SourceImage.Width / $SourceImage.Height
  $drawWidth = $innerSize
  $drawHeight = $innerSize / $ratio

  if ($drawHeight -gt $innerSize) {
    $drawHeight = $innerSize
    $drawWidth = $innerSize * $ratio
  }

  $offsetX = ($Size - $drawWidth) / 2
  $offsetY = ($Size - $drawHeight) / 2

  $graphics.DrawImage(
    $SourceImage,
    [System.Drawing.RectangleF]::new([single]$offsetX, [single]$offsetY, [single]$drawWidth, [single]$drawHeight)
  )

  $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Save-Favicon {
  param(
    [System.Drawing.Image]$SourceImage,
    [string]$OutputPath
  )

  $size = 64
  $marginRatio = 0.08
  $bitmap = New-Object System.Drawing.Bitmap($size, $size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.Clear([System.Drawing.Color]::White)

  $innerSize = $size * (1 - (2 * $marginRatio))
  $ratio = $SourceImage.Width / $SourceImage.Height
  $drawWidth = $innerSize
  $drawHeight = $innerSize / $ratio

  if ($drawHeight -gt $innerSize) {
    $drawHeight = $innerSize
    $drawWidth = $innerSize * $ratio
  }

  $offsetX = ($size - $drawWidth) / 2
  $offsetY = ($size - $drawHeight) / 2

  $graphics.DrawImage(
    $SourceImage,
    [System.Drawing.RectangleF]::new([single]$offsetX, [single]$offsetY, [single]$drawWidth, [single]$drawHeight)
  )

  $iconHandle = $bitmap.GetHicon()
  $icon = [System.Drawing.Icon]::FromHandle($iconHandle)
  $stream = [System.IO.File]::Open($OutputPath, [System.IO.FileMode]::Create)
  $icon.Save($stream)

  $stream.Close()
  $icon.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

$logoImage = [System.Drawing.Image]::FromFile($logoPath)

try {
  Save-ContainPng -SourceImage $logoImage -Size 192 -MarginRatio 0.06 -OutputPath (Join-Path $iconDir "icon-192x192.png")
  Save-ContainPng -SourceImage $logoImage -Size 512 -MarginRatio 0.06 -OutputPath (Join-Path $iconDir "icon-512x512.png")
  Save-ContainPng -SourceImage $logoImage -Size 180 -MarginRatio 0.06 -OutputPath (Join-Path $iconDir "apple-touch-icon.png")

  # Compatibility for existing references.
  Copy-Item -Path (Join-Path $iconDir "icon-192x192.png") -Destination (Join-Path $iconDir "icon-192x193.png") -Force

  Save-Favicon -SourceImage $logoImage -OutputPath $faviconPath
}
finally {
  $logoImage.Dispose()
}

Write-Host "Brand icons synced from public/logo.jpg"
