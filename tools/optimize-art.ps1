Add-Type -AssemblyName System.Drawing
$assetRoot = Join-Path $PSScriptRoot '../assets'
foreach ($assetName in @('warrior','rogue','mage','goblin','skeleton','dragon','dungeon')) {
  $sourcePath = Join-Path $assetRoot ($assetName + '.png')
  $sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
  $limit = if ($assetName -eq 'dungeon') { 1280 } else { 640 }
  $scale = [Math]::Min([double]1.0, [double]$limit / [double][Math]::Max($sourceImage.Width, $sourceImage.Height))
  $width = [Math]::Max(1, [int]($sourceImage.Width * $scale))
  $height = [Math]::Max(1, [int]($sourceImage.Height * $scale))
  $bitmap = New-Object System.Drawing.Bitmap($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.DrawImage($sourceImage, 0, 0, $width, $height)
  $sourceImage.Dispose()
  $graphics.Dispose()
  $bitmap.Save($sourcePath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
  Write-Output ($assetName + ': ' + $width + 'x' + $height)
}
