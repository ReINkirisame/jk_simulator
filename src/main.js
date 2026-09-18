"use strict";

const GAME_VERSION="0.2.0";

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

 const eventGroups=[
   ...Object.values(FIXED),
   ...Object.values(SECOND_FIXED),
   ...Object.values(ROUTES),
   RANDOM_EVENTS
 ];
 eventGroups.flat().forEach((event,index)=>{
   if(!event||!event.title)warnings.push(`第 ${index+1} 个事件缺少标题。`);
   if(event&&!Array.isArray(event.choices))warnings.push(`事件「${event.title||index+1}」缺少 choices 数组。`);
 });

 if(warnings.length)console.warn("[女高模拟器：内容检查]",warnings);
 return warnings;
}

// 方便开发时在浏览器控制台检查当前状态，不参与正常游戏流程。
globalThis.GameDebug=Object.freeze({
 version:GAME_VERSION,
 getState:()=>JSON.parse(JSON.stringify(S)),
 validate:validateGameData
});

validateGameData();
renderPool();
update();
