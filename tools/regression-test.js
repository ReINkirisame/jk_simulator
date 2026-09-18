"use strict";
const assert=require("node:assert/strict");
const {runtime}=require("./test-runtime");
let passed=0;
function test(name,fn){try{fn();passed++;console.log("✓ "+name);}catch(error){console.error("✗ "+name);throw error;}}

test("startup validates all referenced data and DOM IDs",()=>{
 const r=runtime();assert.deepEqual(r.json("validateGameData()"),[]);assert.equal(r.warnings.length,0);
});
test("allocation accepts zero and extreme builds, rejects blanks, fractions and silent clamping",()=>{
 const r=runtime();
 for(const values of [[20,20,0,0,0],[0,0,0,20,20],[8,8,8,8,8]])assert.equal(r.run("setAllocation("+JSON.stringify(values)+");pointsOK()"),true);
 for(const values of [[21,19,0,0,0],[-1,1,20,20,0],[8.5,7.5,8,8,8],["",20,20,0,0],[8,8,8,8,7]])assert.equal(r.run("setAllocation("+JSON.stringify(values)+");pointsOK()"),false);
 assert(r.run('setAllocation([21,19,0,0,0]);allocatedStats().academic')===21);
});
test("random allocation uses exactly the same budget and caps",()=>{
 const r=runtime();
 assert.equal(r.run('(()=>{for(let i=0;i<500;i++){randomAllocation();if(!pointsOK())return false;}return true;})()'),true);
});
test("attribute modifier boundaries follow the agreed table",()=>{
 const r=runtime();assert.deepEqual(r.json("[0,3,4,7,8,11,12,15,16,19,20,24,25,30].map(statCheckModifier)"),[-2,-2,-1,-1,0,0,1,1,2,2,3,3,4,4]);
});
test("growth requires experience, respects semester cap, never trains appearance",()=>{
 const r=runtime();r.launch();
 const v=r.json('(()=>{S.growth={xp:{},semester:{}};S.stats.academic=0;S.stats.appearance=8;gainExperience("academic",3);const first=S.stats.academic;gainExperience("academic",1);const next=S.stats.academic;gainExperience("academic",100);const cap=S.stats.academic;S.month=3;gainExperience("academic",4);gainExperience("appearance",999);return {first,next,cap,later:S.stats.academic,appearance:S.stats.appearance};})()');
 assert.deepEqual(v,{first:0,next:1,cap:3,later:4,appearance:8});
});
test("appearance drift is bounded relative to the initial value",()=>{
 const r=runtime();r.launch();
 assert.deepEqual(r.json('(()=>{changeStat("appearance",99);const high=S.stats.appearance;changeStat("appearance",-99);return [high,S.stats.appearance];})()'),[10,6]);
});
test("family income is real; insufficient funds leave a free project route",()=>{
 const r=runtime();r.launch({family:"modest"});assert.equal(r.state().resources.cash,20);
 r.run('S.project={...PROJECTS.archive,progress:0};S.resources.cash=0;runStoryEvent(Y2_EVENTS[4],()=>{});');
 const all=r.elements.choices.children;assert.equal(all[0].disabled,true);assert.equal(all[1].disabled,false);
 all[1].click();assert.equal(r.state().project.progress,2);assert.equal(r.state().resources.cash,0);
});
test("appearance changes invitation outcomes, never grants trust",()=>{
 const outcomes=[0,20].map(appearance=>{
  const r=runtime();r.launch();r.run('S.stats.appearance='+appearance+';setGameRandomSource(()=>0.4);');
  const before=r.json("S.npcTrust");r.run("runStoryEvent(PHOTO_EVENT,()=>{});");r.click(0);
  assert.deepEqual(r.json("S.npcTrust"),before);return r.state().flags.photoNoticed;
 });
 assert.deepEqual(outcomes,[false,true]);
});
test("expression and creativity checks do not borrow appearance",()=>{
 const r=runtime();r.launch();
 assert.deepEqual(r.json('S.stats.expression=0;S.stats.creativity=0;S.stats.appearance=20;[resolveCheck({stat:"expression",dice:[3,3]}).modifierTotal,resolveCheck({stat:"creativity",dice:[3,3]}).modifierTotal]'),[-2,-2]);
});
function chaosRuntime(){
 const r=runtime();r.launch({chaos:true});
 r.run('S.traitProgress={};S.traitMilestones={months:[],npcs:[],scenes:[]};S.traitChoiceState={misses:0,lastEventId:null,recentChoiceIds:[]};');
 return r;
}
const base='[["正常主动方案","",()=>{S.flags.normalEffect=true;},{id:"normal",role:"social",replaceable:true}],["安全方案","",()=>{}, {id:"safe",protected:true}]]';
test("chaos replaces one explicit slot without inheriting its benefit or mutating the source",()=>{
 const r=chaosRuntime();
 const v=r.json('(()=>{const base='+base+';const list=injectTraitChoices(base,{eventId:"replace-test",allowTraitChoices:true,tags:["npc","social"],npc:"班长",sceneCategory:"classroom",forceTraitChoice:true,checkDice:[1,1]});const original=base[0][0];list[0][2]();return {length:list.length,original,unaffected:list[1][0],replaced:list[0][3].replacedId,normalEffect:!!S.flags.normalEffect,relation:getRelation("班长"),pending:S.flags["chaosAftermath:班长"].pending};})()');
 assert.equal(v.length,2);assert.equal(v.original,"正常主动方案");assert.equal(v.unaffected,"安全方案");assert.equal(v.replaced,"normal");assert.equal(v.normalEffect,false);assert(v.relation<1);assert.equal(v.pending,true);
});
test("single, unmarked and protected choices cannot be replaced",()=>{
 const r=chaosRuntime();
 const v=r.json('(()=>{const c={eventId:"protected",allowTraitChoices:true,tags:["npc","social"],npc:"班长",forceTraitChoice:true};const lists=[injectTraitChoices([["继续","",()=>{}, {role:"social",replaceable:true}]],c),injectTraitChoices([["甲","",()=>{}],["乙","",()=>{}]],c),injectTraitChoices([["关键","",()=>{}, {role:"social",replaceable:true,protected:true}],["安全","",()=>{}]],c)];return lists.map(list=>list.some(x=>x[3]?.trait));})()');
 assert.deepEqual(v,[false,false,false]);
});
test("four uses in one month yield only one XP and cannot evolve",()=>{
 const r=chaosRuntime();
 const v=r.json('(()=>{for(let i=0;i<4;i++)advanceTraitProgress(TRAIT_CHOICE_SETS[0],{npc:["班长","同人女","体育生","中二病"][i],sceneCategory:["classroom","club","campus","holiday"][i]});return {xp:getTraitXp("癫佬"),level:getTraitLevel("癫佬"),hidden:S.hiddenTraits};})()');
 assert.deepEqual(v,{xp:1,level:1,hidden:[]});
});
test("four distinct months reach level 2; year is part of the growth key",()=>{
 const r=chaosRuntime();
 const v=r.json('(()=>{for(const [year,month] of [[1,9],[1,10],[1,11],[2,9]]){S.year=year;S.month=month;advanceTraitProgress(TRAIT_CHOICE_SETS[0],{npc:"班长",sceneCategory:"classroom"});}return {xp:getTraitXp("癫佬"),level:getTraitLevel("癫佬"),hidden:S.hiddenTraits};})()');
 assert.deepEqual(v,{xp:4,level:2,hidden:[]});
});
test("evolution gates time, experience, people and scene diversity independently",()=>{
 const r=chaosRuntime();
 r.run('S.traitProgress["癫佬"]=12;S.traitMilestones={months:[],npcs:["班长","同人女","体育生","中二病"],scenes:["classroom","club","holiday"]};');
 for(let index=0;index<16;index++)assert.equal(r.run("S.calendarIndex="+index+";tryChaosEvolution(()=>{})"),false);
 assert.equal(r.run('S.calendarIndex=16;S.year=2;S.month=1;S.term="高二寒假";tryChaosEvolution(()=>{})'),true);
 assert.equal(r.state().hiddenTraits.length,0);r.click(0);
 assert(r.state().hiddenTraits.includes("古明地恋"));assert.equal(r.state().flags.koishiAwakenedAt.index,16);
 const s=chaosRuntime();
 s.run('S.calendarIndex=16;S.traitProgress["癫佬"]=12;S.traitMilestones={months:[],npcs:["班长","同人女","体育生","中二病"],scenes:["classroom","club","holiday"]};');
 for(const setup of ['S.traitProgress["癫佬"]=11','S.traitProgress["癫佬"]=12;S.traitMilestones.npcs.pop()','S.traitMilestones.npcs.push("中二病");S.traitMilestones.scenes.pop()'])assert.equal(s.run(setup+";tryChaosEvolution(()=>{})"),false);
});
test("evolved choices still replace normal choices and still allow a negative outcome",()=>{
 const r=chaosRuntime();
 const v=r.json('(()=>{S.hiddenTraits=["古明地恋"];const choices=injectTraitChoices('+base+',{allowTraitChoices:true,eventId:"evolved",tags:["npc","social"],npc:"大小姐",sceneCategory:"campus",forceTraitChoice:true,checkDice:[1,1]});const before=getRelation("大小姐");choices[0][2]();return {length:choices.length,label:choices[0][0],delta:getRelation("大小姐")-before};})()');
 assert.equal(v.length,2);assert(v.label.startsWith("【古明地恋】"));assert(v.delta<0);
});
test("monthly exam is one decision plus result; major exam has one extra decision",()=>{
 const r=runtime();r.launch();r.run('startExam("测试月考","monthly","steady",()=>{});');
 assert.equal(r.elements.tag.textContent,"考试结果");assert.equal(r.buttons().length,1);
 r.run('startExam("测试期末","term1","steady",()=>{});');assert.equal(r.buttons().length,2);r.click(0);
 assert.equal(r.elements.tag.textContent,"考试结果");assert.equal(r.buttons().length,1);
});
test("fixed rolls expose academic advantage without halting low builds",()=>{
 const r=runtime();r.launch();
 const v=r.json('(()=>{S.stats.academic=0;const low=calculateExam("low","monthly","steady",null,[3,3]).score;S.stats.academic=20;const high=calculateExam("high","monthly","steady",null,[3,3]).score;return {low,high};})()');
 assert(v.high-v.low>=120);assert(v.low>=300);
});
test("seed plus identical actions reproduces all state, including random offers",()=>{
 const a=runtime(),b=runtime();a.launch({seed:"same",chaos:true});b.launch({seed:"same",chaos:true});
 for(let i=0;i<45;i++){a.click(i%2);b.click(i%2);}assert.deepEqual(a.state(),b.state());
});
test("save restores a selected result page and the exact next outcome",()=>{
 const a=runtime(),b=runtime();a.launch({seed:"save",chaos:true});
 for(let i=0;i<43;i++)a.click(i%2);
 b.run("restoreGame("+JSON.stringify(a.json("savePayload()"))+")");
 assert.deepEqual(a.state(),b.state());assert.equal(a.elements.text.textContent,b.elements.text.textContent);
 assert.deepEqual(a.buttons().map(x=>x.textContent),b.buttons().map(x=>x.textContent));
 a.click(0);b.click(0);assert.deepEqual(a.state(),b.state());
});
test("bad saves and action histories preserve the current game",()=>{
 const r=runtime();r.launch();for(let i=0;i<5;i++)r.click(0);
 const saved=r.json("savePayload()"),before=r.state();
 for(const bad of [{...saved,version:"0.4.0"},{...saved,actions:[...saved.actions,"arbitrary-code()"]},{...saved,signature:"bad"}]){
  assert.throws(()=>r.run("restoreGame("+JSON.stringify(bad)+")"));assert.deepEqual(r.state(),before);
 }
});
test("debug cannot overwrite normal save or bypass evolution time gate",()=>{
 const r=runtime();r.launch({chaos:true});const saved=r.storage.get("fuzhong-girl-v050");
 r.run("GameDebug.prepareChaos();saveLocalGame();");assert.equal(r.storage.get("fuzhong-girl-v050"),saved);assert(!r.state().hiddenTraits.includes("古明地恋"));
 r.run("GameDebug.jump(16);");assert.equal(r.elements.title.textContent,"大家已经习惯了");
});
test("fixed event alternatives leave different persistent effects",()=>{
 const a=runtime(),b=runtime();a.launch();b.launch();
 a.run('applyEffects(LEGACY_FIXED_EFFECTS["扫雪"][0]);');b.run('applyEffects(LEGACY_FIXED_EFFECTS["扫雪"][1]);');
 assert.notDeepEqual(a.state().growth,b.state().growth);assert.notEqual(a.state().resources.energy,b.state().resources.energy);
});
console.log(passed+" regression groups passed.");
