"use strict";
const traitPool=[
["二次元","四斋蒸鹅心"],["Kpop","五女一是（）（）（）！"],["社恐","社交好可怕，还是一个人待着比较好"],["开朗","喜多~郁代~"],["现充","大家一起搞好关系吧！"],["阴暗b","现充都爆炸吧..."],["文艺b","我想死也想去巴黎"],["吉他手","吉他英雄来也！"],["地下偶像","果然xx酱最可爱了"],["认真","对学习和自己答应的事情比较上心"],["文学少女","今天的风儿有些喧嚣呢"],["傲娇","才、才不是这种性格呢！"],["大小姐","desuwa~"],["运动少女","喜欢运动，体育活动更容易进入生活"],["卷王","东亚小妹能量巨大！"],["社交悍匪","全体目光向我看齐！我宣布个事"],["佛系","随便啦都可以啦"],["熬夜人","你跑不过我你信吗"],["完美主义","希望事情做到最好，也容易给自己压力"],["吃货","小笼包叉烧包奶黄芝麻豆沙包"],["摄影爱好者","咔嚓——"],["手账少女","喜欢整理、规划和记录生活"],["追星族","很容易通过共同偶像认识朋友"],["猫派","看到猫会忍不住停下来"],["社团狂魔","很喜欢参加学校里的各种活动"],["天生卷王","提高一分干掉千人"],["慢热","刚认识别人比较冷淡，熟悉后关系稳定"],["话痨","哎我跟你说"],["低调","不喜欢成为全班焦点"],["好胜心","很在意竞争和输赢"],["玉玉","流泪猫猫头"],["日麻","断幺！1000！"],["交际花","认识不同圈子的人很自然，班里到处都有熟人"],["三无","只要微笑就好了"],["天赋","有些事情上手特别快，别人练很久你却能迅速抓到感觉"],["舞萌","要开始了哦"],["冒失","呜哇又平地摔了"],["直率","直球！"],["刺头","凭什么啊！"],["中二病","邪王真眼是最强的"],["校园偶像","哦呼~"],
["管人痴","攒钱给最喜欢的主播上舰"],["电波","在天台向创世神大人通话"],["键政","鉴证英雄"],["神人","你牛大了"],["中庸之道","第三名才是最好的"],["动画区up主","我给了其他动画区up主六年的时间"],["小博主","用镜头记录生活"],["小网红","欢迎收看高中生小博主的一天"],["白切黑","我是她朋友~"],["钝感力","不太容易被小事影响"],["冰山","看起来很冷淡，不容易主动亲近别人"],["外冷内热","嘴上不说，实际上很会照顾人"],["coser","2.5次元的诱惑"],["电竞选手","我觉得我是"],["漫画家","岸边露伴一动不动"],["Vtuber","用虚拟连接世界"],["欧皇","偶尔会遇到非常离谱的好运"],["非酋","玄不救非氪不改命"]
];
const NPCS={
"大小姐":{desc:"性格傲娇，嘴上嫌弃，实际上却很会照顾人。据传家里有一个以姓氏命名的超大财团。",tag:"傲娇 / 家境好 / 天真烂漫"},
"班长":{desc:"成绩很好，行事认真又平易近人，是大家眼里的完美女孩子。似乎很少谈自己的事。",tag:"认真 / 成绩好 / 温柔"},
"主人公":{desc:"阳光开朗，什么活动都会第一个报名，超级高精力。",tag:"元气 / 活跃 / 阳角"},
"转校生":{desc:"平时基本不和人交流，放学也常常一个人走，别人很难判断她在想什么。",tag:"孤高 / 神秘 / 三无"},
"中二病":{desc:"双马尾，一个人说些听不懂的话，但意外是个非常直率的好孩子。",tag:"中二 / 双马尾 / 直率"},
"学姐":{desc:"和你同初中的学姐，在学校里过得风生水起，是很多人仰望的偶像。",tag:"前辈 / 知名度高 / 校园偶像"},
"同人女":{desc:"经常拿着本子写写画画，在某个平台上似乎是非常知名的画手，聊到家产会突然变得滔滔不绝。",tag:"同人 / 画手"},
"体育生":{desc:"个子很高，似乎总有用不完的精力，总能看到她在操场训练。",tag:"体育生 / 高能量"}
};
let S={name:"",month:9,traits:[],pool:[],stats:{charm:10,intel:10,health:10,money:10},interests:[],npcs:[],npcRelation:{},npcOrder:[],npcIndex:0,used:[],randomDone:false,fixedDone:false,club:null,flags:{},history:[],birthdayMonth:1,birthdayDay:1,schoolTerm:"高一上"};
function shuffle(a){return [...a].sort(()=>Math.random()-0.5)}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function val(id){let n=parseInt(document.getElementById(id).value,10);return Math.max(0,Math.min(40,Number.isFinite(n)?n:0))}
function checkPoints(){let t=val("iCharm")+val("iIntel")+val("iHealth")+val("iMoney");document.getElementById("remain").textContent=40-t;return t===40}
["iCharm","iIntel","iHealth","iMoney"].forEach(id=>document.getElementById(id).addEventListener("input",checkPoints));
function hasTrait(x){return S.traits.some(i=>S.pool[i][0]===x)}
function hasTag(x){return hasTrait(x)||S.interests.includes(x)}
function log(t){let b=document.getElementById("log");b.innerHTML+=`<p>· ${esc(t)}</p>`;b.scrollTop=b.scrollHeight}
function addInterest(x){if(!S.interests.includes(x)){S.interests.push(x);log("获得兴趣标签：【"+x+"】")}}
function update(){["charm","intel","health","money"].forEach(k=>document.getElementById(k).textContent=S.stats[k]);document.getElementById("monthLabel").textContent="高一 · "+S.month+"月";document.getElementById("buffs").innerHTML=[...S.traits.map(i=>S.pool[i][0]),...S.interests].map(x=>`<span class="buff">${esc(x)}</span>`).join("");document.getElementById("npcList").innerHTML=S.npcs.length?S.npcs.map(n=>{let d=NPCS[n],r=S.npcRelation[n]||0;return `<div class="npc"><b>${esc(n)}</b><span>${esc(d.tag)}<br>${esc(d.desc)}<br>关系：${r<2?"刚认识":r<4?"熟悉起来了":"关系不错"}</span></div>`}).join(""):"<div class='notice'>暂时还没有特别认识的人。</div>"}
function renderPool(){S.pool=shuffle(traitPool).slice(0,10);document.getElementById("traitPool").innerHTML=S.pool.map((t,i)=>`<div class="trait" data-i="${i}" onclick="toggleTrait(${i})"><b>${esc(t[0])}</b><span>${esc(t[1])}</span></div>`).join("")}
function toggleTrait(i){let e=document.querySelector(`[data-i="${i}"]`);if(S.traits.includes(i)){S.traits=S.traits.filter(x=>x!==i);e.classList.remove("selected")}else if(S.traits.length<3){S.traits.push(i);e.classList.add("selected")}}
function startGame(){let n=document.getElementById("playerName").value.trim();if(!n)return alert("先给她起个名字吧。");if(S.traits.length!==3)return alert("请从10个特质中选择3个。");if(!checkPoints())return alert("四项属性的总点数必须正好是40。");S.name=n;S.stats={charm:val("iCharm"),intel:val("iIntel"),health:val("iHealth"),money:val("iMoney")};S.birthdayMonth=Math.max(1,Math.min(12,parseInt(document.getElementById("birthdayMonth").value,10)||1));S.birthdayDay=Math.max(1,Math.min(31,parseInt(document.getElementById("birthdayDay").value,10)||1));document.getElementById("setup").classList.add("hidden");document.getElementById("game").classList.remove("hidden");document.getElementById("playerNameLabel").textContent=n;document.getElementById("log").innerHTML="";S.npcOrder=shuffle(Object.keys(NPCS));log("你开始了高一上学期的生活。");log("初始特质："+S.traits.map(i=>S.pool[i][0]).join("、"));startMonth()}
function startMonth(){S.randomDone=false;S.fixedDone=false;S.flags.clubOpen=false;document.getElementById("sectionTitle").textContent="本月事件";showRandom(0);update()}
function safeNext(fn){return ()=>{try{fn()}catch(e){console.error(e);log("刚才发生了一点小意外，但生活没有停下来。继续往下走。 ");setTimeout(()=>recover(),0)}}}
function recover(){if(!S.randomDone){showRandom(S.flags.randomSlot||0);return}if(!S.fixedDone){showFixed();return}nextMonth()}
function showChoices(tag,title,text,choices,nextFn){
 const tagEl=document.getElementById("tag"),titleEl=document.getElementById("title"),textEl=document.getElementById("text"),box=document.getElementById("choices");tagEl.textContent=tag;titleEl.textContent=title;textEl.textContent=text;box.innerHTML="";
 choices.forEach((ch)=>{let b=document.createElement("button");b.textContent=ch[0];b.onclick=()=>{if(b.disabled)return;[...box.querySelectorAll("button")].forEach(x=>x.disabled=true);box.innerHTML="";textEl.textContent=ch[1]||"";let fn=ch[2],result;try{if(fn)result=fn()}catch(e){console.error(e);log("这一段出了小故障，已经自动跳过。 ")}
   if(typeof result==="string" && result!=="HANDLED") textEl.textContent=result;
   if(result==="HANDLED")return;
   let n=document.createElement("button");n.className="primary";n.textContent="继续";n.onclick=()=>{n.disabled=true;box.innerHTML="";try{if(nextFn)nextFn();else recover()}catch(e){console.error(e);recover()}};box.appendChild(n);
 };box.appendChild(b)});update()}
function showRandom(slot){S.flags.randomSlot=slot;if(slot===0){let title=["第一次去卢浮宫时，没有什么特别的感觉","食堂最后一排的位置","放学铃响以后","你记住了她的名字"][S.month-9]||"认识一个新同学";let name=S.npcOrder[S.npcIndex++]||shuffle(Object.keys(NPCS))[0];while(S.npcs.includes(name)){name=shuffle(Object.keys(NPCS).filter(x=>!S.npcs.includes(x)))[0]||"班长"}let text=`你在很普通的一天里注意到了${name}。${NPCS[name].desc}\n\n`;let choices=[["主动聊两句","你从眼前的小事开始聊。",()=>{}],["顺着话题聊","你没有刻意热情，只是自然地接住了对方的话。",()=>{}]];showChoices("随机事件 · 认识同学",title,text,choices,()=>finishNPCMeet(name));return}let e=getRandomEvent();if(!e){S.randomDone=true;showFixed();return}S.used.push(e.key);S.history.push(e.title);showChoices("随机事件 · 第2次",e.title,e.text,e.choices,()=>{S.randomDone=true;showFixed();return true})}
function finishNPCMeet(name){if(!S.npcs.includes(name)){S.npcs.push(name);S.npcRelation[name]=1}log("认识了【"+name+"】。");showNPCFollowup(name);return true}
function showNPCFollowup(name){let lines={
"大小姐":["她看你一眼：“...我只是觉得一个人吃饭很无聊。”","你发现她虽然有点高高在上，但其实很期待和别人交流。"],
"班长":[`她很自然地叫出“${S.name}”：“你今天听懂数学老师讲的了吗？”`,`她说话很有耐心，聊完还提醒你明天要交的作业。`],
"主人公":["她远远就招手：“过几天要不要一起去看看社团呀！”","你还没来得及拒绝，她已经开始给你介绍学校里有什么活动。"],
"转校生":["她先只说：“嗯。”你以为聊天结束了，她却过了一会儿问：“你叫什么名字？”","你告诉她名字后，她轻轻点头：“……记住了。”这一次她没有立刻离开。"],
"中二病":["她认真地说：“今日结界的稳定度下降了。”","她忽然很直白地问：“所以你觉得我很奇怪吗？”你发现她其实很好沟通。"],
"学姐":["她很快认出你：“我们初中是不是见过？没想到你也来这里了。”","她在学校里确实很受欢迎，但和你说话时没有什么架子。"],
"同人女":["她赶紧把本子合上：“刚才那个你没看到吧？”","确认你没有偷看后，她反而主动问你：“你平时看漫画吗？”"],
"体育生":["她刚训练完，额头还在冒汗：“你也在这边？要不要一起走？”","你发现她一路还能聊个不停，完全不像刚跑完几圈。"]};let l=lines[name]||["她和你简单聊了几句。","你发现对方比第一次见面时自然了一点。"];showChoices("人物互动",name,l[0]+"\n\n"+l[1],[["继续聊","你们又聊了一会儿，关系比刚认识时更自然了。",()=>{S.npcRelation[name]=(S.npcRelation[name]||1)+1}],["先告别","你没有强行延长聊天，但以后见面应该会打招呼。",()=>{}]],()=>{S.flags.randomSlot=1;showRandom(1)})}
function randomKnownNPC(){if(!S.npcs.length)return null;return S.npcs[Math.floor(Math.random()*S.npcs.length)]}
function companion(name,style){if(!name)return"";S.npcRelation[name]=(S.npcRelation[name]||1)+1;let d={"班长":"班长顺手帮你确认了作业安排，聊着聊着又说到班里的小事。","主人公":"主人公直接招手：“走啊，一起去。”","大小姐":"大小姐嘴上嫌弃人多，最后还是跟你一起走了一段。","转校生":"转校生没说很多话，但安静地和你并排走了一会儿。","中二病":"中二病一路讲“结界”，讲到最后却认真问你晚饭吃什么。","学姐":"学姐在人群里认出你，顺便问你最近在学校过得怎么样。","同人女":"同人女把本子合上，跟你聊了几句最近画画和班里的趣事。","体育生":"体育生刚训练完，还是精神十足地跟你一路聊天。"};return d[name]||`${name}也刚好在附近，你们一起走了一段。`}
const baseEvents=[
{key:"louvre",title:"发现了新的区域哦",text:"放学后你绕了一条平时不走的路，发现学校后门附近还有一家小店和一条安静的小巷。",choices:[["自己逛一圈","你慢慢把附近的路记了下来。",()=>log("你开始熟悉学校周边。")],["叫认识的人一起","你想到一个已经认识的同学，临时约她一起走走。",()=>log(companion(randomKnownNPC(),"探索"))]]},
{key:"future",title:"对你来说是剧毒呢",text:"晚自习前，你刷到一句很刺眼的话，突然开始想：如果三年以后回头看，现在的自己会不会后悔？",choices:[["把担心的事写下来","你把脑子里乱七八糟的想法记下来，至少它们不再混成一团。",()=>log("你把对未来的焦虑变成了一页很具体的文字。")],["找人聊聊","你把这个问题丢给熟悉的同学，发现对方也有类似的担心。",()=>log(companion(randomKnownNPC(),"社交"))]]},
{key:"openworld",title:"开放世界冒险游戏",text:"周末你在学校附近绕了一圈，意外发现了一家以前没注意过的小店。回去以后，你又顺着兴趣查了不少相关东西，才发现自己可能刚刚碰到了一个新的爱好。",choices:[["沿着这个兴趣继续查","你一路查到很晚，终于找到几个真正想继续了解的方向。",()=>{addInterest("探索");log("你发现自己对一个新的领域产生了兴趣。")}],["叫朋友一起去看看","有人陪你一起走，原本陌生的地方一下变得有意思起来。",()=>{addInterest("探索");log(companion(randomKnownNPC(),"探索"))}]]},
{key:"tutoring",title:"不可不品鉴的一环",text:"家长提到附近有个补习班，最近不少同学都在考虑。",choices:[["先去试一节","家境不错时，你不太需要担心一次试课的成本；家境普通或较低时，你会认真比较值不值。",()=>{if(S.stats.money>=25)log("试课的费用对你家来说不算压力，你更关注老师到底适不适合自己。");else log("你很在意这笔钱到底值不值得花，所以听得格外认真。")}],["先不报，自己试试","你决定先靠自己的节奏摸索一阵。",()=>log(S.stats.money<15?"你也不想让家里多一笔固定支出。":"你想先看看自己能不能把学习节奏建立起来。")]]},
{key:"home168",title:"丰川家的黑暗！？",text:"你突然得知：父亲的生意一口气亏了168亿。这个数字大到你第一反应甚至不知道该怎么理解，家里的经济状况也随之发生剧烈变化。",choices:[["先听家里怎么安排","你第一次认真意识到，家庭的事情会真正改变高中生活。",()=>{S.stats.money=1;log("重大事件：家境骤降至1。") }],["装作和平时一样","你还是去上学，但开始明显留意家里的变化。",()=>{S.stats.money=1;log("重大事件：家境骤降至1。") }]]}
];
function getRandomEvent(){let all=[...baseEvents];if(hasTrait("大小姐"))all.push(baseEvents.find(e=>e.key==="home168"));let tags=S.traits.map(i=>S.pool[i][0]);let candidates=[];for(let t of tags){if(!S.used.includes("tag:"+t))candidates.push(makeTagEvent(t))}let usable=all.filter(e=>!S.used.includes(e.key));if(candidates.length&&Math.random()<.7)return candidates[Math.floor(Math.random()*candidates.length)];return usable[Math.floor(Math.random()*usable.length)]||candidates[0]||null}
function makeTagEvent(t){return {key:"tag:"+t,title:tagTitles[t]||("“"+t+"”的一天"),text:(tagTexts[t]||tagOutcomes[t]||"你在放学后的校园里遇到了一件具体的小事。")+"\n\n"+(tagScenes[t]||""),choices:[[tagChoiceA[t],tagResultA(t),()=>tagEffect(t)],[tagChoiceB[t],tagResultB(t),()=>tagEffect(t)]]}}
const tagTitles={"管人痴":"又到了给主播上舰的时候","电波":"天台上的通话","键政":"我是来午休的你们要干什么","神人":"你牛大了","中庸之道":"第三名的位置","动画区up主":"给同行一点时间","小博主":"把今天拍下来","小网红":"欢迎收看高中生的一天","白切黑":"“我是她朋友~”","钝感力":"这点小事算了","冰山":"同学眼里的你","外冷内热":"嘴上说随便","coser":"社团里的服装问题","电竞选手":"放学后的一局","漫画家":"本子上的草稿","Vtuber":"麦克风前的声音","欧皇":"抽签","非酋":"又是你抽到最差的那个","玉玉":"今天也不太想说话","日麻":"断幺！1000！","交际花":"这个人你也认识？","三无":"“你开心吗？”","天赋":"第一次上手","舞萌":"放学路上的机厅","冒失":"作业本呢？","直率":"“你觉得呢？”","刺头":"这也太不合理了吧","中二病":"封印即将解除","校园偶像":"拍张班级合照","社恐":"午休一个人的位置","开朗":"谁都能聊两句","现充":"下课后的临时聚会","阴暗b":"看着热闹的人群","文艺b":"旧书店的一页","吉他手":"音乐教室缺一个人","地下偶像":"有人在讨论线下live","认真":"老师交代的小事","文学少女":"校刊缺一篇稿子","傲娇":"明明很在意","大小姐":"放学后的消费","运动少女":"操场上的空位","卷王":"成绩单传过来","社交悍匪":"全体目光向我看齐","佛系":"随便啦都可以啦","熬夜人":"凌晨一点的消息","完美主义":"这道题一定要弄明白","吃货":"食堂新品","摄影爱好者":"下午四点的光","手账少女":"把一周重新排一遍","追星族":"有人也喜欢同一个人","猫派":"校门口的猫","社团狂魔":"今天又有活动","天生卷王":"再多做一道题","慢热":"第二次见面","话痨":"哎我跟你说","低调":"报名表传到你桌上","好胜心":"体育课上的一局","二次元":"课间的漫画讨论","Kpop":"午休舞蹈","三无":"“你开心吗？”"};
const tagTexts={"管人痴":"你最近省下的零花钱终于攒够了一点，喜欢的主播又开了新的会员活动。","电波":"放学后你一个人站在天台边，小声向自己想象中的创世神大人汇报今天的战况。","键政":"午休时有人聊到一个社会话题，你忍不住认真加入讨论。","神人":"你突然做了一件让周围人集体沉默的事情。你自己倒觉得很合理。","中庸之道":"一次小测结束，老师公布排名。你发现自己又稳稳待在中游。","动画区up主":"你刷到别的动画区up主，突然想起自己也很久没有更新了。","小博主":"你拿起手机记录放学后的校园，发现普通日子也有很多值得拍的东西。","小网红":"你试着拍一条“高中生的一天”，意外发现镜头前的自己和平时不太一样。","白切黑":"有人问起你和某个同学的关系，你笑着说：“我是她朋友~”语气听不出多少信息。","钝感力":"班里发生了一点小尴尬，别人还在讨论，你已经转头开始做自己的事。","冰山":"同学第一次见你时总觉得你很难接近，但熟悉以后才发现不是那么回事。","外冷内热":"同学忘了带东西，你嘴上说麻烦，最后还是把自己的借给了她。","coser":"社团有人研究角色服装，你一下聊到了细节。","电竞选手":"放学后大家开了一局，你的反应速度让旁边的人有点惊讶。","漫画家":"你在本子上画了几格，把今天发生的小事变成了漫画。","Vtuber":"你发现自己很喜欢用声音和网络表达自己。","欧皇":"一次抽签，你随手抽到了最想要的那个位置。","非酋":"抽签时你又一次拿到了最不想要的结果。","玉玉":"放学前你突然觉得什么都没劲。","日麻":"有人问谁会打日麻，你一下听懂了他们讨论的牌型。","交际花":"午饭时不同桌的人都在喊你的名字。","三无":"同学问你开心不开心，你用平淡的表情回答。","天赋":"老师刚讲完一个新东西，你已经摸到了窍门。","舞萌":"放学路过机厅，熟悉的按键声让你停了下来。","冒失":"晚自习开始，你发现今天要交的作业本不见了。","直率":"老师问你的真实想法，你没有绕弯子。","刺头":"班里临时改了一条规定，你觉得不太合理。","中二病":"走廊里你听见一个双马尾女生认真讨论“结界”。","校园偶像":"活动结束后，大家自然地把镜头对准了你。"};
const tagScenes={"二次元": "午休时后排有人拿着漫画讨论最新一话，几个人围在一起争论角色到底有没有伏笔。", "Kpop": "午休铃刚响，教室后排放起了熟悉的歌，有人跟着节拍比划舞步。", "社恐": "午休时教室里很吵，你端着饭盒找到了一个靠窗的空位，终于不用应付一整桌人的聊天。", "开朗": "课间有人因为作业问题问你一句，你接着聊到社团、食堂，最后连隔壁桌也加入了。", "现充": "放学前几个人临时商量周末去哪儿，你顺手把两个原本互不认识的同学也叫了过来。", "阴暗b": "操场边人声很大，你坐在看台最后一排看着他们折腾，偶尔和旁边的人吐槽一句。", "文艺b": "放学经过教学楼拐角，夕阳照在旧公告栏上，你站了一会儿，把那个画面记进了手机备忘录。", "吉他手": "音乐教室里有人临时缺了一把伴奏，老师问有没有会弹吉他的同学，你的手已经放到琴弦上了。", "地下偶像": "午休有人聊起最近的线下live，你发现自己知道她们最近换了什么歌单。", "认真": "班主任让你统计一次作业收交情况，表格看起来很简单，但漏一个名字都会影响后面的登记。", "文学少女": "校刊编辑在班级群里征稿，你看到“校园生活”四个字，突然想起前几天放学路上的一幕。", "傲娇": "同桌忘了带尺子，问你能不能借一下。你把尺子递过去，还补了一句“下次记得自己带”。", "大小姐": "放学后几个同学准备去商场买活动要用的东西，你发现自己可以直接选更省事的方案。", "运动少女": "体育课结束的哨声响了，别人都坐在场边喝水，你却还想再绕操场跑一圈。", "卷王": "老师把小测成绩发下来，前几名开始互相问错题，你已经在草稿纸上写下一条下一次的复习计划。", "社交悍匪": "班里因为活动安排吵成一团，你拍了拍讲台旁的桌子：“先听我说一下。”", "佛系": "原本约好的活动临时少了两个人，大家都在纠结要不要改计划，你看了看时间。", "熬夜人": "晚上十一点多作业终于写完，你本来只打算看十分钟手机，消息列表却越刷越长。", "完美主义": "一张已经交过的海报被你发现角落里有一处字距不齐，你盯着它看了半天。", "吃货": "食堂今天换了窗口菜单，小笼包、叉烧包和奶黄包摆在一起，你认真研究了哪一份最值得买。", "摄影爱好者": "下午最后一节课结束，教学楼玻璃上的光刚好落在楼梯口，你下意识拿出了手机。", "手账少女": "周日晚饭后，你把下周课程表、作业截止时间和想参加的活动一起摊在桌上。", "追星族": "午休有人在看演唱会片段，你认出了屏幕上的歌手，忍不住凑过去问是哪一场。", "猫派": "放学走到校门口，保安室旁边那只熟悉的猫正趴在纸箱里晒太阳，你已经走出几步又折返回来。", "社团狂魔": "一个社团活动刚结束，另一边的招新群又发消息说晚上还有一次排练。", "天生卷王": "数学老师讲完一道新题，只给了三分钟让大家自己试，你第一遍就找到了关键关系。", "慢热": "上周只是点头之交的同学今天又在走廊遇到你，这一次她主动问你是不是也去食堂。", "话痨": "午饭只剩二十分钟，你从今天早上的一件事讲起，讲到一半已经聊到了昨天的电视剧。", "低调": "班级活动的报名表传到你桌上，前面已经有好几个人抢着写名字。", "好胜心": "体育课分组打球，最后一分是谁赢并不重要，但你明显不想让对面轻松拿下。", "管人痴": "你打开直播平台时，主播正在感谢新加入会员的人。你看了一眼自己攒了很久的钱。", "电波": "下午最后一节自习后，天台上没人，你靠着栏杆，小声把今天发生的事情讲给想象中的“创世神大人”。", "键政": "午休刷到一条社会新闻，旁边几个人已经讨论起来，你听着听着忍不住加入。", "神人": "放学前你突然决定做一件班里没人想到的事，执行完以后周围安静了几秒。", "中庸之道": "小测成绩贴在公告栏上，你的名字又在中间区域。有人问你为什么不冲前面，你想了想自己的安排。", "动画区up主": "晚上写完作业后，你打开剪辑软件，电脑里还有上个月录下来的素材，一直没剪完。", "小博主": "周五放学，你沿着熟悉的校门口一路拍：便利店、公交站、同学背影，都是每天会经过的地方。", "小网红": "你架好手机准备拍“高中生的一天”，第一句台词说到一半自己先笑了。", "白切黑": "午休有人半开玩笑地问你：“你跟她是不是关系特别好？”你笑着回答了一句看似普通的话。", "钝感力": "班里因为一句玩笑产生了点尴尬，周围的人还在猜是谁生气了，你已经开始收拾下一节课的书。", "冰山": "刚认识你的同学总觉得你不太好接近。今天她随口提到自己喜欢的饮料，你第二天却记得。", "外冷内热": "同学的文件忘在打印室，你路过时看见了，嘴上说“真麻烦”，还是把它带回了教室。", "coser": "美术社准备给校园活动做角色服装，有人拿着参考图讨论假发、布料和配件。", "电竞选手": "放学后几个同学临时开了一局，比赛拖到最后一波团战，所有人都盯着屏幕。", "漫画家": "自习课有十分钟空档，你在草稿本边角画了四个格子，把今天同桌的表情画了进去。", "Vtuber": "晚上你戴上耳机，对着电脑试着录一段声音，删了两次以后终于留下了一版。", "欧皇": "班里要抽签决定活动座位，大家都在讨论哪个位置最方便，你随手抽了一张。", "非酋": "班里抽签决定活动分组，你前面的人一个个抽到好位置，轮到你时只剩最后几张。", "玉玉": "放学铃响了，你却没有立刻起身。作业、考试和之后的事情一起压在脑子里，让你只想安静一会儿。", "日麻": "晚自习结束后有人在讨论牌局，你听到“断幺”两个字，马上知道他们刚才发生了什么。", "交际花": "去食堂的路上，前面有人喊你的名字，走到楼梯口又有另一个圈子的同学和你打招呼。", "三无": "同桌盯着你的脸问：“你今天是不是不太高兴？”你只是笑了笑，把水杯推回桌角。", "天赋": "老师第一次教一个新软件的操作步骤，很多人还在看说明，你已经自己试出了快捷的方法。", "舞萌": "放学经过机厅，机器的音乐从门口传出来。你本来只是路过，脚却已经停在门边。", "冒失": "晚自习前你翻遍书包都找不到作业本，最后发现它被自己夹在了另一科的练习册里。", "直率": "班主任问大家对新安排有什么意见，教室里没人说话，你直接把自己觉得不合理的地方讲了出来。", "刺头": "班里临时通知一项新规定，要求大家周末额外完成一份作业，你当场举手问为什么。", "中二病": "走廊尽头一个双马尾女生正认真地说“封印松动了”，你站近以后才发现她是在说今天的风很大。", "校园偶像": "学校活动需要拍一张班级宣传照，摄影同学让大家往前站一点，最后自然把你留在了比较显眼的位置。"};
const tagOutcomes={
"二次元": "你把漫画讨论从“最近在看什么”聊到了角色和设定，原本的闲聊一下有了共同话题。",
"Kpop": "午休音乐一响，你几乎不用试就跟上了熟悉的节拍，旁边的人开始问你跳的是哪首。",
"社恐": "你最后没有挤进人群，而是找了一个安静位置把事情做完，反而觉得这样最轻松。",
"开朗": "你本来只想说一句，最后和三个人聊起了完全不同的话题，连时间都过得很快。",
"现充": "你把原本互不认识的几个人拉到了一起，最后大家居然真的聊得起来。",
"阴暗b": "你站在人群边上吐槽了两句，嘴上嫌弃热闹，视线却一直没有离开。",
"文艺b": "你在一个很普通的下午突然被某个画面打动，回去后忍不住写了几句话。",
"吉他手": "你试着弹了一段熟悉的和弦，教室里立刻有人问：“你平时真的弹琴啊？”",
"地下偶像": "有人提到最近的拼盘live，你立刻说出了几个熟悉的名字，话题一下变得具体起来。",
"认真": "老师交代的小事到了你手里，你没有拖到最后，顺手把需要确认的细节都处理好了。",
"文学少女": "你从一句课文聊到一本书，最后连原本没打算参加校刊的人都被你说得有点心动。",
"傲娇": "你明明已经帮了忙，嘴上却还要补一句：“我只是刚好顺手。”",
"大小姐": "你发现自己有能力把原本麻烦的选择直接换成更省事的方案。",
"运动少女": "体育课结束以后别人都在休息，你却还有余力绕操场走一圈。",
"卷王": "别人还在讨论分数，你已经开始比较下一次怎么把薄弱题型补上。",
"社交悍匪": "你拍了拍桌子把大家注意力聚过来，一句话就把原本散乱的讨论重新拉回主题。",
"佛系": "事情没有完全按计划发展，你看了一眼，最后只是说：“行吧，也没什么。”",
"熬夜人": "晚上本来只想看一会儿手机，结果回过神已经很晚，你第二天顶着困意继续上课。",
"完美主义": "一个小地方没做好让你卡了很久，最后终于改到自己满意才肯放下。",
"吃货": "你一路比较了食堂几个窗口，最后精准选中了今天最值得吃的那份。",
"摄影爱好者": "你发现下午的光线刚好落在教学楼墙面上，第一反应不是走过去，而是掏出手机。",
"手账少女": "你把这周的作业、活动和想做的事情重新排了一遍，突然发现时间其实够用。",
"追星族": "你在教室里听见有人提到同一个偶像，两个人立刻从点头之交聊成了熟人。",
"猫派": "校门口那只猫突然从墙边钻出来，你原本赶着回家，还是停了下来。",
"社团狂魔": "一个活动刚结束，另一个社团又来找人，你居然真的开始认真考虑要不要参加。",
"天生卷王": "老师刚讲完新题型，你第一次尝试就抓到了关键步骤。",
"慢热": "第二次见面时你终于主动说了句话，对方明显也松弛了下来。",
"话痨": "你本来只想说一件事，结果从午饭一路讲到了放学。",
"低调": "报名表传到你桌上时，你没有抢着举手，只在最后安静地填了自己的名字。",
"好胜心": "一场很普通的小竞争让你认真起来，结束以后还在想刚才到底输在哪里。",
"玉玉": "今天什么都提不起劲，你没有硬撑着装开心，只把最必要的事情做完。",
"日麻": "几个人在聊牌局，你听懂了“断幺”以后直接接上了话，桌上的人都愣了一下。",
"交际花": "不同圈子的同学轮流和你打招呼，你突然意识到自己在班里真的认识不少人。",
"三无": "别人问你是不是开心，你只是笑了一下，没有多解释，但对方也没有继续追问。",
"天赋": "第一次接触的新东西，你很快就摸到了规律，旁边的人还在研究说明。",
"舞萌": "路过机厅时熟悉的音乐响起来，你进去打了一局，手感意外地很好。",
"冒失": "你找了半天才发现东西就在自己手边，周围的人已经开始笑你了。",
"直率": "有人问你真实想法，你没有绕弯子，直接把答案说了出来。",
"刺头": "临时规定明显不合理，你当场提出了具体的问题，老师也只好重新解释。",
"中二病": "双马尾女生认真说完一串你完全听不懂的话，最后却突然问你：“要不要一起吃饭？”",
"校园偶像": "大家拍班级合照时，自然而然有人把你推到了镜头更显眼的位置。",
"管人痴": "你认真算了一遍零花钱，最后决定这次先攒着，不让一时冲动打乱整个月的开销。",
"电波": "你站在天台小声说完一段只有自己听得懂的话，回到教室后反而安静了不少。",
"键政": "午休讨论社会新闻时你说得很投入，后来意识到大家的观点其实差得很远。",
"神人": "你做完那件事以后，全班沉默了几秒；你自己也想了想，确实有点难解释。",
"中庸之道": "成绩单下来，你又稳稳地待在中间位置，没有惊喜，也没有失手。",
"动画区up主": "你重新打开剪辑软件，把拖了很久的视频剪掉了开头一大段，终于有了发布的冲动。",
"小博主": "你记录了一段放学路上的普通画面，回看时发现它比精心摆拍的东西更像真实的高中生活。",
"小网红": "你试着对着镜头说“欢迎收看”，说到第二句自己先笑场，但还是把视频拍完了。",
"白切黑": "有人试探着问你朋友的事，你笑着回答得滴水不漏，对方什么有用信息都没套到。",
"钝感力": "别人还在为一句话纠结，你已经去做下一件事了，情绪没有被拖很久。",
"冰山": "你只是简单回答了几句，但对方后来发现你其实记得她之前随口说过的事。",
"外冷内热": "你嘴上说“自己弄”，转身还是把同学落下的东西送了过去。",
"coser": "服装细节讨论起来以后你越说越具体，连普通校服怎么改都能聊半天。",
"电竞选手": "一局普通的对抗游戏打到最后，你的反应速度让队友直接喊你别划水了。",
"漫画家": "你把今天发生的一件小事画成四格，最后一格连自己看了都觉得好笑。",
"Vtuber": "你试着用不同的声音表达同一句话，发现网络上的自己似乎比现实里更放松。",
"欧皇": "你本来只是随手一试，结果真的拿到了最想要的那一个。",
"非酋": "你换了两个办法，结果还是拿到了最不想要的结果，只能认命。"
};
const tagChoiceA={
"二次元": "找人聊作品",
"Kpop": "跟着音乐跳两下",
"社恐": "找安静角落",
"开朗": "主动搭话",
"现充": "把几个人叫到一起",
"阴暗b": "站远一点看",
"文艺b": "记下一个画面",
"吉他手": "弹一段熟悉的",
"地下偶像": "聊最近的live",
"认真": "把事情先做完",
"文学少女": "聊到最近读的书",
"傲娇": "帮完再装作没事",
"大小姐": "直接选更方便的方案",
"运动少女": "继续运动",
"卷王": "现在就看错题",
"社交悍匪": "把大家叫回来",
"佛系": "顺其自然",
"熬夜人": "再刷十分钟",
"完美主义": "一定改到满意",
"吃货": "先看今天吃什么",
"摄影爱好者": "拍下来",
"手账少女": "重新排时间",
"追星族": "问对方喜欢哪首歌",
"猫派": "停下来摸摸猫",
"社团狂魔": "再报名一个",
"天生卷王": "直接试新题",
"慢热": "第二次主动打招呼",
"话痨": "把话题继续讲下去",
"低调": "最后再填",
"好胜心": "认真比一局",
"玉玉": "只做必要的事",
"日麻": "接一句牌谱",
"交际花": "去认识那桌人",
"三无": "微笑带过",
"天赋": "直接上手",
"舞萌": "进机厅",
"冒失": "回头再找",
"直率": "直接回答",
"刺头": "当场问清楚",
"中二病": "认真接中二病的话",
"校园偶像": "站到镜头中间",
"管人痴": "先把钱留着",
"电波": "继续和创世神通话",
"键政": "继续讨论",
"神人": "就这么做",
"中庸之道": "维持第三名",
"动画区up主": "重新剪视频",
"小博主": "把这段拍下来",
"小网红": "认真出镜",
"白切黑": "继续装作普通朋友",
"钝感力": "不放在心上",
"冰山": "记住对方的话",
"外冷内热": "默默帮忙",
"coser": "研究服装",
"电竞选手": "认真打完",
"漫画家": "画下来",
"Vtuber": "录一段声音",
"欧皇": "相信手气",
"非酋": "让别人来抽"
};
const tagChoiceB={
"二次元": "只聊剧情梗",
"Kpop": "收藏推荐",
"社恐": "直接回座位",
"开朗": "等别人先开口",
"现充": "只和熟人待着",
"阴暗b": "转身回教室",
"文艺b": "去旧书店看看",
"吉他手": "先听别人弹",
"地下偶像": "只点赞不发言",
"认真": "回家再确认",
"文学少女": "写进读书笔记",
"傲娇": "等对方自己发现",
"大小姐": "先看看价格",
"运动少女": "去操场跑两圈",
"卷王": "把下一章先做了",
"社交悍匪": "自己整理信息",
"佛系": "随便选一个",
"熬夜人": "现在就睡",
"完美主义": "先放下这道题",
"吃货": "换个窗口",
"摄影爱好者": "留到以后再拍",
"手账少女": "只记三件事",
"追星族": "从偶像聊到学校",
"猫派": "赶紧回家",
"社团狂魔": "先参加一次再说",
"天生卷王": "先研究例题",
"慢热": "等第三次见面",
"话痨": "终于把故事讲完",
"低调": "等别人都填完",
"好胜心": "不服再来一局",
"玉玉": "明天再处理",
"日麻": "问清楚规则",
"交际花": "从认识的人开始",
"三无": "只说“还好”",
"天赋": "看看别人怎么做",
"舞萌": "换一首歌",
"冒失": "承认是自己弄丢的",
"直率": "说出真实答案",
"刺头": "提出更具体的反对意见",
"中二病": "先问她吃什么",
"校园偶像": "拍别人不拍自己",
"管人痴": "再攒一个月",
"电波": "回去写下来",
"键政": "继续讲下去",
"神人": "先看看其他人排名",
"中庸之道": "彻底重剪",
"动画区up主": "只拍一秒",
"小博主": "不出镜",
"小网红": "什么都不说",
"白切黑": "当作没发生",
"钝感力": "观察一会儿",
"冰山": "假装不在意",
"外冷内热": "先打草稿",
"coser": "和队友复盘",
"电竞选手": "画另一个结局",
"漫画家": "换个角色声音",
"Vtuber": "再试一次",
"欧皇": "让朋友来抽"
};
tagChoiceA["非酋"]="让朋友来抽";tagChoiceB["非酋"]="自己再试一次";
function tagResultA(t){return tagOutcomes[t]||"你选择了第一种处理方式，事情按照这个决定继续发展。"}
function tagResultB(t){return (tagOutcomes[t]||"你换了另一种处理方式，事情按照这个决定继续发展。")+" 你没有走另一条路，因此后面的结果也不一样。"}
function tagEffect(t){if(t==="大小姐"&&S.stats.money>1)log("你的家庭条件让这件事的选择空间明显更大。");if(t==="运动少女"||t==="电竞选手")log(S.stats.health>=28?"你的体力和专注状态很好。":"你今天状态一般，做完以后有点累。");if(t==="校园偶像"||t==="交际花")log(S.stats.charm>=28?"你的魅力让你很容易成为人群里被记住的人。":"你没有刻意成为中心，但还是有人记住了你。");if(t==="认真"||t==="卷王"||t==="天生卷王")log(S.stats.intel>=26?"你的智力让你很快抓住了重点。":"你需要多花一点时间才能把事情理顺。")}
function showFixed(){let list=FIXED[S.month];if(!list){S.fixedDone=true;finish();return}runFixed(list,0)}
function runFixed(list,i){if(i>=list.length){S.fixedDone=true;showEndMonth();return}showChoices("固定事件 · "+S.month+"月",list[i].title,list[i].text,list[i].choices,()=>runFixed(list,i+1))}
function showEndMonth(){document.getElementById("tag").textContent="本月结束";document.getElementById("title").textContent=S.month===12?"高一上学期结束":"这个月的事情告一段落了";document.getElementById("text").textContent=S.month===12?"四个月的高中生活暂时告一段落。你已经开始有了自己的节奏，也留下了一些真正认识的人。":"你收好书包，准备进入下个月。";let b=document.getElementById("choices");b.innerHTML="";let n=document.createElement("button");n.className="primary";n.textContent=S.month===12?"查看这一阶段的总结":"进入下个月";n.onclick=()=>{n.disabled=true;b.innerHTML="";if(S.month===12)finish();else{S.month++;startMonth()}};b.appendChild(n);update()}
function fixedResult(style,base){let a=[base],c=S.stats.charm,h=S.stats.health,m=S.stats.money,i=S.stats.intel;let n=randomKnownNPC();if(style==="社交"){a.push(c>=30?"你的魅力让你很容易被人记住，主动交流也显得自然。":c>=18?"你给人的感觉比较自然，认识新同学不算困难。":"你不太会主动成为气氛中心，但熟悉以后关系会慢慢稳定下来。");if(n)a.push(companion(n,"社交"))}else if(style==="探索"){a.push(h>=28?"你的精力很好，走了不少路也不觉得累。":h<14?"你走了一阵就有点累，最后还是选择了短一点的路线。":"你慢慢摸清了校园周边。" );}else if(style==="独处"){a.push(h<14?"你最近有些累，这段独处更像是在恢复体力。":"你有一段完全属于自己的时间。");if(hasTrait("社恐")||hasTrait("三无"))a.push("对你来说，独处并不等于无聊。") }else if(style==="活跃"){a.push(c>=28?"你在这种集体活动里很有存在感。":"你没有成为绝对中心，但也很自然地融入了热闹的人群。");if(n)a.push(companion(n,"社交"))}else if(style==="低调"){a.push(c<18?"你更习惯站在人群外观察，别人也很少强行把你推到中心。":c>=28?"你明明很容易被注意到，却总能把存在感控制在自己舒服的程度。":"你不抢镜，但需要说话的时候也不会躲开。") }else if(style==="观察"){a.push(c>=28?"你观察得很细，没多久就能分清谁爱热闹、谁习惯独处。":c<18?"你没有急着和所有人打招呼，而是先把班里的相处方式看明白了。":"你很快抓到了班级里的几个小圈子和大家的说话方式。") }else if(style==="健康"){a.push(h>=28?"你的身体状态很好，冷空气反而让你觉得清醒。":h<14?"你比别人更怕冷，回教室以后缓了好一会儿。":"你正常享受了这个冬天的小插曲。") }else if(style==="学习"){a.push(i>=28?"你很快抓住重点，复习效率不错。":i>=20?"你能找到大部分题目的切入口。":"你需要花更多时间整理基础内容。");if(hasTrait("认真")||hasTrait("卷王"))a.push("你的特质让你愿意把没弄懂的地方继续追下去。") }else if(style==="家境"){a.push(m>=28?"家庭条件给了你比较大的选择空间。":m<15?"你会更认真考虑每一笔额外支出。":"你开始学会在想要和必要之间做取舍。") }return a.join("\n\n")}
function examResult(later){let i=S.stats.intel,h=S.stats.health,r=i>=32?"班级前10%":i>=26?"班级前25%":i>=20?"班级前45%":i>=15?"班级前70%":"班级后30%";let t=`你的第一次月考大致落在${r}。`;if(h<12)t+=" 连续考试让你明显有些疲惫。";else if(h>=28)t+=" 你的精神状态很稳定。";if(hasTrait("卷王")||hasTrait("天生卷王"))t+=" 你对排名的敏感度比别人更高。";if(later)t+=" 你没有立刻盯着排名，反而让这次考试晚一点进入自己的情绪。";return t}
function divisionResult(kind){let i=S.stats.intel;let favored=Math.random()<.5?"文科":"理科";let strong=favored==="文科"?"语文、历史和表达类内容":"数学、物理和逻辑类内容";if(kind==="成绩")return `老师拿着你的平时表现和考试情况看了一会儿，觉得你更擅长${favored}。你自己回头比较，确实发现${strong}更容易进入状态。${i>=28?"你的成绩也让这个方向看起来相当有竞争力。":"不过老师提醒你，真正决定方向的还是之后持续的表现。"}`;return `这次没有直接按分数决定。你发现自己更容易对${strong}产生兴趣，于是暂时把${favored}记进了考虑范围。${i>=24?"你的成绩也刚好能跟上这种兴趣。":"至于能不能长期坚持，还得再观察一段时间。"}`}
function competitionResult(ask){let i=S.stats.intel;if(i>=26||hasTrait("天赋")||hasTrait("天生卷王")||hasTrait("卷王")){let pool=["信息学","物理","化学","生物","数学"];let fav=pool[Math.floor(Math.random()*pool.length)];return `老师和你聊了一会儿，最后随机推荐你重点了解${fav}竞赛。你听介绍时发现，这一科的思路确实比其他几项更容易让你产生兴趣。${ask?"你还问了参加过的学姐，知道了不少真实情况。":"你先坐下来完整听了一节介绍。"}`;}if(i>=18)return"老师觉得你可以先尝试一项竞赛，但不建议同时铺开太多。你最后决定先旁听，再看自己能不能接受额外训练。";return"你听完五项竞赛的介绍，没有哪一项明显吸引你。至少这次你知道了竞赛生活和普通课堂完全不是一回事。"}
function talentResult(team){let a=[];if(hasTrait("吉他手")||hasTag("音乐"))a.push("你的乐器经验让节目很稳。");if(hasTrait("Kpop")||hasTag("舞蹈"))a.push("你对舞台节奏比较熟。");if(hasTrait("校园偶像")||S.stats.charm>=28)a.push("你的魅力让你在台上特别容易被注意到。");else a.push("你没有夸张地成为全场焦点，但还是有人记住了这个节目。");if(team&&randomKnownNPC())a.push(companion(randomKnownNPC(),"社交"));return a.join("\n\n")}
function artResult(a){if(hasTag("美术")||hasTrait("文艺b")||hasTrait("摄影爱好者")||hasTrait("漫画家"))return"老师觉得你有审美和兴趣基础，值得继续了解。"+(S.stats.money>=28?" 家庭条件也能比较从容地支持长期训练。":"");if(S.stats.charm>=22)return"你的画面表现力不错，老师建议你先旁听几次训练。";return"你的基础比较普通，但旁听以后你终于知道美术训练到底有多辛苦。"+(a?" 你暂时没有急着报名。":"")}
function studyResult(group){let i=S.stats.intel,a=[];if(i>=24&&(hasTrait("认真")||hasTrait("卷王")||hasTrait("手账少女")))a.push("你的学习方法比较稳定，整理起来很有条理。");else if(group&&hasTrait("社交悍匪"))a.push("你讲题的时候很有气势，几个人互相讲了一遍以后反而记得更牢。");else a.push("你至少把这一学期的重点重新过了一遍。");if(hasTrait("完美主义"))a.push("你还忍不住把几个错误反复复盘。") ;return a.join("\n\n")}
function finalExamResult(peer){let i=S.stats.intel,h=S.stats.health,a=[i>=26?"基础题和大部分常规题你都有切入口。":i>=18?"大部分题目都能找到切入口，只是有几道比较耗时间。":"有些题让你花了不少时间，但你还是尽量完成了。"] ;if(h<14)a.push("连续考试让你明显疲惫，后半程注意力下降了一些。");else if(h>=28)a.push("你的身体状态很好，几场考试下来依然保持稳定。");if(peer)a.push("考完和同学对答案以后，你发现大家其实都有几道不确定的题。");if(hasTrait("佛系"))a.push("你没有继续折磨自己，很快开始想寒假。 ");if(hasTrait("完美主义"))a.push("你已经开始在脑子里复盘刚才的失误。");return a.join("\n\n")}
function showClub(){let box=document.getElementById("choices");document.getElementById("tag").textContent="固定事件 · 9月";document.getElementById("title").textContent="社团纳新";document.getElementById("text").textContent="摊位几乎摆满了教学楼前。文学社、动漫社、音乐社、美术社、街舞社、广播站、志愿者协会、篮球社……你可以把放学后的时间交给其中一个，也可以一个都不选。";box.innerHTML="";let clubs=[["文学社","文学","喜欢写东西、看书，也会参与校刊。"],["动漫社","二次元","一起看番、聊漫画和游戏。"],["音乐社","音乐","排练、乐器、偶尔参加学校演出。"],["美术社","美术","画画、板报和校内视觉设计。"],["街舞社","舞蹈","练舞、排节目，放学后活动比较多。"],["广播站","播音","录音、播音和校园广播。"],["志愿者协会","志愿服务","校内外志愿活动。"],["篮球社","篮球","训练和校内比赛。"],["话剧社","话剧","排练、舞台和角色。"],["辩论社","辩论","讨论问题、准备辩题。"]];clubs.forEach(c=>{let b=document.createElement("button");b.innerHTML=`<b>${esc(c[0])}</b>　→　兴趣标签：${esc(c[1])}<br><span style="font-size:11px;color:#8b827a">${esc(c[2])}</span>`;b.onclick=()=>{if(S.flags.clubOpen)return;S.flags.clubOpen=true;S.club=c[0];addInterest(c[1]);log("加入社团："+c[0]);box.innerHTML="";let n=document.createElement("button");n.className="primary";n.textContent="继续";n.onclick=()=>{n.disabled=true;box.innerHTML="";runFixed(FIXED[9],3)};box.appendChild(n)};box.appendChild(b)});let home=document.createElement("button");home.textContent="不加入任何社团 → 归宅部";home.onclick=()=>{if(S.flags.clubOpen)return;S.flags.clubOpen=true;S.club="归宅部";addInterest("归宅部");log("没有加入社团，成为归宅部。");box.innerHTML="";let n=document.createElement("button");n.className="primary";n.textContent="继续";n.onclick=()=>{n.disabled=true;box.innerHTML="";runFixed(FIXED[9],3)};box.appendChild(n)};box.appendChild(home);return "HANDLED"}
const FIXED={
9:[
{title:"认识新同学",text:"开学第一天，班主任让大家简单自我介绍。陌生的座位、陌生的名字，还有一群以后可能一起度过三年的人。",choices:[["主动记几个名字","你决定先认识几个人。",()=>fixedResult("社交","你主动记住了几个新同学。")],["先观察班里的气氛","你没有急着融入，而是先看看大家是什么样的人。",()=>fixedResult("观察","你很快摸清了班里大概的气氛。")]]},
{title:"熟悉校园",text:"接下来的几天，你开始摸清学校：教学楼、食堂、操场、医务室、图书馆，以及放学以后哪里最安静。",choices:[["自己慢慢逛","你按照自己的路线认识校园。",()=>fixedResult("探索","你记住了几个以后可能常去的地方。")],["跟着同学一起逛","有人带着你走了一圈，还顺便告诉你一些学校里的小秘密。",()=>fixedResult("社交","你通过同学更快熟悉了校园。")]]},
{title:"社团纳新",text:"教学楼前摆满了摊位。文学社、动漫社、音乐社、美术社、街舞社、广播站、志愿者协会、篮球社……",choices:[["认真比较几个社团","你没有被招新海报牵着走，而是认真想想放学后的时间想花在哪里。",()=>showClub()],["跟着认识的人去看看","有人陪着的时候，很多社团都没那么陌生。",()=>showClub()]]},
{title:"学生会招新",text:"学生会开始招新。有人想锻炼能力，有人想认识更多人，也有人单纯觉得活动挺有意思。",choices:[["报名试试","你去填了报名表。",()=>fixedResult("社交","你参加了学生会招新。")],["先旁听一次活动","你先看看学生会平时到底在做什么。",()=>fixedResult("观察","你对学生会的实际工作有了具体认识。")]]}
],
10:[
{title:"国庆节假期",text:"国庆假期到了。作业当然不会消失，但至少不用每天六点多起床。",choices:[["约朋友出去走走","你们就在附近逛了一天。",()=>fixedResult("社交","你和朋友度过了一天不太有计划的假期。")],["留一天完全给自己","你睡到自然醒，慢慢做作业，晚上还有时间刷点喜欢的东西。",()=>fixedResult("独处","你重新找回了一点自己的生活节奏。")]]},
{title:"第一次月考",text:"高中第一次月考来了。试卷发下来时，你第一次真正看见自己在新班级里的位置。",choices:[["考完立刻看排名","你和同学一起蹲在成绩单旁边找自己的名字。",()=>examResult(false)],["先不看，回家再说","你决定让这次考试晚一点进入自己的情绪。",()=>examResult(true)]]},
{title:"文理分科",text:"学校开始正式讨论文理分科。老师和家长都在问：你以后到底想学什么？",choices:[["先看自己最擅长的科目","你开始比较各科成绩。",()=>divisionResult("成绩")],["先想自己愿意学什么","你暂时不急着看分数，而是想如果没有人逼你，你会主动学什么。",()=>divisionResult("兴趣")]]},
{title:"竞赛招人",text:"信息学、物理、化学、生物、数学竞赛开始招人。",choices:[["去听听最感兴趣的一科","你坐进教室听了一节介绍。",()=>competitionResult(false)],["先问问参加过的人","你从学长学姐那里听到了更多真实体验。",()=>competitionResult(true)]]}
],
11:[
{title:"初雪",text:"今年的第一场雪落下来了。课间的时候，很多人趴在窗边看。",choices:[["下楼看看","你在冷空气里站了一会儿。",()=>fixedResult("健康","你享受了一会儿难得的课间。")],["留在教室看窗外","你没有下楼，但和同桌聊了几句今年的冬天。",()=>fixedResult("社交","一个普通课间也留下了一点记忆。")]]},
{title:"单身情歌",text:"11月11日，晚自习前后，操场上不知道是谁先唱起了《单身情歌》。没有人组织，也没有老师主持。",choices:[["去操场凑热闹","你加入了这场莫名其妙的合唱。",()=>fixedResult("活跃","你觉得这种事情大概只有高中才会发生。")],["在教学楼门口听","你没有挤进人群，但隔着一段距离听完整首歌。",()=>fixedResult("低调","你站在人群外，也觉得这个晚上挺有意思。")]]},
{title:"才俊杯",text:"学校举办才俊杯，全校学生都可以报名自由表演才艺。唱歌、跳舞、乐器、魔术、相声……什么都有。",choices:[["报一个自己最拿手的","你不一定想赢，但想试一次站上台的感觉。",()=>talentResult(false)],["找朋友一起组个节目","比起一个人站台上，你更想和熟悉的人一起折腾。",()=>talentResult(true)]]},
{title:"美术生选拔",text:"美术组开始选拔准备走美术方向的学生。老师说，不只是看现在画得多好，也看愿不愿意长期练。",choices:[["报名参加测试","你坐下来画了一张完整的素描。",()=>artResult(false)],["先旁听一次集训","你看了一下午真正的训练强度。",()=>artResult(true)]]}
],
12:[
{title:"跨年",text:"12月最后一个晚上，大家开始讨论跨年。有人约朋友出去，有人在家刷手机，也有人还在赶期末作业。",choices:[["和朋友一起倒数","你们一起熬到零点。",()=>fixedResult("社交","你和朋友一起迎来了新年。")],["给自己留一个晚上","你在自己的房间里慢慢迎来新的一年。",()=>fixedResult("独处","你安静地给这一学期画了一个句号。")]]},
{title:"期末复习",text:"教室里的气氛明显变了。黑板上的倒计时越来越近，大家开始整理错题和笔记。",choices:[["和同学一起整理","有人讲题，有人找错题，效率意外地不错。",()=>studyResult(true)],["按照自己的方法复习","你把时间表、错题和薄弱章节重新整理了一遍。",()=>studyResult(false)]]},
{title:"期末考试",text:"第一学期最后一场考试结束。走出考场的时候，你突然发现自己已经在这里生活了四个月。",choices:[["和同学对答案","你们一边对答案一边吐槽。",()=>finalExamResult(true)],["先不对，回家再说","你决定让大脑休息一下。",()=>finalExamResult(false)]]}
]};
function finish(){document.getElementById("game").classList.add("hidden");document.getElementById("result").classList.remove("hidden");let s=S.stats,traits=S.traits.map(i=>S.pool[i][0]),r=S.npcRelation;let strong=[];if(s.charm>=28)strong.push("你的魅力让你更容易在人群中留下印象。");else if(s.charm<14)strong.push("你没有急着成为人群中心，关系更多是在熟悉以后慢慢建立。");else strong.push("你的魅力处在比较自然的区间，既不会特别抢眼，也不难融入。");if(s.intel>=28)strong.push("你的学习能力比较扎实，月考、竞赛和期末都给了你比较稳定的选择空间。");else if(s.intel<18)strong.push("学习并不是你最轻松的部分，你更多靠时间和自己的节奏一点点补上。");else strong.push("你的学习能力处在一个可以靠方法继续往上走的位置。");if(s.health>=28)strong.push("你的体力很好，活动、冬天和连续考试都没有太明显拖慢你的生活。");else if(s.health<14)strong.push("你的健康状况偏弱，疲惫感在冬天和考试周尤其明显。");else strong.push("你的身体状态总体正常，但忙起来还是会感到累。");if(s.money>=28)strong.push("家庭条件给了你更多选择：补习、兴趣和活动的成本不会立刻成为问题。");else if(s.money<14)strong.push("家境让你会更认真考虑每一笔额外开支，也更早意识到家庭状况会影响选择。");else strong.push("家境比较普通，你开始学会在想要和必要之间做取舍。");let social=S.npcs.length?`这几个月里，你认识了${S.npcs.length}位主要同学：${S.npcs.join("、")}。其中关系最好的是${Object.keys(r).sort((a,b)=>(r[b]||0)-(r[a]||0))[0]}。`:"这几个月里，你还没有和特别多的人建立稳定联系。";let events=S.history.length?S.history.join("；"):"普通的上学、放学、考试和课间。";let best=Object.keys(r).sort((a,b)=>(r[b]||0)-(r[a]||0))[0];let relationText=best?`其中和${best}的关系最自然。`:"这段时间里还没有形成特别稳定的关系。";let yearSummary=(s.charm>=28?"你在人群里很容易被记住。":s.charm<14?"你更习惯先观察，再慢慢和熟悉的人靠近。":"你和周围人的相处比较自然。")+" "+(s.intel>=28?"学习上的反馈让你开始看到一些明确的方向。":s.intel<18?"学习压力提醒你，高中和初中确实是两种完全不同的生活。":"你逐渐摸到了适合自己的学习节奏。")+" "+(s.health>=28?"你有足够的精力把学习之外的生活也塞进去。":s.health<14?"疲惫感是这段高中生活里很真实的一部分。":"忙起来会累，但总体还能跟上。")+" "+(s.money>=28?"家庭条件让你在兴趣和活动上有更多选择。":s.money<14?"家里的经济变化让你更早开始考虑‘想要’和‘需要’。":"普通的家庭条件让你的选择更多取决于自己愿不愿意投入。");document.getElementById("resultText").innerHTML=`<b>${esc(S.name)}的高一上学期</b><br><br>${strong.map(x=>esc(x)).join("<br>")}<br><br>${esc(social)} ${esc(relationText)}<br><br><b>这一阶段的总结</b><br>${esc(yearSummary)}<br><br>社团：${esc(S.club||"未加入")}<br>特质：${traits.map(esc).join("、")}<br>兴趣：${S.interests.map(esc).join("、")||"无"}<br><br><b>这一阶段发生过的事</b><br>${esc(events)}<br><br><b>最终基础属性</b><br>魅力 ${s.charm} · 智力 ${s.intel} · 健康 ${s.health} · 家境 ${s.money}`}
renderPool();checkPoints();

/* ===== 高一上学期之后：寒假 + 高一下学期续篇 ===== */
const WINTER_FIXED=[
 {title:"去南湖公园看到了烟花",text:"除夕前后，南湖公园临时开放了夜间活动。你原本只是陪家人散步，湖边的人群越来越多，最后一束烟花在水面上亮起来。",choices:[
  ["走到湖边看完", "你没有急着拍照，只站在湖边把整场烟花看完。",()=>{S.flags.winterMemory="烟花";S.stats.health=Math.min(40,S.stats.health+1);log("寒假：在南湖公园看了一场烟花。")}],
  ["拍下来留作纪念", "你拍了几张照片，回家后挑出最好的一张存进相册。",()=>{S.flags.winterMemory="烟花照片";addInterest("摄影");log("寒假：留下了南湖公园的烟花照片。")}]
 ]},
 {title:"出去玩雪时着凉感冒",text:"下雪后你和家人出门玩了一阵。刚开始还兴致勃勃，回家以后却发现自己开始发冷，只好躺在床上休息。",choices:[
  ["老老实实休息", "你把手机放远一点，好好睡了一觉，第二天精神终于缓过来。",()=>{S.stats.health=Math.max(1,S.stats.health-1);S.flags.winterMemory="感冒后休息";log("寒假：着凉感冒，休息了几天。 ")}],
  ["还惦记着原来的计划", "你本来想硬撑，最后还是被家里人劝回床上。",()=>{S.stats.health=Math.max(1,S.stats.health-2);S.flags.winterMemory="硬撑后休息";log("寒假：因为着凉，原本的计划被迫调整。 ")}]
 ]},
 {title:"回农村老家和家人一起过年",text:"年夜饭前，你跟着家里人回了农村老家。亲戚们围着桌子聊天，厨房里一直有人进进出出，电视的声音从客厅传过来。",choices:[
  ["跟着长辈一起准备年夜饭", "你在厨房里帮着择菜、端盘子，忙完以后才真正坐下来吃饭。",()=>{S.flags.winterMemory="老家过年";S.stats.health=Math.min(40,S.stats.health+1);log("寒假：和家人一起回农村老家过年。 ")}],
  ["和同龄亲戚聊学校", "你第一次发现，原来不同地方的高中生活也会有这么多相似的烦恼。",()=>{S.flags.winterMemory="老家聊天";S.stats.charm=Math.min(40,S.stats.charm+1);log("寒假：和家里的同龄人聊了很多高中生活。 ")}]
 ]},
 {title:"出去旅游",text:"家里终于腾出几天时间，你们决定出去走走。行程不算豪华，但至少暂时不用看学校群里的消息。",choices:[
  ["认真逛当地的地方", "你把原本的景点一个个走下来，晚上回酒店时脚已经有些酸。",()=>{S.flags.winterMemory="旅行";S.stats.health=Math.min(40,S.stats.health+1);log("寒假：和家人出去旅游。 ")}],
  ["把时间留给自己探索", "你没有完全跟着行程走，而是抽出一段时间去逛自己感兴趣的地方。",()=>{S.flags.winterMemory="独自探索";addInterest("旅行");log("寒假：旅行中发现了新的兴趣。 ")}]
 ]}
];
function relationLevel(name){let r=S.npcRelation[name]||0;return r>=7?"很熟":r>=4?"关系不错":r>=2?"熟悉起来了":"刚认识"}
function winterRoute(){
 let options=[];
 if(S.stats.intel>=20)options.push(["把时间用在学习方向上","你整理了高一下想重点投入的科目和资料。",()=>{S.route="学业";S.flags.routeWinter=true;S.stats.intel=Math.min(40,S.stats.intel+1);log("寒假安排：你把一部分时间投入到之后的学习方向。")}]);
 if(S.stats.charm>=20)options.push(["准备一项公开活动","你开始想高一下参加什么活动，希望自己真正做出点东西。",()=>{S.route="舞台";S.flags.routeWinter=true;S.stats.charm=Math.min(40,S.stats.charm+1);log("寒假安排：你为高一下的校园活动提前做了准备。")}]);
 if(S.stats.health>=20)options.push(["安排固定的运动时间","你给自己定了一个并不夸张的计划：每周留出时间运动。",()=>{S.route="运动";S.flags.routeWinter=true;S.stats.health=Math.min(40,S.stats.health+1);log("寒假安排：你决定保持运动习惯。")}]);
 if(S.stats.money>=20)options.push(["认真规划一次兴趣投入","你算了算预算，决定把一部分钱花在真正会长期用到的东西上。",()=>{S.route="兴趣";S.flags.routeWinter=true;S.stats.money=Math.max(1,S.stats.money-1);addInterest("个人兴趣");log("寒假安排：你为自己的兴趣做了一次具体规划。")}]);
 if(!options.length)options=[ ["按自己的节奏过寒假","你没有给自己安排太多东西，只把真正想做的一件事留了下来。",()=>{S.route="生活";S.flags.routeWinter=true;log("寒假安排：你决定先把生活过好，再考虑下一步。")}]];
 showChoices("寒假安排","给高一下留一件事", "寒假里，你想把哪一件事情真正做起来？",options,()=>winterNPC());
}
function winterNPC(){
 let name=randomKnownNPC();
 if(!name){showChoices("寒假","一个人的假期","没有特别熟悉的同学可以约，你最后还是给自己安排了一天出门。",[["出去走走","你在熟悉的街区慢慢逛了一圈。",()=>{S.flags.winterNPC="独处";log("寒假：自己出门走了一天。")}]],()=>winterFixed());return;}
 let r=relationLevel(name),place={"大小姐":"商场里的甜品店","班长":"学校旁边的旧书店","主人公":"南湖公园","转校生":"学校后门的小路","中二病":"河堤边","学姐":"初中附近的文具店","同人女":"画材店","体育生":"操场看台"}[name]||"附近的小店";
 let text=r==="很熟"?`放寒假以后，你和${name}居然还保持着联系。你们约在${place}见面，刚碰面就聊起了这学期留下来的小事。`:r==="关系不错"?`你和${name}约在${place}见面。虽然已经放假，但你们聊起学校的事时还是很自然。`:r==="熟悉起来了"?`你和${name}在${place}碰面。比起学期刚开始的时候，现在已经不用费力找话题了。`:`你和${name}约在${place}见面。刚开始还有一点生疏，但对方没有急着结束这次见面。`;
 showChoices("寒假 · 人物互动",name,text,[["聊聊高一下想做什么",`${name}也说起了自己的计划。`,()=>{S.npcRelation[name]=(S.npcRelation[name]||0)+2;S.flags.winterNPC=name;log("寒假：和【"+name+"】聊了高一下的打算，关系明显更近了。 ")}],["就聊些轻松的",`你们没有谈太多未来，只把这次见面当成一次普通的假期见面。`,()=>{S.npcRelation[name]=(S.npcRelation[name]||0)+1;S.flags.winterNPC=name;log("寒假：和【"+name+"】度过了一段轻松的时间。 ")}]],()=>winterFixed());
}
function winterFixed(){let e=WINTER_FIXED[Math.floor(Math.random()*WINTER_FIXED.length)];showChoices("寒假",e.title,e.text,e.choices,()=>{S.month=3;S.schoolTerm="高一下";log("寒假结束了。新的学期就要开始。 ");startMonth();});}

const SECOND_FIXED={
 3:[
   {title:"正式文理分科",text:"新的学期开始，文理分科终于不再只是讨论。你需要真正做出选择。",choices:[
    ["选择文科","你正式选择文科方向。",()=>{S.flags.division="文科";S.route=S.route||"学业";log("高一下：正式选择文科方向。")}],
    ["选择理科","你正式选择理科方向。",()=>{S.flags.division="理科";S.route=S.route||"学业";log("高一下：正式选择理科方向。")}]
   ]},
   {title:"开学考试",text:"分科后的第一次考试很快到来。新班级、新老师、新的排名方式，让你重新确认自己的位置。",choices:[
    ["认真对待排名","你把每一道能拿的分都尽量拿稳。",()=>{let i=S.stats.intel;S.stats.intel=Math.min(40,i>=20?i+1:i);log(i>=20?"你的基础让开学考试没有那么慌乱。":"你发现分科后的节奏还需要时间适应。")}],
    ["先适应新节奏","你没有因为一次考试就给自己下结论。",()=>{S.flags.examMindset="稳定";log("你决定先观察新学期的学习节奏。")}]
   ]}
 ],
 4:[
   {title:"语文课话剧排练演出",text:"语文老师把课文改成了短剧。几次排练下来，大家已经熟悉了彼此的台词和节奏，最后一天轮到你们正式演出。",choices:[
    ["主动承担重要角色","你把台词和走位提前练了好几遍，正式演出时明显更稳。",()=>{S.flags.drama="主角";S.stats.charm=Math.min(40,S.stats.charm+1);log("话剧演出：你承担了更重要的角色。")}],
    ["负责幕后配合","你把注意力放在道具、提示和其他人的衔接上，演出顺利完成。",()=>{S.flags.drama="幕后";log("话剧演出：你负责幕后配合，整场演出顺利完成。")}]
   ]},
   {title:"周日去南湖公园的游乐园玩",text:"周日一早，你们约在南湖公园的游乐园集合。排队、买饮料、临时改变项目，整整一天几乎没怎么停下来。",choices:[
    ["挑战最刺激的项目","你们排了很久的队，最后一起坐上最刺激的项目。",()=>{S.flags.park="刺激项目";S.stats.health=Math.min(40,S.stats.health+1);log("周日：和同学在南湖公园游乐园玩了一天。")}],
    ["慢慢逛、边走边聊","你没有把一天塞满，反而把大部分时间用来聊天和逛园区。",()=>{let n=randomKnownNPC();if(n){S.npcRelation[n]=(S.npcRelation[n]||0)+1;log("周日：和【"+n+"】边逛边聊，关系更自然了。 ")}S.flags.park="慢逛";log("周日：在南湖公园游乐园慢慢逛了一天。")}]
   ]}
 ],
 5:[
   {title:"文化节",text:"学校开始准备文化节。教室、走廊和操场都被临时改造成活动区域，大家终于有机会把平时的想法真正做出来。",choices:[
    ["负责班级项目","你主动接下一个具体任务，从准备到当天都一直跟进。",()=>{S.flags.festival="班级项目";S.stats.charm=Math.min(40,S.stats.charm+1);log("文化节：你参与了班级项目。")}],
    ["到处帮忙","你没有固定守在一个地方，而是哪里缺人就去哪里搭把手。",()=>{S.flags.festival="到处帮忙";log("文化节：你在不同区域帮了不少忙。")}]
   ]},
   {title:"社团活动周",text:"社团活动周正式开始。你加入的社团终于有了比平时更大的活动空间。",choices:[
    ["把时间留给自己的社团", "你认真参与社团活动，第一次感觉到加入社团之后的生活确实不一样。",()=>{S.flags.clubWeek=S.club||"归宅部";log("社团活动周：你参加了【"+(S.club||"归宅部")+"】的活动。")}],
    ["顺便去看看别的社团", "你在自己的社团之外也逛了一圈，认识了几个其他社团的人。",()=>{S.flags.clubWeek="跨社团";let n=randomKnownNPC();if(n){S.npcRelation[n]=(S.npcRelation[n]||0)+1;log("社团活动周：你和【"+n+"】一起逛了其他社团的活动。 ")}}]
   ]},
   {title:"年级篮球比赛",text:"年级篮球比赛开始了。即使不在场上，整个年级也很快被比赛气氛带动起来。",choices:[
    ["报名上场","你报名参加比赛，真正站进了场地。",()=>{S.flags.basketball="上场";if(S.stats.health>=20||hasTrait("运动少女")){S.stats.health=Math.min(40,S.stats.health+1);log("篮球比赛：你的身体状态让你在场上坚持得不错。")}else log("篮球比赛：你第一次真正感受到体力差距。 ")}],
    ["去看台给同学加油","你没有上场，但从头到尾都在看台上给班级加油。",()=>{S.flags.basketball="观众";S.stats.charm=Math.min(40,S.stats.charm+1);log("篮球比赛：你在看台上和大家一起喊到最后。 ")}]
   ]}
 ],
 6:[
   {title:"科技节",text:"科技节把教学楼前的空地变成了临时展区。各种小制作、实验和展示项目挤在一起。",choices:[
    ["自己动手做一个项目","你从选题到展示都参与，第一次真正体会到把想法做出来有多麻烦。",()=>{S.flags.tech="项目";if(S.stats.intel>=20)S.stats.intel=Math.min(40,S.stats.intel+1);log("科技节：你完成了一个自己的小项目。")}],
    ["负责展示和讲解","你没有负责制作，但把项目讲给路过的同学听了一遍又一遍。",()=>{S.flags.tech="讲解";if(S.stats.charm>=20)S.stats.charm=Math.min(40,S.stats.charm+1);log("科技节：你负责项目展示和讲解。")}]
   ]},
   {title:"学长学姐高考",text:"校门口的气氛突然变得很安静。高三的学长学姐走进考场，校园里少了平时那种喧闹。",choices:[
    ["去给熟悉的学长学姐送祝福","你没有说太多，只认真告诉她们加油。",()=>{S.flags.gaokao="送祝福";let n=S.npcs.find(x=>x==="学姐");if(n)S.npcRelation[n]=(S.npcRelation[n]||0)+2;log("高考季：你给熟悉的学长学姐送上了祝福。")}],
    ["放学后一个人想一会儿","你第一次真切意识到，再过两年站在这里的人就会变成自己。",()=>{S.flags.gaokao="想到未来";S.flags.future=true;log("高考季：你第一次认真想象了两年后的自己。")}]
   ]}
 ],
 7:[
   {title:"一日职业体验",text:"学校安排了一次一日职业体验。你第一次在课堂之外，以一个职业的视角看待一天的工作。",choices:[
    ["选择自己感兴趣的职业","你主动选了一个和自己的兴趣或未来想法有关的岗位。",()=>{S.flags.career="兴趣方向";S.route=S.route||"职业探索";log("职业体验：你选择了和自己兴趣有关的方向。")}],
    ["故意选完全陌生的职业","你想知道，如果暂时不考虑自己擅长什么，现实里的另一种工作到底是什么样。",()=>{S.flags.career="陌生方向";S.route=S.route||"探索";log("职业体验：你体验了一种原本完全陌生的工作。")}]
   ]},
   {title:"期末考试",text:"高一下的第一场期末考试结束。和高一上相比，你已经知道自己应该怎么面对这种连续几天的考试。",choices:[
    ["按自己的节奏完成","你没有临时改变习惯，稳稳把会做的题先拿到手。",()=>{let i=S.stats.intel;if(i>=20)S.stats.intel=Math.min(40,i+1);S.flags.secondFinal="稳定";log("高一下期末：你按自己的节奏完成了考试。")}],
    ["最后再冲一把","你把最后几天能挤出的时间都用上，试图把薄弱部分再补一遍。",()=>{S.flags.secondFinal="冲刺";if(S.stats.health>=20)S.stats.intel=Math.min(40,S.stats.intel+1);else S.stats.health=Math.max(1,S.stats.health-1);log("高一下期末：你最后冲刺了一轮。")}]
   ]}
 ]
};
function birthdayEventIfNeeded(){
 if(S.flags.birthdayShown===S.month)return;
 if(S.birthdayMonth===S.month){S.flags.birthdayShown=S.month;let known=S.npcs.slice(0,4);if(known.length){known.forEach(n=>{S.npcRelation[n]=(S.npcRelation[n]||0)+1});log(`生日到了。${known.join("、")}都发来了生日祝福，你的手机从早上开始就没有安静过。`);}else log("生日到了。虽然还没有认识很多人，但家里人记得很清楚，晚上给你留了一顿饭。");}
}
function startSecondSemesterMonth(){birthdayEventIfNeeded();S.randomDone=false;S.fixedDone=false;document.getElementById("sectionTitle").textContent="本月事件";let list=SECOND_FIXED[S.month];runFixed(list,0);update()}
function showEndMonth2(){
 birthdayEventIfNeeded();
 let b=document.getElementById("choices");b.innerHTML="";document.getElementById("tag").textContent="本月结束";document.getElementById("title").textContent=S.month===7?"高一下学期结束":"这个月的事情告一段落了";document.getElementById("text").textContent=S.month===7?"一学期的生活又翻过去一页。你已经开始看见自己真正想走的方向。":"你收好书包，准备进入下个月。";let n=document.createElement("button");n.className="primary";n.textContent=S.month===7?"查看高一总结":"进入下个月";n.onclick=()=>{n.disabled=true;b.innerHTML="";if(S.month===7)summerBreak();else{S.month++;startSecondSemesterMonth()}};b.appendChild(n);update()
}
function summerRoute(){
 let opts=[];
 let route=S.route||"生活";
 if(route==="学业")opts.push(["为之后的学习方向做准备","你整理资料、错题和暑假的安排，把目标拆成了几件能真正做到的事。",()=>{S.flags.summerRoute="学业准备";S.stats.intel=Math.min(40,S.stats.intel+1);log("暑假安排：你为下一阶段的学习方向做了准备。")}]);
 else if(route==="舞台")opts.push(["练习一个真正想展示的节目","你没有只停留在想法上，而是把练习时间固定下来。",()=>{S.flags.summerRoute="舞台准备";S.stats.charm=Math.min(40,S.stats.charm+1);log("暑假安排：你开始认真准备自己的节目。")}]);
 else if(route==="运动")opts.push(["保持一段稳定的训练","你把训练安排得不夸张，但至少不会三天打鱼两天晒网。",()=>{S.flags.summerRoute="训练";S.stats.health=Math.min(40,S.stats.health+1);log("暑假安排：你保持了自己的运动计划。")}]);
 else if(route==="兴趣")opts.push(["把兴趣做成一个小作品","你决定不只是消费这个兴趣，而是留下一个真正属于自己的成果。",()=>{S.flags.summerRoute="作品";addInterest("个人作品");log("暑假安排：你完成了一个属于自己的兴趣作品。")}]);
 else opts.push(["给自己留一件想做的事","你没有给暑假安排一张密密麻麻的表，只确定了一件真正想完成的事。",()=>{S.flags.summerRoute="个人计划";log("暑假安排：你完成了一件真正想做的事。")}]);
 showChoices("暑假安排","给接下来的高中生活留一件事","暑假开始了。你决定把时间真正花在一件自己选择的事情上。",opts,()=>summerNPC());
}
function summerNPC(){let name=randomKnownNPC();if(!name){showChoices("暑假","假期的一天","没有特别熟悉的同学可以约，你决定自己过一天。",[["出去走走","你沿着熟悉的街区走了一圈。",()=>log("暑假：自己度过了一天。")]],()=>summerFixed());return;}let r=relationLevel(name),place={"大小姐":"商场的甜品店","班长":"旧书店","主人公":"南湖公园","转校生":"学校后门","中二病":"河堤","学姐":"文具店","同人女":"画材店","体育生":"操场"}[name]||"附近的小店";let text=r==="很熟"?`暑假里你和${name}约在${place}。你们已经熟到可以随口吐槽上学期的各种事情。`:r==="关系不错"?`你和${name}约在${place}见面，没过多久就聊起了新学期的打算。`:`你和${name}在${place}碰面。放假以后再次见面，让你意识到这段关系已经和刚认识时不一样了。`;showChoices("暑假 · 人物互动",name,text,[["主动聊最近的生活","你们聊了很久，连开学以后可能参加什么活动都说到了。",()=>{S.npcRelation[name]=(S.npcRelation[name]||0)+2;log("暑假：和【"+name+"】聊了很久，关系继续升温。")}],["一起做点轻松的事","你们没有认真安排主题，只在街区里走走停停。",()=>{S.npcRelation[name]=(S.npcRelation[name]||0)+1;log("暑假：和【"+name+"】一起度过了轻松的一天。")}]],()=>summerFixed())}
function summerFixed(){let pool=[
 {title:"暑假的一场雨",text:"下午突然下起大雨，你和家里人临时改变了原来的计划。",choices:[["在家把喜欢的事做完","雨声盖住了外面的嘈杂，你反而做了很多平时没时间做的事。",()=>log("暑假：一场突然的大雨改变了当天的安排。 ")],["冒雨去买东西","你撑着伞跑了一趟，回来时鞋边全是水。",()=>{S.stats.health=Math.max(1,S.stats.health-1);log("暑假：冒雨出门，回来以后有点着凉。 ")}]]},
 {title:"和家人一起整理房间",text:"假期里家里终于有时间把堆了很久的东西整理一遍。你翻出了高一上学期留下的一些旧物。",choices:[["把高中生活的东西整理好","你把试卷、照片和活动留下的东西分门别类放好。",()=>{addInterest("记录");log("暑假：整理房间时重新看了一遍高一的生活痕迹。")}],["趁机丢掉不需要的东西","你发现很多东西其实已经不会再用到了。",()=>log("暑假：房间清爽了很多。")]]}
];let e=pool[Math.floor(Math.random()*pool.length)];showChoices("暑假",e.title,e.text,e.choices,()=>{S.month=7;finishHighOne();});}
function finishHighOne(){document.getElementById("game").classList.add("hidden");document.getElementById("result").classList.remove("hidden");let s=S.stats,best=Object.keys(S.npcRelation).sort((a,b)=>(S.npcRelation[b]||0)-(S.npcRelation[a]||0))[0]||"暂无";document.getElementById("resultText").innerHTML=`<b>${esc(S.name)}的高一</b><br><br>高一结束时，你已经走过高一上学期、寒假和高一下学期。<br><br>路线：${esc(S.route||"生活")}<br>文理方向：${esc(S.flags.division||"尚未记录")}<br>社团：${esc(S.club||"未加入")}<br>最熟悉的人：${esc(best)}<br><br><b>高一留下的痕迹</b><br>魅力 ${s.charm} · 智力 ${s.intel} · 健康 ${s.health} · 家境 ${s.money}<br><br>特质：${S.traits.map(i=>esc(S.pool[i][0])).join("、")}<br>兴趣：${S.interests.map(esc).join("、")||"无"}<br><br><b>这一年发生过的事</b><br>${esc(S.history.join("；"))}`}
/* 接管12月结束后的流程，但不修改高一上已有事件本身。 */
const _oldStartMonth=startMonth;
function startMonth(){
 birthdayEventIfNeeded();
 if(S.month>=1&&S.month<=8){startSecondSemesterMonth();return;}
 S.randomDone=false;S.fixedDone=false;S.flags.clubOpen=false;document.getElementById("sectionTitle").textContent="本月事件";showRandom(0);update();
}
function showEndMonth(){
 if(S.month===12){S.fixedDone=true;showChoices("高一上学期结束","寒假开始了","期末考试结束后，校园一下子安静下来。你第一次真正拥有一段不用赶着上课和考试的时间。",[["开始寒假","你收好最后一摞书，开始安排这个寒假。",()=>{S.month=1;S.schoolTerm="寒假";log("高一上学期结束，进入寒假。 ")}]],()=>winterRoute());return;}
 document.getElementById("tag").textContent="本月结束";document.getElementById("title").textContent="这个月的事情告一段落了";document.getElementById("text").textContent="你收好书包，准备进入下个月。";let b=document.getElementById("choices");b.innerHTML="";let n=document.createElement("button");n.className="primary";n.textContent="进入下个月";n.onclick=()=>{n.disabled=true;b.innerHTML="";S.month++;startMonth()};b.appendChild(n);update()
}
function finish(){finishHighOne()}


/* ===== 事件顺序修正：每个月固定事件 → 随机事件 ===== */
function startMonth(){
 birthdayEventIfNeeded();
 if(S.month>=3&&S.month<=7){
   startSecondSemesterMonth();
   return;
 }
 S.randomDone=false;
 S.fixedDone=false;
 S.flags.clubOpen=false;
 document.getElementById("sectionTitle").textContent="本月事件";
 runFixed(FIXED[S.month],0);
 update();
}
function runFixed(list,i){
 if(!list || i>=list.length){
   S.fixedDone=true;
   S.randomDone=false;
   showRandom(0);
   return;
 }
 showChoices("固定事件 · "+S.month+"月",list[i].title,list[i].text,list[i].choices,()=>runFixed(list,i+1));
}
function showRandom(slot){
 S.flags.randomSlot=slot;
 if(slot===0){
   let title=["第一次去卢浮宫时，没有什么特别的感觉","食堂最后一排的位置","放学铃响以后","你记住了她的名字"][S.month-9]||"认识一个新同学";
   let name=S.npcOrder[S.npcIndex++]||shuffle(Object.keys(NPCS))[0];
   while(S.npcs.includes(name)){
     let unused=Object.keys(NPCS).filter(x=>!S.npcs.includes(x));
     name=unused.length?shuffle(unused)[0]:shuffle(Object.keys(NPCS))[0];
     if(S.npcs.length>=Object.keys(NPCS).length)break;
   }
   let text=`你在很普通的一天里注意到了${name}。${NPCS[name].desc}\n\n`;
   let choices=[["主动聊两句","你从眼前的小事开始聊。",()=>{}],["顺着话题聊","你没有刻意热情，只是自然地接住了对方的话。",()=>{}]];
   showChoices("随机事件 · 认识同学",title,text,choices,()=>finishNPCMeet(name));
   return;
 }
 let e=getRandomEvent();
 if(!e){
   S.randomDone=true;
   if(S.month>=3&&S.month<=7)showEndMonth2();else showEndMonth();
   return;
 }
 S.used.push(e.key);
 S.history.push(e.title);
 showChoices("随机事件 · 第2次",e.title,e.text,e.choices,()=>{
   S.randomDone=true;
   if(S.month>=3&&S.month<=7)showEndMonth2();else showEndMonth();
 });
}

/* ===== 最终剧情流程与显示修正 ===== */
// 生日不再在月初直接写入记录，而是在固定事件全部结束后，以一个可阅读的事件呈现。
function birthdayEventIfNeeded(){return false;}
function showBirthdayIfNeeded(nextFn){
  if(S.flags.birthdayShown===S.month || S.birthdayMonth!==S.month){nextFn();return;}
  S.flags.birthdayShown=S.month;
  const known=S.npcs.slice(0,5);
  let text=known.length
    ? `早上刚到学校，手机就开始震个不停。你点开消息，才发现今天是自己的生日。${known.length===1?known[0]:known.join("、")}都发来了生日祝福，有人认真写了一大段，有人只丢过来一句“生日快乐”，但看着这些消息，你还是忍不住笑了一下。`
    : `早上醒来，你先看见家里人发来的生日祝福。到了学校以后，手机又陆续多了几条消息。原来有人记得这一天，感觉和普通的上学日不太一样。`;
  showChoices("特别的一天","生日到了",text,[
    ["认真回复每一条祝福","你把收到的消息一条条回过去，没有让任何一句祝福停在已读。",()=>{known.forEach(n=>S.npcRelation[n]=(S.npcRelation[n]||0)+1);S.flags.birthdayMemory="认真回复";log("生日：你认真回复了收到的祝福。");}],
    ["挑几句最想回的","你没有逐条写很长，但把最想说的话好好告诉了对方。",()=>{known.slice(0,2).forEach(n=>S.npcRelation[n]=(S.npcRelation[n]||0)+1);S.flags.birthdayMemory="挑选回复";log("生日：你挑着回复了最重要的祝福。 ");}]
  ],nextFn);
}

// 固定事件中的“人物跟随互动”统一取消；固定事件本身仍保留。
function companion(){return "";}
function fixedResult(style,base){
  let a=[base],c=S.stats.charm,h=S.stats.health,m=S.stats.money,i=S.stats.intel;
  if(style==="社交") a.push(c>=30?"你的魅力让你很容易被别人记住，主动交流也显得自然。":c>=20?"你的魅力让你和别人相处时比较自然。":"你没有急着成为气氛中心，但熟悉以后关系会慢慢稳定下来。");
  else if(style==="探索") a.push(h>=28?"你的精力很好，走了不少路也不觉得累。":h<14?"你走了一阵就有点累，最后缩短了路线。":"你慢慢摸清了校园周边的路线。");
  else if(style==="独处") a.push(h<14?"你最近有些累，这段独处更像是在恢复体力。":"你难得拥有一段完全属于自己的时间。");
  else if(style==="活跃") a.push(c>=28?"你的魅力让你在这种集体活动里很有存在感。":"你没有成为绝对中心，但也自然地融进了热闹的人群。");
  else if(style==="低调") a.push(c<18?"你更习惯站在人群外观察。":c>=28?"你的魅力明明很容易被注意到，却没有让你非得站到最前面。":"你不抢镜，但需要说话的时候也不会躲开。");
  else if(style==="观察") a.push(c>=28?"你的魅力让别人很容易注意到你，同时你也很会观察别人的反应。":c<18?"你没有急着和所有人打招呼，而是先把班里的相处方式看明白了。":"你很快抓到了班级里的几个小圈子。");
  else if(style==="健康") a.push(h>=28?"你的身体状态很好，冷空气反而让你觉得清醒。":h<14?"你比别人更怕冷，回教室以后缓了好一会儿。":"你正常享受了这个冬天的小插曲。");
  else if(style==="学习") a.push(i>=28?"你的智力让你很快抓住重点，复习效率不错。":i>=20?"你的智力让你能找到大部分题目的切入口。":"你需要花更多时间整理基础内容。");
  else if(style==="家境") a.push(m>=28?"家庭条件给了你比较大的选择空间。":m<15?"你会更认真考虑每一笔额外支出。":"你开始学会在想要和必要之间做取舍。");
  return a.join("\n\n");
}
function talentResult(team){
  let a=[];
  if(hasTrait("吉他手")||hasTag("音乐"))a.push("你的乐器经验让节目很稳。");
  if(hasTrait("Kpop")||hasTag("舞蹈"))a.push("你对舞台节奏比较熟。");
  if(hasTrait("校园偶像")||S.stats.charm>=28)a.push("你的魅力让你在台上特别容易被注意到。");
  else a.push("你没有夸张地成为全场焦点，但还是有人记住了这个节目。");
  if(team)a.push("和朋友一起准备节目时，分工和配合反而成了最有意思的一部分。");
  return a.join("\n\n");
}

// 国庆：选择和朋友出去后，根据已经认识的NPC呈现不同地点和情节；结果留在事件面板里。
function nationalDayEvent(){
  const names=S.npcs.length?S.npcs.slice():["主人公"];
  const places={"大小姐":["市中心商场","她先嫌弃商场吵，最后却认真挑了家甜品店。"],"班长":["市图书馆和旧书店","她原本说只是出来买参考书，结果在旧书店翻了两个小时。"],"主人公":["南湖公园","她一到公园就拉着你到处走，连湖边的小摊都不肯放过。"],"转校生":["河堤和旧街区","她不太喜欢人多的景点，反而带你走了一条安静的旧街。"],"中二病":["商业街的游戏厅","她一本正经地说这里是“人界的试炼场”，玩完游戏却认真研究起了奖品。"],"学姐":["市中心步行街","学姐熟门熟路地带你绕开最拥挤的路，还顺便介绍了几家自己常去的小店。"],"同人女":["动漫周边店和画材店","她一路看得眼睛发亮，最后在画材店里认真比较了半天笔。"],"体育生":["南湖公园和运动场","她原本只是约你散步，走着走着又提议去附近活动一下。"]};
  const opts=names.map(n=>{const p=places[n]||["附近的商业街",`${n}和你在附近逛了一圈。`];return [`和${n}一起出去`,`你们最后去了${p[0]}。${p[1]}`,()=>{S.flags.nationalDayFriend=n;S.flags.nationalDayPlace=p[0];S.npcRelation[n]=(S.npcRelation[n]||0)+1;log(`国庆：和【${n}】一起去了${p[0]}。`)}]});
  opts.push(["留一天完全给自己","你睡到自然醒，慢慢做作业，晚上还有时间刷点喜欢的东西。",()=>{S.flags.nationalDayFriend="独处";log("国庆：你给自己留了一整天。 ")}]);
  showChoices("固定事件 · 10月","国庆节假期","国庆假期到了。作业当然不会消失，但至少不用每天六点多起床。群聊里已经有人开始约人出门，南湖公园、商场、旧书店、游戏厅，各自都有自己的计划。",opts,()=>runFixed(FIXED[10],1));return "HANDLED";
}

// 第一学期固定事件增加场景描写，但事件名称、选项和核心事件不删除。
function enhanceFirstSemesterFixed(){
  const f=FIXED;
  f[9][0].text="开学第一天，班主任把名单放在讲台上。一个个陌生名字被念出来，教室里偶尔响起“到”的回答。你抬头看了一圈：有人已经和旁边的人聊起来了，也有人低头整理新课本。这里的每一张脸，可能都会在接下来三年里反复出现。";
  f[9][1].text="接下来的几天，你开始真正认识这所学校。教学楼的楼梯哪一边比较快，食堂什么时候排队最夸张，图书馆哪排座位下午有阳光，医务室在哪一层……这些小事慢慢拼成了你的高中地图。";
  f[9][2].text="放学铃刚响，教学楼前已经被各种招新摊位占满。文学社的桌上堆着校刊，动漫社循环播放着视频，音乐社有人抱着吉他试音，美术社的海报甚至贴到了旁边的树上。你第一次意识到，放学后的时间也可以有完全不同的过法。";
  f[9][3].text="学生会招新的通知贴在公告栏最显眼的位置。有人排队填报名表，有人站在旁边听学姐介绍，还有人只是路过看一眼。你翻了翻报名表，发现上面的活动远比想象中具体：值班、策划、宣传、布置场地，似乎没有哪一项只是写在简历上好看的空话。";
  f[10][0].text="国庆假期终于到了。最后一节课结束时，班级群已经刷出一长串“去哪玩”的消息。有人约南湖公园，有人说去商场，也有人准备回家睡个痛快。你看着手机，决定自己的假期怎么过。";
  f[10][1].text="第一次月考前一天，教室里的空气明显不一样。晚自习结束后，黑板上还留着老师写下的几个重点，走廊里全是对答案和猜排名的声音。第二天试卷发下来时，你第一次真正面对高中阶段的竞争。";
  f[10][2].text="文理分科的讨论终于从“以后再说”变成了需要认真考虑的选择。班主任把各科成绩和往年的情况摊在桌上，家里人也开始问你的想法。你发现，所谓选择方向，并不是填一张表那么简单。";
  f[10][3].text="竞赛招人的教室挤得比平时满。信息学、物理、化学、生物、数学的介绍轮流开始，黑板上写满了看起来陌生的训练计划。有人听得两眼发亮，也有人听了十分钟就开始算自己有没有时间。";
  f[11][0].text="第一场雪是在第二节课间落下来的。起初只是玻璃上多了一层白，没过多久，操场边已经能看见细碎的雪花。有人趴在窗边喊朋友下楼，你也忍不住看了好一会儿。";
  f[11][1].text="11月11日的晚自习前，操场突然传来歌声。没有广播通知，也没有谁站上台主持，只是不知道从哪一排开始，越来越多人跟着唱起了《单身情歌》。老师站在教学楼门口看了一眼，最后也没有赶人。";
  f[11][2].text="才俊杯的报名名单贴出来后，学校像突然多了一块巨大的舞台。有人排练唱歌，有人搬乐器，还有人临时学魔术。你站在后台看着一群平时在课堂里安安静静的人忙得满头大汗，忽然觉得学校里的“同学”还有很多完全不同的样子。";
  f[11][3].text="美术生选拔那天，画室里安静得只剩铅笔摩擦纸面的声音。桌上放着石膏像、画板和计时器，老师来回观察每个人的动作。这里和美术社的随手涂鸦完全不是一回事，你第一次看见“喜欢画画”和“长期训练”之间的距离。";
  f[12][0].text="12月最后一个晚上，班级群从傍晚开始就没停过。有人发倒计时，有人临时约人出去，还有人一边聊天一边赶最后几道期末作业。零点快到的时候，你突然意识到，这竟然已经是高中第一个年头的最后一个晚上了。";
  f[12][1].text="期末复习周像一条慢慢收紧的绳子。黑板上的倒计时每天少一个数字，课桌上的卷子却越来越高。有人在下课铃响后继续讲题，有人在走廊背书，也有人开始计算自己还能睡几个小时。";
  f[12][2].text="第一学期最后一场考试结束。铃声响起后，教室里先是安静了几秒，然后所有人同时开始收东西。走出考场时，冬天的风迎面吹过来，你忽然觉得自己真的已经在这里生活了四个月。";
  f[10][0].choices=[
    ["约朋友出去走走","你打开聊天框，准备看看谁愿意和你一起过这几天假期。",()=>nationalDayEvent()],
    ["留一天完全给自己","你睡到自然醒，慢慢做作业，晚上还有时间刷点喜欢的东西。",()=>fixedResult("独处","你给自己留了一整天，没有被任何人的计划牵着走。")]
  ];
}
enhanceFirstSemesterFixed();

// 月考：保留原事件，只补充明确的成绩结果。
function examResult(later){
  let i=S.stats.intel,h=S.stats.health;
  let score=Math.max(48,Math.min(98,Math.round(58+i*1.05+(h>=28?3:h<14?-4:0)+(hasTrait("认真")||hasTrait("卷王")||hasTrait("天生卷王")?3:0))));
  S.flags.firstMonthlyScore=score;
  let rank=score>=90?"班级前10%":score>=82?"班级前25%":score>=72?"班级前45%":score>=62?"班级前70%":"班级后30%";
  let t=`这次月考你的总评大约是 ${score} 分，位于${rank}。`;
  if(h<12)t+=" 连续考试让你明显有些疲惫。";else if(h>=28)t+=" 你的精神状态很稳定。";
  if(hasTrait("卷王")||hasTrait("天生卷王"))t+=" 你对排名的敏感度比别人更高。";
  if(later)t+=" 你没有立刻盯着排名，反而让这次考试晚一点进入自己的情绪。";
  log(`第一次月考：${score}分，${rank}。`);return t;
}
function finalExamResult(peer){
  let i=S.stats.intel,h=S.stats.health;
  let score=Math.max(50,Math.min(100,Math.round(60+i*1.05+(h>=28?3:h<14?-5:0)+(hasTrait("认真")?3:0)+(hasTrait("完美主义")?2:0))));
  S.flags.firstFinalScore=score;
  let rank=score>=92?"班级前10%":score>=84?"班级前25%":score>=74?"班级前45%":score>=64?"班级前70%":"班级后30%";
  let a=[`期末总评：${score}分，${rank}。`,i>=26?"基础题和大部分常规题你都有切入口。":i>=18?"大部分题目都能找到切入口，只是有几道比较耗时间。":"有些题让你花了不少时间，但你还是尽量完成了。"];
  if(h<14)a.push("连续考试让你明显疲惫，后半程注意力下降了一些。");else if(h>=28)a.push("你的身体状态很好，几场考试下来依然保持稳定。");
  if(peer)a.push("考完和同学对答案以后，你发现大家其实都有几道不确定的题。");
  if(hasTrait("佛系"))a.push("你没有继续折磨自己，很快开始想寒假。");
  if(hasTrait("完美主义"))a.push("你已经开始在脑子里复盘刚才的失误。");
  log(`高一上期末：${score}分，${rank}。`);return a.join("\n\n");
}

// 性格随机事件：第一屏只负责交代场景，不提前把“性格结果”说出来。
function makeTagEvent(t){
  const title=tagTitles[t]||(`“${t}”的一天`);
  const scenes={
    "阴暗b":"午休后的操场很热闹。有人在打球，有人在看台上聊天，远处还有人拿着手机拍视频。你从教学楼走出来，刚好停在这片声音的边缘。",
    "社恐":"午休时间，教室里的人声混在一起。你端着饭盒经过几张已经坐满的桌子，最后在靠窗的位置发现一个空座。",
    "开朗":"课间刚开始，前排有人问你一道题，后排又有人讨论周末去哪儿。原本只有一句话的聊天，很快变成了几个人一起说话。",
    "现充":"放学前，几个人临时讨论周末的安排。群聊里已经有好几个地点被提出来，大家还在争论到底去哪一个。",
    "认真":"班主任临时把一张统计表交给你。表格不复杂，但名单、数字和截止时间一个都不能弄错。",
    "傲娇":"同桌下课前发现自己忘了带尺子。她看了看你的桌面，犹豫了一下才开口问能不能借。",
    "大小姐":"放学后，班级活动临时需要买一些东西。有人开始讨论去哪家店、怎么搬回来，以及预算够不够。",
    "运动少女":"体育课结束的哨声已经响了，操场上的人陆续散开。你站在跑道边，看着还有几个人没有离开。",
    "卷王":"小测成绩刚发下来，前几名已经开始围在一起对错题。你的卷子摊在桌上，旁边还留着几道没想明白的题。",
    "天赋":"老师第一次演示一个新软件。大多数人还在看步骤，你已经可以自己试着点开几个功能。",
    "慢热":"上周刚见过的同学今天又在走廊遇见你。她先停下来，看了你一眼，似乎在犹豫要不要开口。",
    "话痨":"午饭只剩二十分钟。一个话题刚结束，另一个话题又接了上来，桌边的人都还没有起身。",
    "低调":"班级活动报名表传到你桌上。前面已经有不少名字，有人还在讨论谁要不要报名。",
    "好胜心":"体育课分组后，最后一分决定了胜负。周围的人已经开始起哄，场上的人却都还盯着球。",
    "直率":"班主任问大家对新安排有没有意见。教室里安静了几秒，几个人互相看了一眼。",
    "刺头":"班级群里突然发了一条新的周末安排。很多人已经开始抱怨，但具体原因还没有解释。",
    "中二病":"走廊尽头有人正对着窗外认真说话。你走近一点，才发现她正在给今天的天气起一个非常复杂的名字。",
    "校园偶像":"学校活动需要拍一张班级宣传照。摄影同学正在调整站位，大家在教室前后移动了好几次。",
    "摄影爱好者":"下午最后一节课结束，楼梯口的光线刚好落在墙面上。放学的人从光影里不断走过去。",
    "手账少女":"周日晚饭后，你把课程表、作业截止时间和活动通知全部摊在桌面上。下周的安排一下子变得很具体。",
    "猫派":"放学走到校门口，保安室旁边的纸箱里传来一点动静。周围的人都只是路过，没有停下来。",
    "追星族":"午休有人打开手机看演唱会片段。屏幕上的歌手刚出现，旁边几个人已经开始讨论这场演出的细节。",
    "社团狂魔":"一个社团活动刚结束，另一边的群里又发来了新的活动通知。放学后的时间突然被排得很满。",
    "完美主义":"一张已经准备交出去的海报被你发现了一个小地方。别人可能根本不会注意，但你自己看见以后就有点难受。",
    "吃货":"食堂今天换了窗口菜单。几个熟悉的菜都摆在一起，排队的人正一个个往前走。",
    "冰山":"刚认识不久的同学和你打了个招呼。她似乎还没摸清你的脾气，只简单问了一句最近过得怎么样。",
    "外冷内热":"同学把文件落在打印室。你路过时正好看见那份文件还放在机器旁边。",
    "白切黑":"午休时有人突然问起你和另一位同学的关系。她说得很随意，旁边的人却都竖起了耳朵。",
    "钝感力":"班里因为一句玩笑出现了短暂的尴尬。几个人还在猜谁是不是生气了，下一节课的铃声已经响了。",
    "冒失":"晚自习前，你发现有一样东西怎么都找不到。书包、抽屉和桌肚已经被你翻了一遍。",
    "电波":"下午最后一节自习后，天台上暂时没有别人。风从栏杆外吹过来，教学楼里的声音也变得很远。",
    "欧皇":"班里要抽签决定活动位置。大家都在讨论哪几个位置最好，桌上的签已经只剩下一小叠。",
    "非酋":"班里开始抽签决定活动分组。前面的人一个个抽完，桌上的签越来越少。"
  };
  let text=scenes[t]||`放学后的校园里，你遇到了一件很具体的小事。事情不大，却刚好落在你今天的生活里。`;
  return {key:"tag:"+t,title,text,choices:[[tagChoiceA[t]||"顺着事情做下去",tagResultA(t),()=>tagEffect(t)],[tagChoiceB[t]||"换一种处理方式",tagResultB(t),()=>tagEffect(t)]]};
}

// 寒假固定只有一个选项；整个寒假严格为：固定事件 → 自己安排 → NPC互动。
function winterRoute(){
  const best=Object.entries({学业:S.stats.intel,舞台:S.stats.charm,运动:S.stats.health,兴趣:S.interests.length*10+S.stats.charm/2}).sort((a,b)=>b[1]-a[1])[0][0];
  const desc={学业:"整理高一下想重点投入的科目和资料。",舞台:"准备一项高一下想真正参与的校园活动。",运动:"给自己安排一段稳定的运动时间。",兴趣:"把一个真正喜欢的兴趣做成具体的小计划。"}[best];
  showChoices("寒假安排","给高一下留一件事",`寒假开始了。你没有列一长串计划，只决定给高一下留下一件真正想做的事：${desc}`,[
    ["把这件事认真做起来",`你把时间和精力留给了这件事。它不一定马上有结果，但至少在开学以前，你已经迈出了第一步。`,()=>{S.route=best;S.flags.routeWinter=best;S.flags.winterPlan=desc;if(best==="学业")S.stats.intel=Math.min(40,S.stats.intel+1);if(best==="舞台")S.stats.charm=Math.min(40,S.stats.charm+1);if(best==="运动")S.stats.health=Math.min(40,S.stats.health+1);addInterest(best==="兴趣"?"个人兴趣":"高一下计划");log("寒假安排：你给高一下留了一件真正想做的事。 ")}]
  ],()=>winterNPC());
}

// 高一下固定事件：保留原事件名称和选择，但去掉固定事件内部的额外NPC互动。
function sanitizeSecondFixed(){
  SECOND_FIXED[3][0].text="新的学期真正开始了。分科不再只是老师和家长口中的一个话题，今天你要亲手在表格上写下自己的选择。教室里的气氛比平时认真得多。";
  SECOND_FIXED[3][1].text="分科后的第一次考试来得很快。新的同学、新的老师、新的题目风格，让你重新面对一次“我现在到底在哪个位置”的问题。";
  SECOND_FIXED[4][0].text="语文老师把课文改成了短剧。几次排练以后，教室里的桌椅被推到两边，走廊上也开始有人练台词。正式演出的那天，门外甚至站了几位路过的老师。";
  SECOND_FIXED[4][1].text="周日一早，南湖公园的游乐园已经有不少人。排队、买饮料、临时改项目，原本只想玩几个小时的一天最后被拉得很长。";
  SECOND_FIXED[5][0].text="文化节前一周，教学楼里到处都是彩纸、颜料和临时搭出来的展板。平时最普通的教室被一点点改成了另一个样子，大家终于有机会把课堂之外的想法拿出来。";
  SECOND_FIXED[5][1].text="社团活动周正式开始。校园里的公告栏、走廊和操场都被各个社团占满，平时只有固定成员参加的活动也开始对全校开放。";
  SECOND_FIXED[5][2].text="年级篮球比赛开始以后，午休时间的操场几乎总有人。球场上是真正的比赛，看台上则是另一场比赛：谁喊得最大声，谁给自己班加油最卖力。";
  SECOND_FIXED[6][0].text="科技节把教学楼前的空地变成了临时展区。桌上摆着小制作、实验装置和各种看起来很奇怪的模型，路过的人不断停下来问“这是怎么做的”。";
  SECOND_FIXED[6][1].text="高考那几天，学校突然安静了很多。高三教学楼那边的铃声照常响，校门口却多了一种平时没有的紧张感。你站在远处看着学长学姐走进考场，第一次真切意识到高中时间其实过得很快。";
  SECOND_FIXED[7][0].text="学校安排了一次一日职业体验。你第一次暂时离开学生的身份，用一天时间观察一个职业到底在做什么：工作从哪里开始，又在哪里结束。";
  SECOND_FIXED[7][1].text="高一下最后一场考试结束。和上学期相比，你已经知道怎么安排连续几天的考试，也更清楚哪些地方会让自己在最后一场考试里掉链子。";
  SECOND_FIXED[4][1].choices[0][2]=()=>{S.flags.park="刺激项目";S.stats.health=Math.min(40,S.stats.health+1);log("周日：你挑战了南湖公园游乐园里最刺激的项目。")};
  SECOND_FIXED[4][1].choices[1][2]=()=>{S.flags.park="慢逛";log("周日：你在南湖公园游乐园慢慢逛了一天。")};
  SECOND_FIXED[5][1].choices[1][2]=()=>{S.flags.clubWeek="跨社团";log("社团活动周：你顺便看了其他社团的活动。")};
  SECOND_FIXED[6][1].choices[0][2]=()=>{S.flags.gaokao="送祝福";log("高考季：你给熟悉的学长学姐送上了祝福。")};
  SECOND_FIXED[7][1].choices[0][2]=()=>secondFinalResult("稳定");
  SECOND_FIXED[7][1].choices[1][2]=()=>secondFinalResult("冲刺");
}
function secondFinalResult(mode){
  let i=S.stats.intel,h=S.stats.health;
  let score=Math.max(52,Math.min(100,Math.round(62+i*1.02+(h>=28?3:h<14?-5:0)+(mode==="冲刺"?3:0))));
  S.flags.secondFinalScore=score;
  let rank=score>=92?"班级前10%":score>=84?"班级前25%":score>=74?"班级前45%":score>=64?"班级前70%":"班级后30%";
  log(`高一下期末：${score}分，${rank}。`);
  return `高一下期末总评：${score}分，${rank}。${mode==="冲刺"?(h>=20?"最后几天的冲刺确实让你多拿到了一些分数。":"最后的冲刺让你有点累，但总算把考试撑完了。"):"你按自己的节奏完成了考试。"}`;
}
sanitizeSecondFixed();

// 学期结束：先展示“日记式小总结 + 期末成绩”，再进入寒假/暑假。
function semesterDiary(term){
  const first=term==="高一上";
  const score=first?S.flags.firstFinalScore:S.flags.secondFinalScore;
  const scoreText=score?`期末成绩：${score}分`:(first?"期末成绩：暂未记录":"期末成绩：暂未记录");
  const diary=first
    ?`【高一上，学期末】\n今天考完最后一门，走出教学楼的时候，天已经有点冷了。回头想想，九月刚开学的时候，我连食堂从哪边进都不知道，现在却已经知道哪些教室下午会晒到太阳，也知道哪些人见面会主动跟我打招呼。\n\n这四个月好像没发生什么惊天动地的大事，但很多小事已经留下来了。第一次月考、社团招新、操场上的歌声、才俊杯，还有那场第一场雪。原来高中生活不是一下子变得特别精彩，而是每天多认识一点人、多留下几个记得住的下午。`
    :`【高一下，学期末】\n今天终于把最后一张卷子交上去了。比起高一上学期，我已经没有那么慌了。知道什么时候该认真，知道什么时候该停下来，也开始知道自己真正愿意把时间放在哪里。\n\n这一学期有文化节、社团活动周、篮球比赛，也有高考那几天安静得不太真实的校园。站在高一结束的位置回头看，原来一年已经过去了。暑假以后，就要正式成为高二学生了。`;
  showChoices("学期小记",first?"高一上学期结束":"高一下学期结束",`${diary}\n\n${scoreText}`,[
    [first?"开始寒假":"开始暑假",first?"你合上日记本，第一次真正意识到自己已经完成了高一的第一个学期。":"你把这段学期记忆收好。高一下学期结束了，但高一还剩最后一段属于自己的暑假。",()=>{}]
  ],()=>{if(first){S.month=1;S.schoolTerm="寒假";winterFixed()}else{summerRoute()}});
}

// 月份流程：固定事件 → 生日（若有）→ 两次随机事件 → 学期小记。
function startMonth(){
  S.randomDone=false;S.fixedDone=false;S.flags.clubOpen=false;
  document.getElementById("sectionTitle").textContent="本月事件";
  if(S.month>=3&&S.month<=7){startSecondSemesterMonth();return;}
  runFixed(FIXED[S.month],0);update();
}
function runFixed(list,i){
  if(!list||i>=list.length){S.fixedDone=true;showBirthdayIfNeeded(()=>showRandom(0));return;}
  showChoices("固定事件 · "+S.month+"月",list[i].title,list[i].text,list[i].choices,()=>runFixed(list,i+1));
}
function showRandom(slot){
  S.flags.randomSlot=slot;
  if(slot===0){
    let title=["第一次去卢浮宫时，没有什么特别的感觉","食堂最后一排的位置","放学铃响以后","你记住了她的名字"][S.month-9]||"认识一个新同学";
    let name=S.npcOrder[S.npcIndex++]||shuffle(Object.keys(NPCS))[0];
    let unused=Object.keys(NPCS).filter(x=>!S.npcs.includes(x));if(unused.length)name=shuffle(unused)[0];
    let text=`放学以后，你在${name}常出现的地方附近又碰见了她。${NPCS[name].desc}\n\n这次你没有急着离开。周围还有别的同学经过，广播站的声音从教学楼里传出来，整个场景和平时一样嘈杂。`;
    showChoices("随机事件 · 认识同学",title,text,[["主动聊两句","你从眼前的小事开始聊。",()=>{}],["先从共同话题说起","你没有硬找话题，而是从学校里刚发生的事情聊起。",()=>{}]],()=>finishNPCMeet(name));return;
  }
  let e=getRandomEvent();
  if(!e){S.randomDone=true;if(S.month===12)semesterDiary("高一上");else if(S.month>=3&&S.month<=7)showEndMonth2();else showEndMonth();return;}
  S.used.push(e.key);S.history.push(e.title);
  showChoices("随机事件 · 第2次",e.title,e.text,e.choices,()=>{S.randomDone=true;if(S.month===12)semesterDiary("高一上");else if(S.month>=3&&S.month<=7)showEndMonth2();else showEndMonth();});
}
function startSecondSemesterMonth(){S.randomDone=false;S.fixedDone=false;document.getElementById("sectionTitle").textContent="本月事件";runFixed(SECOND_FIXED[S.month],0);update()}
function showEndMonth(){
  if(S.month===12){semesterDiary("高一上");return;}
  let b=document.getElementById("choices");b.innerHTML="";document.getElementById("tag").textContent="本月结束";document.getElementById("title").textContent="这个月的事情告一段落了";document.getElementById("text").textContent="你收好书包，准备进入下个月。";let n=document.createElement("button");n.className="primary";n.textContent="进入下个月";n.onclick=()=>{n.disabled=true;b.innerHTML="";S.month++;startMonth()};b.appendChild(n);update();
}
function showEndMonth2(){
  if(S.month===7){semesterDiary("高一下");return;}
  let b=document.getElementById("choices");b.innerHTML="";document.getElementById("tag").textContent="本月结束";document.getElementById("title").textContent="这个月的事情告一段落了";document.getElementById("text").textContent="你收好书包，准备进入下个月。";let n=document.createElement("button");n.className="primary";n.textContent="进入下个月";n.onclick=()=>{n.disabled=true;b.innerHTML="";S.month++;startSecondSemesterMonth()};b.appendChild(n);update();
}
function finish(){finishHighOne()}

// 寒假固定事件结束后，回到高一下；暑假结束后只做一次高一总结，不再回到7月循环。
function winterFixed(){let e=WINTER_FIXED[Math.floor(Math.random()*WINTER_FIXED.length)];showChoices("寒假固定事件",e.title,e.text,e.choices,()=>winterRoute());}
function summerFixed(){let pool=[
 {title:"暑假的一场雨",text:"下午突然下起大雨，你和家里人临时改变了原来的计划。窗外的雨声一直持续到傍晚。",choices:[["在家把喜欢的事做完","雨声盖住了外面的嘈杂，你反而把平时没时间做的事认真做完了。",()=>log("暑假：一场突然的大雨改变了当天的安排。 ")],["冒雨去买东西","你撑着伞跑了一趟，回来时鞋边全是水。",()=>{S.stats.health=Math.max(1,S.stats.health-1);log("暑假：冒雨出门，回来以后有点着凉。 ")}]]},
 {title:"和家人一起整理房间",text:"假期里家里终于有时间把堆了很久的东西整理一遍。你翻出了高一上学期留下的一些旧物：试卷、活动传单，还有已经有点卷边的照片。",choices:[["把高中生活的东西整理好","你把试卷、照片和活动留下的东西分门别类放好。",()=>{addInterest("记录");log("暑假：整理房间时重新看了一遍高一的生活痕迹。 ")}],["趁机丢掉不需要的东西","你发现很多东西其实已经不会再用到了。",()=>log("暑假：房间清爽了很多。")]]}
 ];let e=pool[Math.floor(Math.random()*pool.length)];showChoices("暑假固定事件",e.title,e.text,e.choices,()=>semesterDiary("高一下"));}
function finishHighOne(){document.getElementById("game").classList.add("hidden");document.getElementById("result").classList.remove("hidden");let s=S.stats,best=Object.keys(S.npcRelation).sort((a,b)=>(S.npcRelation[b]||0)-(S.npcRelation[a]||0))[0]||"暂无";document.getElementById("resultText").innerHTML=`<b>${esc(S.name)}的高一</b><br><br>高一结束时，你已经走过高一上学期、寒假和高一下学期。<br><br>路线：${esc(S.route||"生活")}<br>文理方向：${esc(S.flags.division||"尚未记录")}<br>社团：${esc(S.club||"未加入")}<br>最熟悉的人：${esc(best)}<br><br><b>高一留下的痕迹</b><br>魅力 ${s.charm} · 智力 ${s.intel} · 健康 ${s.health} · 家境 ${s.money}<br><br>特质：${S.traits.map(i=>esc(S.pool[i][0])).join("、")}<br>兴趣：${S.interests.map(esc).join("、")||"无"}<br><br><b>这一年发生过的事</b><br>${esc(S.history.join("；"))}`}


/* ===== 最后一次流程修正 ===== */
function traitEffectText(t){
  const base=tagOutcomes[t]||"事情按照你的选择继续发展。";
  const extra={
    "大小姐":S.stats.money>1?"你的家庭条件让这件事有了更多选择空间。":"你开始更认真地考虑实际花费。",
    "运动少女":S.stats.health>=20?"你的体力让你很快进入状态。":"今天的体力让你不得不控制节奏。",
    "校园偶像":S.stats.charm>=20?"你的魅力让你很容易被人注意到。":"你没有刻意抢镜，但还是有人记住了你。",
    "交际花":S.stats.charm>=20?"你的魅力让你很自然地和不同圈子的人接上话。":"你没有认识所有人，但已经有人主动和你打招呼。",
    "认真":S.stats.intel>=20?"你的智力让你很快抓住了需要注意的细节。":"你多花了一点时间，才把事情理顺。",
    "卷王":S.stats.intel>=20?"你的智力让你很快抓住了重点。":"你把没弄懂的地方记下来，准备之后再补。",
    "天生卷王":S.stats.intel>=20?"你的智力让你很快抓到了关键步骤。":"你没有马上做出来，但已经把思路记下来了。",
    "天赋":"你上手得比预想中快，很快就找到了自己的方法。",
    "社恐":"你没有把自己推到人群中心，但至少找到了舒服的处理方式。",
    "开朗":"你很自然地接住了话题，原本陌生的气氛很快松了下来。",
    "直率":"你没有绕弯子，事情因此很快有了明确的答案。",
    "刺头":"你把觉得不合理的地方直接问了出来，事情也因此得到进一步解释。",
    "慢热":"你没有一下子变得特别熟，但第二次见面确实比第一次自然。",
    "冰山":"你表面上没说太多，不过对方开始意识到你并不是完全不在意。",
    "外冷内热":"你嘴上说麻烦，最后还是把该做的事情做好了。",
    "完美主义":"你在那个小地方上多花了一点时间，直到自己觉得过得去才停下来。",
    "好胜心":"你明显比平时更在意输赢，结束后还在回想哪里可以做得更好。",
    "欧皇":"这一次运气确实站在你这边。",
    "非酋":"结果又一次和你想的不太一样，只能接受这个结果。"
  };
  return base+(extra[t]?"\n\n"+extra[t]:"");
}
function makeTagEvent(t){
  const title=tagTitles[t]||(`“${t}”的一天`);
  const scenes={
    "阴暗b":"午休后的操场很热闹。有人在打球，有人在看台上聊天，远处还有人拿着手机拍视频。你从教学楼走出来，刚好停在这片声音的边缘。",
    "社恐":"午休时间，教室里的人声混在一起。你端着饭盒经过几张已经坐满的桌子，最后在靠窗的位置发现一个空座。",
    "开朗":"课间刚开始，前排有人问你一道题，后排又有人讨论周末去哪儿。原本只有一句话的聊天，很快变成了几个人一起说话。",
    "现充":"放学前，几个人临时讨论周末的安排。群聊里已经有好几个地点被提出来，大家还在争论到底去哪一个。",
    "认真":"班主任临时把一张统计表交给你。表格不复杂，但名单、数字和截止时间一个都不能弄错。",
    "傲娇":"同桌下课前发现自己忘了带尺子。她看了看你的桌面，犹豫了一下才开口问能不能借。",
    "大小姐":"放学后，班级活动临时需要买一些东西。有人开始讨论去哪家店、怎么搬回来，以及预算够不够。",
    "运动少女":"体育课结束的哨声已经响了，操场上的人陆续散开。你站在跑道边，看着还有几个人没有离开。",
    "卷王":"小测成绩刚发下来，前几名已经开始围在一起对错题。你的卷子摊在桌上，旁边还留着几道没想明白的题。",
    "天生卷王":"数学老师讲完一道新题，只给了三分钟让大家自己试。教室里很安静，大家都低头写着草稿。",
    "慢热":"上周刚见过的同学今天又在走廊遇见你。她先停下来，看了你一眼，似乎在犹豫要不要开口。",
    "话痨":"午饭只剩二十分钟。一个话题刚结束，另一个话题又接了上来，桌边的人都还没有起身。",
    "低调":"班级活动报名表传到你桌上。前面已经有不少名字，有人还在讨论谁要不要报名。",
    "好胜心":"体育课分组后，最后一分决定了胜负。周围的人已经开始起哄，场上的人却都还盯着球。",
    "直率":"班主任问大家对新安排有没有意见。教室里安静了几秒，几个人互相看了一眼。",
    "刺头":"班级群里突然发了一条新的周末安排。很多人已经开始抱怨，但具体原因还没有解释。",
    "中二病":"走廊尽头有人正对着窗外认真说话。你走近一点，才发现她正在给今天的天气起一个非常复杂的名字。",
    "校园偶像":"学校活动需要拍一张班级宣传照。摄影同学正在调整站位，大家在教室前后移动了好几次。",
    "摄影爱好者":"下午最后一节课结束，楼梯口的光线刚好落在墙面上。放学的人从光影里不断走过去。",
    "手账少女":"周日晚饭后，你把课程表、作业截止时间和活动通知全部摊在桌面上。下周的安排一下子变得很具体。",
    "猫派":"放学走到校门口，保安室旁边的纸箱里传来一点动静。周围的人都只是路过，没有停下来。",
    "追星族":"午休有人打开手机看演唱会片段。屏幕上的歌手刚出现，旁边几个人已经开始讨论这场演出的细节。",
    "社团狂魔":"一个社团活动刚结束，另一边的群里又发来了新的活动通知。放学后的时间突然被排得很满。",
    "完美主义":"一张已经准备交出去的海报被你发现了一个小地方。别人可能根本不会注意，但你自己看见以后就有点难受。",
    "吃货":"食堂今天换了窗口菜单。几个熟悉的菜都摆在一起，排队的人正一个个往前走。",
    "冰山":"刚认识不久的同学和你打了个招呼。她似乎还没摸清你的脾气，只简单问了一句最近过得怎么样。",
    "外冷内热":"同学把文件落在打印室。你路过时正好看见那份文件还放在机器旁边。",
    "白切黑":"午休时有人突然问起你和另一位同学的关系。她说得很随意，旁边的人却都竖起了耳朵。",
    "钝感力":"班里因为一句玩笑出现了短暂的尴尬。几个人还在猜谁是不是生气了，下一节课的铃声已经响了。",
    "冒失":"晚自习前，你发现有一样东西怎么都找不到。书包、抽屉和桌肚已经被你翻了一遍。",
    "电波":"下午最后一节自习后，天台上暂时没有别人。风从栏杆外吹过来，教学楼里的声音也变得很远。",
    "欧皇":"班里要抽签决定活动位置。大家都在讨论哪几个位置最好，桌上的签已经只剩下一小叠。",
    "非酋":"班里开始抽签决定活动分组。前面的人一个个抽完，桌上的签越来越少。"
  };
  const text=scenes[t]||`放学后的校园里，一件具体的小事刚好落在你今天的生活里。事情不大，但你必须现在做个决定。`;
  return {key:"tag:"+t,title,text,choices:[[tagChoiceA[t]||"顺着事情做下去",tagResultA(t),()=>traitEffectText(t)],[tagChoiceB[t]||"换一种处理方式",tagResultB(t),()=>traitEffectText(t)]]};
}

// 寒假严格顺序：固定事件 → 自己安排 → NPC互动 → 高一下。
function winterNPC(){
  let name=randomKnownNPC();
  if(!name){showChoices("寒假 · 人物互动","一个人的假期","这个寒假你还没有特别熟悉的同学可以约。你给自己留了一段安静的时间。",[["一个人走走","你沿着熟悉的街区走了一圈，也开始想开学后的事情。",()=>{S.flags.winterNPC="独处";log("寒假：自己度过了一段安静的假期。 ")}]],()=>{S.month=3;S.schoolTerm="高一下";startMonth()});return;}
  const place={"大小姐":"商场里的甜品店","班长":"学校旁边的旧书店","主人公":"南湖公园","转校生":"学校后门的小路","中二病":"河堤边","学姐":"初中附近的文具店","同人女":"画材店","体育生":"操场看台"}[name]||"附近的小店";
  const r=relationLevel(name);
  const text=r==="很熟"?`放假以后，你和${name}居然还保持着联系。你们约在${place}见面，刚碰面就聊起了上学期留下来的小事。`:r==="关系不错"?`你和${name}约在${place}见面。放假以后再次见面，学校里的那些话题反而变得更有意思。`:r==="熟悉起来了"?`你和${name}在${place}碰面。比起学期刚开始的时候，现在已经不用费力找话题了。`:`你和${name}约在${place}见面。刚开始还有一点生疏，但对方没有急着结束这次见面。`;
  showChoices("寒假 · 人物互动",name,text,[["聊聊高一下想做什么",`你们聊到开学以后想参加什么、想避开什么，也聊到各自对新学期的期待。`,()=>{S.npcRelation[name]=(S.npcRelation[name]||0)+2;S.flags.winterNPC=name;log("寒假：和【"+name+"】聊了高一下的打算，关系明显更近了。 ")}],["就聊些轻松的",`你们没有认真安排主题，只在街区里走走停停，聊学校里那些不值得写进作业本的小事。`,()=>{S.npcRelation[name]=(S.npcRelation[name]||0)+1;S.flags.winterNPC=name;log("寒假：和【"+name+"】度过了一段轻松的时间。 ")}]],()=>{S.month=3;S.schoolTerm="高一下";log("寒假结束了。新的学期就要开始。 ");startMonth()});
}

// 结束页不再把“高一下结束”重新送回7月，保证流程真正终止。
function finishHighOne(){
  document.getElementById("game").classList.add("hidden");document.getElementById("result").classList.remove("hidden");
  let s=S.stats,best=Object.keys(S.npcRelation).sort((a,b)=>(S.npcRelation[b]||0)-(S.npcRelation[a]||0))[0]||"暂无";
  document.getElementById("resultText").innerHTML=`<b>${esc(S.name)}的高一</b><br><br>这一年从九月开学一直走到了暑假。你认识了新同学，也逐渐形成了自己的生活节奏。<br><br><b>路线</b>：${esc(S.route||"生活")}<br><b>文理方向</b>：${esc(S.flags.division||"尚未记录")}<br><b>社团</b>：${esc(S.club||"未加入")}<br><b>最熟悉的人</b>：${esc(best)}<br><br><b>高一结束时</b><br>魅力 ${s.charm} · 智力 ${s.intel} · 健康 ${s.health} · 家境 ${s.money}<br><br><b>特质</b>：${S.traits.map(i=>esc(S.pool[i][0])).join("、")}<br><b>兴趣</b>：${S.interests.map(esc).join("、")||"无"}<br><br><b>这一年发生过的事</b><br>${esc(S.history.join("；"))}`;
}


function summerFixed(){let pool=[
 {title:"暑假的一场雨",text:"下午突然下起大雨，你和家里人临时改变了原来的计划。窗外的雨声一直持续到傍晚。",choices:[["在家把喜欢的事做完","雨声盖住了外面的嘈杂，你反而把平时没时间做的事认真做完了。",()=>log("暑假：一场突然的大雨改变了当天的安排。 ")],["冒雨去买东西","你撑着伞跑了一趟，回来时鞋边全是水。",()=>{S.stats.health=Math.max(1,S.stats.health-1);log("暑假：冒雨出门，回来以后有点着凉。 ")}]]},
 {title:"和家人一起整理房间",text:"假期里家里终于有时间把堆了很久的东西整理一遍。你翻出了高一上学期留下的一些旧物：试卷、活动传单，还有已经有点卷边的照片。",choices:[["把高中生活的东西整理好","你把试卷、照片和活动留下的东西分门别类放好。",()=>{addInterest("记录");log("暑假：整理房间时重新看了一遍高一的生活痕迹。 ")}],["趁机丢掉不需要的东西","你发现很多东西其实已经不会再用到了。",()=>log("暑假：房间清爽了很多。")]]}
 ];let e=pool[Math.floor(Math.random()*pool.length)];showChoices("暑假固定事件",e.title,e.text,e.choices,()=>finishHighOne());}
