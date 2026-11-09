import React, { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import './family.css';

const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL;
const CLAVE_SUPABASE = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// Aislar la autenticación por pestaña: psicólogo y paciente pueden abrir la misma web en paralelo.
const db = URL_SUPABASE && CLAVE_SUPABASE ? createClient(URL_SUPABASE, CLAVE_SUPABASE, {
  auth: {
    storage: window.sessionStorage,
    storageKey: 'escultura-familiar-auth',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
}) : null;
const BASE = import.meta.env.BASE_URL;
const LOGO = BASE + 'brand-angel-rull.svg';
const ESCULTURA_URL = new URL(BASE, window.location.origin).href;
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
const freshBoard = () => ({ kind: 'family-sculpture', version: 2, activeView: 'actual', locked: false, figures: { actual: [], deseada: [] }, annotations: { actual: [], deseada: [] } });
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


const MARK_COLORS = [
  '#2E5641','#D36A61','#5287B9','#E3A93F',
  '#9469BE','#E18C49','#5D9C80','#4B5563',
  '#C15C8A','#131A17'
];
const MARK_FONTS = { pequeno: 17, mediano: 25, grande: 36 };
const MARK_LABELS = { text: 'Texto', circle: 'Círculo', square: 'Cuadrado', arrow: 'Flecha' };
const safeColor = value => /^#[a-f0-9]{6}$/i.test(value || '') ? value : MARK_COLORS[0];
const cleanAnnotationText = value => String(value || '').replace(/\r/g, '').slice(0, 100).split('\n').slice(0, 3).join('\n');

function MarkVisual({ mark }) {
  const color = safeColor(mark.color);
  if (mark.type === 'text') return <span className="family-mark-content" style={{
    color, fontSize: MARK_FONTS[mark.size] || 25,
    fontWeight: mark.bold ? 750 : 450,
    fontStyle: mark.italic ? 'italic' : 'normal',
    textDecoration: mark.underline ? 'underline' : 'none'
  }}>{mark.text || 'Texto'}</span>;
  return <svg className="family-mark-graphic" viewBox="0 0 112 112" width="112" height="112" aria-hidden="true">
    {mark.type === 'circle' && <circle cx="56" cy="56" r="39" fill="none" stroke={color} strokeWidth="5"/>}
    {mark.type === 'square' && <rect x="18" y="18" width="76" height="76" rx="2" fill="none" stroke={color} strokeWidth="5"/>}
    {mark.type === 'arrow' && <>
      <path d="M11 56 H91" stroke={color} strokeWidth="7" strokeLinecap="round"/>
      <path d="M70 35 L92 56 L70 77" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </>}
  </svg>;
}

function ColorPicker({ value, onChange, disabled = false }) {
  return <div className="family-color-palette" aria-label="Paleta de colores">
    {MARK_COLORS.map(color => <button key={color} disabled={disabled} type="button"
      className={'family-color-swatch' + (safeColor(value) === color ? ' active' : '')}
      style={{ backgroundColor: color }} onClick={() => onChange(color)}
      aria-label={'Elegir color ' + color} title={color} />)}
    <label className="family-color-custom" title="Elegir otro color"><span>+</span>
      <input type="color" aria-label="Color personalizado" disabled={disabled}
        value={safeColor(value)} onChange={e => onChange(e.target.value)}/>
    </label>
  </div>;
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
  const [selectedMark, setSelectedMark] = useState(null);
  const [activeCatalog, setActiveCatalog] = useState('figures');
  const [newAnnotationText, setNewAnnotationText] = useState('Texto');
  const [annotationTextDraft, setAnnotationTextDraft] = useState('');
  const [newAnnotationSize, setNewAnnotationSize] = useState('mediano');
  const [newAnnotationColor, setNewAnnotationColor] = useState(MARK_COLORS[0]);
  const [newBold, setNewBold] = useState(false);
  const [newItalic, setNewItalic] = useState(false);
  const [newUnderline, setNewUnderline] = useState(false);
  const [markDraft, setMarkDraft] = useState(null);
  const [transformDraft, setTransformDraft] = useState(null);
  const [remoteTransform, setRemoteTransform] = useState(null);
  const [share, setShare] = useState(false);
  const [remotePointer, setRemotePointer] = useState(null);
  const [draft, setDraft] = useState(null);
  const [remoteDraft, setRemoteDraft] = useState(null);
  const [filterSize, setFilterSize] = useState('todos');
  const [hintOpen, setHintOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const current = useRef(board);
  const channel = useRef(null);
  const drag = useRef(null);
  const markDrag = useRef(null);
  const transformGesture = useRef(null);
  const remoteTransformTimer = useRef(null);
  const cooldown = useRef(0);
  const pointerTimer = useRef(null);
  const updating = useRef(false);
  const boardElement = useRef(null);
  const clientId = useRef(crypto.randomUUID());
  const lastRevision = useRef(0);
  const incomingWhileSaving = useRef(null);
  const dragCooldown = useRef(0);
  const remoteDragTimer = useRef(null);
  useEffect(() => { current.current = board; }, [board]);
  useEffect(() => () => {
    clearTimeout(pointerTimer.current);
    clearTimeout(remoteDragTimer.current);
    clearTimeout(remoteTransformTimer.current);
  }, []);
  const therapist = role === 'therapist';
  const canEdit = therapist || !board.locked;
  const view = board.activeView || 'actual';
  const placed = board.figures?.[view] || [];
  const marks = board.annotations?.[view] || [];
  const chosenMark = marks.find(mark => mark.uid === selectedMark);
  const selectedFigure = placed.find(f => f.uid === selected);
  const available = TEMPLATES.filter(t => (filterSize === 'todos' || t.size === filterSize) && !placed.some(f => f.templateId === t.id));
  const accessCode = session?.access_code || session?.code || session?.patient_code || '';
  const patientLink = accessCode ? ESCULTURA_URL + '?code=' + encodeURIComponent(accessCode) : '';
  useEffect(() => { setAnnotationTextDraft(chosenMark?.text || ''); }, [selectedMark, view]);

  function load(row, nextRole) {
    const next = row.board?.kind === 'family-sculpture' ? row.board : freshBoard();
    current.current = next;
    lastRevision.current = Number(next._sync?.version || 0);
    setBoard(next); setSession(row); setRole(nextRole); setSelected(null); setSelectedMark(null); setHistory([]); setError('');
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
    setSession(null); setRole(''); setBoard(freshBoard()); setHistory([]); setRemotePointer(null); setRemoteDraft(null); setSelectedMark(null); lastRevision.current = 0;
  }

  // Broadcast permite sincronizar aunque cope_sessions no esté en la publicación
  // postgres_changes de Supabase. La persistencia continúa pasando por RPC.
  function receiveBoard(next) {
    if (next?.kind !== 'family-sculpture') return;
    const version = Number(next._sync?.version || 0);
    if (version && version <= lastRevision.current) return;
    if (!version && lastRevision.current) return;
    if (updating.current) {
      if (!incomingWhileSaving.current || version >= Number(incomingWhileSaving.current._sync?.version || 0)) incomingWhileSaving.current = next;
      return;
    }
    if (!version && JSON.stringify(next) === JSON.stringify(current.current)) return;
    lastRevision.current = version;
    current.current = next;
    setBoard(next);
    setRemoteDraft(null);
    setRemoteTransform(null);
    setSelected(id => (next.figures?.[next.activeView] || []).some(f => f.uid === id) ? id : null);
  }

  useEffect(() => {
    if (!session?.id || !db) return;
    let active = true;
    const ch = db.channel('family-sculpture-' + session.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cope_sessions', filter: 'id=eq.' + session.id }, p => {
        if (!active) return;
        if (p.eventType === 'DELETE') { setSession(null); setRole(''); return; }
        if (p.new?.board?.kind === 'family-sculpture') receiveBoard(p.new.board);
      })
      .on('broadcast', { event: 'board_snapshot' }, ({ payload }) => {
        if (!active || !payload || payload.from === clientId.current) return;
        receiveBoard(payload.board);
      })
      .on('broadcast', { event: 'board_request' }, ({ payload }) => {
        if (!active || payload?.from === clientId.current) return;
        if (current.current?.kind === 'family-sculpture') {
          ch.send({ type: 'broadcast', event: 'board_snapshot', payload: { from: clientId.current, board: current.current } });
        }
      })
      .on('broadcast', { event: 'figure_move' }, ({ payload }) => {
        if (!active || !payload || payload.from === clientId.current || payload.view !== current.current.activeView) return;
        if (!Number.isFinite(payload.x) || !Number.isFinite(payload.y) || typeof payload.uid !== 'string') return;
        setRemoteDraft({ uid: payload.uid, view: payload.view, x: payload.x, y: payload.y });
        clearTimeout(remoteDragTimer.current);
        remoteDragTimer.current = setTimeout(() => setRemoteDraft(null), 2300);
      })
      .on('broadcast', { event: 'figure_drop' }, ({ payload }) => {
        if (!active || payload?.from === clientId.current) return;
        clearTimeout(remoteDragTimer.current);
        setRemoteDraft(null);
      })
      .on('broadcast', { event: 'annotation_transform' }, ({ payload }) => {
        if (!active || !payload || payload.from === clientId.current || payload.view !== current.current.activeView) return;
        if (typeof payload.uid !== 'string' || !Number.isFinite(payload.rotation) || !Number.isFinite(payload.scale)) return;
        setRemoteTransform({uid:payload.uid,view:payload.view,rotation:payload.rotation,scale:payload.scale});
        clearTimeout(remoteTransformTimer.current);
        remoteTransformTimer.current = setTimeout(() => setRemoteTransform(null), 2500);
      })
      .on('broadcast', { event: 'annotation_transform_end' }, ({ payload }) => {
        if (!active || payload?.from === clientId.current) return;
        clearTimeout(remoteTransformTimer.current);
        setRemoteTransform(null);
      })
      .on('presence', { event: 'sync' }, () => {
        if (active) setMembers(Object.values(ch.presenceState()).flat().map(v => v.role));
      })
      .on('broadcast', { event: 'pointer' }, ({ payload }) => {
        if (!active || !payload || payload.from === clientId.current) return;
        if (payload.hidden) { setRemotePointer(null); return; }
        setRemotePointer({ ...payload, at: Date.now() });
        clearTimeout(pointerTimer.current);
        pointerTimer.current = setTimeout(() => setRemotePointer(null), 1800);
      })
      .subscribe(async status => {
        if (!active) return;
        setConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          await ch.track({ role, clientId: clientId.current });
          ch.send({ type: 'broadcast', event: 'board_request', payload: { from: clientId.current } });
        }
      });
    channel.current = ch;
    return () => {
      active = false;
      if (channel.current === ch) channel.current = null;
      clearTimeout(remoteDragTimer.current);
      clearTimeout(remoteTransformTimer.current);
      db.removeChannel(ch); setConnected(false); setMembers([]); setRemoteDraft(null);
    };
  }, [session?.id, role]);

  async function commit(transform, saveHistory = true) {
    if (!session || updating.current) return false;
    const before = current.current;
    const transformed = transform(before);
    if (!transformed || transformed === before) return false;
    // Cada escritura tiene una versión creciente para descartar ecos y mensajes atrasados.
    const after = { ...transformed, _sync: {
      version: Math.max(Date.now(), lastRevision.current + 1),
      from: clientId.current
    } };
    updating.current = true;
    current.current = after;
    lastRevision.current = after._sync.version;
    setBoard(after);
    try {
      const r = await db.rpc('cope_update_board', { p_id: session.id, p_board: after });
      if (r.error) throw r.error;
      const saved = r.data?.kind === 'family-sculpture' ? r.data : after;
      current.current = saved;
      setBoard(saved);
      if (saveHistory) setHistory(h => [...h.slice(-19), before]);
      // Comunicación directa entre ambas vistas, independiente de la replicación SQL.
      channel.current?.send({
        type: 'broadcast', event: 'board_snapshot',
        payload: { from: clientId.current, board: saved }
      }).then(status => {
        if (status !== 'ok') setError('No se ha podido enviar el cambio en directo. Comprueba la conexión de ambas vistas.');
      }).catch(() => setError('La conexión en tiempo real se ha interrumpido.'));
      return true;
    } catch (e) {
      current.current = before;
      lastRevision.current = Number(before._sync?.version || 0);
      setBoard(before);
      setError(e.message || 'No se ha guardado el cambio.');
      return false;
    } finally {
      updating.current = false;
      if (incomingWhileSaving.current) {
        const pending = incomingWhileSaving.current;
        incomingWhileSaving.current = null;
        receiveBoard(pending);
      }
    }
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
    if (!canEdit) return Promise.resolve(false);
    return updateFigures(arr => arr.some(f => f.uid === id) ? arr.map(f => f.uid === id ? { ...f, ...props } : f) : null);
  }

  const updateAnnotations = transform => commit(state => {
    const page = state.activeView;
    const list = state.annotations?.[page] || [];
    const next = transform(list);
    return next ? { ...state, annotations: { ...(state.annotations || {actual:[], deseada:[]}), [page]: next } } : null;
  });
  async function addAnnotation(type) {
    if (!canEdit || marks.length >= 35) return;
    const uid = crypto.randomUUID();
    const item = {
      uid, type,
      text: type === 'text' ? (cleanAnnotationText(newAnnotationText) || 'Texto') : '',
      x: 30 + marks.length % 5 * 9,
      y: 27 + marks.length % 4 * 12,
      rotation: 0, scale: 1, color: newAnnotationColor,
      size: newAnnotationSize, bold: newBold, italic: newItalic, underline: newUnderline
    };
    const ok = await updateAnnotations(list => [...list, item]);
    if (ok) { setSelected(null); setSelectedMark(uid); }
  }
  function editAnnotation(uid, props) {
    if (!canEdit) return Promise.resolve(false);
    return updateAnnotations(list => list.some(mark => mark.uid === uid)
      ? list.map(mark => mark.uid === uid ? { ...mark, ...props } : mark) : null);
  }
  function startMarkDrag(e, mark) {
    if (!canEdit || e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    setSelected(null); setSelectedMark(mark.uid);
    const rect = boardElement.current.getBoundingClientRect();
    markDrag.current = {uid:mark.uid,startX:e.clientX,startY:e.clientY,
      x:mark.x,y:mark.y,width:rect.width,height:rect.height};
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function moveMarkDrag(e) {
    reportPointer(e);
    const d=markDrag.current;
    if (!d || !canEdit) return;
    const next = {uid:d.uid,
      x:clamp(d.x+(e.clientX-d.startX)*100/d.width,5,95),
      y:clamp(d.y+(e.clientY-d.startY)*100/d.height,7,93)};
    setMarkDraft(next);
    if (connected && performance.now()-dragCooldown.current > 45) {
      dragCooldown.current=performance.now();
      channel.current?.send({type:'broadcast',event:'figure_move',
        payload:{from:clientId.current,view:current.current.activeView,...next}});
    }
  }
  async function stopMarkDrag(e) {
    const d=markDrag.current;
    markDrag.current=null;
    if(!d)return;
    const next={x:clamp(d.x+(e.clientX-d.startX)*100/d.width,5,95),
      y:clamp(d.y+(e.clientY-d.startY)*100/d.height,7,93)};
    setMarkDraft(null);
    if(Math.abs(next.x-d.x)+Math.abs(next.y-d.y)>.2) await editAnnotation(d.uid,next);
    channel.current?.send({type:'broadcast',event:'figure_drop',
      payload:{from:clientId.current,uid:d.uid}});
  }


  function startTransformHandle(e, mark, mode) {
    e.stopPropagation();
    e.preventDefault();
    if (!canEdit || e.button !== 0 || !boardElement.current) return;
    setSelected(null);
    setSelectedMark(mark.uid);
    markDrag.current = null;
    setMarkDraft(null);
    const rect = boardElement.current.getBoundingClientRect();
    const cx = rect.left + mark.x * rect.width / 100;
    const cy = rect.top + mark.y * rect.height / 100;
    const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
    const distance = Math.max(16, Math.hypot(e.clientX - cx, e.clientY - cy));
    transformGesture.current = {
      uid:mark.uid, mode, view:current.current.activeView,
      cx,cy,startAngle:angle,startDistance:distance,
      originalRotation:Number(mark.rotation)||0, originalScale:Number(mark.scale)||1
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function transformedAtPointer(e, gesture) {
    const angle = Math.atan2(e.clientY - gesture.cy, e.clientX - gesture.cx) * 180 / Math.PI;
    const distance = Math.hypot(e.clientX - gesture.cx, e.clientY - gesture.cy);
    if (gesture.mode === 'rotate') {
      const delta = ((angle - gesture.startAngle + 540) % 360) - 180;
      return { rotation:Math.round(gesture.originalRotation + delta), scale:gesture.originalScale };
    }
    return {
      rotation:gesture.originalRotation,
      scale:Math.round(clamp(gesture.originalScale * distance / gesture.startDistance, .45, 3.5) * 100) / 100
    };
  }
  function moveTransformHandle(e) {
    e.preventDefault();
    e.stopPropagation();
    reportPointer(e);
    const gesture = transformGesture.current;
    if (!gesture || !canEdit) return;
    const changes = transformedAtPointer(e,gesture);
    setTransformDraft({uid:gesture.uid,...changes});
    if (connected && performance.now() - dragCooldown.current > 45) {
      dragCooldown.current = performance.now();
      channel.current?.send({
        type:'broadcast', event:'annotation_transform',
        payload:{from:clientId.current,view:gesture.view,uid:gesture.uid,...changes}
      });
    }
  }
  async function stopTransformHandle(e) {
    e.preventDefault();
    e.stopPropagation();
    const gesture = transformGesture.current;
    transformGesture.current = null;
    if (!gesture) return;
    const changes = transformedAtPointer(e,gesture);
    setTransformDraft(null);
    if (Math.abs(changes.rotation - gesture.originalRotation) > .1 ||
        Math.abs(changes.scale - gesture.originalScale) > .005) {
      await editAnnotation(gesture.uid,changes);
    }
    channel.current?.send({
      type:'broadcast', event:'annotation_transform_end',
      payload:{from:clientId.current,uid:gesture.uid}
    });
  }
  function cancelTransformHandle(e) {
    e.preventDefault();
    e.stopPropagation();
    const gesture = transformGesture.current;
    transformGesture.current = null;
    setTransformDraft(null);
    if (gesture) channel.current?.send({
      type:'broadcast',event:'annotation_transform_end',
      payload:{from:clientId.current,uid:gesture.uid}
    });
  }

  function changeView(next) {
    if (!canEdit || next === view) return;
    setSelected(null); setSelectedMark(null); setRemotePointer(null);
    commit(s => ({ ...s, activeView: next }), false);
  }
  function copyToDesired() {
    if (!canEdit) return;
    if (((current.current.figures?.deseada || []).length || (current.current.annotations?.deseada || []).length)
      && !window.confirm('¿Sustituir la composición deseada por la actual?')) return;
    setSelected(null); setSelectedMark(null);
    commit(s => ({ ...s, activeView: 'deseada',
      figures: { ...s.figures, deseada: (s.figures.actual || []).map(f => ({ ...f })) },
      annotations: { ...(s.annotations || {}), deseada: (s.annotations?.actual || []).map(a => ({ ...a })) }
    }));
  }
  function resetScene() {
    if (!canEdit || !window.confirm('¿Vaciar la composición de esta vista?')) return;
    setSelected(null); setSelectedMark(null);
    commit(s => ({ ...s,
      figures: { ...s.figures, [s.activeView]: [] },
      annotations: { ...(s.annotations || {}), [s.activeView]: [] }
    }));
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
    channel.current.send({ type: 'broadcast', event: 'pointer', payload: { from: clientId.current, role, x, y, view: current.current.activeView, ping } });
  }
  function hidePointer() {
    channel.current?.send({ type: 'broadcast', event: 'pointer', payload: { from: clientId.current, role, hidden: true } });
  }
  function startDrag(e, figure) {
    if (!canEdit || e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    setSelected(figure.uid); setSelectedMark(null);
    const rect = boardElement.current.getBoundingClientRect();
    drag.current = { uid: figure.uid, startX: e.clientX, startY: e.clientY, x: figure.x, y: figure.y, width: rect.width, height: rect.height };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function dragMove(e) {
    reportPointer(e);
    const d = drag.current;
    if (!d || !canEdit) return;
    const next = { uid: d.uid, x: clamp(d.x + (e.clientX - d.startX) * 100 / d.width, 8, 92), y: clamp(d.y + (e.clientY - d.startY) * 100 / d.height, 12, 89) };
    setDraft(next);
    // Previsualización remota mientras se arrastra, sin escribir a la base de datos en cada píxel.
    if (connected && performance.now() - dragCooldown.current > 45) {
      dragCooldown.current = performance.now();
      channel.current?.send({ type: 'broadcast', event: 'figure_move', payload: { from: clientId.current, view: current.current.activeView, ...next } });
    }
  }
  async function endDrag(e) {
    const d = drag.current; drag.current = null;
    if (!d) return;
    const next = { x: clamp(d.x + (e.clientX - d.startX) * 100 / d.width, 8, 92), y: clamp(d.y + (e.clientY - d.startY) * 100 / d.height, 12, 89) };
    setDraft(null);
    if (Math.abs(next.x - d.x) + Math.abs(next.y - d.y) > .2) await editFigure(d.uid, next);
    channel.current?.send({ type: 'broadcast', event: 'figure_drop', payload: { from: clientId.current, uid: d.uid } });
  }
  // Genera un documento vectorial con muñecos y anotaciones; se usa también para JPG/PNG.
  function makeSceneSVG() {
    const figures = placed.map(f => {
      const template = templateOf(f.templateId);
      const cx = 40 + f.x * 11.2;
      const cy = 84 + f.y * 6.65;
      const scale = SCALE[template.size] / 80;
      const tx = (cx - 40 * scale).toFixed(2);
      const ty = (cy - 57 * scale).toFixed(2);
      let face = '<circle cx="32" cy="28" r="2" fill="#36443d"/><circle cx="48" cy="28" r="2" fill="#36443d"/>' +
        '<path d="M34 37 Q40 40.5 46 37" stroke="#36443d" stroke-width="2.3" stroke-linecap="round" fill="none"/>';
      if (f.direction === 'izquierda') face = '<circle cx="30" cy="29" r="2.2" fill="#36443d"/><path d="M19 31 L14 35 L20 37" fill="' + template.color + '" stroke="#47584c" stroke-width="1.4"/>';
      if (f.direction === 'derecha') face = '<circle cx="50" cy="29" r="2.2" fill="#36443d"/><path d="M61 31 L66 35 L60 37" fill="' + template.color + '" stroke="#47584c" stroke-width="1.4"/>';
      return '<g transform="translate(' + tx + ' ' + ty + ') scale(' + scale + ')">' +
        '<ellipse cx="40" cy="107" rx="28" ry="5" fill="#dce6df"/>' +
        '<path d="M21 55 C25 49 33 47 40 47 C47 47 55 49 59 55 C66 66 69 86 68 103 Q40 111 12 103 C11 86 14 66 21 55Z" fill="' + template.color + '"/>' +
        '<ellipse cx="40" cy="27" rx="23" ry="24" fill="' + template.color + '"/>' + face + '</g>' +
        '<text x="' + cx.toFixed(2) + '" y="' + (cy + 57 * scale + 13).toFixed(2) + '" font-size="14" font-family="Arial, sans-serif" font-weight="700" fill="#31463c" text-anchor="middle">' + xml(f.label || 'Sin nombre') + '</text>';
    }).join('');
    const notes = marks.map(mark => {
      const color = safeColor(mark.color);
      const x = (40 + Number(mark.x) * 11.2).toFixed(2);
      const y = (84 + Number(mark.y) * 6.65).toFixed(2);
      const deg = clamp(Number(mark.rotation) || 0, -360, 360);
      const scale = clamp(Number(mark.scale) || 1, .5, 2.8);
      const open = '<g transform="translate(' + x + ' ' + y + ') rotate(' + deg + ') scale(' + scale + ')">';
      if (mark.type === 'circle') return open + '<circle r="39" fill="none" stroke="' + color + '" stroke-width="5"/></g>';
      if (mark.type === 'square') return open + '<rect x="-38" y="-38" width="76" height="76" rx="2" fill="none" stroke="' + color + '" stroke-width="5"/></g>';
      if (mark.type === 'arrow') return open +
        '<path d="M-45 0 H35" stroke="' + color + '" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M14 -21 L36 0 L14 21" stroke="' + color + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>';
      if (mark.type === 'text') {
        const size = MARK_FONTS[mark.size] || 25;
        const lines = cleanAnnotationText(mark.text || 'Texto').split('\n');
        const spans = lines.map((line, index) => '<tspan x="0" dy="' + (index === 0 ? '0' : (size * 1.2).toFixed(1)) + '">' + xml(line) + '</tspan>').join('');
        const yOffset = -(lines.length - 1) * size * .6;
        return open + '<text x="0" y="' + yOffset + '" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="' + size +
          '" font-weight="' + (mark.bold ? '750' : '400') + '" font-style="' + (mark.italic ? 'italic' : 'normal') +
          '" text-decoration="' + (mark.underline ? 'underline' : 'none') + '" fill="' + color + '">' + spans + '</text></g>';
      }
      return '';
    }).join('');
    const title = VIEWS.find(item => item.id === view)?.label || 'Escultura familiar';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">' +
      '<rect width="1200" height="800" fill="#fafaf6"/>' +
      '<text x="55" y="55" fill="#283e32" font-size="31" font-family="Arial, sans-serif">Escultura familiar · ' + xml(title) + '</text>' +
      '<rect x="40" y="84" width="1120" height="665" rx="24" fill="#ffffff" stroke="#d9e3d9" stroke-width="2"/>' +
      figures + notes + '</svg>';
  }
  function saveDownload(blob, ext) {
    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = url;
    element.download = 'escultura-' + view + '.' + ext;
    document.body.appendChild(element);
    element.click();
    element.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2500);
  }
  function exportScene(format = 'svg') {
    if (!placed.length && !marks.length) return;
    const svg = makeSceneSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    if (format === 'svg') { saveDownload(blob, 'svg'); return; }
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1800;
        canvas.height = 1200;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Tu navegador no permite generar la imagen.');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
        canvas.toBlob(file => {
          if (file) saveDownload(file, format);
          else setError('No se ha podido preparar la imagen ' + format.toUpperCase() + '.');
        }, mime, .94);
      } catch (error) { setError(error.message || 'Error al exportar la imagen.'); }
      finally { URL.revokeObjectURL(url); }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError('No se ha podido convertir la composición. Prueba con SVG.');
    };
    image.src = url;
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
        <div className="family-tool-tabs" role="tablist" aria-label="Herramientas">
          <button type="button" className={activeCatalog === 'figures' ? 'active' : ''} role="tab" aria-selected={activeCatalog === 'figures'} onClick={() => setActiveCatalog('figures')}>Muñecos</button>
          <button type="button" className={activeCatalog === 'notes' ? 'active' : ''} role="tab" aria-selected={activeCatalog === 'notes'} onClick={() => setActiveCatalog('notes')}>Texto y formas</button>
        </div>
        {activeCatalog === 'figures' ? <>
          <div className="family-section-top"><span className="family-card-eyebrow">CATÁLOGO DE FIGURAS</span><h2>Elige los muñecos</h2><p>Escoge una figura para cada persona y colócala en el espacio. El color y el tamaño están predeterminados.</p></div>
          <div className="family-filters">{[['todos','Todos'],['pequeno','Pequeños'],['mediano','Medianos'],['grande','Grandes']].map(([v,name])=><button key={v} className={filterSize === v ? 'active' : ''} onClick={() => setFilterSize(v)}>{name}</button>)}</div>
          <div className="family-catalog">{available.map(t => <button key={t.id} disabled={!canEdit} className="family-catalog-figure" title={'Añadir figura ' + t.id} onClick={() => addFigure(t.id)}><Figure template={t} scale={.59} preview/><span>{labelSize(t.size)}</span></button>)}{!available.length && <p className="family-empty-catalog">Todas las figuras de esta categoría están en la composición.</p>}</div>
          <p className="family-sidebar-note">Los colores no representan emociones ni tienen un significado asignado.</p>
        </> : <div className="family-annotation-tools">
          <div className="family-section-top"><span className="family-card-eyebrow">ANOTACIONES</span><h2>Texto y formas</h2><p>Añade símbolos o palabras para organizar y señalar relaciones. Podrás girarlos, moverlos y cambiar su tamaño.</p></div>
          <label className="family-note-label">Escribe el texto
            <textarea rows="2" value={newAnnotationText} maxLength="100" disabled={!canEdit} onChange={e => setNewAnnotationText(cleanAnnotationText(e.target.value))} placeholder="Escribe aquí..."/>
          </label>
          <div className="family-text-settings">
            <div className="family-format-buttons" aria-label="Formato del texto">
              <button type="button" title="Negrita" aria-label="Negrita" aria-pressed={newBold} className={newBold?'active':''} disabled={!canEdit} onClick={() => setNewBold(x => !x)}><strong>N</strong></button>
              <button type="button" title="Cursiva" aria-label="Cursiva" aria-pressed={newItalic} className={newItalic?'active':''} disabled={!canEdit} onClick={() => setNewItalic(x => !x)}><em>K</em></button>
              <button type="button" title="Subrayado" aria-label="Subrayado" aria-pressed={newUnderline} className={newUnderline?'active':''} disabled={!canEdit} onClick={() => setNewUnderline(x => !x)}><u>S</u></button>
            </div>
            <select aria-label="Tamaño de letra" value={newAnnotationSize} disabled={!canEdit} onChange={e=>setNewAnnotationSize(e.target.value)}>
              <option value="pequeno">Pequeño</option><option value="mediano">Mediano</option><option value="grande">Grande</option>
            </select>
          </div>
          <span className="family-note-label">Color</span>
          <ColorPicker value={newAnnotationColor} onChange={setNewAnnotationColor} disabled={!canEdit}/>
          <button className="family-button primary family-add-note" type="button" disabled={!canEdit || marks.length >= 35} onClick={() => addAnnotation('text')}>+ Añadir texto</button>
          <div className="family-shapes-divider"/>
          <span className="family-note-label">Añadir una forma</span>
          <div className="family-shape-buttons">
            <button type="button" disabled={!canEdit || marks.length >= 35} onClick={() => addAnnotation('circle')}><span>◯</span>Círculo</button>
            <button type="button" disabled={!canEdit || marks.length >= 35} onClick={() => addAnnotation('square')}><span>□</span>Cuadrado</button>
            <button type="button" disabled={!canEdit || marks.length >= 35} onClick={() => addAnnotation('arrow')}><span>➜</span>Flecha</button>
          </div>
          <p className="family-sidebar-note">Selecciona una anotación del tablero para cambiar su color, giro, escala y formato. Se sincroniza con la otra vista.</p>
        </div>}
        {therapist && <div className="family-therapist-controls"><span className="family-card-eyebrow">HERRAMIENTAS DEL PSICÓLOGO</span><button className="family-button outline" onClick={() => commit(s => ({ ...s, locked: !s.locked }), false)}>{board.locked ? 'Permitir mover al paciente' : 'Bloquear movimientos del paciente'}</button><button className="family-text-button" onClick={() => setHintOpen(v => !v)}>{hintOpen ? 'Ocultar guía clínica' : 'Ver guía clínica'} ▾</button>{hintOpen && <div className="family-guide"><strong>Exploración sistémica</strong><p>Invita a situar las figuras atendiendo a la cercanía, la dirección de la mirada, el tamaño y las personas ausentes.</p><p>Pregunta: «¿Quién está más cerca de ti?», «¿Qué cambiarías?» o «¿Cómo sería para ti una distancia cómoda?».</p><p>Los significados se exploran con el paciente; no se deducen de la figura elegida.</p></div>}</div>}
        {!therapist && <div className="family-patient-note"><strong>Tu espacio</strong><p>Puedes mover las figuras y cambiar cómo se relacionan entre sí. No hay respuestas correctas.</p>{board.locked && <p>Tu psicólogo ha pausado los cambios de la composición.</p>}</div>}
      </aside>
      <main className="family-workspace">
        <div className="family-stage-head"><div><span className="family-card-eyebrow">ESCULTURA FAMILIAR · COMPOSICIÓN COMPARTIDA</span><h1>Ubica a las personas de tu familia</h1><p>La distancia, el lugar y hacia dónde miran quedan a tu elección.</p></div><button className="family-button subtle" onClick={() => { const root = document.documentElement; if (document.fullscreenElement) document.exitFullscreen?.(); else root.requestFullscreen?.(); }}>⛶ Pantalla completa</button></div>
        <div className="family-tabs" role="tablist" aria-label="Vista de la escultura">{VIEWS.map(v => <button key={v.id} role="tab" aria-selected={view === v.id} className={view === v.id ? 'active' : ''} onClick={() => changeView(v.id)} disabled={!canEdit}>{v.label}</button>)}</div>
        <div className="family-board" ref={boardElement} onPointerMove={reportPointer} onPointerLeave={hidePointer} onPointerDown={e => { if (e.target === e.currentTarget) { setSelected(null); setSelectedMark(null); reportPointer(e, true); } }}>
          {!placed.length && !marks.length && <div className="family-empty"><span aria-hidden="true">◌</span><strong>Este espacio es tuyo</strong><p>Selecciona un muñeco del catálogo para empezar.</p></div>}
          {placed.map(f => {
            const t = templateOf(f.templateId); const pos = draft?.uid === f.uid ? draft : remoteDraft?.uid === f.uid && remoteDraft?.view === view ? remoteDraft : f;
            return <button key={f.uid} type="button" aria-label={f.label + '. Arrastra para mover'} className={'family-placed' + (selected === f.uid ? ' selected' : '')} style={{ left: pos.x + '%', top: pos.y + '%' }} onPointerDown={e => startDrag(e, f)} onPointerMove={dragMove} onPointerUp={endDrag} onPointerCancel={() => { drag.current = null; setDraft(null); }} onClick={e => { e.stopPropagation(); setSelected(f.uid); setSelectedMark(null); }}>
              <Figure template={t} direction={f.direction || 'frente'}/><span className="family-placed-name">{f.label || 'Sin nombre'}</span>
            </button>;
          })}
          {marks.map(mark => {
            const pos = markDraft?.uid === mark.uid ? markDraft :
              remoteDraft?.uid === mark.uid && remoteDraft?.view === view ? remoteDraft : mark;
            const live = transformDraft?.uid === mark.uid ? transformDraft :
              remoteTransform?.uid === mark.uid && remoteTransform?.view === view ? remoteTransform : mark;
            return <div key={mark.uid} role="button" tabIndex={0}
              aria-label={(MARK_LABELS[mark.type] || 'Anotación') + '. Arrastra para mover. Selecciona para girar o redimensionar'}
              className={'family-mark' + (selectedMark === mark.uid ? ' selected' : '')}
              style={{left:pos.x+'%',top:pos.y+'%',
                transform:'translate(-50%, -50%) rotate(' + (live.rotation || 0) + 'deg) scale(' + (live.scale || 1) + ')'}}
              onPointerDown={e => startMarkDrag(e,mark)} onPointerMove={moveMarkDrag}
              onPointerUp={stopMarkDrag} onPointerCancel={() => { markDrag.current=null; setMarkDraft(null); }}
              onKeyDown={e => { if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedMark(mark.uid);setSelected(null);} }}
              onClick={e => { e.stopPropagation(); setSelectedMark(mark.uid); setSelected(null); }}>
              <MarkVisual mark={mark}/>
              {selectedMark === mark.uid && canEdit && <>
                <button type="button" className="family-transform-handle rotate"
                  title="Arrastra para girar con el ratón" aria-label="Girar anotación"
                  onPointerDown={e => startTransformHandle(e,mark,'rotate')}
                  onPointerMove={moveTransformHandle} onPointerUp={stopTransformHandle}
                  onPointerCancel={cancelTransformHandle}
                  onClick={e => e.stopPropagation()}>↻</button>
                <button type="button" className="family-transform-handle resize"
                  title="Arrastra para agrandar o reducir con el ratón" aria-label="Cambiar tamaño de anotación"
                  onPointerDown={e => startTransformHandle(e,mark,'scale')}
                  onPointerMove={moveTransformHandle} onPointerUp={stopTransformHandle}
                  onPointerCancel={cancelTransformHandle}
                  onClick={e => e.stopPropagation()}>⤡</button>
              </>}
            </div>;
          })}
          {remotePointer && remotePointer.view === view && <div className="family-remote" style={{ left: remotePointer.x + '%', top: remotePointer.y + '%' }}><svg width="25" height="28" viewBox="0 0 25 28" aria-hidden="true"><path d="M3 2 V22 L9 17 L13 26 L18 24 L14 15 L23 15 Z" fill={remotePointer.role === 'patient' ? '#B26F67' : '#315846'} stroke="white" strokeWidth="1.7" strokeLinejoin="round"/></svg><span>{remotePointer.role === 'patient' ? 'Paciente' : 'Psicólogo'}</span>{remotePointer.ping && <span className="family-ping"/>}</div>}
          <div className="family-board-foot">{placed.length} {placed.length === 1 ? 'figura' : 'figuras'} · {marks.length} {marks.length === 1 ? 'anotación' : 'anotaciones'} · {view === 'actual' ? 'Situación actual' : 'Situación deseada'}</div>
        </div>
        <div className="family-toolbar">
          {chosenMark ? <div className="family-mark-editor">
            <div className="family-mark-editor-header"><strong>{MARK_LABELS[chosenMark.type] || 'Anotación'} seleccionado</strong>
              <button className="family-chip danger" disabled={!canEdit} type="button"
                onClick={() => { updateAnnotations(list => list.filter(m => m.uid !== chosenMark.uid)); setSelectedMark(null); }}>Eliminar</button>
            </div>
            {chosenMark.type === 'text' && <div className="family-mark-editor-row">
              <label className="family-note-label">Texto
                <textarea className="family-edit-mark-text" disabled={!canEdit} rows="2" maxLength="100"
                  value={annotationTextDraft}
                  onChange={e => setAnnotationTextDraft(cleanAnnotationText(e.target.value))}
                  onBlur={() => { if (annotationTextDraft !== chosenMark.text) editAnnotation(chosenMark.uid,{text:cleanAnnotationText(annotationTextDraft)||'Texto'}); }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) {e.preventDefault();e.currentTarget.blur();} }}/>
              </label>
              <div className="family-format-buttons" aria-label="Formato del texto seleccionado">
                <button type="button" title="Negrita" aria-pressed={!!chosenMark.bold} disabled={!canEdit}
                  className={chosenMark.bold?'active':''} onClick={() => editAnnotation(chosenMark.uid,{bold:!chosenMark.bold})}><strong>N</strong></button>
                <button type="button" title="Cursiva" aria-pressed={!!chosenMark.italic} disabled={!canEdit}
                  className={chosenMark.italic?'active':''} onClick={() => editAnnotation(chosenMark.uid,{italic:!chosenMark.italic})}><em>K</em></button>
                <button type="button" title="Subrayado" aria-pressed={!!chosenMark.underline} disabled={!canEdit}
                  className={chosenMark.underline?'active':''} onClick={() => editAnnotation(chosenMark.uid,{underline:!chosenMark.underline})}><u>S</u></button>
              </div>
              <label className="family-editor-field">Tamaño
                <select disabled={!canEdit} value={chosenMark.size || 'mediano'}
                  onChange={e => editAnnotation(chosenMark.uid,{size:e.target.value})}>
                  <option value="pequeno">Pequeño</option><option value="mediano">Mediano</option><option value="grande">Grande</option>
                </select>
              </label>
            </div>}
            <div className="family-mark-editor-row">
              <span className="family-toolbar-title">Color</span>
              <ColorPicker value={chosenMark.color} disabled={!canEdit} onChange={color => editAnnotation(chosenMark.uid,{color})}/>
              <span className="family-toolbar-title">Girar</span>
              <button className="family-chip" disabled={!canEdit} title="Girar 15° a la izquierda" onClick={() => editAnnotation(chosenMark.uid,{rotation:(chosenMark.rotation||0)-15})}>↶ 15°</button>
              <button className="family-chip" disabled={!canEdit} title="Girar 15° a la derecha" onClick={() => editAnnotation(chosenMark.uid,{rotation:(chosenMark.rotation||0)+15})}>↷ 15°</button>
              <span className="family-toolbar-title">Escala</span>
              <button className="family-chip" disabled={!canEdit || (chosenMark.scale||1) <= .5} onClick={() => editAnnotation(chosenMark.uid,{scale:clamp(Math.round(((chosenMark.scale||1)-.15)*100)/100,.5,2.8)})}>−</button>
              <span className="family-scale-value">{Math.round((chosenMark.scale||1)*100)}%</span>
              <button className="family-chip" disabled={!canEdit || (chosenMark.scale||1) >= 2.8} onClick={() => editAnnotation(chosenMark.uid,{scale:clamp(Math.round(((chosenMark.scale||1)+.15)*100)/100,.5,2.8)})}>+</button>
            </div>
          </div> : selectedFigure ? <><span className="family-toolbar-title">Figura seleccionada</span><label className="family-name-label">Representa a <input disabled={!canEdit} value={selectedFigure.label} maxLength="35" onChange={e => { const value = cleanText(e.target.value); current.current = { ...current.current, figures: { ...current.current.figures, [view]: (current.current.figures[view] || []).map(f => f.uid === selected ? { ...f, label: value } : f) } }; setBoard(current.current); }} onBlur={e => editFigure(selectedFigure.uid, { label: cleanText(e.target.value) || 'Sin nombre' })} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}/></label><span className="family-toolbar-title">Mira hacia</span>{[['izquierda','Izquierda'],['frente','Frente'],['derecha','Derecha']].map(([id,label])=><button key={id} className={'family-chip' + (selectedFigure.direction === id ? ' active' : '')} disabled={!canEdit} onClick={() => editFigure(selected, { direction: id })}>{label}</button>)}<button className="family-chip danger" disabled={!canEdit} onClick={() => { updateFigures(arr => arr.filter(f => f.uid !== selected)); setSelected(null); }}>Quitar</button></> : <span className="family-hint">Arrastra las figuras para moverlas. Usa el ratón para señalar: la otra persona verá tu cursor.</span>}

        </div>
        <div className="family-bottom-actions">
          <button className="family-button outline" disabled={!canEdit || !history.length} onClick={undo}>↶ Deshacer</button>
          {view === 'actual' && <button className="family-button outline" disabled={!canEdit || (!placed.length && !marks.length)} onClick={copyToDesired}>Copiar a «Cómo me gustaría que fuera»</button>}
          <button className="family-button outline" disabled={!canEdit || (!placed.length && !marks.length)} onClick={resetScene}>Vaciar esta vista</button>
          {therapist && <div className="family-download-controls"><span>Descargar</span>
            <button className="family-button outline" disabled={!placed.length && !marks.length} onClick={() => exportScene('svg')}>SVG</button>
            <button className="family-button outline" disabled={!placed.length && !marks.length} onClick={() => exportScene('png')}>PNG</button>
            <button className="family-button outline" disabled={!placed.length && !marks.length} onClick={() => exportScene('jpg')}>JPG</button>
          </div>}
        </div>
      </main>
    </div>
  </div>;
}
