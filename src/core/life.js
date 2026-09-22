"use strict";

function birthdayLimit(month){return [0,31,29,31,30,31,30,31,31,30,31,30,31][month]||0;}
function refreshFamily(){const family=FAMILY_BACKGROUNDS[$("family").value];$("familyHelp").textContent=family? family.help:"请选择一个背景。";}
function rerollSeed(){
 const seed=$("seedInput").value.trim().slice(0,40);if(!seed)return alert("先填一个随机种子。");
 setGameSeed(seed);renderPool();update();
}
function launchGame(initial){
 S=freshState();
 S.name=initial.name;S.stats={...initial.stats};S.initialStats={...initial.stats};S.family=initial.family;
 S.pool=initial.pool.map(name=>TRAITS.find(trait=>trait[0]===name));S.traits=[...initial.traits];
 S.birthdayMonth=initial.birthdayMonth;S.birthdayDay=initial.birthdayDay;S.rng={...initial.rng};
 GAME_RANDOM_SOURCE=null;
 beginSession(initial);S.phase="month";
 $("setup").classList.add("hidden");$("result").classList.add("hidden");$("game").classList.remove("hidden");
 $("playerNameLabel").textContent=S.name;$("log").innerHTML="";$("globalMessage").textContent="";
 log("你开始了高一上学期的生活。");
 log("初始特质："+S.traits.map(i=>S.pool[i][0]).join("、"));
 log("家境："+FAMILY_BACKGROUNDS[S.family].label+"；基础学习和主线不需要付费。");
 startCalendarMonth();
}
function clubSkill(club){
 if(["篮球社","街舞社"].includes(club))return "fitness";
 if(["文学社","动漫社","音乐社","美术社"].includes(club))return "creativity";
 if(club==="辩论社")return "academic";
 return "expression";
}
function closestNpc(){return [...S.npcs].sort((a,b)=>(S.npcTrust[b]||0)*2+getRelation(b)-((S.npcTrust[a]||0)*2+getRelation(a)))[0]||null;}
function npcGoal(name){return NPC_ARCS[name]?.goals[Math.min(2,S.year-1)]||NPCS[name]?.tag||"";}
function nextSocialNpc(){
 if(!S.npcs.length){ensureNpc("班长",1);return "班长";}
 normalizeSchoolLifeState();
 if(S.habits.afterschool==="people"&&S.habits.socialFocus&&S.calendarIndex%2===0)return S.habits.socialFocus;
 if(S.habits.afterschool==="project"&&S.project&&S.npcs.includes(S.project.partner)&&S.calendarIndex%2===1)return S.project.partner;
 // 优先看很久没有见过的人，不让每月事件始终锁在同一个对象上。
 const last=S.flags.npcLastMonth||{};
 const min=Math.min(...S.npcs.map(name=>last[name]??-1));
 return randomItem(S.npcs.filter(name=>(last[name]??-1)===min));
}
function sceneCategory(){
 if(CALENDAR[S.calendarIndex]?.holiday)return "holiday";
 return ["classroom","club","campus"][S.calendarIndex%3];
}
function createNpcScene(name){
 ensureNpc(name,1);
 const arc=NPC_ARCS[name],stage=Math.min(2,S.year-1),scene=arc.scenes[stage];
 const visits=(S.flags.npcVisits||{})[name]||0;
 S.flags.npcLastMonth=S.flags.npcLastMonth||{};S.flags.npcLastMonth[name]=S.calendarIndex;
 S.flags.npcVisits=S.flags.npcVisits||{};S.flags.npcVisits[name]=visits+1;
 const supported=S.flags["npcHelp:"+name]||0;
 const previous=supported?"\n\n她还记得你以前真的帮过忙，这次没有再从头解释。":visits?"\n\n你们已经见过几次，但她仍在试探哪些事情适合对你说。":"";
 const rumor=consumeRumorCallback(name);
 const category=sceneCategory();
 const places={classroom:"课间的教室里",club:"放学后的活动室旁",campus:"离校前的走廊上",holiday:"假期约好的见面里"};
 const context={allowTraitChoices:true,tags:["npc","social"],sceneCategory:category,npc:name,eventId:"npc:"+S.year+":"+S.month+":"+name,serious:S.year===3&&S.month===5};
 return {id:context.eventId,title:name+" · "+scene[0],tag:"人物互动 · "+places[category],text:scene[1]+previous+rumor,context,choices:[
  {id:"help",label:scene[2]+" · "+ATTRIBUTES[arc.skill].label,role:"social",replaceable:true,preview:"精力-4 · 判定成功时关系+2、信任+1",
   run:()=>{
    const check=activityCheck(arc.skill,scene[0],7,[{label:"相处中的信任",value:(S.npcTrust[name]||0)>=4?1:0}],null,{...context,activityDomain:"social"});
    gainExperience(arc.skill,1,"一起处理具体的事");changeResource("energy",-4);
    const good=check.margin>=0;changeRelation(name,good?2:1,"一起相处");
    if(good){changeTrust(name,1,"帮上了实际的忙");S.flags["npcHelp:"+name]=supported+1;}
    if(S.year===3)S.flags["npcEnding:"+name]=good?"共同完成":"一起尝试";
    return (good?scene[3]:"你没有马上帮她把事情做好。你们先留下了目前做到的部分，她看得出来，你至少愿意一起试。")+"\n\n"+formatCheck(check);
   },impact:()=>name+"记得你愿意一起处理她在意的事"},
  {id:"listen",label:"先认真听她说，不急着替她解决",role:"safe",protected:true,
   text:"你没有把谈话变成一场能力展示。她慢慢说完，发现不必把一切整理成漂亮的答案。",effects:[FX.relation(name,1),FX.trust(name,1),FX.resource("energy",-2)],
   run:()=>{S.flags["npcListened:"+name]=(S.flags["npcListened:"+name]||0)+1;if(S.year===3)S.flags["npcEnding:"+name]="认真听完";}},
  {id:"boundary",label:"今天有点累，约好下次再认真聊",role:"withdraw",protected:true,
   text:"你说明了自己现在没有足够精力。她没有立刻变得更亲近，但也不用猜测你为什么心不在焉。",effects:[FX.resource("energy",6),FX.resource("stress",-3)]},
  traitPracticeEntry("先约下次聊，用这段时间试一种自己的做法")
 ]};
}
function traitPracticeEntry(label="试一种自己的做法 · 可选"){
 return {id:"try-practice",label,protected:true,condition:()=>S.acquiredTraits.length<TRAIT_FORMATION_RULES.maxAcquired,
  preview:"改做个人练习，不获得原互动或假期行动收益；进入后再选具体做法",
  run:action=>{runStoryEvent(buildTraitPracticeEvent(),action.next);return "HANDLED";}};
}
function beginCalendarMonth(){
 const key=monthKey();if(S.flags["monthStarted:"+key])return;
 S.flags["monthStarted:"+key]=true;
 const point=CALENDAR[S.calendarIndex];
 const shock=Number.isInteger(S.flags.familyShockUntil)&&S.calendarIndex<=S.flags.familyShockUntil;
 const income=Math.floor(FAMILY_BACKGROUNDS[S.family].allowance*(shock?0.5:1));
 changeResource("cash",income,"本月零花钱");
 changeResource("cash",-Math.min(40,S.resources.cash),"本月日常开销");
 const recovery=(point.holiday?18:12)+Math.floor(S.stats.fitness/4);
 changeResource("energy",recovery,"月间恢复（含体能）");
 changeResource("stress",point.holiday?-6:S.year===3?5:2,"新一个月的节奏");
 if(!point.holiday){
  S.flags.courseMonths=(S.flags.courseMonths||0)+1;
  changeResource("energy",-4,"维持日常课程");
 }
 applyHabitEffects();
 applyMonthlyTraitBenefits();
 createForumMonthPosts();
 if(S.year===3&&S.flags.seniorPriority){
  const priority=S.flags.seniorPriority;
  if(priority==="study"){gainExperience("academic",1,"持续复习");changeResource("energy",-5);changeResource("stress",2);}
  if(priority==="create"){gainExperience("creativity",1,"保留创作");changeResource("energy",-3);changeResource("stress",-1);}
  if(priority==="body"){changeResource("energy",4,"守住身体状态");changeResource("stress",-3);}
  if(priority==="people"){
   gainExperience("expression",1,"固定联系");changeResource("stress",-3);
   const name=closestNpc();if(name)changeRelation(name,1,"没有中断的联系");
  }
 }
 S.flags.monthMemoryStart=S.memories.length;
}
function startCalendarMonth(){
 const point=CALENDAR[S.calendarIndex];if(!point){showGraduation();return;}
 Object.assign(S,{year:point.year,month:point.month,term:point.term,phase:"month"});
 beginCalendarMonth();update();
 const runContent=()=>{
  if(point.holiday){runHolidayMonth();return;}
  if(S.year===1){
   runFixedMonth(0,()=>{
    const afterPhoto=()=>runRoute(()=>runBirthday(()=>runRandom(0,finishMonth)));
    if(S.month===9)runStoryEvent(PHOTO_EVENT,afterPhoto);else afterPhoto();
   });
   return;
  }
  if(S.year===2){
   if(!S.project){
    chooseProject(()=>S.habits.configured?runSeniorRemainder():showInitialHabitSetup(()=>runSeniorRemainder()));
    return;
   }
   const event=Y2_EVENTS[S.month];
   if(event)runStoryEvent(event,()=>runYearTwoExam(()=>runSeniorRemainder()));
   else runSeniorRemainder();
   return;
  }
  const event=Y3_EVENTS[S.month];
  if(event)runStoryEvent(event,runSeniorRemainder);else runSeniorRemainder();
 };
 const proceed=()=>{
  normalizeSchoolLifeState();
  if(S.year===2&&S.project&&!S.habits.configured){showInitialHabitSetup(runContent);return;}
  const reviewKey=S.year+":"+S.month;
  if(S.year===2&&[1,3].includes(S.month)&&!S.flags["habitReview:"+reviewKey]){
   showHabitReview(reviewKey,HABIT_SLOT_ORDER,runContent);return;
  }
  if(S.year===3&&!S.habits.configured)ensureDefaultHabits();
  if(S.year===3&&S.month===1&&S.flags.seniorHabitsLocked&&!S.flags["habitReview:"+reviewKey]){
   showHabitReview(reviewKey,[S.habits.flexible||"recovery"],runContent);return;
  }
  runContent();
 };
 if(!tryTraitFusion(proceed))proceed();
}
function runSeniorRemainder(){runBirthday(()=>npcInteraction(nextSocialNpc(),finishMonth));}
function advanceCalendar(){S.calendarIndex+=1;startCalendarMonth();}
function finishCalendarMonth(){
 if(tryTraitFormation(finishCalendarMonth))return;
 if(tryTraitFusion(finishCalendarMonth))return;
 if(tryCampusRumor(finishCalendarMonth))return;
 if(S.year===3&&S.month===6){graduationBond(showGraduation);return;}
 if(S.month===7){showYearSummary();return;}
 const recent=S.memories.slice(S.flags.monthMemoryStart||0).slice(-2).map(m=>"· "+m.text).join("\n");
 const fatigue=S.resources.energy<25?"你已经很累，下个月值得给休息留一点位置。":S.resources.stress>=70?"紧绷的感觉没有自动消失。之后的决定要给恢复留一点余地。":"你收好书包，准备把这个月翻过去。";
 showContinueScreen("本月结束",S.term+" · "+S.month+"月",fatigue+(recent?"\n\n"+recent:""),"进入下个月",advanceCalendar);
}
function showYearSummary(){
 const grade=S.year===1?"高一":"高二";
 const abilities=Object.keys(ATTRIBUTES).map(key=>ATTRIBUTES[key].label+" "+S.initialStats[key]+" → "+S.stats[key]).join(" / ");
 const friend=closestNpc(),latest=S.examArchive.at(-1);
 const project=S.project?"\n\n共同项目："+S.project.name+"，"+(S.project.result||"还在进行"):"";
 const habits=S.habits&&S.habits.configured?"\n\n目前的生活习惯："+habitSummaryText():"";
 const rumors=S.rumors&&S.rumors.some(record=>record.heard)?"\n校园里已经出现的说法："+rumorSummaryText(5):"";
 showContinueScreen("学年手记",grade+"结束，生活还在继续",abilities+"\n\n"+
  (latest?"最近一次考试："+latest.name+" "+latest.score+"/750":"尚未记录考试")+
  (friend?"\n现在最熟悉的是"+friend+"，信任"+(S.npcTrust[friend]||0)+"。":"")+
  project+habits+rumors+"\n\n"+(S.year===1?"你不再只是在挑选兴趣。下学年，要试着把其中一件事做下去。":"已经完成的事和没能完成的事，都要一起带进最后一年。"),
  "进入暑假",advanceCalendar);
}
function holidayEvent(){
 const title=S.month===1?"终于空出来的一段时间":S.month===2?"假期剩下的几页":"开学前的那个夏天";
 const routeNote=S.route?"你已经走在"+S.route+"方向上，但仍可以决定怎样利用假期。":"你的路线还没有定型，假期可以从一个小计划开始。";
 const choices=[
  {id:"study",label:"用免费资料整理学习 · 学力经验+3",text:"你先把资料分好类，再完成了其中几页。假期没有全部消失在书桌旁，但你留下了一点可检查的进度。",effects:[FX.xp("academic",3),FX.resource("energy",-8),FX.flag("examPreparation",(S.flags.examPreparation||0)+2)],run:()=>{if(!S.route)S.route=S.division==="文科意向"?"文科生":"学业";}},
  {id:"create",label:"做一件属于自己的作品 · 创造经验+3",text:"有些部分完成了，有些还很粗糙。你留着它，准备之后再看。",effects:[FX.xp("creativity",3),FX.resource("energy",-6),FX.resource("stress",-4)],run:()=>{addInterest("创作");if(S.flags.artTrial||hasTag("美术"))S.route="美术生";if(S.project&&S.project.skill==="creativity"&&!S.project.result)S.project.progress+=1;}},
  {id:"train",label:"安排规律运动 · 体能经验+3",text:"你没有给自己安排惊人的运动量，只是把这件事重复了几次。",effects:[FX.xp("fitness",3),FX.resource("energy",5),FX.resource("stress",-6)]},
  {id:"rest",label:"认真休息，留一点闲暇 · 恢复精力",text:"有些天没有特别值得写的事情。睡够以后，你才发现之前一直紧绷着。",effects:[FX.resource("energy",20),FX.resource("stress",-12)]}
 ];
 if(S.year===2&&S.project&&!S.project.result)choices.push({id:"project",label:"约伙伴把项目再做一段",run:()=>workOnProject("holiday"),impact:"寒假也给共同项目留了时间"});
 choices.push(traitPracticeEntry());
 return {id:"holiday:"+S.year+":"+S.month,title,tag:S.term,text:routeNote+"\n\n你只选一件主要的事。学力、创造和体能不会因为放假就自动增长；外貌也不会被普通练习改变。",choices};
}
function runHolidayMonth(){
 runStoryEvent(holidayEvent(),()=>runBirthday(()=>{
  const social=()=>npcInteraction(nextSocialNpc(),finishMonth);
  if(S.year===1&&S.month===2)runRandom(1,social);else social();
 }));
}
function chooseProject(done){
 const choices=Object.entries(PROJECTS).map(([id,project])=>({
  id,label:project.name+" · "+ATTRIBUTES[project.skill].label,protected:true,text:project.description,
  run:()=>{S.project={id,...project,progress:0,result:null};ensureNpc(project.partner,2);rememberImpact("project-choice","和"+project.partner+"开始了"+project.name);}
 }));
 runStoryEvent({id:"project-choice",tag:"高二 · 共同项目",title:"这一年，想坚持什么",text:"社团不会替你自动决定这件事。选一项想做下去的计划，和一个人把它从报名表带到学年末；薄弱的能力可以练，规模也可以调整。",choices},done);
}
function workOnProject(mode){
 if(!S.project)return "你先把想做的事情记下，等伙伴确定以后再开始。";
 const p=S.project,stat=mode==="roles"||mode==="test"?"expression":p.skill;
 const check=activityCheck(stat,p.name+" · "+({roles:"商量分工",test:"公开试做",polish:"打磨",repair:"修订",holiday:"假期协作"}[mode]||"样品"),8,[
  {label:"已经形成的信任",value:(S.npcTrust[p.partner]||0)>=4?1:0},
  {label:"早期校园经验",value:(p.skill==="academic"&&S.flags.sciencePractice)||(p.skill==="creativity"&&S.flags.lanternStyle==="creative")||(stat==="expression"&&S.flags.studentCouncilStatus==="正式干事")?1:0},
  ...habitProjectModifiers()
 ],null,{activityDomain:"project",npc:p.partner,projectId:p.id});
 gainExperience(stat,2,"持续做项目");changeResource("energy",mode==="polish"?-10:-7);
 const amount=check.grade==="great"?3:check.margin>=0?2:1;p.progress+=amount;
 if(check.margin>=0){changeTrust(p.partner,1,"一起完成了具体工作");changeResource("stress",-2);}
 else {changeResource("stress",3);S.flags.projectSetbacks=(S.flags.projectSetbacks||0)+1;}
 return (check.margin>=0?"你们完成了能拿给别人看的部分。伙伴把日期写在页角，提醒下次从这里继续。":"这次尝试暴露了一个真正的问题。你们留下了过程记录，没有把它假装成已经成功的部分。")+
  "\n\n项目进展+"+amount+"；目前"+p.progress+"份。失败也会留下经验，尚未完成的部分会影响最终规模。\n\n"+formatCheck(check);
}
function presentProject(stat){
 const check=activityCheck(stat,"项目展示",8,[
  {label:"累计准备",value:S.project.progress>=10?2:S.project.progress>=6?1:0},
  {label:"实际测试过",value:S.flags.testedPrototype?1:0},
  ...habitProjectModifiers()
 ],null,{activityDomain:"performance",domains:["project"],npc:S.project.partner,projectId:S.project.id});
 changeResource("energy",-8);gainExperience(stat,2,"展示共同成果");
 if(check.margin>=0){S.project.progress+=2;S.flags.projectPresented="公开展示";changeResource("stress",-5);}
 else {S.project.progress+=1;S.flags.projectPresented="现场补救";changeResource("stress",5);}
 return (check.margin>=0?"有人听懂了，也有人留下来追问。你们没有回答所有问题，但作品第一次走出了自己的小圈子。":"现场有一段没有按计划运行。你们临时换了展示办法，承认还有没完成的地方，把能说明的部分讲清楚。")+"\n\n"+formatCheck(check);
}
function completeProject(revise){
 const p=S.project;if(revise){gainExperience(p.skill,2,"最终修订");p.progress+=1;}
 const threshold=S.flags.projectSmall?10:12;
 p.result=p.progress>=threshold&&S.flags.projectHandover?"完整交付":p.progress>=7?"缩小规模完成":"保留未完成的版本";
 rememberImpact("project-result",p.name+"最终以“"+p.result+"”归档");
 return "你们给最后一个文件写上日期。"+(p.result==="完整交付"?"最初想做的核心部分确实落了地。":p.result==="缩小规模完成"?"有些想法被删掉了，但留下的部分能够交给别人。":"它没有达到最初的设想。你们诚实保留了现在的进度和遗憾。")+"\n\n结果："+p.result+"。高三仍会有人问起这段经历。";
}
function runYearTwoExam(done){
 if(![12,7].includes(S.month)){done();return;}
 const name=S.month===12?"高二上期末":"高二下期末",kind=S.month===12?"y2-term1":"y2-term2";
 runStoryEvent({id:kind,title:name,tag:"重要考试",text:"项目占用过你的时间，也练出了一些能力。现在要把课堂上的积累拿进考场。",choices:[
  {id:"steady",label:"稳妥拿分",protected:true,run:action=>startExam(name,kind,"steady",action.next)},
  {id:"risk",label:"挑战难题",protected:true,run:action=>startExam(name,kind,"risk",action.next)},
  {id:"preserve",label:"保住状态",protected:true,run:action=>startExam(name,kind,"preserve",action.next)}
 ]},done);
}
function routeChoiceEffects(route,index,choice){
 const social={
  "竞赛生":{1:[0,1],2:[1],4:[1]},
  "美术生":{4:[0]},
  "文科生":{0:[0],1:[0],3:[1]},
  "理科生":{1:[0]}
 };
 const isSocial=social[route]?.[index]?.includes(choice);
 if(isSocial){
  const name=closestNpc();return [FX.xp("expression",1),FX.resource("energy",-3),...(name?[FX.relation(name,1)]:[])];
 }
 const stat=route==="美术生"?"creativity":"academic";
 return choice===0?[FX.xp(stat,2),FX.resource("energy",-6)]:[FX.xp(stat,1),FX.resource("stress",-3),FX.resource("energy",3)];
}
function graduationBond(done){
 if(S.flags.graduationBondDone){done();return;}
 const name=closestNpc();
 if(!name){S.flags.graduationBondDone=true;done();return;}
 const trust=S.npcTrust[name]||0,relation=getRelation(name);
 const choices=[
  {id:"friends",label:"把下一次见面约下来",protected:true,text:"你们交换了接下来的安排，给下一次见面留了一个真正能做到的日期。",run:()=>{S.flags.graduationBondDone=true;S.flags.bond={name,kind:trust>=3?"相互信任的朋友":"仍愿意联系的人"};}},
  {id:"letter",label:"把没说完的话写下来",protected:true,text:"有些话当面说不顺。你把信交出去，没有要求她立刻给出一个答案。",run:()=>{S.flags.graduationBondDone=true;S.flags.bond={name,kind:"留下一封长信"};}}
 ];
 if(trust>=4&&relation>=6)choices.splice(1,0,{id:"confess",label:"告诉她，自己想要更亲近的关系",protected:true,run:()=>{
  S.flags.graduationBondDone=true;
  const mutual=trust>=6&&relation>=8&&(S.flags["npcHelp:"+name]||0)+(S.flags["npcListened:"+name]||0)>=3;
  S.flags.bond={name,kind:mutual?"彼此回应的心意":"珍惜彼此的朋友"};
  return mutual?"她没有立刻用玩笑带过去。等你把话说完，她握住你的手，说她也想过毕业以后继续走在一起。":"她认真听完，说自己珍惜这段关系，但目前希望以朋友的身份继续。你们没有用一次骰子替她决定心意。";
 }});
 runStoryEvent({id:"graduation-bond",title:"还有一句话没有说",tag:"毕业之前",text:"考完最后一科，你在校门口遇到"+name+"。这次不必急着赶下一节课。",choices},done);
}
function graduationPortrait(){
 const score=S.exam.graduation||0;
 const strongest=Object.keys(ATTRIBUTES).filter(k=>k!=="appearance").sort((a,b)=>S.stats[b]-S.stats[a])[0];
 const growth=Object.keys(ATTRIBUTES).map(key=>ATTRIBUTES[key].label+" "+S.initialStats[key]+" → "+S.stats[key]).join(" · ");
 const academic=score>=590?"你在学业上留下了很强的积累，下一阶段可以认真选择更有挑战的方向。":score>=500?"你带着比较稳固的学业基础离开校园，也知道自己接下来还想尝试什么。":score>=430?"你的成绩里有兑现的部分，也有没能补上的短板。之后仍有不同的学校和路径可以继续探索。":"学业没有成为这三年最顺利的部分。你需要重新安排下一阶段的路径，但这张成绩单不能抹去其余经历。";
 const bond=S.flags.bond?S.flags.bond.name+"："+S.flags.bond.kind:"你保留了几段尚未写完的联系。";
 const hiddenNames=activeHiddenTraitNames();
 const legend=hiddenNames.length
  ?`你合成了${hiddenNames.map(name=>"【"+name+"】").join("、")}。这些角色型特质来自真实使用过的两种习惯，而不是开局直接抽到的称号。`
  :hasTrait("癫佬")?"你把不少普通场面当成了战场。有些决斗被接住，有些也确实伤过关系；它还没有和另一种特质合成新的角色画像。":"你没有合成角色型隐藏特质，却仍留下了自己的行事方式。";
 const ending=({academic:"把问题追问到底的人",expression:"能把人与故事连接起来的人",fitness:"走过长路，还愿意继续的人",creativity:"把普通日子做成作品的人"})[strongest];
 const project=S.project?S.project.name+"："+(S.project.result||"未完成")+(S.flags.projectPassedOn?"；经验已经交给下一届。":"。"):"你没有参加共同项目。";
 const relationships=[...S.npcs].sort((a,b)=>(S.npcTrust[b]||0)*2+getRelation(b)-((S.npcTrust[a]||0)*2+getRelation(a))).slice(0,4).map(name=>name+"："+relationLabel(getRelation(name))+"，信任 "+(S.npcTrust[name]||0));
 const rumorTitles=(S.rumors||[]).filter(record=>record.heard).map(record=>record.title);
 const routine=S.habits&&S.habits.configured?HABIT_SLOT_ORDER.map(slot=>HABIT_SLOTS[slot].label+"“"+habitDefinition(slot,S.habits[slot]).label+"”").join(" · "):"尚未形成稳定的生活习惯";
 const unfinished=S.project&&S.project.result!=="完整交付"?"有些项目设想被留在了未完成版本里。":S.resources.stress>=70?"你离校时仍没有真正松下来。":relationships.length<2?"还有一些关系停在刚刚认识的位置。":"并不是每一件事都需要在毕业前得到答案。";
 const first=S.project&&S.project.result==="完整交付"?"她没有把每一件事都做好，但确实把"+S.project.name+"交到了别人手里。":rumorTitles.length?"她没有成为大家描述中的全部样子，校园里却已经留下了关于她的"+rumorTitles.length+"种说法。":score>=590?"成绩单记住了她稳定的一部分，另外那些生活不会写在分数里。":"她没有成为所有人预先想象的那种优秀学生。";
 const hiddenClosing={"古明地恋":"但那些曾经需要解释的决斗和电波，最后真的成了几个人共同的语言。"};
 const second=S.flags.bond?"毕业以后，"+S.flags.bond.name+"仍然知道该去哪里找到她。":S.flags.projectPassedOn?"而高二留下的经验，还会在她离开以后继续被下一届使用。":hiddenNames.length?(hiddenClosing[hiddenNames[0]]||"那种由两段习惯合成的新样子，也会和她一起离开校园。") :"她带走了尚未完成的部分，也带走了重新开始的能力。";
 return {title:ending,score,academic,growth,bond,legend,project,routine,relationships,rumors:rumorTitles,unfinished,closing:first+"\n"+second,
  state:S.resources.stress>=70?"离开校园时，你仍然绷得很紧。下一段生活里，休息也是需要认真安排的事。":S.resources.energy<25?"最后一段时间耗掉了不少精力。终于不用赶进度时，你想先睡个好觉。":"你没有把最后一点精力都交出去。毕业之后，还有余力去看看新的地方。",
  memories:S.memories.filter(m=>!m.eventId.startsWith("npc:")).slice(-6).map(m=>m.text)
 };
}
function showGraduation(){
 S.phase="graduated";resetScreenActions();update();
 const p=graduationPortrait();
 $("setup").classList.add("hidden");$("game").classList.add("hidden");$("result").classList.remove("hidden");
 $("graduationName").textContent=S.name+"的三年";
 $("resultText").innerHTML='<p class="portrait">'+esc(p.title)+'</p><div class="archive-grid"><section><h2>学业与能力</h2><p>毕业升学考试：'+p.score+'/750（游戏成绩）\n'+esc(p.academic)+'\n\n'+esc(p.growth)+'</p></section><section><h2>形成的生活方式</h2><p>'+esc(p.routine)+'</p></section><section><h2>完成过的事</h2><p>'+esc(p.project)+'</p></section><section><h2>留下的人</h2><p>'+esc(p.bond)+'\n\n'+p.relationships.map(line=>"· "+esc(line)).join("\n")+'</p></section><section><h2>校园里的说法</h2><p>'+(p.rumors.length?p.rumors.map(line=>"· “"+esc(line)+"”").join("\n"):"没有形成稳定传闻。")+'\n\n'+esc(p.legend)+'</p></section><section><h2>没有完成的事情</h2><p>'+esc(p.unfinished)+'</p></section><section><h2>离开时的状态</h2><p>'+esc(p.state)+'</p></section><section><h2>手记里的几页</h2><p>'+p.memories.map(m=>"· "+esc(m)).join("\n")+'</p></section></div><blockquote class="graduation-closing">'+esc(p.closing)+'</blockquote>';
}
function showFinishedJournal(){
 $("result").classList.add("hidden");$("game").classList.remove("hidden");
 $("tag").textContent="毕业后的手记";$("title").textContent="随时可以翻回来";
 $("text").textContent="右侧保留了人物关系与完整记录。";
 $("effectFeedback").innerHTML="";$("choices").innerHTML="";
 const button=document.createElement("button");button.className="primary";button.textContent="回到毕业画像";
 // 浏览已结束的记录不改变游戏状态，也不加入操作重放。
 button.onclick=()=>{$("game").classList.add("hidden");$("result").classList.remove("hidden");};
 $("choices").appendChild(button);
}
function debugJump(index){
 if(!Number.isInteger(index)||index<0||index>=CALENDAR.length)return;
 S.debug=true;S.calendarIndex=index;
 if(CALENDAR[index].year>=2&&!S.project)S.project={id:"archive",...PROJECTS.archive,progress:0,result:null};
 $("result").classList.add("hidden");$("game").classList.remove("hidden");
 startCalendarMonth();$("saveStatus").textContent="调试局 · 不覆盖正常存档";
}
function debugPutTraits(names){
 const chosen=[];
 names.forEach((name,index)=>{S.pool[index]=TRAITS.find(item=>item[0]===name);chosen.push(index);});
 const third=S.pool.findIndex((item,index)=>index>=names.length&&item&&!names.includes(item[0]));
 if(third>=0)chosen.push(third);
 S.traits=chosen.slice(0,3);
}
function debugPrepareFusion(hidden="古明地恋"){
 const recipe=enabledFusionRecipes().find(item=>item.hidden===hidden||item.id===hidden);if(!recipe)return false;
 S.debug=true;debugPutTraits(recipe.sources);
 const people=["班长","同人女","体育生","中二病"];
 recipe.sources.forEach((name,index)=>{
  const journey=traitJourney(name);
  journey.xp=Math.max(recipe.minEach,Math.ceil(recipe.totalXp/2));
  journey.months=CALENDAR.slice(0,journey.xp*2).filter((point,monthIndex)=>monthIndex%2===index).map(point=>point.year+":"+point.month);
  journey.npcs=people.slice(0,Math.max(2,recipe.minNpcs));journey.scenes=["classroom","club","holiday"].slice(0,recipe.minScenes);
  journey.positiveNpcs=["班长","同人女"];journey.styles[index?"signal":"battle"]=1;
  S.traitProgress[name]=journey.xp;
 });
 people.forEach(name=>ensureNpc(name,4));S.npcTrust["班长"]=3;
 update();$("saveStatus").textContent="调试局 · 不覆盖正常存档";return true;
}
function debugPrepareChaos(){return debugPrepareFusion("古明地恋");}
