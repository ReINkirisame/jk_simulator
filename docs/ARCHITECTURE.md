# 当前代码结构（0.5.0）

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
| traitMilestones | 有效成长月份、遇到的人物、场景种类 |
| flags / choiceHistory / memories | 条件、选择记录、重要记忆 |
| project / examArchive | 共同项目、历次考试 |
| rng | 种子与当前随机状态 |
| journal / debug | 日志与调试局标记 |

npcFamiliarity 是预留的熟悉度计数，本版未将它做成独立判定轴；癫佬“已经熟悉”修正读取关系值。不要把一个仅被记录的字段描述成完整机制。

## 三年主流程

life.js 根据 attributes.js 中的 CALENDAR 推进月份：月间收入与恢复 → 可触发的进化场景 → 当月内容 → 生日及人物互动 → 月末或学年小结。

- 高一：保留旧固定事件、路线和随机事件，补充真实效果与外貌场景。
- 高二：选择一项项目，经历分工、试做、预算、展示与交付；穿插考试和人物互动。
- 高三：长期优先级每月生效，经历模拟考试、旧事回收、告别与毕业。
- 假期：一次主要安排与一次人物互动。月份不被跳过，生日和成长仍正常计数。

events-year2.js 是历史文件名，实际保存高一下事件。高二内容位于 life-events.js。

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

癫佬只替换明确标为 replaceable、角色为 social/bold 且未 protected 的选项。没有标记即不替换。原始数组保持不变，替换后的选项不会执行原选项的效果。

## 判定与存档

所有正常随机调用经 gameRandom / randomInt / randomItem；不要直接加入 Math.random 或用实时时钟决定中途分支。

当前仍有旧事件闭包，因此存档保存初始配置、随机状态、已执行按钮ID与最终状态校验。读取时从开局确定性重放，重新建立当前按钮与事件闭包，能恢复选择页、结果页和毕业页。不会把 JSON 内容当代码执行。

存档带 schema 与精确版本号，不兼容的版本拒绝读取；重放失败时恢复当前正常游戏。调试局不保存、不覆盖普通存档。后续若改成直接快照，需先将所有流程位置改成可序列化事件ID。

任何改变随机调用次数、ID、效果或状态结构的发布都应升级版本，并决定迁移或明确拒绝旧档，不能沿用版本号却假称兼容。

## 验证入口

- main.js 的 validateGameData：静态数据检查。
- npm test：22组规则回归、6条三年流程和中途/毕业存档重放。
- tools/browser-check.js：可选真实浏览器操作、响应布局和下载检查。
- tools/build-standalone.js：将 CSS/JS 嵌入可独立运行的 HTML。
- GameDebug.getState / validate / evolution：读取调试信息；check / jump / prepareChaos / setStat 会标记调试局。

新增分支应验证实际后果和后续读取，不能仅验证字段写入或文字存在。
