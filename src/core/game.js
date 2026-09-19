"use strict";

function startGame(){
 const name=$("playerName").value.trim();
 if(!name)return alert("先给她起个名字吧。");
 if(name.length>12)return alert("名字最多12个字。");
 if(S.traits.length!==3)return alert("请从10个特质中选择3个。");
 const error=allocationError();if(error)return alert(error);
 const month=Number($("birthdayMonth").value),day=Number($("birthdayDay").value);
 if(!Number.isInteger(month)||month<1||month>12||!Number.isInteger(day)||day<1||day>birthdayLimit(month))return alert("请填写有效生日，2月最多29日。");
 const family=$("family").value;
 if(!Object.hasOwn(FAMILY_BACKGROUNDS,family))return alert("请选择家庭背景。");
 const initial={name,stats:allocatedStats(),family,birthdayMonth:month,birthdayDay:day,
  pool:S.pool.map(t=>t[0]),traits:[...S.traits],rng:{...S.rng}};
 launchGame(initial);saveLocalGame(true);
}
function finishMonth(){finishCalendarMonth();}

const CLUBS=[
 ["文学社","文学","喜欢写东西、看书，也会参与校刊。"],["动漫社","二次元","一起看番、聊漫画和游戏。"],["音乐社","音乐","排练、乐器和学校演出。"],
 ["美术社","美术","画画、板报和视觉设计。"],["街舞社","舞蹈","练舞、排节目。"],["广播站","播音","录音、播音和校园广播。"],
 ["志愿者协会","志愿服务","校内外志愿活动。"],["篮球社","篮球","训练和校内比赛。"],["话剧社","话剧","排练、舞台和角色。"],["辩论社","辩论","讨论问题、准备辩题。"]
];

function joinClub(club,interest,description){
 S.club=club;addInterest(interest);log("加入社团："+club);
 return `${description}\n\n从今天开始，${club}会成为你放学后生活的一部分。`;
}

function clubRecruitmentChoices(){
 const choices=CLUBS.map(([club,interest,description])=>[
   `加入${club} · ${interest}`,
   description,
   ()=>joinClub(club,interest,description),
   {id:`join-${club}`,tags:["探索","投入"],impact:`加入了${club}`}
 ]);
 choices.push([
   "不加入社团 · 归宅部",
   "你暂时不把放学后的时间固定交给任何社团。",
   ()=>{S.club="归宅部";addInterest("归宅部");log("选择：归宅部");return "你选择了归宅部。空出来的放学时间，将由之后的偶遇和兴趣填满。";},
   {id:"home-club",tags:["独处","自由"],impact:"选择了归宅部"}
 ]);
 return choices;
}

/* ---------- 固定事件执行器 ---------- */
function runFixedMonth(i,done){
 const list=S.year===1?(S.term==="高一上"?FIXED[S.month]:S.term==="高一下"?SECOND_FIXED[S.month]:[])||[]:[];
 if(i>=list.length){done();return}
 const e=list[i];
 if(typeof e.condition==="function"&&!e.condition()){runFixedMonth(i+1,done);return;}
 const eventId=e.id||`fixed:${S.term}:${S.month}:${i}`;
 const rawChoices=typeof e.getChoices==="function"?e.getChoices():e.choices;
 const choices=(Array.isArray(rawChoices)?rawChoices:[]).map((choice,index)=>{
   const meta=choice&&choice[3]&&typeof choice[3]==="object"?choice[3]:{};
   const effect=choice&&choice[2];
   return [choice[0],choice[1],action=>{
     rememberChoice(eventId,meta.id||`choice-${index+1}`,choice[0],meta.tags||[]);
     applyEffects(LEGACY_FIXED_EFFECTS[e.title]?.[index]||[]);
     const result=typeof effect==="function"?effect(action):undefined;
     const impact=typeof meta.impact==="function"?meta.impact():meta.impact||"";
     if(impact)rememberImpact(eventId,impact);
     return result;
   },choice[3]];
 });
 const seenKey=`fixedSeen:${S.term}:${S.month}:${eventId}`;
 if(!S.flags[seenKey]){S.flags[seenKey]=true;S.history.push("固定："+e.title);}
 showChoices("固定事件 · "+S.month+"月",e.title,e.text,choices,()=>runFixedMonth(i+1,done),{eventId});
}
function currentRoute(){return S.route}
function runBirthday(done){
 if(S.birthdayMonth!==S.month||S.flags["birthday:"+S.term+":"+S.month]){done();return}
 S.flags["birthday:"+S.term+":"+S.month]=true;
 const known=S.npcs.slice(0,5);
 const names=known.length?known.join("、"):"家里人";
 showChoices("特别的一天","生日月",`今天是你的生日。\n\n手机从早上开始陆续亮起来。${names}有人发来生日祝福。原本普通的上学日，突然多了一点不一样的声音。`,[
  ["认真回复收到的祝福","你一条条回过去，也顺手和几个熟悉的人多聊了几句。",()=>{known.forEach(n=>changeRelation(n,1,"生日回复"));return "最后一条消息发出去以后，你才发现自己已经在这所学校留下了不少联系。"}],
  ["挑几个人好好回复","你没有逐条写很长，但把真正想说的话认真告诉了最在意的人。",()=>{known.slice(0,2).forEach(n=>changeRelation(n,2,"认真回复生日祝福"));return "你把手机放回桌上时，忽然觉得生日这一天留下的不只是日期。"}]
 ],done);
}

function showChaosAftermath(name,done){
 const key=`chaosAftermath:${name}`;
 const aftermath=S.flags[key];
 if(!aftermath||!aftermath.pending)return false;
 showChoices(
   "延迟后果",
   `${name}还记得上一次`,
   `${name}看见你时明显顿了一下。上次那段突然发作的表演并没有随着事件翻页自动消失；现在轮到你决定怎样处理留下来的尴尬。`,
   [
     ["承认上次确实有点过头","你决定把话说清楚。",()=>{
       aftermath.pending=false;
       const check=resolveCheck({stat:"expression",statLabel:"表达",difficulty:7,label:"化解尴尬"});
       const delta=check.grade==="failure"?-1:check.grade==="setback"?0:1;
       if(delta)changeRelation(name,delta,"处理上次的尴尬");
       return `${check.grade==="failure"?`${name}觉得这段解释比原来的事情还难接。`:check.grade==="setback"?`${name}接受了你的解释，但暂时没有继续这个话题。`:`${name}终于笑了一下，并说她其实只是当时没反应过来。`}\n\n${formatCheck(check)}`;
     }],
     ["像平常一样聊别的","你没有强行解释，而是从今天真正想说的事情开始。",()=>{
       aftermath.pending=false;
       addTendency("钝感");
       return `${name}起初还有些迟疑。发现你没有再次突然起飞以后，她慢慢把注意力放回了眼前的话题。关系没有立刻恢复，但这件事至少不再继续扩大。`;
     }]
   ],
   ()=>npcInteraction(name,done)
 );
 return true;
}

function npcInteraction(name,done){
 if(showChaosAftermath(name,done))return;
 runStoryEvent(createNpcScene(name),done);
}

function specialNpcText(name){
  const text={
    "大小姐":"她抱着手站在你旁边，嘴上还是一副“只是顺便聊聊”的样子。",
    "班长":"她把手里的资料整理好，转过来认真听你说。",
    "主人公":"她完全没有陌生人的拘谨，像是已经认识你一阵子似的。",
    "转校生":"她没有看你太久，但也没有像刚才那样马上离开。",
    "中二病":"她双马尾随着动作轻轻晃了一下，表情依旧认真得像是在讨论什么大事。",
    "学姐":"她站在校门边，和你聊起以前学校里那些现在想起来有点好笑的事情。",
    "同人女":"她把画本抱在怀里，终于没有刚见面时那么戒备。",
    "体育生":"她刚结束训练，整个人还是一副随时还能再跑两圈的样子。"
  };
  return text[name]||"你们站在走廊边，话题一点点从刚才的偶遇变成了真正的聊天。";
}

function tagEffect(t,mode="habit"){
 const skill=traitSkill(t);
 if(mode==="habit"){
  gainExperience(skill,2,"顺着特质投入");changeResource("energy",-6);
  if(t==="熬夜人"||t==="完美主义")changeResource("stress",5);
  else changeResource("stress",-2);
  if(t==="大小姐"){
   if(spendCash(35,"选择方便的方案"))changeResource("energy",8);
   else log("这次零花钱不够，你沿用了免费的做法。");
  }
 }else{
  gainExperience(skill,1,"有意识地调整习惯");changeResource("energy",5);changeResource("stress",-4);
  addTendency("自持");
 }
}
function traitSkill(t){
 if(["认真","卷王","天生卷王","手账少女","天赋","键政","中庸之道"].includes(t))return "academic";
 if(["运动少女","舞萌","电竞选手","好胜心"].includes(t))return "fitness";
 if(["文艺b","文学少女","漫画家","摄影爱好者","吉他手","coser","动画区up主","小博主"].includes(t))return "creativity";
 return "expression";
}
function traitEvent(t){
 const title=tagTitles[t]||(t+"的一天");
 const text=(tagTexts[t]||tagOutcomes[t]||"你在放学后的校园里遇到了一件具体的小事。")+(tagScenes[t]?"\n\n"+tagScenes[t]:"");
 return {key:"trait:"+t,title,text,choices:[
  [tagChoiceA[t]||"照自己的习惯处理",tagOutcomes[t]||"你投入了眼前的事情。",()=>{
   tagEffect(t,"habit");rememberChoice("trait:"+t,"habit","照自己的习惯处理",["投入"]);
   return (tagOutcomes[t]||"你投入了眼前的事情。")+"\n\n这次投入留下了练习，也占用了精力。";
  }],
  ["这次调整一下节奏","你给自己留了一点余地。",()=>{
   tagEffect(t,"adjust");rememberChoice("trait:"+t,"adjust","调整习惯",["自持"]);
   return "你没有完全顺着惯常的冲动走。事情做得少一些，但剩下的精力让之后的日子轻松了一点。";
  }]
 ]};
}

function pickRandomEvent(){
 let candidates=RANDOM_EVENTS.filter(e=>!S.usedRandom.includes(e.key)&&!(e.key==="home168"));
 const traitNames=S.traits.map(i=>S.pool[i][0]).filter(t=>!S.usedRandom.includes("trait:"+t));
 if(traitNames.length&&gameRandom()<0.55)candidates.push(...traitNames.map(t=>traitEvent(t)));
 if(S.family==="wealthy"&&hasTrait("大小姐")&&!S.flags.home168Done&&gameRandom()<0.12){
   const h=RANDOM_EVENTS.find(e=>e.key==="home168");S.flags.home168Done=true;return h;
 }
 if(!candidates.length)return null;
 return randomItem(candidates);
}

function examTraitEffects(){
 let check=0,score=0;
 const labels=[];
 if(hasTrait("认真")){check+=1;score+=4;labels.push("认真");}
 if(hasTrait("卷王")||hasTrait("天生卷王")){check+=1;score+=5;labels.push("卷王");}
 if(hasTrait("完美主义")){score+=3;labels.push("完美主义");}
 return {check,score,label:labels.length?labels.join("、"):"无"};
}

function calculateExam(name,kind,strategyId,momentId,dice=null){
 const strategy=EXAM_STRATEGIES[strategyId]||EXAM_STRATEGIES.steady;
 const trait=examTraitEffects();
 const habit=habitExamEffects();
 const healthCheck=(S.stats.fitness>=16?1:S.stats.fitness<=3?-1:0)+(S.resources.energy<25?-1:0)+(S.resources.stress>=70?-1:0);
 const healthScore=(S.stats.fitness>=16?6:S.stats.fitness<=3?-6:0)+(S.resources.energy>=70?4:S.resources.energy<25?-8:0)+(S.resources.stress>=70?-8:0);
 const preparation=(Number(S.tendencies["稳妥"])||0)>=2?1:0;
 const momentCheck=momentId==="pace"?1:0;
 const check=resolveCheck({
   stat:"academic",statLabel:"学力",
   difficulty:7,
   modifiers:[
     {label:strategy.label,value:strategy.check},
     {label:"特质",value:trait.check},
     {label:"状态",value:healthCheck},
    {label:"稳妥倾向",value:preparation},
    {label:habit.label,value:habit.check},
     {label:"时间分配",value:momentCheck}
   ],
   dice,
   label:name
 });
 const base=(EXAM_BASE_SCORES[kind]??EXAM_BASE_SCORES.monthly)+(S.year-1)*16;
 const academic=Math.round(S.stats.academic*6.5)+(Number(S.flags.examPreparation)||0)*2;
 const performance={failure:-18,setback:-6,success:5,great:14}[check.grade];
 let strategyScore=strategy.score;
 if(strategyId==="risk")strategyScore={failure:-18,setback:-7,success:6,great:16}[check.grade];
 const momentScore=momentId==="pace"?4:momentId==="instinct"?(check.grade==="great"?7:check.grade==="failure"?-4:1):0;
 const total=Math.max(300,Math.min(680,Math.round(base+academic+healthScore+trait.score+habit.score+strategyScore+momentScore+performance)));
 if(strategyId==="preserve"){changeResource("energy",6,"考试中保住了状态");changeResource("stress",-4);}
 else {changeResource("energy",strategyId==="risk"?-10:-5);changeResource("stress",strategyId==="risk"?6:2);}
 S.flags.examPreparation=0;
 return {name,kind,strategyId,momentId,score:total,check,parts:{base,academic,healthScore,traitScore:trait.score,habitScore:habit.score,strategyScore,momentScore,performance},traitLabel:trait.label,habitLabel:habit.label};
}

function saveExamResult(result){
 const {kind,score}=result;
 S.exam[kind]=score;S.examDetails[kind]=result;
 S.examArchive.push({...result,year:S.year,month:S.month});
 if(kind==="monthly"&&S.year===1)S.exam.firstMonthly=score;
 if(kind==="midterm")S.exam.midterm=score;
 if(kind==="term1")S.exam.firstFinal=score;
 if(kind==="opening")S.exam.opening=score;
 if(kind==="term2")S.exam.secondFinal=score;
 log(result.name+"："+score+"/750；"+result.check.gradeLabel+"。");
}

function examResultText(result){
 const strategy=EXAM_STRATEGIES[result.strategyId]||EXAM_STRATEGIES.steady;
 const p=result.parts;
 const performanceText=result.check.grade==="failure"
   ?"这次发挥明显低于平时，但成绩留下了下一阶段可以补救的具体问题。"
   :result.check.grade==="setback"
     ?"几处失误拖住了成绩，不过整体没有失控。"
     :result.check.grade==="success"
       ?"你的发挥基本兑现了此前的准备。"
       :"这次不只准备充分，考场上的节奏也恰好站在了你这边。";
 return `${result.name}结束。\n\n本次成绩：${result.score} / 750\n策略：${strategy.label}\n长期习惯：${result.habitLabel}\n\n${performanceText}\n\n${formatCheck(result.check)}\n\n成绩构成：学业基础 ${p.base+p.academic}，状态 ${formatSigned(p.healthScore)}，特质 ${formatSigned(p.traitScore)}，习惯 ${formatSigned(p.habitScore)}，策略与临场 ${formatSigned(p.strategyScore+p.momentScore+p.performance)}。`;
}

function finishExam(name,kind,strategyId,momentId,resume,dice=null){
 const result=calculateExam(name,kind,strategyId,momentId,dice);
 saveExamResult(result);
 showContinueScreen("考试结果",name+" · 成绩单",examResultText(result),"收好成绩单",resume);
}

function startExam(name,kind,strategyId="steady",resume=finishMonth){
 const major=kind!=="monthly"&&!kind.includes("monthly");
 if(!major){finishExam(name,kind,strategyId,null,resume);return "HANDLED";}
 showChoices("考试 · 考场抉择",name,`考试进行到后半段，时间开始变得紧张。还有几道题没做完，前面也有几处让你拿不准的答案。抬头看过时钟以后，你决定……`,[
   ["重新分配剩余时间","你先保证整张卷子都能留下有效答案。",()=>{rememberChoice(`exam:${kind}:moment`,"pace","重新分配剩余时间",["稳妥"]);finishExam(name,kind,strategyId,"pace",resume);return "HANDLED";}],
   ["相信第一判断继续做","你不反复修改已经完成的部分，把注意力留给眼前。",()=>{rememberChoice(`exam:${kind}:moment`,"instinct","相信第一判断继续做",["果断"]);finishExam(name,kind,strategyId,"instinct",resume);return "HANDLED";}]
 ],()=>{});
 return "HANDLED";
}

/* ---------- 特殊固定结果 ---------- */
function introClassmates(mode){
 if(mode==="active"){
   ensureNpc("主人公",2);gainExperience("expression",2,"主动完成自我介绍");
   S.flags.firstClassApproach="主动认识";
   return "你没有等座位关系替你安排朋友，而是主动接住了几个人的话。主人公也从前排转过来和你聊了几句；以后再见面，你们已经有了开口的理由。";
 }
 ensureNpc("班长",1);S.flags.firstClassApproach="先观察";S.flags.classDynamicsKnown=true;
 return "你没有急着成为中心，却记住了谁总在活跃气氛、谁习惯安静听完。班长注意到你一直在认真听，散会以后主动问了你的名字。";
}

function exploreCampus(mode){
 if(mode==="solo"){
   S.flags.quietCorner=true;gainExperience("fitness",2,"把校园完整走了一遍");
   return "你绕到教学楼后面，找到一段午休时很少有人经过的连廊。以后需要一个人待会儿时，你知道可以去哪里。";
 }
 const companion=S.npcs[0]||"主人公";ensureNpc(companion,1);changeRelation(companion,1,"一起熟悉校园");
 S.flags.campusRumours=true;
 return `${companion}带你走了几条最常用的路线，还告诉你哪一层的饮水机最少排队。以后在校园里碰见她，你们会自然地并排走一段。`;
}

function teacherDayChoice(mode){
 if(mode==="talk"){
   S.flags.teacherAdvice="给真正喜欢的事情留时间";
   return "老师没有只问成绩，而是提醒你：适应高中并不等于把所有时间都交给别人安排。这句话后来影响了你选择社团时的犹豫。";
 }
 S.flags.oldFriendsKept=true;gainExperience("expression",2,"维持初中同学联系");
 return "你和初中同学一起等到老师下课。回去的路上，你们约好即使进了不同学校，也不要只在节日群发一句问候。";
}

function studentCouncilChoice(mode){
 if(mode==="apply"){
   S.flags.studentCouncilApplied=true;
   return "你交出了报名表。老师没有当场公布名单，结果会在国庆以后贴出来。";
 }
 S.flags.studentCouncilObserved=true;
 return "你旁听了一次活动安排，没有立刻报名，却记住了通知、场地和临时状况是怎样被人一项项处理掉的。以后遇到班级活动，你会更清楚幕后需要什么。";
}

function studentCouncilResult(){
 const check=resolveCheck({
   statValue:(S.stats.expression*3+S.stats.academic)/4,
   statLabel:"综合表现",
   difficulty:8,
   modifiers:[
     {label:"认真",value:hasTrait("认真")?1:0},
     {label:"社交特质",value:hasTrait("开朗")||hasTrait("社交悍匪")?1:0}
   ],
   label:"学生会招新"
 });
 ensureNpc("班长",1);
 if(check.grade==="great"){
   S.flags.studentCouncilStatus="正式干事";changeRelation("班长",2,"一起负责学生会工作");
   return `名单上不但有你的名字，班长还直接把一项迎新整理工作交给了你。你成为了正式干事。\n\n${formatCheck(check)}`;
 }
 if(check.grade==="success"){
   S.flags.studentCouncilStatus="正式干事";changeRelation("班长",1,"进入学生会");
   return `你在名单中找到了自己的名字。工作不会立刻改变整个高中生活，但从现在开始，部分校园活动会从幕后向你打开。\n\n${formatCheck(check)}`;
 }
 if(check.grade==="setback"){
   S.flags.studentCouncilStatus="活动志愿者";S.flags.studentCouncilSecondChance=true;
   return `正式名单里没有你，但老师邀请你先作为活动志愿者参加一次工作。这里仍然可能成为之后的入口。\n\n${formatCheck(check)}`;
 }
 S.flags.studentCouncilStatus="未入选";S.flags.studentCouncilSecondChance=true;
 return `你没有入选。班长后来告诉你，十一月的大型活动仍然会公开招募临时帮手——这次失败关闭了一个职位，却没有删掉后续故事。\n\n${formatCheck(check)}`;
}

function nationalDayWithNpc(name){
 const aftermath=S.flags[`chaosAftermath:${name}`];
 const check=resolveCheck({
   stat:"expression",statLabel:"表达",difficulty:7,
   modifiers:[
     {label:"已经熟悉",value:getRelation(name)>=3?1:0},
     {label:"上次的尴尬",value:aftermath&&aftermath.pending?-1:0}
   ],
   label:"国庆出游"
 });
 const delta={failure:-1,setback:0,success:1,great:2}[check.grade];
 if(delta)changeRelation(name,delta,"国庆一起出门");
 if(aftermath)aftermath.pending=false;
 S.flags.nationalDayCompanion=name;
 const places={"大小姐":"商场里的甜品店","班长":"图书馆和附近的书店","主人公":"市中心的步行街","转校生":"河边的旧街区","中二病":"车站附近的模型店","学姐":"以前初中附近的小吃街","同人女":"商场里的漫展周边店","体育生":"公园和体育场"};
 const outcome=check.grade==="failure"
   ?`你和${name}约在${places[name]||"学校附近的商业街"}，但几次想聊的话都错开了节奏。回家以后，你意识到“约出来”并不自动等于关系变好。`
   :check.grade==="setback"
     ?`你和${name}一起逛了半天。没有发生特别戏剧性的事情，不过原先的一点尴尬终于没有继续扩大。`
     :check.grade==="success"
       ?`你和${name}从食堂聊到社团，又聊到最近真正喜欢的东西。假期结束后，你们已经有了一段课堂以外的共同经历。`
       :`原定半天的见面一直拖到天黑。你们临时多去了一个地方，这一天后来成了彼此反复提起的共同记忆。`;
 return `${outcome}\n\n${formatCheck(check)}`;
}

function nationalDayAlone(){
 S.flags.nationalDayAlone=true;changeResource("energy",12,"给自己留出完整的一天");changeResource("stress",-5);
 const interest=S.interests.find(item=>item!=="归宅部");
 if(interest)S.flags.deepenedInterest=interest;
 return interest
   ?`你睡到自然醒，做完必要的作业，又把一段完整时间留给了【${interest}】。它第一次不像开学时随手选择的标签，而像是你真的愿意继续做的事情。`
   :"你没有把假期排满。一天结束时，你恢复了状态，也发现独处并不等于什么都没有发生。";
}

function nationalDayChoices(){
 const choices=S.npcs.slice(0,4).map(name=>[
   `约${name}一起出去`,
   `你决定把假期里的一天留给${name}。`,
   ()=>nationalDayWithNpc(name),
   {id:`with-${name}`,tags:["社交","靠近"],impact:`和${name}度过了国庆假期的一天`}
 ]);
 choices.push([
   "留一天完全给自己",
   "你不安排见面，把时间留给休息和已经出现的兴趣。",
   ()=>nationalDayAlone(),
   {id:"alone",tags:["独处","坚持"],impact:()=>S.flags.deepenedInterest?`开始认真坚持${S.flags.deepenedInterest}`:"给自己留出了一整天"}
 ]);
 return choices;
}

function makeLantern(style){
 addInterest("手工");S.flags.lanternStyle=style;gainExperience("creativity",style==="creative"?2:1,"制作花灯");changeResource("energy",-3);
 if(style==="stable")return "你先把骨架一处处固定好。它不算最抢眼，但提起来很稳；十二月展示时，它会以这种样子再次出现。";
 return "你改了示范图的颜色和外形。成品有一处并不完全对称，却明显能从一排作业里认出来；十二月展示时，它会以这种样子再次出现。";
}

function chooseDivisionIntent(value){
 S.division=value;log("第一次分科意向："+(value==="未定"?"暂未决定":value)+"。");
 return value==="未定"
   ?"你暂时不填明确方向。高一下正式分科时，你还可以重新选择。"
   :`你暂时把${value.replace("意向","")}写在了意向表上。高一下正式选择时，这次想法会被拿出来对照，但不会替你自动决定。`;
}

function enterCompetition(){
 const qualified=S.stats.academic>=16||hasTrait("天赋")||hasTrait("卷王")||hasTrait("天生卷王");
 const check=resolveCheck({stat:"academic",statLabel:"学力",difficulty:8,modifiers:[
   {label:"天赋",value:hasTrait("天赋")?1:0},
   {label:"投入习惯",value:hasTrait("卷王")||hasTrait("天生卷王")?1:0}
 ],label:"竞赛招新"});
 if(qualified||check.grade==="success"||check.grade==="great"){
   S.route="竞赛生";S.flags.competitionEntry=qualified?"达到门槛":"试训发挥出色";log("路线确定：竞赛生");
   return `老师把你的名字写进训练名单。随机判定影响的是第一次试训表现，而不是把已经达到的能力门槛重新抽签。\n\n${formatCheck(check)}`;
 }
 S.flags.competitionTrial=true;addInterest("竞赛旁听");
 return `你暂时没有进入正式名单，但获得了两周旁听资格。之后仍可以通过训练补上差距；失败产生的是一条试训经历，而不是“内容到此结束”。\n\n${formatCheck(check)}`;
}

function observeCompetition(){
 S.flags.competitionObserved=true;addInterest("竞赛旁听");
 return competitionResult();
}

function fixedSocial(){
 addTendency("社交");gainExperience("expression",1,"主动交流");
 const check=activityCheck("expression","接住话题",7);
 const name=S.npcs[0];if(name&&check.margin>=0)changeRelation(name,1,"聊天变得自然");
 return (check.margin>=0?"你把散乱的话题接了起来，聊到最后，有人还在等你把话说完。":"你没有一直找到合适的插话时机，不过还是听完了大家的话。没有人因此阻止你继续相处。")+"\n\n"+formatCheck(check);
}
function fixedObserve(){addTendency("观察");changeResource("stress",-3,"留在自己舒服的节奏");return "你记住了谁爱抢话、谁会认真听完。暂时不用表现自己，也给紧绷的一天留了点空间。";}
function competitionResult(){gainExperience("academic",1,"旁听竞赛");addTendency("探索");return S.stats.academic>=16||hasTrait("天赋")?"你能跟上不少推导，已经可以考虑正式训练。":"你记下了还看不懂的地方。旁听资格一直在，下一次可以带着具体的问题来。";}
function artResult(){gainExperience("creativity",2,"旁听画室训练");addInterest("美术旁听");return "老师让你保留今天的练习，下次拿它和新稿比较。艺术训练从具体的线条开始，不由外貌或人缘决定。";}
function enterArt(){
 const check=activityCheck("creativity","美术试训",8,[{label:"兴趣基础",value:hasTag("美术")||hasTrait("漫画家")?1:0}]);
 gainExperience("creativity",2,"限时素描");
 if(S.stats.creativity>=16||check.margin>=0){S.route="美术生";rememberImpact("art-entry","进入美术生训练");return "老师留下了你的测试画，把名字写进训练名单。\n\n"+formatCheck(check);}
 addInterest("美术旁听");S.flags.artTrial=true;
 return "这次还没达到正式训练标准。老师给了你旁听与补交练习的机会，寒假仍然可以选择继续。\n\n"+formatCheck(check);
}
function talentResult(){
 addTendency("表达");gainExperience("expression",2,"完成公开表达");
 const check=activityCheck("expression","公开表演",8,[{label:"创作准备",value:S.stats.creativity>=12?1:0}]);
 changeResource("energy",-5);
 if(check.margin>=0){S.flags.stageCredit=(S.flags.stageCredit||0)+1;changeResource("stress",-3);}
 else {S.flags.stageRetry=true;changeResource("stress",3);}
 return (check.margin>=0?"你把节目完整地接住了，结束时有人从后排认真地鼓掌。":"你在中间停顿了几秒。节目没有消失，台下仍然有人等你继续。你记住了下次需要练的地方。")+"\n\n"+formatCheck(check);
}
function studyResult(){
 addTendency("稳妥");gainExperience("academic",2,"阶段复习");changeResource("energy",-5);
 S.flags.examPreparation=(S.flags.examPreparation||0)+1;
 return "你把薄弱部分整理成了一张清单。练习积累成学力经验，也为下一场考试留下了准备修正。";
}

function showOctoberPortrait(){
 S.flags.octoberPortraitShown=true;
 const tendencyNames=Object.entries(S.tendencies||{}).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([name])=>name);
 const closest=[...S.npcs].sort((a,b)=>getRelation(b)-getRelation(a))[0];
 const exam=S.exam.firstMonthly?`${S.exam.firstMonthly} / 750（${S.examDetails.monthly?.check?.gradeLabel||"已完成"}）`:"尚未记录";
 const council=S.flags.studentCouncilStatus?`学生会结果是“${S.flags.studentCouncilStatus}”`:(S.flags.studentCouncilObserved?"你选择先观察学生会的实际工作":"你没有把时间交给学生会");
 const holiday=S.flags.nationalDayCompanion?`国庆时和${S.flags.nationalDayCompanion}单独出门`:(S.flags.deepenedInterest?`国庆时开始认真坚持${S.flags.deepenedInterest}`:"国庆时给自己留了一天");
 const portrait=[
   "【九、十月人物小结】",
   `这两个月里，你的选择更常表现出${tendencyNames.length?`“${tendencyNames.join("、")}”`:"尚未定型的倾向"}。`,
   `你加入了${S.club||"尚未选择的社团"}；${council}。`,
   `${holiday}。${closest?`目前最熟悉的人是${closest}，你们的关系是“${relationLabel(getRelation(closest))}”。`:"你暂时还没有特别熟悉的人。"}`,
   `第一次月考：${exam}。花灯采用了${S.flags.lanternStyle==="creative"?"自由改造的样式":S.flags.lanternStyle==="stable"?"稳固的结构":"尚未记录的做法"}。`,
   "这些内容已经进入长期状态；之后的事件可以读取它们，而不只是把本月台词播放一遍。"
 ].join("\n\n");
 showContinueScreen("阶段人物小结","她正在变成怎样的人",portrait,"进入11月",advanceCalendar);
}

// 学期、寒暑假和毕业流程统一由 life.js 的三年日历调度。

/* ---------- 社团活动周 ---------- */
function clubWeek(next){
 const club=S.club||"归宅部";
 const scenes={
  "文学社":["校刊编辑室里堆着改到一半的稿子。学姐把一篇文章递给你，让你帮忙看看标题。",[["一起改稿","你和社员把标题、开头和结尾逐句讨论了一遍。",()=>"你第一次觉得，写出来的东西真的会被别人认真看。"],["负责校刊排版","你把文章、图片和栏目重新整理。",()=>"忙完以后，整本校刊终于有了完整的样子。"]]],
  "动漫社":["活动室里放着大家最近讨论的作品，桌上还摆着几本借来的漫画。",[["参加作品讨论","你和社员认真聊起最近看过的作品。",()=>"原本只知道作品名字的人，也因为这次聊天慢慢熟了起来。"],["帮忙布置展板","你把海报和作品介绍贴到走廊展板上。",()=>"路过的同学停下来多看了几眼，你第一次觉得兴趣也能出现在校园里。"]]],
  "音乐社":["音乐社正在为学校活动排练。有人弹琴，有人练唱，教室外都能听见声音。",[["参加排练","你拿起自己的乐器或跟着大家练习。",()=>"合奏第一次完整结束时，所有人都笑了出来。"],["帮忙准备演出","你负责谱子、设备和现场安排。",()=>"虽然没站在最前面，但你发现演出顺利进行同样需要很多准备。"]]],
  "美术社":["美术社把活动室的一面墙留给了社员作品。颜料、画纸和画板几乎铺满了桌面。",[["完成一幅作品","你坐下来认真画了一下午。",()=>"最后退后几步看自己的画时，你终于知道自己这段时间到底进步在哪里。"],["帮忙做校园展板","你和其他社员一起处理学校活动的视觉设计。",()=>"展板挂起来以后，路过的同学纷纷停下来看看。"]]],
  "街舞社":["放学后的活动室里音乐已经响起来了。大家正在为月底的表演反复练习。",[["跟着练一遍","你从基础动作开始跟着大家练。",()=>S.stats.fitness>=20||hasTrait("运动少女")?"你虽然出了不少汗，但整套动作终于跟了下来。":"你很快就喘得厉害，只能先把基础动作练熟。"],["负责队形和音乐","你站在旁边帮大家记节拍和走位。",()=>"你发现一场看起来很热闹的表演，背后其实有很多细节要对。"]]],
  "广播站":["广播站里正在准备社团活动周的特别节目，桌上摆着采访提纲和一摞稿子。",[["试着播一段","你戴上耳机，对着麦克风读完一段稿子。",()=>S.stats.expression>=20||hasTrait("开朗")?"你的声音比自己想象中更自然，学姐让你再试一次。":"第一遍有点紧张，但读完以后你已经知道问题在哪里。"],["采访同学","你拿着提纲去找参加活动的同学聊天。",()=>"原本只有几句话的采访，最后变成了一段很有意思的闲聊。"]]],
  "志愿者协会":["社团活动周期间，志愿者协会负责引导人流、整理场地和回收物资。",[["负责现场引导","你站在活动场地入口帮忙维持秩序。",()=>"忙起来以后你几乎没时间闲着，但也认识了不少来帮忙的同学。"],["整理活动物资","你和社员一起把桌椅、宣传册和剩余物资归类。",()=>"活动结束后，场地很快恢复整洁。"]]],
  "篮球社":["篮球社正在进行社团活动周的友谊赛，场边围着不少同学。",[["报名上场","你换好鞋走进球场。",()=>S.stats.fitness>=20||hasTrait("运动少女")?"你坚持打完整场，最后累得坐在场边喝水。":"你很快感到体力跟不上，但还是认真打完了属于自己的时间。"],["负责场边工作","你帮忙计分、递水和记录比赛。",()=>"虽然没上场，你还是从头到尾参与了这场比赛。"]]],
  "话剧社":["话剧社的排练比平时更认真，后台摆着临时做好的道具。",[["临时接一个角色","有人临时缺席，你顶上去试了一段。",()=>S.stats.expression>=20||hasTrait("开朗")?"你越演越放松，最后真的把这一段接了下来。":"刚开始有点紧张，但你还是把自己的台词完整说完了。"],["负责后台道具","你把几件临时道具重新整理好。",()=>"演出开始以后，你站在后台看着舞台，第一次发现幕后也有自己的节奏。"]]],
  "辩论社":["辩论社正在为活动周准备公开展示，桌上已经写满了论点和反驳。",[["上台辩一场","你坐到台前，按照准备好的思路发言。",()=>S.stats.academic>=20?"你很快抓住了对方论点里的漏洞，也第一次享受到现场思考的感觉。":"你有几次没能马上接住，但最后还是完整说出了自己的观点。"],["帮忙准备资料","你把资料、论点和例子重新整理。",()=>"整理完以后，你终于看懂了大家为什么会为了一个小问题争论这么久。"]]],
  "归宅部":["你没有加入固定社团。活动周的放学时间反而空了下来，学校里却比平时更热闹。",[["在校园里到处看看","你沿着走廊和操场慢慢逛了一圈。",()=>"你发现不参加社团也不意味着和校园活动无关。"],["和同学一起回家","你和同学边走边聊今天看到的活动。",()=>"一路聊到校门口，你反而知道了几个以前没注意过的社团。"]]]
 };
 const scene=scenes[club]||scenes["归宅部"];
 const stat=clubSkill(club);
 const choices=scene[1].map((c,index)=>[c[0],c[1],()=>{
  gainExperience(index===0?stat:"expression",2,"社团活动周");changeResource("energy",index===0?-7:-3);
  if(index===0)S.flags.clubCommitment=(S.flags.clubCommitment||0)+1;else changeResource("stress",-3);
  return typeof c[2]==="function"?c[2]():c[1];
 }]);
 showChoices("固定事件 · 5月","社团活动周 · "+club,scene[0],choices,typeof next==="function"?next:()=>{});
 return "HANDLED";
}

function startMonth(){startCalendarMonth();}

function runRoute(done){
  done=typeof done==="function"?done:finishMonth;
  const r=currentRoute();
  if(!r||!ROUTES[r]){done();return;}
  if(r==="竞赛生" && S.term!=="高一上" && S.term!=="高一下"){done();return;}
  if(r==="美术生" && S.term!=="高一上" && S.term!=="高一下"){done();return;}
  if((r==="文科生"||r==="理科生") && (S.term!=="高一下"||S.month<3||S.month>7)){done();return;}
  const key=S.term+"-"+S.month+"-"+r;
  if(S.usedRoute[key]){done();return;}
  const arr=Array.isArray(ROUTES[r])?ROUTES[r]:[];
  const available=arr.filter((e,i)=>e&&!S.usedRoute[r+"-"+i]);
  if(!available.length){done();return;}
  const pick=randomItem(available);
  const idx=arr.indexOf(pick);
  S.usedRoute[key]=true;S.usedRoute[r+"-"+idx]=true;
  S.history.push("路线："+pick.title);
  const choices=pick.choices.map((c,index)=>[c[0],c[1],()=>{
   rememberChoice("route:"+r+":"+idx,"choice-"+index,c[0],index===0?["投入"]:["调节"]);
   applyEffects(routeChoiceEffects(r,idx,index));
   return typeof c[2]==="function"?c[2]():c[1];
  }]);
  showChoices("路线固定事件 · "+S.month+"月",pick.title,pick.text,choices,done);
}

function runRandom(slot,done){
  if(typeof done!=="function")done=()=>{};

  if(slot===0){
    const unused=Object.keys(NPCS).filter(n=>!S.npcs.includes(n));
    if(!unused.length){npcInteraction(nextSocialNpc(),done);return;}

    const name=randomItem(unused);
    const intro={
      "大小姐":"她抱着手站在你旁边，嘴上还是一副“只是顺便聊聊”的样子。",
      "班长":"她把手里的资料整理好，转过来认真听你说。",
      "主人公":"她完全没有陌生人的拘谨，像是已经认识你一阵子似的。",
      "转校生":"她没有看你太久，但也没有像刚才那样马上离开。",
      "中二病":"她双马尾随着动作轻轻晃了一下，表情依旧认真得像是在讨论什么大事。",
      "学姐":"她站在校门边，和你聊起以前学校里那些现在想起来有点好笑的事情。",
      "同人女":"她把画本抱在怀里，终于没有刚见面时那么戒备。",
      "体育生":"她刚结束训练，整个人还是一副随时还能再跑两圈的样子。"
    };

    showChoices(
      "随机事件 · 认识同学",
      "第一次去卢浮宫时，没有什么特别的感觉",
      `放学以后，你在教学楼外碰见了${name}。\n\n${NPCS[name].desc}\n\n${intro[name]||""}\n\n广播站的声音从教学楼里传出来，周围还有同学抱着作业经过。`,
      [
        ["主动聊两句","你从课程、食堂或社团开始聊。",()=>{S.flags[`firstApproach:${name}`]="主动";addTendency("主动");rememberChoice(`meet:${name}`,"active","主动聊两句",["社交"]);}],
        ["先从共同话题说起","你从学校里刚发生的事情聊起。",()=>{S.flags[`firstApproach:${name}`]="共同话题";addTendency("观察");rememberChoice(`meet:${name}`,"common","先从共同话题说起",["稳妥"]);}]
      ],
      ()=>{
        ensureNpc(name,S.flags["firstApproach:"+name]==="共同话题"?2:1);
        if(S.stats.appearance>=16){S.flags["noticed:"+name]=true;log(name+"先记住了你的样子，但这不等于信任。");}
        update();
        npcInteraction(name,done);
      }
    );
    return;
  }

  const e=pickRandomEvent();
  if(!e){done();return;}
  S.usedRandom.push(e.key);
  S.history.push(e.title);
  showChoices("随机事件 · 第2次",e.title,e.text,e.choices,done);
}
