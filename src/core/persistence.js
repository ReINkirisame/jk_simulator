"use strict";

const SAVE_SCHEMA=1,SAVE_KEY="fuzhong-girl-v061";
let Session={initial:null,actions:[],replaying:false,screenActions:new Map()};
function resetScreenActions(){Session.screenActions=new Map();}
function bindAction(button,key,run){
 const id=`${S.calendarIndex}:${key}`;
 const activate=()=>{
  if(button.disabled)return;
  Session.actions.push(id);
  try{run();if(!Session.replaying)saveLocalGame(true);}
  catch(error){
   if(Session.replaying)throw error;
   console.error("游戏事件失败：",error);
   S.debug=true;
   $("globalMessage").textContent="这一段运行失败，正常存档未被覆盖。请读档恢复，并记录当前事件标题和种子。";
  }
 };
 button.onclick=activate;
 if(!button.disabled)Session.screenActions.set(id,activate);
}
function beginSession(initial){
 const replaying=Session.replaying;
 Session={initial:JSON.parse(JSON.stringify(initial)),actions:[],replaying,screenActions:new Map()};
}
function savePayload(){
 if(!Session.initial||S.debug)throw new Error("尚未开局，或当前为调试局；不能覆盖正常存档。");
 return {schema:SAVE_SCHEMA,version:GAME_VERSION,initial:Session.initial,actions:[...Session.actions],
  signature:stateSignature(),summary:{name:S.name,term:S.term,month:S.month,seed:S.rng.seed}};
}
function stateSignature(){return seedNumber(JSON.stringify(S)).toString(16);}
function saveLocalGame(automatic=false){
 if(Session.replaying||!Session.initial)return false;
 if(S.debug){$("saveStatus").textContent="调试局 · 未覆盖正常存档";return false;}
 try{
  localStorage.setItem(SAVE_KEY,JSON.stringify(savePayload()));
  $("saveStatus").textContent=automatic?"已自动保存":"当前页面已保存";
  $("resumeSetup").disabled=false;
  return true;
 }catch(error){
  $("saveStatus").textContent="浏览器未允许本地保存，请导出存档";
  if(!automatic)$("globalMessage").textContent="无法写入浏览器存档；请用“导出存档”保存到文件。";
  return false;
 }
}
function validateSave(data){
 if(!data||data.schema!==SAVE_SCHEMA||data.version!==GAME_VERSION)throw new Error("存档版本不兼容。0.6.1新增特质作用与后天形成，需要本版本存档；旧存档请用对应旧版打开。");
 const c=data.initial;
 if(!c||typeof c.name!=="string"||!c.name.trim()||c.name.length>12)throw new Error("存档中的名字无效。");
 if(!c.stats||Object.keys(c.stats).length!==5||Object.keys(ATTRIBUTES).some(key=>!Object.hasOwn(c.stats,key))||allocationError(c.stats))throw new Error("存档中的初始属性无效。");
 if(!Object.hasOwn(FAMILY_BACKGROUNDS,c.family))throw new Error("存档中的家庭背景无效。");
 if(!Array.isArray(c.pool)||c.pool.length!==10||new Set(c.pool).size!==10||c.pool.some(name=>!TRAITS.some(t=>t[0]===name)))throw new Error("存档中的特质池无效。");
 if(!Array.isArray(c.traits)||c.traits.length!==3||new Set(c.traits).size!==3||c.traits.some(index=>!Number.isInteger(index)||index<0||index>9))throw new Error("存档中的特质选择无效。");
 if(!Number.isInteger(c.birthdayMonth)||c.birthdayMonth<1||c.birthdayMonth>12||!Number.isInteger(c.birthdayDay)||c.birthdayDay<1||c.birthdayDay>birthdayLimit(c.birthdayMonth))throw new Error("存档中的生日无效。");
 if(!c.rng||typeof c.rng.seed!=="string"||c.rng.seed.length>40||!Number.isInteger(c.rng.state)||c.rng.state<0||c.rng.state>4294967295)throw new Error("存档中的随机状态无效。");
 if(!Array.isArray(data.actions)||data.actions.length>1600||data.actions.some(id=>typeof id!=="string"||id.length>400))throw new Error("存档中的操作记录无效。");
 if(typeof data.signature!=="string")throw new Error("存档缺少校验信息。");
 return true;
}
// 原型仍包含函数式事件。用确定性操作重放恢复闭包与当前结果页，不序列化函数。
// 只匹配已注册的按钮ID；不执行存档中的代码或任意函数名。
function replaySave(data){
 validateSave(data);
 Session.replaying=true;
 try{
  launchGame(data.initial);
  for(const id of data.actions){
   const action=Session.screenActions.get(id);
   if(!action)throw new Error("存档与事件流程不一致，未找到下一步。请保留原文件，不要覆盖。");
   action();
  }
  if(stateSignature()!==data.signature)throw new Error("存档校验未通过，内容可能损坏或来自不同构建。");
 }finally{Session.replaying=false;}
 update();
 return true;
}
function restoreGame(data){
 validateSave(data);
 const previous=Session.initial&&!S.debug?savePayload():null;
 const oldState=JSON.parse(JSON.stringify(S));
 const oldSession=Session;
 try{replaySave(data);$("globalMessage").textContent="";$("saveStatus").textContent="已恢复到存档页面";}
 catch(error){
  if(previous){replaySave(previous);}
  else {S=oldState;Session=oldSession;$("setup").classList.remove("hidden");$("game").classList.add("hidden");$("result").classList.add("hidden");update();}
  throw error;
 }
 return true;
}
function loadLocalGame(){
 try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)throw new Error("还没有本版本存档。也可以从文件导入。");restoreGame(JSON.parse(raw));}
 catch(error){$("globalMessage").textContent=error.message||"无法读取存档。";}
}
function exportGame(){
 try{
  const text=JSON.stringify(savePayload(),null,2);
  const url=URL.createObjectURL(new Blob([text],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download=`女高模拟器-${GAME_VERSION}-${S.name.replace(/[\\/:*?"<>|]/g,"_")}-${S.term}${S.month}月.json`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }catch(error){$("globalMessage").textContent=error.message;}
}
async function importGameFile(input){
 const file=input.files&&input.files[0];if(!file)return;
 try{if(file.size>2_000_000)throw new Error("存档文件过大，请选择本游戏导出的JSON文件。");restoreGame(JSON.parse(await file.text()));saveLocalGame();}
 catch(error){$("globalMessage").textContent=error.message||"存档文件无法读取。";}
 finally{input.value="";}
}
