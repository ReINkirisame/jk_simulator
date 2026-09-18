"use strict";

function traitSystemState(){
 if(!S.traitProgress||typeof S.traitProgress!=="object")S.traitProgress={};
 if(!Array.isArray(S.hiddenTraits))S.hiddenTraits=[];
 if(!S.traitChoiceState||typeof S.traitChoiceState!=="object"){
   S.traitChoiceState={misses:0,lastEventId:null,recentChoiceIds:[]};
 }
 if(!Array.isArray(S.traitChoiceState.recentChoiceIds))S.traitChoiceState.recentChoiceIds=[];
 return S.traitChoiceState;
}

function getTraitXp(name){
 traitSystemState();
 return Math.max(0,Number(S.traitProgress[name])||0);
}

function getTraitLevel(name){
 const xp=getTraitXp(name);
 if(name==="癫佬")return xp>=4?3:xp>=2?2:1;
 return 1;
}

function hasHiddenTrait(name){
 traitSystemState();
 return S.hiddenTraits.includes(name);
}

function getVisibleTraitBadges(){
 traitSystemState();
 return S.traits.map(i=>S.pool[i]&&S.pool[i][0]).filter(Boolean).map(name=>{
   if(name==="癫佬"&&hasHiddenTrait("古明地恋")){
     return {label:"古明地恋 · 隐藏",className:"hidden-trait",title:HIDDEN_TRAITS["古明地恋"].desc};
   }
   if(name==="癫佬"){
     return {label:`癫佬 Lv.${getTraitLevel(name)}`,className:"progress-trait",title:"在人物互动中偶尔出现专属选项。"};
   }
   return {label:name,className:"",title:""};
 });
}

function contextHasTags(context,requiredTags){
 const tags=Array.isArray(context.tags)?context.tags:[];
 return requiredTags.every(tag=>tags.includes(tag));
}

function activeTraitForSet(set){
 if(set.evolution&&hasHiddenTrait(set.evolution.trait))return set.evolution.trait;
 return hasTrait(set.trait)?set.trait:null;
}

function availableTraitTemplates(set,activeTrait){
 if(set.evolution&&activeTrait===set.evolution.trait)return set.evolvedChoices||[];
 const level=getTraitLevel(set.trait);
 return (set.choices||[]).filter(choice=>(choice.minLevel||1)<=level);
}

function chooseFreshTraitTemplate(templates){
 const state=traitSystemState();
 const recent=state.recentChoiceIds.slice(-3);
 const fresh=templates.filter(template=>!recent.includes(template.id));
 const pool=fresh.length?fresh:templates;
 return pool[Math.floor(Math.random()*pool.length)];
}

function shouldOfferTraitChoice(set,context){
 const state=traitSystemState();
 const eventId=context.eventId||`${S.term}:${S.month}:${context.npc||"event"}`;
 if(state.lastEventId===eventId)return false;
 state.lastEventId=eventId;
 if(context.forceTraitChoice){state.misses=0;return true;}
 const offered=state.misses>=1||Math.random()<(set.offerChance??0.5);
 if(offered)state.misses=0;
 else state.misses+=1;
 return offered;
}

function relationRollForChaos(activeTrait,npcName){
 const evolved=activeTrait==="古明地恋";
 const pool=evolved?[-1,0,1,1,1,2,2,3]:[-2,-1,-1,0,0,1,1,2];
 const affinity=NPCS[npcName]&&Number(NPCS[npcName].chaosAffinity)||0;
 const rolled=pool[Math.floor(Math.random()*pool.length)]+affinity;
 return Math.max(evolved?-1:-2,Math.min(evolved?3:2,rolled));
}

function chaosReactionText(npcName,delta,evolved){
 if(evolved){
   if(delta<0)return `这次节奏没有对上，${npcName}顺手把话题带回原处。没有人觉得刚才有什么不对。`;
   if(delta===0)return `事情就这样自然地发生了。${npcName}继续和你聊天，仿佛这本来就是正常流程。`;
   return `${npcName}理所当然地跟上了你的思路。等话题结束，你们之间反而多了一段只有彼此明白的经历。`;
 }
 if(delta<0)return `${npcName}沉默了两秒，像是在重新评估刚才到底发生了什么。`;
 if(delta===0)return `${npcName}竟然把话接住了。场面没有变得更好或更坏，只是比刚才怪了一点。`;
 return `${npcName}先是愣住，随后真的笑了出来。你们之间的距离意外地近了一点。`;
}

function advanceTraitProgress(set){
 if(set.evolution&&hasHiddenTrait(set.evolution.trait))return null;
 const next=getTraitXp(set.trait)+1;
 S.traitProgress[set.trait]=next;
 if(set.evolution&&next>=set.evolution.xp){
   S.hiddenTraits.push(set.evolution.trait);
   log(`隐藏特质解锁：【${set.evolution.trait}】。`);
   return set.evolution.trait;
 }
 return null;
}

const TRAIT_CHOICE_RESOLVERS={
 chaosNpc(set,template,context,activeTrait){
   const npcName=context.npc;
   const evolved=activeTrait==="古明地恋";
   const delta=relationRollForChaos(activeTrait,npcName);
   S.npcRelation[npcName]=Math.max(0,(S.npcRelation[npcName]||1)+delta);

   const state=traitSystemState();
   state.recentChoiceIds.push(template.id);
   state.recentChoiceIds=state.recentChoiceIds.slice(-3);

   const unlocked=advanceTraitProgress(set);
   const mood=delta>0?"关系似乎更近了":delta<0?"气氛短暂地变得有点微妙":"关系没有明显变化";
   log(`【${activeTrait}】${template.label}；和【${npcName}】${mood}。`);

   let result=`${template.result}\n\n${chaosReactionText(npcName,delta,evolved)}`;
   if(unlocked){
     result+=`\n\n某种东西越过了临界点。隐藏特质【${unlocked}】已解锁：以后类似的举动会被周围人自然接受，人际结果也更偏向积极。`;
   }
   return result;
 }
};

function buildInjectedTraitChoice(set,template,context,activeTrait){
 const resolver=TRAIT_CHOICE_RESOLVERS[set.resolver];
 const level=activeTrait===set.trait?` Lv.${getTraitLevel(set.trait)}`:"";
 return [
   `【${activeTrait}${level}】${template.label}`,
   template.result,
   ()=>resolver(set,template,context,activeTrait),
   {className:"trait-choice",trait:activeTrait,choiceId:template.id}
 ];
}

/**
 * 为现有事件追加最多一个特质专属选项。
 * context 示例：
 * {allowTraitChoices:true,tags:["npc","social"],npc:"中二病",eventId:"npc-talk-1"}
 */
function injectTraitChoices(baseChoices,context={}){
 const choices=Array.isArray(baseChoices)?[...baseChoices]:[];
 if(!context.allowTraitChoices)return choices;

 const candidates=TRAIT_CHOICE_SETS.map(set=>{
   const activeTrait=activeTraitForSet(set);
   if(!activeTrait||!contextHasTags(context,set.requiredTags||[]))return null;
   const templates=availableTraitTemplates(set,activeTrait);
   return templates.length?{set,activeTrait,templates}:null;
 }).filter(Boolean);

 if(!candidates.length)return choices;
 const candidate=candidates[Math.floor(Math.random()*candidates.length)];
 if(!shouldOfferTraitChoice(candidate.set,context))return choices;
 const template=chooseFreshTraitTemplate(candidate.templates);
 choices.push(buildInjectedTraitChoice(candidate.set,template,context,candidate.activeTrait));
 return choices;
}
