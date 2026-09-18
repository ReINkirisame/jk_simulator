"use strict";

const GAME_VERSION="0.4.0";

/**
 * 开发期的轻量内容检查。
 * 它不会阻止游戏启动，只会在浏览器控制台指出明显的数据问题。
 */
function validateGameData(){
 const warnings=[];
 const traitNames=TRAITS.map(item=>item[0]);
 const duplicates=traitNames.filter((name,index)=>traitNames.indexOf(name)!==index);
 if(duplicates.length)warnings.push("重复特质："+[...new Set(duplicates)].join("、"));

 Object.entries(NPCS).forEach(([name,npc])=>{
   if(!npc||!npc.desc||!npc.tag)warnings.push(`NPC「${name}」缺少描述或标签。`);
 });

 const traitChoiceIds=[];
 TRAIT_CHOICE_SETS.forEach(set=>{
   if(!traitNames.includes(set.trait))warnings.push(`特质选项组「${set.id}」引用了不存在的特质「${set.trait}」。`);
   if(!TRAIT_CHOICE_RESOLVERS[set.resolver])warnings.push(`特质选项组「${set.id}」缺少效果处理器。`);
   [...(set.choices||[]),...(set.evolvedChoices||[])].forEach(choice=>{
     if(!choice.id||!choice.label)warnings.push(`特质选项组「${set.id}」存在缺少 id 或文字的选项。`);
     if(choice.id)traitChoiceIds.push(choice.id);
   });
 });
 const repeatedChoiceIds=traitChoiceIds.filter((id,index)=>traitChoiceIds.indexOf(id)!==index);
 if(repeatedChoiceIds.length)warnings.push("重复特质选项 ID："+[...new Set(repeatedChoiceIds)].join("、"));

 const eventGroups=[
   ...Object.values(FIXED),
   ...Object.values(SECOND_FIXED),
   ...Object.values(ROUTES),
   RANDOM_EVENTS
 ];
 const eventIds=[];
 eventGroups.flat().forEach((event,index)=>{
   if(!event||!event.title)warnings.push(`第 ${index+1} 个事件缺少标题。`);
   if(event&&event.id)eventIds.push(event.id);
   if(event&&!Array.isArray(event.choices)&&typeof event.getChoices!=="function")warnings.push(`事件「${event.title||index+1}」缺少 choices 或 getChoices。`);
 });
 const repeatedEventIds=eventIds.filter((id,index)=>eventIds.indexOf(id)!==index);
 if(repeatedEventIds.length)warnings.push("重复事件 ID："+[...new Set(repeatedEventIds)].join("、"));

 // v0.4 纵向样板：九、十月的每一个选项都应留下可追踪的选择标识和影响说明。
 [...FIXED[9],...FIXED[10]].forEach(event=>{
   const choices=typeof event.getChoices==="function"?event.getChoices():event.choices;
   (choices||[]).forEach((choice,index)=>{
     const meta=choice&&choice[3];
     if(!meta||!meta.id)warnings.push(`九十月事件「${event.title}」第 ${index+1} 个选项缺少持久化 id。`);
     if(!meta||!meta.impact)warnings.push(`九十月事件「${event.title}」第 ${index+1} 个选项缺少影响说明。`);
   });
 });

 if(warnings.length)console.warn("[女高模拟器：内容检查]",warnings);
 return warnings;
}

// 方便开发时在浏览器控制台检查当前状态，不参与正常游戏流程。
globalThis.GameDebug=Object.freeze({
 version:GAME_VERSION,
 getState:()=>JSON.parse(JSON.stringify(S)),
 validate:validateGameData,
 check:options=>resolveCheck(options)
});

validateGameData();
renderPool();
update();
