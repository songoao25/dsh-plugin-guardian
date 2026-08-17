window.__ModuleLoader__.load({ id: "dsh-plugin-guardian", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
// DSH Plugin Guardian — client half
// 设置页分区：插件管家。按官方 settings.section 范式注册。
// UI 风格：CSS Modules（注入 <style> + 类名），官方 CSS 变量，SVG 图标，零 emoji。
'use strict';

var React = require('react');
var P = require('@deepseek-ai/dsh-client-ui-primitives');

var RPC_BASE = '/_dsh/dsh-plugin-guardian';

function rpc(method, args) {
  return fetch(RPC_BASE + '/' + method, {
    method: args ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json' },
    body: args ? JSON.stringify(args) : undefined,
  }).then(function (r) {
    return r.json().then(function (body) {
      if (!r.ok) throw new Error((body && body.error) || ('HTTP ' + r.status));
      return body;
    });
  });
}

// ── CSS 注入（一次） ──
var CSS_TAG = 'dsh-plugin-guardian/page';
function installStyles() {
  if (typeof document === 'undefined') return function(){};
  var existing = document.querySelector('style[data-plugin-css="' + CSS_TAG + '"]');
  if (existing) return function(){};
  var tag = document.createElement('style');
  tag.dataset.plugin = 'dsh-plugin-guardian';
  tag.dataset.pluginCss = CSS_TAG;
  tag.textContent = [
    '.pg-section{max-width:760px;color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;gap:12px}',
    '.pg-heading{margin:0;font-size:18px;font-weight:600;line-height:1.4;color:var(--dsw-alias-label-primary)}',
    '.pg-intro{margin:0;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}',
    '.pg-tabs{border-bottom:1px solid var(--dsw-alias-border-l2);display:flex;align-items:flex-end;gap:22px;margin-top:2px}',
    '.pg-tab{color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:transparent;border:0;padding:7px 1px 9px;font-size:13px;line-height:20px;position:relative}',
    '.pg-tab:hover{color:var(--dsw-alias-label-primary)}',
    '.pg-tab[data-active="true"]{color:var(--dsw-alias-label-primary)}',
    '.pg-tab[data-active="true"]::after{content:"";position:absolute;bottom:-1px;left:0;right:0;height:2px;background:var(--dsw-alias-label-primary);border-radius:2px 2px 0 0}',
    '.pg-tab:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px;color:var(--dsw-alias-label-primary);border-radius:2px}',
    '.pg-tab:disabled{opacity:.4;cursor:default}',
    '.pg-btn{appearance:none;font:inherit;cursor:pointer;border:1px solid transparent;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5;transition:background .16s,border-color .16s,color .16s}',
    '.pg-btnPrimary{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3);border-color:var(--dsw-alias-label-primary)}',
    '.pg-btnPrimary:hover:not(:disabled){background:var(--dsw-alias-label-dimmed);border-color:var(--dsw-alias-label-dimmed)}',
    '.pg-btnOutline{background:transparent;border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary)}',
    '.pg-btnOutline:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}',
    '.pg-btnDanger{background:transparent;border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}',
    '.pg-btnDanger:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent)}',
    '.pg-btn:disabled{opacity:.4;cursor:default}',
    '.pg-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
    '.pg-cards{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}',
    '.pg-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;overflow:hidden;transition:border-color .16s}',
    '.pg-card:hover{border-color:var(--dsw-alias-label-dimmed)}',
    '.pg-cardRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px}',
    '.pg-cardName{font-size:15px;font-weight:600;line-height:1.4;color:var(--dsw-alias-label-primary)}',
    '.pg-cardMeta{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary);margin-top:3px}',
    '.pg-cardTrailing{display:inline-flex;align-items:center;gap:7px;flex:none}',
    '.pg-resRow{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:13px;color:var(--dsw-alias-label-secondary)}',
    '.pg-resRow:last-child{border-bottom:0}',
    '.pg-resPath{flex:1;font-family:var(--ds-font-family-code);font-size:12px;overflow-wrap:anywhere}',
    '.pg-healthRow{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}',
    '.pg-healthRow:last-child{border-bottom:0}',
    '.pg-healthLabel{font-size:14px;color:var(--dsw-alias-label-primary);display:inline-flex;align-items:center;gap:8px}',
    '.pg-healthValue{display:inline-flex;align-items:center;gap:7px;font-size:13px}',
    '.pg-dot{width:7px;height:7px;border-radius:999px;flex:none;display:inline-block}',
    '.pg-dotOk{background:var(--dsw-alias-state-success-primary)}',
    '.pg-dotErr{background:var(--dsw-alias-state-error-primary)}',
    '.pg-dotWarn{background:var(--dsw-alias-state-warn-primary)}',
    '.pg-notice{padding:10px 14px;border-radius:8px;font-size:13px;line-height:1.5}',
    '.pg-noticeOk{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 10%,transparent);color:var(--dsw-alias-label-primary)}',
    '.pg-noticeErr{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent);color:var(--dsw-alias-state-error-primary)}',
    '.pg-noticeInfo{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary)}',
    '.pg-empty{padding:32px 16px;text-align:center;font-size:14px;color:var(--dsw-alias-label-tertiary)}',
    '.pg-loading{padding:24px;text-align:center;font-size:14px;color:var(--dsw-alias-label-tertiary);display:flex;align-items:center;justify-content:center;gap:8px}',
    '.pg-badge{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}',
    '.pg-hint{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary);padding:8px 0}',
    '.pg-confirmOverlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:9999}',
    '.pg-confirmBox{background:var(--dsw-alias-bg-overlay);border-radius:12px;padding:24px;max-width:400px;width:90%;box-shadow:0 8px 30px rgba(0,0,0,0.12)}',
    '.pg-confirmTitle{font-size:16px;font-weight:600;margin-bottom:8px;color:var(--dsw-alias-label-primary)}',
    '.pg-confirmBody{font-size:13px;line-height:1.6;color:var(--dsw-alias-label-secondary);margin-bottom:16px}',
    '.pg-confirmActions{display:flex;gap:10px;justify-content:flex-end}',
    '.pg-confirmCheck{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--dsw-alias-label-secondary);margin-bottom:16px;cursor:pointer}',
  ].join('\n');
  document.head.appendChild(tag);
  return function(){ tag.remove(); };
}

module.exports = {
  inject: ['slots'],
  async apply(ctx) {
    var slots = ctx.slots || ctx.get('slots');
    for (var i = 0; slots === undefined && i < 60; i++) {
      await new Promise(function(r){ window.setTimeout(r, 300); });
      slots = ctx.slots || ctx.get('slots');
    }
    if (!slots) { console.warn('[plugin-guardian] slots not ready'); return; }

    var disposeStyles = installStyles();

    function icon(name, size) {
      var fn = P[name];
      if (!fn) return null;
      return fn({ size: size || 16, 'aria-hidden': 'true' });
    }

    function h(tag, props) {
      var args = [tag, props];
      for (var j = 2; j < arguments.length; j++) args.push(arguments[j]);
      return React.createElement.apply(React, args);
    }

    function ConfirmDialog(props) {
      var ck = React.useState(false);
      var isChecked = ck[0], setChecked = ck[1];
      return h('div', { className: 'pg-confirmOverlay', onClick: props.onCancel },
        h('div', { className: 'pg-confirmBox', onClick: function(e){ e.stopPropagation(); } },
          h('div', { className: 'pg-confirmTitle' }, props.title || '确认操作'),
          h('div', { className: 'pg-confirmBody' }, props.body || ''),
          h('label', { className: 'pg-confirmCheck' },
            h('input', { type: 'checkbox', checked: isChecked, onChange: function(e){ setChecked(e.target.checked); } }),
            '我已知晓后果'
          ),
          h('div', { className: 'pg-confirmActions' },
            h('button', { className: 'pg-btn pg-btnOutline', onClick: props.onCancel }, props.cancelLabel || '取消'),
            h('button', {
              className: 'pg-btn ' + (props.danger !== false ? 'pg-btnDanger' : 'pg-btnPrimary'),
              onClick: props.onConfirm,
              disabled: !isChecked
            }, props.confirmLabel || '确认')
          )
        )
      );
    }

    function GuardianPage() {
      var st = React.useState({ tab: 'installed', residues: [], plugins: [], health: null, loading: false, notice: null, confirm: null, loaded: {} });
      var state = st[0], setState = st[1];

      function upd(patch) { setState(function(p){ return Object.assign({}, p, patch); }); }
      function setNotice(msg, type) { upd({ notice: { msg: msg, type: type || 'info' } }); }
      function clearNotice() { upd({ notice: null }); }
      function setLoading(v) { upd({ loading: v }); }

      function loadPlugins() {
        setLoading(true); clearNotice();
        rpc('listPlugins').then(function(r){
          upd({ plugins: r, loading: false, loaded: Object.assign({}, state.loaded, { installed: true }) });
        }).catch(function(e){
          upd({ loading: false });
          setNotice('加载失败：' + (e.message || '未知错误'), 'err');
        });
      }

      function scanResidues() {
        setLoading(true); clearNotice();
        rpc('scanResidues').then(function(r){
          upd({ residues: r, loading: false });
          if (r.length === 0) setNotice('未发现残留文件，工作台很干净', 'ok');
        }).catch(function(e){
          upd({ loading: false });
          setNotice('扫描失败：' + (e.message || '未知错误'), 'err');
        });
      }

      function runHealth() {
        setLoading(true); clearNotice();
        rpc('healthCheck').then(function(r){
          upd({ health: r, loading: false });
        }).catch(function(e){
          upd({ loading: false });
          setNotice('体检失败：' + (e.message || '未知错误'), 'err');
        });
      }

      function doUninstall(name) {
        upd({ confirm: {
          title: '卸载插件',
          body: '即将卸载插件「' + name + '」。系统会先自动备份配置文件（快照），然后执行卸载并清理残留。卸载后需要手动重启 DSH 服务才能生效。',
          confirmLabel: '确认卸载',
          danger: true,
          onConfirm: function() {
            upd({ confirm: null, loading: true });
            setNotice('正在卸载「' + name + '」...');
            rpc('uninstallPlugin', { pluginName: name }).then(function(r){
              if (r.success) {
                setNotice('卸载成功。已清理 ' + (r.cleaned ? r.cleaned.length : 0) + ' 个残留项。请手动重启 DSH 服务使变更生效。', 'ok');
                loadPlugins();
              } else {
                upd({ loading: false });
                setNotice('卸载失败：' + (r.message || '未知错误'), 'err');
              }
            }).catch(function(e){
              upd({ loading: false });
              setNotice('卸载失败：' + (e.message || '未知错误'), 'err');
            });
          },
          onCancel: function() { upd({ confirm: null }); }
        }});
      }

      function doClean(paths) {
        upd({ confirm: {
          title: '清理残留文件',
          body: '即将删除 ' + paths.length + ' 个残留文件。删除后无法恢复，请确认。',
          confirmLabel: '确认清理',
          danger: true,
          onConfirm: function() {
            upd({ confirm: null, loading: true });
            rpc('cleanFiles', { paths: paths }).then(function(r){
              if (r.success) {
                setNotice('清理完成，共删除 ' + r.deleted + ' 个文件', 'ok');
                scanResidues();
              } else {
                upd({ loading: false });
                setNotice('部分文件未能删除', 'err');
              }
            }).catch(function(e){
              upd({ loading: false });
              setNotice('清理失败：' + (e.message || '未知错误'), 'err');
            });
          },
          onCancel: function() { upd({ confirm: null }); }
        }});
      }

      React.useEffect(function(){
        if (state.tab === 'installed' && !state.loaded.installed) loadPlugins();
        if (state.tab === 'residue' && !state.loaded.residue) { scanResidues(); upd({ loaded: Object.assign({}, state.loaded, { residue: true }) }); }
      }, [state.tab]);

      var s = state;
      var kids = [];

      kids.push(h('h2', { className: 'pg-heading' }, '插件管家'));
      kids.push(h('p', { className: 'pg-intro' }, '安全地卸载插件、自动清理残留。全程图形操作，无需命令行。'));

      var tabs = [
        { id: 'installed', label: '已安装插件' },
        { id: 'residue', label: '残留清理' },
      ];
      kids.push(h('div', { className: 'pg-tabs', role: 'tablist' },
        tabs.map(function(t){
          return h('button', {
            key: t.id, className: 'pg-tab', role: 'tab',
            'aria-selected': s.tab === t.id, 'data-active': s.tab === t.id,
            onClick: function(){ upd({ tab: t.id }); clearNotice(); },
          }, t.label);
        })
      ));

      if (s.notice) {
        var cls = 'pg-notice pg-notice' + (s.notice.type === 'ok' ? 'Ok' : s.notice.type === 'err' ? 'Err' : 'Info');
        kids.push(h('div', { className: cls }, s.notice.msg));
      }

      if (s.loading) {
        kids.push(h('div', { className: 'pg-loading' },
          icon('IconLoadingOutline16', 16),
          h('span', null, '正在处理...')
        ));
      }

      if (s.tab === 'installed' && !s.loading) {
        if (s.plugins.length === 0) {
          kids.push(h('div', { className: 'pg-empty' }, '当前没有安装任何插件'));
        } else {
          kids.push(h('div', { className: 'pg-hint' }, '共 ' + s.plugins.length + ' 个已安装插件。点击右侧「卸载」安全移除（自动备份配置 + 清理残留）。'));
          var cards = s.plugins.map(function(p){
            var meta = '版本 ' + p.version;
            if (p.dataPath) meta += ' · 数据目录 ' + p.dataPath;
            return h('li', { key: p.name, className: 'pg-card' },
              h('div', { className: 'pg-cardRow' },
                h('div', null,
                  h('div', { className: 'pg-cardName' }, p.name),
                  h('div', { className: 'pg-cardMeta' }, meta)
                ),
                h('div', { className: 'pg-cardTrailing' },
                  h('button', {
                    className: 'pg-btn pg-btnDanger',
                    onClick: function(){ doUninstall(p.name); },
                    disabled: s.loading
                  }, icon('IconTrashOutline16', 14), ' 卸载')
                )
              )
            );
          });
          kids.push(h('ul', { className: 'pg-cards', role: 'tabpanel' }, cards));
        }
      }

      if (s.tab === 'residue' && !s.loading) {
        if (s.residues.length === 0 && !s.notice) {
          kids.push(h('div', { className: 'pg-empty' }, '未发现残留文件'));
        } else if (s.residues.length > 0) {
          kids.push(h('div', { className: 'pg-hint' }, '发现 ' + s.residues.length + ' 个残留文件，确认后可一键清理。'));
          var rows = s.residues.map(function(r){
            return h('div', { key: r.path, className: 'pg-resRow' },
              icon('IconWarningOutline16', 14),
              h('span', { className: 'pg-resPath' }, r.path)
            );
          });
          kids.push(h('div', { className: 'pg-card', role: 'tabpanel' }, rows));
          kids.push(h('button', {
            className: 'pg-btn pg-btnDanger',
            onClick: function(){ doClean(s.residues.map(function(r){ return r.path; })); },
            disabled: s.loading
          }, '清理全部（' + s.residues.length + ' 个文件）'));
        }
      }

      if (s.confirm) kids.push(h(ConfirmDialog, s.confirm));

      return h('div', { className: 'pg-section' }, kids);
    }

    var dispose = ctx.slots.inject('settings.section', function () {
      return ctx.slots.register(
        { name: 'settings.section', id: 'plugin-guardian', order: 100,
          label: function () { return '插件管家'; }, children: {} },
        GuardianPage
      );
    });

    return function () { if (dispose) dispose(); if (disposeStyles) disposeStyles(); };
  },
};

return module.exports;
} });
