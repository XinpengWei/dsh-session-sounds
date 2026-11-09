/**
 * Session sounds — the host half.
 *
 * Listens to the session lifecycle on the Host and exposes it to every open
 * Harness page over one Server-Sent Events route. The page half decides
 * whether a sound is wanted; this half only reports what happened, so the
 * alert survives a page reload and reaches background tabs immediately.
 */

import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

const STREAM_PATH = '/api/session-sounds/stream'
const TEST_PATH = '/api/session-sounds/test'
const PUSH_PATH = '/api/session-sounds/push'
const PUSH_TEST_PATH = '/api/session-sounds/push/test'
const POLL_PATH = '/api/session-sounds/poll'
const HEARTBEAT_MS = 15_000
const RECENT_LIMIT = 200
const INPUT_DELAY_MS = 900
const MAX_LISTENERS = 32
const PUSH_TIMEOUT_MS = 10_000
const KINDS = new Set(['ended', 'input', 'error'])

const PUSH_DEFAULTS = Object.freeze({
  enabled: true,
  provider: 'ntfy',
  server: 'https://ntfy.sh',
  topic: '',
  token: '',
  subagent: false,
  kinds: Object.freeze({ ended: true, input: true, error: true }),
})

const PUSH_PROVIDERS = new Set(['ntfy', 'pushplus', 'serverchan'])

const PUSH_CONFIG_PATH = join(
  process.env.DSH_PROFILE_DIR || process.env.DSH_HOME || join(homedir(), '.dsh'),
  'session-sounds.push.json',
)

export const inject = ['webServer']

export function apply(ctx) {
  /** @type {Set<{ res: import('node:http').ServerResponse, timer: NodeJS.Timeout | null }>} */
  const listeners = new Set()
  /** @type {Map<string, boolean>} */
  const running = new Map()
  /** @type {Array<Record<string, unknown> & { seq: number }>} */
  const recentAlerts = []
  let sequence = 0
  let disposed = false
  let pushConfig = loadPushConfig()
  /** @type {{ at: number, ok: boolean, httpStatus: number, error?: string, kind: string } | null} */
  let pushStatus = null

  /* ------------------------------------------------------------- services */

  function service(name) {
    try {
      return ctx.get(name)
    } catch {
      return undefined
    }
  }

  function clip(value, limit = 160) {
    if (typeof value !== 'string') return undefined
    const text = value.trim()
    if (text === '') return undefined
    return text.length > limit ? `${text.slice(0, limit - 1)}…` : text
  }

  function timeStamp(value) {
    const date = new Date(typeof value === 'number' ? value : Date.now())
    try {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        fractionalSecondDigits: 3,
      })
    } catch {
      return date.toISOString().slice(11, 23)
    }
  }

  function sessionInfo(sessionId) {
    if (typeof sessionId !== 'string' || sessionId === '') {
      return { sessionId: undefined, title: undefined, subagent: false }
    }
    let session
    let snapshot
    try {
      session = service('sessions')?.get(sessionId)
      if (session !== undefined) snapshot = service('sessionTitle')?.get(session)
    } catch {
      // Titles are decoration; the alert still knows which session it belongs to.
    }
    const title = typeof snapshot === 'string' ? snapshot : snapshot?.title
    return {
      sessionId,
      title: clip(title, 160),
      subagent: session?.header?.origin === 'subagent',
    }
  }

  /* ----------------------------------------------------------- push config */

  function defaultPushConfig() {
    return { ...PUSH_DEFAULTS, kinds: { ...PUSH_DEFAULTS.kinds } }
  }

  function sanitizePushConfig(input, base = defaultPushConfig()) {
    const source = input !== null && typeof input === 'object' ? input : {}
    const fallback = base !== null && typeof base === 'object' ? base : defaultPushConfig()
    const provider =
      typeof source.provider === 'string' && source.provider.trim() !== ''
        ? source.provider.trim()
        : String(fallback.provider ?? PUSH_DEFAULTS.provider)
    if (!PUSH_PROVIDERS.has(provider)) throw new Error('invalid_provider')
    const config = {
      enabled: typeof source.enabled === 'boolean' ? source.enabled : fallback.enabled !== false,
      provider,
      server:
        typeof source.server === 'string'
          ? source.server.trim()
          : String(fallback.server ?? PUSH_DEFAULTS.server),
      topic:
        typeof source.topic === 'string' ? source.topic.trim() : String(fallback.topic ?? ''),
      token:
        typeof source.token === 'string' ? source.token.trim() : String(fallback.token ?? ''),
      subagent: typeof source.subagent === 'boolean' ? source.subagent : fallback.subagent === true,
      kinds: {
        ended:
          typeof source.kinds?.ended === 'boolean'
            ? source.kinds.ended
            : fallback.kinds?.ended !== false,
        input:
          typeof source.kinds?.input === 'boolean'
            ? source.kinds.input
            : fallback.kinds?.input !== false,
        error:
          typeof source.kinds?.error === 'boolean'
            ? source.kinds.error
            : fallback.kinds?.error !== false,
      },
    }
    config.server = config.server.replace(/\/+$/, '')
    if (config.server === '') throw new Error('invalid_server')
    let parsed
    try {
      parsed = new URL(config.server)
    } catch {
      throw new Error('invalid_server')
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('invalid_server')
    }
    if (
      config.provider === 'ntfy' &&
      config.topic !== '' &&
      !/^[A-Za-z0-9_-]{1,64}$/.test(config.topic)
    ) {
      throw new Error('invalid_topic')
    }
    if (config.token.length > 512) throw new Error('invalid_token')
    return config
  }

  function loadPushConfig() {
    try {
      return sanitizePushConfig(JSON.parse(readFileSync(PUSH_CONFIG_PATH, 'utf8')))
    } catch {
      return defaultPushConfig()
    }
  }

  function savePushConfig(config) {
    mkdirSync(dirname(PUSH_CONFIG_PATH), { recursive: true })
    writeFileSync(PUSH_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 })
    try {
      chmodSync(PUSH_CONFIG_PATH, 0o600)
    } catch {
      // A locked-down file system still keeps the config; only the mode is best effort.
    }
  }

  function sessionText(alert) {
    const title = typeof alert.title === 'string' ? alert.title.trim() : ''
    if (title !== '') return title
    const sessionId = typeof alert.sessionId === 'string' ? alert.sessionId : ''
    return sessionId === '' ? 'DSH' : `未命名会话 · ${sessionId.slice(-6)}`
  }

  function pushPayload(alert) {
    const label = `${alert.subagent === true ? '[子代理] ' : ''}${sessionText(alert)}`
    const stamp = timeStamp(alert.at)
    if (alert.kind === 'ended') {
      return {
        title: 'DSH · 会话结束',
        message: `${label} 已完成这一轮 · ${stamp}`,
        priority: 3,
        tags: ['white_check_mark'],
      }
    }
    if (alert.kind === 'error') {
      const message = clip(alert.message, 200) || '会话遇到了错误'
      return {
        title: 'DSH · 会话出错',
        message: `${label}：${message} · ${stamp}`,
        priority: 4,
        tags: ['warning'],
      }
    }
    let detail = '正在等待你的确认或回答'
    if (alert.reason === 'approval') {
      detail =
        typeof alert.toolName === 'string' && alert.toolName !== ''
          ? `等待你确认：${alert.toolName}`
          : '等待你的确认'
    } else if (typeof alert.question === 'string' && alert.question.trim() !== '') {
      detail = `等待你的回答：${clip(alert.question, 100)}`
    }
    return {
      title: 'DSH · 需要你输入',
      message: `${label} · ${detail} · ${stamp}`,
      priority: 4,
      tags: ['bell'],
    }
  }

  async function sendNtfy(config, payload) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PUSH_TIMEOUT_MS)
    timer.unref?.()
    try {
      const headers = { 'content-type': 'application/json; charset=utf-8' }
      if (config.token !== '') headers.authorization = `Bearer ${config.token}`
      const response = await fetch(`${config.server}/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ topic: config.topic, ...payload }),
        signal: controller.signal,
      })
      const text = await response.text()
      if (!response.ok) {
        let detail = text.trim()
        try {
          const parsed = JSON.parse(text)
          detail = parsed?.error || parsed?.code || detail
        } catch {
          // The body was plain text.
        }
        const message = typeof detail === 'string' ? detail.trim() : ''
        return {
          ok: false,
          httpStatus: response.status,
          error: clip(message, 240) || `HTTP ${response.status}`,
        }
      }
      return { ok: true, httpStatus: response.status }
    } catch (error) {
      const cause = error?.cause?.code
      const message =
        error?.name === 'AbortError' ? 'timeout' : cause || error?.message || String(error)
      return { ok: false, httpStatus: 0, error: clip(message, 240) || 'network_error' }
    } finally {
      clearTimeout(timer)
    }
  }

  function pushPlusDetail(parsed, text) {
    if (parsed !== null && typeof parsed === 'object') {
      if (typeof parsed.data === 'string' && parsed.data.trim() !== '') return parsed.data.trim()
      if (typeof parsed.msg === 'string' && parsed.msg.trim() !== '') return parsed.msg.trim()
      if (typeof parsed.error === 'string' && parsed.error.trim() !== '') return parsed.error.trim()
    }
    return text
  }

  async function sendPushPlus(config, payload) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PUSH_TIMEOUT_MS)
    timer.unref?.()
    try {
      const response = await fetch('https://www.pushplus.plus/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          token: config.token,
          title: payload.title,
          content: payload.message,
          template: 'txt',
        }),
        signal: controller.signal,
      })
      const text = await response.text()
      let parsed = null
      try {
        parsed = JSON.parse(text)
      } catch {
        // The body may be plain text on a gateway error.
      }
      if (!response.ok) {
        return {
          ok: false,
          httpStatus: response.status,
          error: clip(pushPlusDetail(parsed, text), 240) || `HTTP ${response.status}`,
        }
      }
      if (parsed !== null && parsed.code !== undefined && Number(parsed.code) !== 200) {
        return {
          ok: false,
          httpStatus: response.status,
          error: clip(pushPlusDetail(parsed, text), 240) || 'pushplus_error',
        }
      }
      return { ok: true, httpStatus: response.status }
    } catch (error) {
      const cause = error?.cause?.code
      const message =
        error?.name === 'AbortError' ? 'timeout' : cause || error?.message || String(error)
      return { ok: false, httpStatus: 0, error: clip(message, 240) || 'network_error' }
    } finally {
      clearTimeout(timer)
    }
  }

  async function sendServerChan(config, payload) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PUSH_TIMEOUT_MS)
    timer.unref?.()
    try {
      const response = await fetch(
        `https://sctapi.ftqq.com/${encodeURIComponent(config.token)}.send`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded; charset=utf-8' },
          body: new URLSearchParams({ title: payload.title, desp: payload.message }).toString(),
          signal: controller.signal,
        },
      )
      const text = await response.text()
      let parsed = null
      try {
        parsed = JSON.parse(text)
      } catch {
        // The body may be plain text on a gateway error.
      }
      if (!response.ok) {
        return {
          ok: false,
          httpStatus: response.status,
          error: clip(parsed?.message || parsed?.error || text, 240) || `HTTP ${response.status}`,
        }
      }
      if (parsed !== null && parsed.code !== undefined && Number(parsed.code) !== 0) {
        return {
          ok: false,
          httpStatus: response.status,
          error: clip(parsed.message || parsed.error || text, 240) || 'serverchan_error',
        }
      }
      return { ok: true, httpStatus: response.status }
    } catch (error) {
      const cause = error?.cause?.code
      const message =
        error?.name === 'AbortError' ? 'timeout' : cause || error?.message || String(error)
      return { ok: false, httpStatus: 0, error: clip(message, 240) || 'network_error' }
    } finally {
      clearTimeout(timer)
    }
  }

  function sendPush(config, payload) {
    if (config.provider === 'pushplus') return sendPushPlus(config, payload)
    if (config.provider === 'serverchan') return sendServerChan(config, payload)
    return sendNtfy(config, payload)
  }

  async function submitPush(config, payload, kind) {
    const result = await sendPush(config, payload)
    pushStatus = {
      at: Date.now(),
      ok: result.ok,
      httpStatus: result.httpStatus,
      error: result.error,
      kind,
      provider: config.provider,
    }
    broadcastEvent('push', pushStatus)
    if (!result.ok) {
      console.warn(
        `[session-sounds] phone push failed (${result.httpStatus || 'network'}): ${result.error}`,
      )
    }
    return result
  }

  function maybePush(alert) {
    if (disposed || alert === null || typeof alert !== 'object') return
    if (alert.test === true) return
    const config = pushConfig
    if (!config.enabled) return
    if (config.provider === 'ntfy' ? config.topic === '' : config.token === '') return
    if (!config.kinds[alert.kind]) return
    if (alert.subagent === true && !config.subagent) return
    void submitPush(config, pushPayload(alert), alert.kind)
  }

  /* ------------------------------------------------------------- transport */

  function broadcastEvent(event, data) {
    if (disposed || listeners.size === 0) return
    const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    for (const listener of [...listeners]) {
      try {
        listener.res.write(frame)
      } catch {
        dropListener(listener)
      }
    }
  }

  function countRunning() {
    let count = 0
    for (const value of running.values()) if (value) count += 1
    return count
  }

  function pushState() {
    broadcastEvent('state', { running: countRunning() })
  }

  function dropListener(listener) {
    if (listener.timer !== null) {
      clearInterval(listener.timer)
      listener.timer = null
    }
    listeners.delete(listener)
    try {
      listener.res.end()
    } catch {
      // The socket was already gone.
    }
  }

  function pushAlert(kind, payload = {}) {
    if (disposed) return null
    const seq = ++sequence
    const alert = {
      id: `${Date.now().toString(36)}-${seq.toString(36)}`,
      at: Date.now(),
      kind,
      ...payload,
      seq,
    }
    recentAlerts.push(alert)
    if (recentAlerts.length > RECENT_LIMIT) {
      recentAlerts.splice(0, recentAlerts.length - RECENT_LIMIT)
    }
    const frame = `id: ${alert.id}\nevent: alert\ndata: ${JSON.stringify(alert)}\n\n`
    for (const listener of [...listeners]) {
      try {
        listener.res.write(frame)
      } catch {
        dropListener(listener)
      }
    }
    maybePush(alert)
    return alert
  }

  function sameOrigin(req) {
    const sent = req.headers.origin
    if (typeof sent !== 'string' || sent === '') return true
    let expected = null
    try {
      expected = ctx.webServer.getOrigin()
    } catch {
      expected = null
    }
    return typeof expected === 'string' && expected !== '' && sent === expected
  }

  function handleStream(req, res) {
    if (req.method !== 'GET') {
      res.writeHead(405, { allow: 'GET', 'content-type': 'text/plain; charset=utf-8' })
      res.end('method not allowed')
      return
    }
    if (!sameOrigin(req)) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('forbidden origin')
      return
    }
    if (listeners.size >= MAX_LISTENERS) {
      res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('too many alert listeners')
      return
    }

    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
      'referrer-policy': 'no-referrer',
    })
    if (typeof res.flushHeaders === 'function') res.flushHeaders()
    res.write('retry: 2000\n\n')

    const listener = { res, timer: null }
    listeners.add(listener)
    listener.timer = setInterval(() => {
      try {
        res.write(': keep-alive\n\n')
      } catch {
        dropListener(listener)
      }
    }, HEARTBEAT_MS)
    listener.timer.unref?.()

    try {
      res.write(
        `event: hello\ndata: ${JSON.stringify({ running: countRunning(), listeners: listeners.size, push: pushStatus })}\n\n`,
      )
    } catch {
      dropListener(listener)
      return
    }

    let cleaned = false
    const cleanup = () => {
      if (cleaned) return
      cleaned = true
      dropListener(listener)
    }
    req.on('close', cleanup)
    req.on('error', cleanup)
    res.on('close', cleanup)
  }

  function handlePoll(req, res) {
    if (req.method !== 'GET') {
      res.writeHead(405, { allow: 'GET', 'content-type': 'text/plain; charset=utf-8' })
      res.end('method not allowed')
      return
    }
    if (!sameOrigin(req)) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('forbidden origin')
      return
    }

    let since = null
    try {
      const value = new URL(req.url ?? '/', 'http://localhost').searchParams.get('since')
      if (value !== null && /^\d+$/.test(value)) since = Number(value)
    } catch {
      since = null
    }

    const alerts = since === null ? [] : recentAlerts.filter((alert) => alert.seq > since)
    sendJson(res, 200, {
      ok: true,
      seq: sequence,
      running: countRunning(),
      push: pushStatus,
      alerts,
    })
  }

  function sendJson(res, status, body) {
    const text = JSON.stringify(body)
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'referrer-policy': 'no-referrer',
      'content-length': Buffer.byteLength(text),
    })
    res.end(text)
  }

  async function readText(req, maxBytes = 2048) {
    const chunks = []
    let size = 0
    for await (const chunk of req) {
      size += chunk.length
      if (size > maxBytes) {
        req.destroy()
        throw new RangeError('payload too large')
      }
      chunks.push(chunk)
    }
    return Buffer.concat(chunks).toString('utf8')
  }

  async function runTest(req, res) {
    if (req.method !== 'POST') {
      sendJson(res, 405, { ok: false, error: 'method_not_allowed' })
      return
    }
    if (!sameOrigin(req)) {
      sendJson(res, 403, { ok: false, error: 'forbidden_origin' })
      return
    }

    let kind = 'input'
    let text
    try {
      text = await readText(req)
    } catch {
      sendJson(res, 413, { ok: false, error: 'payload_too_large' })
      return
    }
    if (text !== '') {
      let payload
      try {
        payload = JSON.parse(text)
      } catch {
        sendJson(res, 400, { ok: false, error: 'invalid_json' })
        return
      }
      if (typeof payload?.kind === 'string' && KINDS.has(payload.kind)) kind = payload.kind
    }

    const alert = pushAlert(kind, { test: true, reason: 'test' })
    sendJson(res, 200, { ok: true, delivered: listeners.size, alertId: alert?.id })
  }

  function handleTest(req, res) {
    void runTest(req, res).catch(() => {
      try {
        sendJson(res, 500, { ok: false, error: 'internal' })
      } catch {
        // The response was already committed.
      }
    })
  }

  /* ----------------------------------------------------------- push routes */

  function pushStateForClient() {
    return { config: pushConfig, status: pushStatus }
  }

  async function readJson(req, maxBytes) {
    const text = await readText(req, maxBytes)
    return JSON.parse(text)
  }

  async function runPush(req, res) {
    if (!sameOrigin(req)) {
      sendJson(res, 403, { ok: false, error: 'forbidden_origin' })
      return
    }
    if (req.method === 'GET') {
      sendJson(res, 200, { ok: true, ...pushStateForClient() })
      return
    }
    if (req.method !== 'POST') {
      sendJson(res, 405, { ok: false, error: 'method_not_allowed' })
      return
    }

    let body
    try {
      body = await readJson(req, 8192)
    } catch (error) {
      const tooLarge = error instanceof RangeError
      sendJson(res, tooLarge ? 413 : 400, {
        ok: false,
        error: tooLarge ? 'payload_too_large' : 'invalid_json',
      })
      return
    }

    let next
    try {
      next = sanitizePushConfig(body?.config ?? body, pushConfig)
    } catch (error) {
      sendJson(res, 400, {
        ok: false,
        error: error instanceof Error ? error.message : 'invalid_config',
      })
      return
    }
    try {
      savePushConfig(next)
    } catch {
      sendJson(res, 500, { ok: false, error: 'config_write_failed' })
      return
    }
    pushConfig = next
    sendJson(res, 200, { ok: true, ...pushStateForClient() })
  }

  async function runPushTest(req, res) {
    if (req.method !== 'POST') {
      sendJson(res, 405, { ok: false, error: 'method_not_allowed' })
      return
    }
    if (!sameOrigin(req)) {
      sendJson(res, 403, { ok: false, error: 'forbidden_origin' })
      return
    }

    let body
    try {
      body = await readJson(req, 8192)
    } catch (error) {
      const tooLarge = error instanceof RangeError
      sendJson(res, tooLarge ? 413 : 400, {
        ok: false,
        error: tooLarge ? 'payload_too_large' : 'invalid_json',
      })
      return
    }

    let config
    try {
      config = sanitizePushConfig(body?.config ?? body, pushConfig)
    } catch (error) {
      sendJson(res, 400, {
        ok: false,
        error: error instanceof Error ? error.message : 'invalid_config',
      })
      return
    }
    if (config.provider === 'ntfy' && config.topic === '') {
      sendJson(res, 400, { ok: false, error: 'missing_topic' })
      return
    }
    if (config.provider !== 'ntfy' && config.token === '') {
      sendJson(res, 400, { ok: false, error: 'missing_token' })
      return
    }

    const testPayload = {
      title: 'DSH · 测试推送',
      message: `${
        config.provider === 'ntfy'
          ? '如果你在手机上看到这条通知，说明 ntfy 推送已经打通。'
          : '如果你在微信里看到这条通知，说明手机推送已经打通。'
      } · ${timeStamp()}`,
      priority: 3,
      tags: ['bell'],
    }
    const result = await submitPush(config, testPayload, 'test')
    sendJson(res, 200, {
      ok: result.ok,
      httpStatus: result.httpStatus,
      error: result.error,
      status: pushStatus,
    })
  }

  function handlePush(req, res) {
    void runPush(req, res).catch(() => {
      try {
        sendJson(res, 500, { ok: false, error: 'internal' })
      } catch {
        // The response was already committed.
      }
    })
  }

  function handlePushTest(req, res) {
    void runPushTest(req, res).catch(() => {
      try {
        sendJson(res, 500, { ok: false, error: 'internal' })
      } catch {
        // The response was already committed.
      }
    })
  }


  ctx.on('api-session/added', (summary) => {
    const sessionId = summary?.sessionId
    if (typeof sessionId !== 'string') return
    running.set(sessionId, summary.running === true)
    pushState()
  })

  ctx.on('api-session/removed', (sessionId) => {
    running.delete(sessionId)
    pushState()
  })

  ctx.on('api-session/status', (sessionId, isRunning) => {
    if (typeof sessionId !== 'string') return
    const before = running.get(sessionId)
    running.set(sessionId, isRunning === true)
    pushState()
    if (before === true && isRunning !== true) {
      pushAlert('ended', sessionInfo(sessionId))
    }
  })

  ctx.on('api-session/error', (sessionId, message) => {
    const detail = message instanceof Error ? message.message : message
    pushAlert('error', {
      ...sessionInfo(sessionId),
      message: clip(typeof detail === 'string' ? detail : String(detail), 240),
    })
  })

  /**
   * A blocked approval or question is only a user-facing wait if it is still
   * open a moment later: auto-approval policies settle immediately, and
   * those must not ring.
   */
  function announceInput(payload) {
    let cancelled = false
    const timer = setTimeout(() => {
      if (!cancelled) pushAlert('input', payload)
    }, INPUT_DELAY_MS)
    timer.unref?.()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }

  /*
   * The Web UI answerer is a Remote Event bridge registered before this
   * plugin. It holds the waterfall open while the prompt waits for a human and
   * only delegates through `next()` when it declines, so a normal listener
   * here would never see a prompt that is actually on screen. Running first
   * lets the reminder timer start before the bridge takes over.
   */
  ctx.on(
    'approval/request',
    (request, next) => {
      const cancel = announceInput({
        ...sessionInfo(request?.agent?.id),
        reason: 'approval',
        toolName: clip(request?.toolName, 80),
      })
      let outcome
      try {
        outcome = next()
      } catch (error) {
        cancel()
        throw error
      }
      Promise.resolve(outcome).then(cancel, cancel)
      return outcome
    },
    { prepend: true },
  )

  ctx.on(
    'user-questions/request',
    (request, next) => {
      const questions = Array.isArray(request?.questions) ? request.questions : []
      const cancel = announceInput({
        ...sessionInfo(request?.agent?.id),
        reason: 'question',
        question: clip(questions[0]?.question, 200),
        count: questions.length,
      })
      let answer
      try {
        answer = next()
      } catch (error) {
        cancel()
        throw error
      }
      Promise.resolve(answer).then(cancel, cancel)
      return answer
    },
    { prepend: true },
  )

  /* ------------------------------------------------------------- lifecycle */

  ctx.effect(() => {
    const controller = service('sessionController')
    if (controller === undefined || typeof controller.list !== 'function') return
    const abort = new AbortController()
    let active = true
    controller
      .list({}, abort.signal)
      .then((value) => {
        if (!active) return
        for (const item of value?.items ?? []) {
          const sessionId = item?.sessionId
          if (typeof sessionId !== 'string' || running.has(sessionId)) continue
          running.set(sessionId, item.running === true)
        }
        pushState()
      })
      .catch(() => {
        // A cold Host may not have the projection ready yet; the status
        // events that follow still build the map from scratch.
      })
    return () => {
      active = false
      abort.abort()
    }
  }, 'session-sounds: running baseline')

  ctx.effect(
    () => ctx.webServer.register({ kind: 'exact', path: STREAM_PATH, handler: handleStream }),
    'session-sounds: alert stream',
  )
  ctx.effect(
    () => ctx.webServer.register({ kind: 'exact', path: TEST_PATH, handler: handleTest }),
    'session-sounds: test alert',
  )
  ctx.effect(
    () => ctx.webServer.register({ kind: 'exact', path: POLL_PATH, handler: handlePoll }),
    'session-sounds: alert poll',
  )
  ctx.effect(
    () => ctx.webServer.register({ kind: 'exact', path: PUSH_PATH, handler: handlePush }),
    'session-sounds: push config',
  )
  ctx.effect(
    () => ctx.webServer.register({ kind: 'exact', path: PUSH_TEST_PATH, handler: handlePushTest }),
    'session-sounds: push test',
  )

  ctx.effect(
    () => () => {
      disposed = true
      for (const listener of [...listeners]) dropListener(listener)
    },
    'session-sounds: teardown',
  )
}
