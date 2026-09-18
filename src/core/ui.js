"use strict";

function relationLabel(value){
 const relation=Number(value);
 if(relation<=-2)return "明显警惕";
 if(relation<=0)return "有些尴尬";
 if(relation<3)return "刚认识";
 if(relation<5)return "熟悉起来了";
 if(relation<8)return "关系不错";
 return "非常亲近";
}

function update(){
 $("charm").textContent=S.stats.charm;$("intel").textContent=S.stats.intel;
 $("health").textContent=S.stats.health;$("money").textContent=S.stats.money;
 $("monthLabel").textContent=S.term+(S.month?(" · "+S.month+"月"):"");
 const traitBadges=typeof getVisibleTraitBadges==="function"
   ?getVisibleTraitBadges()
   :S.traits.map(i=>({label:S.pool[i][0],className:"",title:""}));
 const interestBadges=S.interests.map(label=>({label,className:"",title:""}));
 $("buffs").innerHTML=[...traitBadges,...interestBadges].map(item=>{
   const cls=item.className?` ${esc(item.className)}`:"";
   const title=item.title?` title="${esc(item.title)}"`:"";
   return `<span class="buff${cls}"${title}>${esc(item.label)}</span>`;
 }).join("");
 $("npcList").innerHTML=S.npcs.length?S.npcs.map(n=>{
    const d=NPCS[n],r=getRelation(n);
    return `<div class="npc"><b>${esc(n)}</b><span>${esc(d.tag)}<br>${esc(d.desc)}<br>关系：${esc(relationLabel(r))}</span></div>`;
 }).join(""):"<div class='notice'>暂时还没有特别认识的人。</div>";
}

function renderPool(){
 // 0.3 机制样板期间固定让“癫佬”进入候选池，方便不用反复刷新就能试玩新系统。
 const featured=TRAITS.find(trait=>trait[0]==="癫佬");
 const others=TRAITS.filter(trait=>trait!==featured);
 S.pool=shuffle(featured?[featured,...shuffle(others).slice(0,9)]:shuffle(others).slice(0,10));S.traits=[];
 $("traitPool").innerHTML=S.pool.map((t,i)=>`<div class="trait" data-i="${i}" onclick="toggleTrait(${i})"><b>${esc(t[0])}</b><span>${esc(t[1])}</span></div>`).join("");
}
function toggleTrait(i){
 const e=document.querySelector(`[data-i="${i}"]`);
 if(S.traits.includes(i)){S.traits=S.traits.filter(x=>x!==i);e.classList.remove("selected");}
 else if(S.traits.length<3){S.traits.push(i);e.classList.add("selected");}
}

/**
 * 显示一段事件和它的选项。
 * 选项格式：[按钮文字, 默认结果文字, 可选的效果函数, 可选的界面元数据]
 * 效果函数返回字符串时优先显示该字符串；未返回时显示默认结果文字。
 * context 用来描述当前事件环境，特质系统会据此追加至多一个专属选项。
 */
function showChoices(tag,title,text,choices,next,context={}){
 const box=$("choices");
 $("tag").textContent=tag||"";
 $("title").textContent=title||"";
 $("text").textContent=text||"";
 box.innerHTML="";

 const list=typeof injectTraitChoices==="function"
   ?injectTraitChoices(choices,context)
   :(Array.isArray(choices)?choices:[]);
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
   if(c&&c[3]&&c[3].className)b.classList.add(c[3].className);
   b.onclick=()=>{
     if(locked)return;
     locked=true;
     [...box.querySelectorAll("button")].forEach(x=>x.disabled=true);
     box.innerHTML="";
     let result="";
     try{
       if(c&&typeof c[2]==="function")result=c[2]({
         next:()=>safeNext(next),
         context,
         choice:c
       });
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

// 用于成绩单、阶段小结等“阅读后继续”的页面，避免把“收好/继续”拆成两次点击。
function showContinueScreen(tag,title,text,buttonText,next){
 const box=$("choices");
 $("tag").textContent=tag||"";
 $("title").textContent=title||"";
 $("text").textContent=text||"";
 box.innerHTML="";
 const button=document.createElement("button");
 button.className="primary";button.type="button";button.textContent=buttonText||"继续";
 button.onclick=()=>{if(button.disabled)return;button.disabled=true;box.innerHTML="";safeNext(next)};
 box.appendChild(button);
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
