"use strict";

function update(){
 $("charm").textContent=S.stats.charm;$("intel").textContent=S.stats.intel;
 $("health").textContent=S.stats.health;$("money").textContent=S.stats.money;
 $("monthLabel").textContent=S.term+(S.month?(" · "+S.month+"月"):"");
 $("buffs").innerHTML=[...S.traits.map(i=>S.pool[i][0]),...S.interests].map(x=>`<span class="buff">${esc(x)}</span>`).join("");
 $("npcList").innerHTML=S.npcs.length?S.npcs.map(n=>{
   const d=NPCS[n],r=S.npcRelation[n]||1;
   return `<div class="npc"><b>${esc(n)}</b><span>${esc(d.tag)}<br>${esc(d.desc)}<br>关系：${r>=5?"关系不错":r>=3?"熟悉起来了":"刚认识"}</span></div>`;
 }).join(""):"<div class='notice'>暂时还没有特别认识的人。</div>";
}

function renderPool(){
 S.pool=shuffle(TRAITS).slice(0,10);S.traits=[];
 $("traitPool").innerHTML=S.pool.map((t,i)=>`<div class="trait" data-i="${i}" onclick="toggleTrait(${i})"><b>${esc(t[0])}</b><span>${esc(t[1])}</span></div>`).join("");
}
function toggleTrait(i){
 const e=document.querySelector(`[data-i="${i}"]`);
 if(S.traits.includes(i)){S.traits=S.traits.filter(x=>x!==i);e.classList.remove("selected");}
 else if(S.traits.length<3){S.traits.push(i);e.classList.add("selected");}
}

/**
 * 显示一段事件和它的选项。
 * 选项格式：[按钮文字, 默认结果文字, 可选的效果函数]
 * 效果函数返回字符串时优先显示该字符串；未返回时显示默认结果文字。
 */
function showChoices(tag,title,text,choices,next){
 const box=$("choices");
 $("tag").textContent=tag||"";
 $("title").textContent=title||"";
 $("text").textContent=text||"";
 box.innerHTML="";

 const list=Array.isArray(choices)?choices:[];
 if(!list.length){
   const n=document.createElement("button");
   n.className="primary";n.type="button";n.textContent="继续";
   n.onclick=()=>{n.disabled=true;box.innerHTML="";safeNext(next)};
   box.appendChild(n);update();return;
 }

 let locked=false;
 list.forEach((c)=>{
   const b=document.createElement("button");
   b.type="button";b.textContent=c&&c[0]?c[0]:"继续";
   b.onclick=()=>{
     if(locked)return;
     locked=true;
     [...box.querySelectorAll("button")].forEach(x=>x.disabled=true);
     box.innerHTML="";
     let result="";
     try{
       if(c&&typeof c[2]==="function")result=c[2]();
     }catch(e){
       console.error("事件选项执行失败：",e);
       result="这一段出现了小故障，但你的选择已经生效。";
     }
     if(result==="HANDLED")return;

     // 原草稿存了大量 c[1] 结果文字，但通用界面没有显示它们。
     // 这里在效果函数没有返回文字时使用 c[1]，让选择真正得到反馈。
     if(!(typeof result==="string"&&result)&&c&&typeof c[1]==="string")result=c[1];
     if(typeof result==="string"&&result)$("text").textContent=result;

     const n=document.createElement("button");
     n.className="primary";n.type="button";n.textContent="继续";
     n.onclick=()=>{if(n.disabled)return;n.disabled=true;box.innerHTML="";safeNext(next)};
     box.appendChild(n);
     update();
   };
   box.appendChild(b);
 });
 update();
}

function safeNext(next){
 try{
   if(typeof next==="function")next();
   else finishMonth();
 }catch(e){
   console.error("事件继续流程失败：",e);
   const box=$("choices");box.innerHTML="";
   $("tag").textContent="继续游戏";
   $("title").textContent="事件已经结束";
   $("text").textContent="刚才的事件已经记录下来，现在继续高中生活。";
   const n=document.createElement("button");n.className="primary";n.type="button";n.textContent="继续游戏";
   n.onclick=()=>{n.disabled=true;box.innerHTML="";try{finishMonth()}catch(_){location.reload()}};
   box.appendChild(n);
 }
}
