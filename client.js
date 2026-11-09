window.__ModuleLoader__.load({
  id: 'dsh-session-sounds',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'session-sounds'
    const SETTINGS_KEY = 'dsh.session-sounds.settings.v1'
    const PLAY_LOCK = 'dsh/session-sounds/play'
    const PLAY_LEASE = 'dsh.session-sounds.playing-at'
    const TEST_PATH = '/api/session-sounds/test'
    const PUSH_PATH = '/api/session-sounds/push'
    const PUSH_TEST_PATH = '/api/session-sounds/push/test'
    const POLL_PATH = '/api/session-sounds/poll'
    const TOAST_MS = 8000
    const TOAST_LIMIT = 3

    const DEFAULTS = Object.freeze({
      enabled: true,
      ended: true,
      input: true,
      error: true,
      subagent: false,
      toast: true,
      volume: 0.55,
    })

    const ZH = {
      'section.title': '音效提醒',
      'section.description':
        '当会话结束、出错，或等待你确认、回答时播放提示音。声音由页面实时合成，不需要额外的音频文件。',
      'section.events': '提醒事件',
      'master.label': '启用音效提醒',
      'master.hint': '总开关；关闭后不再播放会话提示音，也不显示提醒卡片；测试提醒除外',
      'events.ended': '会话结束',
      'events.ended.hint': '任务跑完、被停止或中断时',
      'events.input': '需要你的输入',
      'events.input.hint': '等待确认或回答问题时',
      'events.error': '会话出错',
      'events.error.hint': '会话报告错误时',
      'section.playback': '播放',
      'playback.volume': '音量',
      'playback.volume.hint': '拖动滑块调整提示音音量',
      'playback.subagent': '包含子代理会话',
      'playback.subagent.hint': '子代理结束或等待时也提醒；默认关闭，避免嘈杂',
      'playback.toast': '显示提醒卡片',
      'playback.toast.hint': '在窗口右下角短暂显示提醒内容',
      'section.push': '手机推送',
      'push.provider': '推送方式',
      'push.provider.hint': '微信走公众号系统通知，锁屏也能收到；ntfy 依赖常驻连接',
      'push.provider.ntfy': 'ntfy',
      'push.provider.pushplus': '微信 · PushPlus',
      'push.provider.serverchan': '微信 · Server酱',
      'push.enabled': '启用手机推送',
      'push.enabled.hint': '把提醒发到手机，和音效开关相互独立',
      'push.server': 'ntfy 服务器',
      'push.server.hint': '默认 https://ntfy.sh；自建服务器填根地址',
      'push.topic': '主题（topic）',
      'push.topic.hint': '在手机 ntfy App 中订阅同一个主题；主题相当于密码，建议随机生成',
      'push.topic.random': '随机生成',
      'push.token': '访问令牌（可选）',
      'push.token.hint': '自建服务器开启鉴权时填写，会以 Bearer 方式发送',
      'push.token.pushplus': 'PushPlus token',
      'push.token.serverchan': 'Server酱 SendKey',
      'push.token.hint.wechat': '在对应网站微信扫码登录后复制；只保存在本机',
      'push.help.pushplus':
        '在浏览器打开 https://www.pushplus.plus/，微信扫码登录并关注公众号，然后复制 token。',
      'push.help.serverchan':
        '在浏览器打开 https://sct.ftqq.com/，微信扫码登录并关注方糖服务号，然后复制 SendKey。',
      'push.kinds': '推送这些事件',
      'push.kinds.ended': '会话结束',
      'push.kinds.input': '需要你的输入',
      'push.kinds.error': '会话出错',
      'push.subagent': '包含子代理会话',
      'push.subagent.hint': '子代理结束或等待时也推送；默认关闭',
      'push.save': '保存推送设置',
      'push.saving': '正在保存…',
      'push.saved': '推送设置已保存。',
      'push.save.error': '保存失败',
      'push.test': '测试推送',
      'push.testing': '正在推送…',
      'push.test.ok': '已发送，请查看手机通知。',
      'push.test.error': '推送失败',
      'push.test.missing': '请先填写主题。',
      'push.test.missing.token': '请先填写微信推送 token。',
      'push.loading': '正在读取推送设置…',
      'push.load.error': '无法读取推送设置，请重启 DSH 后再试。',
      'push.last': '最近一次手机推送',
      'push.last.none': '暂无',
      'push.last.ok': '成功',
      'push.last.failed': '失败',
      'push.note.ntfy': '在 Android 上请允许 ntfy 后台运行并关闭电池优化，否则锁屏后可能收不到通知。',
      'push.note.wechat':
        '微信推送由公众号服务发送；若收不到，检查是否关注了服务号，或在微信“服务通知”里查看。',
      'push.error.invalid_server': '服务器地址无效',
      'push.error.invalid_provider': '推送方式无效',
      'push.error.missing_token': '请先填写 token / SendKey',
      'push.error.invalid_topic': '主题只能包含字母、数字、- 和 _，且不超过 64 个字符',
      'push.error.invalid_token': '访问令牌过长',
      'push.error.missing_topic': '请先填写主题',
      'push.error.config_write_failed': '无法写入配置文件',
      'push.error.invalid_json': '请求格式错误',
      'push.error.network_error': '网络错误',
      'push.error.timeout': '请求超时',
      'section.status': '状态',
      'status.connection': '提醒通道',
      'status.connection.connecting': '连接中',
      'status.connection.live': '已连接',
      'status.connection.offline': '已断开，正在重连',
      'status.audio': '音效引擎',
      'status.audio.idle': '待唤醒',
      'status.audio.running': '已就绪',
      'status.audio.suspended': '等待页面交互',
      'status.audio.closed': '已关闭',
      'status.audio.unsupported': '当前环境不支持',
      'status.running': '运行中的会话',
      'status.sessionsUnit': '个',
      'status.last': '最近提醒',
      'status.none': '暂无',
      'preview': '试听',
      'test.title': '测试提醒',
      'test': '发送测试提醒',
      'test.sending': '正在发送…',
      'test.sent': '已发送，请留意提示音。',
      'test.error': '发送失败，请检查提醒通道。',
      'test.hint': '通过真实提醒通道发送一次提醒，同时验证音效与提醒卡片。',
      'reset': '恢复默认设置',
      'note.autoplay':
        '浏览器要求页面至少被点击一次后才允许播放声音；如果试听没有声音，请先点击页面。',
      'unknownSession': '未命名会话',
      'toast.kind.ended': '会话已结束',
      'toast.kind.input': '需要你操作',
      'toast.kind.error': '会话出错',
      'toast.kind.test': '测试提醒',
      'toast.ended.detail': '这一轮已经结束，可以回来查看结果。',
      'toast.approval.detail': '等待你的确认',
      'toast.question.detail': '等待你的回答',
      'toast.error.detail': '会话遇到了错误。',
      'toast.test.title': '提醒通道工作正常',
      'toast.test.detail': '听到提示音，说明音效已生效。',
      'toast.dismiss': '点击关闭',
    }

    const EN = {
      'section.title': 'Sound alerts',
      'section.description':
        'Play a chime when a session finishes, fails, or waits for your confirmation or answer. Every sound is synthesized in the page — no audio files involved.',
      'section.events': 'Events',
      'master.label': 'Enable sound alerts',
      'master.hint': 'Master switch; when off, session alerts stay silent (test alerts still play)',
      'events.ended': 'Session finished',
      'events.ended.hint': 'The task completed, stopped, or was interrupted',
      'events.input': 'Input needed',
      'events.input.hint': 'Waiting for your approval or answer',
      'events.error': 'Session error',
      'events.error.hint': 'The session reported an error',
      'section.playback': 'Playback',
      'playback.volume': 'Volume',
      'playback.volume.hint': 'Drag to set the alert volume',
      'playback.subagent': 'Include subagents',
      'playback.subagent.hint': 'Also alert when a subagent finishes or waits; off by default to avoid noise',
      'playback.toast': 'Show alert cards',
      'playback.toast.hint': 'Briefly show the alert in the bottom-right corner',
      'section.push': 'Phone push',
      'push.provider': 'Delivery method',
      'push.provider.hint': 'WeChat uses service-account system notifications, which survive the lock screen; ntfy needs a live connection',
      'push.provider.ntfy': 'ntfy',
      'push.provider.pushplus': 'WeChat · PushPlus',
      'push.provider.serverchan': 'WeChat · Server酱',
      'push.enabled': 'Enable phone push',
      'push.enabled.hint': 'Send alerts to your phone; independent of the sound switches',
      'push.server': 'ntfy server',
      'push.server.hint': 'Defaults to https://ntfy.sh; use the root URL of a self-hosted server',
      'push.topic': 'Topic',
      'push.topic.hint': 'Subscribe to the same topic in the ntfy app; the topic acts as a password, so randomize it',
      'push.topic.random': 'Randomize',
      'push.token': 'Access token (optional)',
      'push.token.hint': 'For self-hosted servers with auth; sent as a Bearer token',
      'push.token.pushplus': 'PushPlus token',
      'push.token.serverchan': 'Server酱 SendKey',
      'push.token.hint.wechat': 'Sign in with WeChat on the service site, then copy the value; stored only on this machine',
      'push.help.pushplus':
        'Open https://www.pushplus.plus/ in a browser, sign in with WeChat, follow the service account, then copy the token.',
      'push.help.serverchan':
        'Open https://sct.ftqq.com/ in a browser, sign in with WeChat, follow the service account, then copy the SendKey.',
      'push.kinds': 'Push these events',
      'push.kinds.ended': 'Session finished',
      'push.kinds.input': 'Input needed',
      'push.kinds.error': 'Session error',
      'push.subagent': 'Include subagents',
      'push.subagent.hint': 'Also push when a subagent finishes or waits; off by default',
      'push.save': 'Save push settings',
      'push.saving': 'Saving…',
      'push.saved': 'Push settings saved.',
      'push.save.error': 'Could not save',
      'push.test': 'Send test push',
      'push.testing': 'Sending…',
      'push.test.ok': 'Sent — check your phone.',
      'push.test.error': 'Push failed',
      'push.test.missing': 'Enter a topic first.',
      'push.test.missing.token': 'Enter the WeChat token first.',
      'push.loading': 'Loading push settings…',
      'push.load.error': 'Could not load push settings; restart DSH and try again.',
      'push.last': 'Last phone push',
      'push.last.none': 'None yet',
      'push.last.ok': 'Delivered',
      'push.last.failed': 'Failed',
      'push.note.ntfy': 'On Android, allow ntfy to run in the background and disable battery optimization, or notifications may stop when the screen is locked.',
      'push.note.wechat':
        'WeChat delivers through its service account; if nothing arrives, check that you followed the account and look under Service Notifications.',
      'push.error.invalid_server': 'Invalid server URL',
      'push.error.invalid_provider': 'Invalid delivery method',
      'push.error.missing_token': 'Enter the token / SendKey first',
      'push.error.invalid_topic': 'The topic may only contain letters, digits, - and _, up to 64 characters',
      'push.error.invalid_token': 'The access token is too long',
      'push.error.missing_topic': 'Enter a topic first',
      'push.error.config_write_failed': 'Could not write the config file',
      'push.error.invalid_json': 'Malformed request',
      'push.error.network_error': 'Network error',
      'push.error.timeout': 'Request timed out',
      'section.status': 'Status',
      'status.connection': 'Alert channel',
      'status.connection.connecting': 'Connecting',
      'status.connection.live': 'Connected',
      'status.connection.offline': 'Disconnected, retrying',
      'status.audio': 'Audio engine',
      'status.audio.idle': 'Not started',
      'status.audio.running': 'Ready',
      'status.audio.suspended': 'Waiting for a click',
      'status.audio.closed': 'Closed',
      'status.audio.unsupported': 'Unsupported here',
      'status.running': 'Sessions running',
      'status.sessionsUnit': 'active',
      'status.last': 'Last alert',
      'status.none': 'None yet',
      'preview': 'Preview',
      'test.title': 'Test alert',
      'test': 'Send a test alert',
      'test.sending': 'Sending…',
      'test.sent': 'Sent — listen for the chime.',
      'test.error': 'Could not send; check the alert channel.',
      'test.hint': 'Send one alert through the real channel to verify both the sound and the card.',
      'reset': 'Restore defaults',
      'note.autoplay':
        'Browsers allow sound only after the page has been clicked once. If a preview is silent, click the page first.',
      'unknownSession': 'Untitled session',
      'toast.kind.ended': 'Session finished',
      'toast.kind.input': 'Your input is needed',
      'toast.kind.error': 'Session error',
      'toast.kind.test': 'Test alert',
      'toast.ended.detail': 'The turn finished — come back to check the result.',
      'toast.approval.detail': 'Waiting for your approval',
      'toast.question.detail': 'Waiting for your answer',
      'toast.error.detail': 'The session hit an error.',
      'toast.test.title': 'The alert channel works',
      'toast.test.detail': 'If you heard the chime, sound alerts are live.',
      'toast.dismiss': 'Click to dismiss',
    }

    const SOUNDS = {
      ended: [
        { freq: 659.25, at: 0, dur: 0.24, gain: 0.15, type: 'sine' },
        { freq: 987.77, at: 0.16, dur: 0.5, gain: 0.13, type: 'sine' },
        { freq: 1975.53, at: 0.16, dur: 0.36, gain: 0.025, type: 'sine' },
      ],
      input: [
        { freq: 880, at: 0, dur: 0.16, gain: 0.11, type: 'triangle' },
        { freq: 1174.66, at: 0.13, dur: 0.16, gain: 0.11, type: 'triangle' },
        { freq: 1567.98, at: 0.26, dur: 0.42, gain: 0.12, type: 'triangle' },
      ],
      error: [
        { freq: 392, at: 0, dur: 0.3, gain: 0.12, type: 'triangle' },
        { freq: 261.63, at: 0.22, dur: 0.55, gain: 0.12, type: 'triangle' },
      ],
    }

    const CSS = `
.dss-root {
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 22px;
}
.dss-description {
  margin: 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  line-height: 20px;
}
.dss-group {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.dss-group-title {
  padding: 12px 0 2px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.dss-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 0;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.dss-row:last-child {
  border-bottom: none;
}
.dss-row-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.dss-label {
  font-size: 14px;
  line-height: 22px;
}
.dss-hint {
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
}
.dss-row-control {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}
.dss-switch {
  appearance: none;
  -webkit-appearance: none;
  position: relative;
  width: 34px;
  height: 20px;
  margin: 0;
  border-radius: 999px;
  border: 1px solid transparent;
  background: var(--dsw-alias-border-l2);
  cursor: pointer;
  transition: background 140ms ease;
  flex: none;
}
.dss-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.22);
  transition: transform 140ms ease;
}
.dss-switch:checked {
  background: var(--dsw-alias-brand-primary);
}
.dss-switch:checked::after {
  transform: translateX(14px);
}
.dss-switch:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
.dss-volume {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dss-volume input[type='range'] {
  width: 148px;
  accent-color: var(--dsw-alias-brand-primary);
}
.dss-value {
  min-width: 36px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.dss-value-wide {
  min-width: 0;
  font-size: 13px;
}
.dss-last {
  max-width: 280px;
  overflow: hidden;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dss-status {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
}
.dss-indicator {
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 50%;
  background: var(--dsw-alias-state-idle-primary);
}
.dss-indicator-ok {
  background: var(--dsw-alias-state-success-primary);
}
.dss-indicator-warn {
  background: var(--dsw-alias-state-warn-primary);
}
.dss-indicator-error {
  background: var(--dsw-alias-state-error-primary);
}
.dss-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  padding: 0 11px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  font-size: 12.5px;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  transition: background 140ms ease, border-color 140ms ease;
}
.dss-button:hover:not(:disabled) {
  background: var(--dsw-alias-bg-layer-2);
}
.dss-button:disabled {
  cursor: default;
  opacity: 0.6;
}
.dss-button-primary {
  border-color: transparent;
  background: var(--dsw-alias-brand-primary);
  color: #ffffff;
}
.dss-button-primary:hover:not(:disabled) {
  background: var(--dsw-alias-brand-primary);
  filter: brightness(1.06);
}
.dss-button-ghost {
  color: var(--dsw-alias-label-secondary);
}
.dss-button:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
.dss-feedback {
  font-size: 12px;
  line-height: 18px;
}
.dss-feedback-ok {
  color: var(--dsw-alias-state-success-primary);
}
.dss-feedback-error {
  color: var(--dsw-alias-state-error-primary);
}
.dss-input {
  width: 240px;
  max-width: 100%;
  height: 30px;
  padding: 0 9px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  font-size: 13px;
  line-height: 1;
}
.dss-input::placeholder {
  color: var(--dsw-alias-label-secondary);
}
.dss-input:focus-visible {
  border-color: var(--dsw-alias-brand-primary);
  outline: 1px solid var(--dsw-alias-brand-primary);
  outline-offset: 1px;
}
.dss-input-wide {
  width: 250px;
}
.dss-select {
  width: 200px;
  padding: 0 8px;
}
.dss-inline {
  display: flex;
  align-items: center;
  gap: 6px;
}
.dss-form-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
}
.dss-subtitle {
  padding-top: 10px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
}
@media (max-width: 640px) {
  .dss-row {
    align-items: flex-start;
  }
  .dss-input,
  .dss-input-wide {
    width: 180px;
  }
}
.dss-footer {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding-top: 2px;
}
.dss-note {
  margin: 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
}
.dss-toasts {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  max-width: min(360px, calc(100vw - 36px));
  pointer-events: none;
}
.dss-toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  box-sizing: border-box;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 14px;
  background: var(--dsw-alias-bg-overlay);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.18);
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  pointer-events: auto;
  animation: dss-toast-in 180ms ease-out;
}
.dss-toast:hover {
  border-color: var(--dsw-alias-border-l2);
}
.dss-toast:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
.dss-toast-dot {
  width: 8px;
  height: 8px;
  flex: none;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--dsw-alias-brand-primary);
}
.dss-toast-ended .dss-toast-dot {
  background: var(--dsw-alias-state-success-primary);
}
.dss-toast-error .dss-toast-dot {
  background: var(--dsw-alias-state-error-primary);
}
.dss-toast-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.dss-toast-headline {
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.dss-toast-title {
  overflow: hidden;
  font-size: 13.5px;
  font-weight: 600;
  line-height: 19px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dss-toast-detail {
  display: -webkit-box;
  overflow: hidden;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 17px;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
@keyframes dss-toast-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .dss-toast { animation: none; }
}
`

    function clampVolume(value) {
      const number = Number(value)
      if (!Number.isFinite(number)) return DEFAULTS.volume
      return Math.min(1, Math.max(0, number))
    }

    function loadSettings() {
      const fallback = { ...DEFAULTS }
      try {
        const raw = window.localStorage.getItem(SETTINGS_KEY)
        if (raw === null || raw === '') return fallback
        const parsed = JSON.parse(raw)
        if (typeof parsed !== 'object' || parsed === null) return fallback
        for (const key of Object.keys(fallback)) {
          if (key === 'volume') {
            fallback.volume = clampVolume(parsed.volume)
          } else if (typeof parsed[key] === 'boolean') {
            fallback[key] = parsed[key]
          }
        }
        return fallback
      } catch {
        return fallback
      }
    }

    function saveSettings(settings) {
      try {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      } catch {
        // A locked-down storage area only loses persistence, not the feature.
      }
    }

    function normalizePushForm(config) {
      const source = typeof config === 'object' && config !== null ? config : {}
      const kinds = typeof source.kinds === 'object' && source.kinds !== null ? source.kinds : {}
      const provider =
        source.provider === 'pushplus' || source.provider === 'serverchan'
          ? source.provider
          : 'ntfy'
      return {
        enabled: source.enabled !== false,
        provider,
        server: typeof source.server === 'string' ? source.server : 'https://ntfy.sh',
        topic: typeof source.topic === 'string' ? source.topic : '',
        token: typeof source.token === 'string' ? source.token : '',
        subagent: source.subagent === true,
        kinds: {
          ended: kinds.ended !== false,
          input: kinds.input !== false,
          error: kinds.error !== false,
        },
      }
    }

    function installStyles(ctx) {
      ctx.effect(() => {
        const style = document.createElement('style')
        style.dataset.plugin = 'dsh-session-sounds'
        style.textContent = CSS
        document.head.appendChild(style)
        return () => style.remove()
      }, 'session-sounds: styles')
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const t = ctx.locale.bind(NS)
        ctx.effect(() => ctx.locale.register(NS, 'zh', ZH), 'session-sounds: zh dictionary')
        ctx.effect(() => ctx.locale.register(NS, 'en', EN), 'session-sounds: en dictionary')
        installStyles(ctx)

        /* ------------------------------------------------------------- store */

        let state = {
          settings: loadSettings(),
          connection: 'connecting',
          audio: 'idle',
          running: 0,
          lastAlert: null,
          pushStatus: null,
          test: 'idle',
          toasts: [],
        }
        const subscribers = new Set()

        function subscribe(listener) {
          subscribers.add(listener)
          return () => subscribers.delete(listener)
        }

        function emit() {
          for (const listener of [...subscribers]) listener()
        }

        function setState(patch) {
          state = { ...state, ...patch }
          emit()
        }

        function useStore() {
          const [, setTick] = React.useState(0)
          React.useEffect(() => subscribe(() => setTick((tick) => tick + 1)), [])
          return state
        }

        const toastTimers = new Map()
        let testTimer = null

        function clearToasts() {
          for (const timer of toastTimers.values()) clearTimeout(timer)
          toastTimers.clear()
          if (state.toasts.length > 0) setState({ toasts: [] })
        }

        function dismissToast(key) {
          const timer = toastTimers.get(key)
          if (timer !== undefined) {
            clearTimeout(timer)
            toastTimers.delete(key)
          }
          setState({ toasts: state.toasts.filter((item) => item.key !== key) })
        }

        function pushToast(alert) {
          const key = typeof alert.id === 'string' && alert.id !== '' ? alert.id : `local-${Date.now()}`
          const next = [...state.toasts.filter((item) => item.key !== key), { key, alert }]
          while (next.length > TOAST_LIMIT) {
            const dropped = next.shift()
            const timer = toastTimers.get(dropped.key)
            if (timer !== undefined) {
              clearTimeout(timer)
              toastTimers.delete(dropped.key)
            }
          }
          setState({ toasts: next })
          const timer = setTimeout(() => dismissToast(key), TOAST_MS)
          toastTimers.set(key, timer)
        }

        function updateSettings(patch) {
          const settings = { ...state.settings, ...patch }
          settings.volume = clampVolume(settings.volume)
          state = { ...state, settings }
          saveSettings(settings)
          if (audio !== null) {
            audio.master.gain.setTargetAtTime(settings.volume, audio.context.currentTime, 0.02)
          }
          if (!settings.toast) clearToasts()
          emit()
        }

        function resetSettings() {
          updateSettings({ ...DEFAULTS })
        }

        /* ------------------------------------------------------------- audio */

        let audio = null

        function ensureAudio() {
          if (audio !== null) return audio
          const Ctor = window.AudioContext || window.webkitAudioContext
          if (typeof Ctor !== 'function') {
            setState({ audio: 'unsupported' })
            return null
          }
          let context
          try {
            context = new Ctor()
          } catch {
            setState({ audio: 'unsupported' })
            return null
          }
          const master = context.createGain()
          master.gain.value = clampVolume(state.settings.volume)
          master.connect(context.destination)
          audio = { context, master }
          context.addEventListener?.('statechange', () => {
            setState({ audio: context.state })
          })
          setState({ audio: context.state })
          return audio
        }

        function unlockAudio() {
          const engine = ensureAudio()
          if (engine === null) return
          if (engine.context.state === 'running') {
            if (state.audio !== 'running') setState({ audio: 'running' })
            return
          }
          engine.context
            .resume()
            .then(() => setState({ audio: engine.context.state }))
            .catch(() => {})
        }

        function tone(context, destination, note, start) {
          const at = start + note.at
          const oscillator = context.createOscillator()
          oscillator.type = note.type
          oscillator.frequency.setValueAtTime(note.freq, at)
          const envelope = context.createGain()
          envelope.gain.setValueAtTime(0.0001, at)
          envelope.gain.exponentialRampToValueAtTime(note.gain, at + 0.012)
          envelope.gain.exponentialRampToValueAtTime(0.0001, at + note.dur)
          oscillator.connect(envelope)
          envelope.connect(destination)
          oscillator.start(at)
          oscillator.stop(at + note.dur + 0.03)
        }

        async function playSound(kind) {
          const engine = ensureAudio()
          if (engine === null) return
          const { context, master } = engine
          try {
            if (context.state !== 'running') await context.resume()
          } catch {
            // The gesture gate has not opened yet.
          }
          if (context.state !== 'running') {
            setState({ audio: context.state })
            return
          }
          const notes = SOUNDS[kind] ?? SOUNDS.ended
          const volume = clampVolume(state.settings.volume)
          if (volume <= 0) return
          master.gain.setTargetAtTime(volume, context.currentTime, 0.01)
          const start = context.currentTime + 0.03
          for (const note of notes) tone(context, master, note, start)
          setState({ audio: context.state })
          const total = notes.reduce((end, note) => Math.max(end, note.at + note.dur), 0)
          await new Promise((resolve) => setTimeout(resolve, (total + 0.08) * 1000))
        }

        function playWithLease(kind) {
          try {
            const now = Date.now()
            const last = Number(window.localStorage.getItem(PLAY_LEASE) ?? '0')
            if (Number.isFinite(last) && now - last < 1500) return
            window.localStorage.setItem(PLAY_LEASE, String(now))
          } catch {
            // Without storage every tab simply plays once.
          }
          void playSound(kind)
        }

        function requestPlay(kind) {
          const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
          if (locks !== undefined && typeof locks.request === 'function') {
            let started = false
            try {
              const pending = locks.request(
                PLAY_LOCK,
                { ifAvailable: true },
                async (lock) => {
                  if (lock === null) return
                  started = true
                  await playSound(kind)
                },
              )
              if (pending !== undefined && typeof pending.catch === 'function') {
                pending.catch(() => {
                  if (!started) playWithLease(kind)
                })
              }
              return
            } catch {
              // Fall through to the lease when Web Locks is unavailable.
            }
          }
          playWithLease(kind)
        }

        /* ------------------------------------------------------------ alerts */

        const seen = new Set()

        function handleAlert(alert) {
          if (typeof alert !== 'object' || alert === null) return
          const id = typeof alert.id === 'string' ? alert.id : ''
          if (id !== '') {
            if (seen.has(id)) return
            seen.add(id)
            if (seen.size > 200) {
              const oldest = seen.values().next().value
              if (oldest !== undefined) seen.delete(oldest)
            }
          }

          setState({ lastAlert: alert })
          const settings = state.settings
          if (!settings.enabled && alert.test !== true) return
          if (alert.test !== true) {
            if (alert.subagent === true && !settings.subagent) return
            if (alert.kind === 'ended' && !settings.ended) return
            if (alert.kind === 'input' && !settings.input) return
            if (alert.kind === 'error' && !settings.error) return
          }

          if (settings.toast) pushToast(alert)
          requestPlay(alert.kind)
        }

        function handlePoll() {
          let stopped = false
          let timer = null
          let lastSeq = null
          let inFlight = false

          async function tick() {
            if (stopped || inFlight) return
            inFlight = true
            const controller = new AbortController()
            const abortTimer = setTimeout(() => controller.abort(), 4000)
            try {
              const url = lastSeq === null ? POLL_PATH : `${POLL_PATH}?since=${lastSeq}`
              const response = await fetch(url, { cache: 'no-store', signal: controller.signal })
              if (!response.ok) throw new Error(`HTTP ${response.status}`)
              const data = await response.json()
              if (stopped) return
              const seq = typeof data?.seq === 'number' ? data.seq : lastSeq
              if (lastSeq === null || seq === null || seq < lastSeq) {
                // First sample, or the Host restarted and its sequence reset:
                // take the new baseline without replaying buffered alerts.
                lastSeq = seq ?? 0
              } else {
                lastSeq = seq
                const alerts = Array.isArray(data?.alerts) ? data.alerts : []
                for (const alert of alerts) {
                  try {
                    if (alert !== null && typeof alert === 'object') handleAlert(alert)
                  } catch {
                    // A single malformed alert must not stop the poll loop.
                  }
                }
              }
              setState({
                connection: 'live',
                running: typeof data?.running === 'number' ? data.running : state.running,
                pushStatus:
                  data?.push !== null && typeof data?.push === 'object' ? data.push : state.pushStatus,
              })
            } catch {
              if (!stopped) setState({ connection: 'offline' })
            } finally {
              clearTimeout(abortTimer)
              inFlight = false
              if (!stopped) timer = setTimeout(tick, 1000)
            }
          }

          setState({ connection: 'connecting' })
          void tick()
          return () => {
            stopped = true
            if (timer !== null) clearTimeout(timer)
          }
        }

        async function sendTest() {
          if (state.test === 'sending') return
          setState({ test: 'sending' })
          try {
            const response = await fetch(TEST_PATH, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ kind: 'input' }),
              cache: 'no-store',
            })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            setState({ test: 'sent' })
          } catch {
            setState({ test: 'error' })
          }
          if (testTimer !== null) clearTimeout(testTimer)
          testTimer = setTimeout(() => {
            testTimer = null
            if (state.test === 'sent' || state.test === 'error') setState({ test: 'idle' })
          }, 6000)
        }

        /* ---------------------------------------------------------- lifecycle */

        ctx.on('locale/change', () => emit())

        ctx.effect(() => {
          const onStorage = (event) => {
            if (event.key !== SETTINGS_KEY) return
            setState({ settings: loadSettings() })
          }
          window.addEventListener('storage', onStorage)
          return () => window.removeEventListener('storage', onStorage)
        }, 'session-sounds: settings sync')

        ctx.effect(() => {
          window.addEventListener('pointerdown', unlockAudio, true)
          window.addEventListener('keydown', unlockAudio, true)
          return () => {
            window.removeEventListener('pointerdown', unlockAudio, true)
            window.removeEventListener('keydown', unlockAudio, true)
          }
        }, 'session-sounds: audio unlock')

        ctx.effect(handlePoll, 'session-sounds: alert poll')

        ctx.effect(() => {
          return () => {
            if (testTimer !== null) clearTimeout(testTimer)
            for (const timer of toastTimers.values()) clearTimeout(timer)
            toastTimers.clear()
            if (audio !== null) {
              audio.context.close().catch(() => {})
              audio = null
            }
          }
        }, 'session-sounds: teardown')

        /* -------------------------------------------------------------- view */

        function sessionLabel(alert) {
          if (alert.test === true) return t('toast.test.title')
          const title = typeof alert.title === 'string' ? alert.title.trim() : ''
          if (title !== '') return title
          const id = typeof alert.sessionId === 'string' ? alert.sessionId : ''
          if (id === '') return t('unknownSession')
          return `${t('unknownSession')} · ${id.slice(-6)}`
        }

        function Section() {
          const snapshot = useStore()
          const settings = snapshot.settings
          const set = updateSettings

          function row(labelKey, hintKey, control, extra) {
            return h(
              'div',
              { className: 'dss-row', key: labelKey, ...extra },
              h(
                'div',
                { className: 'dss-row-text' },
                h('span', { className: 'dss-label' }, t(labelKey)),
                hintKey === null ? null : h('span', { className: 'dss-hint' }, t(hintKey)),
              ),
              h('div', { className: 'dss-row-control' }, control),
            )
          }

          function toggleRow(key, labelKey, hintKey) {
            return row(
              labelKey,
              hintKey,
              h('input', {
                className: 'dss-switch',
                type: 'checkbox',
                checked: settings[key],
                'aria-label': t(labelKey),
                onChange: (event) => set({ [key]: event.target.checked }),
              }),
            )
          }

          function eventRow(kind, labelKey, hintKey) {
            return row(
              labelKey,
              hintKey,
              [
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dss-button dss-button-ghost',
                    key: 'preview',
                    onClick: () => requestPlay(kind),
                  },
                  t('preview'),
                ),
                h('input', {
                  className: 'dss-switch',
                  type: 'checkbox',
                  key: 'switch',
                  checked: settings[kind],
                  'aria-label': t(labelKey),
                  onChange: (event) => set({ [kind]: event.target.checked }),
                }),
              ],
            )
          }

          function statusRow(labelKey, valueKey, tone) {
            return row(
              labelKey,
              null,
              h(
                'div',
                { className: 'dss-status' },
                h('span', { className: `dss-indicator dss-indicator-${tone}`, 'aria-hidden': true }),
                h('span', null, t(valueKey)),
              ),
            )
          }

          function describeLast(alert) {
            if (alert === null || typeof alert !== 'object') return t('status.none')
            const title = alert.test === true ? t('toast.kind.test') : sessionLabel(alert)
            const time =
              typeof alert.at === 'number' && Number.isFinite(alert.at)
                ? new Date(alert.at).toLocaleTimeString()
                : ''
            return time === '' ? title : `${title} · ${time}`
          }

          const connectionTone =
            snapshot.connection === 'live'
              ? 'ok'
              : snapshot.connection === 'connecting'
                ? 'warn'
                : 'error'
          const audioTone =
            snapshot.audio === 'running' ? 'ok' : snapshot.audio === 'suspended' ? 'warn' : 'idle'

          return h(
            'div',
            { className: 'dss-root' },
            h('p', { className: 'dss-description' }, t('section.description')),

            h(
              'div',
              { className: 'dss-group' },
              h('div', { className: 'dss-group-title' }, t('section.events')),
              toggleRow('enabled', 'master.label', 'master.hint'),
              eventRow('ended', 'events.ended', 'events.ended.hint'),
              eventRow('input', 'events.input', 'events.input.hint'),
              eventRow('error', 'events.error', 'events.error.hint'),
            ),

            h(
              'div',
              { className: 'dss-group' },
              h('div', { className: 'dss-group-title' }, t('section.playback')),
              row(
                'playback.volume',
                'playback.volume.hint',
                h(
                  'div',
                  { className: 'dss-volume' },
                  h('input', {
                    type: 'range',
                    min: 0,
                    max: 100,
                    step: 5,
                    value: Math.round(settings.volume * 100),
                    'aria-label': t('playback.volume'),
                    onChange: (event) => set({ volume: Number(event.target.value) / 100 }),
                  }),
                  h('span', { className: 'dss-value' }, `${Math.round(settings.volume * 100)}%`),
                ),
              ),
              toggleRow('subagent', 'playback.subagent', 'playback.subagent.hint'),
              toggleRow('toast', 'playback.toast', 'playback.toast.hint'),
            ),

            h(PushPanel),

            h(
              'div',
              { className: 'dss-group' },
              h('div', { className: 'dss-group-title' }, t('section.status')),
              statusRow(
                'status.connection',
                `status.connection.${snapshot.connection}`,
                connectionTone,
              ),
              statusRow('status.audio', `status.audio.${snapshot.audio}`, audioTone),
              row(
                'status.running',
                null,
                h(
                  'span',
                  { className: 'dss-value dss-value-wide' },
                  `${snapshot.running} ${t('status.sessionsUnit')}`,
                ),
              ),
              row(
                'status.last',
                null,
                h('span', { className: 'dss-last' }, describeLast(snapshot.lastAlert)),
              ),
              h(
                'div',
                { className: 'dss-row' },
                h(
                  'div',
                  { className: 'dss-row-text' },
                  h('span', { className: 'dss-label' }, t('test.title')),
                  h('span', { className: 'dss-hint' }, t('test.hint')),
                  snapshot.test === 'sent'
                    ? h('span', { className: 'dss-feedback dss-feedback-ok' }, t('test.sent'))
                    : snapshot.test === 'error'
                      ? h(
                          'span',
                          { className: 'dss-feedback dss-feedback-error' },
                          t('test.error'),
                        )
                      : null,
                ),
                h(
                  'div',
                  { className: 'dss-row-control' },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dss-button dss-button-primary',
                      disabled: snapshot.test === 'sending',
                      onClick: () => void sendTest(),
                    },
                    snapshot.test === 'sending' ? t('test.sending') : t('test'),
                  ),
                ),
              ),
            ),

            h(
              'div',
              { className: 'dss-footer' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dss-button',
                  onClick: () => resetSettings(),
                },
                t('reset'),
              ),
              h('p', { className: 'dss-note' }, t('note.autoplay')),
            ),
          )
        }

        const PUSH_ERROR_CODES = new Set([
          'invalid_server',
          'invalid_provider',
          'invalid_topic',
          'invalid_token',
          'missing_topic',
          'missing_token',
          'config_write_failed',
          'invalid_json',
          'network_error',
          'timeout',
        ])

        function pushErrorText(value) {
          if (typeof value !== 'string') return ''
          const code = value.trim()
          if (code === '') return ''
          return PUSH_ERROR_CODES.has(code) ? t(`push.error.${code}`) : code
        }

        function PushPanel() {
          const snapshot = useStore()
          const [form, setForm] = React.useState(null)
          const [loadError, setLoadError] = React.useState(false)
          const [busy, setBusy] = React.useState('idle')
          const [feedback, setFeedback] = React.useState(null)

          React.useEffect(() => {
            let active = true
            fetch(PUSH_PATH, { cache: 'no-store' })
              .then(async (response) => {
                const data = await response.json().catch(() => null)
                if (!response.ok || data?.ok !== true) throw new Error('load_failed')
                if (!active) return
                setForm(normalizePushForm(data.config))
                if (typeof data.status === 'object' && data.status !== null) {
                  setState({ pushStatus: data.status })
                }
              })
              .catch(() => {
                if (active) setLoadError(true)
              })
            return () => {
              active = false
            }
          }, [])

          function update(patch) {
            setForm((current) => (current === null ? current : { ...current, ...patch }))
          }

          function updateKind(kind, value) {
            setForm((current) =>
              current === null ? current : { ...current, kinds: { ...current.kinds, [kind]: value } },
            )
          }

          function randomTopic() {
            const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789'
            const bytes = new Uint8Array(10)
            if (typeof globalThis.crypto?.getRandomValues === 'function') {
              globalThis.crypto.getRandomValues(bytes)
            } else {
              for (let index = 0; index < bytes.length; index += 1) {
                bytes[index] = Math.floor(Math.random() * 256)
              }
            }
            let topic = 'dsh-'
            for (const byte of bytes) topic += alphabet[byte % alphabet.length]
            update({ topic })
          }

          async function save() {
            if (form === null || busy !== 'idle') return
            setBusy('save')
            setFeedback(null)
            try {
              const response = await fetch(PUSH_PATH, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(form),
                cache: 'no-store',
              })
              const data = await response.json().catch(() => null)
              if (response.ok && data?.ok === true) {
                setForm(normalizePushForm(data.config))
                if (typeof data.status === 'object' && data.status !== null) {
                  setState({ pushStatus: data.status })
                }
                setFeedback({ ok: true, key: 'push.saved', detail: '' })
              } else {
                setFeedback({
                  ok: false,
                  key: 'push.save.error',
                  detail: pushErrorText(data?.error),
                })
              }
            } catch {
              setFeedback({ ok: false, key: 'push.save.error', detail: t('push.error.network_error') })
            } finally {
              setBusy('idle')
            }
          }

          async function test() {
            if (form === null || busy !== 'idle') return
            if (form.provider === 'ntfy' && form.topic.trim() === '') {
              setFeedback({ ok: false, key: 'push.test.missing', detail: '' })
              return
            }
            if (form.provider !== 'ntfy' && form.token.trim() === '') {
              setFeedback({ ok: false, key: 'push.test.missing.token', detail: '' })
              return
            }
            setBusy('test')
            setFeedback(null)
            try {
              const response = await fetch(PUSH_TEST_PATH, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(form),
                cache: 'no-store',
              })
              const data = await response.json().catch(() => null)
              if (response.ok && data?.ok === true) {
                setFeedback({ ok: true, key: 'push.test.ok', detail: '' })
                if (typeof data.status === 'object' && data.status !== null) {
                  setState({ pushStatus: data.status })
                }
              } else {
                const detail =
                  pushErrorText(data?.error) ||
                  (typeof data?.httpStatus === 'number' ? `HTTP ${data.httpStatus}` : '')
                setFeedback({ ok: false, key: 'push.test.error', detail })
              }
            } catch {
              setFeedback({ ok: false, key: 'push.test.error', detail: t('push.error.network_error') })
            } finally {
              setBusy('idle')
            }
          }

          function row(labelKey, hintKey, control) {
            return h(
              'div',
              { className: 'dss-row', key: labelKey },
              h(
                'div',
                { className: 'dss-row-text' },
                h('span', { className: 'dss-label' }, t(labelKey)),
                hintKey === null ? null : h('span', { className: 'dss-hint' }, t(hintKey)),
              ),
              h('div', { className: 'dss-row-control' }, control),
            )
          }

          function toggleRow(key, labelKey, hintKey) {
            return row(
              labelKey,
              hintKey,
              h('input', {
                className: 'dss-switch',
                type: 'checkbox',
                checked: form[key],
                'aria-label': t(labelKey),
                onChange: (event) => update({ [key]: event.target.checked }),
              }),
            )
          }

          function kindRow(kind) {
            const labelKey = `push.kinds.${kind}`
            return row(
              labelKey,
              null,
              h('input', {
                className: 'dss-switch',
                type: 'checkbox',
                checked: form.kinds[kind],
                'aria-label': t(labelKey),
                onChange: (event) => updateKind(kind, event.target.checked),
              }),
            )
          }

          function describePushStatus(status) {
            if (status === null || typeof status !== 'object') return t('push.last.none')
            const time =
              typeof status.at === 'number' && Number.isFinite(status.at)
                ? new Date(status.at).toLocaleTimeString()
                : ''
            const result = status.ok
              ? t('push.last.ok')
              : `${t('push.last.failed')}${
                  status.error ? ` · ${pushErrorText(status.error)}` : ''
                }`
            return time === '' ? result : `${result} · ${time}`
          }

          if (form === null) {
            return h(
              'div',
              { className: 'dss-group' },
              h('div', { className: 'dss-group-title' }, t('section.push')),
              h(
                'div',
                { className: 'dss-row' },
                h(
                  'div',
                  { className: 'dss-row-text' },
                  h(
                    'span',
                    { className: 'dss-hint' },
                    t(loadError ? 'push.load.error' : 'push.loading'),
                  ),
                ),
              ),
            )
          }

          return h(
            'div',
            { className: 'dss-group' },
            h('div', { className: 'dss-group-title' }, t('section.push')),
            toggleRow('enabled', 'push.enabled', 'push.enabled.hint'),
            row(
              'push.provider',
              'push.provider.hint',
              h(
                'select',
                {
                  className: 'dss-input dss-select',
                  value: form.provider,
                  'aria-label': t('push.provider'),
                  onChange: (event) => update({ provider: event.target.value, token: '' }),
                },
                h('option', { value: 'ntfy' }, t('push.provider.ntfy')),
                h('option', { value: 'pushplus' }, t('push.provider.pushplus')),
                h('option', { value: 'serverchan' }, t('push.provider.serverchan')),
              ),
            ),
            form.provider === 'ntfy'
              ? h(
                  React.Fragment,
                  null,
                  row(
                    'push.server',
                    'push.server.hint',
                    h('input', {
                      className: 'dss-input dss-input-wide',
                      type: 'url',
                      value: form.server,
                      placeholder: 'https://ntfy.sh',
                      spellCheck: false,
                      autoComplete: 'off',
                      'aria-label': t('push.server'),
                      onChange: (event) => update({ server: event.target.value }),
                    }),
                  ),
                  row(
                    'push.topic',
                    'push.topic.hint',
                    h(
                      'div',
                      { className: 'dss-inline' },
                      h('input', {
                        className: 'dss-input',
                        type: 'text',
                        value: form.topic,
                        placeholder: 'dsh-…',
                        spellCheck: false,
                        autoComplete: 'off',
                        'aria-label': t('push.topic'),
                        onChange: (event) => update({ topic: event.target.value }),
                      }),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dss-button dss-button-ghost',
                          onClick: randomTopic,
                        },
                        t('push.topic.random'),
                      ),
                    ),
                  ),
                  row(
                    'push.token',
                    'push.token.hint',
                    h('input', {
                      className: 'dss-input dss-input-wide',
                      type: 'password',
                      value: form.token,
                      autoComplete: 'new-password',
                      spellCheck: false,
                      'aria-label': t('push.token'),
                      onChange: (event) => update({ token: event.target.value }),
                    }),
                  ),
                )
              : h(
                  React.Fragment,
                  null,
                  row(
                    form.provider === 'pushplus'
                      ? 'push.token.pushplus'
                      : 'push.token.serverchan',
                    'push.token.hint.wechat',
                    h('input', {
                      className: 'dss-input dss-input-wide',
                      type: 'password',
                      value: form.token,
                      autoComplete: 'new-password',
                      spellCheck: false,
                      'aria-label': t(
                        form.provider === 'pushplus'
                          ? 'push.token.pushplus'
                          : 'push.token.serverchan',
                      ),
                      onChange: (event) => update({ token: event.target.value }),
                    }),
                  ),
                  h(
                    'p',
                    { className: 'dss-note' },
                    t(
                      form.provider === 'pushplus'
                        ? 'push.help.pushplus'
                        : 'push.help.serverchan',
                    ),
                  ),
                ),
            h('div', { className: 'dss-subtitle' }, t('push.kinds')),
            kindRow('ended'),
            kindRow('input'),
            kindRow('error'),
            toggleRow('subagent', 'push.subagent', 'push.subagent.hint'),
            h(
              'div',
              { className: 'dss-form-actions' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dss-button dss-button-primary',
                  disabled: busy !== 'idle',
                  onClick: () => void save(),
                },
                busy === 'save' ? t('push.saving') : t('push.save'),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dss-button',
                  disabled: busy !== 'idle',
                  onClick: () => void test(),
                },
                busy === 'test' ? t('push.testing') : t('push.test'),
              ),
            ),
            feedback === null
              ? null
              : h(
                  'p',
                  {
                    className: `dss-feedback ${
                      feedback.ok ? 'dss-feedback-ok' : 'dss-feedback-error'
                    }`,
                    role: 'status',
                  },
                  `${t(feedback.key)}${feedback.detail ? ` · ${feedback.detail}` : ''}`,
                ),
            row(
              'push.last',
              null,
              h('span', { className: 'dss-last' }, describePushStatus(snapshot.pushStatus)),
            ),
            h(
              'p',
              { className: 'dss-note' },
              t(form.provider === 'ntfy' ? 'push.note.ntfy' : 'push.note.wechat'),
            ),
          )
        }

        function toastDetail(alert) {
          if (alert.test === true) return t('toast.test.detail')
          if (alert.kind === 'ended') return t('toast.ended.detail')
          if (alert.kind === 'error') return alert.message || t('toast.error.detail')
          if (alert.reason === 'approval') {
            return alert.toolName
              ? `${t('toast.approval.detail')} · ${alert.toolName}`
              : t('toast.approval.detail')
          }
          if (typeof alert.question === 'string' && alert.question !== '') return alert.question
          return t('toast.question.detail')
        }

        function Toasts() {
          const snapshot = useStore()
          if (!snapshot.settings.toast || snapshot.toasts.length === 0) return null
          return h(
            'div',
            { className: 'dss-toasts', 'aria-live': 'polite', 'aria-atomic': 'false' },
            snapshot.toasts.map((item) => {
              const alert = item.alert
              const kind =
                alert.kind === 'error' ? 'error' : alert.kind === 'ended' ? 'ended' : 'input'
              const headline = t(`toast.kind.${alert.test === true ? 'test' : kind}`)
              const title = sessionLabel(alert)
              const detail = toastDetail(alert)
              return h(
                'button',
                {
                  type: 'button',
                  className: `dss-toast dss-toast-${kind}`,
                  key: item.key,
                  onClick: () => dismissToast(item.key),
                  title: t('toast.dismiss'),
                },
                h('span', { className: 'dss-toast-dot', 'aria-hidden': true }),
                h(
                  'span',
                  { className: 'dss-toast-body' },
                  h('span', { className: 'dss-toast-headline' }, headline),
                  h('span', { className: 'dss-toast-title' }, title),
                  detail === '' ? null : h('span', { className: 'dss-toast-detail' }, detail),
                ),
              )
            }),
          )
        }

        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            {
              name: 'settings.section',
              id: 'session-sounds',
              order: 40,
              label: () => t('section.title'),
              locale: NS,
            },
            Section,
          ),
        )

        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register({ name: 'shell.overlay', id: 'session-sounds-toasts', order: 60 }, Toasts),
        )
      },
    }
  },
})
