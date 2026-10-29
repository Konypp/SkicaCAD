/* SkicaCAD – sign in with Google and keep the design library and the settings in step between devices (Firebase). Own Firebase project 'skicacad'. Loaded as a module only in the installed app / on the web; the app works without it.

   Firestore, everything under the user's own document users/{uid}:
     skicacad_designs/{design uid}  { data: design JSON, thumb: picture, name, t: last change (ms), del: deleted, app, updated }
     skicacad_blobs/{blob id}       { data: imported mesh JSON }  (only meshes that fit into one document)
     skicacad_meta/settings         { data: settings JSON, t }
   Locally the app keeps its library in localStorage; 'skicacad-sync' remembers what was last in step with the account,
   so a change on one side is told apart from a change on the other. A design changed on both sides keeps the newer one
   under its name and the older one as a copy, so nothing is lost. */
import { initializeApp, getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, initializeFirestore, persistentLocalCache,
  persistentMultipleTabManager, doc, collection, onSnapshot, setDoc, serverTimestamp } from '../vendor/firebase.js';

const L = window.SKICA_LIB;
if (L) {
  /* SkicaCAD's own Firebase project (separate from Filakalk) */
  const cfg = { apiKey: 'AIzaSyB2UGV3Fe9K1MvyUcVmKgw5PaoLIN8fWzA', authDomain: 'skicacad.firebaseapp.com', projectId: 'skicacad',
    storageBucket: 'skicacad.firebasestorage.app', messagingSenderId: '386666387604', appId: '1:386666387604:web:78759bee70dba9c626bc81' };
  const app = initializeApp(cfg, 'skicacad');
  const auth = getAuth(app);
  let db;
  try { db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); } catch (e) { db = initializeFirestore(app, {}); }
  const T = s => (window.I18N ? I18N.t(s) : s);
  const MKEY = 'skicacad-sync', MAXDOC = 1000000;
  const loadMeta = () => { try { return JSON.parse(localStorage.getItem(MKEY)) || {}; } catch (e) { return {}; } };
  let meta = loadMeta();
  const saveMeta = () => { try { localStorage.setItem(MKEY, JSON.stringify(meta)); } catch (e) { /* ignore */ } };
  const hash = s => { if (!s) return 0; let h = 5381; for (let i = 0; i < s.length; i += 7) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h + ':' + s.length; };

  let user = null, unsubs = [], ready = false, timer = null, remote = new Map(), warned = new Set(), lastErr = '';
  const status = (text, err) => { L.syncStatus({ user: user ? (user.email || user.displayName || T('Přihlášen')) : null, text: text || '', err: !!err }); };
  const errText = e => {
    const c = (e && e.code) || '';
    if (c === 'auth/unauthorized-domain') return 'Tato adresa není ve Firebase mezi povolenými doménami.';
    if (c === 'auth/operation-not-allowed') return 'Ve Firebase není zapnuté přihlášení Googlem.';
    if (c === 'auth/network-request-failed') return 'Bez internetu se nelze přihlásit.';
    if (c === 'auth/popup-blocked') return 'Prohlížeč zablokoval přihlašovací okno. Povolte vyskakovací okna.';
    if (c === 'permission-denied') return 'Databáze odmítla přístup. Zkontrolujte pravidla ve Firestore.';
    return 'Synchronizace selhala' + (c ? ' (' + c + ')' : '') + '.';
  };
  const fail = e => { lastErr = errText(e); status(lastErr, true); };

  const designs = () => collection(db, 'users', user.uid, 'skicacad_designs');
  const dref = id => doc(db, 'users', user.uid, 'skicacad_designs', id);

  /* ---- sending ---- */
  async function pushDesign(id) {
    const raw = L.raw(id); if (!raw) return;
    const e = L.list().find(x => x.uid === id); if (!e) return;
    let thumb = L.thumb(id) || null;
    if (raw.length > MAXDOC) {
      if (!warned.has(id)) { warned.add(id); L.toast(T('Návrh je na synchronizaci příliš velký, zůstane jen v tomto zařízení:') + ' ' + e.name); }
      meta.d[id] = { t: e.t, h: hash(thumb) }; return;
    }
    if (thumb && raw.length + thumb.length > MAXDOC) thumb = null;
    meta.d[id] = { t: e.t, h: hash(L.thumb(id)) };
    for (const b of L.blobIds(raw)) if (!meta.b[b]) {
      const v = L.blob(b); if (!v) continue;
      const s = JSON.stringify(v); meta.b[b] = 1;
      if (s.length < MAXDOC) setDoc(doc(db, 'users', user.uid, 'skicacad_blobs', b), { data: s }).catch(fail);
    }
    await setDoc(dref(id), { data: raw, thumb, name: e.name, t: e.t, del: false, app: L.version, updated: serverTimestamp() });
  }
  function push() {
    clearTimeout(timer); timer = null;
    if (!ready || !user) return;
    /* nothing is queued while offline: after reconnecting the account's state is read first, so a design changed on another
       device in the meantime is kept as a copy instead of being overwritten */
    if (!navigator.onLine) { status('Offline – změny se odešlou po připojení'); return; }
    for (const id of L.takeDeleted()) {
      meta.d[id] = { t: 'del' };
      setDoc(dref(id), { data: '', thumb: null, name: '', t: Date.now(), del: true, app: L.version, updated: serverTimestamp() }).catch(fail);
    }
    for (const e of L.list()) {
      const s = meta.d[e.uid], r = remote.get(e.uid);
      if (r && !r.del && s && r.t !== s.t && r.t !== e.t) continue; /* changed there too: the next reconcile sorts it out */
      if (!s || s.t !== e.t || s.h !== hash(L.thumb(e.uid))) pushDesign(e.uid).catch(fail);
    }
    const st = L.settings();
    if (st !== meta.s) { meta.s = st; setDoc(doc(db, 'users', user.uid, 'skicacad_meta', 'settings'), { data: st, t: L.settingsT() }).catch(fail); }
    saveMeta();
  }
  L.onChange(() => { if (ready && user) { clearTimeout(timer); timer = setTimeout(push, 1500); } });

  /* ---- receiving ---- */
  function reconcile() {
    const local = new Map(L.list().map(x => [x.uid, x]));
    for (const [id, r] of remote) {
      const l = local.get(id), s = meta.d[id];
      if (r.del) {
        if (l && s && s.t === l.t) { L.remove(id); meta.d[id] = { t: 'del' }; }
        else if (!l) meta.d[id] = { t: 'del' };
        else meta.d[id] = { t: r.t, h: '' };                                  /* changed here after it was deleted there: push() brings it back */
        continue;
      }
      if (!l) {
        if (s && (s.t === 'del' || s.t === r.t)) continue; /* deleted here (the tombstone is on its way) or dropped from a full library */
        L.put(id, r.data, r.thumb, r.t); meta.d[id] = { t: r.t, h: hash(r.thumb) }; continue;
      }
      if (l.t === r.t) { if (!s || s.t !== r.t) meta.d[id] = { t: r.t, h: hash(L.thumb(id)) }; continue; }
      if (s && s.t === r.t) continue;                                           /* changed only here: push() sends it */
      if (s && s.t === l.t) { L.put(id, r.data, r.thumb, r.t); meta.d[id] = { t: r.t, h: hash(r.thumb) }; continue; } /* changed only there */
      /* changed on both sides (or met for the first time with different content): the newer keeps the name, the older becomes a copy */
      if (r.t > l.t) { L.copy(id); L.put(id, r.data, r.thumb, r.t); meta.d[id] = { t: r.t, h: hash(r.thumb) }; }
      else { L.copyFrom(r.data, r.thumb); meta.d[id] = { t: r.t, h: '' }; } /* the account's version is now a copy here; push() sends this one */
    }
    saveMeta();
  }
  function onSettings(snap) {
    const local = L.settings();
    if (!snap.exists()) { meta.s = null; return; }
    const r = snap.get('data'), rt = snap.get('t') || 0;
    if (r === local) { meta.s = r; return; }
    if (meta.s === local || (meta.s !== r && rt > L.settingsT())) { meta.s = r; L.applySettings(r); }
    saveMeta();
  }

  function start() {
    let gotDesigns = false, gotSettings = false;
    const go = () => { if (!ready && gotDesigns && gotSettings) { ready = true; reconcile(); push(); status(navigator.onLine ? 'Synchronizováno' : 'Offline'); } };
    unsubs.push(onSnapshot(designs(), { includeMetadataChanges: true }, snap => {
      if (!ready && snap.metadata.fromCache && navigator.onLine) { status('Načítám…'); return; }
      remote = new Map(snap.docs.map(d => [d.id, d.data()]));
      gotDesigns = true;
      if (ready) { reconcile(); push(); }
      else go();
      if (ready && !lastErr) status(snap.metadata.hasPendingWrites ? (navigator.onLine ? 'Ukládám…' : 'Offline – změny se odešlou po připojení') : snap.metadata.fromCache ? 'Offline' : 'Synchronizováno');
    }, fail));
    unsubs.push(onSnapshot(doc(db, 'users', user.uid, 'skicacad_meta', 'settings'), snap => { gotSettings = true; onSettings(snap); go(); }, e => { gotSettings = true; fail(e); go(); }));
    unsubs.push(onSnapshot(collection(db, 'users', user.uid, 'skicacad_blobs'), snap => {
      for (const d of snap.docs) { meta.b[d.id] = 1; if (!L.blob(d.id)) { try { L.putBlob(d.id, JSON.parse(d.get('data'))); } catch (e) { /* skip */ } } }
    }, fail));
  }

  onAuthStateChanged(auth, u => {
    unsubs.forEach(f => f()); unsubs = []; clearTimeout(timer); timer = null; ready = false; remote = new Map(); lastErr = '';
    user = u;
    if (!u) { status('Návrhy jsou jen v tomto zařízení.'); return; }
    if (meta.uid !== u.uid || meta.p !== cfg.projectId) meta = { uid: u.uid, p: cfg.projectId, d: {}, b: {}, s: null }; /* another account or project: compare everything afresh */
    meta.d = meta.d || {}; meta.b = meta.b || {}; saveMeta();
    status('Načítám…');
    start();
  });
  L.syncReady({
    login: () => { lastErr = ''; status(''); signInWithPopup(auth, new GoogleAuthProvider()).catch(e => { if (e && (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request')) return; fail(e); }); },
    logout: () => { push(); signOut(auth); }
  });
}
