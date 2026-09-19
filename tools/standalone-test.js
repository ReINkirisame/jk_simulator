"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {runtime}=require("./test-runtime");
const root=path.resolve(__dirname,"..");
const standalone=path.resolve(process.argv[2]||path.join(root,"..","release","女高模拟器-v0.5.1.html"));

function finish(entry){
 const r=runtime({entry});
 r.launch({name:"单文件校验",stats:[8,8,8,8,8],family:"ordinary",seed:"standalone-051",chaos:true});
 const checkpoints=new Set([40,120,220]);
 let clicks=0;
 for(;clicks<380&&r.state().phase!=="graduated";clicks+=1){
  const buttons=r.buttons();
  const button=buttons.find(item=>item.classList.contains("trait-choice"))||buttons[0];
  assert(button,"standalone flow is stuck at "+r.elements.title.textContent);
  button.click();
  if(checkpoints.has(clicks)){
   const before=r.state(),save=r.json("savePayload()");
   r.run("restoreGame("+JSON.stringify(save)+")");
   assert.deepEqual(r.state(),before,"standalone save replay diverged");
  }
 }
 assert.equal(r.state().phase,"graduated","standalone did not reach graduation");
 assert.equal(r.errors.length,0,JSON.stringify(r.errors));
 return {clicks,state:r.state()};
}

const html=fs.readFileSync(standalone,"utf8");
assert(!/<script\b[^>]*\bsrc=/.test(html),"standalone still references external JavaScript");
assert(!/<link\b[^>]*\brel=["']stylesheet["']/.test(html),"standalone still references external CSS");
assert.equal([...html.matchAll(/<script\b/g)].length,22,"unexpected embedded script count");
const source=finish(path.join(root,"index.html"));
const bundled=finish(standalone);
assert.deepEqual(bundled.state,source.state,"source and standalone final state differ");
assert.equal(bundled.clicks,source.clicks,"source and standalone click counts differ");
console.log(`Standalone matches source: ${bundled.clicks} clicks, ${bundled.state.rumors.length} rumors, exam ${bundled.state.exam.graduation}.`);
