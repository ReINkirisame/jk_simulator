"use strict";
const assert=require("node:assert/strict");
const {runtime}=require("./test-runtime");
let passed=0;
function test(name,fn){try{fn();passed++;console.log("✓ "+name);}catch(error){console.error("✗ "+name);throw error;}}
function isolated(names=[]){
 const r=runtime();r.launch({traits:[...names,...["认真","开朗","吃货"].filter(name=>!names.includes(name))].slice(0,3)});
 r.run(`S.pool=${JSON.stringify(names)}.map(name=>TRAITS.find(item=>item[0]===name));S.traits=S.pool.map((_,i)=>i);S.acquiredTraits=[];S.traitProgress={};S.traitJourneys={};S.traitFormation={};S.traitFormationHistory=[];S.traitBenefits={months:{},records:[]};S.traitChoiceState={misses:0,lastEventId:null,recentChoiceIds:[]};S.resources.energy=70;S.resources.stress=20;`);
 return r;
}
function evidence(r,name,indices=[0,1,2,3]){
 r.run(`${JSON.stringify(indices)}.forEach(index=>recordTraitFormationEvidence({eventId:"explicit-test",choiceId:"practice",label:"明确尝试",calendarIndex:index,formationEvidence:[${JSON.stringify(name)}]}));`);
}
function fusionSeed(r,overlap=false){
 r.run(`for(const [source,name] of ["癫佬","电波"].entries()){const j=traitJourney(name);Object.assign(j,{xp:6,months:Array.from({length:6},(_,i)=>"1:"+(((${overlap?"0":"source"})*6+i+8)%12+1)),npcs:["班长","同人女","体育生","中二病"],scenes:["classroom","club","study"],positiveNpcs:["班长"],styles:{battle:1},uses:6});S.traitProgress[name]=6;}S.calendarIndex=16;S.year=2;S.month=1;S.term="高二寒假";`);
}
const replaceable='[["普通办法","",()=>{S.flags.inheritedNormal=true;},{id:"normal",role:"bold",replaceable:true}],["安全办法","",()=>{}, {id:"safe",protected:true}]]';

test("0.6.1 gives every one of the sixty normal traits a real rule and readable description",()=>{
 const r=isolated();
 const out=r.json('(()=>{const rows=[];for(const [name] of TRAITS){S.pool=[TRAITS.find(item=>item[0]===name)];S.traits=[0];S.traitBenefits={months:{},records:[]};S.resources.energy=50;S.resources.stress=50;ensureNpc("班长",4);S.npcFamiliarity["班长"]=4;const p=TRAIT_PROFILES[name];const modifiers=traitActivityModifiers(p.skill,p.domains[0],{npc:"班长"});const applied=applyMonthlyTraitBenefits();rows.push({name,category:traitCategoryLabel(name),skill:p.skill,description:traitEffectDescription(name),effective:modifiers.some(x=>x.value!==0)||applied.some(x=>x.actual!==0)});}return {version:GAME_VERSION,count:TRAITS.length,profiles:Object.keys(TRAIT_PROFILES).length,rows};})()');
 assert.equal(out.version,"0.6.1");assert.equal(out.count,60);assert.equal(out.profiles,60);
 for(const row of out.rows){assert(["性格","技能","兴趣","生活","网络","命运"].includes(row.category),row.name);assert(row.description.length>5,row.name);assert(row.effective,row.name+" has no reachable effect");}
});
test("normal trait modifiers are pure, deterministic and capped at +2",()=>{
 const r=isolated(["认真","手账少女","卷王"]);const before=r.state();
 const first=r.json('traitActivityModifiers("academic","study")'),second=r.json('traitActivityModifiers("academic","study")');
 assert.deepEqual(first,second);assert.deepEqual(r.state(),before);assert.equal(first.reduce((n,m)=>n+m.value,0),2);assert(first[0].label.includes("合计封顶"));
 assert.deepEqual(r.json('traitActivityModifiers("fitness","sport")'),[]);
});
test("conditional familiarity and calm bonuses enforce their stated boundaries",()=>{
 const r=isolated(["慢热"]);
 assert.deepEqual(r.json('traitActivityModifiers("expression","social",{npc:"班长"})'),[]);
 r.run('ensureNpc("班长",3);');assert.equal(r.run('traitActivityModifiers("expression","social",{npc:"班长"})[0].value'),1);
 const ice=isolated(["冰山"]);assert.equal(ice.run('S.resources.stress=69;traitActivityModifiers("expression","social")[0].value'),1);
 assert.deepEqual(ice.json('S.resources.stress=70;traitActivityModifiers("expression","social")'),[]);
});
test("physical competitions activate sports traits without making every competition a sport",()=>{
 const r=isolated(["运动少女"]);
 assert.equal(r.run('traitActivityModifiers("fitness","competition")[0].value'),1);
 assert.deepEqual(r.json('traitActivityModifiers("academic","competition")'),[]);
});
test("monthly recovery is bounded, idempotent and does not grant attribute XP",()=>{
 const r=isolated(["吃货","运动少女","佛系","钝感力","猫派"]);
 const out=r.json('(()=>{const growth=JSON.stringify(S.growth);const first=applyMonthlyTraitBenefits(),after={...S.resources};const again=applyMonthlyTraitBenefits();const growthSame=growth===JSON.stringify(S.growth);S.month=10;const next=applyMonthlyTraitBenefits();return {first,after,again,growthSame,next};})()');
 assert.equal(out.after.energy,76);assert.equal(out.after.stress,14);assert.deepEqual(out.again,[]);assert.equal(out.growthSame,true);assert.equal(out.next.length,2);
});
test("trait activity costs are paid once per trait per month and never during previews",()=>{
 const r=isolated(["卷王"]);
 const out=r.json('(()=>{const make=()=>({label:"学习",margin:1,modifiers:traitActivityModifiers("academic","study")});const preview=make();applyTraitActivityOutcome(preview,"academic","study",{preview:true});const before={...S.resources};const result=make(),first=applyTraitActivityOutcome(result,"academic","study");const once={...S.resources};const duplicate=applyTraitActivityOutcome(result,"academic","study");const sameMonth=applyTraitActivityOutcome(make(),"academic","study");S.month=10;const next=applyTraitActivityOutcome(make(),"academic","study");return {before,once,first,duplicate,sameMonth,next};})()');
 assert.equal(out.before.energy,70);assert.equal(out.before.stress,20);assert.equal(out.once.energy,68);assert.equal(out.once.stress,21);assert.equal(out.first.length,2);assert.deepEqual(out.duplicate,[]);assert.deepEqual(out.sameMonth,[]);assert.equal(out.next.length,2);
});
test("bad luck leaves dice unchanged and grants at most two failure refunds per month",()=>{
 const r=isolated(["非酋"]);
 const out=r.json('(()=>{S.growth={xp:{},semester:{}};S.stats.academic=8;const attempt=(stat="academic")=>{const check=resolveCheck({stat,difficulty:15,dice:[1,1],modifiers:traitActivityModifiers(stat,"study")});applyTraitActivityOutcome(check,stat,"study");return check;};const first=attempt();applyTraitActivityOutcome(first,"academic","study");attempt();attempt();const xp=S.growth.xp.academic;S.month=10;attempt();return {dice:first.dice,modifier:first.modifierTotal,xp,next:S.growth.xp.academic,records:S.traitBenefits.records.filter(record=>record.kind==="failure-xp").length};})()');
 assert.deepEqual(out.dice,[1,1]);assert.equal(out.modifier,-1);assert.equal(out.xp,2);assert.equal(out.next,3);assert.equal(out.records,3);
});
test("appearance failure refund lowers stress without changing appearance",()=>{
 const r=isolated(["非酋"]);
 const out=r.json('(()=>{const before=S.stats.appearance;for(let i=0;i<3;i++){const check=resolveCheck({stat:"appearance",difficulty:15,dice:[1,1],modifiers:traitActivityModifiers("appearance","presentation")});applyTraitActivityOutcome(check,"appearance","presentation");}return {before,after:S.stats.appearance,stress:S.resources.stress,xp:S.growth.xp.appearance||0};})()');
 assert.equal(out.before,out.after);assert.equal(out.stress,16);assert.equal(out.xp,0);
});
test("exam forecasts never consume benefits and failure XP cannot raise the score retroactively",()=>{
 const r=isolated(["非酋"]);r.run('S.stats.academic=8;S.growth={xp:{academic:3},semester:{}};');
 const before=r.state();assert.equal(r.run('examForecastText("monthly","steady")'),r.run('examForecastText("monthly","steady")'));assert.deepEqual(r.state(),before);
 const out=r.json('(()=>{const result=calculateExam("考试快照","monthly","steady",null,[1,1]);return {academic:S.stats.academic,parts:result.parts,score:result.score,modifier:result.check.modifierTotal};})()');
 assert.equal(out.academic,9);assert.equal(out.parts.academicValue,8);assert.equal(out.parts.academicScore,104);assert.equal(Object.entries(out.parts).filter(([key])=>key!=="academicValue").reduce((total,[,value])=>total+value,0),out.score);
});
test("formation evidence is explicit, deduplicated by month, and separate from growth",()=>{
 const r=isolated(["认真"]);
 const out=r.json('(()=>{recordTraitFormationEvidence({eventId:"holiday",choiceId:"rest",calendarIndex:0,tags:["独处","社恐"]});for(let i=0;i<4;i++)recordTraitFormationEvidence({eventId:"practice",choiceId:String(i),calendarIndex:1,formationEvidence:["电波"]});recordTraitFormationEvidence({eventId:"practice",choiceId:"invalid",calendarIndex:2,formationEvidence:["古明地恋","不存在"]});return {shy:traitFormationJourney("社恐").months,wave:traitFormationJourney("电波").months,xp:getTraitXp("电波"),hidden:S.hiddenTraits};})()');
 assert.deepEqual(out.shy,[]);assert.deepEqual(out.wave,[1]);assert.equal(out.xp,0);assert.deepEqual(out.hidden,[]);
});
test("four evidence months allow voluntary formation no earlier than calendar index six",()=>{
 const r=isolated(["认真","开朗","吃货"]);evidence(r,"电波");
 assert.equal(r.run('S.calendarIndex=5;traitFormationEligibility("电波").eligible'),false);
 assert.equal(r.run('S.calendarIndex=6;traitFormationEligibility("电波").eligible'),true);
 const out=r.json('(()=>{const original=S.traits.map(i=>S.pool[i][0]);acceptTraitFormation("电波");return {original,owned:ownedTraitNames(),acquired:S.acquiredTraits,xp:getTraitXp("电波"),level:getTraitLevel("电波"),history:S.traitFormationHistory};})()');
 assert.deepEqual(out.original,["认真","开朗","吃货"]);assert.deepEqual(out.acquired,["电波"]);assert.deepEqual(out.owned,[...out.original,"电波"]);assert.equal(out.xp,0);assert.equal(out.level,1);assert.equal(out.history[0].type,"acquired");
 assert.equal(r.run('traitFormationEligibility("电波").eligible'),false);
});
test("formation can be deferred without costs, preserves evidence and respects its cooldown",()=>{
 const r=isolated(["认真"]);evidence(r,"电波");r.run('S.calendarIndex=6;');const resources=r.json('S.resources');
 assert.equal(r.run('tryTraitFormation(()=>{})'),true);assert.equal(r.buttons().length,2);r.click(1);
 assert.deepEqual(r.json('S.resources'),resources);assert.deepEqual(r.json('S.acquiredTraits'),[]);assert.equal(r.run('traitFormationJourney("电波").months.length'),4);
 assert.equal(r.run('tryTraitFormation(()=>{})'),false);assert.equal(r.run('S.calendarIndex=8;traitFormationEligibility("电波").eligible'),false);assert.equal(r.run('S.calendarIndex=9;traitFormationEligibility("电波").eligible'),true);
});
test("a run may form at most two new traits and only one offer occurs in a month",()=>{
 const r=isolated(["认真"]);for(const name of ["电波","吉他手","冰山"])evidence(r,name);r.run('S.calendarIndex=6;');
 assert.equal(r.run('tryTraitFormation(()=>{})'),true);r.click(0);assert.equal(r.run('tryTraitFormation(()=>{})'),false);
 r.run('S.calendarIndex=7;');assert.equal(r.run('tryTraitFormation(()=>{})'),true);r.click(0);
 assert.equal(r.state().acquiredTraits.length,2);assert.equal(r.run('S.calendarIndex=8;tryTraitFormation(()=>{})'),false);assert.equal(r.run('traitFormationEligibility("冰山").capacity'),false);
});
test("normal practice actions remain accessible without owning their target trait",()=>{
 const r=isolated(["认真"]);
 const out=r.json('(()=>{const event=buildTraitPracticeEvent();return {choices:event.choices.map(c=>c.id),wave:buildTraitPracticeChoice("电波"),map:formationEvidenceForChoice("trait-practice:4","practice-association")};})()');
 assert.equal(out.choices.length,7);assert.deepEqual(out.wave.formationEvidence,["电波"]);assert.equal(out.wave.protected,true);assert.deepEqual(out.map,["电波"]);
 r.run('S.acquiredTraits=["电波"];');assert.deepEqual(r.json('buildTraitPracticeChoice("电波").formationEvidence'),[]);
});
test("all six ordinary growth traits have distinct available activity templates",()=>{
 const r=isolated();
 const out=r.json('(()=>{return progressiveTraitNames().map(name=>{const set=TRAIT_CHOICE_SETS.find(item=>!item.hidden&&item.trait===name&&item.resolver==="traitActivity");return {name,exists:!!set,count:set?.choices?.length||0,distinct:set?new Set(set.choices.map(c=>c.id)).size:0};});})()');
 assert.equal(out.length,6);for(const row of out){assert(row.exists,row.name);assert(row.count>=2,row.name);assert.equal(row.count,row.distinct,row.name);}
});
test("study trait actions have real preparation and energy effects without invented NPCs",()=>{
 const r=isolated(["癫佬"]);
 const out=r.json('(()=>{S.flags.examPreparation=0;const before=JSON.stringify(S.npcs);const base='+replaceable+';const choices=injectTraitChoices(base,{allowTraitChoices:true,activityDomain:"study",eventId:"study-context",forceTraitChoice:true,checkDice:[6,6]});choices[0][2]();return {trait:choices[0][3].trait,safe:choices[1][0],original:base[0][0],inherited:!!S.flags.inheritedNormal,preparation:S.flags.examPreparation,energy:S.resources.energy,npcsSame:before===JSON.stringify(S.npcs),journey:traitJourney("癫佬")};})()');
 assert.equal(out.trait,"癫佬");assert.equal(out.safe,"安全办法");assert.equal(out.original,"普通办法");assert.equal(out.inherited,false);assert(out.preparation>0);assert(out.energy<70);assert.equal(out.npcsSame,true);assert.deepEqual(out.journey.npcs,[]);assert.equal(out.journey.xp,1);
});
test("trait cost previews are pure and stop advertising a surcharge after it has been paid",()=>{
 const r=isolated(["完美主义"]);
 r.run('var previewSet=TRAIT_CHOICE_SETS.find(set=>set.trait==="完美主义"&&set.resolver==="traitActivity");var previewTemplate=availableTraitTemplates(previewSet,{activityDomain:"study"})[0];');
 const before=r.state();const first=r.run('traitChoicePreview(previewSet,previewTemplate,{activityDomain:"study"})');
 assert(first.includes("本月首次加成另付"));assert.equal(first,r.run('traitChoicePreview(previewSet,previewTemplate,{activityDomain:"study"})'));assert.deepEqual(r.state(),before);
 r.run('activityCheck("academic","学习",7,[],[6,6],{activityDomain:"study"});');
 assert(!r.run('traitChoicePreview(previewSet,previewTemplate,{activityDomain:"study"})').includes("本月首次加成另付"));
});
test("activity and NPC uses share the same one-growth-record-per-month limit",()=>{
 const r=isolated(["癫佬"]);
 const out=r.json('(()=>{recordTraitUse("癫佬",{npc:"班长",sceneCategory:"classroom"});recordTraitUse("癫佬",{activityDomain:"study"});return traitJourney("癫佬");})()');
 assert.equal(out.xp,1);assert.equal(out.uses,2);assert.deepEqual(out.npcs,["班长"]);assert.deepEqual(out.scenes,["classroom","study"]);
});
test("fixed-media scenes suppress guitar actions without disabling music opportunities elsewhere",()=>{
 const r=isolated(["吉他手"]);
 assert.equal(r.run('injectTraitChoices('+replaceable+',{allowTraitChoices:true,activityDomain:"performance",musicAllowed:false,eventId:"fixed-media",forceTraitChoice:true}).some(choice=>choice[3]?.trait)'),false);
 assert.equal(r.run('injectTraitChoices('+replaceable+',{allowTraitChoices:true,activityDomain:"music",eventId:"music-session",forceTraitChoice:true}).some(choice=>choice[3]?.trait)'),true);
});
test("activity project success and failure differ while both retain real costs",()=>{
 const outcomes=[[6,6],[1,1]].map(dice=>{
  const r=isolated(["完美主义"]);
  return r.json('(()=>{S.stats.academic=8;S.project={id:"science",...PROJECTS.science,progress:0,result:null};const choices=injectTraitChoices('+replaceable+',{allowTraitChoices:true,activityDomain:"project",skill:"academic",projectId:"science",eventId:"project-context",forceTraitChoice:true,checkDice:'+JSON.stringify(dice)+'});choices[0][2]();return {progress:S.project.progress,energy:S.resources.energy,stress:S.resources.stress,xp:getTraitXp("完美主义"),npcs:traitJourney("完美主义").npcs};})()');
 });
 assert(outcomes[0].progress>outcomes[1].progress);assert.equal(outcomes[1].progress,0);for(const out of outcomes){assert(out.energy<70);assert.equal(out.xp,1);assert.deepEqual(out.npcs,[]);}assert(outcomes[1].stress>outcomes[0].stress);
});
test("unmarked, protected, disabled and solo choices never become activity trait choices",()=>{
 const r=isolated(["癫佬"]);
 const out=r.json('(()=>{const context={allowTraitChoices:true,activityDomain:"study",eventId:"protected-activity",forceTraitChoice:true};return [[ ["唯一","",()=>{},{role:"study",replaceable:true}] ],[["保护","",()=>{},{role:"study",replaceable:true,protected:true}],["安全","",()=>{}]],[["禁用","",()=>{},{role:"study",replaceable:true,disabled:true}],["安全","",()=>{}]],[["未标记","",()=>{}],["安全","",()=>{}]]].map(list=>injectTraitChoices(list,context).some(item=>item[3]?.trait));})()');
 assert.deepEqual(out,[false,false,false,false]);
});
test("Koishi synthesis counts distinct natural months, not overlapping source XP",()=>{
 const r=isolated(["癫佬","电波"]);fusionSeed(r,true);
 assert.equal(r.run('fusionEligibility("koishi").eligible'),false);assert.equal(r.run('fusionEligibility("koishi").monthCount'),6);
 fusionSeed(r);const eligible=r.json('fusionEligibility("koishi")');assert.equal(eligible.eligible,true);assert.equal(eligible.monthCount,12);assert.equal(eligible.people,4);assert.equal(eligible.scenes,3);assert.deepEqual(eligible.shared,["班长"]);
 assert.equal(r.run('S.calendarIndex=15;fusionEligibility("koishi").eligible'),false);
});
test("an acquired source may synthesize later but formation evidence is never fusion XP",()=>{
 const r=isolated(["癫佬"]);evidence(r,"电波");r.run('S.calendarIndex=6;acceptTraitFormation("电波");S.calendarIndex=16;');
 assert.equal(r.run('fusionEligibility("koishi").selected'),true);assert.equal(r.run('fusionEligibility("koishi").eligible'),false);
 fusionSeed(r);assert.equal(r.run('fusionEligibility("koishi").eligible'),true);
});
test("Koishi replaces source social choices while preserving ordinary study and project methods",()=>{
 const r=isolated(["癫佬","电波"]);fusionSeed(r);r.run('acceptFusion(enabledFusionRecipes()[0]);');
 const out=r.json('(()=>{const base='+replaceable+';const social=injectTraitChoices(base,{allowTraitChoices:true,tags:["npc","social"],npc:"班长",sceneCategory:"classroom",eventId:"fused-social",forceTraitChoice:true});const study=injectTraitChoices(base,{allowTraitChoices:true,activityDomain:"study",eventId:"fused-study",forceTraitChoice:true});S.project={id:"science",...PROJECTS.science,progress:0,result:null};const project=injectTraitChoices(base,{allowTraitChoices:true,activityDomain:"project",projectId:"science",eventId:"fused-project",forceTraitChoice:true});return {social:social[0][3].trait,study:study[0][3].trait,project:project[0][3].trait,locked:sourceTraitLocked("癫佬"),again:fusionEligibility("koishi").eligible};})()');
 assert.equal(out.social,"古明地恋");assert(["癫佬","电波"].includes(out.study));assert(["癫佬","电波"].includes(out.project));assert.equal(out.locked,true);assert.equal(out.again,false);
});
test("disabled hidden content cannot activate, lock source growth, or enter visible badges",()=>{
 const r=isolated(["社恐","吉他手","完美主义","冰山"]);
 const before=r.state();assert.equal(r.run('GameDebug.prepareFusion("后藤独")'),false);assert.equal(r.run('GameDebug.prepareFusion("雪之下雪乃")'),false);assert.deepEqual(r.state(),before);
 const out=r.json('(()=>{S.hiddenTraits=["后藤独","雪之下雪乃"];traitJourney("社恐").fusedInto="后藤独";traitJourney("吉他手").fusedInto="后藤独";const before=S.fusionHistory.length;for(const id of ["bocchi","yukino"])acceptFusion(FUSION_RECIPES.find(item=>item.id===id));return {enabled:enabledFusionRecipes().map(item=>item.hidden),active:activeHiddenTraitNames(),locked:sourceTraitLocked("社恐"),badges:getVisibleTraitBadges().map(item=>item.label),history:S.fusionHistory.length-before,status:Object.keys(fusionStatus())};})()');
 assert.deepEqual(out.enabled,["古明地恋"]);assert.deepEqual(out.active,[]);assert.equal(out.locked,false);assert(!out.badges.some(label=>label.includes("后藤独")||label.includes("雪之下雪乃")));assert.equal(out.history,0);assert.deepEqual(out.status,["古明地恋"]);
});
test("trait UI exposes category, effects, acquired origin and the opportunity cost of replacement",()=>{
 const r=runtime();assert(r.elements.traitPool.innerHTML.includes("trait-type"));assert(r.elements.traitPool.innerHTML.includes("trait-card-effect"));assert(r.elements.traitPool.innerHTML.includes("本版不设等级")||r.elements.traitPool.innerHTML.includes("可成长"));
 const s=isolated(["癫佬"]);s.run('S.acquiredTraits=["电波"];update();');
 assert(s.elements.traitDetails.innerHTML.includes("电波"));assert(s.elements.traitDetails.innerHTML.includes("后天形成"));assert(s.elements.traitFormationInfo.innerHTML.includes("后天名额 1/2"));
 s.run('showChoices("测试","机会成本","",'+replaceable+',()=>{},{allowTraitChoices:true,activityDomain:"study",eventId:"visible-replacement",forceTraitChoice:true});');
 const button=s.buttons().find(item=>item.classList.contains("trait-choice"));assert(button);assert(button.children.some(item=>item.textContent.includes("替代：普通办法")&&item.textContent.includes("不获得原收益")));assert(button.title.includes("精力"));
 assert(!s.elements.debugInfo.textContent.includes("后藤独"));assert(!s.elements.debugInfo.textContent.includes("雪之下雪乃"));
});
console.log(passed+" v0.6.1 trait groups passed.");
