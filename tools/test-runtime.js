"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
class ClassList{
 constructor(){this.values=new Set();}
 add(...v){v.forEach(x=>this.values.add(x));}
 remove(...v){v.forEach(x=>this.values.delete(x));}
 contains(v){return this.values.has(v);}
 toggle(v,force){const yes=force??!this.values.has(v);if(yes)this.values.add(v);else this.values.delete(v);return yes;}
}
class Element{
 constructor(tag="div",id=""){Object.assign(this,{tagName:tag.toUpperCase(),id,children:[],classList:new ClassList(),style:{},value:"",textContent:"",disabled:false,onclick:null,listeners:{},attributes:{},_html:"",scrollTop:0,scrollHeight:0});}
 set innerHTML(v){this._html=String(v);this.children=[];}
 get innerHTML(){return this._html;}
 appendChild(child){this.children.push(child);return child;}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 querySelectorAll(selector){return selector==="button"?this.children.filter(c=>c.tagName==="BUTTON"):[];}
 setAttribute(key,value){this.attributes[key]=value;}
 click(){if(!this.disabled&&this.onclick)this.onclick();}
 remove(){}
}
function runtime({entry=path.join(root,"index.html")}={}){
 const html=fs.readFileSync(entry,"utf8");
 const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].map((m,index)=>{
  const src=m[1].match(/\bsrc="([^"]+)"/)?.[1];
  return src?[src,fs.readFileSync(path.resolve(path.dirname(entry),src),"utf8")]:["inline-"+index,m[2]];
 });
 const elements={},storage=new Map(),errors=[],alerts=[],warnings=[];
 for(const m of html.matchAll(/<([a-z]+)[^>]*\bid="([^"]+)"[^>]*>/g)){
  const el=new Element(m[1],m[2]);el.value=m[0].match(/\bvalue="([^"]*)"/)?.[1]||"";
  if(/\bdisabled\b/.test(m[0]))el.disabled=true;
  elements[m[2]]=el;
 }
 elements.family.value="ordinary";
 const document={body:new Element("body"),getElementById:id=>{if(!elements[id])throw new Error("Missing DOM id: "+id);return elements[id];},createElement:tag=>new Element(tag),querySelector:()=>new Element()};
 const context=vm.createContext({document,localStorage:{setItem:(k,v)=>storage.set(k,String(v)),getItem:k=>storage.get(k)||null,removeItem:k=>storage.delete(k)},
  location:{reload(){}},alert:message=>alerts.push(message),console:{log(){},warn:(...v)=>warnings.push(v),error:(...v)=>errors.push(v)},setTimeout,clearTimeout,Blob,URL,Math,Number,String,Array,Object,parseInt,Set,Map,Date,JSON});
 const run=code=>vm.runInContext(code,context);
 for(const [filename,source] of scripts)vm.runInContext(source,context,{filename});
 const json=code=>JSON.parse(JSON.stringify(run(code)));
 function launch({seed="regression",stats=[8,8,8,8,8],family="ordinary",chaos=false,name="测试角色"}={}){
  elements.playerName.value=name;elements.family.value=family;elements.birthdayMonth.value="4";elements.birthdayDay.value="15";
  run("setGameSeed("+JSON.stringify(seed)+");renderPool();setAllocation("+JSON.stringify(stats)+");");
  run(chaos?'S.traits=[S.pool.findIndex(t=>t[0]==="癫佬"),...S.pool.map((_,i)=>i).filter(i=>S.pool[i][0]!=="癫佬").slice(0,2)];':'S.traits=S.pool.map((t,i)=>({t,i})).filter(x=>x.t[0]!=="癫佬").slice(0,3).map(x=>x.i);');
  run("startGame();");
 }
 function buttons(){return elements.choices.children.filter(b=>b.tagName==="BUTTON"&&!b.disabled&&typeof b.onclick==="function");}
 function click(index=0){const list=buttons();if(!list.length)throw new Error("No button: "+elements.title.textContent);list[index%list.length].click();}
 return {elements,errors,alerts,warnings,storage,context,run,json,launch,buttons,click,state:()=>json("S")};
}
module.exports={runtime};
