// DSH Plugin Guardian - Host entry (persistent plugin)
// 按当前 dsh 插件 API 实现：webServer HTTP RPC（替代已废弃的 harness.handle），
// 文件/命令操作使用 Node 内置模块，不依赖 ctx.get('fs')/ctx.get('shell') 等运行时服务。
import { existsSync, mkdirSync, readFileSync, readdirSync, copyFileSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'

const home = homedir()
const dshPath = join(home, '.dsh')
const profilePath = join(dshPath, 'profiles', 'web')
const SNAPSHOT_FILES = ['package.json', 'pnpm-lock.yaml', 'cordis.yml', 'cordis.patch.yml']

// 执行 shell 命令（zsh -lc），永不 reject：调用方按 exitCode 判定。
function run(cmd, cwd) {
  return new Promise((resolve) => {
    execFile('/bin/zsh', ['-lc', cmd], { cwd: cwd || home }, (err, stdout, stderr) => {
      resolve({ exitCode: err ? 1 : 0, stdout: stdout || '', stderr: stderr || '' })
    })
  })
}

// Shell 引号包裹，防命令注入。
function shellQuote(s) {
  return "'" + String(s).replace(/'/g, "'\\\"'\\\"'") + "'"
}

// 插件名校验：只允许安全字符。
function safeName(name) {
  if (typeof name !== 'string') return ''
  const m = name.match(/^[a-zA-Z0-9_\-.@/]+$/)
  return m ? name : ''
}

// ---------- RPC handlers ----------

// 已安装插件列表。
function listPlugins() {
  const result = []
  try {
    const pkg = JSON.parse(readFileSync(join(profilePath, 'package.json'), 'utf8'))
    const deps = pkg.dependencies || {}
    for (const name of Object.keys(deps)) {
      let dataPath = null
      if (existsSync(join(dshPath, name))) dataPath = join(dshPath, name)
      result.push({ name, version: String(deps[name]).replace(/^[\^~]/, ''), dataPath })
    }
  } catch (e) { /* 读不到 package.json 时返回空列表 */ }
  return result
}

// 扫描 .bak 残留文件（~/.dsh 与 profile 目录）。
function scanResidues() {
  const result = []
  for (const root of [dshPath, profilePath]) {
    let entries = []
    try { entries = readdirSync(root) } catch (e) { continue }
    for (const name of entries) {
      if (name.indexOf('.bak') >= 0) {
        result.push({ path: join(root, name), size: 0, sourcePlugin: 'unknown' })
      }
    }
  }
  return result
}

// 删除指定文件。
async function cleanFiles(args) {
  const paths = (args && Array.isArray(args.paths)) ? args.paths : []
  const errors = []
  for (const p of paths) {
    const r = await run('rm -f ' + shellQuote(p))
    if (r.exitCode !== 0) errors.push(String(p))
  }
  return { success: errors.length === 0, deleted: paths.length - errors.length, errors }
}

// 启动前体检：服务状态、组合配置、bundle 完整性。
// 端口 3080 被 DSH 占用是正常的（服务正在运行）；只有端口被占用但 DSH 进程不存在才是异常。
async function healthCheck() {
  const r = await run('lsof -ti :3080 2>/dev/null')
  const portHasProcess = r.exitCode === 0 && r.stdout && r.stdout.trim().length > 0
  const configOk = existsSync(join(profilePath, 'cordis.yml'))

  let bundlesOk = true
  try {
    const pkg = JSON.parse(readFileSync(join(profilePath, 'package.json'), 'utf8'))
    const deps = pkg.dependencies || {}
    for (const name of Object.keys(deps)) {
      if (!existsSync(join(profilePath, 'node_modules', name, 'package.json'))) {
        bundlesOk = false
        break
      }
    }
  } catch (e) { bundlesOk = false }

  return {
    service: portHasProcess ? 'running' : 'stopped',
    cordisConfig: configOk ? 'ok' : 'missing',
    bundles: bundlesOk ? 'ok' : 'broken',
  }
}

// 卸载前快照：复制 profile 关键文件到 ~/.dsh/.plugin-guard-snapshots/<ts>-<name>/。
async function createSnapshot(args) {
  const pluginName = safeName((args && args.pluginName) || '')
  if (!pluginName) return { success: false, message: 'invalid plugin name' }

  const snapDir = join(dshPath, '.plugin-guard-snapshots', String(Date.now()) + '-' + pluginName)
  const backed = []
  try {
    mkdirSync(snapDir, { recursive: true })
    for (const f of SNAPSHOT_FILES) {
      try {
        copyFileSync(join(profilePath, f), join(snapDir, f))
        backed.push(f)
      } catch (e) { /* 单个文件缺失不阻塞整体快照 */ }
    }
    return { success: true, snapshotPath: snapDir, files: backed }
  } catch (e) {
    return { success: false, message: 'snapshot failed' }
  }
}

// 安全卸载：快照 → pnpm remove → 清理数据目录与相关 .bak。
async function uninstallPlugin(args) {
  const pluginName = safeName((args && args.pluginName) || '')
  if (!pluginName) return { success: false, message: 'invalid plugin name' }

  const snap = await createSnapshot({ pluginName })
  if (!snap.success) return { success: false, message: 'snapshot failed' }

  const r = await run('pnpm remove ' + shellQuote(pluginName), profilePath)
  if (r.exitCode !== 0) {
    return { success: false, message: 'pnpm remove failed', snapshotPath: snap.snapshotPath }
  }

  const cleaned = []
  const dataDir = join(dshPath, pluginName)
  if (existsSync(dataDir)) {
    try { rmSync(dataDir, { recursive: true, force: true }); cleaned.push(dataDir) } catch (e) { /* 忽略 */ }
  }
  try {
    for (const name of readdirSync(profilePath)) {
      if (name.indexOf('.bak') >= 0 && name.indexOf(pluginName) >= 0) {
        try { rmSync(join(profilePath, name), { force: true }); cleaned.push(join(profilePath, name)) } catch (e) { /* 忽略 */ }
      }
    }
  } catch (e) { /* 忽略 */ }

  return {
    success: true,
    message: 'uninstalled ' + pluginName + ', cleaned ' + cleaned.length + ' items',
    snapshotPath: snap.snapshotPath,
    cleaned,
  }
}

// ---------- RPC 路由（webServer HTTP，JSON 进出，同源防护） ----------
const ROUTE_PREFIX = '/_dsh/dsh-plugin-guardian'
const ROUTES = { listPlugins, scanResidues, cleanFiles, healthCheck, createSnapshot, uninstallPlugin }
const MUTATING = { cleanFiles: true, uninstallPlugin: true } // 修改状态的方法需同源

function sameOrigin(req) {
  const fetchSite = (req.headers && (req.headers['sec-fetch-site'] || '')) || ''
  const origin = (req.headers && req.headers.origin) || ''
  const host = (req.headers && req.headers.host) || ''
  if (origin) return host.length > 0 && (origin === 'http://' + host || origin === 'https://' + host)
  return fetchSite === 'same-origin' || fetchSite === 'same-site' || fetchSite === 'none'
}

function readBody(req, maxBytes) {
  return new Promise(function (resolve, reject) {
    let size = 0
    const chunks = []
    req.on('data', function (c) { size += c.length; if (size > maxBytes) { reject(Object.assign(new Error('payload too large'), { status: 413 })); req.destroy(); return; } chunks.push(c) })
    req.on('end', function () { resolve(Buffer.concat(chunks).toString('utf8')) })
    req.on('error', reject)
  })
}

function respond(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(payload))
}

export default {
  apply(ctx) {
    ctx.inject(['webServer'], function (webCtx) {
      try {
        const dispose = webCtx.webServer.register({
          kind: 'prefix',
          path: ROUTE_PREFIX,
          handler: async function (req, res) {
            try {
              const url = new URL(req.url || '/', 'http://localhost')
              const path = url.pathname
              if (!path.startsWith(ROUTE_PREFIX + '/')) { respond(res, 404, { error: 'not found' }); return }
              const method = decodeURIComponent(path.slice(ROUTE_PREFIX.length + 1))
              if (!Object.hasOwn(ROUTES, method)) { respond(res, 404, { error: 'unknown method: ' + method }); return }
              if (Object.hasOwn(MUTATING, method) && !sameOrigin(req)) { respond(res, 403, { error: 'cross-origin request rejected' }); return }
              let args = null
              if (req.method === 'POST') {
                const raw = await readBody(req, 64 * 1024)
                if (raw.length > 0) { try { args = JSON.parse(raw) } catch (e) { respond(res, 400, { error: 'invalid JSON body' }); return } }
              }
              const result = await ROUTES[method](args)
              respond(res, 200, result)
            } catch (err) {
              const status = (err && err.status) || 500
              respond(res, status, { error: status === 500 ? 'internal error' : String((err && err.message) || err) })
            }
          },
        })
        return function () { dispose() }
      } catch (err) {
        console.warn('[dsh-plugin-guardian] webServer 路由注册失败', String((err && err.message) || err))
      }
    }, 'dsh-plugin-guardian: Web routes')
  },
}
