"use strict";

const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const projectRoot=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(projectRoot,"index.html"),"utf8");
const scriptPaths=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(match=>match[1]);
const alternateMode=process.argv.includes("--alternate");
const traitMode=process.argv.includes("--trait");

class ClassList{
 constructor(){this.values=new Set()}
 add(...values){values.forEach(value=>this.values.add(value))}
 remove(...values){values.forEach(value=>this.values.delete(value))}
 contains(value){return this.values.has(value)}
}

class Element{
 constructor(tag="div",id=""){
   this.tagName=tag.toUpperCase();
   this.id=id;
   this.children=[];
   this.classList=new ClassList();
   this.style={};
   this.value="";
   this.textContent="";
   this.disabled=false;
   this.onclick=null;
   this.listeners={};
   this._html="";
   this.scrollTop=0;
   this.scrollHeight=0;
 }
 set innerHTML(value){this._html=String(value);this.children=[];this.scrollHeight=this._html.length}
 get innerHTML(){return this._html}
 appendChild(child){this.children.push(child);this.scrollHeight+=1;return child}
 addEventListener(type,listener){(this.listeners[type]??=[]).push(listener)}
 querySelectorAll(selector){return selector==="button"?this.children.filter(child=>child.tagName==="BUTTON"):[]}
}

const elements={};
for(const match of html.matchAll(/\bid="([^"]+)"/g))elements[match[1]]=new Element("div",match[1]);
for(const id of ["playerName","iCharm","iIntel","iHealth","iMoney","birthdayMonth","birthdayDay"]){
 elements[id].tagName="INPUT";
}

elements.playerName.value="测试角色";
if(alternateMode){
 elements.iCharm.value="5";
 elements.iIntel.value="25";
 elements.iHealth.value="5";
 elements.iMoney.value="5";
}else{
 for(const id of ["iCharm","iIntel","iHealth","iMoney"])elements[id].value="10";
}
elements.birthdayMonth.value="4";
elements.birthdayDay.value="15";

const runtimeErrors=[];
const alerts=[];
const document={
 getElementById:id=>elements[id]??(elements[id]=new Element("div",id)),
 createElement:tag=>new Element(tag),
 querySelector:()=>new Element()
};

const context=vm.createContext({
 document,
 location:{reload(){}},
 alert:message=>alerts.push(String(message)),
 console:{
   log(){},
   warn(){},
   error:(...parts)=>runtimeErrors.push(parts.map(String).join(" "))
 },
 Math,Number,String,Array,Object,parseInt,Set,Map,Date,JSON
});

for(const relativePath of scriptPaths){
 const absolutePath=path.resolve(projectRoot,relativePath);
 if(!fs.existsSync(absolutePath))throw new Error(`index.html 引用了不存在的脚本：${relativePath}`);
 const source=fs.readFileSync(absolutePath,"utf8");
 vm.runInContext(source,context,{filename:relativePath});
}

const validationWarnings=vm.runInContext("GameDebug.validate()",context);
if(validationWarnings.length)throw new Error("内容检查未通过：\n"+validationWarnings.join("\n"));

// 回归测试：效果函数没有返回文字时，必须显示选项自带的默认结果。
vm.runInContext('showChoices("测试","默认结果测试","选择前",[["选择","默认结果",()=>{}]],()=>{})',context);
elements.choices.children[0].onclick();
if(elements.text.textContent!=="默认结果")throw new Error("选项的默认结果文字没有显示。");

// 机制测试：强制连续使用四次“癫佬”选项，应解锁“古明地恋”，
// 下一次注入应切换成隐藏特质选项，并仍然只追加一个选项。
const traitMechanism=vm.runInContext(`(()=>{
 S.pool=[["癫佬","测试"]];S.traits=[0];S.hiddenTraits=[];S.traitProgress={};
 S.traitChoiceState={misses:0,lastEventId:null,recentChoiceIds:[]};
 S.npcRelation={"中二病":1};
 const labels=[];
 for(let i=0;i<4;i+=1){
   const choices=injectTraitChoices([["普通选项","普通结果",()=>{}]],{
     allowTraitChoices:true,tags:["npc","social"],npc:"中二病",eventId:"trait-test-"+i,forceTraitChoice:true
   });
   if(choices.length!==2)throw new Error("专属选项没有按预期注入。");
   labels.push(choices[1][0]);choices[1][2]();
 }
 const evolved=injectTraitChoices([["普通选项","普通结果",()=>{}]],{
   allowTraitChoices:true,tags:["npc","social"],npc:"中二病",eventId:"trait-test-evolved",forceTraitChoice:true
 });
 return {
   labels,
   xp:S.traitProgress["癫佬"],
   unlocked:S.hiddenTraits.includes("古明地恋"),
   evolvedLabel:evolved[1]&&evolved[1][0],
   added:evolved.length
 };
})()`,context);
if(traitMechanism.xp!==4||!traitMechanism.unlocked)throw new Error("癫佬成长没有解锁古明地恋。");
if(traitMechanism.added!==2||!traitMechanism.evolvedLabel.startsWith("【古明地恋】")){
 throw new Error("解锁后没有切换为古明地恋专属选项。");
}

// 机制测试改动了开局状态，重新生成正常特质池再跑完整流程。
vm.runInContext("renderPool()",context);

if(traitMode){
 vm.runInContext(`(()=>{
   const featured=S.pool.findIndex(trait=>trait[0]==="癫佬");
   if(featured<0)throw new Error("开局候选池里没有癫佬。");
   S.traits=[featured,...S.pool.map((_,index)=>index).filter(index=>index!==featured).slice(0,2)];
   startGame();
 })()`,context);
}else{
 vm.runInContext("S.traits=[0,1,2]; startGame()",context);
}

let clicks=0;
for(;clicks<350;clicks+=1){
 const phase=vm.runInContext("S.phase",context);
 if(phase==="summer")break;

 const buttons=elements.choices.children.filter(element=>
   element.tagName==="BUTTON"&&!element.disabled&&typeof element.onclick==="function"
 );
 if(!buttons.length){
   throw new Error(`流程在第 ${clicks} 次点击后卡住：${elements.tag.textContent} / ${elements.title.textContent}`);
 }
 const traitButton=traitMode?buttons.find(button=>button.classList.contains("trait-choice")):null;
 const selected=traitButton||(alternateMode?buttons[clicks%buttons.length]:buttons[0]);
 selected.onclick();
}

const finalState=vm.runInContext("({phase:S.phase,term:S.term,month:S.month,exam:S.exam,npcs:S.npcs.length,hiddenTraits:[...S.hiddenTraits]})",context);
if(finalState.phase!=="summer")throw new Error("350 次点击内没有抵达高一暑假。");
if(traitMode&&!finalState.hiddenTraits.includes("古明地恋"))throw new Error("完整流程中选择所有专属选项后仍未解锁古明地恋。");
if(runtimeErrors.length)throw new Error("运行时错误：\n"+runtimeErrors.join("\n"));
if(alerts.length)throw new Error("测试流程触发了提示：\n"+alerts.join("\n"));

const mode=traitMode?"trait choices":alternateMode?"alternate":"first";
console.log(`Smoke test passed (${mode}): ${clicks} clicks, ${finalState.npcs} NPCs, reached ${finalState.term} ${finalState.month}月。`);
