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
 if(typeof normalizeSchoolLifeState==="function")normalizeSchoolLifeState();
 document.body.setAttribute("data-year",String(S.year||1));
 Object.keys(ATTRIBUTES).forEach(key=>{
  $(key).textContent=S.stats[key];
  if(key!=="appearance")$("xp"+key[0].toUpperCase()+key.slice(1)).textContent=`经验 ${S.growth.xp[key]||0}/4`;
 });
 $("appearanceNote").textContent=S.flags.groomingMonth===monthKey()?`仪容 ${formatSigned(S.flags.grooming||0)}`:"缓慢变化";
 $("monthLabel").textContent=S.term+(S.month?(" · "+S.month+"月"):"");
 $("stageLabel").textContent=CALENDAR[S.calendarIndex]?.stage||"毕业";
 $("countdown").textContent=S.phase==="graduated"?"高中生活已经写到最后一页":S.year===3?"距离毕业还有 "+Math.max(1,CALENDAR.length-S.calendarIndex)+" 个月":S.year===2?"生活习惯试验期":"还在认识这所学校";
 $("timelineFill").style.width=`${Math.round((S.calendarIndex+1)/CALENDAR.length*100)}%`;
 $("pageMark").textContent=`${String(S.calendarIndex+1).padStart(2,"0")} / ${CALENDAR.length}`;
 $("resourceRow").innerHTML=`<span>家境 · ${esc(FAMILY_BACKGROUNDS[S.family]?.label||"普通")}</span><span>零花钱 ${S.resources.cash}</span><span class="${S.resources.energy<30?"resource-warning":""}">精力 ${S.resources.energy}/100</span><span class="${S.resources.stress>=65?"resource-warning":""}">压力 ${S.resources.stress}/100</span>`;
 const routineVisible=Boolean(S.habits&&S.habits.configured&&S.year>=2);
 $("routineRow").classList.toggle("hidden",!routineVisible);
 $("routineRow").innerHTML=routineVisible?HABIT_SLOT_ORDER.map(slot=>{
   const item=habitDefinition(slot,S.habits[slot]);
   const locked=S.year===3&&S.habits.locked.includes(slot)?" · 已锁定":" · "+habitStatus(slot);
   return `<span title="${esc(item.desc)}"><b>${esc(HABIT_SLOTS[slot].label)}</b> ${esc(item.label+locked)}</span>`;
 }).join(""):"";
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
    const goal=typeof npcGoal==="function"?npcGoal(n):d.tag;
    return `<div class="npc"><b>${esc(n)}</b><span>${esc(relationLabel(r))} · 信任 ${S.npcTrust[n]||0}<br><span class="npc-goal">${esc(goal)}</span></span></div>`;
 }).join(""):"<div class='notice'>暂时还没有特别认识的人。</div>";
 $("ongoing").innerHTML=[`社团：${S.club||"还没有决定"}`,`路线：${S.route||"探索中"}`,
  S.project?`共同项目：${S.project.name} · ${S.project.progress}份进展${S.project.result?` · ${S.project.result}`:""}`:"高二会开始一项共同项目。",
  routineVisible?"生活习惯："+habitSummaryText():"",
  S.rumors&&S.rumors.some(record=>record.heard)?"校园传闻："+rumorSummaryText():"",
  S.memories.length?S.memories[S.memories.length-1].text:"还没有留下特别的记忆。"
 ].filter(Boolean).map(line=>`<div class="ongoing-line">${esc(line)}</div>`).join("");
 const forumVisible=S.year>=2||S.phase==="graduated";
 $("forumCard").classList.toggle("hidden",!forumVisible);
 const posts=(S.forumPosts||[]).slice(-6).reverse();
 $("forumCount").textContent=forumVisible?" · "+posts.length+"条近帖":"";
 $("forumList").innerHTML=posts.length?posts.map(post=>`<article class="forum-post ${post.kind==="rumor"?"hot":""}"><b>${esc(post.title)}</b><span>${esc(post.text)}</span><small>${["","高一","高二","高三"][post.year]||""} · ${post.month}月</small></article>`).join(""):"<p class='notice'>暂时没有新帖子。</p>";
 if(typeof chaosEvolutionEligibility==="function")$("debugInfo").textContent=`${S.debug?"调试局（不写入正常存档）":"正常游戏"} · 种子 ${S.rng.seed}\n癫值 ${getTraitXp("癫佬")}；人物 ${S.traitMilestones.npcs.length}；场景 ${S.traitMilestones.scenes.length}\n传闻 ${(S.rumors||[]).filter(r=>r.heard).length}/${RUMOR_DEFS.length}\n${routineVisible?habitSummaryText()+"\n":""}进化条件：${JSON.stringify(chaosEvolutionEligibility())}`;
}

function renderPool(){
 // 0.3 机制样板期间固定让“癫佬”进入候选池，方便不用反复刷新就能试玩新系统。
 const featured=TRAITS.find(trait=>trait[0]==="癫佬");
 const others=TRAITS.filter(trait=>trait!==featured);
 S.pool=shuffle(featured?[featured,...shuffle(others).slice(0,9)]:shuffle(others).slice(0,10));S.traits=[];
 $("traitPool").innerHTML=S.pool.map((t,i)=>`<button type="button" class="trait" data-i="${i}" aria-pressed="false" onclick="toggleTrait(${i})"><b>${esc(t[0])}</b><span>${esc(t[1])}</span></button>`).join("");
}
function toggleTrait(i){
 const e=document.querySelector(`[data-i="${i}"]`);
 if(S.traits.includes(i)){S.traits=S.traits.filter(x=>x!==i);e.classList.remove("selected");}
 else if(S.traits.length<3){S.traits.push(i);e.classList.add("selected");}
 e.setAttribute("aria-pressed",String(S.traits.includes(i)));
}

/**
 * 显示一段事件和它的选项。
 * 选项格式：[按钮文字, 默认结果文字, 可选的效果函数, 可选的界面元数据]
 * 效果函数返回字符串时优先显示该字符串；未返回时显示默认结果文字。
 * context 描述环境；特质系统最多替换一个明确标为 replaceable 的选项。
 */
function showChoices(tag,title,text,choices,next,context={}){
 const box=$("choices");
 resetScreenActions();
 $("effectFeedback").innerHTML="";
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
   bindAction(n,`continue:${tag}:${title}`,()=>{n.disabled=true;box.innerHTML="";safeNext(next)});
   box.appendChild(n);update();return;
 }

 let locked=false;
 list.forEach((c,index)=>{
   const b=document.createElement("button");
   b.type="button";b.textContent=c&&c[0]?c[0]:"继续";
   if(c&&c[3]&&c[3].className)b.classList.add(c[3].className);
   const meta=c&&c[3]||{};
   b.disabled=Boolean(meta.disabled);
   if(meta.hint)b.title=meta.hint;
   if(meta.replacedLabel)b.title=`特质改写：本次替代「${meta.replacedLabel}」。不获得原选项的收益。`;
   bindAction(b,`choice:${context.eventId||tag+":"+title}:${meta.choiceId||meta.id||index}`,()=>{
     if(locked)return;
     locked=true;
     const before=effectSnapshot();
     [...box.querySelectorAll("button")].forEach(x=>x.disabled=true);
     box.innerHTML="";
     let result="";
       if(c&&typeof c[2]==="function")result=c[2]({
         next:()=>safeNext(next),
         context,
         choice:c
       });
     if(result==="HANDLED")return;

     // 原草稿存了大量 c[1] 结果文字，但通用界面没有显示它们。
     // 这里在效果函数没有返回文字时使用 c[1]，让选择真正得到反馈。
     if(!(typeof result==="string"&&result)&&c&&typeof c[1]==="string")result=c[1];
     if(typeof result==="string"&&result)$("text").textContent=result;
     showEffectFeedback(before);

     resetScreenActions();
     const n=document.createElement("button");
     n.className="primary";n.type="button";n.textContent="继续";
     bindAction(n,`result:${context.eventId||tag+":"+title}`,()=>{if(n.disabled)return;n.disabled=true;box.innerHTML="";safeNext(next)});
     box.appendChild(n);
     update();
   });
   box.appendChild(b);
 });
 update();
}

// 用于成绩单、阶段小结等“阅读后继续”的页面，避免把“收好/继续”拆成两次点击。
function showContinueScreen(tag,title,text,buttonText,next){
 const box=$("choices");
 resetScreenActions();
 $("effectFeedback").innerHTML="";
 $("tag").textContent=tag||"";
 $("title").textContent=title||"";
 $("text").textContent=text||"";
 box.innerHTML="";
 const button=document.createElement("button");
 button.className="primary";button.type="button";button.textContent=buttonText||"继续";
 bindAction(button,`continue:${tag}:${title}`,()=>{if(button.disabled)return;button.disabled=true;box.innerHTML="";safeNext(next)});
 box.appendChild(button);
 update();
}

function safeNext(next){
   if(typeof next==="function")next();
   else finishMonth();
}

function effectSnapshot(){return JSON.parse(JSON.stringify({stats:S.stats,xp:S.growth.xp,resources:S.resources,relations:S.npcRelation,trust:S.npcTrust,memories:S.memories.length,progress:S.project?.progress||0}));}
function showEffectFeedback(before){
 const items=[];
 const add=(label,delta,negative=delta<0)=>{if(delta)items.push({label:label+formatSigned(delta),negative});};
 Object.entries(ATTRIBUTES).forEach(([key,rule])=>{
  add(rule.label,S.stats[key]-(before.stats[key]||0));
  if(S.stats[key]===before.stats[key])add(rule.label+"经验",(S.growth.xp[key]||0)-(before.xp[key]||0));
 });
 Object.entries({cash:"零花钱",energy:"精力",stress:"压力"}).forEach(([key,label])=>add(label,S.resources[key]-before.resources[key],key==="stress"?S.resources[key]>before.resources[key]:S.resources[key]<before.resources[key]));
 S.npcs.forEach(name=>{add(name+"关系",getRelation(name)-(before.relations[name]??1));add(name+"信任",(S.npcTrust[name]||0)-(before.trust[name]||0));});
 add("项目进展",(S.project?.progress||0)-before.progress);
 if(S.memories.length>before.memories)items.push({label:"已留下后续记忆",negative:false});
 $("effectFeedback").innerHTML=items.map(item=>`<span class="effect-chip${item.negative?" negative":""}">${esc(item.label)}</span>`).join("");
}
