# Make app icons from a hero image on a sky circle background.
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile((Resolve-Path "images/hero/h1.png"))
foreach ($n in 192, 512) {
  $b = New-Object System.Drawing.Bitmap $n, $n
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = 'AntiAlias'; $g.InterpolationMode = 'HighQualityBicubic'
  $g.Clear([System.Drawing.Color]::FromArgb(255, 191, 230, 255))
  $br = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 254, 246, 221))
  $m = [int]($n * 0.1); $g.FillEllipse($br, $m, $m, $n - 2 * $m, $n - 2 * $m)
  $s = [int]($n * 0.72); $o = [int](($n - $s) / 2)
  $g.DrawImage($src, $o, [int]($o * 1.1), $s, $s)
  $g.Dispose(); $b.Save((Join-Path (Get-Location) "images/icon-$n.png"), [System.Drawing.Imaging.ImageFormat]::Png); $b.Dispose()
}
$src.Dispose(); "ok"
