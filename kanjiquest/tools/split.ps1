# ChatGPT で 1まいに ならべて 作った 絵（たて・よこに ならんだ キャラ）を、1たいずつ 切りわけて img/ に 入れます。
# すきとおった まわりを けずって、正方形に して から 小さく します。
# つかいかた：
#   powershell -NoProfile -ExecutionPolicy Bypass -File kanjiquest\tools\split.ps1 -Src "C:\...\Downloads\まもの.png" -Cols 3 -Rows 3 -Names "mon_s3,mon_s4,mon_s5,mon_s6,mon_s7,mon_s8,mon_s9,mon_s10,mon_s11" -Max 512
#   -Names … 左上から 右へ、つぎの だんへ の じゅんばん（とばす ときは 空に する 例："a,,c"）
param(
  [Parameter(Mandatory = $true)][string]$Src,
  [int]$Cols = 3,
  [int]$Rows = 3,
  [Parameter(Mandatory = $true)][string]$Names,
  [int]$Max = 512,
  [switch]$NoTrim   # 背景の 絵など：けずらずに マスの まま 切りとる（-Inset で ふちを すこし おとす）
  , [int]$Inset = 6
)
Add-Type -AssemblyName System.Drawing
$list = $Names.Split(',')
$img = [System.Drawing.Bitmap]::FromFile($Src)
try {
  $cw = [Math]::Floor($img.Width / $Cols)
  $ch = [Math]::Floor($img.Height / $Rows)
  $outDir = Join-Path $PSScriptRoot '..\img'
  for ($i = 0; $i -lt $list.Length; $i++) {
    $name = $list[$i].Trim()
    if (-not $name) { continue }
    $cx = ($i % $Cols) * $cw
    $cy = [Math]::Floor($i / $Cols) * $ch
    if ($NoTrim) {
      $sw = $cw - 2 * $Inset; $sh = $ch - 2 * $Inset
      $sc = [Math]::Min(1.0, $Max / [Math]::Max($sw, $sh))
      $ow = [int]($sw * $sc); $oh = [int]($sh * $sc)
      $bmp = New-Object System.Drawing.Bitmap $ow, $oh
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $ow, $oh), (New-Object System.Drawing.Rectangle ($cx + $Inset), ($cy + $Inset), $sw, $sh), [System.Drawing.GraphicsUnit]::Pixel)
      $g.Dispose()
      $out = Join-Path $outDir ($name + '.jpg')
      $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Jpeg)
      $bmp.Dispose()
      Write-Output ("{0}  {1}x{2}  {3:N0} KB" -f $name, $ow, $oh, ((Get-Item $out).Length / 1KB))
      continue
    }
    # すきとおって いない ところの はんいを さがす（4ピクセルおきに しらべる）
    $minX = $cw; $minY = $ch; $maxX = -1; $maxY = -1
    for ($y = 0; $y -lt $ch; $y += 4) {
      for ($x = 0; $x -lt $cw; $x += 4) {
        if ($img.GetPixel($cx + $x, $cy + $y).A -gt 40) {
          if ($x -lt $minX) { $minX = $x }; if ($x -gt $maxX) { $maxX = $x }
          if ($y -lt $minY) { $minY = $y }; if ($y -gt $maxY) { $maxY = $y }
        }
      }
    }
    if ($maxX -lt 0) { Write-Output "$name：絵が 見つかりません"; continue }
    $minX = [Math]::Max(0, $minX - 6); $minY = [Math]::Max(0, $minY - 6)
    $maxX = [Math]::Min($cw - 1, $maxX + 6); $maxY = [Math]::Min($ch - 1, $maxY + 6)
    $w = $maxX - $minX + 1; $h = $maxY - $minY + 1
    $side = [Math]::Max($w, $h)
    $size = [Math]::Min($Max, $side)
    $scale = $size / $side
    $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $dw = $w * $scale; $dh = $h * $scale
    $dest = New-Object System.Drawing.RectangleF ((($size - $dw) / 2), ($size - $dh), $dw, $dh)
    $srcR = New-Object System.Drawing.RectangleF (($cx + $minX), ($cy + $minY), $w, $h)
    $g.DrawImage($img, $dest, $srcR, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $out = Join-Path $outDir ($name + '.png')
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output ("{0}  {1}x{1}  {2:N0} KB" -f $name, $size, ((Get-Item $out).Length / 1KB))
  }
} finally { $img.Dispose() }
