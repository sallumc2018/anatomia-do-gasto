Param(
  [string]$Adb = "",
  [string]$AdbHome = "C:\Omega\tmp\android-adb-home",
  [string]$MonitorRoot = "C:\Omega\tmp",
  [int]$Port = 8765,
  [string]$BrowserPackage = "org.mozilla.fennec_fdroid",
  [ValidateSet("UsbReverse", "Wifi")]
  [string]$Transport = "UsbReverse",
  [string]$BindAddress = "127.0.0.1",
  [switch]$SkipFullscreen,
  [switch]$ResetAndroidState
)

$ErrorActionPreference = "Stop"

function Resolve-AdbPath {
  param([string]$Preferred)

  $candidates = @(
    $Preferred,
    "C:\Omega\Sistema\Ferramentas_WSL_e_Binarios\infra\adb\adb.exe",
    "C:\Omega\03_Ferramentas\infra\adb\adb.exe",
    "C:\Omega\03_Ferramentas\adb_root_legacy\adb.exe"
  ) | Where-Object { $_ }

  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  throw "adb.exe nao encontrado. Informe -Adb ou configure a infraestrutura local do tablet."
}

function Write-MonitorHtml {
  param([string]$Path)

  $html = @'
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0b0d10">
  <link rel="manifest" href="omega-monitor.webmanifest">
  <title>Omega Monitor</title>
  <style>
    :root {
      color-scheme: dark;
      --bg:#0b0d10; --surface:#111820; --panel:#17202a; --panel-2:#1d2833;
      --line:#2d3946; --text:#f5f7fa; --muted:#a9b4bf;
      --ok:#22c55e; --warn:#f59e0b; --bad:#ef4444; --info:#38bdf8;
    }
    * { box-sizing: border-box; }
    html, body { min-height:100%; }
    body { margin:0; font-family: system-ui, -apple-system, Segoe UI, sans-serif; background:var(--bg); color:var(--text); }
    body::before { content:""; position:fixed; inset:0; pointer-events:none; background:linear-gradient(180deg, rgba(56,189,248,.07), transparent 38%); }
    header { position:sticky; top:0; z-index:2; display:flex; justify-content:space-between; gap:12px; align-items:center; padding:10px 14px; background:rgba(11,13,16,.96); border-bottom:1px solid var(--line); }
    h1 { margin:0; font-size:16px; font-weight:760; letter-spacing:0; }
    main { position:relative; display:grid; gap:10px; padding:10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    section { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:12px; min-width:0; }
    h2 { margin:0 0 10px; font-size:12px; color:var(--muted); font-weight:760; text-transform:uppercase; }
    dl { margin:0; display:grid; grid-template-columns: 104px 1fr; gap:8px 10px; font-size:14px; }
    dt { color:var(--muted); }
    dd { margin:0; min-width:0; overflow-wrap:anywhere; }
    pre { margin:0; max-height:38vh; overflow:auto; white-space:pre-wrap; overflow-wrap:anywhere; font:12px/1.45 ui-monospace, SFMono-Regular, Consolas, monospace; color:#dbe4ee; }
    details { border-top:1px solid var(--line); padding-top:8px; }
    summary { cursor:pointer; color:var(--muted); font-size:13px; }
    .hero { grid-column:1 / -1; display:grid; grid-template-columns: minmax(0, 1.5fr) repeat(3, minmax(120px, .5fr)); gap:10px; background:var(--surface); }
    .state { display:flex; gap:10px; align-items:center; min-width:0; }
    .dot { width:14px; height:14px; border-radius:50%; color:var(--muted); background:currentColor; box-shadow:0 0 22px currentColor; flex:0 0 auto; }
    .headline { margin:0; font-size:28px; line-height:1.05; font-weight:780; }
    .subline { margin:5px 0 0; color:var(--muted); font-size:14px; overflow-wrap:anywhere; }
    .metric { background:var(--panel-2); border:1px solid var(--line); border-radius:8px; padding:10px; }
    .metric strong { display:block; margin-top:4px; font-size:24px; line-height:1.1; }
    .label { color:var(--muted); font-size:12px; text-transform:uppercase; font-weight:720; }
    .next { border-left:4px solid var(--warn); background:var(--surface); }
    .next p { margin:0; font-size:18px; line-height:1.35; font-weight:720; }
    .next small { display:block; margin-top:7px; color:var(--muted); font-size:13px; line-height:1.35; }
    .span-2 { grid-column:span 2; }
    .pills { display:flex; flex-wrap:wrap; gap:7px; }
    .pill { display:inline-flex; align-items:center; gap:6px; border:1px solid var(--line); border-radius:999px; padding:6px 9px; background:var(--panel-2); font-size:12px; }
    .ok { color:var(--ok); } .warn { color:var(--warn); } .bad { color:var(--bad); }
    .stamp { color:var(--muted); font:12px ui-monospace, Consolas, monospace; }
    @media (max-width: 900px) {
      main { grid-template-columns:1fr; }
      .hero { grid-template-columns:1fr 1fr; }
      .state { grid-column:1 / -1; }
      .span-2 { grid-column:span 1; }
      .headline { font-size:30px; }
      pre { max-height:30vh; }
    }
    @media (orientation: portrait) {
      main { grid-template-columns:1fr; }
      .hero { grid-template-columns:1fr 1fr; }
      .state { grid-column:1 / -1; }
      .span-2 { grid-column:span 1; }
      section { padding:14px; }
      dl { font-size:15px; }
      .pill { font-size:13px; padding:7px 10px; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Omega Monitor</h1>
    <div class="stamp" id="stamp">carregando</div>
  </header>
  <main>
    <section class="hero">
      <div class="state">
        <span class="dot" id="stateDot"></span>
        <div>
          <p class="headline" id="headline">Carregando</p>
          <p class="subline" id="subline">Aguardando o primeiro snapshot do Omega.</p>
        </div>
      </div>
      <div class="metric"><span class="label">Prioridade</span><strong id="priority">-</strong></div>
      <div class="metric"><span class="label">Memoria livre</span><strong id="memoryFree">-</strong></div>
      <div class="metric"><span class="label">Sync tablet</span><strong id="syncAge">-</strong></div>
    </section>
    <section class="span-2 next"><h2>Proxima acao</h2><p id="nextAction">Aguardando leitura do monitor.</p><small id="nextReason"></small></section>
    <section><h2>Estado do PC</h2><dl id="pc"></dl></section>
    <section><h2>Repositorio</h2><dl id="git"></dl></section>
    <section class="span-2"><h2>Maestro Watch</h2><dl id="maestro"></dl></section>
    <section class="span-2"><h2>O que precisa de atencao</h2><div class="pills" id="actions"></div></section>
    <section class="span-2"><h2>Detalhes tecnicos</h2><details><summary>Seguranca</summary><pre id="security">carregando</pre></details><details><summary>Ultima auditoria</summary><pre id="audit">carregando</pre></details><details><summary>Sync do tablet</summary><pre id="sync">carregando</pre></details></section>
  </main>
  <script>
    const esc = (v) => String(v ?? "-").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const statusClass = (v) => /ALERT|FAIL|erro|failed/i.test(String(v)) ? "bad" : (/warn|pendente|Verificar/i.test(String(v)) ? "warn" : "ok");
    const getLine = (text, key) => (text.match(new RegExp("^" + key + ":\\s*(.+)$", "m")) || [null, "-"])[1].trim();
    const fmtBytes = (n) => {
      n = Number(n || 0);
      if (!n) return "-";
      if (n > 1024 ** 3) return Math.round(n / 1024 / 1024 / 1024) + " GB";
      if (n > 1024 ** 2) return Math.round(n / 1024 / 1024) + " MB";
      return Math.round(n / 1024) + " KB";
    };
    const shortTime = (iso) => {
      const d = new Date(iso || Date.now());
      return isNaN(d.getTime()) ? "-" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    };
    function rows(target, pairs) {
      document.getElementById(target).innerHTML = pairs.map(([k,v]) => `<dt>${esc(k)}</dt><dd class="${statusClass(v)}">${esc(v)}</dd>`).join("");
    }
    function setText(id, value) { document.getElementById(id).textContent = value ?? "-"; }
    function pill(label, value) { return `<span class="pill ${statusClass(value)}"><b>${esc(label)}</b>${esc(value)}</span>`; }
    function scopeSummary(summary) {
      const scopes = summary?.scopes || {};
      const parts = Object.entries(scopes).map(([name, count]) => `${name}: ${count}`);
      return parts.length ? parts.join(", ") : "-";
    }
    function friendlyStatus(securityStatus, audit) {
      if (/SEM PADRAO NO MANIFESTO/i.test(audit)) {
        return {
          headline: "Publicacao precisa revisao",
          subline: "O site responde, mas a auditoria encontrou arquivos sem padrao no manifesto.",
          priority: "Alta",
          next: "Corrigir manifesto/publicacao antes de qualquer deploy.",
          reason: "A auditoria strict esta falhando; nao mascarar este alerta."
        };
      }
      if (/ALERT|FAIL|failed|falhou/i.test(securityStatus + " " + audit)) {
        return {
          headline: "Atencao necessaria",
          subline: "Ha um alerta operacional ativo.",
          priority: "Alta",
          next: "Abrir detalhes tecnicos e identificar o primeiro erro real.",
          reason: securityStatus
        };
      }
      if (/pendente|warn|Verificar/i.test(securityStatus)) {
        return {
          headline: "Monitorando com pendencias",
          subline: "O Omega esta rodando, mas ha pendencias para revisar.",
          priority: "Media",
          next: "Revisar pendencias quando terminar a avaliacao visual.",
          reason: securityStatus
        };
      }
      return {
        headline: "Omega estavel",
        subline: "Nenhum bloqueio critico detectado no snapshot atual.",
        priority: "Baixa",
        next: "Manter o monitor aberto e acompanhar a proxima mudanca.",
        reason: "Watchdog e tablet sync ativos."
      };
    }
    async function text(path) {
      const r = await fetch(path + "?t=" + Date.now(), { cache: "no-store" });
      return r.ok ? await r.text() : `${r.status} ${r.statusText}`;
    }
    async function json(path) {
      const r = await fetch(path + "?t=" + Date.now(), { cache: "no-store" });
      return r.ok ? await r.json() : {};
    }
    async function tick() {
      const pc = await json("omega-pc-status.json").catch(() => ({}));
      const security = await text("omega-security-status.txt").catch(e => e.message);
      const audit = await text("omega-security-last-check.txt").catch(e => e.message);
      const sync = await text("omega-tablet-adb-sync-loop.log").catch(e => e.message);
      const maestro = await json("omega-worktree-watch.json").catch(() => ({}));
      const git = pc.git || {};
      const gitLines = Array.isArray(git.status) ? git.status : [];
      const gitSummary = gitLines[0] || "-";
      const dirtyCount = Math.max(0, gitLines.filter(line => !String(line).startsWith("##")).length);
      const maestroSummary = maestro.summary || {};
      const maestroCount = Number(maestroSummary.count || 0);
      const alertCount = Number(pc.pendingSecurityAlerts || getLine(security, "Pending alerts") || 0);
      const securityStatus = getLine(security, "Status");
      const friendly = friendlyStatus(securityStatus, audit);
      const isBad = friendly.priority === "Alta";
      const isWarn = !isBad && (alertCount > 0 || /pendente|warn|Verificar/i.test(JSON.stringify(git.status || "")));
      const tone = isBad ? "bad" : (isWarn ? "warn" : "ok");
      document.getElementById("stateDot").className = "dot " + tone;
      setText("headline", friendly.headline);
      setText("subline", friendly.subline);
      setText("priority", friendly.priority);
      setText("memoryFree", fmtBytes(pc.memoryFree));
      setText("syncAge", "15s");
      setText("nextAction", friendly.next);
      setText("nextReason", friendly.reason);
      rows("pc", [
        ["Atualizado", shortTime(pc.updatedAt)],
        ["Computador", pc.computer],
        ["Uptime", pc.uptime],
        ["Memoria livre", fmtBytes(pc.memoryFree)],
        ["Alertas", alertCount]
      ]);
      rows("git", [
        ["Branch", gitSummary.replace(/^##\s*/, "")],
        ["HEAD", git.head],
        ["Mudancas", dirtyCount],
        ["Raiz", "anatomia-do-gasto"]
      ]);
      rows("maestro", [
        ["Atualizado", shortTime(maestro.updated_at)],
        ["Fonte", maestro.source_label || "-"],
        ["Mudancas", maestroCount || "-"],
        ["Escopos", scopeSummary(maestroSummary)],
        ["Acao", maestro.recommended_action || "Inicie tools\\agents\\start-maestro-watch.ps1"]
      ]);
      document.getElementById("actions").innerHTML = [
        pill("Publicacao", /SEM PADRAO NO MANIFESTO/i.test(audit) ? "Revisar manifesto" : "Sem bloqueio"),
        pill("Site", /HTTP 200/i.test(audit) ? "Online" : "Verificar"),
        pill("Tablet", /cycle finished/i.test(sync) ? "Sync ativo" : "Sem ciclo recente"),
        pill("Repo", dirtyCount ? `${dirtyCount} mudancas` : "limpo"),
        pill("Maestro", maestroCount ? `${maestroCount} observadas` : "Sem watcher")
      ].join("");
      document.getElementById("security").textContent = security;
      document.getElementById("audit").textContent = audit.split("\n").slice(-50).join("\n");
      document.getElementById("sync").textContent = sync.split("\n").slice(-30).join("\n");
      document.getElementById("stamp").textContent = new Date().toLocaleString();
    }
    tick();
    setInterval(tick, 3000);
  </script>
</body>
</html>
'@

  Set-Content -Path $Path -Value $html -Encoding UTF8 -Force
}

function Write-MonitorManifest {
  param([string]$Path)

  $manifest = [ordered]@{
    name = "Omega Monitor"
    short_name = "Omega"
    start_url = "/omega-monitor.html"
    scope = "/"
    display = "fullscreen"
    background_color = "#0b0d10"
    theme_color = "#0b0d10"
  }

  $manifest | ConvertTo-Json -Depth 4 | Set-Content -Path $Path -Encoding UTF8 -Force
}

$Adb = Resolve-AdbPath -Preferred $Adb
$resolvedMonitorRoot = [System.IO.Path]::GetFullPath($MonitorRoot)
$omegaTmpRoot = [System.IO.Path]::GetFullPath("C:\Omega\tmp")

if ($BrowserPackage -notmatch '^[A-Za-z0-9_.]+$') {
  throw "Pacote Android invalido: $BrowserPackage"
}

if ($Transport -eq "Wifi") {
  if ($BindAddress -in @("127.0.0.1", "localhost", "::1")) {
    throw "Modo Wi-Fi precisa de -BindAddress com IP do PC acessivel pelo tablet; 127.0.0.1 aponta para o proprio tablet."
  }
  if ($resolvedMonitorRoot.TrimEnd('\') -eq $omegaTmpRoot.TrimEnd('\')) {
    throw "Modo Wi-Fi nao pode servir C:\Omega\tmp inteiro. Use -MonitorRoot apontando para um diretorio dedicado e sanitizado."
  }
}

New-Item -ItemType Directory -Force -Path $AdbHome, $MonitorRoot | Out-Null
$env:HOME = $AdbHome
$env:USERPROFILE = $AdbHome
$env:ANDROID_SDK_HOME = $AdbHome
$env:ANDROID_USER_HOME = $AdbHome

& $Adb start-server | Out-Null
if ($ResetAndroidState) {
  & $Adb shell "svc power stayon false"
  & $Adb shell "settings put system screen_off_timeout 600000"
  & $Adb shell "settings delete global policy_control"
  Write-Host "Android tablet state reset: stayon=false, screen_off_timeout=600000, policy_control removed."
  exit 0
}

$htmlPath = Join-Path $MonitorRoot "omega-monitor.html"
Write-MonitorHtml -Path $htmlPath
Write-MonitorManifest -Path (Join-Path $MonitorRoot "omega-monitor.webmanifest")

$python = (Get-Command python -ErrorAction Stop).Source
$pidPath = Join-Path $MonitorRoot "omega-monitor-web.pid"
$server = $null
if (Test-Path -LiteralPath $pidPath) {
  $oldPid = (Get-Content -Path $pidPath -Raw -Encoding UTF8).Trim()
  if ($oldPid) {
    $server = Get-Process -Id ([int]$oldPid) -ErrorAction SilentlyContinue
    $serverInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $oldPid" -ErrorAction SilentlyContinue
    if (
      $null -eq $serverInfo -or
      $serverInfo.CommandLine -notmatch [regex]::Escape("http.server") -or
      $serverInfo.CommandLine -notmatch [regex]::Escape([string]$Port) -or
      $serverInfo.CommandLine -notmatch [regex]::Escape($MonitorRoot)
    ) {
      $server = $null
    }
  }
}

if ($null -eq $server) {
  $process = Start-Process `
    -FilePath $python `
    -ArgumentList @("-m", "http.server", $Port, "--bind", $BindAddress, "--directory", $MonitorRoot) `
    -WindowStyle Hidden `
    -PassThru
  Set-Content -Path $pidPath -Value $process.Id -Encoding UTF8 -Force
  Start-Sleep -Seconds 1
}

$tabletUrl = "http://127.0.0.1:$Port/omega-monitor.html"
if ($Transport -eq "UsbReverse") {
  & $Adb reverse "tcp:$Port" "tcp:$Port" | Out-Null
} else {
  $tabletUrl = "http://$BindAddress`:$Port/omega-monitor.html"
}
& $Adb shell "svc power stayon usb"
& $Adb shell "settings put system screen_off_timeout 2147483647"
if (-not $SkipFullscreen) {
  & $Adb shell "settings put global policy_control immersive.full=$BrowserPackage"
}
$activityDump = (& $Adb shell "dumpsys activity activities" | Out-String)
if ($activityDump -notmatch [regex]::Escape("dat=$tabletUrl")) {
  & $Adb shell "am force-stop $BrowserPackage"
  Start-Sleep -Seconds 1
  & $Adb shell "am start -W --activity-clear-top --activity-single-top -a $([string]'android.intent.action.VIEW') -d $tabletUrl $BrowserPackage"
} else {
  Write-Host "Browser already focused on Omega monitor; not opening another tab."
}

Write-Host "Omega monitor web: $tabletUrl"
if ($Transport -eq "UsbReverse") {
  Write-Host "Tablet acessando via adb reverse tcp:$Port."
} else {
  Write-Host "Tablet acessando via Wi-Fi. Firewall/regra de rede deve ser autorizado separadamente se necessario."
}
