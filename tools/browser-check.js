"use strict";
// 可选真实浏览器检查：需要本机已经安装 playwright 和 Chromium。
const {chromium}=require("playwright");
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const base=process.argv[2]||"http://127.0.0.1:4173/";
const output=path.resolve(__dirname,"../../qa-v0.6.2");
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
  const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(base);await page.locator(".seed-settings summary").click();
  const recoveryTrait=await page.evaluate(()=>{for(let i=0;i<500;i++){setGameSeed("browser-062-"+i);renderPool();const names=S.pool.map(item=>item[0]),recovery=["吃货","佛系","运动少女","猫派","钝感力"].find(name=>names.includes(name));if(names.includes("癫佬")&&names.includes("电波")&&recovery)return recovery;}throw new Error("No source trait pool found");});
  assert.equal(await page.locator(".trait .trait-card-intro").count(),10);
  assert.equal(await page.locator(".trait .trait-card-effect").count(),10);
  assert.equal(await page.locator(".trait .trait-flavor").count(),10);
  await page.locator("#playerName").fill("林间");
  await page.locator(".trait").filter({hasText:"癫佬"}).click();
  await page.locator(".trait").filter({hasText:"电波"}).click();
  await page.locator(".trait").filter({hasText:recoveryTrait}).click();
  await page.screenshot({path:path.join(output,"setup-desktop.png"),fullPage:true});
  await page.getByRole("button",{name:"翻开第一页 · 开始高中生活",exact:true}).click();
  await page.locator("#game").waitFor({state:"visible"});
  await page.locator("#traitBenefitNotice").waitFor({state:"visible"});
  assert((await page.locator("#traitBenefitNotice").textContent()).includes(recoveryTrait));
  await page.screenshot({path:path.join(output,"game-desktop.png"),fullPage:true});
  let count=0,evolution=null,traitShot=false;
  for(;count<380;count++){
   if(await page.evaluate(()=>GameDebug.getState().phase==="graduated"))break;
   const title=await page.locator("#title").textContent();
   assert.notEqual(title,"她正在变成怎样的人");
   if(title==="没有人记得第一回合"){
    evolution=await page.evaluate(()=>({year:GameDebug.getState().year,month:GameDebug.getState().month,index:GameDebug.getState().calendarIndex}));
    await page.screenshot({path:path.join(output,"evolution.png"),fullPage:true});
   }
   const trait=page.locator("#choices button.trait-choice");
   if(!traitShot&&await trait.count()){
    await page.screenshot({path:path.join(output,"trait-replacement.png"),fullPage:true});traitShot=true;
   }
   if(count===42){
    const before=await page.evaluate(()=>JSON.stringify(GameDebug.getState()));
    const text=await page.locator("#text").textContent();
    const benefits=await page.locator("#traitBenefitNotice").textContent();
    await page.reload();await page.locator("#resumeSetup").click();
    assert.equal(await page.evaluate(()=>JSON.stringify(GameDebug.getState())),before);
    assert.equal(await page.locator("#text").textContent(),text);
    assert.equal(await page.locator("#traitBenefitNotice").textContent(),benefits);
   }
   // 前十步以真实点击检验交互，其余仍通过DOM按钮执行原始事件处理器。
   if(count<10){
    const button=await trait.count()?trait.first():page.locator("#choices button:not(:disabled)").first();
    await button.click();
   }else{
    await page.evaluate(()=>{
     const buttons=[...document.querySelectorAll("#choices button")].filter(b=>!b.disabled);
     const button=buttons.find(b=>b.classList.contains("trait-choice"))||buttons[0];
     if(!button)throw new Error("No active choice button");
     button.click();
    });
   }
  }
  assert(count<380,"did not graduate");if(evolution)assert(evolution.index>=16);assert.equal(errors.length,0,errors.join("\n"));
  await page.screenshot({path:path.join(output,"graduation.png"),fullPage:true});
  const state=await page.evaluate(()=>GameDebug.getState());
  assert(state.hiddenTraits.every(name=>name==="古明地恋"));
  assert.equal(state.flags.octoberPortraitShown,undefined);
  const [download]=await Promise.all([page.waitForEvent("download"),page.getByRole("button",{name:"导出存档",exact:true}).click()]);
  const exported=JSON.parse(fs.readFileSync(await download.path(),"utf8"));assert.equal(exported.version,"0.6.2");
  const [cardDownload]=await Promise.all([page.waitForEvent("download"),page.getByRole("button",{name:"下载毕业档案图片",exact:true}).click()]);
  assert(cardDownload.suggestedFilename().endsWith("-毕业档案.png"));
  assert(fs.statSync(await cardDownload.path()).size>10_000,"graduation card PNG is unexpectedly small");
  await page.getByRole("button",{name:"回看人物与记录",exact:true}).click();
  await page.getByRole("button",{name:"回到毕业画像",exact:true}).click();
  await page.reload();await page.locator("#resumeSetup").click();
  assert.deepEqual(await page.evaluate(()=>GameDebug.getState()),state);

  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1});
  const m=await mobile.newPage();m.on("pageerror",e=>errors.push(e.message));await m.goto(base);
  assert(await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),"mobile overflow");
  await m.screenshot({path:path.join(output,"setup-mobile.png"),fullPage:true});
  await m.locator("#playerName").fill("零学力测试");
  await m.getByRole("button",{name:"外貌型",exact:true}).click();
  for(let i=0;i<3;i++)await m.locator('.trait[aria-pressed="false"]').first().click();
  await m.getByRole("button",{name:"翻开第一页 · 开始高中生活",exact:true}).click();
  await m.locator("#choices button").first().click();
  assert(await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),"game mobile overflow");
  await m.screenshot({path:path.join(output,"game-mobile.png"),fullPage:true});
  assert.equal(errors.length,0,errors.join("\n"));
  console.log(JSON.stringify({clicks:count,evolution,graduationScore:state.exam.graduation,errors,screenshots:output}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
