// 切った絵を 紺色の背景に ならべた見本を作る：node sheet.js 出力.png 絵1.webp 絵2.webp ...（sharp を使う）
const sharp=require('sharp');(async()=>{const [out,...f]=process.argv.slice(2);const s=300;
await sharp({create:{width:s*f.length,height:s,channels:4,background:'#1e293b'}}).composite(await Promise.all(f.map(async(p,i)=>({input:await sharp(p).resize(s,s).toBuffer(),left:i*s,top:0})))).png().toFile(out);})();
