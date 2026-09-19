"use strict";

// 新事件用对象描述；旧版三元组仍可运行，便于逐步迁移，不复制另一套游戏。
const EFFECT_TYPES=new Set(["xp","resource","relation","trust","flag","interest","project","memory"]);
function applyEffects(effects=[],context={}){
 for(const effect of effects){
  const name=effect.npc==="$npc"?context.npc:effect.npc;
  switch(effect.type){
   case "xp":gainExperience(effect.key,effect.value,effect.reason||"活动积累");break;
   case "resource":changeResource(effect.key,effect.value,effect.reason||"");break;
   case "relation":changeRelation(name,effect.value,effect.reason||"这次相处");break;
   case "trust":changeTrust(name,effect.value,effect.reason||"信守选择");break;
   case "flag":S.flags[effect.key]=effect.value;break;
   case "interest":addInterest(effect.key);break;
   case "project":if(S.project)S.project.progress=Math.max(0,S.project.progress+effect.value);break;
   case "memory":rememberImpact(context.eventId||"story",effect.text);break;
   default:throw new Error("未知效果类型："+effect.type);
  }
 }
}
function activityCheck(stat,label,difficulty=7,modifiers=[],dice=null){
 const mood=stat==="appearance"?[
  {label:"当月仪容",value:S.flags.groomingMonth===monthKey()?S.flags.grooming||0:0}
 ]:[
  {label:"精力充足",value:S.resources.energy>=75?1:0},
  {label:"精力不足",value:S.resources.energy<30?-1:0},
  {label:"已经透支",value:S.resources.energy<10?-1:0},
  {label:"压力过高",value:S.resources.stress>=70?-1:0},
  {label:"压力临界",value:S.resources.stress>=90?-1:0}
 ];
 return resolveCheck({stat,label,difficulty,modifiers:[...mood,...modifiers],dice});
}
function choiceEffectPreview(effects=[],cost=0){
 const totals={cash:cost?-cost:0,energy:0,stress:0};
 for(const effect of effects){
  if(effect&&effect.type==="resource"&&Object.hasOwn(totals,effect.key))totals[effect.key]+=Number(effect.value)||0;
 }
 return Object.entries(totals).filter(([,value])=>value).map(([key,value])=>`${{cash:"零花钱",energy:"精力",stress:"压力"}[key]}${formatSigned(value)}`).join(" · ");
}
function runStoryEvent(event,done){
 if(event.condition&&!event.condition()){done();return;}
 const context={eventId:event.id,...(typeof event.context==="function"?event.context():event.context||{})};
 const choices=(typeof event.choices==="function"?event.choices():event.choices).filter(choice=>!choice.condition||choice.condition());
 const list=choices.map(choice=>{
  const disabled=Boolean(choice.cost&&S.resources.cash<choice.cost);
  const label=choice.label+(choice.cost?` · ${choice.cost}元${disabled?"（余额不足）":""}`:"");
  const examKind=typeof examKindForEvent==="function"?examKindForEvent(event.id,event.title):null;
  const inferredPreview=examKind&&["steady","risk","preserve"].includes(choice.id)?examForecastText(examKind,choice.id):"";
  return [label,choice.text||"",action=>{
   if(choice.cost&&!spendCash(choice.cost,"活动开销"))return "零花钱不够。这次没有支付费用，也没有获得付费效果。";
   rememberChoice(event.id,choice.id,choice.label,choice.tags||[]);
   applyEffects(choice.effects||[],context);
   let result=typeof choice.text==="function"?choice.text():choice.text||"";
   if(choice.run){const value=choice.run(action,context);if(value==="HANDLED")return value;if(typeof value==="string")result=value;}
   if(choice.check){
    const c=choice.check;
    const check=activityCheck(c.stat,c.label||event.title,c.difficulty||7,typeof c.modifiers==="function"?c.modifiers():c.modifiers||[]);
    const outcome=choice.outcomes?.[check.grade]||choice.outcomes?.[check.margin>=0?"success":"failure"];
    if(outcome){applyEffects(outcome.effects||[],context);result=typeof outcome.text==="function"?outcome.text(check):outcome.text;}
    result+="\n\n"+formatCheck(check);
   }
   if(choice.impact)rememberImpact(event.id,typeof choice.impact==="function"?choice.impact():choice.impact);
   return result;
  },{id:choice.id,role:choice.role||"safe",replaceable:choice.replaceable===true,protected:choice.protected===true,disabled,hint:choice.hint||"",preview:(typeof choice.preview==="function"?choice.preview():choice.preview)||inferredPreview||choiceEffectPreview(choice.effects||[],choice.cost||0)}];
 });
 S.history.push(event.title);
 showChoices(event.tag||"校园生活",event.title,typeof event.text==="function"?event.text():event.text,list,done,context);
}
function runStorySequence(events,index,done){
 if(index>=events.length){done();return;}
 runStoryEvent(events[index],()=>runStorySequence(events,index+1,done));
}
function validateStoryEvent(event){
 const errors=[];
 if(!event.id||!event.title)errors.push("新事件缺少id或标题");
 const choices=typeof event.choices==="function"?null:event.choices;
 if(!choices&&!event.choices)errors.push(event.id+"没有选项");
 if(choices){
  const ids=new Set();
  for(const choice of choices){
   if(!choice.id||ids.has(choice.id))errors.push(event.id+"选项id缺失或重复");ids.add(choice.id);
   if(choice.protected&&choice.replaceable)errors.push(event.id+"关键选项不得标成可替换");
   if(choice.check&&!ATTRIBUTES[choice.check.stat])errors.push(event.id+"引用未知属性");
   const effects=[...(choice.effects||[]),...Object.values(choice.outcomes||{}).flatMap(outcome=>outcome.effects||[])];
   for(const effect of effects){
    if(!EFFECT_TYPES.has(effect.type))errors.push(event.id+"引用未知效果");
    if(effect.type==="xp"&&(!ATTRIBUTES[effect.key]||effect.key==="appearance"))errors.push(event.id+"经验不得指向外貌或未知能力");
    if(effect.type==="resource"&&!["cash","energy","stress"].includes(effect.key))errors.push(event.id+"引用未知资源");
    if(["relation","trust"].includes(effect.type)&&effect.npc!=="$npc"&&!NPCS[effect.npc])errors.push(event.id+"引用未知人物");
   }
  }
 }
 return errors;
}
