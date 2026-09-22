"use strict";

// 常规特质会成长；角色型隐藏特质只能由两项常规特质与实际经历合成。
const HIDDEN_TRAITS={
 "古明地恋":{enabled:true,sources:["癫佬","电波"],desc:"战斗本能与电波思路混在一起。你会跳过别人以为必需的前因后果，仍可能让人跟不上。"},
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
];

// 活动专属选项拥有自己的判定与结算，不调用被替换选项的效果。
// domains 是必要的语义边界：例如琴弦不会凭空出现在普通考试里。
const TRAIT_ACTIVITY_SETS=[
 {id:"dianlao-activity",trait:"癫佬",resolver:"traitActivity",mode:"battle",stat:"expression",difficulty:8,
  offerChance:.82,cost:{energy:-9,stress:2},tags:["战斗脑","活动"],
  choices:[
   {id:"dian-study-boss",domains:["study"],style:"battle",label:"‘杀杀杀！’把错题拆成这一轮的敌方单位",result:"你在草稿纸上写下作战顺序，逐个攻击真正卡住的知识点。喊得再响，也得自己把步骤算完。"},
   {id:"dian-project-cut",domains:["project","creation"],style:"cut",label:"砍断、切开、剁碎这个卡住的方案",result:"你把废案拆成能单独验证的小块。决斗对象是眼前的问题，没人需要真的挨上一刀。"},
   {id:"dian-match",domains:["competition"],style:"duel",label:"‘战斗，爽！’把这轮比赛当成正式决斗",result:"你按规则确认场地与目标，给自己立下这一回合必须完成的动作。兴奋不能免除体力消耗。"},
   {id:"dian-stage",minLevel:2,domains:["performance"],style:"performance",label:"宣布舞台进入 Boss 战第二阶段",result:"你把上场前的慌乱喊成开战口号，然后按排练过的顺序真正开始。"}
  ]},
 {id:"denpa-activity",trait:"电波",resolver:"traitActivity",mode:"experiment",stat:"creativity",difficulty:8,
  offerChance:.78,cost:{energy:-7,stress:1},tags:["电波","试验"],
  choices:[
   {id:"denpa-study",domains:["study"],style:"premise",label:"假设答案来自另一条路，再把省略的证明补齐",result:"你从一个奇怪的联想往回推。只有把每一步补全，它才算方法，而不是恰好猜中。"},
   {id:"denpa-prototype",domains:["project"],style:"worldline",label:"按另一个版本的设想，先做一块能验证的样品",result:"你给跳跃的念头画出测试边界，决定用一个小样品检查它究竟能不能用。"},
   {id:"denpa-dream",domains:["creation","music"],style:"signal",label:"把那个说不清的片段转成别人能看见或听见的草稿",result:"你试着固定脑内飘过的形状与节奏。素材必须真正留下来，灵感才不只是一句‘我懂了’。"}
  ]},
 {id:"shy-activity",trait:"社恐",resolver:"traitActivity",mode:"rehearse",stat:"expression",difficulty:7,
  offerChance:.76,cost:{energy:-6,stress:2},tags:["社恐","排练"],
  choices:[
   {id:"shy-project-note",domains:["project"],style:"indirect",label:"先写出一份完整交接说明，再决定怎么开口",result:"你把会在说话时漏掉的细节留在纸上。这份说明仍要经得起检查，并不会自动完成全部工作。"},
   {id:"shy-performance",domains:["performance","music"],style:"performance",label:"先完整排练一遍，把最难开口的部分写进提示卡",result:"你没有逼自己突然变得外向，只给下一步留下一条紧张时也找得到的路。"},
   {id:"shy-creation",minLevel:2,domains:["creation"],style:"indirect",label:"做出一个能独立说明想法的小样，先不急着公开",result:"没有旁人即时评价的几分钟里，你把卡住的表达写进作品，再检查它是不是说清了。"}
  ]},
 {id:"guitar-activity",trait:"吉他手",resolver:"traitActivity",mode:"music",stat:"creativity",difficulty:7,
  offerChance:.80,cost:{energy:-7,stress:1},tags:["音乐","练习"],
  choices:[
   {id:"guitar-practice",domains:["music"],style:"music",label:"只练最不稳的四小节，录下来听一次",result:"你没有从头刷一遍熟悉的部分，而是让节拍器和录音暴露真正的问题。"},
   {id:"guitar-live",domains:["performance"],style:"performance",label:"把练过的吉他段落完整弹完，失误后也不重启",result:"你选择一段确实练过的内容。现场不是零成本的能力展示，手和注意力都要坚持到最后。"},
   {id:"guitar-compose",minLevel:2,domains:["creation"],style:"music",label:"写一段有开头和结尾的吉他小曲",result:"你先定下很小的规模，再把和弦、节奏和结尾接在一起。今天要留下的是一段能重放的作品。"}
  ]},
 {id:"perfect-activity",trait:"完美主义",resolver:"traitActivity",mode:"precision",stat:"academic",difficulty:8,
  offerChance:.78,cost:{energy:-10,stress:4},tags:["完美主义","校验"],
  choices:[
   {id:"perfect-study",domains:["study"],style:"precision",label:"把这一类错题逐项验算，直到找出重复出错的原因",result:"你给每一步写上依据。检查比原计划更费时，也让模糊地带逐渐露出边界。"},
   {id:"perfect-project",domains:["project"],style:"precision",label:"为这一版做一张严格但有限的验收清单",result:"你把检查范围限定在这一版，逐项复现最容易出错的地方，不顺手追加新的目标。"},
   {id:"perfect-creation",domains:["creation","music"],style:"redo",label:"把最影响整体的一处重做，再交出这个版本",result:"你只挑一个真正影响完成度的缺口，却仍不得不付出返工的时间与精力。"},
   {id:"perfect-performance",minLevel:2,domains:["performance","competition"],style:"performance",label:"按检查表完整模拟一轮，最后明确停止修改",result:"你试着把标准用于准备，而不是在临场时继续扩大标准。检查越认真，剩下的体力越需要计算。"}
  ]},
 {id:"ice-activity",trait:"冰山",resolver:"traitActivity",mode:"boundary",stat:"expression",difficulty:7,
  offerChance:.76,cost:{energy:-4,stress:-2},tags:["冰山","边界"],
  choices:[
   {id:"ice-project",domains:["project"],style:"direct-help",label:"只接下能按时完成的一小段，把边界写清楚",result:"你去掉含糊的承诺，在可承担的范围内开始工作。进展不会很快，但也没有把别人的任务全部搬到自己身上。"},
   {id:"ice-competition",domains:["competition","performance"],style:"direct",label:"退出无关的热闹，按自己的准备清单做完下一步",result:"你把注意力留给眼前可控的动作。别人如何评价你的冷淡，不能替代这次实际准备。"},
   {id:"ice-creation",minLevel:2,domains:["creation"],style:"direct",label:"不急着解释，先把承诺过的最小版本做出来",result:"你删去宣传与铺垫，把今天能兑现的部分留在作品里。规模很小，却有明确的结束位置。"}
  ]}
];
TRAIT_ACTIVITY_SETS.forEach(set=>{
 set.requiredTags=[];
 set.replaceRoles=["study","project","music","performance","competition","creation","bold","social"];
 set.when=context=>Boolean(context.activityDomain)&&set.choices.some(choice=>choice.domains.includes(context.activityDomain));
 TRAIT_CHOICE_SETS.push(set);
});

const FUSION_RECIPES=[
 {id:"koishi",hidden:"古明地恋",enabled:true,sources:["癫佬","电波"],earliestIndex:16,minEach:4,totalXp:12,minDistinctMonths:12,minNpcs:4,minScenes:3,sharedPositive:true,
  title:"没有人记得第一回合",tag:"隐藏特质 · 合成事件",
  text:"寒假聚会时，你把两把直尺拍在桌上，宣布决斗已经进入第二阶段。奇怪的是，没有人追问第一阶段。有人接过武器，有人开始分析敌方机制，另一边甚至替你补上了不存在的规则。\n\n一路积累的战斗冲动和跳跃电波终于变成了同一种、不再需要解释的行动方式。",
  accept:"省略说明，继续第二阶段",acceptText:"获得隐藏特质【古明地恋】。癫佬与电波仍显示在档案中；社交专属选项由古明地恋接管，学习、项目等普通活动中的原有做法继续保留。两项来源不能再次用于合成。"},
];
