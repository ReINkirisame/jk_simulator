"use strict";

function startGame(){
 const n=$("playerName").value.trim();
 if(!n)return alert("先给她起个名字吧。");
 if(S.traits.length!==3)return alert("请从10个特质中选择3个。");
 if(!pointsOK())return alert("四项属性的总点数必须正好是40。");
 S.name=n;S.stats={charm:val("iCharm"),intel:val("iIntel"),health:val("iHealth"),money:val("iMoney")};
 S.birthdayMonth=Math.max(1,Math.min(12,parseInt($("birthdayMonth").value,10)||1));
 S.birthdayDay=Math.max(1,Math.min(31,parseInt($("birthdayDay").value,10)||1));
 S.phase="month";S.month=9;S.term="高一上";S.npcs=[];S.npcRelation={};S.history=[];S.usedRandom=[];S.usedRoute={};S.flags={};S.exam={};S.examDetails={};
 S.interests=[];S.club=null;S.route=null;S.division=null;
 S.traitProgress={};S.hiddenTraits=[];S.traitChoiceState={misses:0,lastEventId:null,recentChoiceIds:[]};
 S.tendencies={};S.choiceHistory=[];S.memories=[];S.checks=[];S.npcImpressions={};
 $("setup").classList.add("hidden");$("result").classList.add("hidden");$("game").classList.remove("hidden");
 $("playerNameLabel").textContent=n;$("log").innerHTML="";
 log("你开始了高一上学期的生活。");log("初始特质："+S.traits.map(i=>S.pool[i][0]).join("、"));
 update();startMonth();
}

function finishMonth(){
 if(S.month===12 && S.term==="高一上"){semesterSummary("高一上");return;}
 if(S.month===7 && S.term==="高一下"){semesterSummary("高一下");return;}
 if(S.month===10&&S.term==="高一上"&&!S.flags.octoberPortraitShown){showOctoberPortrait();return;}
 const b=$("choices");b.innerHTML="";
 $("tag").textContent="本月结束";$("title").textContent="这个月的事情告一段落了";
 $("text").textContent="你收好书包，准备进入下个月。";
 const n=document.createElement("button");n.className="primary";n.textContent="进入下个月";
 n.onclick=()=>{n.disabled=true;b.innerHTML="";S.month++;startMonth()};b.appendChild(n);
}

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
 const list=(S.term==="高一上"?FIXED[S.month]:SECOND_FIXED[S.month])||[];
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
       const check=resolveCheck({stat:"charm",statLabel:"魅力",difficulty:7,label:"化解尴尬"});
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
  const follow={
    "大小姐":[
      ["问问她平时都去哪吃饭","你顺着她的话问起学校附近的店。她嘴上说“也就那几家”，却认真给你讲了哪一家午休不用排太久。",2],
      ["聊聊刚才的社团","你们从社团摊位聊到各自真正感兴趣的东西。她一开始还装得很不在意，后来明显聊得比刚才多。",1]
    ],
    "班长":[
      ["问她最近在忙什么","你问起她最近是不是总在帮老师整理东西。她笑着说只是顺手，但说到一半又开始聊起自己真正喜欢的课程。",2],
      ["聊聊班里的同学","你们把刚认识的几个人挨个聊了一遍。她记名字记得很快，你也顺便知道了几个班里的小圈子。",1]
    ],
    "主人公":[
      ["问她放学后准备干什么","她马上报出一串计划：社团、买饮料、去操场，最后还问你要不要一起。",2],
      ["继续聊社团","她兴奋地把自己感兴趣的活动全说了一遍，连下周的安排都已经想好了。",1]
    ],
    "转校生":[
      ["问她以前在哪里上学","她沉默了一会儿，只告诉你一个很普通的答案。你没有继续追问，她反而主动聊起现在学校的走廊。",2],
      ["和她一起走一段","你们并排走过教学楼，没有一直说话。快到楼梯口时，她忽然问你明天是不是也走这条路。",2]
    ],
    "中二病":[
      ["认真听她讲“结界”","她说得一本正经，你没有打断。讲到最后她自己先笑了，又开始和你讨论食堂今天的菜。",2],
      ["直接问她周末有没有空","她愣了一下，然后很爽快地告诉你周末的安排，还反问你是不是有什么活动。",1]
    ],
    "学姐":[
      ["问问初中的近况","她讲起以前的老师和学妹，最后还问你有没有遇到以前认识的人。",2],
      ["请她推荐学校里值得去的地方","她想了一会儿，给你列了几个学姐们常去的地方，还提醒你哪几个时间段最拥挤。",1]
    ],
    "同人女":[
      ["问她最近在画什么","她先警惕地看你一眼，确认你是真的感兴趣后，才翻开本子给你看其中一页。",2],
      ["聊聊喜欢的作品","你们从一部作品聊到另一部作品，她原本很小声，后来越说越兴奋。",1]
    ],
    "体育生":[
      ["问她最近在练什么","她马上开始讲训练安排，还顺手给你比划动作。",2],
      ["约下次一起去操场","她说可以，但提醒你先别高估自己的体力。",1]
    ]
  };
  const options=follow[name]||[
    ["继续聊刚才的话题","你们又聊了一会儿，原本陌生的气氛慢慢松下来。",1],
    ["聊聊放学后的安排","你们说起社团、作业和回家的路线，话题自然多了起来。",1]
  ];

  showChoices(
    "人物互动",
    name,
    `${specialNpcText(name)}\n\n你们已经不再只是刚刚见过一面的关系。`,
    options.map(o=>[
      o[0],
      o[1],
      ()=>{
        changeRelation(name,o[2],"继续相处");
        return o[1];
      }
    ]),
    done,
    {allowTraitChoices:true,tags:["npc","social"],npc:name,eventId:`npc-talk:${S.term}:${S.month}:${name}`}
  );
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

function tagEffect(t){
 if(t==="大小姐"&&S.stats.money>1)log("你的家庭条件让这件事的选择空间明显更大。");
 if(t==="运动少女"||t==="电竞选手")log(S.stats.health>=28?"你的体力和专注状态很好。":"你今天状态一般，做完以后有点累。");
 if(t==="校园偶像"||t==="交际花")log(S.stats.charm>=28?"你的魅力让你很容易成为人群里被记住的人。":"你没有刻意成为中心，但还是有人记住了你。");
 if(t==="认真"||t==="卷王"||t==="天生卷王")log(S.stats.intel>=26?"你的智力让你很快抓住了重点。":"你需要多花一点时间才能把事情理顺。");
}

function traitEvent(t){
 const title=tagTitles[t]||((t)+"的一天");
 const text=(tagTexts[t]||tagOutcomes[t]||"你在放学后的校园里遇到了一件具体的小事。")+(tagScenes[t]?"\n\n"+tagScenes[t]:"");
 const a=tagChoiceA[t]||"照自己的习惯处理";
 const b=tagChoiceB[t]||"先观察一下";
 const ra=tagOutcomes[t]||"你按自己的方式处理了眼前的事情。";
 const rb=tagOutcomes[t]?tagOutcomes[t]+" 你没有选择另一种做法，而是让事情顺着刚才的决定发展。":"你换了一种处理方式，事情也留下了不同的结果。";
 return {key:"trait:"+t,title,text,choices:[[a,ra,()=>tagEffect(t)],[b,rb,()=>tagEffect(t)]]};
}

function pickRandomEvent(){
 let candidates=RANDOM_EVENTS.filter(e=>!S.usedRandom.includes(e.key)&&!(e.key==="home168"));
 const traitNames=S.traits.map(i=>S.pool[i][0]).filter(t=>!S.usedRandom.includes("trait:"+t));
 if(traitNames.length&&gameRandom()<0.55)candidates.push(...traitNames.map(t=>traitEvent(t)));
 if(hasTrait("大小姐")&&!S.flags.home168Done&&gameRandom()<0.12){
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
 const healthCheck=S.stats.health>=20?1:S.stats.health<=5?-1:0;
 const healthScore=S.stats.health>=20?8:S.stats.health<=5?-10:0;
 const preparation=(Number(S.tendencies["稳妥"])||0)>=2?1:0;
 const momentCheck=momentId==="pace"?1:0;
 const check=resolveCheck({
   stat:"intel",statLabel:"智力",
   difficulty:7,
   modifiers:[
     {label:strategy.label,value:strategy.check},
     {label:"特质",value:trait.check},
     {label:"状态",value:healthCheck},
     {label:"前期习惯",value:preparation},
     {label:"时间分配",value:momentCheck}
   ],
   dice,
   label:name
 });
 const base=EXAM_BASE_SCORES[kind]??EXAM_BASE_SCORES.monthly;
 const academic=Math.round(S.stats.intel*5.6);
 const performance={failure:-18,setback:-6,success:5,great:14}[check.grade];
 let strategyScore=strategy.score;
 if(strategyId==="risk")strategyScore={failure:-18,setback:-7,success:6,great:16}[check.grade];
 const momentScore=momentId==="pace"?4:momentId==="instinct"?(check.grade==="great"?7:check.grade==="failure"?-4:1):0;
 const total=Math.max(300,Math.min(680,Math.round(base+academic+healthScore+trait.score+strategyScore+momentScore+performance)));
 if(strategyId==="preserve")changeStat("health",1,"考试中保住了状态");
 return {name,kind,strategyId,momentId,score:total,check,parts:{base,academic,healthScore,traitScore:trait.score,strategyScore,momentScore,performance},traitLabel:trait.label};
}

function saveExamResult(result){
 const {kind,score}=result;
 S.exam[kind]=score;S.examDetails[kind]=result;
 if(kind==="monthly")S.exam.firstMonthly=score;
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
 return `${result.name}结束。\n\n本次成绩：${result.score} / 750\n策略：${strategy.label}\n\n${performanceText}\n\n${formatCheck(result.check)}\n\n成绩构成：学业基础 ${p.base+p.academic}，状态 ${formatSigned(p.healthScore)}，特质 ${formatSigned(p.traitScore)}，策略与临场 ${formatSigned(p.strategyScore+p.momentScore+p.performance)}。`;
}

function finishExam(name,kind,strategyId,momentId,resume,dice=null){
 const result=calculateExam(name,kind,strategyId,momentId,dice);
 saveExamResult(result);
 showContinueScreen("考试结果",name+" · 成绩单",examResultText(result),"收好成绩单",resume);
}

function startExam(name,kind,strategyId="steady",resume=finishMonth){
 const major=kind!=="monthly";
 if(!major){finishExam(name,kind,strategyId,null,resume);return "HANDLED";}
 showChoices("考试 · 考场抉择",name,`考试进行到后半段，时间开始变得紧张。你不需要逐科模拟答题，但要决定怎样处理这次真正影响发挥的时刻。`,[
   ["重新分配剩余时间","你先保证整张卷子都能留下有效答案。",()=>{rememberChoice(`exam:${kind}:moment`,"pace","重新分配剩余时间",["稳妥"]);finishExam(name,kind,strategyId,"pace",resume);return "HANDLED";}],
   ["相信第一判断继续做","你不反复修改已经完成的部分，把注意力留给眼前。",()=>{rememberChoice(`exam:${kind}:moment`,"instinct","相信第一判断继续做",["果断"]);finishExam(name,kind,strategyId,"instinct",resume);return "HANDLED";}]
 ],()=>{});
 return "HANDLED";
}

/* ---------- 特殊固定结果 ---------- */
function introClassmates(mode){
 if(mode==="active"){
   ensureNpc("主人公",2);changeStat("charm",1,"主动完成自我介绍");
   S.flags.firstClassApproach="主动认识";
   return "你没有等座位关系替你安排朋友，而是主动接住了几个人的话。主人公也从前排转过来和你聊了几句；以后再见面，你们已经有了开口的理由。";
 }
 ensureNpc("班长",1);S.flags.firstClassApproach="先观察";S.flags.classDynamicsKnown=true;
 return "你没有急着成为中心，却记住了谁总在活跃气氛、谁习惯安静听完。班长注意到你一直在认真听，散会以后主动问了你的名字。";
}

function exploreCampus(mode){
 if(mode==="solo"){
   S.flags.quietCorner=true;changeStat("health",1,"把校园完整走了一遍");
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
 S.flags.oldFriendsKept=true;changeStat("charm",1,"维持初中同学联系");
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
   statValue:(S.stats.charm+S.stats.intel)/2,
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
   stat:"charm",statLabel:"魅力",difficulty:7,
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
 S.flags.nationalDayAlone=true;changeStat("health",1,"给自己留出完整的一天");
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
 addInterest("手工");S.flags.lanternStyle=style;
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
 const qualified=S.stats.intel>=20||hasTrait("天赋")||hasTrait("卷王")||hasTrait("天生卷王");
 const check=resolveCheck({stat:"intel",statLabel:"智力",difficulty:8,modifiers:[
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
 addTendency("社交");
 const c=S.stats.charm;
 return c>=25?"你说完以后，原本各聊各的几个人很快接上了话。有人甚至把刚才没说完的话重新讲给你听。":
        c<=10?"你在旁边听了一会儿，直到有人把话题递过来，你才顺着接了一句。":
        "你和旁边的人自然聊了几句，之后见面应该不会再只是点头。";
}
function fixedObserve(){addTendency("观察");return "你听着大家的说法，慢慢记住了谁爱抢话、谁总在最后补一句。"}
function competitionResult(){addTendency("探索");return S.stats.intel>=20||hasTrait("天赋")?"你听完训练后发现自己确实能跟上节奏，老师建议你之后认真考虑竞赛生路线。":"你听完以后发现竞赛训练和普通课堂差别很大，但旁听经历让你知道具体差距在哪里。"}
function artResult(){addTendency("探索");return hasTag("美术")||hasTrait("文艺b")||hasTrait("漫画家")?"老师觉得你有兴趣基础，值得继续训练。":"你看了一下午以后，终于知道专业美术训练到底有多辛苦。"}
function talentResult(){addTendency("表达");changeStat("charm",1,"完成一次公开表达");return S.stats.charm>=25?"你一上台，台下很快有人认出你，节目结束以后还有同学过来问你刚才准备了多久。":"节目没有成为全校焦点，但台下的掌声很真实，你自己也记住了这次尝试。"}
function studyResult(){addTendency("稳妥");changeStat("intel",1,"完成阶段复习");return S.stats.intel>=22?"你把几门课重新整理以后，发现很多原来散乱的知识终于连了起来。":"你把这一学期的重点重新过了一遍，至少知道接下来该补哪里。"}

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
 showContinueScreen("阶段人物小结","她正在变成怎样的人",portrait,"进入11月",()=>{S.month=11;startMonth()});
}

/* ---------- 学期总结 / 寒假 ---------- */
function semesterSummary(term){
 if(term==="高一上"){
  const m=S.exam.firstMonthly?`${S.exam.firstMonthly} / 750`:"未记录";
  const f=S.exam.firstFinal?`${S.exam.firstFinal} / 750`:"未记录";
  const remembered=(S.memories||[]).filter(item=>item.term==="高一上").slice(-5).map(item=>`· ${item.text}`).join("\n");
  const recentChoices=(S.choiceHistory||[]).filter(item=>item.term==="高一上").slice(-4).map(item=>item.label).join("、");
  showChoices("学期小记","高一上学期结束",
   `【高一上，学期末】\n九月刚开学的时候，我还在记教学楼、食堂和教室的位置。后来认识了新的同学，参加了${S.club||"社团活动"}，第一次月考也让我真正看见了重点高中里的竞争。\n\n秋天做过一盏花灯，冬天下过一场雪。花灯后来真的以${S.flags.lanternStyle==="creative"?"明显属于自己的样子":S.flags.lanternStyle==="stable"?"完好稳固的样子":"普通作业的样子"}挂在了走廊里。\n\n本学期留下的影响：\n${remembered||"· 还没有形成明确记录"}\n\n最近作出的选择：${recentChoices||"未记录"}\n\n第一次月考：${m}\n高一上期末：${f}`,
   [["开始寒假","你把成绩单收好。",()=>{}]],()=>startWinter());
 }else{
  const f=S.exam.secondFinal?`${S.exam.secondFinal} / 750`:"未记录";
  showChoices("学期小记","高一下学期结束",
   `【高一下，学期末】\n这一学期，你已经开始知道自己愿意把时间放在哪里。文理分科、开学考试、文化节、社团活动周、科技节，以及最后的期末考试，都让“高中生活”变得越来越具体。\n\n高一下期末：${f}`,
   [["进入暑假","你把这一学期的东西收好。",()=>{}]],()=>summerBreak());
 }
}
function summerBreak(){
 S.phase="summer";
 update();
 const box=$("choices");box.innerHTML="";
 $("tag").textContent="暑假";
 $("title").textContent="高一学年结束";
 $("text").textContent="高一下学期已经结束。学期小记会一直保留在这里，不再自动推进到八月或重新开始月份。";
 const n=document.createElement("button");n.className="primary";n.type="button";n.textContent="保留学期小结";
 n.onclick=()=>{n.disabled=true;$("text").textContent="高一下学期小结已保留。你可以回看当前成绩、路线、社团和这一学年的经历。";n.textContent="小结已保留";};
 box.appendChild(n);
 update();
}

function startWinter(){
 S.month=1;S.term="寒假";
 const fixed=[
  {title:"去南湖公园看到了烟花",text:"除夕前的一天，你和家人路过南湖公园。远处的烟花突然升起来，湖面上亮了一片。",r:"你站在湖边看了一会儿，寒假的开头因此留下了一个很具体的画面。"},
  {title:"出去玩雪时着凉感冒",text:"一场雪后，你和同学出去玩了半天。回家以后才发现自己一直在打喷嚏。",r:"你老老实实休息了几天，也第一次意识到假期安排不能只看当下开心不开心。"},
  {title:"回农村老家和家人一起过年",text:"一家人开车回了农村老家。院子里比城市安静很多，亲戚们忙着准备年夜饭。",r:"你在老家待了几天，重新见到了平时很少见的亲戚。"},
  {title:"出去旅游",text:"家里安排了一趟短途旅行。每天的行程没有学校课表那么紧，但也不是完全没有计划。",r:"你换了一个地方生活几天，回来以后反而更想念自己的房间和书桌。"}
 ];
 const e=randomItem(fixed);
 showChoices("寒假","寒假第一件事 · "+e.title,e.text,[["继续","你把这几天的经历记下来。",()=>e.r]],()=>winterSelf());
}
function winterSelf(){
 // 已经确定的竞赛生/美术生路线具有最高优先级，寒假不能被普通学业选择覆盖。
 if(S.route==="竞赛生"||S.route==="美术生"){
   const r=S.route;
   showChoices("寒假","自己安排的一件事",`你已经确定走${r}方向。这个寒假，你决定专门留时间为下学期的训练做准备。`,[
     ["安排训练计划",r==="竞赛生"?"你把竞赛资料、训练时间和休息时间重新排了一遍。":"你把基础训练拆成每天能完成的小目标，准备开学后继续。",()=>r==="竞赛生"?"你提前给高一下的竞赛训练留出了固定时间。":"你没有急着追求完成度，而是先把基础训练稳定下来。"],
     ["给自己留一点空间",r==="竞赛生"?"你没有把假期全部塞进题目里，只挑真正想研究的内容继续看。":"你没有把整个假期都泡在画室，而是留了一些时间观察和积累素材。",()=>r==="竞赛生"?"你发现保持自己的生活节奏，反而更容易长期坚持训练。":"你发现真正属于自己的观察和积累，也会成为专业训练的一部分。"]
   ],()=>winterNPC());
   return;
 }
 const opts=[];
 if(S.stats.intel>=20)opts.push(["为竞赛生路线准备","你整理竞赛资料并安排训练时间。",()=>{S.route="竞赛生";return "你提前给高一下的竞赛训练留出了固定时间。";}]);
 if(S.stats.charm>=20||hasTag("美术")||hasTrait("文艺b")||hasTrait("漫画家"))opts.push(["为美术生路线准备","你开始练习基础绘画并了解后续训练。",()=>{S.route="美术生";return "你没有只画自己喜欢的内容，而是开始接触需要反复练习的基础。";}]);
 if(S.stats.health>=20||hasTrait("运动少女"))opts.push(["为体育路线准备","你给自己安排规律运动。",()=>{S.route="体育路线";return "假期里运动第一次变成了固定安排。";}]);
 opts.push(["为学业路线准备","你整理上学期试卷和错题。",()=>{S.route=S.division==="文科"?"文科生":S.division==="理科"?"理科生":"学业";return "你把错题、笔记和新学期资料重新整理好。"}]);
 opts.push(["为校园生活准备","你给自己留出更多社团和校园活动时间。",()=>{S.route="校园生活";return "你提前想好了高一下最想参加的活动。"}]);
 showChoices("寒假","自己安排的一件事","假期里你决定专门留一段时间，为高一下做一件准备。",opts,()=>winterNPC());
}

function winterNPC(){
 const name=S.npcs.length?randomItem(S.npcs):"家人";
 const text=name==="家人"?"过年期间你和家里人聊了聊新学期。":"你和"+name+"约了一次见面。你们没有讨论什么宏大计划，只是聊最近的学校生活和寒假里做过的事情。";
 showChoices("寒假","和NPC互动",text,[["一起走走","你们边走边聊。",()=>name==="家人"?"家里人提醒你新学期别把自己逼得太紧。":"你发现寒假见面以后，下学期再见到对方时已经不会尴尬。"],["坐下来聊会儿","你们找了个安静地方坐着。",()=>name==="家人"?"你第一次认真听家里人说起对你的期待。":"你们聊了很久，最后约好开学以后再继续这个话题。"]],()=>{S.month=3;S.term="高一下";startMonth()},name==="家人"?{}:{
   allowTraitChoices:true,
   tags:["npc","social","holiday"],
   npc:name,
   eventId:`winter-talk:${name}`
 });
}

/* ---------- 社团活动周 ---------- */
function clubWeek(next){
 const club=S.club||"归宅部";
 const scenes={
  "文学社":["校刊编辑室里堆着改到一半的稿子。学姐把一篇文章递给你，让你帮忙看看标题。",[["一起改稿","你和社员把标题、开头和结尾逐句讨论了一遍。",()=>"你第一次觉得，写出来的东西真的会被别人认真看。"],["负责校刊排版","你把文章、图片和栏目重新整理。",()=>"忙完以后，整本校刊终于有了完整的样子。"]]],
  "动漫社":["活动室里放着大家最近讨论的作品，桌上还摆着几本借来的漫画。",[["参加作品讨论","你和社员认真聊起最近看过的作品。",()=>"原本只知道作品名字的人，也因为这次聊天慢慢熟了起来。"],["帮忙布置展板","你把海报和作品介绍贴到走廊展板上。",()=>"路过的同学停下来多看了几眼，你第一次觉得兴趣也能出现在校园里。"]]],
  "音乐社":["音乐社正在为学校活动排练。有人弹琴，有人练唱，教室外都能听见声音。",[["参加排练","你拿起自己的乐器或跟着大家练习。",()=>"合奏第一次完整结束时，所有人都笑了出来。"],["帮忙准备演出","你负责谱子、设备和现场安排。",()=>"虽然没站在最前面，但你发现演出顺利进行同样需要很多准备。"]]],
  "美术社":["美术社把活动室的一面墙留给了社员作品。颜料、画纸和画板几乎铺满了桌面。",[["完成一幅作品","你坐下来认真画了一下午。",()=>"最后退后几步看自己的画时，你终于知道自己这段时间到底进步在哪里。"],["帮忙做校园展板","你和其他社员一起处理学校活动的视觉设计。",()=>"展板挂起来以后，路过的同学纷纷停下来看看。"]]],
  "街舞社":["放学后的活动室里音乐已经响起来了。大家正在为月底的表演反复练习。",[["跟着练一遍","你从基础动作开始跟着大家练。",()=>S.stats.health>=20||hasTrait("运动少女")?"你虽然出了不少汗，但整套动作终于跟了下来。":"你很快就喘得厉害，只能先把基础动作练熟。"],["负责队形和音乐","你站在旁边帮大家记节拍和走位。",()=>"你发现一场看起来很热闹的表演，背后其实有很多细节要对。"]]],
  "广播站":["广播站里正在准备社团活动周的特别节目，桌上摆着采访提纲和一摞稿子。",[["试着播一段","你戴上耳机，对着麦克风读完一段稿子。",()=>S.stats.charm>=20||hasTrait("开朗")?"你的声音比自己想象中更自然，学姐让你再试一次。":"第一遍有点紧张，但读完以后你已经知道问题在哪里。"],["采访同学","你拿着提纲去找参加活动的同学聊天。",()=>"原本只有几句话的采访，最后变成了一段很有意思的闲聊。"]]],
  "志愿者协会":["社团活动周期间，志愿者协会负责引导人流、整理场地和回收物资。",[["负责现场引导","你站在活动场地入口帮忙维持秩序。",()=>"忙起来以后你几乎没时间闲着，但也认识了不少来帮忙的同学。"],["整理活动物资","你和社员一起把桌椅、宣传册和剩余物资归类。",()=>"活动结束后，场地很快恢复整洁。"]]],
  "篮球社":["篮球社正在进行社团活动周的友谊赛，场边围着不少同学。",[["报名上场","你换好鞋走进球场。",()=>S.stats.health>=20||hasTrait("运动少女")?"你坚持打完整场，最后累得坐在场边喝水。":"你很快感到体力跟不上，但还是认真打完了属于自己的时间。"],["负责场边工作","你帮忙计分、递水和记录比赛。",()=>"虽然没上场，你还是从头到尾参与了这场比赛。"]]],
  "话剧社":["话剧社的排练比平时更认真，后台摆着临时做好的道具。",[["临时接一个角色","有人临时缺席，你顶上去试了一段。",()=>S.stats.charm>=20||hasTrait("开朗")?"你越演越放松，最后真的把这一段接了下来。":"刚开始有点紧张，但你还是把自己的台词完整说完了。"],["负责后台道具","你把几件临时道具重新整理好。",()=>"演出开始以后，你站在后台看着舞台，第一次发现幕后也有自己的节奏。"]]],
  "辩论社":["辩论社正在为活动周准备公开展示，桌上已经写满了论点和反驳。",[["上台辩一场","你坐到台前，按照准备好的思路发言。",()=>S.stats.intel>=20?"你很快抓住了对方论点里的漏洞，也第一次享受到现场思考的感觉。":"你有几次没能马上接住，但最后还是完整说出了自己的观点。"],["帮忙准备资料","你把资料、论点和例子重新整理。",()=>"整理完以后，你终于看懂了大家为什么会为了一个小问题争论这么久。"]]],
  "归宅部":["你没有加入固定社团。活动周的放学时间反而空了下来，学校里却比平时更热闹。",[["在校园里到处看看","你沿着走廊和操场慢慢逛了一圈。",()=>"你发现不参加社团也不意味着和校园活动无关。"],["和同学一起回家","你和同学边走边聊今天看到的活动。",()=>"一路聊到校门口，你反而知道了几个以前没注意过的社团。"]]]
 };
 const scene=scenes[club]||scenes["归宅部"];
 showChoices("固定事件 · 5月","社团活动周 · "+club,scene[0],scene[1],typeof next==="function"?next:()=>{});
 return "HANDLED";
}

function startMonth(){
 update();
 if(S.term==="高一上"){
   if(S.month===12)runRandom(0,()=>runBirthday(()=>runFixedMonth(0,()=>semesterSummary("高一上"))));
   else runFixedMonth(0,()=>runRoute(()=>runBirthday(()=>runRandom(0,finishMonth))));
 }else{
   runFixedMonth(0,()=>runRoute(()=>runBirthday(()=>runRandom(0,finishMonth))));
 }
}
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
  showChoices("路线固定事件 · "+S.month+"月",pick.title,pick.text,pick.choices,done);
}

function runRandom(slot,done){
  if(typeof done!=="function")done=()=>{};

  if(slot===0){
    const unused=Object.keys(NPCS).filter(n=>!S.npcs.includes(n));
    if(!unused.length){runRandom(1,done);return;}

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
        ensureNpc(name,S.flags[`firstApproach:${name}`]==="共同话题"?2:1);
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
