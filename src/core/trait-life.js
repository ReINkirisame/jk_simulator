"use strict";

function onlineExpression(label){
 const check=activityCheck("expression",label,7,[],null,{activityDomain:"online",sceneCategory:"online"});
 const good=check.margin>=0,xp=good?2:1;
 gainExperience("expression",xp,"整理线上表达");changeResource("energy",-6,"写作与回复");changeResource("stress",good?-3:2,"线上交流结果");
 S.flags.onlinePosts=(S.flags.onlinePosts||0)+1;
 return (good?"你把事情说清楚了，有人认真回了几句。把话写下来给了你整理思路的时间。":"有几句话让人会错了意。你补充了背景，再把页面关上；回复没有一直占着今天的时间。")+`\n\n表达经验+${xp}；精力-6；压力${formatSigned(good?-3:2)}。\n\n`+formatCheck(check);
}
function annualTraitName(){
 const counts=Object.fromEntries(ownedTraitNames().map(name=>[name,(S.traitAnnual||[]).filter(item=>item.trait===name).length]));
 return Object.keys(counts).sort((a,b)=>counts[a]-counts[b])[0]||null;
}
function annualTraitContext(name){
 const p=TRAIT_PROFILES[name],personal=TRAIT_DAY_PERSONAL[name];
 // 使用真实的活动领域；仅有月间恢复的特质不被伪装成判定加成。
 const domain=personal?.[3]||(p.domains.includes("online")?"online":p.domains.find(value=>value!=="all"))||"rest";
 const stat=personal?.[4]||p.skill;
 const npc=["social","project"].includes(domain)?closestNpc():null;
 return {activityDomain:domain,skill:stat,sceneCategory:domain,npc,allowTraitChoices:false};
}
function recordAnnualTrait(name,choice){
 if(S.traitAnnual.some(item=>item.year===S.year))return;
 S.traitAnnual.push({year:S.year,month:S.month,trait:name,choice});
 rememberImpact("trait-day:"+S.year,`这一年的【${name}】日常：${choice==="try"?"为它做了一次具体尝试":"给自己留了一段休息"}`);
}
function buildAnnualTraitEvent(name){
 const context=annualTraitContext(name),personal=TRAIT_DAY_PERSONAL[name],scene=personal||TRAIT_DAY_DOMAINS[context.activityDomain]||TRAIT_DAY_DOMAINS.rest;
 const passive=context.activityDomain==="rest";
 return {id:"trait-day:"+S.year,tag:"特质日常 · "+["","高一","高二","高三"][S.year],title:`${name} · ${scene[0]}`,
  text:scene[1]+"\n\n"+TRAIT_DAY_YEAR_TEXT[S.year],context,choices:[
   {id:"try",label:scene[2],preview:passive?`${ATTRIBUTES[context.skill].label}经验+1 · 精力-4`:`${ATTRIBUTES[context.skill].label}经验+1～2 · 精力-6；成功压力-2，失败压力+2`,run:()=>{
    if(S.traitAnnual.some(item=>item.year===S.year))return "这一学年的特质日常已经记录。";
    let result;
    if(passive){gainExperience(context.skill,1,"给喜欢的事留时间");changeResource("energy",-4);result="你只做了一小段，没有给自己追加整晚的计划。这半小时留下了一点经验。";}
    else{
     const check=activityCheck(context.skill,`【${name}】日常 · ${scene[0]}`,7,[],null,context),good=check.margin>=0;
     gainExperience(context.skill,good?2:1,"特质日常的实际尝试");changeResource("energy",-6);changeResource("stress",good?-2:2);
     if(context.npc&&good)changeRelation(context.npc,1,"一段具体的共同经历");
     result=(good?"你把预定的小事完成了，至少这一回，习惯确实帮你找到了做下去的方式。":"这次尝试卡在了中途。你记下下一次可以改的地方，也承认今天的时间已经用完了。")+`\n\n${ATTRIBUTES[context.skill].label}经验+${good?2:1}；精力-6；压力${formatSigned(good?-2:2)}。`+(context.npc&&good?`\n${context.npc}关系+1。`:"")+"\n\n"+formatCheck(check);
    }
    recordAnnualTrait(name,"try");return result;
   }},
   {id:"rest",label:"今天先收好，给自己留一段休息",protected:true,preview:"精力+6 · 压力-4；不增加活动经验",run:()=>{
    if(S.traitAnnual.some(item=>item.year===S.year))return "这一学年的特质日常已经记录。";
    changeResource("energy",6);changeResource("stress",-4);recordAnnualTrait(name,"rest");return "你没有因为今天停下就失去这个特质。把东西收好，吃完晚饭，明天仍然可以再决定。";
   }}
  ]};
}
function tryAnnualTraitDay(done){
 if(S.month!==TRAIT_DAY_MONTH||S.traitAnnual.some(item=>item.year===S.year))return false;
 const name=annualTraitName();if(!name)return false;
 runStoryEvent(buildAnnualTraitEvent(name),done);return true;
}
