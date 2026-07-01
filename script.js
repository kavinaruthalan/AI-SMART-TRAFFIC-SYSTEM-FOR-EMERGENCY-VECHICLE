// ═══════════════════════════════════════════════════════════
// FAST2SMS — REAL SMS OTP INTEGRATION
// Fast2SMS is a free Indian SMS API (100 SMS/day free)
// Sign up: https://fast2sms.com → Dev API → Copy key
// ═══════════════════════════════════════════════════════════
let FAST2SMS_API_KEY = localStorage.getItem('vs_sms_key') || '';

function saveSMSKey() {
  const k = document.getElementById('fast2sms-key').value.trim();
  FAST2SMS_API_KEY = k;
  localStorage.setItem('vs_sms_key', k);
  updateSMSModeBadge();
  toast(k ? '✅ SMS API key saved — Real SMS enabled!' : 'ℹ SMS key cleared — Demo mode', k?'success':'info');
}

function updateSMSModeBadge() {
  const badge = document.getElementById('sms-mode-lbl');
  const keyStatus = document.getElementById('sett-sms-key-status');
  const modeText = document.getElementById('sett-sms-mode');
  if (FAST2SMS_API_KEY) {
    badge.textContent = '✅ LIVE SMS';
    badge.className = 'sms-mode-badge live';
    if(keyStatus) keyStatus.textContent = '✅ Configured (' + FAST2SMS_API_KEY.substring(0,8) + '...)';
    if(modeText) modeText.textContent = 'Live — Real SMS to mobile';
  } else {
    badge.textContent = '⚠ DEMO MODE';
    badge.className = 'sms-mode-badge demo';
    if(keyStatus) keyStatus.textContent = '❌ Not configured';
    if(modeText) modeText.textContent = 'Demo (OTP shown on screen)';
  }
}

// Load saved key on startup
window.addEventListener('load', () => {
  const saved = localStorage.getItem('vs_sms_key');
  if (saved) {
    document.getElementById('fast2sms-key').value = saved;
    FAST2SMS_API_KEY = saved;
  }
  updateSMSModeBadge();
});

async function sendRealSMS(phone, otp) {
  // Normalize phone: remove +91 or 91, keep 10 digits for Fast2SMS
  let normalizedPhone = phone.replace(/\s/g,'').replace(/^\+91/, '').replace(/^91/, '');
  
  if (!FAST2SMS_API_KEY) {
    // Demo mode: show OTP on screen
    return { success: false, demoMode: true, otp };
  }

  try {
    // Fast2SMS API (works cross-origin in browser for their API)
    const response = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&route=otp&variables_values=${otp}&flash=0&numbers=${normalizedPhone}`, {
      method: 'GET',
      headers: { 'cache-control': 'no-cache' }
    });
    const data = await response.json();
    if (data.return === true) {
      return { success: true };
    } else {
      return { success: false, error: data.message || 'SMS send failed', demoMode: true, otp };
    }
  } catch (e) {
    // CORS or network error — try alternate approach via no-cors note
    console.warn('[SMS] Could not reach Fast2SMS API:', e.message);
    return { success: false, error: 'Network error — check API key or CORS', demoMode: true, otp };
  }
}

// ═══════════════════════════════════════════════════════════
// IN-BROWSER DATABASE (localStorage-backed)
// ═══════════════════════════════════════════════════════════
function getDB(key, def={}) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch(e) { return def; }
}
function setDB(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function getUserDB() { return getDB('vs_users', {}); }
function saveUserDB(db) { setDB('vs_users', db); }
function getVehicleDB() { return getDB('vs_vehicles', seededVehicles()); }
function saveVehicleDB(db) { setDB('vs_vehicles', db); }
function getFraudDB() { return getDB('vs_fraud', seededFraud()); }
function saveFraudDB(db) { setDB('vs_fraud', db); }
function getScanLog() { return getDB('vs_scans', []); }
function saveScanLog(d) { setDB('vs_scans', d); }

const BASE_LAT = 10.8505, BASE_LNG = 76.2711; // Kerala center

function seededVehicles() {
  return {
    'v1': { id:'v1', ownerId:'demo1', ownerName:'Arjun Nair', ownerPhone:'+919876543210', registrationNumber:'KL07AB1234', vehicleType:'car', make:'Toyota', model:'Innova', year:2022, color:'White', state:'Kerala', status:'active', isVerified:true, registeredAt:'2024-01-15T10:00:00Z', lastLocation:{lat:9.9312,lng:76.2673,speed:45,timestamp:new Date().toISOString()}, insuranceExpiry:'2026-01-15', pucExpiry:'2026-06-15' },
    'v2': { id:'v2', ownerId:'demo2', ownerName:'Priya Menon', ownerPhone:'+919845123456', registrationNumber:'KL10CD5678', vehicleType:'bike', make:'Honda', model:'Activa', year:2021, color:'Blue', state:'Kerala', status:'active', isVerified:true, registeredAt:'2024-02-20T09:00:00Z', lastLocation:{lat:8.5241,lng:76.9366,speed:30,timestamp:new Date().toISOString()}, insuranceExpiry:'2025-12-20', pucExpiry:'2025-10-20' },
    'v3': { id:'v3', ownerId:'demo3', ownerName:'Rahul Dev', ownerPhone:'+919812345678', registrationNumber:'KL04EF9012', vehicleType:'truck', make:'Tata', model:'Ace', year:2020, color:'Red', state:'Kerala', status:'active', isVerified:false, registeredAt:'2024-03-10T08:00:00Z', lastLocation:{lat:11.2588,lng:75.7804,speed:60,timestamp:new Date().toISOString()}, insuranceExpiry:'2024-03-10', pucExpiry:'2024-01-10' },
  };
}

function seededFraud() {
  return [
    { id:'f1', regNo:'KL09XY9999', reportedBy:'AI System — ANPR Camera', reason:'Unregistered vehicle detected at checkpoint', riskLevel:'high', details:{detectionMethod:'ANPR Camera', location:'Palakkad Checkpoint', cameraId:'CAM-PKD-003'}, status:'open', createdAt:new Date().toISOString(), recommendation:'Stop vehicle for manual verification. Check driver ID, vehicle documents. File report if no valid documentation.' },
    { id:'f2', regNo:'TN01AB0000', reportedBy:'AI System — Database Match', reason:'Vehicle matches stolen vehicle database. Owner reported theft on 2024-11-12.', riskLevel:'critical', details:{detectionMethod:'License Plate Recognition', location:'Walayar Border', stolenDate:'2024-11-12'}, status:'open', createdAt:new Date().toISOString(), recommendation:'IMMEDIATE ACTION: Stop vehicle, detain occupants, contact local police station. Do NOT allow to proceed.' },
  ];
}

// ═══════════════════════════════════════════════════════════
// STAFF DATA
// ═══════════════════════════════════════════════════════════
const STAFF = {
  'admin':    {pass:'admin123',   role:'SYSTEM ADMIN',    label:'AD', icon:'🛡️'},
  'police':   {pass:'police123',  role:'POLICE DISPATCH', label:'PD', icon:'🚔'},
  'hospital': {pass:'hospital123',role:'HOSPITAL STAFF',  label:'HS', icon:'🏥'},
  'fire':     {pass:'fire123',    role:'FIRE DISPATCH',   label:'FD', icon:'🚒'}
};

const UNITS = [
  {id:'AMB-07', type:'Ambulance', icon:'🚑', status:'active',  color:'#ff1a3c', lat:BASE_LAT+.012, lng:BASE_LNG+.018, speed:62, desc:'En route Sector 4'},
  {id:'AMB-09', type:'Ambulance', icon:'🚑', status:'standby', color:'#39ff14', lat:BASE_LAT-.008, lng:BASE_LNG-.010, speed:0,  desc:'Station A standby'},
  {id:'POL-12', type:'Police',    icon:'🚔', status:'active',  color:'#2979ff', lat:BASE_LAT+.020, lng:BASE_LNG+.005, speed:78, desc:'Patrol Ring Road'},
  {id:'POL-14', type:'Police',    icon:'🚔', status:'en-route',color:'#ffb300', lat:BASE_LAT-.015, lng:BASE_LNG+.022, speed:55, desc:'Responding Sector 2'},
  {id:'POL-16', type:'Police',    icon:'🚔', status:'standby', color:'#39ff14', lat:BASE_LAT+.005, lng:BASE_LNG-.008, speed:0,  desc:'Police HQ'},
  {id:'FIRE-03',type:'Fire Eng',  icon:'🚒', status:'active',  color:'#ff6d00', lat:BASE_LAT+.008, lng:BASE_LNG+.030, speed:70, desc:'Industrial Zone B'},
  {id:'FIRE-05',type:'Fire Eng',  icon:'🚒', status:'standby', color:'#39ff14', lat:BASE_LAT-.020, lng:BASE_LNG-.015, speed:0,  desc:'Station C'},
];

const INCIDENTS_DATA = [
  {id:'INC-001',type:'Medical Emergency',location:'Main Blvd, Sector 4',priority:'high',status:'active',unit:'AMB-07',time:'08:14',lat:BASE_LAT+.012,lng:BASE_LNG+.018},
  {id:'INC-002',type:'Road Accident',location:'Ring Road Junction 3',priority:'high',status:'en-route',unit:'POL-12',time:'08:22',lat:BASE_LAT+.020,lng:BASE_LNG+.005},
  {id:'INC-003',type:'Fire Emergency',location:'Industrial Zone B',priority:'medium',status:'dispatch',unit:'FIRE-03',time:'08:35',lat:BASE_LAT+.008,lng:BASE_LNG+.030},
  {id:'INC-004',type:'Criminal Activity',location:'Park Street',priority:'medium',status:'en-route',unit:'POL-14',time:'08:41',lat:BASE_LAT-.015,lng:BASE_LNG+.022},
  {id:'INC-005',type:'Medical Emergency',location:'City Hospital',priority:'low',status:'cleared',unit:'AMB-09',time:'08:50',lat:BASE_LAT-.008,lng:BASE_LNG-.010},
];

const SIGNALS = [
  {id:'SIG-01',name:'Main Blvd / 1st',status:'cleared'},{id:'SIG-02',name:'Ring Rd / 2nd',status:'green'},
  {id:'SIG-03',name:'Sector 4 / 3rd',status:'cleared'},{id:'SIG-04',name:'Hwy 7 / Jct A',status:'red'},
  {id:'SIG-05',name:'Park St / 5th',status:'green'},{id:'SIG-06',name:'Indus Zone / B',status:'red'},
  {id:'SIG-07',name:'North Ave / 7th',status:'green'},{id:'SIG-08',name:'East Rd / 8th',status:'cleared'},
  {id:'SIG-09',name:'West Blvd / 9th',status:'red'}
];

const COMM_MSGS = [
  {from:'DISPATCH',text:'All units report status.',time:'08:00',type:'out'},
  {from:'AMB-07',text:'AMB-07 responding — ETA 4 min to Sector 4.',time:'08:01',type:'inn'},
  {from:'POL-12',text:'POL-12 en route Ring Road. Traffic building.',time:'08:02',type:'inn'},
  {from:'FIRE-03',text:'FIRE-03 on scene Industrial Zone B.',time:'08:08',type:'emg'},
];

const KNOWN_STOLEN = ['TN01AB0000','KL09XX0000'];

let incidents = [...INCIDENTS_DATA];
let incCounter = 6;
let currentStaff = null;
let currentRole = 'admin';
let mapInstance = null;
let unitMarkers = {};
let incidentMarkers = {};
let vehicleMarkers = {};
let userMapInstance = null;
let userLat = null, userLng = null;
let watchId = null;
let isSharing = false;
let _otp = '', _uMode = 'login', _pendingUser = {};
let recognition = null, isRec = false;
let currentUser = null;

// ═══════════════════════════════════════════════════════════
// PORTAL
// ═══════════════════════════════════════════════════════════
function showStaffLogin(role) {
  document.getElementById('portal').style.display = 'none';
  document.getElementById('staff-auth').style.display = 'flex';
  if(role) { selRole(document.getElementById('rb-'+role), role); }
}
function showUserAuth() {
  document.getElementById('portal').style.display = 'none';
  document.getElementById('user-auth').style.display = 'flex';
}
function backToPortal() {
  document.querySelectorAll('.auth-overlay').forEach(a=>a.style.display='none');
  document.getElementById('portal').style.display = 'flex';
  goUA(0);
}

// ═══════════════════════════════════════════════════════════
// STAFF LOGIN
// ═══════════════════════════════════════════════════════════
function selRole(btn, role) {
  document.querySelectorAll('.rbtn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  currentRole = role;
  document.getElementById('s-user').value = role;
}

function doStaffLogin() {
  const u = document.getElementById('s-user').value.trim().toLowerCase();
  const p = document.getElementById('s-pass').value;
  const err = document.getElementById('s-err');
  if (STAFF[u] && STAFF[u].pass === p) {
    currentStaff = u;
    document.getElementById('tb-av').textContent = STAFF[u].label;
    document.getElementById('tb-uname').textContent = u.toUpperCase();
    document.getElementById('tb-urole').textContent = STAFF[u].role;
    document.getElementById('staff-auth').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('sms-cfg-notice').style.marginTop='0';
    document.getElementById('app').style.marginTop='44px';
    initDashboard();
  } else {
    err.style.display='block'; err.textContent='⛔ Invalid credentials. Try: admin/admin123';
    setTimeout(()=>err.style.display='none',3500);
  }
}

function staffLogout() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('portal').style.display = 'flex';
  currentStaff = null;
}

document.addEventListener('DOMContentLoaded', () => {
  const sp = document.getElementById('s-pass');
  if(sp) sp.addEventListener('keydown', e=>{ if(e.key==='Enter') doStaffLogin(); });
});

// ═══════════════════════════════════════════════════════════
// USER AUTH — REAL OTP
// ═══════════════════════════════════════════════════════════
function switchUTab(mode) {
  _uMode = mode;
  document.getElementById('atab-login').classList.toggle('active', mode==='login');
  document.getElementById('atab-reg').classList.toggle('active', mode==='reg');
  document.getElementById('u-login-form').style.display = mode==='login'?'block':'none';
  document.getElementById('u-reg-form').style.display = mode==='reg'?'block':'none';

}

function checkUserIdAvailability(val) {
  const icon = document.getElementById('uid-check-icon');
  const msg = document.getElementById('uid-check-msg');
  if(!icon || !msg) return;
  const v = val.trim();
  if(!v) { icon.textContent=''; msg.textContent=''; return; }
  if(v.length < 4) { icon.textContent='⚠️'; msg.style.color='var(--amber)'; msg.textContent='Min 4 characters required'; return; }
  if(!/^[A-Za-z0-9_@.-]+$/.test(v)) { icon.textContent='❌'; msg.style.color='var(--red)'; msg.textContent='Only letters, numbers, _ @ . - allowed'; return; }
  const db = getUserDB();
  const taken = !!db[v] || Object.values(db).find(u => (u.customId||u.id)===v);
  if(taken) { icon.textContent='❌'; msg.style.color='var(--red)'; msg.textContent='⛔ User ID already taken — choose another'; }
  else { icon.textContent='✅'; msg.style.color='var(--green)'; msg.textContent='✅ User ID available'; }
}

async function uSendOTP(mode) {
  _uMode = mode;
  const showErr = (id, msg) => { const e=document.getElementById(id); e.textContent='⛔ '+msg; e.style.display='block'; setTimeout(()=>e.style.display='none',4000); };
  let name, phone, email='', address='';
  
  if (mode==='login') {
    name = document.getElementById('ul-name').value.trim();
    phone = document.getElementById('ul-phone').value.trim().replace(/\s/g,'');
    if (!name) return showErr('ul-err','Please enter your name');
    if (!phone || phone.replace(/\D/g,'').length < 8) return showErr('ul-err','Enter a valid phone number');
    const db = getUserDB();
    const found = Object.values(db).find(u=>u.phone===phone || u.phone===phone.replace('+91','91'));
    if (!found) return showErr('ul-err','Phone not registered. Please register first.');
    if (found.name.toLowerCase() !== name.toLowerCase()) return showErr('ul-err','Name does not match records.');
    _pendingUser = found;
  } else {
    name = document.getElementById('ur-name').value.trim();
    phone = document.getElementById('ur-phone').value.trim().replace(/\s/g,'');
    email = document.getElementById('ur-email').value.trim();
    address = document.getElementById('ur-address').value.trim();
    if (!name) return showErr('ur-err','Please enter your full name');
    if (!phone || phone.replace(/\D/g,'').length < 8) return showErr('ur-err','Enter a valid phone number');
    const db = getUserDB();
    if (Object.values(db).find(u=>u.phone===phone)) return showErr('ur-err','Phone already registered. Please login.');
    // Capture vehicle number and lock User ID
    const vehicleReg = (document.getElementById('ur-vehicle')?.value||'').trim().toUpperCase();
    const uidEl = document.getElementById('ur-userid');
    const chosenUid = (uidEl?.value||'').trim();
    if(!chosenUid || chosenUid.length < 4) return showErr('ur-err','Please enter a User ID (min 4 characters)');
    if(!/^[A-Za-z0-9_@.-]+$/.test(chosenUid)) return showErr('ur-err','User ID: only letters, numbers, _ @ . - allowed');
    const dbCheck = getUserDB();
    if(dbCheck[chosenUid] || Object.values(dbCheck).find(u=>(u.customId||u.id)===chosenUid)) return showErr('ur-err','User ID already taken — please choose another');
    _pendingUser = { name, phone, email, address, vehicleReg, previewUid: chosenUid, registeredAt: new Date().toISOString() };
  }

  _otp = String(Math.floor(100000 + Math.random() * 900000));
  document.getElementById('otp-ph').textContent = phone;
  for(let i=0;i<6;i++) document.getElementById('od'+i).value='';
  document.getElementById('otp-err').style.display='none';
  document.getElementById('otp-ok').style.display='none';
  
  // Update status UI
  document.getElementById('sms-status-dot').className='sms-dot demo';
  document.getElementById('sms-status-text').textContent='Sending OTP via SMS...';
  document.getElementById('sms-status-text').style.color='var(--amber)';
  document.getElementById('demo-otp-box').style.display='none';
  
  goUA(1);
  
  // Send real SMS
  const result = await sendRealSMS(phone, _otp);
  
  if (result.success) {
    // Real SMS sent
    document.getElementById('sms-status-dot').className='sms-dot live';
    document.getElementById('sms-status-text').textContent='✅ OTP sent via real SMS!';
    document.getElementById('sms-status-text').style.color='var(--green)';
    document.getElementById('otp-sms-info').textContent='OTP sent to your mobile. Check SMS. Valid 10 min.';
    document.getElementById('demo-otp-box').style.display='none';
    toast('📱 Real SMS OTP sent to '+phone,'success');
  } else {
    // Demo mode — show OTP on screen
    document.getElementById('sms-status-dot').className='sms-dot demo';
    if (result.error) {
      document.getElementById('sms-status-text').textContent='⚠ ' + result.error;
    } else {
      document.getElementById('sms-status-text').textContent='⚠ Demo mode — No API key configured';
    }
    document.getElementById('sms-status-text').style.color='var(--amber)';
    document.getElementById('demo-otp-val').textContent = _otp;
    document.getElementById('demo-otp-box').style.display='block';
    if (!FAST2SMS_API_KEY) {
      toast('⚠ Demo mode: OTP shown on screen. Add Fast2SMS key for real SMS','warn');
    } else {
      toast('⚠ SMS failed — OTP shown on screen (check API key)','warn');
    }
  }
  
  setTimeout(()=>document.getElementById('od0').focus(), 100);
}

function goUA(step) {
  document.querySelectorAll('.uauth-step').forEach(s=>s.classList.remove('act'));
  document.getElementById('ua'+step).classList.add('act');
}
function oNext(i) {
  const box = document.getElementById('od'+i);
  if(box.value && i<5) document.getElementById('od'+(i+1)).focus();
  const all = Array.from({length:6},(_,j)=>document.getElementById('od'+j).value).join('');
  if(all.length===6) setTimeout(verifyOTP,200);
}
function oBack(e,i) { if(e.key==='Backspace'&&!document.getElementById('od'+i).value&&i>0) document.getElementById('od'+(i-1)).focus(); }

function verifyOTP() {
  const entered = Array.from({length:6},(_,i)=>document.getElementById('od'+i).value).join('');
  const err = document.getElementById('otp-err'), ok = document.getElementById('otp-ok');
  if (entered !== _otp) {
    err.textContent = '⛔ Incorrect OTP. Please try again.'; err.style.display='block';
    document.querySelectorAll('.otp-d').forEach(d=>{d.style.borderColor='var(--red)';setTimeout(()=>d.style.borderColor='',1000)});
    setTimeout(()=>err.style.display='none',3000); return;
  }
  ok.textContent = '✅ OTP Verified! Entering...'; ok.style.display='block';
  if (_uMode === 'reg') {
    const db = getUserDB();
    const uid = _pendingUser.previewUid || ('u_'+Date.now());
    db[uid] = {..._pendingUser, id:uid, sosHistory:[], vehicleIds:[]};
    saveUserDB(db); _pendingUser = db[uid];
    // Auto-register vehicle if provided
    if(_pendingUser.vehicleReg) {
      const vdb = getVehicleDB();
      if(!Object.values(vdb).find(v=>v.registrationNumber===_pendingUser.vehicleReg)) {
        const vid='v_'+Date.now();
        vdb[vid]={id:vid,ownerId:uid,ownerName:_pendingUser.name,ownerPhone:_pendingUser.phone,registrationNumber:_pendingUser.vehicleReg,vehicleType:'car',make:'',model:'',year:new Date().getFullYear(),color:'',state:'',status:'active',isVerified:false,registeredAt:new Date().toISOString(),lastLocation:{lat:BASE_LAT,lng:BASE_LNG,speed:0,timestamp:new Date().toISOString()}};
        saveVehicleDB(vdb);
      }
    }
    toast('✅ Registration successful!', 'success');
  }
  setTimeout(() => {
    currentUser = _pendingUser;
    document.getElementById('user-auth').style.display = 'none';
    document.getElementById('app').style.marginTop='0';
    openUserDashboard(_pendingUser);
  }, 700);
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD INIT
// ═══════════════════════════════════════════════════════════
function initDashboard() {
  startClock();
  renderUnitList();
  renderIncidents();
  renderSignals();
  renderComms();
  renderVehicles();
  renderFraudAlerts();
  renderCitizens();
  renderLocBroadcasts();
  startAutoSim();
  updateStats();
  addAlert('ok','SYSTEM ONLINE','VehicleShield AI + EmergencyNet 4.0 fully operational');
  addAlert('info','GPS ACTIVE','All '+UNITS.length+' emergency units broadcasting live coordinates');
  const fd = getFraudDB();
  fd.forEach(f=>addFraudFeedItem(f));
}

function startClock() {
  function tick() {
    const n=new Date(); const s=n.toTimeString().slice(0,8);
    const c=document.getElementById('tb-clock'); if(c) c.textContent=s;
  }
  tick(); setInterval(tick,1000);
}

function updateStats() {
  const vdb = getVehicleDB();
  const fdb = getFraudDB();
  document.getElementById('st-veh-count').textContent = Object.keys(vdb).length;
  document.getElementById('st-fraud').textContent = fdb.filter(f=>f.status==='open').length;
  document.getElementById('veh-badge').textContent = Object.keys(vdb).length;
  document.getElementById('fraud-badge').textContent = fdb.filter(f=>f.status==='open').length;
}

// ═══════════════════════════════════════════════════════════
// UNIT LIST
// ═══════════════════════════════════════════════════════════
function renderUnitList() {
  const el = document.getElementById('unit-list');
  el.innerHTML = UNITS.map(u=>`
    <div class="unit-card" onclick="focusUnit('${u.id}')">
      <div class="uc-head">
        <div class="uc-id">${u.icon} ${u.id}</div>
        <div class="uc-dot dot-${u.status.replace('-','-')}"></div>
      </div>
      <div class="uc-type">${u.type}</div>
      <div class="uc-loc">${u.desc}</div>
      <div class="uc-speed">${u.speed>0?u.speed+' km/h':'STANDBY'}</div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════
// INCIDENTS
// ═══════════════════════════════════════════════════════════
function renderIncidents() {
  const tb = document.getElementById('inc-body');
  tb.innerHTML = incidents.map(i=>`
    <tr>
      <td style="color:var(--cyan);font-family:Orbitron,monospace;font-size:10px">${i.id}</td>
      <td>${i.type}</td>
      <td>${i.location}</td>
      <td><span class="badge ${i.priority==='high'?'b-high':i.priority==='medium'?'b-med':'b-low'}">${i.priority.toUpperCase()}</span></td>
      <td><span class="badge ${i.status==='active'?'b-active':i.status==='en-route'?'b-route':i.status==='cleared'?'b-clear':'b-disp'}">${i.status.toUpperCase()}</span></td>
      <td style="color:var(--amber);font-family:Orbitron,monospace;font-size:9px">${i.unit}</td>
      <td style="color:var(--muted)">${i.time}</td>
      <td><button class="abtn" onclick="resolveInc('${i.id}')">Resolve</button></td>
    </tr>`).join('');
  document.getElementById('st-active').textContent = incidents.filter(i=>i.status!=='cleared').length;
}

function resolveInc(id) {
  const inc = incidents.find(i=>i.id===id);
  if(inc){ inc.status='cleared'; renderIncidents(); addAlert('ok',inc.id+' RESOLVED',inc.type+' at '+inc.location); toast('Incident resolved','success'); }
}

// ═══════════════════════════════════════════════════════════
// SIGNALS
// ═══════════════════════════════════════════════════════════
function renderSignals() {
  const g = document.getElementById('sig-grid');
  g.innerHTML = SIGNALS.map(s=>`
    <div class="sig-card">
      <div class="sig-id">${s.id}</div>
      <div class="sig-name">${s.name}</div>
      <div class="sig-light ${s.status}" id="sl-${s.id}"></div>
      <div class="sig-lbl ${s.status}" id="slbl-${s.id}">${s.status.toUpperCase()}</div>
      <button class="sig-btn" onclick="toggleSig('${s.id}')">Toggle Signal</button>
    </div>`).join('');
}

function toggleSig(id) {
  const s=SIGNALS.find(s=>s.id===id);
  if(!s) return;
  const cycle = {red:'green',green:'cleared',cleared:'red'};
  s.status = cycle[s.status];
  const l=document.getElementById('sl-'+id), lb=document.getElementById('slbl-'+id);
  if(l){l.className='sig-light '+s.status;}
  if(lb){lb.className='sig-lbl '+s.status; lb.textContent=s.status.toUpperCase();}
}

function clearAllSig() {
  SIGNALS.forEach(s=>s.status='cleared');
  renderSignals();
  addAlert('ok','ALL SIGNALS CLEARED','Emergency corridor open on all routes');
  toast('✅ All signals cleared for emergency!','success');
}

// ═══════════════════════════════════════════════════════════
// MAP
// ═══════════════════════════════════════════════════════════
function initMap() {
  if(mapInstance) return;
  mapInstance = L.map('live-map').setView([BASE_LAT, BASE_LNG], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OSM'}).addTo(mapInstance);
  renderMapMarkers();
  simulateMovement();
}

function renderMapMarkers() {
  if(!mapInstance) return;
  // Emergency units
  UNITS.forEach(u=>{
    if(unitMarkers[u.id]) mapInstance.removeLayer(unitMarkers[u.id]);
    const ic = L.divIcon({className:'',html:`<div style="background:${u.color};border:2px solid #fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;box-shadow:0 0 8px ${u.color}">${u.icon}</div>`,iconSize:[20,20],iconAnchor:[10,10]});
    unitMarkers[u.id] = L.marker([u.lat,u.lng],{icon:ic}).bindPopup(`<b>${u.id}</b><br>${u.type}<br>${u.desc}<br>Speed: ${u.speed} km/h`).addTo(mapInstance);
  });
  // Registered vehicles
  const vdb = getVehicleDB();
  Object.values(vdb).forEach(v=>{
    if(!v.lastLocation) return;
    if(vehicleMarkers[v.id]) mapInstance.removeLayer(vehicleMarkers[v.id]);
    const vColor = v.status==='stolen'?'#ff1a3c':v.status==='flagged'?'#ffb300':v.status==='active'&&v.isVerified?'#39ff14':'#4a7090';
    const ic = L.divIcon({className:'',html:`<div style="background:${vColor};border:2px solid #fff;border-radius:3px;padding:2px 5px;font-size:8px;font-family:Orbitron,monospace;font-weight:700;color:#000;white-space:nowrap;box-shadow:0 0 6px ${vColor}">${v.registrationNumber}</div>`,iconSize:[80,20],iconAnchor:[40,10]});
    vehicleMarkers[v.id] = L.marker([v.lastLocation.lat,v.lastLocation.lng],{icon:ic}).bindPopup(`<b>${v.registrationNumber}</b><br>${v.ownerName}<br>${v.make} ${v.model} ${v.year}<br>Status: ${v.status}`).addTo(mapInstance);
  });
}

function simulateMovement() {
  setInterval(()=>{
    UNITS.forEach(u=>{
      if(u.status!=='standby'){
        u.lat += (Math.random()-.5)*.002;
        u.lng += (Math.random()-.5)*.002;
        u.speed = Math.max(0,Math.min(120,u.speed+(Math.random()-.5)*10));
        if(unitMarkers[u.id]) unitMarkers[u.id].setLatLng([u.lat,u.lng]);
      }
    });
    // Simulate vehicle movement
    const vdb = getVehicleDB();
    Object.values(vdb).forEach(v=>{
      if(v.lastLocation&&v.lastLocation.speed>0){
        v.lastLocation.lat += (Math.random()-.5)*.001;
        v.lastLocation.lng += (Math.random()-.5)*.001;
        v.lastLocation.timestamp = new Date().toISOString();
        if(vehicleMarkers[v.id]) vehicleMarkers[v.id].setLatLng([v.lastLocation.lat,v.lastLocation.lng]);
      }
    });
  }, 3000);
}

function focusUnit(id) {
  const u=UNITS.find(u=>u.id===id);
  if(u&&mapInstance){ mapInstance.setView([u.lat,u.lng],14); showTab('map'); switchNav(document.querySelector('.nav-i[onclick*="map"]'),'map'); }
}

// ═══════════════════════════════════════════════════════════
// VEHICLES
// ═══════════════════════════════════════════════════════════
function renderVehicles() {
  const vdb = getVehicleDB();
  const vehicles = Object.values(vdb);
  
  // Cards
  const grid = document.getElementById('veh-grid');
  const statusColors = {active:'var(--green)',flagged:'var(--amber)',stolen:'var(--red)',suspended:'var(--muted)'};
  grid.innerHTML = vehicles.map(v=>`
    <div class="veh-card" style="border-top:2px solid ${statusColors[v.status]||'var(--wire)'}">
      <div class="veh-reg">${v.registrationNumber}</div>
      <div class="veh-owner">👤 ${v.ownerName}</div>
      <div class="veh-type">${(v.vehicleType||'car').toUpperCase()} · ${v.make} ${v.model} ${v.year} · ${v.color}</div>
      <div class="veh-loc">📍 ${v.lastLocation?`${v.lastLocation.lat.toFixed(4)}, ${v.lastLocation.lng.toFixed(4)}`:'No GPS'}</div>
      <div class="veh-spd">⚡ ${v.lastLocation&&v.lastLocation.speed?v.lastLocation.speed+' km/h':'Parked'}</div>
      <div class="veh-status-badge"><span class="badge ${v.status==='active'?'b-clear':v.status==='flagged'?'b-med':'b-high'}">${v.status.toUpperCase()}</span></div>
      ${v.isVerified?'<span style="position:absolute;bottom:10px;right:10px;font-size:9px;color:var(--green)">✅ RTO VERIFIED</span>':'<span style="position:absolute;bottom:10px;right:10px;font-size:9px;color:var(--amber)">⚠ UNVERIFIED</span>'}
    </div>`).join('');
  
  // Table
  const tb = document.getElementById('veh-table-body');
  tb.innerHTML = vehicles.map(v=>`
    <tr>
      <td style="font-family:Orbitron,monospace;font-size:11px;color:var(--cyan);letter-spacing:1px">${v.registrationNumber}</td>
      <td>${v.ownerName}</td>
      <td style="color:var(--muted)">${v.ownerPhone||'—'}</td>
      <td>${(v.vehicleType||'car').toUpperCase()}</td>
      <td>${v.make} ${v.model}</td>
      <td>${v.state||'Kerala'}</td>
      <td><span class="badge ${v.status==='active'?'b-clear':v.status==='flagged'?'b-med':'b-high'}">${v.status.toUpperCase()}</span></td>
      <td>${v.isVerified?'<span style="color:var(--green)">✅ Yes</span>':'<span style="color:var(--amber)">⚠ No</span>'}</td>
      <td style="display:flex;gap:4px">
        <button class="abtn" onclick="verifyVehicle('${v.id}')">Verify</button>
        <button class="abtn amber" onclick="flagVehicle('${v.id}')">Flag</button>
        <button class="abtn red" onclick="markStolen('${v.id}')">Stolen</button>
      </td>
    </tr>`).join('');
  
  updateStats();
}

function verifyVehicle(id) {
  const vdb = getVehicleDB();
  if(vdb[id]){ vdb[id].isVerified=true; saveVehicleDB(vdb); renderVehicles(); toast('✅ Vehicle RTO verified','success'); addAlert('ok','VEHICLE VERIFIED',vdb[id].registrationNumber+' marked as RTO verified'); }
}
function flagVehicle(id) {
  const vdb = getVehicleDB();
  if(vdb[id]){ vdb[id].status='flagged'; saveVehicleDB(vdb); renderVehicles(); addAlert('warn','VEHICLE FLAGGED',vdb[id].registrationNumber+' flagged for investigation'); addFraudAlert(vdb[id].registrationNumber,'Flagged by officer for investigation','medium','Manual flag by officer'); toast('⚠ Vehicle flagged','warn'); }
}
function markStolen(id) {
  const vdb = getVehicleDB();
  if(vdb[id]){ vdb[id].status='stolen'; saveVehicleDB(vdb); renderVehicles(); addAlert('crit','STOLEN VEHICLE',vdb[id].registrationNumber+' MARKED AS STOLEN — Police alerted!'); addFraudAlert(vdb[id].registrationNumber,'Vehicle reported STOLEN by owner/officer','critical','Owner / Officer report'); toast('🚨 Vehicle marked stolen — Police alerted!','error'); }
}

function adminAddVehicle() {
  const reg=document.getElementById('av-reg').value.trim().toUpperCase();
  const owner=document.getElementById('av-owner').value.trim();
  const phone=document.getElementById('av-phone').value.trim();
  const type=document.getElementById('av-type').value;
  const make=document.getElementById('av-make').value.trim();
  const model=document.getElementById('av-model').value.trim();
  const year=parseInt(document.getElementById('av-year').value)||2023;
  const color=document.getElementById('av-color').value.trim();
  const state=document.getElementById('av-state').value.trim();
  const status=document.getElementById('av-status').value;
  if(!reg||!owner||!phone) { toast('Please fill required fields','error'); return; }
  const vdb = getVehicleDB();
  if(Object.values(vdb).find(v=>v.registrationNumber===reg)) { toast('Vehicle already registered','error'); return; }
  const id='v_'+Date.now();
  vdb[id]={id,ownerId:'admin_'+Date.now(),ownerName:owner,ownerPhone:phone,registrationNumber:reg,vehicleType:type,make,model,year,color,state,status,isVerified:false,registeredAt:new Date().toISOString(),lastLocation:{lat:BASE_LAT+(Math.random()-.5)*.5,lng:BASE_LNG+(Math.random()-.5)*.5,speed:0,timestamp:new Date().toISOString()}};
  saveVehicleDB(vdb);
  renderVehicles();
  closeModal('add-veh-modal');
  toast('✅ Vehicle registered: '+reg,'success');
  addAlert('info','NEW VEHICLE REGISTERED',reg+' — '+owner);
  // Run fraud scan on new vehicle
  setTimeout(()=>runFraudScan(vdb[id]),500);
}

// ═══════════════════════════════════════════════════════════
// AI FRAUD DETECTION
// ═══════════════════════════════════════════════════════════
function runFraudScan(vehicle) {
  const alerts = [];
  let riskScore = 0;
  
  if (KNOWN_STOLEN.includes(vehicle.registrationNumber)) {
    alerts.push({rule:'STOLEN_PLATE_DB',severity:'critical',msg:`${vehicle.registrationNumber} matches stolen vehicle database!`});
    riskScore += 100;
  }
  if (!vehicle.isVerified) {
    alerts.push({rule:'UNVERIFIED',severity:'low',msg:'Vehicle registration not yet verified by RTO.'});
    riskScore += 15;
  }
  if (vehicle.insuranceExpiry && new Date(vehicle.insuranceExpiry) < new Date()) {
    alerts.push({rule:'EXPIRED_INSURANCE',severity:'medium',msg:`Insurance expired on ${vehicle.insuranceExpiry}.`});
    riskScore += 30;
  }
  if (vehicle.pucExpiry && new Date(vehicle.pucExpiry) < new Date()) {
    alerts.push({rule:'EXPIRED_PUC',severity:'medium',msg:`PUC expired on ${vehicle.pucExpiry}.`});
    riskScore += 20;
  }
  if (vehicle.status==='flagged') { alerts.push({rule:'FLAGGED',severity:'high',msg:'Vehicle previously flagged by officer.'}); riskScore+=50; }
  if (vehicle.status==='stolen') { alerts.push({rule:'STOLEN',severity:'critical',msg:'Vehicle reported stolen!'}); riskScore+=100; }
  
  const riskLevel = riskScore>=80?'critical':riskScore>=50?'high':riskScore>=25?'medium':'low';
  if(riskScore>=25) addFraudAlert(vehicle.registrationNumber, alerts.map(a=>a.msg).join(' | '), riskLevel, 'AI Auto-Scan');
  return {riskScore,riskLevel,alerts};
}

function scanVehicle() {
  const reg = document.getElementById('scan-reg-input').value.trim().toUpperCase();
  if(!reg) { toast('Enter a registration number','warn'); return; }
  performScan(reg);
}
function quickScan(reg) {
  document.getElementById('scan-reg-input').value = reg;
  performScan(reg);
}

function performScan(reg) {
  const vdb = getVehicleDB();
  const vehicle = Object.values(vdb).find(v=>v.registrationNumber===reg);
  const panel = document.getElementById('scan-result-panel');
  
  let riskScore=0, riskLevel='low', flags=[], rec='';
  
  if (!vehicle) {
    riskScore=80; riskLevel='high';
    flags=[{severity:'high',msg:`Vehicle ${reg} NOT FOUND in registered database. Possible unregistered or fake registration.`}];
    rec='Stop vehicle for manual verification. Check driver ID, vehicle documents. File report if no valid documentation.';
    if(KNOWN_STOLEN.includes(reg)){riskScore=100;riskLevel='critical';flags.unshift({severity:'critical',msg:`${reg} matches STOLEN vehicle database!`}); rec='IMMEDIATE ACTION: Stop vehicle, detain occupants, contact local police station.';}
  } else {
    const scan=runFraudScan(vehicle);
    riskScore=scan.riskScore; riskLevel=scan.riskLevel;
    flags=scan.alerts.map(a=>({severity:a.rule.includes('EXPIRED')?'medium':a.severity||'low',msg:a.msg}));
    if(flags.length===0) flags=[{severity:'low',msg:'No issues detected. Vehicle appears clean.'}];
    rec = riskScore>=80?'IMMEDIATE ACTION REQUIRED — Detain vehicle':riskScore>=50?'Pull over for document check':riskScore>=25?'Flag for secondary inspection':'Routine monitoring — Vehicle OK';
  }
  
  const colors={critical:'var(--violet)',high:'var(--red)',medium:'var(--amber)',low:'var(--green)'};
  const srClass={critical:'sr-critical',high:'sr-danger',medium:'sr-warn',low:'sr-ok'};
  
  panel.innerHTML=`
    <div class="scan-result show ${srClass[riskLevel]}">
      <div class="sr-title" style="color:${colors[riskLevel]}">
        ${riskLevel==='critical'?'🔴':riskLevel==='high'?'🟠':riskLevel==='medium'?'🟡':'🟢'} 
        ${riskLevel.toUpperCase()} RISK — ${reg}
      </div>
      <div class="sr-grid">
        ${vehicle?`
        <div class="sr-item"><div class="sr-item-l">Owner</div><div class="sr-item-v">${vehicle.ownerName}</div></div>
        <div class="sr-item"><div class="sr-item-l">Phone</div><div class="sr-item-v">${vehicle.ownerPhone||'—'}</div></div>
        <div class="sr-item"><div class="sr-item-l">Vehicle</div><div class="sr-item-v">${vehicle.make} ${vehicle.model} ${vehicle.year}</div></div>
        <div class="sr-item"><div class="sr-item-l">Color</div><div class="sr-item-v">${vehicle.color}</div></div>
        <div class="sr-item"><div class="sr-item-l">Status</div><div class="sr-item-v" style="color:${colors[vehicle.status==='active'?'low':vehicle.status==='flagged'?'medium':'critical']}">${vehicle.status.toUpperCase()}</div></div>
        <div class="sr-item"><div class="sr-item-l">RTO Verified</div><div class="sr-item-v">${vehicle.isVerified?'✅ YES':'⚠ NO'}</div></div>
        `:`
        <div class="sr-item" style="grid-column:span 2"><div class="sr-item-l">Status</div><div class="sr-item-v" style="color:var(--red)">❌ NOT IN DATABASE — UNREGISTERED / FAKE</div></div>
        `}
        <div class="sr-item"><div class="sr-item-l">Risk Score</div><div class="sr-item-v" style="color:${colors[riskLevel]};font-family:Orbitron,monospace;font-size:18px;font-weight:900">${riskScore}/100</div></div>
        <div class="sr-item"><div class="sr-item-l">Risk Level</div><div class="sr-item-v" style="color:${colors[riskLevel]};font-family:Orbitron,monospace;font-weight:700">${riskLevel.toUpperCase()}</div></div>
      </div>
      <div class="sr-flags">
        ${flags.map(f=>`<div class="sr-flag ${f.severity}">⚑ ${f.msg}</div>`).join('')}
      </div>
      <div style="background:rgba(255,26,60,.07);border:1px solid rgba(255,26,60,.2);border-radius:3px;padding:10px;margin-top:10px;font-family:Share Tech Mono,monospace;font-size:10px;line-height:1.6;color:${colors[riskLevel]}">
        <strong>AI RECOMMENDATION:</strong><br/>${rec}
      </div>
      ${riskLevel!=='low'?`<div style="display:flex;gap:8px;margin-top:10px">
        <button class="pa-btn red" style="flex:1;padding:8px" onclick="reportToPolice('${reg}','${riskLevel}')">🚔 REPORT TO POLICE</button>
        <button class="pa-btn amber" style="flex:1;padding:8px" onclick="addFraudAlert('${reg}','Checkpoint scan — Risk: ${riskLevel}','${riskLevel}','Checkpoint Scan')">⚠ ADD FRAUD ALERT</button>
      </div>`:''}
    </div>`;
  
  // Log scan
  const log = getScanLog();
  log.unshift({time:new Date().toTimeString().slice(0,5),reg,risk:riskLevel,result:flags[0]?.msg||'Clear',officer:currentStaff||'ADMIN'});
  if(log.length>20) log.pop();
  saveScanLog(log);
  renderScanLog();
  
  if(riskLevel==='critical'||riskLevel==='high') {
    toast(`🚨 ${riskLevel.toUpperCase()} RISK: ${reg} — Take action!`,'error');
    addAlert('crit','CHECKPOINT SCAN',`${reg} — ${riskLevel.toUpperCase()} RISK detected`);
  }
}

function renderScanLog() {
  const log = getScanLog();
  const tb = document.getElementById('scan-log-body');
  const colors={critical:'var(--violet)',high:'var(--red)',medium:'var(--amber)',low:'var(--green)'};
  tb.innerHTML = log.map(l=>`
    <tr>
      <td style="color:var(--muted)">${l.time}</td>
      <td style="font-family:Orbitron,monospace;font-size:11px;color:var(--cyan)">${l.reg}</td>
      <td><span style="color:${colors[l.risk]};font-family:Share Tech Mono,monospace;font-size:10px">${l.risk.toUpperCase()}</span></td>
      <td style="color:var(--muted);font-size:10px">${l.result.substring(0,40)}...</td>
      <td style="color:var(--muted)">${l.officer.toUpperCase()}</td>
    </tr>`).join('');
}

function reportToPolice(reg, risk) {
  addAlert('crit','🚔 POLICE ALERT',`${reg} — ${risk.toUpperCase()} RISK — Officer dispatched`);
  toast('🚔 Police alert sent for '+reg,'success');
}

// ═══════════════════════════════════════════════════════════
// FRAUD ALERTS
// ═══════════════════════════════════════════════════════════
function addFraudAlert(regNo, reason, riskLevel, reportedBy) {
  const fdb = getFraudDB();
  const id='f_'+Date.now();
  const rec = riskLevel==='critical'?'IMMEDIATE ACTION: Stop vehicle, detain, call police':
              riskLevel==='high'?'Pull over for document check. Escalate if no valid docs.':
              'Flag for secondary inspection. Issue notice if needed.';
  fdb.unshift({id,regNo,reason,riskLevel,reportedBy:reportedBy||'AI System',status:'open',createdAt:new Date().toISOString(),recommendation:rec});
  saveFraudDB(fdb);
  renderFraudAlerts();
  addFraudFeedItem(fdb[0]);
  updateStats();
}

function renderFraudAlerts() {
  const fdb = getFraudDB();
  const el = document.getElementById('fraud-list');
  const colors={critical:'var(--violet)',high:'var(--red)',medium:'var(--amber)',low:'var(--green)'};
  el.innerHTML = fdb.map(f=>`
    <div class="fraud-card ${f.riskLevel}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
        <div>
          <div class="fraud-reg" style="color:${colors[f.riskLevel]}">${f.regNo}</div>
          <div class="fraud-risk">${f.riskLevel.toUpperCase()} RISK · ${f.reportedBy} · ${new Date(f.createdAt).toLocaleTimeString()}</div>
        </div>
        <span class="badge ${f.status==='open'?'b-high':'b-clear'}">${f.status.toUpperCase()}</span>
      </div>
      <div class="fraud-reason">${f.reason}</div>
      <div class="fraud-rec ${f.riskLevel==='critical'?'critical':''}">🤖 AI Rec: ${f.recommendation}</div>
      <div class="pa-actions">
        <button class="pa-btn red" onclick="resolveFraud('${f.id}','investigating')">🔍 INVESTIGATE</button>
        <button class="pa-btn amber" onclick="reportToPolice('${f.regNo}','${f.riskLevel}')">🚔 POLICE ALERT</button>
        <button class="pa-btn green" onclick="resolveFraud('${f.id}','resolved')">✅ RESOLVE</button>
      </div>
    </div>`).join('');
}

function resolveFraud(id, status) {
  const fdb = getFraudDB();
  const f = fdb.find(f=>f.id===id);
  if(f){ f.status=status; saveFraudDB(fdb); renderFraudAlerts(); updateStats(); toast(`Fraud alert ${status}`,'success'); }
}

function addFraudFeedItem(f) {
  const el = document.getElementById('police-fraud-feed');
  if(!el) return;
  const div=document.createElement('div');
  div.className='sos-item';
  const colors={critical:'var(--violet)',high:'var(--red)',medium:'var(--amber)',low:'var(--green)'};
  div.innerHTML=`<div class="si-user" style="color:${colors[f.riskLevel]}">🚨 ${f.regNo} — ${f.riskLevel.toUpperCase()}</div><div class="si-msg">${f.reason}</div><div class="si-time">${new Date(f.createdAt||Date.now()).toLocaleTimeString()}</div>`;
  el.insertBefore(div,el.firstChild);
  while(el.children.length>5) el.removeChild(el.lastChild);
}

function generateRandomFraudAlert() {
  const plates=['MH04XX1234','DL01AB9876','TN09ZZ0011','KL15QR5555','KA03PQ2233'];
  const reasons=['Anomalous speed detected at checkpoint','Number plate mismatch with vehicle model','Owner identity verification failed','Vehicle spotted in restricted zone','Multiple traffic violations recorded'];
  const levels=['critical','high','medium','low'];
  const reg=plates[Math.floor(Math.random()*plates.length)];
  const reason=reasons[Math.floor(Math.random()*reasons.length)];
  const level=levels[Math.floor(Math.random()*levels.length)];
  addFraudAlert(reg,reason,level,'AI ANPR Camera');
  toast(`⚠ New fraud alert: ${reg} — ${level.toUpperCase()}`,'warn');
}

// ═══════════════════════════════════════════════════════════
// ALERTS
// ═══════════════════════════════════════════════════════════
function addAlert(type, title, desc) {
  const el = document.getElementById('alert-panel');
  if(!el) return;
  const t=new Date().toTimeString().slice(0,5);
  const div=document.createElement('div');
  div.className=`alert-c ${type} new`;
  div.innerHTML=`<button class="ac-dismiss" onclick="this.parentNode.remove()">✕</button><div class="ac-time">${t}</div><div class="ac-title">${title}</div><div class="ac-desc">${desc}</div>`;
  el.insertBefore(div,el.firstChild);
  while(el.children.length>10) el.removeChild(el.lastChild);
}

// ═══════════════════════════════════════════════════════════
// DISPATCH
// ═══════════════════════════════════════════════════════════
function doDispatch() {
  const type=document.getElementById('d-type').value;
  const loc=document.getElementById('d-loc').value||'Unknown Location';
  const priority=document.getElementById('d-priority').value;
  const unit=document.getElementById('d-unit').value.split(' — ')[0];
  const route=document.getElementById('d-route').value;
  const hosp=document.getElementById('d-hosp').value;
  const ts=new Date().toTimeString().slice(0,5);
  const newInc={id:'INC-00'+incCounter++,type,location:loc,priority,status:'dispatch',unit,time:ts,lat:BASE_LAT+(Math.random()-.5)*.04,lng:BASE_LNG+(Math.random()-.5)*.04};
  incidents.unshift(newInc);
  renderIncidents();
  addAlert('crit',unit+' DISPATCHED',type+' at '+loc+' via '+route);
  if(hosp!=='None') setTimeout(()=>addAlert('info','HOSPITAL NOTIFIED',hosp+' alerted for incoming patient'),600);
  toast('🚨 '+unit+' dispatched to '+loc,'success');
  const u=UNITS.find(u=>u.id===unit);
  if(u){u.status='active';u.speed=65+Math.floor(Math.random()*30);renderUnitList();}
  if(document.getElementById('set-sig')&&document.getElementById('set-sig').checked) clearAllSig();
  document.getElementById('d-loc').value='';
}

// ═══════════════════════════════════════════════════════════
// COMMS
// ═══════════════════════════════════════════════════════════
function renderComms() {
  const el=document.getElementById('comm-feed');
  el.innerHTML = COMM_MSGS.map(m=>`
    <div class="comm-msg ${m.type}">
      <div class="cm-from" style="color:${m.type==='out'?'var(--cyan)':m.type==='emg'?'var(--red)':'var(--green)'}">${m.from}</div>
      <div class="cm-text">${m.text}</div>
      <div class="cm-time">${m.time}</div>
    </div>`).join('');
}
function sendComm() {
  const inp=document.getElementById('comm-inp');
  if(!inp.value.trim()) return;
  COMM_MSGS.unshift({from:currentStaff?.toUpperCase()||'DISPATCH',text:inp.value,time:new Date().toTimeString().slice(0,5),type:'out'});
  renderComms(); inp.value='';
}

// ═══════════════════════════════════════════════════════════
// CITIZENS / USERS TABLE
// ═══════════════════════════════════════════════════════════
function renderCitizens() {
  const db = getUserDB();
  const vdb = getVehicleDB();
  const tb = document.getElementById('citizens-body');
  const users = Object.values(db);
  
  if(users.length===0) {
    tb.innerHTML=`<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:20px">No registered citizens yet. Citizens register via the Citizen portal.</td></tr>`;
    return;
  }
  
  tb.innerHTML = users.map(u=>{
    const vehs=Object.values(vdb).filter(v=>v.ownerId===u.id);
    return `<tr>
      <td style="font-family:Orbitron,monospace;font-size:10px;color:var(--text)">${u.name}</td>
      <td style="color:var(--cyan)">${u.phone}</td>
      <td style="color:var(--muted)">${u.email||'—'}</td>
      <td style="color:var(--muted)">${u.address||'—'}</td>
      <td style="color:var(--muted)">${new Date(u.registeredAt).toLocaleDateString()}</td>
      <td style="color:var(--amber)">${vehs.length}</td>
      <td style="color:var(--red)">${(u.sosHistory||[]).length}</td>
      <td><span class="badge b-clear">ACTIVE</span></td>
      <td><button class="abtn" onclick="viewUserVehicles('${u.id}')">View Vehicles</button></td>
    </tr>`;
  }).join('');
}

function viewUserVehicles(userId) {
  const vdb = getVehicleDB();
  const vehs = Object.values(vdb).filter(v=>v.ownerId===userId);
  if(vehs.length===0) { toast('No vehicles registered for this user','info'); return; }
  const list = vehs.map(v=>`${v.registrationNumber} (${v.make} ${v.model})`).join(', ');
  toast('Vehicles: '+list,'info');
}

// ═══════════════════════════════════════════════════════════
// LOC BROADCASTS
// ═══════════════════════════════════════════════════════════
function renderLocBroadcasts() {
  const el=document.getElementById('loc-broadcast-panel');
  el.innerHTML=UNITS.slice(0,6).map(u=>`
    <div class="loc-card">
      <div class="lc-unit">${u.icon} ${u.id}</div>
      <div class="lc-coord">📍 ${u.lat.toFixed(4)}, ${u.lng.toFixed(4)}</div>
      <div class="lc-spd">⚡ ${u.speed>0?u.speed+' km/h':'STANDBY'}</div>
      <div class="lc-time">⏱ ${new Date().toTimeString().slice(0,5)}</div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════
let chartsInited=false;
function initCharts() {
  if(chartsInited) return; chartsInited=true;
  const fc='#4a7090',gc='rgba(28,61,96,.5)';
  Chart.defaults.color=fc; Chart.defaults.borderColor=gc;
  new Chart(document.getElementById('ch-hourly'),{type:'line',data:{labels:['00','02','04','06','08','10','12','14','16','18','20','22'],datasets:[{data:[1,0,2,1,5,4,6,8,7,9,6,4],borderColor:'#ff1a3c',backgroundColor:'rgba(255,26,60,.1)',fill:true,tension:.4,pointRadius:3,pointBackgroundColor:'#ff1a3c'}]},options:{plugins:{legend:{display:false}},scales:{x:{grid:{color:gc}},y:{beginAtZero:true,grid:{color:gc}}},responsive:true,maintainAspectRatio:true}});
  new Chart(document.getElementById('ch-pie'),{type:'doughnut',data:{labels:['Medical','Accident','Fire','Crime','Flood'],datasets:[{data:[12,8,5,4,3],backgroundColor:['rgba(255,26,60,.7)','rgba(255,109,0,.7)','rgba(255,234,0,.7)','rgba(41,121,255,.7)','rgba(0,229,255,.7)'],borderColor:'#030b12',borderWidth:2}]},options:{plugins:{legend:{position:'bottom',labels:{font:{size:10}}}},responsive:true,maintainAspectRatio:true}});
  const vdb=getVehicleDB(); const vtypes={car:0,bike:0,truck:0,bus:0,auto:0};
  Object.values(vdb).forEach(v=>{if(vtypes[v.vehicleType]!==undefined)vtypes[v.vehicleType]++;});
  new Chart(document.getElementById('ch-veh'),{type:'bar',data:{labels:['Car','Bike','Truck','Bus','Auto'],datasets:[{data:Object.values(vtypes),backgroundColor:'rgba(57,255,20,.3)',borderColor:'#39ff14',borderWidth:1,borderRadius:3}]},options:{plugins:{legend:{display:false}},scales:{x:{grid:{color:gc}},y:{beginAtZero:true,grid:{color:gc}}},responsive:true,maintainAspectRatio:true}});
  new Chart(document.getElementById('ch-resp'),{type:'bar',data:{labels:['AMB-07','AMB-09','POL-12','POL-14','FIRE-03','FIRE-05'],datasets:[{label:'Avg min',data:[3.2,4.1,2.8,3.9,5.2,4.8],backgroundColor:'rgba(0,229,255,.3)',borderColor:'#00e5ff',borderWidth:1,borderRadius:3}]},options:{plugins:{legend:{display:false}},scales:{x:{grid:{color:gc}},y:{beginAtZero:true,grid:{color:gc}}},responsive:true,maintainAspectRatio:true}});
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════
function switchNav(el,tab) {
  document.querySelectorAll('.nav-i').forEach(n=>n.classList.remove('act'));
  el.classList.add('act'); showTab(tab);
}
function showTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('act'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('act'));
  const tc=document.getElementById('tab-'+tab);
  const tb=document.getElementById('tbtn-'+tab);
  if(tc)tc.classList.add('act');
  if(tb)tb.classList.add('act');
  if(tab==='map') setTimeout(()=>{if(!mapInstance)initMap();else{mapInstance.invalidateSize();renderMapMarkers();}},100);
  if(tab==='analytics') setTimeout(initCharts,100);
  if(tab==='users') renderCitizens();
  if(tab==='vehicles') renderVehicles();
  if(tab==='fraud') renderFraudAlerts();
  if(tab==='scan') renderScanLog();
}

// ═══════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════
function openIncModal() { document.getElementById('inc-modal').classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function addIncFromModal() {
  const type=document.getElementById('m-type').value,priority=document.getElementById('m-priority').value;
  const loc=document.getElementById('m-loc').value||'Unspecified',unit=document.getElementById('m-unit').value;
  const ts=new Date().toTimeString().slice(0,5);
  incidents.unshift({id:'INC-00'+incCounter++,type,location:loc,priority,status:'active',unit,time:ts,lat:BASE_LAT+(Math.random()-.5)*.04,lng:BASE_LNG+(Math.random()-.5)*.04});
  renderIncidents(); closeModal('inc-modal');
  addAlert('crit','NEW INCIDENT — '+unit,type+' at '+loc);
  toast('Incident logged: '+type,'success');
}
document.getElementById('inc-modal').addEventListener('click',function(e){if(e.target===this)closeModal('inc-modal');});
document.getElementById('add-veh-modal').addEventListener('click',function(e){if(e.target===this)closeModal('add-veh-modal');});

// ═══════════════════════════════════════════════════════════
// AUTO SIM
// ═══════════════════════════════════════════════════════════
function startAutoSim() {
  setInterval(()=>{
    const pool=[
      ['info','GPS UPDATE','All units broadcasting live coordinates'],
      ['crit','NEW CALL','Medical emergency — Junction 7 East'],
      ['info','UNIT CLEARED','AMB-09 available for dispatch'],
      ['warn','VEHICLE ALERT','Suspicious vehicle spotted at checkpoint'],
      ['info','HOSPITAL','City General — Trauma bay 2 available'],
    ];
    const r=pool[Math.floor(Math.random()*pool.length)];
    addAlert(r[0],r[1],r[2]);
  },25000);

  setInterval(()=>{
    const v=document.getElementById('st-cleared');
    if(v) v.textContent=parseInt(v.textContent)+Math.floor(Math.random()*2);
  },20000);

  setInterval(renderLocBroadcasts,5000);
  setInterval(renderUnitList,8000);
}

// ═══════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════
function toast(msg,type='info') {
  const icons={success:'✅',error:'❌',info:'ℹ️',warn:'⚠️'};
  const el=document.createElement('div');
  el.className='toast '+type;
  el.innerHTML=`<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  document.getElementById('toast-wrap').appendChild(el);
  setTimeout(()=>{el.style.transition='all .3s';el.style.opacity='0';el.style.transform='translateX(100%)';setTimeout(()=>el.remove(),300);},3500);
}

// ═══════════════════════════════════════════════════════════
// USER DASHBOARD
// ═══════════════════════════════════════════════════════════
function openUserDashboard(user) {
  document.getElementById('user-app').style.display='flex';
  document.getElementById('u-greeting').textContent=user.name;
  document.getElementById('u-name-h').textContent=user.name;
  document.getElementById('u-av').textContent=user.name[0].toUpperCase();
  document.getElementById('u-prof-name').textContent=user.name;
  document.getElementById('u-prof-phone').textContent='📱 '+(user.phone||'—');
  document.getElementById('u-prof-email').textContent='📧 '+(user.email||'Not provided');
  // Show User ID in profile and registration strip
  const uid = user.id || '—';
  if(document.getElementById('u-prof-id')) document.getElementById('u-prof-id').textContent=uid;
  if(document.getElementById('reg-user-id')) document.getElementById('reg-user-id').textContent=uid;
  if(document.getElementById('reg-owner-name')) document.getElementById('reg-owner-name').textContent=user.name;
  if(document.getElementById('u-uid-display')) document.getElementById('u-uid-display').textContent=uid;
  startUserClock();
  initUserMap();
  startGPS();
  renderNearbyUnits();
  renderMyVehicles();
}

function startUserClock() {
  function tick(){const n=new Date();const c=document.getElementById('u-clock');if(c)c.textContent=n.toTimeString().slice(0,8);}
  tick();setInterval(tick,1000);
}

function userLogout() {
  document.getElementById('user-app').style.display='none';
  document.getElementById('portal').style.display='flex';
  currentUser=null;
  if(watchId){navigator.geolocation.clearWatch(watchId);watchId=null;}
}

// ═══════════════════════════════════════════════════════════
// EMERGENCY ACTIONS (USER)
// ═══════════════════════════════════════════════════════════
const EMERGENCY_AI = {
  ambulance:{ action:'🚑 Medical Emergency — Ambulance Dispatched', steps:['Nearest ambulance AMB-07 dispatched (ETA: 4 min)','Hospital City General pre-alerted for incoming','Traffic signals on route auto-cleared','Your location shared with dispatch center'] },
  police:{ action:'🚔 Police Assistance — Officers Dispatched', steps:['Nearest patrol unit POL-12 responding','Police control room notified with your location','Incident registered with reference INC-0'+Math.floor(Math.random()*999),'Officer ETA: 6 minutes via Route Alpha'] },
  fire:{ action:'🚒 Fire Emergency — Fire Brigade Dispatched', steps:['Fire engine FIRE-03 dispatched immediately','Gas supply authority alerted','Evacuation route calculated and shared','Nearest fire station notified: Station B'] },
  accident:{ action:'🚗 Road Accident — Multi-Unit Response', steps:['Ambulance AMB-09 dispatched for casualties','Police POL-14 en route for traffic control','Hospital trauma team on standby','Traffic diversion activated on Ring Road'] },
  sos:{ action:'🆘 SOS Signal — All Services Alerted', steps:['Emergency contacts notified via SMS','Police, Ambulance & Fire control rooms alerted','Your live location shared with all responders','Nearest help: AMB-07 is 1.2km away'] },
  flood:{ action:'🌊 Flood/Disaster — NDRF Team Alerted', steps:['NDRF rescue team notified of your location','Safe evacuation route calculated','Rescue vehicles dispatched from nearest depot','District disaster management alerted'] },
};

function triggerEmergency(type) {
  const ai = EMERGENCY_AI[type] || EMERGENCY_AI.sos;
  const panel = document.getElementById('emer-response-panel');
  panel.style.display = 'block';
  document.getElementById('emer-ai-action').textContent = ai.action;
  document.getElementById('emer-ai-steps').innerHTML = ai.steps.map(s=>`<div class="emer-ai-step">${s}</div>`).join('');
  
  if(userLat&&userLng) {
    document.getElementById('emer-loc-text').textContent = `${userLat.toFixed(5)}, ${userLng.toFixed(5)}`;
  } else {
    document.getElementById('emer-loc-text').textContent = 'Acquiring GPS...';
  }
  
  // Feed to admin SOS panel
  const sosEl = document.getElementById('sos-feed');
  if(sosEl) {
    const div=document.createElement('div');
    div.className='sos-item';
    div.innerHTML=`<div class="si-user">🆘 ${currentUser?.name||'CITIZEN'} — ${type.toUpperCase()}</div><div class="si-msg">${ai.action}</div><div class="si-time">${new Date().toLocaleTimeString()}</div>`;
    sosEl.insertBefore(div,sosEl.firstChild);
    while(sosEl.children.length>6) sosEl.removeChild(sosEl.lastChild);
  }
  
  panel.scrollIntoView({behavior:'smooth'});
  toast('🚨 Emergency services alerted!','success');
  // Auto-dispatch ambulance to user location on any emergency trigger
  if(userLat && userLng) setTimeout(()=>dispatchNearestAmbulance(), 600);
}

function cancelEmergency() {
  document.getElementById('emer-response-panel').style.display='none';
  toast('Emergency alert cancelled','info');
}

function sendUserSOS() {
  const msg = document.getElementById('sos-ta').value.trim();
  if(!msg) { toast('Please describe your emergency','warn'); return; }
  const resp = document.getElementById('u-sos-resp');
  const body = document.getElementById('u-sos-resp-body');
  const loc = userLat ? `${userLat.toFixed(5)}, ${userLng.toFixed(5)}` : 'Location pending';
  body.innerHTML = `Message sent to emergency services.<br/>Your location: ${loc}<br/>Nearest unit: AMB-07 (1.4km away)<br/>Reference: SOS-${Date.now().toString().slice(-6)}`;
  resp.classList.add('act');
  triggerEmergency('sos');
}

function switchSM(m) {
  document.querySelectorAll('.smode').forEach(s=>s.classList.remove('act'));
  document.querySelectorAll('.sos-pane').forEach(p=>p.classList.remove('act'));
  document.getElementById('sm-'+m).classList.add('act');
  document.getElementById('sp-'+m).classList.add('act');
}

function toggleMic() {
  if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){toast('Voice recognition not supported in this browser','error');return;}
  if(!recognition){
    recognition=new(window.SpeechRecognition||window.webkitSpeechRecognition)();
    recognition.continuous=true; recognition.interimResults=true; recognition.lang='en-IN';
    recognition.onresult=e=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;document.getElementById('v-trans').textContent=t;};
    recognition.onend=()=>{isRec=false;document.getElementById('mic-btn').classList.remove('rec');document.getElementById('mic-stat').textContent='Recording stopped. Press send.';};
  }
  if(!isRec){recognition.start();isRec=true;document.getElementById('mic-btn').classList.add('rec');document.getElementById('mic-stat').textContent='🔴 Recording...';}
  else{recognition.stop();isRec=false;}
}

function sendVoiceSOS() {
  const t=document.getElementById('v-trans').textContent;
  if(!t||t.includes('will appear here')){toast('Please record a message first','warn');return;}
  document.getElementById('sos-ta').value=t;
  sendUserSOS();
}

// ═══════════════════════════════════════════════════════════
// CITIZEN MAP — ambulances, hospitals, routes, ETA, traffic
// ═══════════════════════════════════════════════════════════
const HOSPITALS = [
  { id:'H1', name:'City General Hospital',   lat:BASE_LAT+.025, lng:BASE_LNG+.030, icon:'🏥', beds:12 },
  { id:'H2', name:'St. Mary Medical Centre', lat:BASE_LAT-.020, lng:BASE_LNG-.018, icon:'🏥', beds:8  },
  { id:'H3', name:'Central Trauma Centre',   lat:BASE_LAT+.010, lng:BASE_LNG-.035, icon:'🏥', beds:5  },
];

const AMBULANCES = [
  { id:'AMB-07', lat:BASE_LAT+.012, lng:BASE_LNG+.018, status:'standby', speed:0  },
  { id:'AMB-09', lat:BASE_LAT-.008, lng:BASE_LNG-.010, status:'standby', speed:0  },
  { id:'AMB-11', lat:BASE_LAT+.030, lng:BASE_LNG-.005, status:'standby', speed:0  },
  { id:'AMB-14', lat:BASE_LAT-.015, lng:BASE_LNG+.025, status:'standby', speed:0  },
];

const VEHICLES_ON_MAP = [
  { id:'TN38AB1234', lat:BASE_LAT+.005, lng:BASE_LNG+.008, color:'#00e5ff' },
  { id:'KL07CD5678', lat:BASE_LAT-.006, lng:BASE_LNG+.015, color:'#39ff14' },
  { id:'TN01XY9900', lat:BASE_LAT+.018, lng:BASE_LNG-.010, color:'#ffb300' },
];

let ambMarkers = {}, hospMarkers = {}, vehicleMapMarkers = {};
let routeLayer = null, trafficLayers = [];
let dispatchedAmb = null, dispatchedHospital = null;
let userMarker = null, userAccCircle = null;

function initUserMap() {
  if(userMapInstance) return;
  userMapInstance = L.map('u-map', { zoomControl:true, attributionControl:false })
    .setView([BASE_LAT, BASE_LNG], 13);

  // Dark-friendly OSM tile
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19, opacity:0.85
  }).addTo(userMapInstance);
  L.control.scale({ position:'bottomleft', imperial:false }).addTo(userMapInstance);

  // Dark overlay to match UI theme
  const darkPane = document.createElement('style');
  darkPane.textContent = '#u-map .leaflet-tile { filter: brightness(0.7) saturate(0.8) hue-rotate(180deg) invert(1); }';
  document.head.appendChild(darkPane);

  // Render static elements
  renderAmbulancesOnMap();
  renderHospitalsOnMap();
  renderVehiclesOnMap();
  renderTrafficZones();

  // Click on map = set user destination
  userMapInstance.on('click', function(e) {
    placeUserPin(e.latlng.lat, e.latlng.lng, true);
  });
}

function renderAmbulancesOnMap() {
  AMBULANCES.forEach(a => {
    const el = document.createElement('div');
    el.innerHTML = `<div style="background:#ff1a3c;border:2px solid #fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 12px #ff1a3c;cursor:pointer" title="${a.id}">🚑</div><div style="background:rgba(255,26,60,.85);color:#fff;font-family:Orbitron,monospace;font-size:7px;font-weight:700;text-align:center;padding:1px 4px;border-radius:2px;margin-top:2px;white-space:nowrap">${a.id}</div>`;
    const ic = L.divIcon({ className:'', html:el.innerHTML, iconSize:[28,40], iconAnchor:[14,14] });
    ambMarkers[a.id] = L.marker([a.lat, a.lng], { icon:ic })
      .bindPopup(`<b>🚑 ${a.id}</b><br>Status: ${a.status.toUpperCase()}<br>Speed: ${a.speed} km/h<br><button onclick="window.dispatchNearestAmbulance('${a.id}')" style="margin-top:4px;padding:3px 8px;background:#ff1a3c;border:none;color:#fff;cursor:pointer;border-radius:2px;font-size:10px">DISPATCH THIS UNIT</button>`)
      .addTo(userMapInstance);
  });
}

function renderHospitalsOnMap() {
  HOSPITALS.forEach(h => {
    const ic = L.divIcon({ className:'', html:`<div style="background:#2979ff;border:2px solid #fff;border-radius:4px;padding:3px 6px;font-size:10px;font-family:Orbitron,monospace;font-weight:700;color:#fff;white-space:nowrap;box-shadow:0 0 10px #2979ff">🏥 ${h.name.split(' ').slice(0,2).join(' ')}</div>`, iconSize:[140,28], iconAnchor:[70,14] });
    hospMarkers[h.id] = L.marker([h.lat, h.lng], { icon:ic })
      .bindPopup(`<b>${h.icon} ${h.name}</b><br>Available Beds: ${h.beds}<br>24/7 Emergency`)
      .addTo(userMapInstance);
  });
}

function renderVehiclesOnMap() {
  VEHICLES_ON_MAP.forEach(v => {
    const ic = L.divIcon({ className:'', html:`<div style="background:${v.color};border:2px solid #fff;border-radius:3px;padding:2px 5px;font-size:8px;font-family:Orbitron,monospace;font-weight:700;color:#000;white-space:nowrap;box-shadow:0 0 6px ${v.color}">${v.id}</div>`, iconSize:[90,20], iconAnchor:[45,10] });
    vehicleMapMarkers[v.id] = L.marker([v.lat, v.lng], { icon:ic })
      .bindPopup(`<b>🚗 ${v.id}</b><br>Registered Vehicle`)
      .addTo(userMapInstance);
  });
}

function renderTrafficZones() {
  // Simulated traffic hotspot circles
  const zones = [
    { lat:BASE_LAT+.008, lng:BASE_LNG+.012, r:400, color:'#ff1a3c', label:'Heavy' },
    { lat:BASE_LAT-.005, lng:BASE_LNG+.005, r:300, color:'#ffb300', label:'Moderate' },
    { lat:BASE_LAT+.020, lng:BASE_LNG+.002, r:250, color:'#ffb300', label:'Moderate' },
    { lat:BASE_LAT-.012, lng:BASE_LNG-.008, r:200, color:'#39ff14', label:'Clear' },
  ];
  zones.forEach(z => {
    const c = L.circle([z.lat, z.lng], {
      radius:z.r, color:z.color, fillColor:z.color,
      fillOpacity:0.12, weight:1, dashArray:'4 4'
    }).bindTooltip(`🚦 Traffic: ${z.label}`, { permanent:false, direction:'top' })
      .addTo(userMapInstance);
    trafficLayers.push(c);
  });
}

function placeUserPin(lat, lng, fromClick) {
  userLat = lat; userLng = lng;
  const latEl = document.getElementById('gps-lat');
  const lngEl = document.getElementById('gps-lng');
  const locInfo = document.getElementById('u-loc-info');
  const coordStrip = document.getElementById('gps-coord-strip');
  if(latEl) latEl.textContent = lat.toFixed(6);
  if(lngEl) lngEl.textContent = lng.toFixed(6);
  if(locInfo) locInfo.innerHTML = `<span class="pulsing-dot"></span>📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}${fromClick?' (tap-set)':' (GPS)'}`;
  if(coordStrip) coordStrip.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  if(!userMarker) {
    userMarker = L.marker([lat, lng], { icon: L.divIcon({ className:'', html:`<div style="background:#39ff14;border:3px solid #fff;border-radius:50%;width:20px;height:20px;box-shadow:0 0 16px #39ff14;animation:pulse-dot 1.4s infinite"></div><div style="background:rgba(57,255,20,.9);color:#000;font-family:Orbitron,monospace;font-size:7px;font-weight:700;text-align:center;padding:1px 3px;border-radius:2px;margin-top:2px;white-space:nowrap">YOU</div>`, iconSize:[20,30], iconAnchor:[10,10] }) })
      .bindPopup('<b>📍 Your Location</b><br>Tap anywhere to reposition')
      .addTo(userMapInstance);
  } else { userMarker.setLatLng([lat, lng]); }

  if(!userAccCircle) {
    userAccCircle = L.circle([lat, lng], { radius:120, color:'#39ff14', fillColor:'#39ff14', fillOpacity:0.07, weight:1, dashArray:'3' }).addTo(userMapInstance);
  } else { userAccCircle.setLatLng([lat, lng]); }

  // Auto-compute nearest ambulance ETA
  updateETAStrip(lat, lng);
  if(isSharing) sendLocationToAdmin();
}

function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function updateETAStrip(lat, lng) {
  let nearest = null, minDist = 999;
  AMBULANCES.forEach(a => {
    const d = distKm(lat, lng, a.lat, a.lng);
    if(d < minDist) { minDist = d; nearest = a; }
  });
  if(!nearest) return;
  const etaMins = Math.round((minDist / 60) * 60 + 1); // assume 60 km/h avg
  const el = document.getElementById('eta-strip');
  const ambEl = document.getElementById('nearest-amb-strip');
  if(el) el.textContent = etaMins + ' min (' + minDist.toFixed(1) + 'km)';
  if(ambEl) ambEl.textContent = nearest.id;

  // Find nearest hospital to user
  let nearHosp = null, minHospDist = 999;
  HOSPITALS.forEach(h => {
    const d = distKm(lat, lng, h.lat, h.lng);
    if(d < minHospDist) { minHospDist = d; nearHosp = h; }
  });
  if(nearHosp) {
    const hospEta = Math.round((minHospDist / 60) * 60 + 2);
    const hEl = document.getElementById('hosp-eta-strip');
    if(hEl) hEl.textContent = hospEta + ' min — ' + nearHosp.name.split(' ').slice(0,2).join(' ');
  }
}

function dispatchNearestAmbulance(forceId) {
  if(!userLat) {
    toast('📍 Location needed — tap on the map first or wait for GPS','warn');
    return;
  }
  // Find nearest ambulance
  let nearest = null, minDist = 999;
  AMBULANCES.forEach(a => {
    const d = distKm(userLat, userLng, a.lat, a.lng);
    if(d < minDist) { minDist = d; nearest = a; }
  });
  if(forceId) nearest = AMBULANCES.find(a => a.id === forceId) || nearest;
  if(!nearest) return;

  const etaMins = Math.round((minDist / 60) * 60 + 1);
  dispatchedAmb = nearest;

  // Find nearest hospital to user
  let nearHosp = null, minHospDist = 999;
  HOSPITALS.forEach(h => {
    const d = distKm(userLat, userLng, h.lat, h.lng);
    if(d < minHospDist) { minHospDist = d; nearHosp = h; }
  });
  dispatchedHospital = nearHosp;
  const hospEta = nearHosp ? Math.round((distKm(userLat, userLng, nearHosp.lat, nearHosp.lng) / 60) * 60 + etaMins) : '—';

  // Draw route: amb → user → hospital
  if(routeLayer) { routeLayer.forEach(l => userMapInstance.removeLayer(l)); routeLayer = null; }
  const ambToUser = [
    [nearest.lat, nearest.lng],
    [nearest.lat + (userLat - nearest.lat) * 0.5, nearest.lng + (userLng - nearest.lng) * 0.5 + 0.003],
    [userLat, userLng]
  ];
  const userToHosp = nearHosp ? [
    [userLat, userLng],
    [userLat + (nearHosp.lat - userLat) * 0.5 - 0.002, userLng + (nearHosp.lng - userLng) * 0.5],
    [nearHosp.lat, nearHosp.lng]
  ] : null;

  const r1 = L.polyline(ambToUser, { color:'#ff1a3c', weight:4, opacity:0.85, dashArray:'8 4' }).addTo(userMapInstance);
  const r1bg = L.polyline(ambToUser, { color:'#ff000033', weight:10, opacity:0.3 }).addTo(userMapInstance);
  const layers = [r1, r1bg];

  // Animated moving ambulance dot along route
  let step = 0;
  const animAmb = L.circleMarker([nearest.lat, nearest.lng], { radius:7, color:'#ff1a3c', fillColor:'#ff1a3c', fillOpacity:1, weight:2 }).addTo(userMapInstance);
  layers.push(animAmb);
  const totalSteps = 60;
  const animInterval = setInterval(() => {
    step++;
    if(step >= totalSteps) { clearInterval(animInterval); return; }
    const t = step / totalSteps;
    const p0 = ambToUser[0], p1 = ambToUser[1], p2 = ambToUser[2];
    const lat = (1-t)*(1-t)*p0[0] + 2*(1-t)*t*p1[0] + t*t*p2[0];
    const lng = (1-t)*(1-t)*p0[1] + 2*(1-t)*t*p1[1] + t*t*p2[1];
    animAmb.setLatLng([lat, lng]);
  }, (etaMins * 60 * 1000) / totalSteps > 500 ? 500 : (etaMins * 1000) / totalSteps );

  if(userToHosp) {
    const r2 = L.polyline(userToHosp, { color:'#2979ff', weight:4, opacity:0.85, dashArray:'10 4' }).addTo(userMapInstance);
    const r2bg = L.polyline(userToHosp, { color:'#2979ff33', weight:10, opacity:0.3 }).addTo(userMapInstance);
    layers.push(r2, r2bg);
  }

  // Distance markers
  const midAmb = ambToUser[1];
  const distLabel = L.marker(midAmb, { icon: L.divIcon({ className:'', html:`<div style="background:rgba(255,26,60,.9);color:#fff;font-family:Orbitron,monospace;font-size:9px;padding:2px 6px;border-radius:10px;white-space:nowrap;font-weight:700">${etaMins} min · ${minDist.toFixed(1)}km</div>`, iconAnchor:[40,10] }) }).addTo(userMapInstance);
  layers.push(distLabel);

  if(userToHosp && nearHosp) {
    const hospDist = distKm(userLat, userLng, nearHosp.lat, nearHosp.lng);
    const midHosp = userToHosp[1];
    const hospLabel = L.marker(midHosp, { icon: L.divIcon({ className:'', html:`<div style="background:rgba(41,121,255,.9);color:#fff;font-family:Orbitron,monospace;font-size:9px;padding:2px 6px;border-radius:10px;white-space:nowrap;font-weight:700">+${Math.round(hospDist/60*60+2)} min · ${hospDist.toFixed(1)}km to ${nearHosp.name.split(' ')[0]}</div>`, iconAnchor:[60,10] }) }).addTo(userMapInstance);
    layers.push(hospLabel);
  }

  routeLayer = layers;

  // Fit map to route
  const bounds = L.latLngBounds([[nearest.lat, nearest.lng], [userLat, userLng]]);
  if(nearHosp) bounds.extend([nearHosp.lat, nearHosp.lng]);
  userMapInstance.fitBounds(bounds, { padding:[40,40] });

  // Show dispatch cards
  document.getElementById('dispatch-cards-wrap').style.display = 'block';
  document.getElementById('dispatch-cards').innerHTML = `
    <div style="background:rgba(255,26,60,.07);border:1px solid rgba(255,26,60,.35);border-left:3px solid var(--red);border-radius:4px;padding:12px 14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <div style="font-family:Orbitron,monospace;font-size:12px;font-weight:900;color:var(--red);letter-spacing:2px">🚑 ${nearest.id} DISPATCHED</div>
        <div style="font-family:Share Tech Mono,monospace;font-size:9px;padding:2px 8px;border-radius:10px;background:rgba(255,26,60,.2);border:1px solid rgba(255,26,60,.4);color:var(--red)">EN ROUTE</div>
      </div>
      <div style="font-family:Share Tech Mono,monospace;font-size:10px;color:var(--text);line-height:1.7">
        📍 Ambulance Location: ${nearest.lat.toFixed(4)}, ${nearest.lng.toFixed(4)}<br/>
        📍 Your Location: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}<br/>
        🕐 ETA to You: <span style="color:var(--amber);font-weight:700">${etaMins} minutes (${minDist.toFixed(1)} km)</span><br/>
        🏥 Nearest Hospital: <span style="color:var(--cyan)">${nearHosp ? nearHosp.name : '—'}</span><br/>
        🕐 Hospital ETA: <span style="color:var(--green);font-weight:700">${hospEta} min total travel</span><br/>
        🚦 Traffic: <span style="color:var(--amber)">Moderate — Route auto-cleared</span>
      </div>
    </div>
  `;

  // Show route info card
  const routeCard = document.getElementById('route-info-card');
  const routeBody = document.getElementById('route-info-body');
  if(routeCard && routeBody) {
    routeCard.style.display = 'block';
    routeBody.innerHTML = `
      <div style="margin-bottom:6px">🚑 <span style="color:var(--red)">${nearest.id}</span> → <span style="color:var(--cyan)">Your Location</span> → <span style="color:#2979ff">${nearHosp ? nearHosp.name : 'Hospital'}</span></div>
      <div>⏱ Amb → You: <span style="color:var(--amber)">${etaMins} min</span></div>
      <div>⏱ You → Hospital: <span style="color:var(--green)">${hospEta} min total</span></div>
      <div>📏 Distance: <span style="color:var(--cyan)">${minDist.toFixed(1)} km</span></div>
      <div style="margin-top:6px;color:var(--amber)">🚦 Route: Signals auto-cleared</div>
    `;
  }

  // Update ETA strip
  const etaEl = document.getElementById('eta-strip');
  const hospEtaEl = document.getElementById('hosp-eta-strip');
  if(etaEl) etaEl.textContent = etaMins + ' min';
  if(hospEtaEl && nearHosp) hospEtaEl.textContent = hospEta + ' min — ' + nearHosp.name.split(' ').slice(0,2).join(' ');

  toast(`🚑 ${nearest.id} dispatched — ETA ${etaMins} min`, 'success');

  // Simulate ambulance approaching: animate its marker toward user
  nearest.status = 'en-route';
  let prog = 0;
  const moveInt = setInterval(() => {
    prog += 1 / totalSteps;
    if(prog >= 1) { clearInterval(moveInt); nearest.status = 'on-scene'; toast(`🚑 ${nearest.id} arrived at your location!`, 'success'); return; }
    const lat = nearest.lat + (userLat - nearest.lat) * prog;
    const lng = nearest.lng + (userLng - nearest.lng) * prog;
    if(ambMarkers[nearest.id]) ambMarkers[nearest.id].setLatLng([lat, lng]);
  }, (etaMins * 60000) / totalSteps > 3000 ? 3000 : 2000);
}

function startGPS() {
  if(!navigator.geolocation) {
    // Fallback: use BASE_LAT with small random offset
    const lat = BASE_LAT + (Math.random()-.5)*.05;
    const lng = BASE_LNG + (Math.random()-.5)*.05;
    placeUserPin(lat, lng, false);
    const badge = document.getElementById('gps-accuracy-badge');
    if(badge) { badge.textContent='● SIMULATED'; badge.style.color='var(--amber)'; badge.style.borderColor='rgba(255,179,0,.4)'; }
    return;
  }
  watchId = navigator.geolocation.watchPosition(pos => {
    const lat = pos.coords.latitude, lng = pos.coords.longitude;
    const acc = Math.round(pos.coords.accuracy);
    placeUserPin(lat, lng, false);
    const badge = document.getElementById('gps-accuracy-badge');
    if(badge) { badge.textContent=`● GPS LIVE ±${acc}m`; badge.style.color='var(--green)'; badge.style.borderColor='rgba(57,255,20,.5)'; }
  }, err => {
    const lat = BASE_LAT + (Math.random()-.5)*.05;
    const lng = BASE_LNG + (Math.random()-.5)*.05;
    placeUserPin(lat, lng, false);
    const badge = document.getElementById('gps-accuracy-badge');
    if(badge) { badge.textContent='● SIMULATED'; badge.style.color='var(--amber)'; badge.style.borderColor='rgba(255,179,0,.4)'; }
  }, { enableHighAccuracy:true, maximumAge:10000, timeout:15000 });
}

function sendLocationToAdmin() {
  if(!currentUser||!userLat) return;
  // Updates vehicle location in DB if user has a vehicle
  const vdb = getVehicleDB();
  Object.values(vdb).filter(v=>v.ownerId===currentUser.id).forEach(v=>{
    v.lastLocation={lat:userLat,lng:userLng,speed:Math.floor(Math.random()*60),timestamp:new Date().toISOString()};
  });
  saveVehicleDB(vdb);
}

function toggleShareLoc() {
  isSharing=!isSharing;
  const btn=document.getElementById('share-loc-btn');
  btn.classList.toggle('sharing',isSharing);
  btn.textContent=isSharing?'📡 SHARING LIVE — CLICK TO STOP':'📡 SHARE LOCATION WITH EMERGENCY';
  toast(isSharing?'📡 Location sharing started — Emergency services can see you':'Location sharing stopped','info');
  if(isSharing&&userLat) sendLocationToAdmin();
}

function renderNearbyUnits() {
  const el=document.getElementById('nearby-units');
  el.innerHTML=UNITS.slice(0,4).map((u,i)=>`
    <div class="nearby-unit">
      <div class="nu-dist">${(i*0.8+0.6).toFixed(1)}km</div>
      <div class="ni">${u.icon}</div>
      <div class="nu-info">
        <div class="nu-id">${u.id}</div>
        <div class="nu-type">${u.type} · ${u.status.toUpperCase()}</div>
      </div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════
// USER VEHICLE REGISTRATION
// ═══════════════════════════════════════════════════════════
function registerMyVehicle() {
  if(!currentUser) return;
  const reg=document.getElementById('my-veh-reg').value.trim().toUpperCase();
  const type=document.getElementById('my-veh-type').value;
  const make=document.getElementById('my-veh-make').value.trim();
  const model=document.getElementById('my-veh-model').value.trim();
  const year=parseInt(document.getElementById('my-veh-year').value)||2023;
  const color=document.getElementById('my-veh-color').value.trim();
  const insurance=document.getElementById('my-veh-insurance').value;
  const puc=document.getElementById('my-veh-puc').value;
  
  const ok=document.getElementById('my-veh-ok'), err=document.getElementById('my-veh-err');
  const showErr=(msg)=>{err.textContent='⛔ '+msg;err.style.display='block';setTimeout(()=>err.style.display='none',3000);};
  const showOk=(msg)=>{ok.textContent='✅ '+msg;ok.style.display='block';setTimeout(()=>ok.style.display='none',3000);};
  
  if(!reg||reg.length<6) return showErr('Enter a valid registration number');
  if(!make||!model) return showErr('Enter vehicle make and model');
  
  const vdb=getVehicleDB();
  if(Object.values(vdb).find(v=>v.registrationNumber===reg)) return showErr('Vehicle already registered in system');
  
  const id='v_'+Date.now();
  vdb[id]={id,ownerId:currentUser.id,ownerName:currentUser.name,ownerPhone:currentUser.phone,registrationNumber:reg,vehicleType:type,make,model,year,color,state:'Kerala',status:'active',isVerified:false,insuranceExpiry:insurance,pucExpiry:puc,registeredAt:new Date().toISOString(),lastLocation:{lat:userLat||BASE_LAT,lng:userLng||BASE_LNG,speed:0,timestamp:new Date().toISOString()}};
  saveVehicleDB(vdb);
  
  // Run AI fraud scan on new vehicle
  const scanResult = runFraudScan(vdb[id]);
  renderMyVehicles();
  showOk(`${reg} registered! ${scanResult.riskScore>0?`⚠ AI Scan: ${scanResult.riskLevel.toUpperCase()} — ${scanResult.alerts.map(a=>a.msg).join('. ')}`:'✅ AI Scan: Clean'}`);
  
  // Clear fields
  ['my-veh-reg','my-veh-make','my-veh-model','my-veh-year','my-veh-color','my-veh-insurance','my-veh-puc'].forEach(id=>document.getElementById(id).value='');
}

function renderMyVehicles() {
  if(!currentUser) return;
  const vdb=getVehicleDB();
  const myVehs=Object.values(vdb).filter(v=>v.ownerId===currentUser.id);
  const el=document.getElementById('my-vehicles-list');
  if(myVehs.length===0){el.innerHTML='';return;}
  el.innerHTML=`<div style="margin-top:10px;font-family:Orbitron,monospace;font-size:10px;color:var(--muted);letter-spacing:2px">MY REGISTERED VEHICLES</div>`+myVehs.map(v=>`
    <div class="my-veh-card">
      <div>
        <div class="mv-reg">${v.registrationNumber}</div>
        <div class="mv-info">${v.make} ${v.model} ${v.year} · ${v.color} · ${(v.vehicleType||'car').toUpperCase()}</div>
        <div class="mv-info" style="color:${v.isVerified?'var(--green)':'var(--amber)'}">${v.isVerified?'✅ RTO Verified':'⚠ Pending RTO Verification'}</div>
      </div>
      <button class="mv-track-btn" onclick="trackMyVehicle('${v.id}')">📍 TRACK</button>
    </div>`).join('');
}

function trackMyVehicle(id) {
  toast('📍 Vehicle tracking active — Location being updated','success');
  if(userLat&&userLng) sendLocationToAdmin();
}

// ═══════════════════════════════════════════════════════════
// RUN SCAN LOG ON LOAD
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', ()=>{
  renderScanLog();
  updateSMSModeBadge();
});

// Prevent enter in scan input
document.getElementById('scan-reg-input')?.addEventListener('keydown',e=>{if(e.key==='Enter')scanVehicle();});
