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
function traitRuntime(traits=["癫佬","认真","运动少女"]){
 const r=runtime();r.launch({traits});
 r.run('S.traitProgress={};S.traitJourneys={};S.traitChoiceState={misses:0,lastEventId:null,recentChoiceIds:[]};');
 return r;
}
const base='[["正常主动方案","",()=>{S.flags.normalEffect=true;},{id:"normal",role:"social",replaceable:true}],["安全方案","",()=>{}, {id:"safe",protected:true}]]';
test("progressive trait replaces one explicit slot without inheriting its benefit or mutating the source",()=>{
 const r=traitRuntime();
 const v=r.json('(()=>{const base='+base+';const list=injectTraitChoices(base,{eventId:"replace-test",allowTraitChoices:true,tags:["npc","social"],npc:"班长",sceneCategory:"classroom",forceTraitChoice:true,checkDice:[1,1]});const original=base[0][0];list[0][2]();return {length:list.length,original,unaffected:list[1][0],replaced:list[0][3].replacedId,normalEffect:!!S.flags.normalEffect,relation:getRelation("班长"),pending:S.flags["chaosAftermath:班长"].pending};})()');
 assert.equal(v.length,2);assert.equal(v.original,"正常主动方案");assert.equal(v.unaffected,"安全方案");assert.equal(v.replaced,"normal");assert.equal(v.normalEffect,false);assert(v.relation<1);assert.equal(v.pending,true);
});
test("single, unmarked and protected choices cannot be replaced",()=>{
 const r=traitRuntime();
 const v=r.json('(()=>{const c={eventId:"protected",allowTraitChoices:true,tags:["npc","social"],npc:"班长",forceTraitChoice:true};const lists=[injectTraitChoices([["继续","",()=>{}, {role:"social",replaceable:true}]],c),injectTraitChoices([["甲","",()=>{}],["乙","",()=>{}]],c),injectTraitChoices([["关键","",()=>{}, {role:"social",replaceable:true,protected:true}],["安全","",()=>{}]],c)];return lists.map(list=>list.some(x=>x[3]?.trait));})()');
 assert.deepEqual(v,[false,false,false]);
});
test("four uses in one month yield one XP; four months reach level two",()=>{
 const r=traitRuntime();
 const v=r.json('(()=>{for(let i=0;i<4;i++)advanceTraitProgress(TRAIT_CHOICE_SETS[0],{npc:["班长","同人女","体育生","中二病"][i],sceneCategory:["classroom","club","campus","holiday"][i]});return {xp:getTraitXp("癫佬"),level:getTraitLevel("癫佬"),hidden:S.hiddenTraits};})()');
 assert.deepEqual(v,{xp:1,level:1,hidden:[]});
 const later=r.json('(()=>{for(const [year,month] of [[1,10],[1,11],[1,12]]){S.year=year;S.month=month;advanceTraitProgress(TRAIT_CHOICE_SETS[0],{npc:"班长",sceneCategory:"classroom"});}return {xp:getTraitXp("癫佬"),level:getTraitLevel("癫佬")};})()');
 assert.deepEqual(later,{xp:4,level:2});
});
test("koishi synthesis requires both sources, breadth, shared success and winter of year two",()=>{
 const r=traitRuntime(["癫佬","电波","认真"]);
 r.run('for(const [source,name] of ["癫佬","电波"].entries()){const j=traitJourney(name);Object.assign(j,{xp:6,months:Array.from({length:6},(_,i)=>"1:"+((source*6+i+8)%12+1)),npcs:["班长","同人女","体育生","中二病"],scenes:["classroom","club","holiday"],positiveNpcs:["班长"],styles:{battle:1},uses:6});S.traitProgress[name]=6;}');
 assert.equal(r.run('S.calendarIndex=15;fusionEligibility("koishi").eligible'),false);
 assert.equal(r.run('S.calendarIndex=16;S.year=2;S.month=1;S.term="高二寒假";fusionEligibility("koishi").eligible'),true);
 assert.equal(r.run('tryTraitFusion(()=>{})'),true);assert.equal(r.elements.title.textContent,"没有人记得第一回合");r.click(0);
 const state=r.state();assert(state.hiddenTraits.includes("古明地恋"));assert.equal(state.flags.koishiAwakenedAt.index,16);assert.equal(state.traitJourneys["癫佬"].fusedInto,"古明地恋");
 const s=traitRuntime(["癫佬","认真","运动少女"]);
 s.run('S.calendarIndex=16;for(const name of ["癫佬","电波"]){const j=traitJourney(name);Object.assign(j,{xp:6,npcs:["班长","同人女","体育生","中二病"],scenes:["classroom","club","holiday"],positiveNpcs:["班长"]});}');
 assert.equal(s.run('fusionEligibility("koishi").eligible'),false,"unselected source must not synthesize");
});
test("other hidden recipes are deleted without removing their ordinary growth lines",()=>{
 const bocchi=traitRuntime(["社恐","吉他手","认真"]);
 bocchi.run('S.calendarIndex=12;for(const name of ["社恐","吉他手"]){const j=traitJourney(name);Object.assign(j,{xp:5,npcs:["班长","同人女"],scenes:["club","campus"],positiveNpcs:["班长"],styles:{}});S.traitProgress[name]=5;}traitJourney("吉他手").styles.performance=1;ensureNpc("班长",4);S.npcTrust["班长"]=2;');
 assert.equal(bocchi.run('fusionEligibility("bocchi").eligible'),false);
 assert.equal(bocchi.run('fusionEligibility("bocchi").missingRecipe'),true);
 assert.equal(bocchi.run('getTraitLevel("社恐")'),2);
 assert.equal(bocchi.run('getTraitLevel("吉他手")'),2);
 const yukino=traitRuntime(["完美主义","冰山","认真"]);
 yukino.run('S.calendarIndex=12;S.stats.academic=16;for(const name of ["完美主义","冰山"]){const j=traitJourney(name);Object.assign(j,{xp:5,npcs:["班长","同人女"],scenes:["classroom","campus"],positiveNpcs:["班长"],styles:{}});S.traitProgress[name]=5;}traitJourney("完美主义").styles["direct-help"]=1;traitJourney("冰山").failures=1;');
 assert.equal(yukino.run('fusionEligibility("yukino").eligible'),false);
 assert.equal(yukino.run('fusionEligibility("yukino").missingRecipe'),true);
 assert.equal(yukino.run('getTraitLevel("完美主义")'),2);
 assert.equal(yukino.run('getTraitLevel("冰山")'),2);
 assert.deepEqual(yukino.json('enabledFusionRecipes().map(item=>item.hidden)'),["古明地恋"]);
 assert.deepEqual(yukino.json('Object.keys(fusionStatus())'),["古明地恋"]);
});
test("hidden choice takes over its source options but can still fail",()=>{
 const r=traitRuntime(["癫佬","电波","认真"]);
 const v=r.json('(()=>{S.hiddenTraits=["古明地恋"];S.hiddenTraitSources["古明地恋"]=["癫佬","电波"];traitJourney("癫佬").fusedInto="古明地恋";traitJourney("电波").fusedInto="古明地恋";const choices=injectTraitChoices('+base+',{allowTraitChoices:true,eventId:"evolved",tags:["npc","social"],npc:"大小姐",sceneCategory:"campus",forceTraitChoice:true,checkDice:[1,1]});const before=getRelation("大小姐");choices[0][2]();return {length:choices.length,label:choices[0][0],delta:getRelation("大小姐")-before};})()');
 assert.equal(v.length,2);assert(v.label.startsWith("【古明地恋】"));assert(v.delta<0);
});
test("normal pool is random and hidden character traits never appear at setup",()=>{
 const r=runtime();
 const v=r.json('(()=>{let without=false,valid=true;for(let i=0;i<40;i++){setGameSeed("pool-"+i);renderPool();const names=S.pool.map(item=>item[0]);without ||= !names.includes("癫佬");valid &&= names.length===10&&new Set(names).size===10&&!names.some(name=>HIDDEN_TRAITS[name]);}return {without,valid};})()');
 assert.deepEqual(v,{without:true,valid:true});
});
test("monthly exam is one decision plus result; major exam has one extra decision",()=>{
 const r=runtime();r.launch();r.run('startExam("测试月考","monthly","steady",()=>{});');
 assert.equal(r.elements.tag.textContent,"考试结果");assert.equal(r.buttons().length,1);
 r.run('startExam("测试期末","term1","steady",()=>{});');assert.equal(r.buttons().length,2);r.click(0);
 assert.equal(r.elements.tag.textContent,"考试结果");assert.equal(r.buttons().length,1);
});
test("fixed rolls expose academic advantage without halting low builds",()=>{
 const r=runtime();r.launch();
 const v=r.json('(()=>{const score=(academic,kind)=>{S.stats.academic=academic;S.resources.energy=80;S.resources.stress=20;S.flags.examPreparation=0;return calculateExam("test",kind,"steady",null,[3,3]);};const low=score(0,"monthly"),mid=score(8,"monthly"),high=score(20,"monthly"),peak=score(30,"graduation");return {low:low.score,mid:mid.score,high:high.score,peak:peak.score,academicValue:high.parts.academicValue};})()');
 assert(v.low>=200&&v.low<=330);assert(v.mid>=350&&v.mid<=450);assert(v.high>=510&&v.high<=600);assert(v.peak>=660&&v.peak<=735);assert.equal(v.academicValue,20);
});
test("exam forecast is visible before choosing and result exposes its components",()=>{
 const r=runtime();r.launch();
 r.run('runFixedMonth(0,()=>{});');
 // 九月首个事件不是考试，直接打开十月月考定义。
 r.run('const event=FIXED[10].find(item=>item.id==="y1_oct_first_exam");const choices=event.choices.map((choice,index)=>{const meta={...choice[3],preview:()=>examForecastText("monthly",choice[3].id)};return [choice[0],choice[1],choice[2],meta];});showChoices("测试",event.title,event.text,choices,()=>{}, {eventId:event.id});');
 assert(r.elements.choices.children[0].children[0].textContent.includes("预计"));
 const result=r.json('(()=>{S.stats.academic=20;S.resources.energy=80;S.resources.stress=20;const x=calculateExam("成绩说明","monthly","steady",null,[3,3]);return {text:examResultText(x),sum:Object.entries(x.parts).filter(([key])=>key!=="academicValue").reduce((n,[,value])=>n+value,0),score:x.score};})()');
 assert(result.text.includes("学力20贡献 +260"));assert(result.text.includes("成绩构成"));assert.equal(result.sum,result.score);
});
test("energy and stress overflow create real consequences",()=>{
 const r=runtime();r.launch();
 const v=r.json('(()=>{S.resources.energy=2;S.resources.stress=10;changeResource("energy",-12,"测试透支");const first={...S.resources,over:S.flags.overexertionCount};S.resources.energy=50;S.resources.stress=99;changeResource("stress",11,"测试压力");return {first,second:{...S.resources,over:S.flags.stressOverflowCount}};})()');
 assert.deepEqual(v.first,{cash:v.first.cash,energy:0,stress:18,over:1});assert.equal(v.second.energy,45);assert.equal(v.second.stress,100);assert.equal(v.second.over,1);
});
test("ordinary course months no longer grant free academic experience",()=>{
 const r=runtime();r.launch();
 const v=r.json('(()=>{S.year=1;S.month=10;S.term="高一上";S.calendarIndex=1;delete S.flags["monthStarted:1:10"];S.growth.xp.academic=0;const before=S.stats.academic;beginCalendarMonth();return {before,after:S.stats.academic,xp:S.growth.xp.academic||0,courseMonths:S.flags.courseMonths};})()');
 assert.equal(v.before,v.after);assert.equal(v.xp,0);assert(v.courseMonths>=1);
});
test("all eight NPC introductions are unique and finish without an automatic second conversation",()=>{
 const r=runtime();r.launch();
 assert.equal(r.run('new Set(Object.values(NPC_INTROS).map(item=>item.title)).size'),8);
 r.run('S.npcs=[];setGameRandomSource(()=>0);runRandom(0,()=>{S.flags.introFinished=true;});');
 const expected=r.run('NPC_INTROS[Object.keys(NPCS)[0]].title');assert.equal(r.elements.title.textContent,expected);assert.equal(r.buttons().length,2);
 r.click(0);assert.equal(r.buttons().length,1);r.click(0);
 assert.equal(r.state().flags.introFinished,true);assert.equal(r.state().npcs.length,1);assert.equal(r.elements.title.textContent,expected);
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
 const r=runtime();r.launch({traits:["癫佬","电波","认真"]});const key=r.run("SAVE_KEY"),saved=r.storage.get(key);assert(saved);
 r.run("GameDebug.prepareFusion('古明地恋');saveLocalGame();");assert.equal(r.storage.get(key),saved);assert(!r.state().hiddenTraits.includes("古明地恋"));
 r.run("GameDebug.jump(16);");assert.equal(r.elements.title.textContent,"没有人记得第一回合");
});
test("fixed event alternatives leave different persistent effects",()=>{
 const a=runtime(),b=runtime();a.launch();b.launch();
 a.run('applyEffects(LEGACY_FIXED_EFFECTS["扫雪"][0]);');b.run('applyEffects(LEGACY_FIXED_EFFECTS["扫雪"][1]);');
 assert.notDeepEqual(a.state().growth,b.state().growth);assert.notEqual(a.state().resources.energy,b.state().resources.energy);
});
test("habits apply once per month, become stable and keep their real costs",()=>{
 const r=runtime();r.launch();
 const v=r.json('(()=>{S.year=2;S.month=9;S.project={id:"science",...PROJECTS.science,progress:0,result:null};S.habits={study:"foundation",afterschool:"project",recovery:"sleep",tenure:{study:0,afterschool:0,recovery:0},history:[],configured:true,locked:[],flexible:null,socialFocus:null};S.resources={cash:0,energy:50,stress:30};const first=applyHabitEffects();const duplicate=applyHabitEffects();const once={energy:S.resources.energy,stress:S.resources.stress,tenure:{...S.habits.tenure}};S.month=10;const second=applyHabitEffects();return {first,duplicate,once,second,stable:habitStatus("study"),academic:S.stats.academic};})()');
 assert.equal(v.first,true);assert.equal(v.duplicate,false);assert.equal(v.second,true);assert.equal(v.once.energy,52);assert.equal(v.once.stress,27);assert.equal(v.once.tenure.study,1);assert.equal(v.stable,"稳定");assert(v.academic>=9);
});
test("senior year locks two habit slots and charges for the one allowed adjustment",()=>{
 const r=runtime();r.launch();
 const v=r.json('(()=>{S.year=3;S.month=9;S.habits={study:"foundation",afterschool:"club",recovery:"sleep",tenure:{study:3,afterschool:3,recovery:3},history:[],configured:true,locked:[],flexible:null,socialFocus:null};S.resources.energy=80;S.resources.stress=20;lockSeniorHabits("body");let blocked=false;try{setHabit("study","timed","test");}catch(error){blocked=true;}const changed=setHabit("recovery","exercise","test");return {blocked,changed,locked:S.habits.locked,flexible:S.habits.flexible,energy:S.resources.energy,stress:S.resources.stress};})()');
 assert.equal(v.blocked,true);assert.equal(v.changed,true);assert.deepEqual(v.locked,["study","afterschool"]);assert.equal(v.flexible,"recovery");assert.equal(v.energy,74);assert.equal(v.stress,28);
});
test("a stable study habit changes exam resolution without becoming a daily click",()=>{
 const a=runtime(),b=runtime();a.launch();b.launch();
 a.run('S.year=2;S.habits={study:"timed",afterschool:"club",recovery:"sleep",tenure:{study:3,afterschool:3,recovery:3},history:[],configured:true,locked:[],flexible:null,socialFocus:null};');
 b.run('S.year=2;S.habits={study:"timed",afterschool:"club",recovery:"sleep",tenure:{study:1,afterschool:3,recovery:3},history:[],configured:true,locked:[],flexible:null,socialFocus:null};');
 const av=a.json('calculateExam("习惯测试","monthly","risk",null,[3,3])'),bv=b.json('calculateExam("习惯测试","monthly","risk",null,[3,3])');
 assert.equal(av.habitLabel,"限时训练");assert.equal(av.check.modifierTotal-bv.check.modifierTotal,1);assert(av.score>bv.score);
});
test("rumors emerge from conditions, require a response and enter the forum",()=>{
 const r=runtime();r.launch();
 r.run('S.year=2;S.month=9;S.calendarIndex=12;S.tendencies["网络化"]=4;');
 assert.equal(r.run("tryCampusRumor(()=>{})"),true);assert.equal(r.state().rumors[0].id,"internet-native");assert(r.state().forumPosts.some(post=>post.kind==="rumor"));assert.equal(r.elements.title.textContent,"原来她们是这样说的");
 r.click(0);const state=r.state();assert.equal(state.rumors[0].heard,true);assert.equal(state.rumors[0].response,"embrace");assert.equal(state.rumors[0].strength,2);assert.equal(r.run("tryCampusRumor(()=>{})"),false);
});
test("a heard rumor returns through at most two NPC conversations",()=>{
 const r=runtime();r.launch();
 const v=r.json('(()=>{S.rumors=[{id:"test",title:"测试传闻",heard:true,response:"ignore",callbacks:[]}];ensureNpc("班长",2);ensureNpc("同人女",2);ensureNpc("体育生",2);return [consumeRumorCallback("班长"),consumeRumorCallback("班长"),consumeRumorCallback("同人女"),consumeRumorCallback("体育生"),S.rumors[0].callbacks];})()');
 assert(v[0].includes("测试传闻"));assert.equal(v[1],"");assert(v[2].includes("测试传闻"));assert.equal(v[3],"");assert.deepEqual(v[4],["班长","同人女"]);
});
test("forum background posts are deterministic and do not add mandatory actions",()=>{
 const a=runtime(),b=runtime();a.launch({seed:"forum"});b.launch({seed:"forum"});
 for(const r of [a,b])r.run('S.year=2;S.month=10;S.calendarIndex=13;createForumMonthPosts();createForumMonthPosts();update();');
 assert.equal(a.state().forumPosts.length,2);assert.deepEqual(a.state().forumPosts,b.state().forumPosts);assert.equal(a.elements.forumCard.classList.contains("hidden"),false);
});
test("graduation archive data reads habits, relationships and real rumors",()=>{
 const r=runtime();r.launch();
 const v=r.json('(()=>{S.exam.graduation=555;S.project={id:"archive",...PROJECTS.archive,progress:10,result:"缩小规模完成"};S.habits={study:"foundation",afterschool:"people",recovery:"sleep",tenure:{study:4,afterschool:4,recovery:4},history:[],configured:true,locked:["study","recovery"],flexible:"afterschool",socialFocus:"同人女"};ensureNpc("同人女",6);S.npcTrust["同人女"]=5;S.rumors=[{id:"doujin",title:"同人社编外人员",heard:true,response:"clarify",callbacks:[]}];return graduationCardData();})()');
 assert.equal(v.version,"0.6.2");assert.equal(v.stats.length,5);assert(v.routine.includes("基础复盘"));assert(v.relationships[0].includes("同人女"));assert.deepEqual(v.rumors,["同人社编外人员"]);assert(v.closing.length>20);
});
console.log(passed+" regression groups passed.");
