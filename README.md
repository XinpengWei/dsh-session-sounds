# Session Sounds

用声音告诉你会话发生了什么：**任务跑完**、**等待你确认或回答**、**会话报错**，各用一种提示音；也可以把同样的提醒推到手机（微信，或 ntfy）。

## 功能

- **实时监听所有会话**：Host 端订阅会话状态与审批 / 提问事件，页面每秒轮询一次新提醒（同时保留 SSE 接口），桌面 App 与浏览器都能收到。
- **三种提示音**：结束（上行两音）、需要输入（三连音）、出错（下行低音），全部用 Web Audio 实时合成，不依赖音频文件。
- **提醒卡片**：窗口右下角短暂显示会话标题与原因，点击关闭。
- **手机推送**：支持微信（PushPlus / Server酱）和 ntfy。微信走公众号系统通知，锁屏也能收到；Host 直接发送，页面关着也不影响。
- **设置页**：位于设置 → 音效提醒，有总开关、事件类型开关、音量、包含子代理、关闭提醒卡片、试听、发送测试提醒，以及手机推送配置。
- **多标签页只响一次**：使用 Web Locks（回退到 localStorage 租约）选出播放者，避免重叠。
- **跟随语言**：中文 / English，随界面语言切换。

## 手机推送

### 微信（推荐）

微信推送走服务号的系统通知，不依赖手机上的常驻连接，锁屏后也能收到。

**PushPlus**

1. 在电脑浏览器打开 [pushplus.plus](https://www.pushplus.plus/)，用微信扫码登录，并按提示关注公众号。
2. 在页面里复制 token。
3. 打开 DSH 的 **设置 → 音效提醒 → 手机推送 → 推送方式**，选“微信 · PushPlus”，把 token 粘贴到输入框。
4. 勾选要推送的事件（结束 / 需要输入 / 出错），按需打开“包含子代理”，点“保存”，再点“发送测试推送”。
5. 微信的“服务通知”里出现测试消息即打通。

**Server酱**

1. 打开 [sct.ftqq.com](https://sct.ftqq.com/)，微信扫码登录并关注方糖服务号。
2. 复制 SendKey。
3. 在插件里选“微信 · Server酱”，粘贴 SendKey，保存并测试。

PushPlus 和 Server酱都有免费额度；额度用完或 token 失效时，设置页的“最近一次手机推送”会显示失败原因，不影响桌面音效。

> **想要系统通知横幅**：PushPlus 的“微信渠道”只会出现在微信服务号里，不一定弹横幅。安装 PushPlus 官方 App（同一微信账号登录），在“个人中心 → 功能设置 → 微信渠道消息转发”里开启转发到 App，并允许 App 通知；之后插件发的消息会同步到 App，由手机厂商推送通道弹出。  
> **PushPlus 返回“服务端验证错误”**：通常是同一标题和内容被重复发送（接口返回码 999，`data` 为“请勿频繁推送相同内容”）。插件已给每条消息加上毫秒时间戳，并优先展示 `data` 中的具体原因，不需要重新生成 token。

### ntfy（可选）

1. 在手机安装 [ntfy](https://ntfy.sh/)，订阅一个 topic，服务器保持默认 `https://ntfy.sh`。
2. 在插件里把“推送方式”切到 ntfy，服务器填 `https://ntfy.sh`，topic 填手机上订阅的同一个名字（可点“随机生成”）。
3. 保存后发送测试推送。

topic 相当于密码：知道它的人都能读和发。请使用随机、不可猜的名字。ntfy 依赖手机与服务器的常驻连接，Android 省电策略可能把它杀掉；如果通知需要手动刷新才能收到，请改用上面的微信通道。

## 安装

本插件以 bundle 形式安装到当前 profile：在 Harness 中使用 `plugin_manager`（`action: install_bundle`，`target` 指向本仓库目录），或把包加入 profile 的 `dsh.profile.bundles` 后重启。安装后新 bundle 通过 HMR 生效。替换已安装的同名包后，在插件管理里禁用再启用该插件即可让 Host 重新加载（或直接重启 Host）；客户端代码更新后刷新页面即可。

如果你本机还装着开发版 `@local/dsh-session-sounds`，请先卸载或禁用开发版：两个 bundle 的 patch id 都是 `session-sounds`，同时启用会冲突。

## 结构

| 文件 | 作用 |
| --- | --- |
| `index.js` | Host 半：监听 `api-session/status`、`api-session/error`、`approval/request`、`user-questions/request`，维护运行状态与最近 200 条提醒，提供 `/api/session-sounds/poll`（轮询）、`/api/session-sounds/stream`（SSE，保留）、`/api/session-sounds/test`、`/api/session-sounds/push`、`/api/session-sounds/push/test`；推送支持 ntfy、PushPlus、Server酱。 |
| `client.js` | 页面半：fetch 轮询订阅、Web Audio 合成、提醒卡片、设置页（含手机推送表单，可切换 ntfy / 微信）。 |
| `locale/*.json` | 插件标题与描述（中 / 英）。 |
| `icon.svg` | 插件图标。 |
| `cordis.patch.yml` | bundle 插入声明。 |

## 行为细节

- 只有 `running: true → false` 才算“结束”；插件启动时已经在运行的会话不会误报。
- 审批 / 提问会延迟 900ms 再响：自动策略立即放行的请求不会打扰你。
- 子代理默认不提醒，可在设置中打开（声音和推送分别过滤）。
- 浏览器要求页面至少被点击一次后才允许播放声音；设置页会显示音效引擎状态。
- 推送配置保存在 `$DSH_PROFILE_DIR/session-sounds.push.json`；如果该环境变量没有设置，则退回 `$DSH_HOME/session-sounds.push.json`（本机实际为 `~/.dsh/session-sounds.push.json`），权限 0600。配置里含 `provider`（`ntfy` / `pushplus` / `serverchan`）与对应凭据。因为推送由 Host 发出，不依赖页面是否打开。
- 推送失败不会影响声音提醒；设置页会显示最近一次推送的 HTTP 状态或错误。

## 依赖

Host 侧只依赖内置的 `webServer` 服务，推送使用 Node 内置 `fetch`；页面侧使用 `slots` 与 `locale`，不导入任何 Harness Client 包。
