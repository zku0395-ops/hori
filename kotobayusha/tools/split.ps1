# Split a sheet image into cells. -Transparent: make white background transparent and trim (characters).
param(
  [Parameter(Mandatory)][string]$In,
  [int]$Cols = 3,
  [int]$Rows = 2,
  [Parameter(Mandatory)][string[]]$Out,
  [switch]$Transparent,
  [int]$Inset = 6
)
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System; using System.Drawing; using System.Drawing.Imaging; using System.Collections.Generic;
public static class Sheet {
  static bool White(Color c, int t){ return c.R>=t && c.G>=t && c.B>=t; }
  public static void Cut(string src, int cols, int rows, string[] outs, bool transparent, int inset){
    using (var bmp = new Bitmap(src)) {
      int cw = bmp.Width / cols, ch = bmp.Height / rows, k = 0;
      for (int r = 0; r < rows; r++) for (int c = 0; c < cols; c++, k++) {
        if (k >= outs.Length || string.IsNullOrEmpty(outs[k]) || outs[k] == "-") continue;
        var rect = new Rectangle(c*cw + inset, r*ch + inset, cw - inset*2, ch - inset*2);
        using (var cell = bmp.Clone(rect, PixelFormat.Format32bppArgb)) {
          if (!transparent) { cell.Save(outs[k], ImageFormat.Png); continue; }
          int w = cell.Width, h = cell.Height;
          var px = new Color[w,h]; for (int x=0;x<w;x++) for (int y=0;y<h;y++) px[x,y]=cell.GetPixel(x,y);
          var bg = new bool[w,h]; var q = new Queue<Point>();
          for (int x=0;x<w;x++){ q.Enqueue(new Point(x,0)); q.Enqueue(new Point(x,h-1)); }
          for (int y=0;y<h;y++){ q.Enqueue(new Point(0,y)); q.Enqueue(new Point(w-1,y)); }
          while (q.Count>0){ var p=q.Dequeue(); if(p.X<0||p.Y<0||p.X>=w||p.Y>=h||bg[p.X,p.Y]) continue;
            if(!White(px[p.X,p.Y],232)) continue; bg[p.X,p.Y]=true;
            q.Enqueue(new Point(p.X+1,p.Y)); q.Enqueue(new Point(p.X-1,p.Y)); q.Enqueue(new Point(p.X,p.Y+1)); q.Enqueue(new Point(p.X,p.Y-1)); }
          int minX=w,minY=h,maxX=-1,maxY=-1;
          for (int x=0;x<w;x++) for (int y=0;y<h;y++){
            if (bg[x,y]) cell.SetPixel(x,y,Color.Transparent);
            else { if(x<minX)minX=x; if(y<minY)minY=y; if(x>maxX)maxX=x; if(y>maxY)maxY=y; } }
          if (maxX<0){ cell.Save(outs[k], ImageFormat.Png); continue; }
          int pad=8; minX=Math.Max(0,minX-pad); minY=Math.Max(0,minY-pad); maxX=Math.Min(w-1,maxX+pad); maxY=Math.Min(h-1,maxY+pad);
          int side=Math.Max(maxX-minX+1,maxY-minY+1);
          using (var o = new Bitmap(side, side, PixelFormat.Format32bppArgb)) using (var g = Graphics.FromImage(o)) {
            g.Clear(Color.Transparent);
            g.DrawImage(cell, new Rectangle((side-(maxX-minX+1))/2, side-(maxY-minY+1), maxX-minX+1, maxY-minY+1),
              new Rectangle(minX,minY,maxX-minX+1,maxY-minY+1), GraphicsUnit.Pixel);
            o.Save(outs[k], ImageFormat.Png);
          }
        }
      }
    }
  }
}
"@
$Out = @($Out | ForEach-Object { $_ -split "," })
$full = $Out | ForEach-Object { if ($_ -eq '-') { '-' } else { [IO.Path]::GetFullPath($_) } }
[Sheet]::Cut([IO.Path]::GetFullPath($In), $Cols, $Rows, $full, [bool]$Transparent, $Inset)
"done: " + ($full -ne '-').Count
