"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const {runtime}=require("./test-runtime");
let passed=0;
function test(name,fn){try{fn();passed++;console.log("✓ "+name);}catch(error){console.error("✗ "+name);throw error;}}
function isolated(names=[]){
 const r=runtime();r.launch({traits:[...names,...["认真","开朗","吃货"].filter(name=>!names.includes(name))].slice(0,3)});
 r.run(`S.pool=${JSON.stringify(names)}.map(name=>TRAITS.find(item=>item[0]===name));S.traits=S.pool.map((_,i)=>i);S.acquiredTraits=[];S.traitBenefits={months:{},records:[]};S.resources.energy=70;S.resources.stress=20;`);
 return r;
}
function bonus(r,domain,context={}){return r.run(`traitActivityModifiers("expression",${JSON.stringify(domain)},${JSON.stringify(context)}).reduce((sum,item)=>sum+item.value,0)`);}
function pay(r,domain="study"){return r.json(`(()=>{const result={label:"测试活动",margin:1,modifiers:traitActivityModifiers("academic",${JSON.stringify(domain)})};return applyTraitActivityOutcome(result,"academic",${JSON.stringify(domain)});})()`);}
function digest(value){return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");}

test("all sixty introductions and quotes preserve the edited workbook verbatim",()=>{
 const r=runtime(),texts=r.json('Object.entries(TRAIT_TEXTS).map(([name,t])=>[name,t.intro,t.quote])');
 assert.equal(texts.length,60);
 assert.equal(digest(texts),"5f4e157fcd48da74926b63900bef233cdd4a693ffcd77a6b3f85d9edf5d60288");
 assert.deepEqual(r.json('TRAITS.map(([name,intro])=>[name,intro])'),texts.map(([name,intro])=>[name,intro]));
 const unchanged=r.json('Object.entries(TRAIT_TEXTS).filter(([name])=>!["社交悍匪","天生卷王","慢热","话痨","直率"].includes(name)).map(([name,t])=>[name,t.effect])');
 assert.equal(digest(unchanged),"1551772d14d4e5d9068520b0715c764e7846e78a94e416dc8c7524fa2ee1745a");
});
test("every setup card renders four ordered text sections with escaped content",()=>{
 const r=runtime(),seen=new Set();
 for(let i=0;i<100;i++){
  r.run(`setGameSeed("cards-062-${i}");renderPool();`);
  const cards=r.elements.traitPool.innerHTML.split('<button type="button"').slice(1),pool=r.json('S.pool.map(([name])=>name)');
  assert.equal(cards.length,10);
  cards.forEach((card,index)=>{
   const name=pool[index];seen.add(name);
   const texts=r.json(`TRAIT_TEXTS[${JSON.stringify(name)}]`);
   assert(card.indexOf("trait-card-heading")<card.indexOf("trait-card-intro"));
   assert(card.indexOf("trait-card-intro")<card.indexOf("trait-card-effect"));
   assert(card.indexOf("trait-card-effect")<card.indexOf("trait-flavor"));
   for(const field of ["intro","effect","quote"])assert(card.includes(r.run(`esc(${JSON.stringify(texts[field])})`)),name+":"+field);
   assert.equal(card.includes("可成长"),["癫佬","电波","社恐","吉他手","完美主义","冰山"].includes(name));
  });
 }
 assert.equal(seen.size,60);
 r.run('TRAIT_TEXTS["认真"].quote="<img src=x onerror=alert(1)>";');
 r.run('S.pool=[TRAITS.find(t=>t[0]==="认真")];S.traits=[0];renderTraitDetails();');
 assert(r.elements.traitDetails.innerHTML.includes("&lt;img"));assert(!r.elements.traitDetails.innerHTML.includes("<img"));
});
test("the four social traits have different domains or costs",()=>{
 const expected={"现充":[1,1,0,0],"社交悍匪":[2,2,0,0],"话痨":[1,0,1,0],"直率":[1,0,0,1]};
 for(const [name,values] of Object.entries(expected)){
  const r=isolated([name]);assert.deepEqual(["social","presentation","online","project"].map(domain=>bonus(r,domain)),values,name);
  pay(r,"social");assert.equal(r.state().resources.energy,name==="社交悍匪"?67:70);assert.equal(r.state().resources.stress,name==="社交悍匪"?21:20);
  const after=r.state().resources;pay(r,"presentation");assert.deepEqual(r.state().resources,after);
 }
});
test("slow warmth needs familiarity, not a shortcut through a high relationship score",()=>{
 const a=isolated(["傲娇"]),b=isolated(["慢热"]);
 for(const r of [a,b])r.run('ensureNpc("班长",3);S.npcRelation["班长"]=3;S.npcFamiliarity["班长"]=2;');
 assert.equal(bonus(a,"social",{npc:"班长"}),1);assert.equal(bonus(b,"social",{npc:"班长"}),0);
 b.run('S.npcFamiliarity["班长"]=3;S.npcRelation["班长"]=0;');assert.equal(bonus(b,"social",{npc:"班长"}),2);
 assert.equal(bonus(b,"social"),0);assert.equal(bonus(b,"social",{npc:"不存在"}),0);
 assert(b.run('traitEffectDescription("慢热")').includes("仅关系达标无效"));
});
test("natural high achievers save energy but do not cover competition",()=>{
 const a=isolated(["卷王"]),b=isolated(["天生卷王"]);
 assert.equal(bonus(a,"competition"),1);assert.equal(bonus(b,"competition"),0);
 for(const r of [a,b]){assert.equal(bonus(r,"study"),1);assert.equal(bonus(r,"exam"),1);pay(r);}
 assert.equal(a.state().resources.energy,68);assert.equal(a.state().resources.stress,21);
 assert.equal(b.state().resources.energy,69);assert.equal(b.state().resources.stress,20);
});
test("larger bonuses still respect the shared positive cap and never add growth paths",()=>{
 const r=isolated(["社交悍匪","现充","慢热","欧皇","非酋"]);
 r.run('ensureNpc("班长",4);S.npcFamiliarity["班长"]=4;');
 assert.equal(bonus(r,"social",{npc:"班长"}),1);
 assert.deepEqual(r.json('progressiveTraitNames()'),["癫佬","电波","社恐","吉他手","完美主义","冰山"]);
});
test("monthly feedback names the sources and uses actual bounded recovery",()=>{
 const r=isolated(["吃货","运动少女","佛系","猫派","钝感力"]);
 r.run('S.resources.energy=99;S.resources.stress=1;applyMonthlyTraitBenefits();renderTraitBenefitNotice();');
 const lines=r.json('currentTraitBenefitSummary()');assert.equal(lines.length,1);
 assert(lines[0].text.includes("精力+1"));assert(lines[0].text.includes("压力-1"));assert(lines[0].text.includes("月间恢复封顶6"));
 for(const name of ["吃货","运动少女","佛系","猫派","钝感力"])assert(lines[0].text.includes(name));
 assert(r.elements.traitBenefitNotice.innerHTML.includes("来源记录，已计入上方数值"));
 assert(!r.elements.traitBenefitNotice.classList.contains("hidden"));
});
test("full resources do not advertise recovery that did not arrive",()=>{
 const r=isolated(["吃货","猫派"]);r.run('S.resources.energy=100;S.resources.stress=0;applyMonthlyTraitBenefits();');
 const text=r.json('currentTraitBenefitSummary()')[0].text;
 assert(text.includes("精力0"));assert(text.includes("压力0"));assert(text.includes("原定+3"));assert(text.includes("原定-2"));
});
test("benefit display is pure, has no choices, and clears at the next month",()=>{
 const r=isolated(["吃货","卷王"]);r.run('applyMonthlyTraitBenefits();');pay(r);
 const before=r.state(),actions=r.json('Session.actions'),buttons=r.buttons().length;
 for(let i=0;i<5;i++)r.run('currentTraitBenefitSummary();renderTraitBenefitNotice();');
 assert.deepEqual(r.state(),before);assert.deepEqual(r.json('Session.actions'),actions);assert.equal(r.buttons().length,buttons);
 assert(!r.elements.traitBenefitNotice.innerHTML.includes("<button"));assert.equal(r.json('applyMonthlyTraitBenefits()').length,0);
 r.run('S.month=10;renderTraitBenefitNotice();');assert(r.elements.traitBenefitNotice.classList.contains("hidden"));assert.equal(r.elements.traitBenefitNotice.innerHTML,"");
 r.run('delete S.traitBenefits;');const absent=r.state();r.run('renderTraitBenefitNotice();');assert.deepEqual(r.state(),absent);
});
test("first-use cost feedback is grouped and does not duplicate on another check",()=>{
 const r=isolated(["社交悍匪"]);pay(r,"social");pay(r,"presentation");
 const lines=r.json('currentTraitBenefitSummary()');assert.equal(lines.length,1);assert.equal(lines[0].title,"【社交悍匪】首次发挥");
 assert(lines[0].text.includes("精力-3"));assert(lines[0].text.includes("压力+1"));assert.equal(r.state().traitBenefits.records.length,2);
 r.run('S.month=10;');pay(r,"social");assert.equal(r.state().traitBenefits.records.length,4);assert.equal(r.json('currentTraitBenefitSummary()').length,1);
});
test("overflow cost feedback includes its real secondary resource consequence",()=>{
 const r=isolated(["卷王"]);r.run('S.resources.energy=1;S.resources.stress=20;');pay(r);
 const text=r.json('currentTraitBenefitSummary()')[0].text;
 assert(text.includes("精力-1"));assert(text.includes("原定-2"));assert(text.includes("溢出转为压力+1"));assert.equal(r.state().resources.stress,22);
 const stress=isolated(["完美主义"]);stress.run('S.resources.energy=70;S.resources.stress=100;');pay(stress);
 assert(stress.json('currentTraitBenefitSummary()')[0].text.includes("溢出转为精力-1"));
});
test("failure feedback explains XP rollover, growth limits and the monthly refund limit",()=>{
 const r=isolated(["非酋"]);r.run('S.stats.academic=8;S.growth={xp:{academic:3},semester:{}};');
 const fail='(()=>{const check={label:"复盘测试",margin:-1,modifiers:traitActivityModifiers("academic","study")};applyTraitActivityOutcome(check,"academic","study");})()';
 r.run(fail);let lines=r.json('currentTraitBenefitSummary()');assert(lines[0].text.includes("学力经验+1"));assert(lines[0].text.includes("学力+1"));assert.equal(r.state().stats.academic,9);
 r.run('S.stats.academic=30;');r.run(fail);r.run(fail);lines=r.json('currentTraitBenefitSummary()');assert.equal(lines.length,2);assert(lines[1].text.includes("本次没有增加经验"));
});
test("forecasts cannot add benefit notices or mark first-use costs paid",()=>{
 const r=isolated(["卷王","非酋"]),before=r.state();
 for(let i=0;i<4;i++)r.run('examForecastText("monthly","steady");renderTraitBenefitNotice();');
 assert.deepEqual(r.state(),before);assert.deepEqual(r.json('currentTraitBenefitSummary()'),[]);
});
test("October goes through the ordinary monthly end and annual summaries remain",()=>{
 const r=isolated();r.run('tryTraitFormation=()=>false;tryTraitFusion=()=>false;tryCampusRumor=()=>false;S.year=1;S.month=10;S.calendarIndex=1;finishCalendarMonth();');
 assert.equal(r.elements.tag.textContent,"本月结束");assert.equal(r.buttons().length,1);assert(!r.state().flags.octoberPortraitShown);r.click();
 assert.equal(r.state().month,11);assert.equal(r.state().calendarIndex,2);
 for(const year of [1,2]){
  r.run(`S.year=${year};S.month=7;finishCalendarMonth();`);assert.equal(r.elements.tag.textContent,"学年手记");assert(r.elements.title.textContent.includes(year===1?"高一结束":"高二结束"));
 }
});
test("hidden definitions, choices and recipes contain only Koishi, not disabled stubs",()=>{
 const r=runtime();assert.deepEqual(r.json('Object.keys(HIDDEN_TRAITS)'),["古明地恋"]);
 assert.deepEqual(r.json('FUSION_RECIPES.map(r=>r.hidden)'),["古明地恋"]);
 assert.deepEqual(r.json('TRAIT_CHOICE_SETS.filter(s=>s.hidden).map(s=>s.trait)'),["古明地恋"]);
 for(const name of ["后藤独","雪之下雪乃","bocchi","yukino"]){
  assert.equal(r.run(`fusionEligibility(${JSON.stringify(name)}).missingRecipe`),true);
  assert.equal(r.run(`GameDebug.prepareFusion(${JSON.stringify(name)})`),false);
 }
 const src=path.resolve(__dirname,"../src");
 const files=fs.readdirSync(src,{recursive:true}).filter(file=>file.endsWith(".js"));
 for(const file of files)assert(!/后藤独|雪之下雪乃|bocchi|yukino|showOctoberPortrait|octoberPortraitShown|highStressUses/.test(fs.readFileSync(path.join(src,file),"utf8")),file);
});
test("0.6.2 has its own save key and rejects old saves without altering either run",()=>{
 const r=runtime();r.storage.set("fuzhong-girl-v061","old-save-kept");r.launch({traits:["吃货","卷王","认真"]});r.click();
 const before=r.state(),save=r.json('savePayload()');assert.equal(save.version,"0.6.2");assert.equal(r.run('SAVE_KEY'),"fuzhong-girl-v062");
 const old={...save,version:"0.6.1"};assert.throws(()=>r.run('restoreGame('+JSON.stringify(old)+')'),/版本不兼容/);
 assert.deepEqual(r.state(),before);assert.equal(r.storage.get("fuzhong-girl-v061"),"old-save-kept");
 r.run('restoreGame('+JSON.stringify(save)+')');assert.deepEqual(r.state(),before);
 const text=r.elements.traitBenefitNotice.innerHTML;r.run('update();update();');assert.equal(r.elements.traitBenefitNotice.innerHTML,text);assert.deepEqual(r.state(),before);
});
console.log(passed+" v0.6.2 trait groups passed.");
