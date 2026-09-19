"use strict";
// 无第三方依赖的离线发行文件；src/ 仍是唯一源码，单文件由此生成。
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const output=path.resolve(process.argv[2]||path.join(root,"..","release","女高模拟器-v0.5.1.html"));
let html=fs.readFileSync(path.join(root,"index.html"),"utf8");
html=html.replace('<link rel="stylesheet" href="./styles.css">',"<style>\n"+fs.readFileSync(path.join(root,"styles.css"),"utf8")+"\n</style>");
html=html.replace(/<script src="([^"]+)"><\/script>/g,(_,file)=>"<script>\n"+fs.readFileSync(path.resolve(root,file),"utf8").replace(/<\/script/gi,"<\\/script")+"\n</script>");
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,html);
console.log("Built "+output+" ("+Buffer.byteLength(html)+" bytes)");
