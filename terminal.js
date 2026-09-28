// Theme toggle
const root = document.documentElement;
document.getElementById('theme-toggle').addEventListener('click', () => {
    const light = root.dataset.theme
        ? root.dataset.theme === 'light'
        : matchMedia('(prefers-color-scheme: light)').matches;
    root.dataset.theme = light ? 'dark' : 'light';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
});

// Highlight the nav link for the section in view
const navLinks = [...document.querySelectorAll('nav ul a[href^="#"]')];
const spy = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting)
        navLinks.forEach(a => a.classList.toggle('active', a.hash === '#' + e.target.id));
}, { rootMargin: '-45% 0px -50% 0px' });
navLinks.forEach(a => spy.observe(document.querySelector(a.hash)));

// ── Terminal ──
const out = document.getElementById('term-out');
const body = document.getElementById('term-body');
const line = document.getElementById('term-line');
const input = document.getElementById('term-in');

const ART = `     _            _
    | | __ _  ___| | _____  ___  _ __
 _  | |/ _\` |/ __| |/ / __|/ _ \\| '_ \\
| |_| | (_| | (__|   <\\__ \\ (_) | | | |
 \\___/ \\__,_|\\___|_|\\_\\___/\\___/|_| |_|`;

const BOOT = [
    ['c-prompt', '$ ', 20], ['c-cmd', 'ssh hackson@uiuc\n', 35],
    ['c-ok', '[  OK  ] ', 4], ['c-muted', 'connected · last login ' + new Date().toDateString() + '\n\n', 4],
    ['art', ART + '\n', 1],
    ['', '\n\nPhD candidate @ UIUC · AI for Site Reliability Engineering\n', 10],
    ['c-acc2', '> ', 10], ['', 'building SREGym: Can AI agents resolve production incidents?\n', 10],
    ['c-acc2', '> ', 10], ['', 'SREGym accepted to NeurIPS 2026 🇦🇺\n', 10],
    ['c-muted', "\ntype 'help' for commands, or just scroll ↓\n\n", 10],
];

let skip = matchMedia('(prefers-reduced-motion: reduce)').matches;

async function boot() {
    for (const [cls, text, speed] of BOOT) {
        const span = document.createElement('span');
        if (cls) span.className = cls;
        out.appendChild(span);
        if (skip) { span.textContent = text; continue; }
        for (const ch of text) {
            if (skip) { span.textContent = text; break; }
            span.textContent += ch;
            if (ch !== ' ') await new Promise(r => setTimeout(r, speed));
        }
    }
    line.hidden = false;
}
boot();

// Any interaction during the boot animation skips it
['pointerdown', 'keydown'].forEach(ev => body.addEventListener(ev, () => { skip = true; }));
body.addEventListener('click', () => { if (!getSelection().toString()) input.focus(); });

const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const c = (cls, s) => `<span class="c-${cls}">${s}</span>`;
const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;

function jump(id) {
    setTimeout(() => document.getElementById(id).scrollIntoView(), 250);
    return c('ok', `→ cd #${id}`);
}
function open(url, label) {
    window.open(url, '_blank', 'noopener');
    return c('ok', `→ opening ${label}...`);
}

const SECTIONS = { about: 'about', news: 'news', pubs: 'pubs', publications: 'pubs', talks: 'talks',
    exp: 'exp', experience: 'exp', teaching: 'teaching', press: 'media', awards: 'awards' };

const HELP = [
    ['whoami', 'who is this guy'],
    ['about, news, pubs', 'jump to a section'],
    ['talks, exp, press', 'jump to a section'],
    ['sregym', 'what I\'m building'],
    ['cv', 'open my CV'],
    ['email, scholar', 'find me elsewhere'],
    ['github, linkedin', 'find me elsewhere'],
    ['theme', 'toggle light/dark'],
    ['clear', 'clear the screen'],
];

const cmds = {
    help: () => c('muted', 'commands:\n') + HELP.map(([k, v]) => '  ' + c('acc', k.padEnd(18)) + c('muted', '→ ' + v)).join('\n')
        + c('muted', '\n\n(there may be a few more. SREs will find them.)'),
    whoami: () => c('cmd', 'Jackson Clark') + '\n' + c('muted', 'PhD candidate · Siebel School of CDS, UIUC · advised by Tianyin Xu\nAI for SRE · systems reliability · post-training & RL · evals'),
    sregym: () => c('acc2', 'SREGym') + ' — a live benchmark for AI SRE agents with high-fidelity failure scenarios.\n'
        + c('muted', 'NeurIPS 2026 · CAIS 2026 Demo · Laude Slingshot\n') + '→ ' + link('https://sregym.com', 'sregym.com') + '  ' + link('https://github.com/SREGym/SREGym', 'github'),
    cv: () => open('jc-cv.pdf', 'cv.pdf'),
    email: () => `<a href="mailto:jclark58@illinois.edu">jclark58@illinois.edu</a>`,
    scholar: () => open('https://scholar.google.com/citations?user=cFPoN7QAAAAJ&hl=en', 'google scholar'),
    github: () => open('https://github.com/HacksonClark', 'github'),
    linkedin: () => open('https://www.linkedin.com/in/jackson-clark-5a3b90180/', 'linkedin'),
    ls: () => c('acc', 'about.txt  news.log  publications/  talks/  experience/  press/  cv.pdf'),
    pwd: () => '/home/hackson',
    date: () => new Date().toString(),
    theme: () => { document.getElementById('theme-toggle').click(); return c('ok', `→ theme: ${root.dataset.theme}`); },
    clear: () => { out.textContent = ''; return null; },
    history: () => hist.map((h, i) => c('muted', String(i + 1).padStart(4)) + '  ' + esc(h)).join('\n'),
    // SRE easter eggs
    'kubectl get pods': () => c('muted', 'NAME          READY STATUS           RESTARTS\n')
        + 'phd-hackson   1/1   ' + c('ok', 'Running') + '          0\n'
        + 'sleep         0/1   ' + c('err', 'CrashLoopBackOff') + ' 412\n'
        + 'coffee-daemon 1/1   ' + c('ok', 'Running') + '          3',
    uptime: () => 'up 2 years (PhD), load average: 3.14, 2.71, 1.41',
    'git status': () => c('ok', 'On branch master\nnothing to commit, working tree clean (for once)'),
    'rm -rf /': () => c('err', '🚨 INCIDENT OPENED: SEV-1 ') + c('muted', '\npaging on-call AI SRE agent... benchmarking it in SREGym... resolved.'),
    sudo: () => c('err', 'hackson is not in the sudoers file. This incident will be reported.'),
    vim: () => c('muted', 'you are now trapped. (just kidding, type anything.)'),
    exit: () => c('muted', 'there is no exit. only more incidents.'),
    ping: () => 'PONG. ' + c('muted', 'p99 latency: 1 email / 24h'),
};

function run(raw) {
    const cmd = raw.trim().replace(/\s+/g, ' ').toLowerCase();
    if (!cmd) return '';
    if (cmds[cmd]) return cmds[cmd]();
    const target = cmd.replace(/^cd /, '').replace(/^[#~/.]+|\/$/g, '');
    if (SECTIONS[target]) return jump(SECTIONS[target]);
    if (cmd === 'cd' || cmd === 'cd ~') return jump('top');
    const first = cmd.split(' ')[0];
    if (cmds[first]) return cmds[first]();
    return c('err', 'command not found: ') + esc(cmd) + c('muted', " — try 'help'");
}

const hist = [];
let hIdx = 0;
const COMPLETIONS = [...Object.keys(cmds), ...Object.keys(SECTIONS)];

input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        const raw = input.value;
        input.value = '';
        if (raw.trim()) hist.push(raw);
        hIdx = hist.length;
        out.insertAdjacentHTML('beforeend', c('prompt', '$ ') + c('cmd', esc(raw)) + '\n');
        const res = run(raw);
        if (res !== null) out.insertAdjacentHTML('beforeend', res ? res + '\n\n' : '');
        body.scrollTop = body.scrollHeight;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        hIdx = Math.max(0, Math.min(hist.length, hIdx + (e.key === 'ArrowUp' ? -1 : 1)));
        input.value = hist[hIdx] ?? '';
    } else if (e.key === 'Tab') {
        e.preventDefault();
        const v = input.value.toLowerCase();
        const matches = COMPLETIONS.filter(k => k.startsWith(v));
        if (matches.length === 1) input.value = matches[0];
        else if (matches.length > 1) {
            out.insertAdjacentHTML('beforeend', c('muted', matches.join('  ')) + '\n');
            body.scrollTop = body.scrollHeight;
        }
    } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        out.textContent = '';
    }
});
