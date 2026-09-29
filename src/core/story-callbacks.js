"use strict";

function rememberEventCallback(thread,source,eventId,choice,text){
 if(S.eventCallbacks.some(item=>item.thread===thread))return;
 S.eventCallbacks.push({thread,source,eventId,choice,year:S.year,month:S.month});
 rememberImpact("callback:"+thread,text);
}
function callbackDone(thread){return S.eventCallbacks.some(item=>item.thread===thread);}

// 高一才俊杯复用原有事件位置，兑现十月面试留下的志愿者/补救邀请。
function fixedChoiceCallback(event){
 if(S.year!==1||S.month!==11||event.title!=="才俊杯"||callbackDone("council")||(!S.flags.studentCouncilApplied&&!S.flags.studentCouncilObserved))return null;
 const formal=S.flags.studentCouncilStatus==="正式干事";
 const before=formal?"上次面试后，你成了正式干事。班长把一份后台清单递过来：这次要实际承担工作了。":S.flags.studentCouncilApplied?"十月面试后留下的那次邀请终于有了下文：才俊杯需要后台帮手，做过这一场，再决定是否继续。":"九月你选择先观察学生会。这次班长说，愿意的话可以先帮一次后台，不用当场承诺加入。";
 const record=(choice,text)=>rememberEventCallback("council","y1_sep_student_council","y1_nov_council_followup",choice,text);
 return {id:"y1_nov_council_followup",title:"才俊杯 · 舞台与后台",tag:"固定事件 · 11月",text:before+"\n\n排练和后台准备撞在同一段时间里，你只能选一边。",context:{allowTraitChoices:true,activityDomain:"performance",skill:"expression",sceneCategory:"performance",replaceChoiceId:"stage",musicAllowed:true},choices:[
  {id:"stage",label:"把时间留给自己的节目",preview:"精力-5 · 表达经验+2；表演判定",run:()=>{S.flags.soloStage=true;const text=talentResult();record("stage","你记得学生会的邀请，这次仍把时间留给了自己的节目");return text;}},
  {id:"backstage",label:formal?"接下后台调度，兑现干事的职责":"先完成一次后台协作，再试一次",protected:true,preview:"精力-6 · 表达经验+2；成功增加信任，可补进正式名单",run:()=>{
   ensureNpc("班长",1);
   const check=activityCheck("expression","才俊杯后台协作",7,[{label:"面试后的准备",value:S.flags.studentCouncilSecondChance?1:0}],null,{activityDomain:"project",domains:["club"],npc:"班长",sceneCategory:"club"});
   gainExperience("expression",2,"协调后台安排");changeResource("energy",-6);
   const good=check.margin>=0;
   if(good){S.flags.studentCouncilStatus="正式干事";S.flags.studentCouncilSecondChance=false;changeTrust("班长",1,"完成实际协作");changeResource("stress",-2);}
   else{if(!formal)S.flags.studentCouncilStatus="活动志愿者";changeResource("stress",2);}
   S.flags.studentCouncilWork=true;
   record("backstage",good?"你在才俊杯后台完成协作，学生会的正式工作有了实际依据":"你尝试了才俊杯后台工作，留下了一份还需练习的交接单");
   return (good?(formal?"你把几处临时变动逐一接住。班长在交接单上写下你的名字，这次职责确实落到了事情里。":"你把节目与设备时间重新排清楚。班长确认你愿意继续，正式名单里终于有了你的名字；以后商量项目分工时，这段经验能派上用场。"):(formal?"临时变动让你漏接了一项安排。别人帮忙补上了空缺；干事身份没有被收回，但这次工作确实留下了返工。":"你完成了一部分，但交接还不够顺畅。这次记作活动志愿者经历，不自动获得正式干事的项目加成。"))+"\n\n"+formatCheck(check);
  }},
  {id:"watch",label:"这次只看演出，不再接任务",protected:true,preview:"精力+3 · 压力-2；不增加活动经验",run:()=>{changeResource("energy",3);changeResource("stress",-2);record("watch","你没有接下才俊杯的新任务，给自己留了时间");return "你说明了这次不接任务，也没有占着报名位置。演出结束以后，你按时回了家。";}}
 ]};
}

// 只装饰匹配的后续节点；保留原事件、其他选项和既有延续函数。
function withPastChoiceCallback(event){
 if(event.id==="y2-repair"&&!callbackDone("teacher-day")&&(S.flags.teacherAdvice||S.flags.oldFriendsKept)){
  const advice=Boolean(S.flags.teacherAdvice),baseText=event.text;
  const source=advice?"你想起高一教师节老师的提醒：给真正喜欢的事情留时间。现在你想给返工也划一道停止线。":"高一教师节后，你和初中朋友没有断掉联系。她们在旧群里说，可以替你试试这个原型。";
  const original=event.choices.find(choice=>choice.id==="repair");
  const replacement=advice?{...original,label:"按当年的提醒，限定返工范围再动手 · 专业判定",preview:"这次项目判定+1 · 精力-5 · 项目经验+2",run:()=>{
   const result=workOnProject("repair",{advice:true});
   rememberEventCallback("teacher-day","y1_sep_teachers_day",event.id,"advice-repair","高一老师留下的提醒，变成了高二一次有限返工的边界");return source+"\n\n"+result;
  }}:{id:"old-friends-test",label:"把原型发给初中朋友，请她们试用 · 线上表达",preview:"精力-6 · 表达经验+1；项目进展+1～2，成功压力-2，失败压力+2",run:()=>{
   const check=activityCheck("expression","给旧友说明原型",7,[],null,{activityDomain:"online",sceneCategory:"online"});
   const good=check.margin>=0,amount=good?2:1;
   gainExperience("expression",1,"整理线上测试说明");changeResource("energy",-6);changeResource("stress",good?-2:2);
   S.project.progress+=amount;S.flags.projectRepaired=true;S.flags.testedPrototype=true;
   if(!good)S.flags.projectSetbacks=(S.flags.projectSetbacks||0)+1;
   rememberEventCallback("teacher-day","y1_sep_teachers_day",event.id,"old-friends-test","高一保持的旧友联系，为高二的项目带来了一次外部试用");
   return source+"\n\n"+(good?"不熟悉项目的人果然卡在了别的地方。她们的反馈帮你改好了两处入口。":"说明还不够清楚，朋友们没能完整试完。你先修好了她们指出的第一个问题，剩下的仍需自己处理。")+`\n\n项目进展+${amount}。\n\n`+formatCheck(check);
  }};
  return {...event,text:()=> (typeof baseText==="function"?baseText():baseText)+"\n\n"+source,choices:event.choices.map(choice=>choice.id==="repair"?replacement:choice)};
 }
 if(event.id==="y3-plan-again"&&!callbackDone("campus-walk")){
  const alone=Boolean(S.flags.quietCorner),companion=S.flags.campusCompanion;
  if(!alone&&(!S.flags.campusRumours||!S.npcs.includes(companion)))return event;
  const source=alone?"高一独自绕校园时发现的安静连廊，现在仍然很少有人经过。":"高一和"+companion+"一起走过的那条路还在。你们约好这次不聊排名，只走到校门口。";
  const baseText=event.text;
  const replacement={id:"recover",label:alone?"回到高一找到的连廊，安静休息一会儿":"和当年同行的人沿旧路线走一段",protected:true,preview:alone?"精力+10 · 压力-14":`精力+6 · 压力-8 · ${companion}关系+1、信任+1`,run:()=>{
   changeResource("energy",alone?10:6);changeResource("stress",alone?-14:-8);
   if(!alone){changeRelation(companion,1,"沿旧路线走一段");changeTrust(companion,1,"仍然愿意留出相处时间");}
   rememberEventCallback("campus-walk","y1_sep_campus",event.id,alone?"quiet-corner":"old-route",alone?"高一找到的安静连廊，成了高三恢复状态的地方":`高三仍和${companion}走了一次入学时的老路`);
   return source+"\n\n"+(alone?"你坐了一会儿，把不需要今天解决的事从纸上划掉。旧地方没有替你完成复习，却帮你从紧绷里退开了一步。":"到校门口时，明天的试卷还在那里，但你们不必只通过成绩单知道彼此最近怎么样。");
  }};
  return {...event,text:()=> (typeof baseText==="function"?baseText():baseText)+"\n\n"+source,choices:event.choices.map(choice=>choice.id==="recover"?replacement:choice)};
 }
 return event;
}
