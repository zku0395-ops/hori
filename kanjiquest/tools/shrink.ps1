# ChatGPT で 作った 絵（PNG）を 小さくして img/ に 入れます（すきとおった 背景は そのまま）。
# つかいかた：
#   powershell -NoProfile -ExecutionPolicy Bypass -File kanjiquest\tools\shrink.ps1 -Src "C:\Users\...\Downloads\絵.png" -Name mon_s2 -Max 512
#   -Name … img/ に 入れる 名前（.png は つけない）  -Max … 長い ほうの 辺の ピクセル（キャラ 512、背景 1280 が めやす）
param(
  [Parameter(Mandatory = $true)][string]$Src,
  [Parameter(Mandatory = $true)][string]$Name,
  [int]$Max = 512
)
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($Src)
try {
  $scale = [Math]::Min(1.0, $Max / [Math]::Max($img.Width, $img.Height))
  $w = [int][Math]::Round($img.Width * $scale)
  $h = [int][Math]::Round($img.Height * $scale)
  $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $g.DrawImage($img, 0, 0, $w, $h)
  $g.Dispose()
  $out = Join-Path (Join-Path $PSScriptRoot '..\img') ($Name + '.png')
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output ("{0}  {1}x{2}  {3:N0} KB" -f $out, $w, $h, ((Get-Item $out).Length / 1KB))
} finally { $img.Dispose() }
