import React, { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import './family.css';

const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL;
const CLAVE_SUPABASE = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const db = URL_SUPABASE && CLAVE_SUPABASE ? createClient(URL_SUPABASE, CLAVE_SUPABASE) : null;
const BASE = import.meta.env.BASE_URL;
const LOGO = BASE + 'brand-angel-rull.svg';
const ESCULTURA_URL = new URL(BASE + 'escultura-familiar/', window.location.origin).href;
const SCALE = { pequeno: 66, mediano: 84, grande: 108 };
const LIMIT = 24;
const TEMPLATES = [
  { id: 'a01', color: '#8BADC1', size: 'pequeno' },
  { id: 'a02', color: '#E9ACAC', size: 'mediano' },
  { id: 'a03', color: '#7EB396', size: 'grande' },
  { id: 'a04', color: '#E8BD66', size: 'pequeno' },
  { id: 'a05', color: '#A8A0CD', size: 'mediano' },
  { id: 'a06', color: '#C1856C', size: 'grande' },
  { id: 'a07', color: '#ACC4A0', size: 'pequeno' },
  { id: 'a08', color: '#D99D58', size: 'mediano' },
  { id: 'a09', color: '#75919A', size: 'grande' },
  { id: 'a10', color: '#CDA6BB', size: 'pequeno' },
  { id: 'a11', color: '#A5B2DF', size: 'mediano' },
  { id: 'a12', color: '#B6A185', size: 'grande' },
  { id: 'a13', color: '#82C5B2', size: 'pequeno' },
  { id: 'a14', color: '#D9C17D', size: 'mediano' },
  { id: 'a15', color: '#AD98B5', size: 'grande' },
  { id: 'a16', color: '#CAAF9E', size: 'pequeno' },
  { id: 'a17', color: '#92B4A1', size: 'mediano' },
  { id: 'a18', color: '#D28F8C', size: 'grande' }
];
const VIEWS = [ { id: 'actual', label: 'Mi familia hoy' }, { id: 'deseada', label: 'Cómo me gustaría que fuera' } ];
const freshBoard = () => ({ kind: 'family-sculpture', version: 1, activeView: 'actual', locked: false, figures: { actual: [], deseada: [] } });
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const getRow = data => Array.isArray(data) ? data[0] : data;
const templateOf = id => TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
const labelSize = s => ({ pequeno: 'Pequeño', mediano: 'Mediano', grande: 'Grande' })[s];
const cleanText = v => (v || '').replace(/[\r\n\t]/g, ' ').slice(0, 35);
const xml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

function Figure({ template, scale = 1, direction = 'frente', preview = false }) {
  const width = SCALE[template.size] * scale;
  return <svg aria-hidden="true" className={'family-figure-art' + (preview ? ' family-preview' : '')} width={width} height={width * 1.43} viewBox="0 0 80 114" fill="none">
    <ellipse cx="40" cy="107" rx="28" ry="5" fill="rgba(28,42,35,.11)" />
    <path d="M21 55 C25 49 33 47 40 47 C47 47 55 49 59 55 C66 66 69 86 68 103 Q40 111 12 103 C11 86 14 66 21 55Z" fill={template.color}/>
    <path d="M20 64 C23 56 28 53 33 51" stroke="#FFFFFF" strokeOpacity=".28" strokeWidth="3.5" strokeLinecap="round"/>
    <ellipse cx="40" cy="27" rx="23" ry="24" fill={template.color}/>
    <ellipse cx="35" cy="19" rx="14" ry="7" fill="#FFFFFF" opacity=".16"/>
    {direction === 'frente' ? <>
      <circle cx="32" cy="28" r="2" fill="#36443D"/><circle cx="48" cy="28" r="2" fill="#36443D"/>
      <path d="M34 37 Q40 40.5 46 37" stroke="#36443D" strokeWidth="2.3" strokeLinecap="round"/>
    </> : direction === 'izquierda' ? <>
      <circle cx="30" cy="29" r="2.2" fill="#36443D"/><path d="M19 31 L14 35 L20 37" fill={template.color} stroke="#47584C" strokeWidth="1.4"/><path d="M24 41 Q28 43 32 40" stroke="#36443D" strokeWidth="2" strokeLinecap="round"/>
    </> : <>
      <circle cx="50" cy="29" r="2.2" fill="#36443D"/><path d="M61 31 L66 35 L60 37" fill={template.color} stroke="#47584C" strokeWidth="1.4"/><path d="M48 40 Q52 43 56 41" stroke="#36443D" strokeWidth="2" strokeLinecap="round"/>
    </>}
  </svg>;
}

function AppLanding({ onLogin, onJoin, email, setEmail, password, setPassword, code, setCode, busy, error }) {
  return <div className="family-landing"><div className="family-landing-shell">
    <div className="family-identity"><img src={LOGO} alt="Ángel Rull" /><span>HERRAMIENTAS PARA PSICOTERAPIA</span></div>
    <div className="family-eyebrow">ENFOQUE SISTÉMICO · ESPACIO COMPARTIDO</div>
    <h1>Escultura <em>familiar</em></h1>
    <p className="family-landing-sub">Un espacio visual para representar cómo se perciben los vínculos, las distancias y los lugares que ocupa cada persona en el sistema familiar.</p>
    <div className="family-login-grid">
      <form onSubmit={onLogin} className="family-login-card"><span className="family-card-eyebrow">ACCESO PROFESIONAL</span><h2>Psicólogo</h2><p>Crea la sesión y comparte el acceso con tu paciente.</p>
        <label>Correo electrónico<input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" /></label>
        <label>Contraseña<input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" /></label>
        <button className="family-button primary" disabled={busy || !db}>Crear una sesión <span aria-hidden="true">↗</span></button>
      </form>
      <form onSubmit={onJoin} className="family-login-card patient"><span className="family-card-eyebrow">ACCESO A LA SESIÓN</span><h2>Paciente</h2><p>Entra con el código que te haya facilitado tu psicólogo.</p>
        <label>Código de sesión<input required autoComplete="off" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Código de acceso" /></label>
        <button className="family-button primary" disabled={busy || !db}>Entrar en la escultura <span aria-hidden="true">↗</span></button>
      </form>
    </div>
    {error && <p role="alert" className="family-error">{error}</p>}
    {!db && <p className="family-error">Falta la configuración de acceso a las sesiones.</p>}
    <p className="family-privacy">Usa nombres ficticios o referencias como «madre», «hermano» o «yo». Evita incluir datos personales en la composición.</p>
  </div></div>;
}

export default function FamilyApp() {
  const [role, setRole] = useState('');
  const [session, setSession] = useState(null);
  const [board, setBoard] = useState(freshBoard);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState(new URLSearchParams(window.location.search).get('code') || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [share, setShare] = useState(false);
  const [remotePointer, setRemotePointer] = useState(null);
  const [draft, setDraft] = useState(null);
  const [filterSize, setFilterSize] = useState('todos');
  const [hintOpen, setHintOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const current = useRef(board);
  const channel = useRef(null);
  const drag = useRef(null);
  const cooldown = useRef(0);
  const pointerTimer = useRef(null);
  const updating = useRef(false);
  const boardElement = useRef(null);
  useEffect(() => { current.current = board; }, [board]);
  useEffect(() => () => clearTimeout(pointerTimer.current), []);
  const therapist = role === 'therapist';
  const canEdit = therapist || !board.locked;
  const view = board.activeView || 'actual';
  const placed = board.figures?.[view] || [];
  const selectedFigure = placed.find(f => f.uid === selected);
  const available = TEMPLATES.filter(t => (filterSize === 'todos' || t.size === filterSize) && !placed.some(f => f.templateId === t.id));
  const accessCode = session?.access_code || session?.code || session?.patient_code || '';
  const patientLink = accessCode ? ESCULTURA_URL + '?code=' + encodeURIComponent(accessCode) : '';

  function load(row, nextRole) {
    const next = row.board?.kind === 'family-sculpture' ? row.board : freshBoard();
    current.current = next;
    setBoard(next); setSession(row); setRole(nextRole); setSelected(null); setHistory([]); setError('');
  }
  async function login(e) {
    e.preventDefault(); if (!db) return;
    setError(''); setBusy(true);
    try {
      const a = await db.auth.signInWithPassword({ email: email.trim(), password });
      if (a.error) throw a.error;
      const b = await db.rpc('cope_create_session');
      if (b.error) throw b.error;
      const row = getRow(b.data);
      if (!row?.id) throw new Error('No se ha podido crear la sesión.');
      const initial = freshBoard();
      const c = await db.rpc('cope_update_board', { p_id: row.id, p_board: initial });
      if (c.error) throw c.error;
      load({ ...row, board: c.data?.kind === 'family-sculpture' ? c.data : initial }, 'therapist');
    } catch (e) { setError(e.message || 'No se ha podido iniciar la sesión.'); }
    finally { setBusy(false); }
  }
  async function join(e) {
    e.preventDefault(); if (!db) return;
    setError(''); setBusy(true);
    try {
      await db.auth.signOut();
      const a = await db.auth.signInAnonymously();
      if (a.error) throw a.error;
      const b = await db.rpc('cope_join_session', { p_code: code.trim().toUpperCase() });
      if (b.error) throw b.error;
      const row = getRow(b.data);
      if (!row || row.board?.kind !== 'family-sculpture') throw new Error('Este código no corresponde a una sesión de escultura familiar.');
      load(row, 'patient');
    } catch (e) { setError(e.message || 'No se ha podido acceder a la sesión.'); }
    finally { setBusy(false); }
  }
  async function leave(close = false) {
    if (close && therapist && !window.confirm('¿Finalizar la sesión para todos?')) return;
    if (!close && !window.confirm('¿Salir? La sesión del psicólogo seguirá abierta.')) return;
    if (close && therapist) {
      const r = await db.rpc('cope_close_session', { p_id: session.id });
      if (r.error) { setError(r.error.message); return; }
    }
    await db.auth.signOut();
    setSession(null); setRole(''); setBoard(freshBoard()); setHistory([]); setRemotePointer(null);
  }

  useEffect(() => {
    if (!session?.id || !db) return;
    let active = true;
    const ch = db.channel('family-sculpture-' + session.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cope_sessions', filter: 'id=eq.' + session.id }, p => {
        if (!active) return;
        if (p.eventType === 'DELETE') { setSession(null); setRole(''); return; }
        if (p.new?.board?.kind === 'family-sculpture') {
          current.current = p.new.board;
          setBoard(p.new.board);
          setSelected(id => (p.new.board.figures?.[p.new.board.activeView] || []).some(f => f.uid === id) ? id : null);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        if (active) setMembers(Object.values(ch.presenceState()).flat().map(v => v.role));
      })
      .on('broadcast', { event: 'pointer' }, ({ payload }) => {
        if (!active || !payload || payload.role === role) return;
        if (payload.hidden) { setRemotePointer(null); return; }
        setRemotePointer({ ...payload, at: Date.now() });
        clearTimeout(pointerTimer.current);
        pointerTimer.current = setTimeout(() => setRemotePointer(null), 1800);
      })
      .subscribe(async status => {
        if (!active) return;
        setConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') await ch.track({ role });
      });
    channel.current = ch;
    return () => {
      active = false;
      if (channel.current === ch) channel.current = null;
      db.removeChannel(ch); setConnected(false); setMembers([]);
    };
  }, [session?.id, role]);

  async function commit(transform, saveHistory = true) {
    if (!session || updating.current) return false;
    const before = current.current;
    const after = transform(before);
    if (!after || after === before) return false;
    updating.current = true;
    current.current = after;
    setBoard(after);
    try {
      const r = await db.rpc('cope_update_board', { p_id: session.id, p_board: after });
      if (r.error) throw r.error;
      if (r.data?.kind === 'family-sculpture') {
        current.current = r.data; setBoard(r.data);
      }
      if (saveHistory) setHistory(h => [...h.slice(-19), before]);
      return true;
    } catch (e) {
      current.current = before; setBoard(before); setError(e.message || 'No se ha guardado el cambio.');
      return false;
    } finally { updating.current = false; }
  }
  const updateFigures = transform => commit(s => {
    const page = s.activeView;
    const next = transform(s.figures?.[page] || []);
    return next ? { ...s, figures: { ...s.figures, [page]: next } } : null;
  });
  function addFigure(id) {
    if (!canEdit) return;
    updateFigures(arr => {
      if (arr.length >= LIMIT || arr.some(x => x.templateId === id)) return null;
      const n = arr.length;
      const item = { uid: crypto.randomUUID(), templateId: id, label: 'Persona ' + (n + 1), x: 22 + (n % 5) * 14, y: 29 + (Math.floor(n / 5) % 3) * 19, direction: 'frente' };
      return [...arr, item];
    });
  }
  function editFigure(id, props) {
    if (!canEdit) return;
    updateFigures(arr => arr.some(f => f.uid === id) ? arr.map(f => f.uid === id ? { ...f, ...props } : f) : null);
  }
  function changeView(next) {
    if (!canEdit || next === view) return;
    setSelected(null); setRemotePointer(null);
    commit(s => ({ ...s, activeView: next }), false);
  }
  function copyToDesired() {
    if (!canEdit) return;
    if ((current.current.figures?.deseada || []).length && !window.confirm('¿Sustituir la composición deseada por la actual?')) return;
    setSelected(null);
    commit(s => ({ ...s, activeView: 'deseada', figures: { ...s.figures, deseada: s.figures.actual.map(f => ({ ...f })) } }));
  }
  function resetScene() {
    if (!canEdit || !window.confirm('¿Vaciar la composición de esta vista?')) return;
    setSelected(null); updateFigures(() => []);
  }
  function undo() {
    if (!canEdit || !history.length) return;
    const previous = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    commit(() => previous, false);
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(patientLink); setShare(false); }
    catch { setError('No se ha podido copiar. Puedes seleccionar el enlace y copiarlo manualmente.'); }
  }
  function reportPointer(e, ping = false) {
    if (!channel.current || !boardElement.current || !connected) return;
    const rect = boardElement.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width * 100, 0, 100);
    const y = clamp((e.clientY - rect.top) / rect.height * 100, 0, 100);
    if (!ping && performance.now() - cooldown.current < 42) return;
    cooldown.current = performance.now();
    channel.current.send({ type: 'broadcast', event: 'pointer', payload: { role, x, y, view: current.current.activeView, ping } });
  }
  function hidePointer() {
    channel.current?.send({ type: 'broadcast', event: 'pointer', payload: { role, hidden: true } });
  }
  function startDrag(e, figure) {
    if (!canEdit || e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    setSelected(figure.uid);
    const rect = boardElement.current.getBoundingClientRect();
    drag.current = { uid: figure.uid, startX: e.clientX, startY: e.clientY, x: figure.x, y: figure.y, width: rect.width, height: rect.height };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function dragMove(e) {
    reportPointer(e);
    const d = drag.current;
    if (!d || !canEdit) return;
    setDraft({ uid: d.uid, x: clamp(d.x + (e.clientX - d.startX) * 100 / d.width, 8, 92), y: clamp(d.y + (e.clientY - d.startY) * 100 / d.height, 12, 89) });
  }
  function endDrag(e) {
    const d = drag.current; drag.current = null;
    if (!d) return;
    const next = { x: clamp(d.x + (e.clientX - d.startX) * 100 / d.width, 8, 92), y: clamp(d.y + (e.clientY - d.startY) * 100 / d.height, 12, 89) };
    setDraft(null);
    if (Math.abs(next.x - d.x) + Math.abs(next.y - d.y) > .2) editFigure(d.uid, next);
  }
  function exportScene() {
    const items = placed.map(f => {
      const t = templateOf(f.templateId);
      const w = SCALE[t.size], cx = 40 + f.x * 11.2, cy = 84 + f.y * 6.65;
      const k = w / 80;
      return `<g transform="translate(${(cx - 40*k).toFixed(2)} ${(cy - 57*k).toFixed(2)}) scale(${k})"><ellipse cx="40" cy="107" rx="28" ry="5" fill="#dde4df"/><path d="M21 55 C25 49 33 47 40 47 C47 47 55 49 59 55 C66 66 69 86 68 103 Q40 111 12 103 C11 86 14 66 21 55Z" fill="${t.color}"/><ellipse cx="40" cy="27" rx="23" ry="24" fill="${t.color}"/><circle cx="32" cy="28" r="2" fill="#36443d"/><circle cx="48" cy="28" r="2" fill="#36443d"/><path d="M34 37 Q40 40.5 46 37" stroke="#36443d" stroke-width="2" fill="none"/></g><text x="${cx}" y="${cy+57*k+22}" font-size="17" fill="#31463c" text-anchor="middle" font-family="sans-serif">${xml(f.label)}</text>`;
    }).join('');
    const title = VIEWS.find(v => v.id === view)?.label || 'Escultura familiar';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#fbfaf5"/><text x="55" y="55" fill="#283e32" font-size="31" font-family="sans-serif">Escultura familiar · ${xml(title)}</text><rect x="40" y="84" width="1120" height="665" rx="24" fill="#fff" stroke="#d9e3d9" stroke-width="2"/>${items}</svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `escultura-${view}.svg`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }
  useEffect(() => {
    const move = e => {
      if (!selected || !canEdit || !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
      if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;
      const f = (current.current.figures?.[current.current.activeView] || []).find(x => x.uid === selected);
      if (!f) return;
      e.preventDefault();
      const n = e.shiftKey ? 5 : 1;
      editFigure(selected, { x: clamp(f.x + (e.key === 'ArrowRight' ? n : e.key === 'ArrowLeft' ? -n : 0), 8, 92), y: clamp(f.y + (e.key === 'ArrowDown' ? n : e.key === 'ArrowUp' ? -n : 0), 12, 89) });
    };
    window.addEventListener('keydown', move);
    return () => window.removeEventListener('keydown', move);
  }, [selected, canEdit, view, session?.id]);

  if (!session) return <AppLanding {...{ onLogin: login, onJoin: join, email, setEmail, password, setPassword, code, setCode, busy, error }} />;
  return <div className="family-app">
    <header className="family-header"><div className="family-brand"><img src={LOGO} alt="Ángel Rull"/><div><strong>Escultura familiar</strong><span>HERRAMIENTA DE PSICOLOGÍA SISTÉMICA</span></div></div>
      <div className="family-header-actions"><span className={'family-connection' + (connected ? ' online' : '')}>{connected ? '● Conectado' : '○ Conectando'}</span><span className="family-roles">Profesional {members.includes('therapist') ? '●' : '○'} · Paciente {members.includes('patient') ? '●' : '○'}</span><span className="family-who">Vista {therapist ? 'psicólogo' : 'paciente'}</span>
        {therapist && <button onClick={() => setShare(v => !v)} className="family-button subtle">Compartir sesión</button>}
        {therapist && <button onClick={() => leave(true)} className="family-button subtle">Finalizar</button>}
        <button onClick={() => leave(false)} className="family-button subtle">Salir</button>
      </div>
    </header>
    {therapist && share && <div className="family-share"><strong>Enlace para el paciente</strong><code>{accessCode || 'Código pendiente'}</code><input readOnly value={patientLink} onFocus={e => e.target.select()}/><button className="family-button primary" onClick={copyLink}>Copiar enlace</button></div>}
    {error && <div className="family-alert" role="alert">{error}<button onClick={() => setError('')} aria-label="Cerrar">×</button></div>}
    <div className="family-layout">
      <aside className="family-sidebar">
        <div className="family-section-top"><span className="family-card-eyebrow">CATÁLOGO DE FIGURAS</span><h2>Elige los muñecos</h2><p>Escoge una figura para cada persona y colócala en el espacio. El color y el tamaño están predeterminados.</p></div>
        <div className="family-filters">{[['todos','Todos'],['pequeno','Pequeños'],['mediano','Medianos'],['grande','Grandes']].map(([v,name])=><button key={v} className={filterSize === v ? 'active' : ''} onClick={() => setFilterSize(v)}>{name}</button>)}</div>
        <div className="family-catalog">{available.map(t => <button key={t.id} disabled={!canEdit} className="family-catalog-figure" title={'Añadir figura ' + t.id} onClick={() => addFigure(t.id)}><Figure template={t} scale={.59} preview/><span>{labelSize(t.size)}</span></button>)}{!available.length && <p className="family-empty-catalog">Todas las figuras de esta categoría están en la composición.</p>}</div>
        <p className="family-sidebar-note">Los colores no representan emociones ni tienen un significado asignado.</p>
        {therapist && <div className="family-therapist-controls"><span className="family-card-eyebrow">HERRAMIENTAS DEL PSICÓLOGO</span><button className="family-button outline" onClick={() => commit(s => ({ ...s, locked: !s.locked }), false)}>{board.locked ? 'Permitir mover al paciente' : 'Bloquear movimientos del paciente'}</button><button className="family-text-button" onClick={() => setHintOpen(v => !v)}>{hintOpen ? 'Ocultar guía clínica' : 'Ver guía clínica'} ▾</button>{hintOpen && <div className="family-guide"><strong>Exploración sistémica</strong><p>Invita a situar las figuras atendiendo a la cercanía, la dirección de la mirada, el tamaño y las personas ausentes.</p><p>Pregunta: «¿Quién está más cerca de ti?», «¿Qué cambiarías?» o «¿Cómo sería para ti una distancia cómoda?».</p><p>Los significados se exploran con el paciente; no se deducen de la figura elegida.</p></div>}</div>}
        {!therapist && <div className="family-patient-note"><strong>Tu espacio</strong><p>Puedes mover las figuras y cambiar cómo se relacionan entre sí. No hay respuestas correctas.</p>{board.locked && <p>Tu psicólogo ha pausado los cambios de la composición.</p>}</div>}
      </aside>
      <main className="family-workspace">
        <div className="family-stage-head"><div><span className="family-card-eyebrow">ESCULTURA FAMILIAR · COMPOSICIÓN COMPARTIDA</span><h1>Ubica a las personas de tu familia</h1><p>La distancia, el lugar y hacia dónde miran quedan a tu elección.</p></div><button className="family-button subtle" onClick={() => { const root = document.documentElement; if (document.fullscreenElement) document.exitFullscreen?.(); else root.requestFullscreen?.(); }}>⛶ Pantalla completa</button></div>
        <div className="family-tabs" role="tablist" aria-label="Vista de la escultura">{VIEWS.map(v => <button key={v.id} role="tab" aria-selected={view === v.id} className={view === v.id ? 'active' : ''} onClick={() => changeView(v.id)} disabled={!canEdit}>{v.label}</button>)}</div>
        <div className="family-board" ref={boardElement} onPointerMove={reportPointer} onPointerLeave={hidePointer} onPointerDown={e => { if (e.target === e.currentTarget) { setSelected(null); reportPointer(e, true); } }}>
          {!placed.length && <div className="family-empty"><span aria-hidden="true">◌</span><strong>Este espacio es tuyo</strong><p>Selecciona un muñeco del catálogo para empezar.</p></div>}
          {placed.map(f => {
            const t = templateOf(f.templateId); const pos = draft?.uid === f.uid ? draft : f;
            return <button key={f.uid} type="button" aria-label={f.label + '. Arrastra para mover'} className={'family-placed' + (selected === f.uid ? ' selected' : '')} style={{ left: pos.x + '%', top: pos.y + '%' }} onPointerDown={e => startDrag(e, f)} onPointerMove={dragMove} onPointerUp={endDrag} onPointerCancel={() => { drag.current = null; setDraft(null); }} onClick={e => { e.stopPropagation(); setSelected(f.uid); }}>
              <Figure template={t} direction={f.direction || 'frente'}/><span className="family-placed-name">{f.label || 'Sin nombre'}</span>
            </button>;
          })}
          {remotePointer && remotePointer.view === view && <div className="family-remote" style={{ left: remotePointer.x + '%', top: remotePointer.y + '%' }}><svg width="25" height="28" viewBox="0 0 25 28" aria-hidden="true"><path d="M3 2 V22 L9 17 L13 26 L18 24 L14 15 L23 15 Z" fill={remotePointer.role === 'patient' ? '#B26F67' : '#315846'} stroke="white" strokeWidth="1.7" strokeLinejoin="round"/></svg><span>{remotePointer.role === 'patient' ? 'Paciente' : 'Psicólogo'}</span>{remotePointer.ping && <span className="family-ping"/>}</div>}
          <div className="family-board-foot">{placed.length} {placed.length === 1 ? 'figura' : 'figuras'} · {view === 'actual' ? 'Situación actual' : 'Situación deseada'}</div>
        </div>
        <div className="family-toolbar">
          {selectedFigure ? <><span className="family-toolbar-title">Figura seleccionada</span><label className="family-name-label">Representa a <input disabled={!canEdit} value={selectedFigure.label} maxLength="35" onChange={e => { const value = cleanText(e.target.value); current.current = { ...current.current, figures: { ...current.current.figures, [view]: (current.current.figures[view] || []).map(f => f.uid === selected ? { ...f, label: value } : f) } }; setBoard(current.current); }} onBlur={e => editFigure(selectedFigure.uid, { label: cleanText(e.target.value) || 'Sin nombre' })} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}/></label><span className="family-toolbar-title">Mira hacia</span>{[['izquierda','Izquierda'],['frente','Frente'],['derecha','Derecha']].map(([id,label])=><button key={id} className={'family-chip' + (selectedFigure.direction === id ? ' active' : '')} disabled={!canEdit} onClick={() => editFigure(selected, { direction: id })}>{label}</button>)}<button className="family-chip danger" disabled={!canEdit} onClick={() => { updateFigures(arr => arr.filter(f => f.uid !== selected)); setSelected(null); }}>Quitar</button></> : <span className="family-hint">Arrastra las figuras para moverlas. Usa el ratón para señalar: la otra persona verá tu cursor.</span>}
        </div>
        <div className="family-bottom-actions"><button className="family-button outline" disabled={!canEdit || !history.length} onClick={undo}>↶ Deshacer</button>{view === 'actual' && <button className="family-button outline" disabled={!canEdit || !placed.length} onClick={copyToDesired}>Copiar a «Cómo me gustaría que fuera»</button>}<button className="family-button outline" disabled={!canEdit || !placed.length} onClick={resetScene}>Vaciar esta vista</button>{therapist && <button className="family-button outline" onClick={exportScene} disabled={!placed.length}>Guardar imagen SVG</button>}</div>
      </main>
    </div>
  </div>;
}
