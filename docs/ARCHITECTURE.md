# 当前代码结构（0.6.0）

## 加载与状态

项目使用传统浏览器脚本，直接打开根目录 index.html 即可运行。依赖顺序由该文件明确列出：数据定义 → 状态与判定 → 特质与UI → 事件适配与存档 → 内容数据 → 旧流程 → 三年流程 → 初始化。不要随意调整。

唯一游戏状态为 state.js 中的 S。重要字段：

| 字段 | 含义 |
| --- | --- |
| year / month / calendarIndex | 学年、自然月、34个月中的位置 |
| stats / initialStats | 当前五属性、初始五属性 |
| growth | 能力经验、各学期已经增长的点数 |
| family / resources | 家境；零花钱、精力、压力 |
| npcs / npcRelation / npcTrust | 已认识人物、关系、信任 |
| traitJourneys / traitProgress | 每项成长特质的经验、月份、人物、场景、成功对象与行为风格；兼容进度镜像 |
| hiddenTraits / hiddenTraitSources / fusionHistory | 隐藏特质、来源锁定与合成历史 |
| flags / choiceHistory / memories | 条件、选择记录、重要记忆 |
| project / examArchive | 共同项目、历次考试 |
| habits | 三类习惯、持续月数、变更记录、高三锁定与社交焦点 |
| rumors / forumPosts | 本局已生成的传闻、回应与回调；校园论坛时间线 |
| rng | 种子与当前随机状态 |
| journal / debug | 日志与调试局标记 |

npcFamiliarity 是预留的熟悉度计数，本版未将它做成独立判定轴；特质“已经熟悉”修正读取关系值。旧 `traitMilestones` 字段仍留在新状态中供旧结构辨认，但0.6.0合成只读 `traitJourneys`。

## 三年主流程

life.js 根据 attributes.js 中的 CALENDAR 推进月份：月间收入与恢复 → 可触发的合成事件 → 当月内容 → 生日及人物互动 → 月末或学年小结。

- 高一：保留旧固定事件、路线和随机事件，补充真实效果、外貌场景与八个独立人物初遇。初遇选完即结束，不立即串联第二场人物对话。
- 高二：选择一项项目和三类生活习惯，经历分工、试做、预算、展示与交付；1月、3月可各复盘一次习惯。
- 高三：9月选择优先方向并锁定两类既有习惯，寒假只允许调整剩余一类；经历模拟考试、旧事回收、告别与毕业。
- 假期：一次主要安排与一次人物互动。月份不被跳过，生日和成长仍正常计数。

events-year2.js 是历史文件名，实际保存高一下事件。高二内容位于 life-events.js。

## 生活习惯、论坛与传闻

school-life.js 只保存定义：三个习惯槽、可选习惯、论坛背景帖模板和12条传闻条件。school-life-system.js 负责状态归一化、配置界面、每月效果、高三锁定、论坛生成、传闻回应与人物回调。

习惯每个自然月最多结算一次，flags 中的 `habitsApplied:学年:月份` 防止读档或流程重入重复获益。持续月数达到2才向考试和项目提供稳定加成。更换会清零该槽持续月数，并消耗精力、增加压力；高三被锁定的槽不能更换。

论坛每月从可用模板确定性选两条，不调用主随机源，因此不会因为展示背景帖改变考试或事件骰点。传闻根据存档真实状态按优先级选择，同一存档中同一条只出现一次，两条传闻至少间隔2个月。传闻回应记录在 choiceHistory；后续最多由两个不同NPC提起，防止每次见面重复同一句话。

论坛和传闻都是单局状态，0.6.0没有服务器、全玩家统计或跨周目图鉴。不要把静态模板描述成真实玩家帖子。

share-card.js 从 graduationPortrait 读取最终状态，并在浏览器 Canvas 中生成PNG。图中不存在的内容不得为了排版“补全”；新增毕业字段时应同时更新页面画像、卡片数据测试和绘制逻辑。

## 新事件格式

新增内容优先使用对象格式：

```js
const event = {
  id:"unique-event",
  title:"她需要有人帮忙",
  text:"这件事对她很重要。",
  context:{
    allowTraitChoices:true,
    tags:["npc","social"],
    npc:"班长",
    sceneCategory:"classroom"
  },
  choices:[
    {
      id:"help",
      label:"主动帮忙",
      role:"social",
      replaceable:true,
      text:"你们一起完成了眼前的一小部分。",
      effects:[
        {type:"xp",key:"expression",value:1},
        {type:"resource",key:"energy",value:-4},
        {type:"trust",npc:"班长",value:1}
      ]
    },
    {
      id:"listen",
      label:"先认真听她说",
      protected:true,
      text:"她把没说完的话慢慢说完。",
      effects:[{type:"trust",npc:"班长",value:1}]
    }
  ]
};
runStoryEvent(event, next);
```

效果类型为 xp、resource、relation、trust、flag、interest、project、memory。普通训练只能用前四项属性的 xp；外貌永久改变必须显式走 changeStat 的限幅规则。

事件和选项可提供 condition；动态文字、choices 可为函数。cost 表示付费，余额不足时禁用该选项，内容作者必须提供免费替代方案。check 配置 stat、difficulty、modifiers，outcomes 提供四等级或 success/failure 两分支。

run(action, context) 可接管复杂流程。返回 HANDLED 时，子流程负责展示与继续，并通过 action.next 回到原事件。不要另猜月份或事件索引。

稳定的 event.id 与 choice.id 同时用于选择记录和存档重放，已发布构建不可随意修改这些ID。

## 兼容旧内容

旧三元组选项仍由 showChoices 渲染：

```js
["按钮","默认结果",action => "实际结果",{
  id:"stable-choice",role:"social",replaceable:true
}]
```

固定旧事件的差异效果集中在 LEGACY_FIXED_EFFECTS；路线效果由 routeChoiceEffects 提供。迁移时去掉对应兼容效果，避免结算两次。

成长特质只替换明确标为 replaceable、角色为 social/bold 且未 protected 的选项。没有标记即不替换。原始数组保持不变，替换后的选项不会执行原选项的效果。

trait-choices.js 定义普通和隐藏选项组，以及 `FUSION_RECIPES`。trait-system.js 为每项常规特质隔离成长状态，记录共同成功人物、风格、高压力表演和失败，并由 `fusionEligibility` 检查配方。接受合成后把来源的 `fusedInto` 指向隐藏结果，避免普通来源和隐藏结果同时竞争注入位置。

## 判定与存档

所有正常随机调用经 gameRandom / randomInt / randomItem；不要直接加入 Math.random 或用实时时钟决定中途分支。

当前仍有旧事件闭包，因此存档保存初始配置、随机状态、已执行按钮ID与最终状态校验。读取时从开局确定性重放，重新建立当前按钮与事件闭包，能恢复选择页、结果页和毕业页。不会把 JSON 内容当代码执行。

存档带 schema 与精确版本号，不兼容的版本拒绝读取；重放失败时恢复当前正常游戏。调试局不保存、不覆盖普通存档。后续若改成直接快照，需先将所有流程位置改成可序列化事件ID。

任何改变随机调用次数、ID、效果或状态结构的发布都应升级版本，并决定迁移或明确拒绝旧档，不能沿用版本号却假称兼容。

## 验证入口

- main.js 的 validateGameData：静态数据检查。
- npm test：34组规则回归、8条三年流程和中途/毕业存档重放。
- tools/browser-check.js：可选真实浏览器操作、响应布局和下载检查。
- tools/build-standalone.js：将 CSS/JS 嵌入可独立运行的 HTML。
- GameDebug.getState / validate / traits / fusions：读取调试信息；check / jump / prepareFusion / setStat 会标记调试局。

新增分支应验证实际后果和后续读取，不能仅验证字段写入或文字存在。
