"use strict";

// 常规特质会成长；角色型隐藏特质只能由两项常规特质与实际经历合成。
const HIDDEN_TRAITS={
 "古明地恋":{sources:["癫佬","电波"],desc:"战斗本能与电波思路混在一起。你会跳过别人以为必需的前因后果，仍可能让人跟不上。"},
 "后藤独":{sources:["社恐","吉他手"],desc:"越难当面说出的话，越可能从琴弦与舞台缝隙里被听见；登台依然要付出压力。"},
 "雪之下雪乃":{sources:["完美主义","冰山"],desc:"冷静、准确，也会直接伸手解决问题；正确不等于总能照顾到关系。"}
};

const TRAIT_LEVEL_THRESHOLDS=[0,4,8];

const TRAIT_CHOICE_SETS=[
 {
  id:"dianlao",trait:"癫佬",resolver:"traitNpc",requiredTags:["npc","social"],offerChance:.82,
  replaceRoles:["bold","social"],stat:"expression",difficulty:8,cost:{energy:-3,stress:1},
  relation:{failure:-3,setback:-1,success:1,great:2},tags:["决斗","战斗脑"],
  choices:[
   {id:"dian-kill-list",minLevel:1,style:"battle",label:"指着那叠麻烦：‘杀杀杀杀杀！先把它杀完。’",result:"你把待办事项逐项划成敌方单位，语气像是下一秒就要发起总攻。"},
   {id:"dian-duel",minLevel:1,style:"duel",label:"要求她报上名来，正式提出决斗",result:"你退后半步，郑重邀请她为这场分歧选择时间、地点和裁判。"},
   {id:"dian-round-one",minLevel:1,style:"duel",label:"把这次普通分歧宣布为第一回合",result:"你在桌面划出界线，宣布铃响以前谁也不许逃离战场。"},
   {id:"dian-rulers",minLevel:2,style:"weapon",label:"抽出两把直尺，请她选择武器",result:"你把较长的那把先推给她，并强调这是一场公平的决斗。"},
   {id:"dian-boss",minLevel:2,style:"battle",label:"宣布事情进入 Boss 战第二阶段",result:"你迅速总结敌方机制。没有人知道第一阶段是什么时候结束的。"},
   {id:"dian-cut",minLevel:3,style:"cut",label:"把失败方案砍断、切开、剁碎，再重新拼起来",result:"你对着废案做出完整处决动作，然后真的从碎片里挑出一段还能用的办法。"},
   {id:"dian-rival",minLevel:3,style:"duel",label:"指定她为宿敌，约定下次再战",result:"你把约定写得像战书，连下次见面的教室都变成了决战地点。"}
  ]
 },
 {
  id:"denpa",trait:"电波",resolver:"traitNpc",requiredTags:["npc","social"],offerChance:.78,
  replaceRoles:["bold","social"],stat:"creativity",difficulty:7,cost:{energy:-1,stress:1},
  relation:{failure:-2,setback:-1,success:1,great:2},tags:["电波","跳跃思路"],
  choices:[
   {id:"denpa-premise",minLevel:1,style:"premise",label:"回答她还没来得及问出口的前提",result:"你从结论开始解释。她花了一会儿才找出你究竟跳过了哪三步。"},
   {id:"denpa-signal",minLevel:1,style:"signal",label:"确认这里的信号是否也传到了她那里",result:"你认真描述刚才一闪而过的感觉，仿佛两个人只是接收到了同一段讯号。"},
   {id:"denpa-worldline",minLevel:2,style:"worldline",label:"按另一条世界线里的共同经历继续聊",result:"你自然地提起一段并不存在的往事，等待她决定要不要沿着它走。"},
   {id:"denpa-gap",minLevel:2,style:"premise",label:"把中间过程全部省略，直接交出答案",result:"答案意外地能用。至于你怎么抵达这里，连你自己也没有打算补充。"},
   {id:"denpa-frequency",minLevel:3,style:"signal",label:"把她的沉默当成换频，重新校准对话",result:"你换了一套别人听起来更奇怪、她却恰好能理解的说法。"}
  ]
 },
 {
  id:"social_anxiety",trait:"社恐",resolver:"traitNpc",requiredTags:["npc","social"],offerChance:.76,
  replaceRoles:["bold","social"],stat:"expression",difficulty:7,cost:{energy:-1,stress:2},
  relation:{failure:-1,setback:0,success:1,great:2},tags:["社恐","间接表达"],
  choices:[
   {id:"shy-message",minLevel:1,style:"indirect",label:"先把想说的话打在手机上给她看",result:"隔着同一张桌子，你把屏幕推过去。至少这一次，句子没有卡在喉咙里。"},
   {id:"shy-task",minLevel:1,style:"shared-task",label:"找一件可以并排做的事，再慢慢开口",result:"不用一直对视以后，你终于能从眼前的事情聊到真正想问的部分。"},
   {id:"shy-rehearse",minLevel:2,style:"rehearsal",label:"按脑内排练过七次的版本说出来",result:"第三句和计划不同，你差点停下，却还是把最重要的一句留在了空气里。"},
   {id:"shy-honest",minLevel:2,style:"indirect",label:"承认自己现在很紧张，请她等十秒",result:"十秒并没有让紧张消失，但她真的没有催。"},
   {id:"shy-small",minLevel:3,style:"shared-task",label:"把一大段心意缩成一句能说完的话",result:"句子很短，也不够漂亮。她听见了，而且没有替你补写。"}
  ]
 },
 {
  id:"guitarist",trait:"吉他手",resolver:"traitNpc",requiredTags:["npc","social"],offerChance:.76,
  replaceRoles:["bold","social"],stat:"creativity",difficulty:7,cost:{energy:-3,stress:1},
  relation:{failure:-1,setback:0,success:1,great:2},tags:["音乐","表演"],
  choices:[
   {id:"guitar-chord",minLevel:1,style:"music",label:"用刚练熟的和弦替自己回答",result:"第一遍有点闷，第二遍才像你想说的那句话。她没有打断。"},
   {id:"guitar-rhythm",minLevel:1,style:"music",label:"在桌沿敲出节拍，让她跟上来",result:"普通对话多出了一条节奏。她试着敲回两下，你们终于找到同一个速度。"},
   {id:"guitar-demo",minLevel:2,style:"performance",label:"不解释，直接把还没写完的一段弹给她听",result:"结尾停在最不完整的地方。她没有先评价技巧，只问这一段是不是还会继续。"},
   {id:"guitar-stage",minLevel:2,style:"performance",label:"邀请她做这次小型演出的唯一观众",result:"只有一个观众也足够让手心出汗。你还是把整段弹完了。"},
   {id:"guitar-noise",minLevel:3,style:"performance",label:"让失误留在演奏里，不从头重来",result:"那个杂音没有毁掉后半段。你第一次把不完美的现场完整交给别人。"}
  ]
 },
 {
  id:"perfectionist",trait:"完美主义",resolver:"traitNpc",requiredTags:["npc","social"],offerChance:.76,
  replaceRoles:["bold","social"],stat:"academic",difficulty:7,cost:{energy:-4,stress:3},
  relation:{failure:-2,setback:-1,success:1,great:2},tags:["完美主义","精确"],
  choices:[
   {id:"perfect-audit",minLevel:1,style:"precision",label:"把她的方案逐项检查到没有模糊词",result:"你列出问题、条件和验收标准。方案确实清楚了，空气也明显紧了一点。"},
   {id:"perfect-redo",minLevel:1,style:"redo",label:"提出从头重做，把瑕疵一次清干净",result:"你已经排好重做顺序，只等她决定是否愿意一起付出这段时间。"},
   {id:"perfect-standard",minLevel:2,style:"precision",label:"先把‘做到什么算完成’写下来",result:"你们终于不再争论抽象的好坏，而是面对一条过于具体的标准。"},
   {id:"perfect-own",minLevel:2,style:"direct-help",label:"接下最难校对的部分，但明确最后期限",result:"你没有说全部交给我。你只接下最容易出错的一段，并写清什么时候归还。"},
   {id:"perfect-stop",minLevel:3,style:"direct-help",label:"指出最后一个问题，也决定改完就停",result:"你忍住继续扩大标准的冲动。她第一次相信这件事今晚真的能结束。"}
  ]
 },
 {
  id:"iceberg",trait:"冰山",resolver:"traitNpc",requiredTags:["npc","social"],offerChance:.76,
  replaceRoles:["bold","social"],stat:"expression",difficulty:7,cost:{energy:-1,stress:0},
  relation:{failure:-2,setback:0,success:1,great:2},tags:["冰山","直接"],
  choices:[
   {id:"ice-short",minLevel:1,style:"direct",label:"用最短的句子直接回答",result:"你删掉铺垫，只留下真正的答案。她需要自己判断这是不是拒绝。"},
   {id:"ice-do",minLevel:1,style:"direct-help",label:"不说安慰的话，先把能解决的部分做好",result:"你把结果放在她手边。直到她道谢，你才补了一句“顺手”。"},
   {id:"ice-remember",minLevel:2,style:"direct-help",label:"拿出她上次提过、自己都忘了的东西",result:"你没有解释为什么记得。她看了你一会儿，也没有拆穿那句“碰巧”。"},
   {id:"ice-no",minLevel:2,style:"direct",label:"明确说不，再给一个做得到的替代方案",result:"拒绝没有被包装成含糊的拖延。她不一定高兴，却知道下一步在哪里。"},
   {id:"ice-side",minLevel:3,style:"direct-help",label:"站到她旁边，只说‘我来处理这一半’",result:"你没有承诺一切会好，只把真正能承担的一半拿走。"}
  ]
 },
 {
  id:"koishi",trait:"古明地恋",hidden:true,sources:["癫佬","电波"],resolver:"traitNpc",requiredTags:["npc","social"],offerChance:.86,
  replaceRoles:["bold","social"],stat:"creativity",difficulty:8,cost:{energy:-3,stress:1},
  relation:{failure:-1,setback:0,success:1,great:2},tags:["无意识","决斗电波"],
  choices:[
   {id:"koishi-ruler",style:"weapon",label:"省略宣战，直接把第二把直尺递给她",result:"你已经进入武器选择环节。她接不接，决定这场决斗是否真的存在。"},
   {id:"koishi-phase",style:"worldline",label:"理所当然进入第二阶段，没人记得第一阶段",result:"你熟练说明新机制，仿佛刚才所有人都共同打过一场看不见的战斗。"},
   {id:"koishi-enemy",style:"battle",label:"把眼前问题宣布为共同敌人，从不存在的弱点开始分析",result:"你的弱点分析离奇得过分，却意外绕到了一个真正能动手的办法。"},
   {id:"koishi-cut",style:"premise",label:"砍断绕圈子的话，回答她没问出口的问题",result:"你挥手切断了对话的前半段，把答案放在她还没腾空的位置上。"}
  ]
 },
 {
  id:"bocchi",trait:"后藤独",hidden:true,sources:["社恐","吉他手"],resolver:"traitNpc",requiredTags:["npc","social"],offerChance:.84,
  replaceRoles:["bold","social"],stat:"creativity",difficulty:8,cost:{energy:-4,stress:4},
  relation:{failure:-1,setback:0,success:2,great:3},tags:["舞台","琴弦表达"],
  choices:[
   {id:"bocchi-intro",style:"performance",label:"把自我介绍藏进一段即兴前奏",result:"你没能直视她，却让旋律替你完整地说出了“我也想加入”。"},
   {id:"bocchi-box",style:"indirect",label:"躲在最不显眼的位置完成这次合奏",result:"你没有站到中心，声音却从角落稳稳接住了空下来的那一拍。"},
   {id:"bocchi-mistake",style:"performance",label:"让手抖留在第一小节，然后继续弹",result:"第一小节暴露了全部紧张。第二小节开始，大家却真的跟上了你。"},
   {id:"bocchi-song",style:"music",label:"把没法当面说的话写成只给她听的短歌",result:"歌词绕了很多弯。她听完以后，仍准确指出了你最不敢直说的那一句。"}
  ]
 },
 {
  id:"yukino",trait:"雪之下雪乃",hidden:true,sources:["完美主义","冰山"],resolver:"traitNpc",requiredTags:["npc","social"],offerChance:.84,
  replaceRoles:["bold","social"],stat:"academic",difficulty:8,cost:{energy:-4,stress:2},
  relation:{failure:-2,setback:0,success:2,great:3},tags:["委托","正确与关系"],
  choices:[
   {id:"yukino-diagnose",style:"precision",label:"把问题、责任和可执行部分一次说清",result:"你的分析准确得让人无法躲开，也锋利得不给自尊留下太多缓冲。"},
   {id:"yukino-help",style:"direct-help",label:"拒绝空泛安慰，提出今天能完成的帮助",result:"你没有保证结局，只把第一步整理好，等她决定要不要一起走。"},
   {id:"yukino-boundary",style:"direct",label:"指出她真正需要的不是替做，而是共同承担",result:"你把界线画得很清楚，然后坐在界线这一边陪她处理自己的部分。"},
   {id:"yukino-imperfect",style:"direct-help",label:"允许方案不完美，但不允许它不诚实",result:"你删掉漂亮却做不到的承诺。留下的版本规模更小，终于可以交出去。"}
  ]
 }
];

const FUSION_RECIPES=[
 {id:"koishi",hidden:"古明地恋",sources:["癫佬","电波"],earliestIndex:16,minEach:4,totalXp:12,minNpcs:4,minScenes:3,sharedPositive:true,
  title:"没有人记得第一回合",tag:"隐藏特质 · 合成事件",
  text:"寒假聚会时，你把两把直尺拍在桌上，宣布决斗已经进入第二阶段。奇怪的是，没有人追问第一阶段。有人接过武器，有人开始分析敌方机制，另一边甚至替你补上了不存在的规则。\n\n一路积累的战斗冲动和跳跃电波终于变成了同一种、不再需要解释的行动方式。",
  accept:"省略说明，继续第二阶段",acceptText:"获得隐藏特质【古明地恋】。癫佬与电波仍显示在档案中，但专属选项由新的合成特质接管。"},
 {id:"bocchi",hidden:"后藤独",sources:["社恐","吉他手"],earliestIndex:12,minEach:3,totalXp:10,minNpcs:2,minScenes:2,sharedPositive:true,needsPerformance:true,needsHighStress:true,needsTrusted:true,
  title:"琴弦替你说完的那句话",tag:"隐藏特质 · 合成事件",
  text:"小型演出开始以前，你在后台把自我介绍默念了很多遍。真正走出去时，那几句话还是全部消失了。\n\n于是你低头弹下第一个和弦。紧张没有消失，手也仍在抖；可那个一直见过你逃避和练习的人听懂了，并在下一拍加入。",
  accept:"让第二小节继续下去",acceptText:"获得隐藏特质【后藤独】。社恐与吉他手的普通专属选项由新的角色特质接管；舞台仍会带来真实压力。"},
 {id:"yukino",hidden:"雪之下雪乃",sources:["完美主义","冰山"],earliestIndex:12,minEach:3,totalXp:10,minNpcs:2,minScenes:2,sharedPositive:true,needsAcademic:16,needsDirectHelp:true,needsFriction:true,
  title:"正确答案之外的委托",tag:"隐藏特质 · 合成事件",
  text:"她来找你时，已经听说你总能看见问题，也总会把多余的话删掉。桌上的方案漏洞很多，当事人也并不准备把责任全部交给你。\n\n你第一次没有选择独自修到完美。你指出错误、划清边界，然后问她愿不愿意一起完成剩下的部分。",
  accept:"接下这份有边界的委托",acceptText:"获得隐藏特质【雪之下雪乃】。完美主义与冰山仍是来路，但人物选项由新的合成特质接管；正确也仍可能刺伤关系。"}
];
