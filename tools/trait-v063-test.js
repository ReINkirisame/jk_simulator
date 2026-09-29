"use strict";
const assert=require("node:assert/strict");
const {runtime}=require("./test-runtime");
let passed=0;
function test(name,fn){try{fn();passed++;console.log("✓ "+name);}catch(error){console.error("✗ "+name);throw error;}}
function isolated(names=[]){
 const r=runtime();r.launch({traits:[...names,"认真","开朗","吃货"].slice(0,3)});
 r.run(`S.pool=${JSON.stringify(names)}.map(name=>TRAITS.find(item=>item[0]===name));S.traits=S.pool.map((_,i)=>i);S.acquiredTraits=[];S.traitBenefits={months:{},records:[]};S.resources.energy=70;S.resources.stress=20;`);
 return r;
}
function used(r){return r.json('S.checks.at(-1).modifiers.flatMap(m=>m.traitNames||[])');}
function check(r,domain="social",dice=[3,3],npc=null){return r.json(`activityCheck("expression","真实测试",7,[],${JSON.stringify(dice)},{activityDomain:${JSON.stringify(domain)},npc:${JSON.stringify(npc)}})`);}
const base='[["投入","",()=>{}, {id:"act",replaceable:true,role:"social"}],["留出边界","",()=>{},{id:"safe",protected:true}]]';

test("a capped expensive trait contributes nothing and never pays or appears as a source",()=>{
 const r=isolated(["社交悍匪","现充","开朗"]),before=r.state();
 r.run('traitActivityModifiers("expression","social");traitActivityModifiers("expression","social");');assert.deepEqual(r.state(),before);
 check(r);assert.deepEqual(used(r),["现充","开朗"]);assert.deepEqual(r.state().resources,before.resources);
 assert(!r.state().traitBenefits.months["1:9"].costs.includes("社交悍匪"));
 assert(r.run('formatCheck(S.checks.at(-1))').includes("社交悍匪本次未计入，不另付消耗"));
 // 去掉一个免费来源后，付费来源才首次贡献，并只收一次月费。
 r.run('S.traits=[0,1];');check(r);assert.equal(r.state().resources.energy,67);assert.equal(r.state().resources.stress,21);
 check(r);assert.equal(r.state().resources.energy,67);
});
test("partial contributors pay once; lower marginal cost wins without cancelling negative traits",()=>{
 const r=isolated(["卷王","认真","天生卷王","非酋"]);
 check(r,"study",[1,1]);assert.deepEqual(used(r),["认真","天生卷王","非酋"]);
 assert.equal(r.state().resources.energy,69);assert.equal(r.state().resources.stress,20);
 assert.equal(r.state().traitBenefits.months["1:9"].failureRewards,1);
 const s=isolated(["现充","社交悍匪"]);const result=check(s);assert.equal(result.modifiers.find(m=>m.traitNames).value,2);assert.equal(s.state().resources.energy,67);
 s.run('S.month=10;');check(s);assert.equal(s.state().resources.energy,64);
});
test("trait option previews use the same cap allocation and never charge an omitted source",()=>{
 const r=isolated(["癫佬","社交悍匪","现充","开朗"]);r.run('ensureNpc("班长",3);');
 const before=r.state(),preview=r.run('traitChoicePreview(TRAIT_CHOICE_SETS.find(s=>s.id==="dianlao"),{}, {npc:"班长"})');
 assert(!preview.includes("本月首次加成另付"));assert.deepEqual(r.state(),before);
 r.run('S.traits=[0,1];');assert(r.run('traitChoicePreview(TRAIT_CHOICE_SETS.find(s=>s.id==="dianlao"),{}, {npc:"班长"})').includes("社交悍匪"));
});
test("online holiday actions run a real online check with different success and failure outcomes",()=>{
 for(const good of [true,false]){
  const r=isolated(["话痨"]);r.run(`S.year=2;S.month=1;S.calendarIndex=16;GAME_RANDOM_SOURCE=()=>${good?0.99:0};runStoryEvent(holidayEvent(),()=>{});`);
  const b=r.buttons().find(b=>b.textContent.includes("整理成帖子"));assert(b);b.click();
  assert.deepEqual(used(r),["话痨"]);assert.equal(r.state().flags.onlinePosts,1);assert.equal(r.state().resources.energy,64);
  assert.equal(r.state().resources.stress,good?17:22);assert.equal(r.state().growth.xp.expression,good?2:1);
 }
});
test("school club activity uses club bonuses on success and still spends energy on failure",()=>{
 const r=isolated(["社团狂魔"]);r.run('S.club="动漫社";GAME_RANDOM_SOURCE=()=>0;clubWeek(()=>{});');r.click();
 assert.deepEqual(used(r),["社团狂魔"]);assert.equal(r.state().resources.energy,63);assert.equal(r.state().growth.xp.creativity,1);
 assert(r.elements.text.textContent.includes("还没达到"));
});
test("the three revised profiles enforce their new conditions and costs",()=>{
 const direct=isolated(["直率"]);check(direct,"project");assert.deepEqual(used(direct),["直率"]);assert.equal(direct.state().resources.stress,20);
 const black=isolated(["白切黑"]);black.run('S.resources.stress=69;');check(black);assert.equal(black.state().resources.stress,71);check(black);assert.deepEqual(used(black),[]);
 const warm=isolated(["外冷内热"]);check(warm);assert.deepEqual(used(warm),[]);warm.run('ensureNpc("班长",3);');check(warm,"project",[3,3],"班长");assert.deepEqual(used(warm),["外冷内热"]);
 const idol=isolated(["地下偶像"]);check(idol,"presentation");assert.deepEqual(used(idol),[]);check(idol,"performance");assert.equal(idol.state().resources.energy,66);
});
test("level gains announce themselves and a suitable new option overrides normal offer probability",()=>{
 const r=isolated(["电波"]);r.run('ensureNpc("班长",3);S.traitProgress["电波"]=3;traitJourney("电波");');
 const result=r.run('TRAIT_CHOICE_RESOLVERS.traitNpc(TRAIT_CHOICE_SETS.find(s=>s.id==="denpa"),TRAIT_CHOICE_SETS.find(s=>s.id==="denpa").choices[0],{eventId:"grow",npc:"班长",sceneCategory:"classroom",checkDice:[3,3]})');
 assert(result.includes("Lv.1 → Lv.2"));assert.equal(r.state().traitPromotions.length,1);
 r.run(`GAME_RANDOM_SOURCE=()=>0.999;globalThis.offered=injectTraitChoices(${base},{eventId:"next",allowTraitChoices:true,npc:"班长",tags:["npc","social"],sceneCategory:"campus"});`);
 const choice=r.json('offered.find(c=>c[3]?.newUnlock)');assert(choice);assert(choice[0].includes("新解锁"));
 const id=choice[3].choiceId;assert.equal(r.run(`TRAIT_CHOICE_SETS.flatMap(s=>s.choices).find(c=>c.id===${JSON.stringify(id)}).minLevel`),2);
 assert.equal(r.state().traitPromotions[0].offered,true);assert.equal(r.run('getTraitXp("电波")'),4,"offering must not grant growth");
});
test("ineligible or protected scenes keep the promotion pending, without forcing a new page",()=>{
 const r=isolated(["吉他手"]);r.run('S.traitProgress["吉他手"]=4;S.traitPromotions=[{trait:"吉他手",level:2,index:0,offered:false}];');
 r.run(`injectTraitChoices(${base},{eventId:"no-music",allowTraitChoices:true,activityDomain:"study",musicAllowed:false});`);
 r.run(`injectTraitChoices([["安全","",()=>{},{protected:true}],["退让","",()=>{},{protected:true}]],{eventId:"protected",allowTraitChoices:true,npc:"班长",tags:["npc","social"]});`);
 assert.equal(r.state().traitPromotions[0].offered,false);
 r.run(`globalThis.offered=injectTraitChoices(${base},{eventId:"writing-music",allowTraitChoices:true,activityDomain:"creation",skill:"creativity"});`);
 assert(r.run('offered.some(c=>c[3]?.newUnlock)'));assert.equal(r.run('offered.length'),2);
});
test("all six growth lines have level-three activity choices; fusion cannot strand a pending upgrade",()=>{
 const r=isolated(["癫佬","电波"]);
 assert(r.run('TRAIT_ACTIVITY_SETS.every(s=>s.choices.some(c=>c.minLevel===3))'));
 r.run('S.hiddenTraits=["古明地恋"];traitJourney("电波").fusedInto="古明地恋";S.traitProgress["电波"]=8;S.traitPromotions=[{trait:"电波",level:3,index:20,offered:false}];');
 r.run(`globalThis.offered=injectTraitChoices(${base},{eventId:"after-fusion",allowTraitChoices:true,activityDomain:"creation",skill:"creativity"});`);
 const c=r.json('offered.find(c=>c[3]?.newUnlock)');assert.equal(c[3].trait,"电波");assert.equal(c[3].choiceId,"denpa-translate");
});
test("all sixty traits have a working annual scene, preserving appearance and growth requirements",()=>{
 const names=runtime().json('Object.keys(TRAIT_PROFILES)');
 for(const name of names){
  const r=isolated([name]);r.run('S.month=11;S.calendarIndex=2;ensureNpc("班长",4);S.npcFamiliarity["班长"]=4;GAME_RANDOM_SOURCE=()=>0.99;');
  const appearance=r.state().stats.appearance;
  r.run(`runStoryEvent(buildAnnualTraitEvent(${JSON.stringify(name)}),()=>{});`);assert.equal(r.buttons().length,2);r.click();
  assert.equal(r.state().traitAnnual.length,1,name);assert.equal(r.state().traitAnnual[0].trait,name);
  assert.equal(r.state().stats.appearance,appearance,name);
  assert.equal(r.run(`getTraitXp(${JSON.stringify(name)})`),0,name+" must not grant shortcut growth");
  const hasCheck=r.run(`annualTraitContext(${JSON.stringify(name)}).activityDomain!=="rest"`);
  if(hasCheck)assert(used(r).includes(name),name+" should have a reachable ordinary effect");
  assert.equal(r.errors.length,0);
 }
});
test("annual recovery is optional, rotates traits, and cannot settle twice",()=>{
 const r=isolated(["吃货","开朗","认真"]);r.run('S.month=11;S.calendarIndex=2;tryAnnualTraitDay(()=>{});');r.click(1);
 const after=r.state();assert.equal(after.resources.energy,76);assert.equal(after.resources.stress,16);
 assert.equal(r.run('tryAnnualTraitDay(()=>{})'),false);assert.deepEqual(r.state(),after);
 r.run('S.year=2;S.month=11;S.calendarIndex=14;tryAnnualTraitDay(()=>{});');assert(r.elements.title.textContent.startsWith("开朗"));r.click(1);
 r.run('S.year=3;S.month=11;S.calendarIndex=26;tryAnnualTraitDay(()=>{});');assert(r.elements.title.textContent.startsWith("认真"));r.click(1);
 assert.deepEqual(r.state().traitAnnual.map(x=>x.year),[1,2,3]);
});
test("student council callback needs an earlier decision, and failure does not invent admission",()=>{
 const r=isolated();r.run('S.month=11;S.calendarIndex=2;');assert.equal(r.run('fixedChoiceCallback({title:"才俊杯"})'),null);
 r.run('studentCouncilChoice("apply");S.flags.studentCouncilStatus="未入选";S.flags.studentCouncilSecondChance=true;GAME_RANDOM_SOURCE=()=>0;runStoryEvent(fixedChoiceCallback({title:"才俊杯"}),()=>{});');
 r.buttons().find(b=>b.textContent.includes("后台协作")).click();assert.equal(r.state().flags.studentCouncilStatus,"活动志愿者");
 assert.equal(r.state().eventCallbacks.length,1);assert.equal(r.run('fixedChoiceCallback({title:"才俊杯"})'),null);
 const good=isolated();good.run('S.month=11;studentCouncilChoice("apply");S.flags.studentCouncilStatus="未入选";S.flags.studentCouncilSecondChance=true;GAME_RANDOM_SOURCE=()=>0.99;runStoryEvent(fixedChoiceCallback({title:"才俊杯"}),()=>{});');
 good.buttons().find(b=>b.textContent.includes("后台协作")).click();assert.equal(good.state().flags.studentCouncilStatus,"正式干事");
 good.run('S.project={id:"test",name:"项目",skill:"academic",partner:"班长",progress:0};workOnProject("roles");');
 assert(good.state().checks.at(-1).modifiers.some(m=>m.label==="早期校园经验"&&m.value===1));
});
test("teacher advice and old-friend contact lead to mechanically different project repairs",()=>{
 for(const mode of ["talk","friends"]){
  const r=isolated(["话痨"]);r.run(`teacherDayChoice(${JSON.stringify(mode)});S.year=2;S.month=3;S.project={id:"test",name:"项目",skill:"academic",partner:"班长",progress:0};ensureNpc("班长",2);S.resources.energy=70;GAME_RANDOM_SOURCE=()=>0.99;runStoryEvent(Y2_EVENTS[3],()=>{});`);r.click();
  assert.equal(r.state().eventCallbacks[0].thread,"teacher-day");assert.equal(r.state().flags.projectRepaired,true);
  if(mode==="talk"){assert.equal(r.state().resources.energy,65);assert(r.state().checks.at(-1).modifiers.some(m=>m.label==="教师节记下的边界"&&m.value===1));assert(!used(r).includes("话痨"));}
  else{assert.equal(r.state().resources.energy,64);assert.equal(r.state().project.progress,2);assert(used(r).includes("话痨"));assert.equal(r.state().flags.testedPrototype,true);}
  assert.equal(r.run('withPastChoiceCallback(Y2_EVENTS[3])===Y2_EVENTS[3]'),true);
 }
});
test("the senior recovery choice recalls the actual earlier walk and spends its original slot",()=>{
 for(const mode of ["solo","together"]){
  const r=isolated();r.run(`ensureNpc("主人公",2);exploreCampus(${JSON.stringify(mode)});S.year=3;S.month=3;S.resources.energy=60;S.resources.stress=40;runStoryEvent(Y3_EVENTS[3],()=>{});`);
  assert.equal(r.buttons().length,3);r.click(1);
  assert.equal(r.state().resources.energy,mode==="solo"?70:66);assert.equal(r.state().resources.stress,mode==="solo"?26:32);
  assert.equal(r.state().eventCallbacks[0].choice,mode==="solo"?"quiet-corner":"old-route");
  if(mode==="together")assert.equal(r.state().npcTrust["主人公"],1);
 }
});

// 两条自然路线验证新选择页/结果页重放，以及源选择在一年、两年后被正确读取。
for(const branch of ["quiet-advice","company-friends"]){
 test("natural calendar, all three callbacks and save replay: "+branch,()=>{
  const r=runtime();r.launch({traits:["话痨","社团狂魔","地下偶像"],seed:"callback-063-"+branch});
  const savedPages=new Set();let steps=0,online=false,club=false;
  const together=branch==="company-friends";
  function replay(){const before=r.state(),title=r.elements.title.textContent,text=r.elements.text.textContent,labels=r.buttons().map(b=>b.textContent);const save=r.json('savePayload()');r.run('restoreGame('+JSON.stringify(save)+')');assert.deepEqual(r.state(),before);assert.equal(r.elements.title.textContent,title);assert.equal(r.elements.text.textContent,text);assert.deepEqual(r.buttons().map(b=>b.textContent),labels);}
  for(;steps<380&&r.state().phase!=="graduated";steps++){
   const title=r.elements.title.textContent,list=r.buttons();let b;
   if(title==="熟悉校园")b=list.find(b=>b.textContent.includes(together?"跟着刚认识":"自己慢慢"));
   if(title==="教师节回学校看老师")b=list.find(b=>b.textContent.includes(together?"初中同学":"认真聊聊"));
   if(title==="社团纳新")b=list.find(b=>b.textContent.includes("动漫社"));
   if(title.startsWith("才俊杯 ·"))b=list.find(b=>b.textContent.includes("后台"));
   if(title==="跨年")b=list.find(b=>b.textContent.includes("线上聊天"));
   if(title==="假期没有替你解决问题")b=list.find(b=>b.textContent.includes(together?"初中朋友":"当年的提醒"));
   if(title==="最后三个月的安排")b=list.find(b=>b.textContent.includes(together?"当年同行":"高一找到"));
   if(title.startsWith("社团活动周 ·"))b=list[0];
   const key=title+":"+r.state().year;
   const relevant=r.elements.tag.textContent.startsWith("特质日常")||["才俊杯 · 舞台与后台","假期没有替你解决问题","最后三个月的安排"].includes(title);
   const replayNow=relevant&&list.length>1&&!savedPages.has(key);
   // 回放会重新创建按钮，保存索引而不点击旧闭包。
   const index=b?list.indexOf(b):0;if(replayNow){replay();savedPages.add(key);}
   r.click(index);
   if(replayNow)replay();
   const last=r.state().checks.at(-1);
   if(last?.label==="跨年群聊"){online=true;assert(last.modifiers.some(m=>m.traitNames?.includes("话痨")));}
   if(last?.label==="社团活动周 · 动漫社"){club=true;assert(last.modifiers.some(m=>m.traitNames?.includes("社团狂魔")));}
  }
  const s=r.state();assert.equal(s.phase,"graduated");assert(online&&club);assert.equal(s.traitAnnual.length,3);assert.equal(new Set(s.traitAnnual.map(x=>x.year)).size,3);
  assert.deepEqual(s.eventCallbacks.map(x=>x.thread),["council","teacher-day","campus-walk"]);assert.equal(s.hiddenTraits.length,0);
  assert(savedPages.size>=6);assert.equal(r.errors.length,0);replay();
  console.log("  "+branch+": "+steps+" clicks, "+savedPages.size+" new choice/result replay pairs");
 });
}
test("natural upgrade result and the next newly unlocked option survive exact replay",()=>{
 const r=runtime();r.launch({traits:["癫佬","电波","吃货"],seed:"upgrade-save-063"});let pending=false,offered=false;
 for(let i=0;i<340&&!offered&&r.state().phase!=="graduated";i++){
  const list=r.buttons(),isPending=r.elements.text.textContent.includes("【特质成长】")&&r.state().traitPromotions.some(p=>!p.offered&&!p.superseded);
  const isOffer=pending&&list.some(b=>b.textContent.includes("新解锁"));
  const index=Math.max(0,list.findIndex(b=>b.classList.contains("trait-choice")));
  if((isPending&&!pending)||isOffer){
   const before=r.state(),text=r.elements.text.textContent,labels=list.map(b=>b.textContent),save=r.json('savePayload()');
   r.run('restoreGame('+JSON.stringify(save)+')');assert.deepEqual(r.state(),before);assert.equal(r.elements.text.textContent,text);assert.deepEqual(r.buttons().map(b=>b.textContent),labels);
   pending=true;if(isOffer){offered=true;break;}
  }
  r.click(index);
 }
 assert(pending&&offered,"natural upgrade must keep its next-scene guarantee through saving");
});
test("0.6.3 rejects a 0.6.2 replay while keeping the old key and current run intact",()=>{
 const r=runtime();r.storage.set("fuzhong-girl-v062","old-save-kept");r.launch();r.click();const before=r.state(),old={...r.json('savePayload()'),version:"0.6.2"};
 assert.equal(r.run('SAVE_KEY'),"fuzhong-girl-v063");assert.throws(()=>r.run('restoreGame('+JSON.stringify(old)+')'),/版本不兼容/);
 assert.deepEqual(r.state(),before);assert.equal(r.storage.get("fuzhong-girl-v062"),"old-save-kept");
});
console.log(passed+" v0.6.3 trait and callback groups passed.");
