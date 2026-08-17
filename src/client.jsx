// DSH Plugin Guardian - Client side
// Settings page UI for plugin management

module.exports = {
  apply(ctx) {
    var slots = ctx.get('slots')
    if (!slots) return

    function GuardianPage() {
      var st = React.useRef({
        view: 'main', residues: [], plugins: [],
        health: null, loading: false, message: ''
      })
      var n = React.useReducer(function(x) { return x + 1 }, 0)
      var forceUpdate = n[1]
      var s = st.current
      var upd = function() { forceUpdate() }

      var setLoading = function(v) { s.loading = v; upd() }
      var setMsg = function(v) { s.message = v; upd() }

      var scanResidues = async function() {
        setLoading(true); setMsg('')
        try {
          var r = await host.call('scanResidues')
          s.residues = r; s.view = 'residues'
          setMsg('发现 ' + r.length + ' 个残留文件')
        } catch(e) { setMsg('扫描失败') }
        setLoading(false)
      }

      var runHealth = async function() {
        setLoading(true); setMsg('')
        try {
          var r = await host.call('healthCheck')
          s.health = r; s.view = 'health'; upd()
        } catch(e) { setMsg('体检失败') }
        setLoading(false)
      }

      var loadPlugins = async function() {
        setLoading(true); setMsg('')
        try {
          var r = await host.call('listPlugins')
          s.plugins = r; s.view = 'plugins'; upd()
        } catch(e) { setMsg('加载失败') }
        setLoading(false)
      }

      var uninstall = async function(name) {
        if (!confirm('确定要卸载插件 ' + name + ' 吗？')) return
        setLoading(true); setMsg('正在卸载 ' + name + '...')
        try {
          var r = await host.call('uninstallPlugin', { pluginName: name })
          if (r.success) {
            setMsg('卸载成功！请手动重启 DSH 服务使变更生效。')
            await loadPlugins()
          } else {
            setMsg('卸载失败: ' + r.message)
          }
        } catch(e) { setMsg('卸载失败') }
        setLoading(false)
      }

      var clean = async function(paths) {
        if (!confirm('确定要删除选中的 ' + paths.length + ' 个文件吗？')) return
        setLoading(true)
        try {
          var r = await host.call('cleanFiles', { paths: paths })
          if (r.success) {
            setMsg('清理完成，共删除 ' + r.deleted + ' 个文件')
            await scanResidues()
          } else { setMsg('清理失败') }
        } catch(e) { setMsg('清理失败') }
        setLoading(false)
      }

      var kids = []

      // Header
      kids.push(React.createElement('div',
        { style: { fontSize: '22px', fontWeight: 'bold', marginBottom: '5px' } },
        'DSH 插件管家'))
      kids.push(React.createElement('div',
        { style: { color: '#888', fontSize: '14px', marginBottom: '20px' } },
        '安全地卸载插件、清理残留、出问题一键退回'))

      // Action buttons
      kids.push(React.createElement('div',
        { style: { display: 'flex', gap: '10px', marginBottom: '20px' } },
        React.createElement('button',
          { style: btnStyle(), onClick: loadPlugins, disabled: s.loading }, '已装插件'),
        React.createElement('button',
          { style: btnStyle(), onClick: scanResidues, disabled: s.loading }, '扫描残留'),
        React.createElement('button',
          { style: btnStyle(), onClick: runHealth, disabled: s.loading }, '启动前体检')))

      // Message
      if (s.message)
        kids.push(React.createElement('div', { style: msgStyle() }, s.message))

      // Loading
      if (s.loading)
        kids.push(React.createElement('div',
          { style: { padding: '20px', textAlign: 'center', color: '#888' } }, '正在处理...'))

      // Plugins view
      if (s.view === 'plugins' && s.plugins.length > 0) {
        var pitems = s.plugins.map(function(p) {
          return React.createElement('div',
            { key: p.name, style: cardStyle() },
            React.createElement('div',
              { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
              React.createElement('div', null,
                React.createElement('strong', null, p.name),
                React.createElement('span',
                  { style: { color: '#888', marginLeft: '8px' } }, 'v' + p.version)),
              React.createElement('button',
                { style: dangerBtn(), onClick: function() { uninstall(p.name) }, disabled: s.loading },
                '卸载')))
        })
        kids.push(React.createElement('div', null,
          React.createElement('h3', { style: { marginBottom: '10px' } },
            '已安装插件 (' + s.plugins.length + ')'), pitems))
      }

      // Residues view
      if (s.view === 'residues') {
        if (s.residues.length === 0) {
          kids.push(React.createElement('div',
            { style: { color: '#888', padding: '20px' } }, '未发现残留文件，很干净！'))
        } else {
          var ritems = s.residues.map(function(r) {
            return React.createElement('div',
              { key: r.path, style: { padding: '8px', borderBottom: '1px solid #f0f0f0', fontSize: '13px' } },
              r.path)
          })
          kids.push(React.createElement('div', null,
            React.createElement('h3', { style: { marginBottom: '10px' } },
              '残留文件 (' + s.residues.length + ')'), ritems,
            React.createElement('button',
              { style: dangerBtn(), onClick: function() {
                clean(s.residues.map(function(r) { return r.path }))
              }, disabled: s.loading }, '一键清理全部')))
        }
      }

      // Health view
      if (s.view === 'health' && s.health) {
        var hp = s.health.port3080 === 'free'
        var hc = s.health.cordisConfig === 'ok'
        kids.push(React.createElement('div', null,
          React.createElement('h3', { style: { marginBottom: '10px' } }, '体检结果'),
          React.createElement('div', { style: cardStyle() },
            healthRow('端口 3080', hp ? '空闲' : '占用', hp),
            healthRow('组合配置', hc ? '正常' : '异常', hc),
            healthRow('Bundle 状态',
              s.health.bundles === 'ok' ? '正常' : '需检查',
              s.health.bundles === 'ok'))))
      }

      // Main view
      if (s.view === 'main') {
        kids.push(React.createElement('div', { style: cardStyle() },
          React.createElement('h3', null, '功能说明'),
          React.createElement('ul', { style: { lineHeight: '1.8', color: '#555' } },
            React.createElement('li', null, '已装插件：查看所有已安装的插件，支持一键卸载'),
            React.createElement('li', null, '扫描残留：查找 .bak 备份文件和孤立数据目录'),
            React.createElement('li', null, '启动前体检：检查端口占用和配置完整性'))))
      }

      return React.createElement('div',
        { style: { padding: '20px', maxWidth: '900px', fontFamily: 'system-ui, sans-serif' } }, kids)
    }

    // Style helpers
    function btnStyle() {
      return { padding: '10px 20px', cursor: 'pointer', border: '1px solid #ddd',
        borderRadius: '5px', background: '#fff' }
    }
    function cardStyle() {
      return { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px', marginBottom: '10px' }
    }
    function dangerBtn() {
      return { padding: '6px 14px', cursor: 'pointer', border: '1px solid #dc2626',
        borderRadius: '5px', background: '#dc2626', color: '#fff', fontSize: '13px' }
    }
    function msgStyle() {
      return { padding: '10px', borderRadius: '5px', marginBottom: '10px',
        background: '#eff6ff', color: '#1e40af', fontSize: '14px' }
    }
    function healthRow(label, text, ok) {
      return React.createElement('div',
        { style: { display: 'flex', justifyContent: 'space-between', padding: '10px',
          borderBottom: '1px solid #f0f0f0' } },
        React.createElement('span', null, label),
        React.createElement('span',
          { style: { background: ok ? '#d1fae5' : '#fee2e2', color: ok ? '#065f46' : '#991b1b',
            padding: '2px 8px', borderRadius: '12px', fontSize: '12px' } }, text))
    }

    slots.inject('settings.section', function() {
      slots.register(
        { name: 'settings.section', id: 'plugin-guardian', order: 100, label: '插件管家' },
        function() { return React.createElement(GuardianPage) })
    })
  }
}
