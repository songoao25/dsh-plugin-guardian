// DSH Plugin Guardian - Host side
// Safe uninstall with snapshot rollback for DeepSeek Harness plugins

module.exports = {
  apply(ctx) {
    var fs = ctx.get('fs')
    var shell = ctx.get('shell')
    var home = ''
    try { home = process.env.HOME || '' } catch(e) {}
    var dshPath = home + '/.dsh'
    var profilePath = dshPath + '/profiles/web'

    // Shell quoting to prevent command injection
    var shellQuote = function(s) {
      return "'" + String(s).replace(/'/g, "'\"'\"'") + "'"
    }

    // Validate plugin name - only allow safe characters
    var safeName = function(name) {
      if (typeof name !== 'string') return ''
      var m = name.match(/^[a-zA-Z0-9_\-.@/]+$/)
      return m ? name : ''
    }

    // FR-7: List installed plugins
    harness.handle('listPlugins', async function() {
      var result = []
      try {
        var pkgText = await fs.readText({ path: profilePath + '/package.json' })
        var pkg = JSON.parse(pkgText)
        var deps = pkg.dependencies || {}
        var keys = Object.keys(deps)
        for (var i = 0; i < keys.length; i++) {
          var name = keys[i]
          var dataPath = null
          try {
            await fs.stat({ path: dshPath + '/' + name })
            dataPath = dshPath + '/' + name
          } catch(e) {}
          result.push({
            name: name,
            version: String(deps[name]).replace(/^[\\^~]/, ''),
            dataPath: dataPath
          })
        }
      } catch(e) {}
      return result
    })

    // FR-1: Scan for residue files (.bak files)
    harness.handle('scanResidues', async function() {
      var result = []
      try {
        var entries = await fs.listDir({ path: dshPath })
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].name.indexOf('.bak') >= 0) {
            result.push({
              path: dshPath + '/' + entries[i].name,
              size: 0,
              sourcePlugin: 'unknown'
            })
          }
        }
      } catch(e) {}
      try {
        var pentries = await fs.listDir({ path: profilePath })
        for (var j = 0; j < pentries.length; j++) {
          if (pentries[j].name.indexOf('.bak') >= 0) {
            result.push({
              path: profilePath + '/' + pentries[j].name,
              size: 0,
              sourcePlugin: 'unknown'
            })
          }
        }
      } catch(e) {}
      return result
    })

    // FR-1: Clean selected files
    harness.handle('cleanFiles', async function(args) {
      var paths = args && args.paths || []
      var deleted = 0
      var errors = []
      for (var i = 0; i < paths.length; i++) {
        try {
          await shell.run({ command: 'rm -f ' + shellQuote(paths[i]), cwd: home })
          deleted++
        } catch(e) {
          errors.push(String(paths[i]))
        }
      }
      return { success: errors.length === 0, deleted: deleted, errors: errors }
    })

    // FR-4: Health check before startup
    harness.handle('healthCheck', async function() {
      var portInUse = false
      try {
        var r = await shell.run({ command: 'lsof -i :3080', cwd: home })
        portInUse = r.exitCode === 0
      } catch(e) {}

      var configOk = true
      try {
        await fs.stat({ path: profilePath + '/cordis.yml' })
      } catch(e) {
        configOk = false
      }

      var bundlesOk = true
      try {
        var pkgText = await fs.readText({ path: profilePath + '/package.json' })
        var pkg = JSON.parse(pkgText)
        var deps = pkg.dependencies || {}
        var dkeys = Object.keys(deps)
        for (var i = 0; i < dkeys.length; i++) {
          try {
            await fs.stat({ path: profilePath + '/node_modules/' + dkeys[i] + '/package.json' })
          } catch(e) {
            bundlesOk = false
            break
          }
        }
      } catch(e) {
        bundlesOk = false
      }

      return {
        port3080: portInUse ? 'occupied' : 'free',
        cordisConfig: configOk ? 'ok' : 'missing',
        bundles: bundlesOk ? 'ok' : 'broken'
      }
    })

    // FR-2: Create snapshot before uninstall
    harness.handle('createSnapshot', async function(args) {
      var rawName = args && args.pluginName || ''
      var pluginName = safeName(rawName)
      if (!pluginName) return { success: false, message: 'invalid plugin name' }

      var timestamp = Date.now()
      var snapDir = dshPath + '/.plugin-guard-snapshots/' + timestamp + '-' + pluginName
      var backed = []

      try {
        await shell.run({ command: 'mkdir -p ' + shellQuote(snapDir), cwd: home })
        var files = ['package.json', 'pnpm-lock.yaml', 'cordis.yml', 'cordis.patch.yml']
        for (var i = 0; i < files.length; i++) {
          try {
            await shell.run({
              command: 'cp ' + shellQuote(profilePath + '/' + files[i]) + ' ' + shellQuote(snapDir + '/' + files[i]),
              cwd: home
            })
            backed.push(files[i])
          } catch(e) {}
        }
        return { success: true, snapshotPath: snapDir, files: backed }
      } catch(e) {
        return { success: false, message: 'snapshot failed' }
      }
    })

    // FR-6: Safe uninstall with snapshot + cleanup
    harness.handle('uninstallPlugin', async function(args) {
      var rawName = args && args.pluginName || ''
      var pluginName = safeName(rawName)
      if (!pluginName) return { success: false, message: 'invalid plugin name' }

      // Step 1: Create snapshot
      var snap = await harness.invoke('createSnapshot', { pluginName: pluginName })
      if (!snap.success) return { success: false, message: 'snapshot failed' }

      // Step 2: pnpm remove
      try {
        await shell.run({ command: 'pnpm remove ' + shellQuote(pluginName), cwd: profilePath })
      } catch(e) {
        return { success: false, message: 'pnpm remove failed', snapshotPath: snap.snapshotPath }
      }

      // Step 3: Clean plugin data directory
      var cleaned = []
      try {
        await fs.stat({ path: dshPath + '/' + pluginName })
        await shell.run({ command: 'rm -rf ' + shellQuote(dshPath + '/' + pluginName), cwd: home })
        cleaned.push(dshPath + '/' + pluginName)
      } catch(e) {}

      // Step 4: Clean .bak files related to this plugin
      try {
        var pentries = await fs.listDir({ path: profilePath })
        for (var j = 0; j < pentries.length; j++) {
          if (pentries[j].name.indexOf('.bak') >= 0 && pentries[j].name.indexOf(pluginName) >= 0) {
            await shell.run({ command: 'rm -f ' + shellQuote(profilePath + '/' + pentries[j].name), cwd: home })
            cleaned.push(profilePath + '/' + pentries[j].name)
          }
        }
      } catch(e) {}

      return {
        success: true,
        message: 'uninstalled ' + pluginName + ', cleaned ' + cleaned.length + ' items',
        snapshotPath: snap.snapshotPath,
        cleaned: cleaned
      }
    })
  }
}
