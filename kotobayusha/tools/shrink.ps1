# Make images light: PNG scenes -> JPG (max side), characters -> smaller PNG.
param([string]$Root = "images")
Add-Type -AssemblyName System.Drawing
$jpg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters 1
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 82L
function Resize($path, $max, $outPath, $asJpg) {
  $src = [System.Drawing.Image]::FromFile((Resolve-Path $path))
  $s = [Math]::Min(1.0, $max / [Math]::Max($src.Width, $src.Height))
  $w = [int]($src.Width * $s); $h = [int]($src.Height * $s)
  $fmt = if ($asJpg) { [System.Drawing.Imaging.PixelFormat]::Format24bppRgb } else { [System.Drawing.Imaging.PixelFormat]::Format32bppArgb }
  $bmp = New-Object System.Drawing.Bitmap $w, $h, $fmt
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'
  if ($asJpg) { $g.Clear([System.Drawing.Color]::White) }
  $g.DrawImage($src, 0, 0, $w, $h); $g.Dispose(); $src.Dispose()
  if ($asJpg) { $bmp.Save($outPath, $jpg, $ep) } else { $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png) }
  $bmp.Dispose()
}
foreach ($d in @(@{dir="q";max=600}, @{dir="area";max=1280})) {
  Get-ChildItem "$Root/$($d.dir)/*.png" | ForEach-Object {
    Resize $_.FullName $d.max ([IO.Path]::ChangeExtension($_.FullName, '.jpg')) $true; Remove-Item $_.FullName }
}
foreach ($f in @("map.png", "title.png")) { if (Test-Path "$Root/$f") { $p = (Resolve-Path "$Root/$f").Path; Resize $p 1600 ([IO.Path]::ChangeExtension($p, '.jpg')) $true; Remove-Item $p } }
foreach ($d in @("hero", "monster")) {
  Get-ChildItem "$Root/$d/*.png" | ForEach-Object { $t = $_.FullName + ".tmp.png"; Resize $_.FullName 360 $t $false; Move-Item -Force $t $_.FullName }
}
"ok"
