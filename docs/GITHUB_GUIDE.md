# GitHub 新手操作指南

这份指南按“两个人共同维护、仓库已经由其中一人创建”的情况编写。推荐使用 GitHub Desktop，不要求先学命令行。

## 一、先理解四个词

- 仓库（Repository）：GitHub 上的项目文件夹和全部历史。
- 提交（Commit）：一次带说明的存档。
- 分支（Branch）：从当前版本复制出一条独立修改线。
- 拉取请求（Pull Request，简称 PR）：请求把某条分支的修改合并回 `main`。

`main` 可以理解为“当前正式可玩的版本”。不要把尚未测试的代码直接放进去。

## 二、第一次把本项目放进已有仓库

这一步最好由仓库创建者操作。

1. 安装并登录 GitHub Desktop。
2. 在 GitHub Desktop 选择 `File` → `Clone repository`，克隆现有仓库。
3. 在顶部点击 `Current branch` → `New branch`。
4. 分支名称填写：`refactor/split-files`。
5. 在电脑中打开刚克隆的仓库文件夹。
6. 把本压缩包中 `fuzhong-girl-simulator` 文件夹里面的全部内容复制到仓库根目录。
7. 确认最终是“仓库根目录/index.html”，而不是“仓库根目录/fuzhong-girl-simulator/index.html”。
8. 不要删除仓库里的隐藏 `.git` 文件夹；它保存版本历史。
9. 回到 GitHub Desktop，在左侧检查本次新增和修改的文件。
10. Summary 填写：`refactor: split single html into project files`。
11. 点击 `Commit to refactor/split-files`。
12. 点击 `Publish branch`。
13. 点击 `Create Pull Request`，在网页上检查文件后提交 PR。
14. 先试玩，再把 PR 合并到 `main`。

原仓库中的 `index.html` 会被新版替换，但旧单文件已经保存在 `legacy/index-v2-single-file.html`。

### 已经上传过 0.2，怎样更新到 0.3

1. 在 GitHub Desktop 切回 `main`，点击 `Fetch origin`，有 `Pull origin` 时也点击。
2. 新建分支：`feature/trait-choice-injection`。
3. 把 0.3 压缩包中项目文件夹内的全部内容复制到本地仓库根目录，允许同名文件覆盖。
4. 不要动仓库里的隐藏 `.git` 文件夹。
5. 双击 `index.html`，选择“癫佬”试玩；可以运行 Node.js 时再执行 `npm test`。
6. 在 GitHub Desktop 提交，Summary 可写：`feat: add trait-specific choices`。
7. `Publish branch` → `Create Pull Request`；另一人试玩确认后再合并。

### 已经上传过 0.3，怎样更新到 0.4

1. 在 GitHub Desktop 切回 `main`，先 `Fetch origin` / `Pull origin`。
2. 新建分支：`feature/vertical-slice-v0.4`。
3. 把 0.4 压缩包内项目文件夹中的全部内容复制到仓库根目录，覆盖同名文件；不要删除 `.git`。
4. 重点试玩三件事：普通癫佬大失败、九十月阶段小结、月考与期末考试。
5. 有 Node.js 时运行 `npm test`；三条流程都通过后再提交。
6. Commit Summary 可写：`feat: add resolution system and vertical slice`。
7. 推送、创建 PR，让另一人至少用不同开局再玩一次九、十月后合并。

## 三、邀请另一位合作者

由仓库创建者进入 GitHub 仓库：

1. 打开 `Settings`。
2. 找到 Collaborators 或 Access 相关页面。
3. 邀请另一人的 GitHub 账号。
4. 对方接受邀请后，就可以通过 GitHub Desktop 克隆并推送分支。

如果暂时不想授予写入权限，也可以让对方 Fork；但对只有两个人的小项目，直接作为协作者更容易理解。

## 四、以后每次修改都按这个循环

### 开始前

1. 打开 GitHub Desktop。
2. 切换到 `main`。
3. 点击 `Fetch origin`；出现 `Pull origin` 时继续点击，让本地跟线上一致。
4. 从最新 `main` 新建分支。

分支名建议：

- 修错误：`fix/choice-result`
- 新功能：`feature/save-system`
- 新内容：`content/npc-names`
- 整理代码：`refactor/event-engine`
- 文档：`docs/update-roadmap`

### 修改后

1. 双击 `index.html` 试玩相关内容。
2. 如果安装了 Node.js，运行 `npm test`。
3. 在 GitHub Desktop 查看 Changes，确认没有误改无关文件。
4. 写清楚 Commit Summary，例如：`content: add two September club events`。
5. Commit、Push/Publish，然后创建 Pull Request。
6. 让另一人查看 Files changed，并在本机试玩。
7. 确认后 Merge。

## 五、怎样避免两个人互相覆盖

- 一次 PR 只解决一类问题。
- 开始前在聊天里说清楚自己正在修改哪些文件。
- 尽量不要两个人同时修改 `src/core/game.js`。
- 内容工作可以分开：一人修改 `npcs.js`，另一人修改某个年份的事件文件。
- PR 尚未合并时，不要在同一分支开始完全无关的新功能。
- 出现冲突时不要随便点“Accept all”；先确认两边各自改了什么。

## 六、让 GitHub Pages 显示游戏

仓库所有者可以进入：

1. `Settings` → `Pages`。
2. Source 选择 `Deploy from a branch`。
3. Branch 选择 `main`。
4. Folder 选择 `/(root)`。
5. 保存并等待 GitHub 给出访问地址。

本项目没有构建步骤；`index.html` 位于根目录，因此适合直接发布。

## 七、让 AI 修改项目时怎么说

不要说：“继续完善这个游戏，把恋爱、三年和结局都做完。”

建议使用这样的任务格式：

```text
请在当前分支完成一个单独任务：修复特质事件的第二选项结果。
允许修改：src/core/ui.js、src/data/random-events.js。
不要修改：页面样式、固定事件文本、NPC 名单。
完成后运行 npm test，并告诉我修改了哪些文件、测试结果是什么。
```

AI 完成后也要查看 GitHub Desktop 的 Changes。提交历史能帮你们回到旧版本，但前提是修改被拆成容易理解的小步。

## 八、犯错了怎么办

- 还没 Commit：在 GitHub Desktop 中逐个查看改动，确认后再撤销对应文件。
- 已 Commit、未合并：继续在同一分支修正，再提交一次。
- PR 有问题：先不要 Merge，继续修改该分支。
- 已经合并：新建 `fix/...` 分支修复；不要直接删除一大批历史文件。
- 完全不确定：停止操作，保存报错截图和分支名，再请另一人检查。

Git 的价值不是“永远不犯错”，而是让每次错误都有清楚、可恢复的边界。
