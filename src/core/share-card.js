"use strict";

function graduationCardData(){
 const portrait=graduationPortrait();
 return {
  version:GAME_VERSION,
  name:S.name,
  title:portrait.title,
  score:portrait.score,
  stats:Object.entries(ATTRIBUTES).map(([key,item])=>({label:item.label,value:S.stats[key],initial:S.initialStats[key]})),
  traits:ownedTraitNames().map(name=>name+(S.acquiredTraits.includes(name)?"（后天）":"")).concat(activeHiddenTraitNames()),
  club:S.club||"没有固定社团",
  route:S.route||"仍在探索",
  routine:portrait.routine,
  project:portrait.project,
  relationships:portrait.relationships,
  rumors:portrait.rumors,
  unfinished:portrait.unfinished,
  closing:portrait.closing,
  seed:S.rng.seed
 };
}
function canvasTextLines(ctx,text,maxWidth){
 const lines=[];
 String(text||"").split("\n").forEach(paragraph=>{
  if(!paragraph){lines.push("");return;}
  let line="";
  for(const char of paragraph){
   const next=line+char;
   if(line&&ctx.measureText(next).width>maxWidth){lines.push(line);line=char;}
   else line=next;
  }
  if(line)lines.push(line);
 });
 return lines;
}
function drawCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines=99){
 const lines=canvasTextLines(ctx,text,maxWidth).slice(0,maxLines);
 lines.forEach((line,index)=>ctx.fillText(line,x,y+index*lineHeight));
 return y+lines.length*lineHeight;
}
function drawCardSection(ctx,title,text,y){
 ctx.fillStyle="#7b6e63";ctx.font="600 24px Microsoft YaHei, PingFang SC, sans-serif";
 ctx.fillText(title,78,y);
 ctx.fillStyle="#4c4844";ctx.font="24px Microsoft YaHei, PingFang SC, sans-serif";
 return drawCanvasText(ctx,text,78,y+42,924,38,6)+28;
}
function safeDownloadName(value){
 return String(value||"角色").replace(/[\\/:*?"<>|]/g,"_").slice(0,30);
}
function saveCanvasPng(canvas,filename){
 if(typeof canvas.toBlob==="function"){
  canvas.toBlob(blob=>{
   if(!blob){$("globalMessage").textContent="图片生成失败，请保留毕业页面截图。";return;}
   const url=URL.createObjectURL(blob),link=document.createElement("a");
   link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
  },"image/png");
  return;
 }
 const link=document.createElement("a");link.href=canvas.toDataURL("image/png");link.download=filename;document.body.appendChild(link);link.click();link.remove();
}
function downloadGraduationCard(){
 try{
  const data=graduationCardData();
  const canvas=document.createElement("canvas");
  canvas.width=1080;canvas.height=1720;
  const ctx=canvas.getContext&&canvas.getContext("2d");
  if(!ctx)throw new Error("当前浏览器不能生成图片。");
  ctx.fillStyle="#f1eee8";ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#496257";ctx.fillRect(0,0,canvas.width,18);
  ctx.fillStyle="#8b7b6c";ctx.font="22px Microsoft YaHei, PingFang SC, sans-serif";ctx.fillText("附中生活手记 · "+data.version,78,72);
  ctx.fillStyle="#373d39";ctx.font="600 52px Microsoft YaHei, PingFang SC, sans-serif";ctx.fillText(data.name+"的高中生活档案",78,145);
  ctx.fillStyle="#68746d";ctx.font="28px Microsoft YaHei, PingFang SC, sans-serif";ctx.fillText(data.title,78,197);
  ctx.fillStyle="#ffffff";ctx.fillRect(60,238,960,190);
  const boxWidth=176;
  data.stats.forEach((stat,index)=>{
   const x=78+index*190;
   ctx.fillStyle="#8a8178";ctx.font="20px Microsoft YaHei, PingFang SC, sans-serif";ctx.fillText(stat.label,x,282);
   ctx.fillStyle="#3e4943";ctx.font="600 42px Microsoft YaHei, PingFang SC, sans-serif";ctx.fillText(String(stat.value),x,337);
   ctx.fillStyle="#999087";ctx.font="16px Microsoft YaHei, PingFang SC, sans-serif";ctx.fillText("起点 "+stat.initial,x,371);
   if(index<4){ctx.fillStyle="#e7e1da";ctx.fillRect(x+boxWidth,270,1,110);}
  });
  ctx.fillStyle="#655d56";ctx.font="22px Microsoft YaHei, PingFang SC, sans-serif";
  ctx.fillText("毕业升学考试 "+data.score+" / 750",78,405);
  let y=484;
  y=drawCardSection(ctx,"走过的路线","社团："+data.club+"　路线："+data.route+"\n特质："+(data.traits.join("、")||"没有记录"),y);
  y=drawCardSection(ctx,"形成的生活方式",data.routine,y);
  y=drawCardSection(ctx,"完成过的事",data.project,y);
  y=drawCardSection(ctx,"留下的人",data.relationships.length?data.relationships.join("\n"):"几段关系仍停在没有说完的位置。",y);
  y=drawCardSection(ctx,"校园里的说法",data.rumors.length?data.rumors.map(item=>"“"+item+"”").join("　"):"没有形成稳定传闻。",y);
  y=drawCardSection(ctx,"没有完成的事情",data.unfinished,y);
  const closingY=Math.max(y+12,1390);
  ctx.fillStyle="#dfe8e1";ctx.fillRect(60,closingY,960,190);
  ctx.fillStyle="#3f5148";ctx.font="600 27px Microsoft YaHei, PingFang SC, sans-serif";
  drawCanvasText(ctx,data.closing,90,closingY+56,900,45,4);
  ctx.fillStyle="#93897e";ctx.font="16px Microsoft YaHei, PingFang SC, sans-serif";
  ctx.fillText("随机种子 "+data.seed+" · 相同选择会留下相同结果",78,1680);
  saveCanvasPng(canvas,"女高模拟器-"+GAME_VERSION+"-"+safeDownloadName(data.name)+"-毕业档案.png");
  $("globalMessage").textContent="毕业档案图片已经生成。";
 }catch(error){
  $("globalMessage").textContent=error.message||"无法生成毕业档案图片。";
 }
}
