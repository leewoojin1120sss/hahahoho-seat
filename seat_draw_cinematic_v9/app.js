(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const COLORS = ['#36e7ff','#ff3bd4','#8b5cff','#b8ff45','#ff8a34','#ffe55d','#52f5a4','#4d7cff','#ff3f5f'];
  const EVENT_POOL = ['drop','slot','laser','cards','rain','glitch','countdown','rgb','lightning','battle','race','dart','spotlight','elimination','pinball','conveyor','meteor','tug','sprint','rocket','penalty','archery','sumo','boat','rps','poker','baseball','dice'];
  const SWAP_POOL = ['cross','portal','orbit','warp'];

  const els = {
    setupView: $('#setupView'), cinemaView: $('#cinemaView'), cinemaStage: $('#cinemaStage'),
    rosterInput: $('#rosterInput'), studentCount: $('#studentCount'), rowInput: $('#rowInput'), colInput: $('#colInput'),
    layoutEditor: $('#layoutEditor'), activeSeatCount: $('#activeSeatCount'), lockStudent: $('#lockStudent'), lockSeat: $('#lockSeat'),
    lockButton: $('#lockButton'), lockList: $('#lockList'), lockCount: $('#lockCount'), launchStudentCount: $('#launchStudentCount'), pairModeToggle: $('#pairModeToggle'), avoidPairHistoryToggle: $('#avoidPairHistoryToggle'), pairHistoryInput: $('#pairHistoryInput'), pairHistoryCount: $('#pairHistoryCount'), pairStatus: $('#pairStatus'), launchPairMode: $('#launchPairMode'),
    launchLockCount: $('#launchLockCount'), startButton: $('#startButton'), setupMessage: $('#setupMessage'), volumeInput: $('#volumeInput'),
    volumeValue: $('#volumeValue'), bgmLibrarySelect: $('#bgmLibrarySelect'), bgmFileInput: $('#bgmFileInput'), bgmPlayButton: $('#bgmPlayButton'), bgmFileName: $('#bgmFileName'), fxCanvas: $('#fxCanvas'), phaseLabel: $('#phaseLabel'), remainingLabel: $('#remainingLabel'),
    cinemaClassroom: $('#cinemaClassroom'), cinemaSeats: $('#cinemaSeats'), eventLayer: $('#eventLayer'), eventEyebrow: $('#eventEyebrow'),
    eventTitle: $('#eventTitle'), eventSub: $('#eventSub'), eventAux: $('#eventAux'), specialBanner: $('#specialBanner'),
    specialTier: $('#specialTier'), specialText: $('#specialText'), seatSpotlight: $('#seatSpotlight'), seatBeam: $('#seatBeam'),
    dropName: $('#dropName'), waveLayer: $('#waveLayer'), numberRain: $('#numberRain'), cardField: $('#cardField'), slotField: $('#slotField'),
    finalDuel: $('#finalDuel'), battleField: $('#battleField'), raceField: $('#raceField'), eliminationField: $('#eliminationField'),
    conveyorField: $('#conveyorField'), rouletteField: $('#rouletteField'), tugField: $('#tugField'), sprintField: $('#sprintField'), rocketField: $('#rocketField'), penaltyField: $('#penaltyField'), swapField: $('#swapField'), pinballOrb: $('#pinballOrb'), finalBadge: $('#finalBadge'), cinemaProgress: $('#cinemaProgress'),
    soundButton: $('#soundButton'), downloadButton: $('#downloadButton'), backButton: $('#backButton'), skipButton: $('#skipButton')
  };

  const state = {
    rows: 6, cols: 5, inactive: new Set(), locks: new Map(), assignment: new Map(),
    running: false, skip: false, soundOn: true, volume: .88, completed: false, pairMode: false, avoidPairHistory: false, pairHistory: new Set(),
    lastEvent: null, eventQueue: [], particles: [], raf: null, currentColor: COLORS[0], swapCount: 0, customBgmName: '', customBgmSrc: '', bgmMode: 'synth'
  };

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, state.skip ? 0 : ms));
  const roster = () => els.rosterInput.value.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
  const seatIds = () => Array.from({length: state.rows * state.cols}, (_, i) => i + 1);
  const activeSeats = () => seatIds().filter(id => !state.inactive.has(id));
  const lockBySeat = () => new Map([...state.locks.entries()].map(([name, seat]) => [seat, name]));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const pad = (n) => String(n).padStart(2, '0');
  const pairKey = (a,b) => [String(a),String(b)].sort((x,y)=>x.localeCompare(y,'ko')).join(' ⟷ ');

  function parsePairHistory() {
    const set=new Set();
    const text=els.pairHistoryInput?els.pairHistoryInput.value:'';
    text.split(/\r?\n/).map(v=>v.trim()).filter(Boolean).forEach(line=>{
      const parts=line.split(/\s*(?:,|\/|\||↔|⇄|&|;|\t)\s*/).map(v=>v.trim()).filter(Boolean);
      if(parts.length>=2 && parts[0]!==parts[1])set.add(pairKey(parts[0],parts[1]));
    });
    state.pairHistory=set;
    if(els.pairHistoryCount)els.pairHistoryCount.textContent=`${set.size} RECORD${set.size===1?'':'S'}`;
    return set;
  }

  function horizontalPairUnits() {
    const pairs=[],singles=[];
    for(let row=1;row<=state.rows;row++){
      for(let col=1;col<=state.cols;col+=2){
        const a=(row-1)*state.cols+col,b=a+1;
        const aa=!state.inactive.has(a),bb=b<=state.rows*state.cols&&!state.inactive.has(b);
        if(aa&&bb)pairs.push([a,b]);
        else if(aa)singles.push(a);
        else if(bb)singles.push(b);
      }
    }
    return {pairs,singles};
  }

  function seatPairMate(id){
    const {col}=seatRC(id);return col%2===1?id+1:id-1;
  }

  function selectedSeatsForPairMode(studentCount) {
    const {pairs,singles}=horizontalPairUnits();
    const locked=new Set(state.locks.values()),selected=new Set();
    const pairUnits=pairs.map(seats=>({seats,size:2,mandatory:seats.some(s=>locked.has(s))}));
    const singleUnits=singles.map(s=>({seats:[s],size:1,mandatory:locked.has(s)}));
    [...pairUnits,...singleUnits].filter(u=>u.mandatory).forEach(u=>u.seats.forEach(s=>selected.add(s)));
    if(selected.size>studentCount)return null;
    let remain=studentCount-selected.size;
    const availableSingles=shuffle(singleUnits.filter(u=>!u.mandatory));
    const availablePairs=shuffle(pairUnits.filter(u=>!u.mandatory));
    if(remain%2===1){
      const one=availableSingles.shift();if(!one)return null;one.seats.forEach(s=>selected.add(s));remain--;
    }
    while(remain>=2&&availablePairs.length){const u=availablePairs.shift();u.seats.forEach(s=>selected.add(s));remain-=2;}
    while(remain>0&&availableSingles.length){const u=availableSingles.shift();u.seats.forEach(s=>selected.add(s));remain--;}
    if(remain!==0)return null;
    return [...selected];
  }

  function pairViolations(assign) {
    if(!state.pairMode||!state.avoidPairHistory||!state.pairHistory.size)return [];
    const out=[];
    for(const [a,b] of horizontalPairUnits().pairs){
      const na=assign.get(a),nb=assign.get(b);if(!na||!nb)continue;
      const key=pairKey(na,nb);if(state.pairHistory.has(key))out.push({a,b,na,nb,key});
    }
    return out;
  }

  const randomBool = () => Math.random() < 0.5;

  function duelOrder(name, opponent) {
    const heroLeft = randomBool();
    return { heroLeft, leftName: heroLeft ? name : opponent, rightName: heroLeft ? opponent : name };
  }

  function duelByRows(name, opponent) {
    const heroTop = randomBool();
    return { heroTop, topName: heroTop ? name : opponent, bottomName: heroTop ? opponent : name };
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function seatRC(id) {
    return { row: Math.floor((id - 1) / state.cols) + 1, col: ((id - 1) % state.cols) + 1 };
  }

  function seatLabel(id) {
    const {row, col} = seatRC(id);
    return `SEAT ${pad(id)}`;
  }

  function seatMini(id) {
    const {row, col} = seatRC(id);
    return `SEAT ${pad(id)}`;
  }

  function colorForName(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return COLORS[h % COLORS.length];
  }

  function syncDimensions() {
    state.rows = clamp(parseInt(els.rowInput.value || '1', 10), 1, 10);
    state.cols = clamp(parseInt(els.colInput.value || '1', 10), 1, 10); if(state.pairMode&&state.cols%2===1)state.cols=Math.min(10,state.cols+1);
    els.rowInput.value = state.rows; els.colInput.value = state.cols;
    const max = state.rows * state.cols;
    for (const id of [...state.inactive]) if (id > max) state.inactive.delete(id);
    for (const [name, seat] of [...state.locks]) if (seat > max || state.inactive.has(seat)) state.locks.delete(name);
    renderAllSetup();
  }

  function renderLayoutEditor() {
    const lockMap = lockBySeat();
    els.layoutEditor.innerHTML = '';
    els.layoutEditor.classList.toggle('pair-layout', state.pairMode);
    els.layoutEditor.style.gridTemplateColumns = state.pairMode
      ? `repeat(${Math.max(1, state.cols / 2)}, minmax(0,1fr))`
      : `repeat(${state.cols}, minmax(0,1fr))`;

    const buildSeatButton = (id, pairSide = '') => {
      const {row,col} = seatRC(id);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'layout-seat';
      b.dataset.seat = id;
      if (pairSide) b.classList.add(`pair-seat-${pairSide}`);
      if (state.inactive.has(id)) b.classList.add('disabled');
      if (lockMap.has(id)) b.classList.add('locked');

      const no = document.createElement('span');
      no.className = 'seat-no';
      no.textContent = seatMini(id);
      const name = document.createElement('span');
      name.className = 'seat-lock-name';
      name.textContent = lockMap.get(id) || '';
      b.append(no, name);

      b.addEventListener('click', () => {
        if (state.running) return;
        if (state.pairMode && row < state.rows) {
          const start = col % 2 === 1 ? id : id - 1;
          const ids = [start, start + 1];
          const allActive = ids.every(s => !state.inactive.has(s));
          ids.forEach(s => {
            const locked = lockBySeat().get(s);
            if (locked) state.locks.delete(locked);
            if (allActive) state.inactive.add(s);
            else state.inactive.delete(s);
          });
        } else {
          const lockedName = lockBySeat().get(id);
          if (lockedName) state.locks.delete(lockedName);
          if (state.inactive.has(id)) state.inactive.delete(id);
          else state.inactive.add(id);
        }
        renderAllSetup();
        audio.ui(460);
      });
      return b;
    };

    if (!state.pairMode) {
      for (const id of seatIds()) els.layoutEditor.appendChild(buildSeatButton(id));
      return;
    }

    let pairNo = 1;
    for (let row = 1; row <= state.rows; row++) {
      for (let col = 1; col <= state.cols; col += 2) {
        const leftId = (row - 1) * state.cols + col;
        const rightId = leftId + 1;
        const leftActive = !state.inactive.has(leftId);
        const rightActive = !state.inactive.has(rightId);

        const frame = document.createElement('div');
        frame.className = 'pair-frame';
        frame.dataset.pair = pairNo;
        if (leftActive && rightActive) frame.classList.add('pair-complete');
        else if (leftActive || rightActive) frame.classList.add('pair-single', leftActive ? 'single-left' : 'single-right');
        else frame.classList.add('pair-disabled');
        if (row === state.rows) frame.classList.add('last-row-pair');

        const badge = document.createElement('span');
        badge.className = 'pair-frame-badge';
        badge.textContent = leftActive && rightActive ? `PAIR ${pad(pairNo)}` : (leftActive || rightActive ? 'SINGLE' : `PAIR ${pad(pairNo)}`);

        const seats = document.createElement('div');
        seats.className = 'pair-frame-seats';
        seats.append(buildSeatButton(leftId, 'left'), buildSeatButton(rightId, 'right'));
        frame.append(badge, seats);
        els.layoutEditor.appendChild(frame);
        pairNo++;
      }
    }
  }

  function renderLockControls() {
    const names = roster();
    els.lockStudent.innerHTML = '';
    names.forEach(name => { const o = document.createElement('option'); o.value = name; o.textContent = name; els.lockStudent.appendChild(o); });
    const usedSeats = new Set(state.locks.values());
    els.lockSeat.innerHTML = '';
    activeSeats().forEach(id => {
      const o = document.createElement('option'); o.value = String(id); o.textContent = `${seatMini(id)}${usedSeats.has(id) ? ' · LOCKED' : ''}`; els.lockSeat.appendChild(o);
    });
    els.lockList.innerHTML = '';
    const entries = [...state.locks.entries()].sort((a,b) => a[1] - b[1]);
    if (!entries.length) {
      const p = document.createElement('span'); p.className = 'microcopy'; p.textContent = 'NO LOCKED SEATS'; els.lockList.appendChild(p);
    } else {
      entries.forEach(([name, seat]) => {
        const chip = document.createElement('div'); chip.className = 'lock-chip';
        const text = document.createElement('span'); text.innerHTML = `<b>${escapeHtml(seatMini(seat))}</b> ${escapeHtml(name)}`;
        const rm = document.createElement('button'); rm.type = 'button'; rm.textContent = '×'; rm.setAttribute('aria-label', `${name} 고정 해제`);
        rm.addEventListener('click', () => { state.locks.delete(name); renderAllSetup(); audio.ui(280); });
        chip.append(text, rm); els.lockList.appendChild(chip);
      });
    }
  }

  function cleanLocksAgainstRoster() {
    const names = new Set(roster());
    for (const [name, seat] of [...state.locks]) {
      if (!names.has(name) || state.inactive.has(seat) || seat > state.rows * state.cols) state.locks.delete(name);
    }
  }

  function renderAllSetup() {
    cleanLocksAgainstRoster();
    const names = roster();
    els.studentCount.textContent = names.length;
    els.launchStudentCount.textContent = names.length;
    els.activeSeatCount.textContent = activeSeats().length;
    els.lockCount.textContent = state.locks.size;
    els.launchLockCount.textContent = state.locks.size;
    renderLayoutEditor(); renderLockControls(); parsePairHistory(); if(els.pairStatus)els.pairStatus.textContent=state.pairMode?'ON':'OFF'; if(els.launchPairMode)els.launchPairMode.textContent=state.pairMode?'ON':'OFF'; if(els.avoidPairHistoryToggle)els.avoidPairHistoryToggle.disabled=!state.pairMode; if(els.pairHistoryInput)els.pairHistoryInput.disabled=!state.pairMode;
  }

  function validateSetup() {
    const names = roster();
    if (names.length < 2) return '학생을 2명 이상 입력하세요.';
    if (new Set(names).size !== names.length) return '학생 이름이 중복되어 있습니다.';
    if (activeSeats().length < names.length) return `사용 가능한 자리가 부족합니다. 현재 ${activeSeats().length}석 / 학생 ${names.length}명입니다.`;
    const seenSeats = new Set();
    for (const [name, seat] of state.locks) {
      if (!names.includes(name)) return `명단에 없는 고정 학생이 있습니다: ${name}`;
      if (state.inactive.has(seat)) return `비활성 자리에 고정된 학생이 있습니다: ${name}`;
      if (seenSeats.has(seat)) return `같은 자리에 두 명 이상 고정되어 있습니다: ${seatMini(seat)}`;
      seenSeats.add(seat);
    }
    if(state.pairMode){
      if(state.cols%2!==0)return 'PAIR MODE에서는 COLUMNS가 짝수여야 합니다.';
      for(let row=1;row<state.rows;row++)for(let col=1;col<=state.cols;col+=2){const a=(row-1)*state.cols+col,b=a+1;if(state.inactive.has(a)!==state.inactive.has(b))return 'PAIR MODE에서는 마지막 줄을 제외하고 가로 두 자리를 함께 사용하거나 함께 제거해야 합니다.';}
      if(!selectedSeatsForPairMode(names.length))return names.length%2===1?'PAIR MODE에서 학생 수가 홀수라면 마지막 줄에 단독 좌석이 하나 이상 필요합니다. 마지막 줄 좌석 하나를 제거해 주세요.':'PAIR MODE 조건으로 학생 수만큼 짝 좌석을 구성할 수 없습니다.';
    }
    parsePairHistory();
    return '';
  }

  function createAssignment() {
    const names = roster(); const seatMap = lockBySeat();
    const unlocked = shuffle(names.filter(n => !state.locks.has(n)));
    const selected=state.pairMode?selectedSeatsForPairMode(names.length):activeSeats().slice(0);
    if(!selected)return new Map();
    const openSeats = shuffle(selected.filter(s => !seatMap.has(s))).slice(0, unlocked.length);
    const result = new Map(); state.locks.forEach((seat, name) => result.set(seat, name));
    unlocked.forEach((name, i) => result.set(openSeats[i], name));
    return result;
  }

  function seatNameSize() {
    const total = state.rows * state.cols;
    if (total <= 30) return 'clamp(30px,2.9vw,58px)';
    if (total <= 42) return 'clamp(24px,2.2vw,44px)';
    if (total <= 64) return 'clamp(16px,1.45vw,28px)';
    return 'clamp(12px,1.05vw,21px)';
  }

  function renderCinemaSeats(revealed = state.assignment, targetSeat = null, justAssigned = null) {
    els.cinemaSeats.innerHTML = '';
    els.cinemaSeats.style.gridTemplateColumns = `repeat(${state.cols}, minmax(0,1fr))`;
    els.cinemaSeats.style.gridTemplateRows = `repeat(${state.rows}, minmax(0,1fr))`;
    els.cinemaSeats.style.setProperty('--seat-name-size', seatNameSize());
    const lockMap = lockBySeat();
    for (const id of seatIds()) {
      const d = document.createElement('div'); d.className = 'cinema-seat'; d.dataset.seat = id;
      if (state.inactive.has(id)) d.classList.add('inactive'); if(state.pairMode){const {col}=seatRC(id);d.classList.add(col%2===1?'pair-left':'pair-right');}
      if (lockMap.has(id)) d.classList.add('locked');
      const person = revealed.get(id) || (lockMap.has(id) ? lockMap.get(id) : '');
      if (revealed.has(id) || lockMap.has(id)) { d.classList.add('assigned'); d.style.setProperty('--seat-color', colorForName(person)); }
      if (targetSeat === id) { d.classList.add('target'); d.style.setProperty('--seat-color', state.currentColor); }
      if (justAssigned === id) d.classList.add('just-assigned');
      const n = document.createElement('span'); n.className = 'n'; n.textContent = state.inactive.has(id) ? '' : seatMini(id);
      const p = document.createElement('span'); p.className = 'person'; p.textContent = person;
      d.append(n,p); els.cinemaSeats.appendChild(d);
    }
  }

  function setEventColor(color) { state.currentColor = color; els.cinemaStage.style.setProperty('--event-color', color); }
  function setEventMode(mode = 'center') { els.eventLayer.classList.remove('center','top','hidden-layer'); els.eventLayer.classList.add(mode); }
  function hideEventLayer() { els.eventLayer.classList.add('hidden-layer'); }
  function setEvent(eyebrow, title, sub = '', aux = '', mode = 'center') {
    setEventMode(mode); els.eventEyebrow.textContent = eyebrow; els.eventTitle.textContent = title; els.eventSub.textContent = sub; els.eventAux.textContent = aux; els.phaseLabel.textContent = eyebrow;
  }
  function setProgress(v) { els.cinemaProgress.style.width = `${clamp(v, 0, 100)}%`; }

  function clearTransient() {
    els.dropName.className = 'drop-name'; els.dropName.textContent = ''; els.dropName.removeAttribute('style');
    els.waveLayer.innerHTML = ''; els.numberRain.innerHTML = '';
    [els.cardField,els.slotField,els.finalDuel,els.battleField,els.raceField,els.eliminationField,els.conveyorField,els.rouletteField,els.tugField,els.sprintField,els.rocketField,els.penaltyField,els.swapField].forEach(el => { el.classList.remove('active-layer'); el.innerHTML = ''; });
    els.pinballOrb.classList.remove('active'); els.seatSpotlight.classList.remove('active'); els.seatBeam.classList.remove('active'); els.specialBanner.hidden = true;
    els.eventTitle.classList.remove('rgb'); els.cinemaStage.classList.remove('glitching','impact','swap-impact'); els.cinemaSeats.classList.remove('targeting');
    els.eventLayer.style.opacity = '';
    document.querySelectorAll('.lightning-flash,.seat-projectile,.swap-ghost,.swap-portal').forEach(n => n.remove());
  }

  function getSeatPoint(id) {
    const seat = els.cinemaSeats.querySelector(`[data-seat="${id}"]`); if (!seat) return null;
    const sr = seat.getBoundingClientRect(), rr = els.cinemaStage.getBoundingClientRect();
    return { x: sr.left - rr.left + sr.width / 2, y: sr.top - rr.top + sr.height / 2, nx: (sr.left - rr.left + sr.width / 2) / rr.width, ny: (sr.top - rr.top + sr.height / 2) / rr.height };
  }

  function spotlightAtSeat(id, persistent = false) {
    const p = getSeatPoint(id); if (!p) return;
    els.seatSpotlight.style.left = `${p.x}px`; els.seatSpotlight.style.top = `${p.y}px`; els.seatBeam.style.left = `${p.x}px`;
    els.seatSpotlight.classList.remove('active'); els.seatBeam.classList.remove('active'); void els.seatSpotlight.offsetWidth;
    els.seatSpotlight.classList.add('active'); els.seatBeam.classList.add('active');
    if (!persistent) setTimeout(() => { els.seatSpotlight.classList.remove('active'); els.seatBeam.classList.remove('active'); }, 1200);
  }

  function impactWaves(nx = .5, ny = .5, count = 3, spacing = 85) {
    for (let i = 0; i < count; i++) setTimeout(() => {
      const w = document.createElement('i'); w.className = 'wave'; w.style.left = `${nx * 100}%`; w.style.top = `${ny * 100}%`; els.waveLayer.appendChild(w); setTimeout(() => w.remove(), 1300);
    }, i * spacing);
  }

  function screenImpact() { els.cinemaStage.classList.remove('impact'); void els.cinemaStage.offsetWidth; els.cinemaStage.classList.add('impact'); }
  function seatPulse(id) { const s = els.cinemaSeats.querySelector(`[data-seat="${id}"]`); if (!s) return; s.classList.remove('scan-hit'); void s.offsetWidth; s.classList.add('scan-hit'); }

  function nextEvent() {
    if (!state.eventQueue.length) state.eventQueue = shuffle(EVENT_POOL);
    let ev = state.eventQueue.shift();
    if (ev === state.lastEvent && state.eventQueue.length) { state.eventQueue.push(ev); ev = state.eventQueue.shift(); }
    state.lastEvent = ev; return ev;
  }

  function rarity() {
    const r = Math.random();
    if (r < .025) return {tier:'ULTRA EVENT',text:'CINEMATIC OVERDRIVE',color:'#ffffff',delay:1700};
    if (r < .11) return {tier:'SUPER EVENT',text:'SYSTEM OVERDRIVE',color:'#ffe55d',delay:1250};
    if (r < .30) return {tier:'RARE EVENT',text:'SPECIAL DRAW',color:'#ff3bd4',delay:850};
    return null;
  }

  async function showSpecial() {
    const sp = rarity(); if (!sp || state.skip) return;
    const prev = state.currentColor; setEventColor(sp.color); els.specialTier.textContent = ''; els.specialText.textContent = sp.tier; els.specialBanner.hidden = false;
    audio.special(sp.tier); particlesBurst(.5,.25,50,sp.color,1.35); fireworks(3,sp.color); await wait(sp.delay); els.specialBanner.hidden = true; setEventColor(prev);
  }

  async function introSequence(names) {
    clearTransient(); setEventColor('#36e7ff');
    setEvent('SYSTEM BOOT','INITIALIZING'); setProgress(3); audio.boot(); await wait(1350);
    setEvent('CLASSROOM CHECK',`${activeSeats().length} ACTIVE SEATS`); setProgress(7); audio.scan(); await wait(1150);
    setEvent('VERIFYING ROSTER',`${names.length} STUDENTS`,'',`${state.locks.size} LOCKED // ${names.length - state.locks.size} RANDOMIZED`); setProgress(10); audio.confirm(); await wait(1350);
    if (state.locks.size) {
      for (const [name, seat] of [...state.locks.entries()].sort((a,b) => a[1]-b[1])) {
        if (state.skip) break;
        setEventColor('#ffe55d'); renderCinemaSeats(new Map(), seat); els.cinemaSeats.classList.add('targeting'); spotlightAtSeat(seat);
        setEvent('LOCKED SEAT', name, seatLabel(seat), '', 'top'); audio.lock(); const p = getSeatPoint(seat); if (p) particlesBurst(p.nx,p.ny,35,'#ffe55d',.8); await wait(900);
      }
    }
    renderCinemaSeats(new Map());
    await globalShuffle('PRIMARY SHUFFLE', names, 6200);
    await preliminaryAssignment(names);
    await globalShuffle('SECONDARY SHUFFLE', names, 4200);
  }

  async function globalShuffle(label, names, duration) {
    clearTransient(); setEventColor(pick(COLORS)); setEvent(label,'SHUFFLING');
    els.cinemaStage.classList.add('glitching'); audio.shuffleStart(); const start = performance.now(); let i = 0;
    while (!state.skip && performance.now() - start < duration) {
      const n = pick(names), s = pick(activeSeats()); els.eventTitle.textContent = i % 2 ? n : seatMini(s); els.eventAux.textContent = `${Math.min(99,Math.floor((performance.now()-start)/duration*100))}%`;
      if (i % 2 === 0) seatPulse(s); if (i % 4 === 0) particlesBurst(Math.random(),Math.random(),4,pick(COLORS),.35); audio.tick(340+(i%9)*42,.018); i++; await wait(88);
    }
    els.cinemaStage.classList.remove('glitching'); setEvent(label,'SHUFFLE COMPLETE'); audio.confirm(); particlesBurst(.5,.5,55,state.currentColor,1.1); await wait(700);
  }

  async function preliminaryAssignment(names) {
    clearTransient(); setEventColor('#8b5cff'); setEvent('PRELIMINARY DRAW','TEST ASSIGNMENT');
    const temp = new Map(); const lockMap = lockBySeat(); state.locks.forEach((seat,name)=>temp.set(seat,name));
    const poolNames = shuffle(names.filter(n=>!state.locks.has(n))), poolSeats = shuffle(activeSeats().filter(s=>!lockMap.has(s)));
    for (let i=0;i<poolNames.length;i++) { temp.set(poolSeats[i],poolNames[i]); if (i%2===0) { renderCinemaSeats(temp,poolSeats[i]); audio.tick(480+i*3,.01); await wait(52); } }
    renderCinemaSeats(temp); await wait(1050); setEventColor('#ff3f5f'); setEvent('PRELIMINARY DRAW','DISCARDED');
    audio.error(); els.cinemaStage.classList.add('glitching'); particlesBurst(.5,.5,90,'#ff3f5f',1.55); await wait(1300); els.cinemaStage.classList.remove('glitching'); renderCinemaSeats(new Map());
  }

  async function drawEvent(type, name, seat, availableSeats, studentPool, remaining, index, total) {
    clearTransient(); setEventColor(colorForName(name)); els.remainingLabel.textContent = `${remaining} REMAINING`; await showSpecial(); if (state.skip) return;
    switch(type) {
      case 'drop': await eventDrop(name,seat); break;
      case 'slot': await eventSlot(name,seat,availableSeats); break;
      case 'laser': await eventLaser(name,seat,availableSeats); break;
      case 'cards': await eventCards(name,seat,availableSeats); break;
      case 'rain': await eventRain(name,seat,availableSeats); break;
      case 'glitch': await eventGlitch(name,seat,availableSeats); break;
      case 'countdown': await eventCountdown(name,seat); break;
      case 'rgb': await eventRgb(name,seat,availableSeats); break;
      case 'lightning': await eventLightning(name,seat); break;
      case 'battle': await eventBattle(name,seat,availableSeats,studentPool); break;
      case 'race': await eventRace(name,seat,availableSeats,studentPool); break;
      case 'dart': await eventDart(name,seat,availableSeats); break;
      case 'spotlight': await eventSpotlight(name,seat,availableSeats); break;
      case 'elimination': await eventElimination(name,seat,availableSeats); break;
      case 'pinball': await eventPinball(name,seat,availableSeats); break;
      case 'conveyor': await eventConveyor(name,seat,availableSeats); break;
      case 'meteor': await eventMeteor(name,seat,availableSeats); break;
      case 'tug': await eventTug(name,seat,availableSeats,studentPool); break;
      case 'sprint': await eventSprint(name,seat,availableSeats,studentPool); break;
      case 'rocket': await eventRocket(name,seat,availableSeats,studentPool); break;
      case 'penalty': await eventPenalty(name,seat,availableSeats,studentPool); break;
      case 'archery': await eventArchery(name,seat,availableSeats,studentPool); break;
      case 'sumo': await eventSumo(name,seat,availableSeats,studentPool); break;
      case 'boat': await eventBoat(name,seat,availableSeats,studentPool); break;
      case 'rps': await eventRps(name,seat,availableSeats,studentPool); break;
      case 'poker': await eventPoker(name,seat,availableSeats,studentPool); break;
      case 'baseball': await eventBaseball(name,seat,availableSeats,studentPool); break;
      case 'dice': await eventDice(name,seat,availableSeats,studentPool); break;
      default: await eventDrop(name,seat);
    }
    setProgress(20 + ((index + 1) / total) * 72);
  }

  async function eventDrop(name, seat) {
    setEvent('IMPACT DROP',name); hideEventLayer();
    els.dropName.textContent=name; els.dropName.className='drop-name fall-center name-only'; audio.whoosh(); await wait(720); screenImpact(); impactWaves(.5,.5,5,74); particlesBurst(.5,.5,145,state.currentColor,1.8); fireworks(4,state.currentColor); audio.impact();
    await wait(620); setEvent('TARGET LOCK',name,seatLabel(seat),'','top'); await wait(540);
  }

  async function eventSlot(name, seat, pool) {
    setEvent('SEAT SLOT',name); hideEventLayer();
    const machine=document.createElement('div'); machine.className='slot-machine'; machine.innerHTML='<div class="slot-caption">SEAT SLOT</div>';
    const win=document.createElement('div'); win.className='slot-window'; const num=document.createElement('div'); num.className='slot-number'; win.appendChild(num); machine.appendChild(win); els.slotField.appendChild(machine); els.slotField.classList.add('active-layer');
    const start=performance.now(); let i=0; audio.spin();
    while(!state.skip && performance.now()-start<3100){num.textContent=seatMini(pick(pool));audio.tick(250+(i%7)*58,.019);i++;await wait(Math.min(210,58+i*4));}
    num.textContent=seatMini(seat);audio.brake();await wait(520);screenImpact();particlesBurst(.5,.5,90,state.currentColor,1.25);impactWaves(.5,.5,3,90);audio.impact();
    els.slotField.classList.remove('active-layer');setEvent('SEAT SLOT',name,seatLabel(seat),'','top');await wait(560);
  }

  async function eventLaser(name, seat, pool) {
    setEvent('LASER SCAN',name,'','','top');els.cinemaClassroom.classList.add('focus');audio.scan();
    const scans=shuffle(pool).slice(0,Math.min(24,pool.length));
    for(const s of scans){seatPulse(s);spotlightAtSeat(s);audio.tick(570+(s%6)*45,.015);await wait(105);}
    renderCinemaSeats(new Map(),seat);els.cinemaSeats.classList.add('targeting');spotlightAtSeat(seat,true);for(let i=0;i<5;i++){seatPulse(seat);await wait(135+i*26);}audio.lock();await wait(430);
    setEvent('TARGET LOCK',name,seatLabel(seat),'','top');screenImpact();await wait(560);els.cinemaClassroom.classList.remove('focus');
  }

  async function eventCards(name, seat, pool) {
    setEvent('CARD SHUFFLE',name);hideEventLayer();
    let candidates=shuffle([...new Set(pool)]).slice(0,Math.min(7,pool.length));if(!candidates.includes(seat)){if(candidates.length)candidates[candidates.length-1]=seat;else candidates.push(seat);}candidates=shuffle(candidates);
    const stack=document.createElement('div');stack.className='card-stack card-stack-v8';
    const cards=candidates.map((n,i)=>{const c=document.createElement('div');c.className='draw-card draw-card-v8';c.textContent='?';c.dataset.seat=n;c.style.setProperty('--home-x',`${(i-(candidates.length-1)/2)*8.4}vw`);c.style.setProperty('--r',`${(i-(candidates.length-1)/2)*2.2}deg`);stack.appendChild(c);return c;});
    els.cardField.appendChild(stack);els.cardField.classList.add('active-layer');audio.shuffleStart();await wait(500);
    for(let r=0;r<6;r++){cards.forEach(c=>{c.style.setProperty('--shuffle-x',`${(Math.random()-.5)*34}vw`);c.style.setProperty('--shuffle-y',`${(Math.random()-.5)*24}vh`);c.style.setProperty('--r',`${(Math.random()-.5)*34}deg`)});await wait(330);}cards.forEach(c=>{c.style.setProperty('--shuffle-x','0px');c.style.setProperty('--shuffle-y','0px')});await wait(500);
    const chosen=cards.find(c=>Number(c.dataset.seat)===seat)||cards[0];cards.filter(c=>c!==chosen).forEach(c=>c.classList.add('card-discard-v8'));await wait(380);chosen.textContent=seatMini(seat);chosen.classList.add('card-chosen-v8');audio.lock();fireworks(4,state.currentColor);screenImpact();await wait(1200);
    els.cardField.classList.remove('active-layer');setEvent('CARD REVEAL',name,seatLabel(seat),'','top');await wait(560);
  }

  async function eventRain(name, seat, pool) {
    setEvent('SEAT STORM',name);els.eventLayer.style.opacity='.18';audio.wind();
    for(let i=0;i<90;i++){const d=document.createElement('span');d.className='rain-number';d.textContent=seatMini(pick(pool));d.style.left=`${Math.random()*95}%`;d.style.setProperty('--dur',`${.85+Math.random()*1.7}s`);d.style.animationDelay=`${Math.random()*.8}s`;els.numberRain.appendChild(d);}
    await wait(2700);els.numberRain.innerHTML='';setEvent('SEAT STORM',name,seatLabel(seat),'','top');audio.impact();impactWaves(.5,.5,4,85);particlesBurst(.5,.5,115,state.currentColor,1.45);screenImpact();await wait(620);
  }

  async function eventGlitch(name, seat, pool) {
    setEvent('GLITCH DRAW',name);els.cinemaStage.classList.add('glitching');audio.glitch();
    for(let i=0;i<21;i++){els.eventTitle.textContent=i%2?name.split('').map(ch=>Math.random()<.22?'#':ch).join(''):seatMini(pick(pool)).replace(/\d/g,()=>Math.floor(Math.random()*9));await wait(100)}
    els.cinemaStage.classList.remove('glitching');setEvent('DATA RESTORED',name,seatLabel(seat),'','top');audio.confirm();particlesBurst(.5,.5,85,state.currentColor,1.05);await wait(620);
  }

  async function eventCountdown(name, seat) {
    setEvent('COUNTDOWN',name);audio.warning();await wait(440);
    for(const n of ['3','2','1']){els.eventTitle.textContent=n;audio.countdown(Number(n));particlesBurst(.5,.5,18,state.currentColor,.55);await wait(680)}els.eventTitle.textContent='0';screenImpact();impactWaves(.5,.5,6,60);particlesBurst(.5,.5,180,state.currentColor,2);fireworks(7,state.currentColor);audio.explosion();await wait(520);
    setEvent('RESULT',name,seatLabel(seat),'','top');await wait(600);
  }

  async function eventRgb(name, seat, pool) {
    setEvent('RGB SPLIT',name);els.eventTitle.classList.add('rgb');audio.glitch();
    for(let i=0;i<15;i++){els.eventSub.textContent=`R ${seatMini(pick(pool))}  //  G ${seatMini(pick(pool))}  //  B ${seatMini(pick(pool))}`;await wait(135)}
    els.eventTitle.classList.remove('rgb');screenImpact();impactWaves(.5,.5,4,90);particlesBurst(.5,.5,105,state.currentColor,1.4);setEvent('RGB MERGED',name,seatLabel(seat),'','top');audio.impact();await wait(620);
  }

  async function eventLightning(name, seat) {
    setEvent('BLACKOUT',name);els.eventLayer.style.opacity='.1';audio.powerDown();await wait(900);
    const flash=document.createElement('div');flash.className='lightning-flash';els.cinemaStage.appendChild(flash);audio.lightning();await wait(680);flash.remove();setEvent('POWER RESTORED',name,seatLabel(seat),'','top');particlesBurst(.5,.5,125,'#ffffff',1.55);screenImpact();audio.impact();await wait(650);
  }

  async function eventBattle(name, seat, pool, studentPool) {
    const opponents=studentPool.filter(n=>n!==name); if(!opponents.length){await eventLaser(name,seat,pool);return;}
    const opponent=pick(opponents), duel=duelOrder(name,opponent), heroColor=colorForName(name), oppColor=colorForName(opponent); setEventColor(heroColor); setEvent('BATTLE EVENT','FIGHT'); hideEventLayer();
    const fighter=(n,c,side)=>{const d=document.createElement('div');d.className=`fighter-card fighter-${side}`;d.style.setProperty('--fighter-color',c);d.innerHTML=`<div class="fighter-tag">${side==='left'?'PLAYER 1':'PLAYER 2'}</div><div class="fighter-avatar"><i class="head"></i><i class="body"></i><i class="arm a1"></i><i class="arm a2"></i><i class="leg l1"></i><i class="leg l2"></i></div><div class="fighter-name">${escapeHtml(n)}</div><div class="hp-readout"><span>HP</span><b>100</b></div><div class="hp"><i></i></div>`;return d;};
    const left=fighter(duel.leftName,colorForName(duel.leftName),'left'), right=fighter(duel.rightName,colorForName(duel.rightName),'right'), vs=document.createElement('div'); vs.className='battle-vs'; vs.textContent='VS'; els.battleField.append(left,vs,right); els.battleField.classList.add('active-layer'); audio.battleStart(); await wait(1500);
    const heroCard=duel.heroLeft?left:right, oppCard=duel.heroLeft?right:left;
    let hpHero=100,hpOpp=100; const heroBar=heroCard.querySelector('.hp i'),oppBar=oppCard.querySelector('.hp i'),heroNum=heroCard.querySelector('.hp-readout b'),oppNum=oppCard.querySelector('.hp-readout b');
    const strike=async(attacker,defender,color,nx)=>{attacker.classList.add('attack');defender.classList.add('hit');audio.hit();particlesBurst(nx,.48,30,color,.72);screenImpact();await wait(640);attacker.classList.remove('attack');defender.classList.remove('hit');await wait(340);};
    for(let round=0;round<6;round++){
      const dmgOpp=11+Math.floor(Math.random()*8); hpOpp=Math.max(round===5?6:18,hpOpp-dmgOpp); oppBar.style.width=`${hpOpp}%`;oppNum.textContent=hpOpp;await strike(heroCard,oppCard,heroColor,duel.heroLeft?.68:.32);
      if(round<5){const dmgHero=7+Math.floor(Math.random()*7); hpHero=Math.max(36,hpHero-dmgHero); heroBar.style.width=`${hpHero}%`;heroNum.textContent=hpHero;await strike(oppCard,heroCard,oppColor,duel.heroLeft?.32:.68);}
    }
    heroCard.classList.add('finisher'); await wait(650); hpOpp=0;oppBar.style.width='0%';oppNum.textContent='0';oppCard.classList.add('knockout');audio.explosion();particlesBurst(duel.heroLeft?.68:.32,.48,150,heroColor,1.8);impactWaves(duel.heroLeft?.68:.32,.48,5,70);screenImpact();await wait(1200);heroCard.classList.add('winner');fireworks(5,heroColor);audio.victorySting();await wait(1200);els.battleField.classList.remove('active-layer');
    setEvent('WINNER',name);await wait(700);for(const s of shuffle(pool).slice(0,Math.min(10,pool.length))){seatPulse(s);await wait(120)}setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventRace(name, seat, pool, studentPool) {
    const others=shuffle(studentPool.filter(n=>n!==name)).slice(0,3);const racers=shuffle([name,...others]);if(racers.length<2){await eventPinball(name,seat,pool);return;}
    setEvent('HORSE RACE','RACE');hideEventLayer();const title=document.createElement('div');title.className='race-title';title.textContent='GRAND SEAT DERBY';els.raceField.appendChild(title);
    const laneData=racers.map((r,idx)=>{const lane=document.createElement('div');lane.className='race-lane';lane.style.setProperty('--racer-color',colorForName(r));lane.innerHTML=`<div class="race-lane-no">${idx+1}</div><div class="race-track"><i class="finish-line"></i><i class="race-start-line"></i></div><div class="horse"><span class="horse-icon">🐎</span><b>${escapeHtml(r)}</b></div>`;els.raceField.appendChild(lane);return{r,lane,horse:lane.querySelector('.horse'),p:8};});
    els.raceField.classList.add('active-layer');audio.raceStart();await wait(1000);for(const n of [3,2,1]){title.textContent=String(n);audio.countdown(n);await wait(720)}title.textContent='GO!';audio.explosion();await wait(450);
    for(let step=0;step<48;step++){
      for(const x of laneData){let inc=.9+Math.random()*1.15;if(x.r===name&&step>33)inc+=.38;x.p=Math.min(x.p+inc,x.r===name?90:89);x.horse.style.left=`${x.p}%`;}
      if(step%3===0)audio.tick(245+step*6,.021);if(step===17||step===31){particlesBurst(.52,.78,44,pick(COLORS),.48);audio.whoosh();}await wait(185);
    }
    const winner=laneData.find(x=>x.r===name);title.textContent='FINAL SPRINT';winner.horse.style.transition='left 1.2s cubic-bezier(.12,.72,.12,1)';winner.horse.style.left='97%';audio.finalRise();await wait(1250);winner.lane.classList.add('winner','finish-crossed');audio.victorySting();fireworks(6,colorForName(name));await wait(1500);els.raceField.classList.remove('active-layer');setEvent('WINNER',name);await wait(700);for(const s of shuffle(pool).slice(0,Math.min(9,pool.length))){seatPulse(s);await wait(115)}setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventSpotlight(name, seat, pool) {
    setEvent('SPOTLIGHT DRAW',name,'','','top');els.cinemaSeats.classList.add('targeting');audio.wind();
    const candidates=shuffle(pool).slice(0,Math.min(12,pool.length));if(!candidates.includes(seat))candidates.push(seat);
    for(const s of candidates){renderCinemaSeats(new Map(),s);els.cinemaSeats.classList.add('targeting');spotlightAtSeat(s,true);audio.tick(450+(s%8)*40,.016);await wait(180);}
    renderCinemaSeats(new Map(),seat);els.cinemaSeats.classList.add('targeting');spotlightAtSeat(seat,true);audio.lock();screenImpact();await wait(650);setEvent('SPOTLIGHT LOCK',name,seatLabel(seat),'','top');await wait(560);
  }

  async function eventElimination(name, seat, pool) {
    setEvent('SEAT SURVIVAL',name);hideEventLayer();const candidates=shuffle(pool).slice(0,Math.min(8,pool.length));if(!candidates.includes(seat))candidates[candidates.length-1]=seat;
    const title=document.createElement('div');title.className='elim-title';title.textContent='SEAT SURVIVAL';const grid=document.createElement('div');grid.className='elim-grid';
    const cards=candidates.map(s=>{const c=document.createElement('div');c.className='elim-card';c.dataset.seat=s;c.textContent=seatMini(s);grid.appendChild(c);return c;});els.eliminationField.append(title,grid);els.eliminationField.classList.add('active-layer');await wait(700);
    for(const c of shuffle(cards.filter(c=>Number(c.dataset.seat)!==seat))){c.classList.add('out');audio.eliminate();particlesBurst(.5,.5,12,'#ff3f5f',.35);await wait(420)}const win=cards.find(c=>Number(c.dataset.seat)===seat);win.classList.add('winner');audio.lock();fireworks(4,state.currentColor);screenImpact();await wait(850);els.eliminationField.classList.remove('active-layer');setEvent('SURVIVOR',name,seatLabel(seat),'','top');await wait(560);
  }

  async function eventPinball(name, seat, pool) {
    setEvent('PINBALL',name,'','','top');els.cinemaClassroom.classList.add('focus');els.pinballOrb.classList.add('active');audio.pinball();
    const path=shuffle(pool).slice(0,Math.min(18,pool.length));if(!path.includes(seat))path.push(seat);
    for(const s of path){const p=getSeatPoint(s);if(p){els.pinballOrb.style.left=`${p.x}px`;els.pinballOrb.style.top=`${p.y}px`;seatPulse(s);audio.tick(580+(s%7)*52,.018);particlesBurst(p.nx,p.ny,6,state.currentColor,.3);}await wait(150)}
    const p=getSeatPoint(seat);if(p){els.pinballOrb.style.left=`${p.x}px`;els.pinballOrb.style.top=`${p.y}px`;particlesBurst(p.nx,p.ny,85,state.currentColor,1.2);impactWaves(p.nx,p.ny,4,75);}audio.impact();screenImpact();await wait(620);els.pinballOrb.classList.remove('active');els.cinemaClassroom.classList.remove('focus');setEvent('PINBALL LOCK',name,seatLabel(seat),'','top');await wait(560);
  }

  async function eventConveyor(name, seat, pool) {
    setEvent('SEAT CONVEYOR',name);hideEventLayer();const candidates=shuffle(pool).slice(0,Math.min(9,pool.length));if(!candidates.includes(seat))candidates[Math.floor(candidates.length/2)]=seat;
    const track=document.createElement('div');track.className='conveyor-track';els.conveyorField.appendChild(track);els.conveyorField.classList.add('active-layer');audio.spin();
    for(let cycle=0;cycle<14;cycle++){track.innerHTML='';const cycleSeats=shuffle(candidates);cycleSeats.slice(0,5).forEach(s=>{const c=document.createElement('div');c.className='destination-card';c.textContent=seatMini(s);track.appendChild(c)});track.style.transform=`translateX(${(cycle%2?-1:1)*Math.random()*140}px)`;audio.tick(300+cycle*25,.016);await wait(190+cycle*10)}
    track.innerHTML='';const target=document.createElement('div');target.className='destination-card target-destination';target.textContent=seatLabel(seat);track.appendChild(target);track.style.transform='translateX(0)';audio.brake();screenImpact();await wait(820);els.conveyorField.classList.remove('active-layer');setEvent('CONVEYOR LOCK',name,seatLabel(seat),'','top');await wait(560);
  }

  async function eventMeteor(name, seat, pool) {
    setEvent('METEOR DROP',name);hideEventLayer();els.dropName.textContent=name;els.dropName.className='drop-name meteor name-only';audio.whoosh();await wait(1050);screenImpact();particlesBurst(.5,.5,135,state.currentColor,1.7);impactWaves(.5,.5,5,70);audio.impact();await wait(520);
    setEvent('TARGET SEARCH',name,'','','top');for(const s of shuffle(pool).slice(0,Math.min(11,pool.length))){seatPulse(s);audio.tick(420+(s%6)*46,.014);await wait(110)}setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(560);
  }


  async function eventDart(name, seat, pool) {
    setEvent('DART DRAW',name);hideEventLayer();
    let candidates=shuffle([...new Set(pool)]).slice(0,Math.min(10,pool.length));
    if(!candidates.includes(seat)){if(candidates.length)candidates[candidates.length-1]=seat;else candidates=[seat];}
    candidates=shuffle(candidates);
    const n=candidates.length,targetIndex=candidates.indexOf(seat);
    const shell=document.createElement('div');shell.className='dart-shell';
    const board=document.createElement('div');board.className='dart-board';
    board.style.background=`conic-gradient(${candidates.map((_,i)=>{const a=i*360/n,b=(i+1)*360/n;const c=i%4===0?'#991e29':i%4===2?'#1b7041':i%2?'#e8e0c8':'#15151a';return `${c} ${a}deg ${b}deg`;}).join(',')})`;
    const labels=[];
    candidates.forEach((snum,i)=>{const lab=document.createElement('div');lab.className='dart-label';const a=(i+.5)*360/n;lab.style.transform=`rotate(${a}deg)`;lab.innerHTML=`<span style="transform:translateX(-50%) rotate(${-a}deg)">${seatMini(snum)}</span>`;board.appendChild(lab);labels.push(lab);});
    const bull=document.createElement('div');bull.className='dart-bull';bull.textContent=name;board.appendChild(bull);
    const caption=document.createElement('div');caption.className='dart-caption';caption.textContent='ONE DART // ONE SEAT';shell.append(board,caption);els.rouletteField.appendChild(shell);els.rouletteField.classList.add('active-layer');audio.warning();await wait(1100);

    // Compute the target from the ACTUAL rendered board, not from the surrounding shell.
    const sr=shell.getBoundingClientRect(), br=board.getBoundingClientRect();
    const cx=br.left-sr.left+br.width/2, cy=br.top-sr.top+br.height/2;
    const sectorAngle=(targetIndex+.5)*Math.PI*2/n-Math.PI/2;
    const hitRadius=br.width*.365;
    const tx=cx+Math.cos(sectorAngle)*hitRadius, ty=cy+Math.sin(sectorAngle)*hitRadius;
    const dart=document.createElement('div');dart.className='flying-dart final-dart';dart.innerHTML='<i></i><b></b>';shell.appendChild(dart);
    const startX=sr.width+155,startY=sr.height*(.22+Math.random()*.50);const flightAngle=Math.atan2(ty-startY,tx-startX)*180/Math.PI;
    dart.style.left=`${startX}px`;dart.style.top=`${startY}px`;dart.style.transform=`translate(-100%,-50%) rotate(${flightAngle}deg)`;dart.style.opacity='1';await wait(360);audio.whoosh();
    try{await dart.animate([{left:`${startX}px`,top:`${startY}px`,transform:`translate(-100%,-50%) rotate(${flightAngle}deg) scale(1.05)`},{left:`${tx}px`,top:`${ty}px`,transform:`translate(-100%,-50%) rotate(${flightAngle}deg) scale(.92)`}],{duration:1200,easing:'cubic-bezier(.12,.78,.12,1)',fill:'forwards'}).finished;}catch(_){dart.style.left=`${tx}px`;dart.style.top=`${ty}px`;await wait(1200);}
    dart.style.left=`${tx}px`;dart.style.top=`${ty}px`;dart.style.transform=`translate(-100%,-50%) rotate(${flightAngle}deg) scale(.92)`;
    labels[targetIndex].classList.add('target-hit');board.classList.add('bull-hit');audio.hit();
    const hitNx=clamp((br.left-sr.left+br.width/2+Math.cos(sectorAngle)*hitRadius)/sr.width,0,1),hitNy=clamp((br.top-sr.top+br.height/2+Math.sin(sectorAngle)*hitRadius)/sr.height,0,1);
    particlesBurst(hitNx,hitNy,110,state.currentColor,1.35);impactWaves(hitNx,hitNy,4,80);fireworks(4,state.currentColor);screenImpact();await wait(1250);els.rouletteField.classList.remove('active-layer');setEvent('DART HIT',name,seatLabel(seat),'','top');await wait(650);
  }

  async function eventTug(name, seat, pool, studentPool) {
    const opponents=studentPool.filter(n=>n!==name);if(!opponents.length){await eventBattle(name,seat,pool,studentPool);return;}const opponent=pick(opponents), duel=duelOrder(name,opponent), heroLeft=duel.heroLeft;setEvent('TUG OF WAR','VS');hideEventLayer();
    const wrap=document.createElement('div');wrap.className='tug-arena tug-v5';wrap.style.setProperty('--left-color',colorForName(duel.leftName));wrap.style.setProperty('--right-color',colorForName(duel.rightName));wrap.innerHTML=`<div class="tug-ground"></div><div class="tug-center-line"></div><div class="tug-player left"><div class="tug-human"><i class="head"></i><i class="body"></i><i class="arm a1"></i><i class="arm a2"></i><i class="leg l1"></i><i class="leg l2"></i></div><strong>${escapeHtml(duel.leftName)}</strong></div><div class="tug-player right"><div class="tug-human"><i class="head"></i><i class="body"></i><i class="arm a1"></i><i class="arm a2"></i><i class="leg l1"></i><i class="leg l2"></i></div><strong>${escapeHtml(duel.rightName)}</strong></div><div class="tug-rope"><span class="rope-knot">◆</span><i class="rope-flag"></i></div>`;els.tugField.appendChild(wrap);els.tugField.classList.add('active-layer');audio.battleStart();await wait(1200);for(const n of [3,2,1]){wrap.dataset.count=n;audio.countdown(n);await wait(720)}wrap.dataset.count='';
    const rope=wrap.querySelector('.tug-rope'),left=wrap.querySelector('.tug-player.left'),right=wrap.querySelector('.tug-player.right');let pull=0, sign=heroLeft?-1:1;
    for(let i=0;i<28;i++){const late=i>18;const target=late?sign*(20+(i-18)*11):Math.sin(i*1.16)*26+(Math.random()-.5)*12;pull+=(target-pull)*.62;rope.style.transform=`translate(-50%,-50%) translateX(${pull}px)`;left.style.transform=`translate(-50%,-50%) translateX(${clamp(pull*.25,-30,30)}px) rotate(${clamp(-6-pull*.03,-20,16)}deg)`;right.style.transform=`translate(50%,-50%) translateX(${clamp(pull*.25,-30,30)}px) rotate(${clamp(6-pull*.03,-16,20)}deg)`;audio.tick(170+i*9,.019);if(i%6===0)particlesBurst(.5,.58,14,pick(COLORS),.28);await wait(285);} 
    if(heroLeft){wrap.classList.add('left-wins');rope.style.transform='translate(-50%,-50%) translateX(-145px)';right.style.transform='translate(18%,-44%) rotate(-20deg)';}else{wrap.classList.add('right-wins');rope.style.transform='translate(-50%,-50%) translateX(145px)';left.style.transform='translate(-118%,-44%) rotate(20deg)';}
    audio.explosion();screenImpact();particlesBurst(heroLeft?.36:.64,.53,135,colorForName(name),1.6);fireworks(5,colorForName(name));await wait(1500);els.tugField.classList.remove('active-layer');setEvent('WINNER',name);await wait(700);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventSprint(name, seat, pool, studentPool) {
    const others=shuffle(studentPool.filter(n=>n!==name)).slice(0,3);const runners=shuffle([name,...others]);if(runners.length<2){await eventRace(name,seat,pool,studentPool);return;}setEvent('SPRINT','100M');hideEventLayer();
    const title=document.createElement('div');title.className='sprint-title';title.textContent='100M SPRINT';els.sprintField.appendChild(title);const data=runners.map((r,i)=>{const lane=document.createElement('div');lane.className='sprint-lane';lane.style.setProperty('--runner-color',colorForName(r));lane.innerHTML=`<span class="lane-id">${i+1}</span><div class="runner"><span class="runner-person"><i class="r-head"></i><i class="r-body"></i><i class="r-arm a"></i><i class="r-arm b"></i><i class="r-leg a"></i><i class="r-leg b"></i></span><b>${escapeHtml(r)}</b></div><i class="sprint-finish"></i>`;els.sprintField.appendChild(lane);return{r,runner:lane.querySelector('.runner'),p:6,lane};});els.sprintField.classList.add('active-layer');audio.raceStart();await wait(900);for(const n of [3,2,1]){title.textContent=String(n);audio.countdown(n);await wait(680)}title.textContent='GO!';audio.explosion();await wait(350);
    for(let step=0;step<46;step++){for(const x of data){let inc=1+Math.random()*1.15;if(x.r===name&&step>32)inc+=.35;x.p=Math.min(x.p+inc,x.r===name?89:88);x.runner.style.left=`${x.p}%`;}if(step%2===0)audio.tick(285+step*6,.018);await wait(180);}const w=data.find(x=>x.r===name);title.textContent='PHOTO FINISH';w.runner.style.transition='left 1.05s cubic-bezier(.12,.72,.12,1)';w.runner.style.left='96%';await wait(1100);w.lane.classList.add('winner','finish-crossed');audio.victorySting();fireworks(5,colorForName(name));await wait(1400);els.sprintField.classList.remove('active-layer');setEvent('WINNER',name);await wait(700);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventRocket(name, seat, pool, studentPool) {
    const others=shuffle(studentPool.filter(n=>n!==name)).slice(0,3);const racers=shuffle([name,...others]);if(racers.length<2){await eventMeteor(name,seat,pool);return;}setEvent('ROCKET RACE','LAUNCH');hideEventLayer();
    const sky=document.createElement('div');sky.className='rocket-sky';sky.innerHTML='<i class="rocket-finish"></i><strong class="rocket-title">ROCKET RACE</strong>';els.rocketField.appendChild(sky);const data=racers.map((r,i)=>{const rocket=document.createElement('div');rocket.className='rocket-racer';rocket.style.setProperty('--rocket-color',colorForName(r));rocket.style.left=`${14+i*(72/Math.max(1,racers.length-1))}%`;rocket.innerHTML=`<b>${escapeHtml(r)}</b><span>▲</span><i></i>`;sky.appendChild(rocket);return{r,rocket,p:5};});els.rocketField.classList.add('active-layer');const rocketTitle=sky.querySelector('.rocket-title');audio.warning();await wait(800);for(const n of [3,2,1]){rocketTitle.textContent=String(n);audio.countdown(n);await wait(670)}rocketTitle.textContent='LAUNCH!';audio.explosion();particlesBurst(.5,.82,110,null,1.35);await wait(350);rocketTitle.textContent='';
    for(let step=0;step<44;step++){for(const x of data){let inc=.9+Math.random()*1.05;if(x.r===name&&step>31)inc+=.36;x.p=Math.min(x.p+inc,x.r===name?75:72);x.rocket.style.bottom=`${x.p}%`;}if(step%3===0)audio.whoosh();await wait(185);}const w=data.find(x=>x.r===name);w.rocket.style.transition='bottom 1.2s cubic-bezier(.12,.72,.12,1)';w.rocket.style.bottom='86%';audio.finalRise();await wait(1250);w.rocket.classList.add('winner','finish-crossed');audio.victorySting();fireworks(7,colorForName(name));await wait(1450);els.rocketField.classList.remove('active-layer');setEvent('WINNER',name);await wait(700);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventPenalty(name, seat, pool, studentPool) {
    const opponents=studentPool.filter(n=>n!==name);const opponent=opponents.length?pick(opponents):'RIVAL';const duel=duelOrder(name,opponent);setEvent('PENALTY SHOOTOUT','SHOOTOUT');hideEventLayer();
    const leftName=duel.leftName,rightName=duel.rightName,heroLeft=duel.heroLeft;
    const arena=document.createElement('div');arena.className='penalty-arena pk-v8';arena.innerHTML=`<div class="pk-scoreboard"><div class="pk-team left"><strong>${escapeHtml(leftName)}</strong><div class="pk-shots"></div></div><div class="pk-score"><b>0</b><span>:</span><b>0</b><small>5 KICKS</small></div><div class="pk-team right"><strong>${escapeHtml(rightName)}</strong><div class="pk-shots"></div></div></div><div class="penalty-goal"><div class="penalty-net"></div><div class="penalty-keeper-v5"></div></div><div class="penalty-kicker"><span class="shooter-figure"></span><b></b></div><div class="penalty-ball-v5">●</div><div class="penalty-call">READY</div>`;els.penaltyField.appendChild(arena);els.penaltyField.classList.add('active-layer');audio.warning();await wait(1000);
    const scoreNums=arena.querySelectorAll('.pk-score b'),shots=[...arena.querySelectorAll('.pk-shots')],kicker=arena.querySelector('.penalty-kicker'),kickerName=kicker.querySelector('b'),ball=arena.querySelector('.penalty-ball-v5'),keeper=arena.querySelector('.penalty-keeper-v5'),call=arena.querySelector('.penalty-call');
    const heroSeq=['goal','goal','save','goal','goal'],oppSeq=['goal','save','goal','miss','goal'];const leftSeq=heroLeft?heroSeq:oppSeq,rightSeq=heroLeft?oppSeq:heroSeq;let leftDone=[],rightDone=[],ls=0,rs=0;
    const token=o=>`<span class="pk-shot ${o||''}">${o==='goal'?'✓':o==='save'?'S':o==='miss'?'×':''}</span>`;
    const paint=()=>{shots[0].innerHTML=Array.from({length:5},(_,i)=>token(leftDone[i]||'' )).join('');shots[1].innerHTML=Array.from({length:5},(_,i)=>token(rightDone[i]||'' )).join('');scoreNums[0].textContent=ls;scoreNums[1].textContent=rs;};paint();
    const shotPoint=o=>o==='goal'?pick([[37,30],[63,30],[41,48],[59,48],[50,28]]):o==='save'?pick([[43,42],[57,42],[48,48],[52,48]]):pick([[16,30],[84,30],[50,12]]);
    const kick=async(player,outcome)=>{kickerName.textContent=player;kicker.style.setProperty('--kick-color',colorForName(player));call.textContent=player;ball.style.transition='none';ball.style.left='50%';ball.style.top='82%';ball.style.opacity='1';ball.style.transform='translate(-50%,-50%) scale(1)';keeper.style.transition='none';keeper.style.transform='translateX(-50%)';await wait(380);const[tx,ty]=shotPoint(outcome);let keeperShift=0;if(outcome==='save')keeperShift=(tx-50)*2.55;else if(outcome==='goal')keeperShift=tx<50?80:-80;else keeperShift=Math.random()<.5?-70:70;keeper.style.transition='transform .62s cubic-bezier(.2,.8,.2,1)';keeper.style.transform=`translateX(calc(-50% + ${keeperShift}px)) rotate(${keeperShift<0?-27:27}deg)`;ball.style.transition='left .78s cubic-bezier(.16,.78,.18,1), top .78s cubic-bezier(.16,.78,.18,1), transform .78s linear';audio.whoosh();ball.style.left=`${tx}%`;ball.style.top=`${ty}%`;ball.style.transform='translate(-50%,-50%) scale(.72)';await wait(800);if(outcome==='goal'){call.textContent='GOAL';arena.classList.add('net-hit');audio.explosion();particlesBurst(.5,.36,46,colorForName(player),.62);}else if(outcome==='save'){call.textContent='SAVED';arena.classList.add('saved-shot');audio.hit();particlesBurst(tx/100,ty/100,24,'#ffe55d',.4);}else{call.textContent='MISS';audio.error();particlesBurst(tx/100,ty/100,18,'#ff3f5f',.3);}await wait(600);arena.classList.remove('net-hit','saved-shot');ball.style.opacity='0';};
    for(let i=0;i<5;i++){await kick(leftName,leftSeq[i]);leftDone.push(leftSeq[i]);if(leftSeq[i]==='goal')ls++;paint();await wait(300);await kick(rightName,rightSeq[i]);rightDone.push(rightSeq[i]);if(rightSeq[i]==='goal')rs++;paint();await wait(380);}call.textContent='WINNER';arena.classList.add(heroLeft?'left-winner':'right-winner');audio.victorySting();fireworks(6,colorForName(name));screenImpact();await wait(1450);els.penaltyField.classList.remove('active-layer');setEvent('WINNER',name);await wait(650);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventArchery(name, seat, pool, studentPool) {
    const opponents=studentPool.filter(n=>n!==name);const opponent=opponents.length?pick(opponents):'RIVAL';const duel=duelByRows(name,opponent);setEvent('ARCHERY DUEL','BEST OF 3');hideEventLayer();
    const makeRow=(player,cls)=>`<div class="archery-row ${cls}" style="--archer-color:${colorForName(player)}"><strong>${escapeHtml(player)}</strong><div class="archery-range"><span class="archery-bow">)</span><div class="archery-board-v5"><i></i><i></i><i></i><i></i><b></b></div></div><em class="archery-total">0</em></div>`;
    const arena=document.createElement('div');arena.className='archery-arena-v5';arena.innerHTML=`<div class="archery-head">ARCHERY DUEL <span>3 ARROWS EACH</span></div>${makeRow(duel.topName,'a')}${makeRow(duel.bottomName,'b')}`;els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');await wait(1050);
    const heroTop=duel.heroTop, heroRow=arena.querySelector(heroTop?'.archery-row.a':'.archery-row.b'), oppRow=arena.querySelector(heroTop?'.archery-row.b':'.archery-row.a');
    const heroShots=[{score:10,x:50,y:50},{score:9,x:58,y:44},{score:10,x:47,y:53}], oppShots=[{score:8,x:66,y:40},{score:9,x:43,y:61},{score:8,x:60,y:56}]; let totalHero=0,totalOpp=0;
    const shoot=async(row,shot)=>{row.classList.add('shooting');const range=row.querySelector('.archery-range'),target=row.querySelector('.archery-board-v5');const arrow=document.createElement('span');arrow.className='archery-arrow-v5';arrow.style.top='66%';range.appendChild(arrow);audio.whoosh();await wait(120);arrow.classList.add('fired');arrow.style.setProperty('--hit-y',`${shot.y}%`);await wait(760);audio.hit();const mark=document.createElement('span');mark.className='archery-mark';mark.style.left=`${shot.x}%`;mark.style.top=`${shot.y}%`;target.appendChild(mark);const popup=document.createElement('span');popup.className='archery-score-pop';popup.textContent=`${shot.score}`;popup.style.left=`${shot.x}%`;popup.style.top=`${shot.y}%`;target.appendChild(popup);particlesBurst(.5,row.classList.contains('a')?.36:.66,18,colorForName(row.querySelector('strong').textContent),.35);row.classList.remove('shooting');await wait(560);};
    for(let r=0;r<3;r++){await shoot(heroRow,heroShots[r]);totalHero+=heroShots[r].score;heroRow.querySelector('.archery-total').textContent=totalHero;await wait(280);await shoot(oppRow,oppShots[r]);totalOpp+=oppShots[r].score;oppRow.querySelector('.archery-total').textContent=totalOpp;await wait(420);} heroRow.classList.add('winner');audio.victorySting();fireworks(5,colorForName(name));await wait(1400);els.cardField.classList.remove('active-layer');setEvent('WINNER',name);await wait(650);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventSumo(name, seat, pool, studentPool) {
    const opponents=studentPool.filter(n=>n!==name);const opponent=opponents.length?pick(opponents):'RIVAL';const duel=duelOrder(name,opponent);setEvent('SUMO CLASH','VS');hideEventLayer();const arena=document.createElement('div');arena.className='sumo-arena';arena.innerHTML=`<div class="sumo-ring"></div><div class="sumo fighter-a"><span style="background:${colorForName(duel.leftName)};box-shadow:0 0 35px ${colorForName(duel.leftName)}"></span><strong>${escapeHtml(duel.leftName)}</strong></div><div class="sumo fighter-b"><span style="background:${colorForName(duel.rightName)};box-shadow:0 0 35px ${colorForName(duel.rightName)}"></span><strong>${escapeHtml(duel.rightName)}</strong></div>`;els.eliminationField.appendChild(arena);els.eliminationField.classList.add('active-layer');await wait(1000);for(let i=0;i<8;i++){arena.classList.toggle('clash');audio.hit();particlesBurst(.5,.55,22,pick(COLORS),.35);screenImpact();await wait(620);arena.classList.toggle('clash');await wait(350);}arena.classList.add(duel.heroLeft?'winner-a':'winner-b');audio.explosion();fireworks(5,colorForName(name));await wait(1300);els.eliminationField.classList.remove('active-layer');setEvent('WINNER',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventBoat(name, seat, pool, studentPool) {
    const others=shuffle(studentPool.filter(n=>n!==name)).slice(0,2),racers=shuffle([name,...others]);if(racers.length<2){await eventRace(name,seat,pool,studentPool);return;}setEvent('BOAT RACE','FINAL REGATTA');hideEventLayer();const sea=document.createElement('div');sea.className='boat-arena';sea.innerHTML='<strong class="boat-title">FINAL REGATTA</strong>';const data=racers.map((r,i)=>{const lane=document.createElement('div');lane.className='boat-lane';lane.style.setProperty('--boat-color',colorForName(r));lane.innerHTML=`<i class="boat-finish"></i><div class="boat"><span class="boat-graphic"><i class="mast"></i><i class="sail"></i><i class="hull"></i><i class="wake"></i></span><b>${escapeHtml(r)}</b></div>`;sea.appendChild(lane);return{r,lane,boat:lane.querySelector('.boat'),p:7};});els.raceField.appendChild(sea);els.raceField.classList.add('active-layer');const boatTitle=sea.querySelector('.boat-title');await wait(950);for(const n of [3,2,1]){boatTitle.textContent=String(n);audio.countdown(n);await wait(680)}boatTitle.textContent='GO!';audio.explosion();await wait(350);boatTitle.textContent='';
    for(let step=0;step<46;step++){for(const x of data){let inc=.95+Math.random()*1.15;if(x.r===name&&step>32)inc+=.34;x.p=Math.min(x.p+inc,x.r===name?89:88);x.boat.style.left=`${x.p}%`;}if(step%3===0)audio.whoosh();await wait(185);}const win=data.find(x=>x.r===name);win.boat.style.transition='left 1.15s cubic-bezier(.12,.72,.12,1)';win.boat.style.left='96%';await wait(1200);win.lane.classList.add('winner','finish-crossed');fireworks(5,colorForName(name));audio.victorySting();await wait(1450);els.raceField.classList.remove('active-layer');setEvent('WINNER',name);await wait(700);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventRps(name, seat, pool, studentPool) {
    const opponents=studentPool.filter(n=>n!==name);if(!opponents.length){await eventCards(name,seat,pool);return;}const opponent=pick(opponents), duel=duelOrder(name,opponent);setEvent('ROCK PAPER SCISSORS','BEST OF 3');hideEventLayer();
    const arena=document.createElement('div');arena.className='rps-arena';arena.innerHTML=`<div class="rps-player left" style="--rps-color:${colorForName(duel.leftName)}"><strong>${escapeHtml(duel.leftName)}</strong><span class="rps-hand">✊</span><b class="rps-score">0</b></div><div class="rps-center"><em>VS</em><span>ROUND 1</span></div><div class="rps-player right" style="--rps-color:${colorForName(duel.rightName)}"><strong>${escapeHtml(duel.rightName)}</strong><span class="rps-hand">✊</span><b class="rps-score">0</b></div>`;els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');await wait(1000);
    const lp=arena.querySelector('.rps-player.left'),rp=arena.querySelector('.rps-player.right'),lh=lp.querySelector('.rps-hand'),rh=rp.querySelector('.rps-hand'),ls=lp.querySelector('.rps-score'),rs=rp.querySelector('.rps-score'),roundLabel=arena.querySelector('.rps-center span');
    const rounds=[{hero:'✊',opp:'✌',heroWin:true},{hero:'✌',opp:'✋',heroWin:false},{hero:'✋',opp:'✊',heroWin:true}];let leftScore=0,rightScore=0;
    for(let i=0;i<rounds.length;i++){roundLabel.textContent=`ROUND ${i+1}`;for(let shake=0;shake<4;shake++){lh.textContent='✊';rh.textContent='✊';lp.classList.toggle('shake');rp.classList.toggle('shake');audio.tick(220+shake*35,.022);await wait(260);}const heroHand=rounds[i].hero,oppHand=rounds[i].opp,leftHand=duel.heroLeft?heroHand:oppHand,rightHand=duel.heroLeft?oppHand:heroHand;lh.textContent=leftHand;rh.textContent=rightHand;audio.hit();const heroWins=rounds[i].heroWin;const leftWins=duel.heroLeft?heroWins:!heroWins;if(leftWins){leftScore++;lp.classList.add('round-win');}else{rightScore++;rp.classList.add('round-win');}ls.textContent=leftScore;rs.textContent=rightScore;await wait(1050);lp.classList.remove('round-win','shake');rp.classList.remove('round-win','shake');}
    roundLabel.textContent='WINNER';(duel.heroLeft?lp:rp).classList.add('winner');audio.victorySting();fireworks(5,colorForName(name));await wait(1350);els.cardField.classList.remove('active-layer');setEvent('WINNER',name);await wait(650);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventPoker(name, seat, pool, studentPool) {
    const opponents=studentPool.filter(n=>n!==name);if(!opponents.length){await eventCards(name,seat,pool);return;}const opponent=pick(opponents),duel=duelByRows(name,opponent);setEvent('POKER SHOWDOWN','HEADS-UP');hideEventLayer();
    const templates=[
      {hero:[['A','♠'],['A','♥']],opp:[['K','♠'],['K','♥']],board:[['2','♣'],['5','♦'],['8','♥'],['J','♠'],['Q','♣']],heroName:'PAIR OF ACES',oppName:'PAIR OF KINGS'},
      {hero:[['A','♠'],['Q','♠']],opp:[['K','♦'],['K','♣']],board:[['A','♦'],['Q','♣'],['7','♥'],['2','♠'],['3','♦']],heroName:'TWO PAIR · ACES & QUEENS',oppName:'PAIR OF KINGS'},
      {hero:[['9','♠'],['8','♠']],opp:[['A','♦'],['A','♣']],board:[['7','♥'],['6','♣'],['5','♦'],['K','♣'],['2','♣']],heroName:'9-HIGH STRAIGHT',oppName:'PAIR OF ACES'},
      {hero:[['A','♥'],['7','♥']],opp:[['K','♠'],['K','♦']],board:[['2','♥'],['5','♥'],['J','♥'],['8','♣'],['Q','♠']],heroName:'ACE-HIGH FLUSH',oppName:'PAIR OF KINGS'},
      {hero:[['9','♣'],['9','♦']],opp:[['A','♠'],['K','♠']],board:[['9','♥'],['5','♣'],['5','♦'],['Q','♣'],['2','♠']],heroName:'FULL HOUSE · NINES',oppName:'PAIR OF FIVES'},
      {hero:[['8','♠'],['8','♦']],opp:[['A','♣'],['K','♣']],board:[['8','♥'],['A','♦'],['K','♦'],['4','♠'],['2','♣']],heroName:'THREE OF A KIND · EIGHTS',oppName:'TWO PAIR · ACES & KINGS'},
      {hero:[['Q','♠'],['J','♠']],opp:[['10','♦'],['10','♣']],board:[['A','♠'],['K','♠'],['10','♠'],['2','♦'],['3','♣']],heroName:'ROYAL FLUSH',oppName:'THREE OF A KIND · TENS'}
    ];const t=pick(templates);
    const card=(rank,suit)=>`<span class="poker-card ${suit==='♥'||suit==='♦'?'red':''}"><b>${rank}</b><i>${suit}</i></span>`,back='<span class="poker-card back">◆</span>';
    const topName=duel.topName,bottomName=duel.bottomName,heroTop=duel.heroTop;const table=document.createElement('div');table.className='poker-table';table.innerHTML=`<div class="poker-player top" style="--poker-color:${colorForName(topName)}"><strong>${escapeHtml(topName)}</strong><div class="poker-hole">${back}${back}</div><em class="poker-hand-name"></em></div><div class="poker-community">${back}${back}${back}${back}${back}</div><div class="poker-pot"><i></i><i></i><i></i><b>POT</b></div><div class="poker-player bottom" style="--poker-color:${colorForName(bottomName)}"><strong>${escapeHtml(bottomName)}</strong><div class="poker-hole">${back}${back}</div><em class="poker-hand-name"></em></div>`;els.cardField.appendChild(table);els.cardField.classList.add('active-layer');await wait(1000);audio.shuffleStart();await wait(800);
    const topHole=heroTop?t.hero:t.opp,bottomHole=heroTop?t.opp:t.hero,holes=table.querySelectorAll('.poker-hole');holes[0].innerHTML=topHole.map(c=>card(...c)).join('');await wait(620);holes[1].innerHTML=bottomHole.map(c=>card(...c)).join('');await wait(800);const comm=table.querySelector('.poker-community');comm.innerHTML='';for(let i=0;i<t.board.length;i++){comm.insertAdjacentHTML('beforeend',card(...t.board[i]));audio.tick(360+i*45,.025);await wait(i<3?500:820);}const labels=table.querySelectorAll('.poker-hand-name');labels[0].textContent=heroTop?t.heroName:t.oppName;labels[1].textContent=heroTop?t.oppName:t.heroName;(heroTop?table.querySelector('.poker-player.top'):table.querySelector('.poker-player.bottom')).classList.add('winner');audio.victorySting();fireworks(6,colorForName(name));await wait(1800);els.cardField.classList.remove('active-layer');setEvent('WINNER',name);await wait(650);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }


  async function eventBaseball(name, seat, pool, studentPool) {
    const opponents=studentPool.filter(n=>n!==name);if(!opponents.length){await eventCards(name,seat,pool);return;}const opponent=pick(opponents),duel=duelOrder(name,opponent);setEvent('BASEBALL','HOME RUN DERBY');hideEventLayer();
    const leftName=duel.leftName,rightName=duel.rightName,heroLeft=duel.heroLeft;const heroSeq=['HR','HR','OUT'],oppSeq=['HR','OUT','OUT'];const leftSeq=heroLeft?heroSeq:oppSeq,rightSeq=heroLeft?oppSeq:heroSeq;
    const arena=document.createElement('div');arena.className='baseball-arena baseball-v7';arena.innerHTML=`<div class="baseball-scoreboard"><div class="bb-team left"><strong>${escapeHtml(leftName)}</strong><span class="bb-score">0</span><em class="bb-results"></em></div><div class="bb-center"><b>HOME RUN DERBY</b><span>3 SWINGS EACH</span></div><div class="bb-team right"><strong>${escapeHtml(rightName)}</strong><span class="bb-score">0</span><em class="bb-results"></em></div></div><div class="baseball-field-wrap"><div class="baseball-field"><i class="bb-fence"></i><i class="bb-diamond"></i><div class="bb-homeplate">HOME</div><div class="bb-mound">PITCHER</div><div class="bb-batter"><i></i><b></b></div><i class="bb-pitcher"></i><i class="bb-ball"></i><div class="bb-call">READY</div></div></div>`;els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');await wait(900);
    const field=arena.querySelector('.baseball-field'),ball=arena.querySelector('.bb-ball'),call=arena.querySelector('.bb-call'),batter=arena.querySelector('.bb-batter'),batterName=batter.querySelector('b'),scoreEls=arena.querySelectorAll('.bb-score'),resultEls=arena.querySelectorAll('.bb-results');let ls=0,rs=0,lr=[],rr=[];
    const update=()=>{scoreEls[0].textContent=ls;scoreEls[1].textContent=rs;resultEls[0].innerHTML=lr.map(x=>`<i class="${x==='HR'?'hr':'out'}">${x}</i>`).join('');resultEls[1].innerHTML=rr.map(x=>`<i class="${x==='HR'?'hr':'out'}">${x}</i>`).join('');};
    const swing=async(player,outcome)=>{batterName.textContent=player;batter.style.setProperty('--batter-color',colorForName(player));call.textContent=`${player} // PITCH`;ball.style.transition='none';ball.style.left='50%';ball.style.top='46%';ball.style.opacity='1';ball.style.transform='translate(-50%,-50%) scale(.72)';await wait(320);audio.whoosh();ball.style.transition='left .48s linear, top .48s linear, transform .48s linear';ball.style.left='50%';ball.style.top='79%';ball.style.transform='translate(-50%,-50%) scale(1)';await wait(500);batter.classList.add('swing');audio.hit();call.textContent=outcome==='HR'?'CRACK!':'CONTACT';await wait(120);if(outcome==='HR'){const tx=pick([22,35,65,78]);ball.style.transition='left 1.1s cubic-bezier(.18,.7,.2,1), top 1.1s cubic-bezier(.18,.7,.2,1), transform 1.1s linear';ball.style.left=`${tx}%`;ball.style.top='7%';ball.style.transform='translate(-50%,-50%) scale(.42)';call.textContent='HOME RUN';audio.explosion();fireworksAt(tx/100,.18,3,colorForName(player));}else{const tx=pick([35,50,65]);ball.style.transition='left .78s ease, top .78s ease, transform .78s linear';ball.style.left=`${tx}%`;ball.style.top='32%';ball.style.transform='translate(-50%,-50%) scale(.6)';call.textContent='OUT';audio.error();}await wait(1150);batter.classList.remove('swing');ball.style.opacity='0';await wait(240);};
    for(let i=0;i<3;i++){await swing(leftName,leftSeq[i]);lr.push(leftSeq[i]);if(leftSeq[i]==='HR')ls++;update();await wait(320);await swing(rightName,rightSeq[i]);rr.push(rightSeq[i]);if(rightSeq[i]==='HR')rs++;update();await wait(400);}call.textContent='WINNER';arena.classList.add(heroLeft?'bb-left-win':'bb-right-win');fireworks(6,colorForName(name));audio.victorySting();await wait(1400);els.cardField.classList.remove('active-layer');setEvent('WINNER',name);await wait(650);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventDice(name, seat, pool, studentPool) {
    const opponents=studentPool.filter(n=>n!==name);if(!opponents.length){await eventCards(name,seat,pool);return;}const opponent=pick(opponents),duel=duelOrder(name,opponent);setEvent('DICE DUEL','BEST OF 3');hideEventLayer();
    const faces=['⚀','⚁','⚂','⚃','⚄','⚅'];
    const arena=document.createElement('div');arena.className='dice-arena dice-v7';arena.innerHTML=`<div class="dice-player left" style="--dice-color:${colorForName(duel.leftName)}"><strong>${escapeHtml(duel.leftName)}</strong><div class="dice-pair"><div class="dice-face">⚀</div><div class="dice-face">⚀</div></div><span class="dice-round-total">TOTAL 2</span><b class="dice-match-score">0</b></div><div class="dice-center"><em>DICE</em><span>ROUND 1 / 3</span></div><div class="dice-player right" style="--dice-color:${colorForName(duel.rightName)}"><strong>${escapeHtml(duel.rightName)}</strong><div class="dice-pair"><div class="dice-face">⚀</div><div class="dice-face">⚀</div></div><span class="dice-round-total">TOTAL 2</span><b class="dice-match-score">0</b></div>`;els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');await wait(900);
    const left=arena.querySelector('.dice-player.left'),right=arena.querySelector('.dice-player.right'),ld=[...left.querySelectorAll('.dice-face')],rd=[...right.querySelectorAll('.dice-face')],lt=left.querySelector('.dice-round-total'),rt=right.querySelector('.dice-round-total'),lm=left.querySelector('.dice-match-score'),rm=right.querySelector('.dice-match-score'),roundLabel=arena.querySelector('.dice-center span');
    const heroRounds=[[6,5],[4,6],[5,4]],oppRounds=[[3,4],[6,5],[2,5]];let lmatch=0,rmatch=0;
    for(let round=0;round<3;round++){roundLabel.textContent=`ROUND ${round+1} / 3`;for(let s=0;s<10;s++){for(const d of [...ld,...rd])d.textContent=faces[Math.floor(Math.random()*6)];left.classList.toggle('rolling');right.classList.toggle('rolling');audio.tick(220+s*24,.018);await wait(105);}const lvals=duel.heroLeft?heroRounds[round]:oppRounds[round],rvals=duel.heroLeft?oppRounds[round]:heroRounds[round];ld[0].textContent=faces[lvals[0]-1];ld[1].textContent=faces[lvals[1]-1];rd[0].textContent=faces[rvals[0]-1];rd[1].textContent=faces[rvals[1]-1];const lsum=lvals[0]+lvals[1],rsum=rvals[0]+rvals[1];lt.textContent=`TOTAL ${lsum}`;rt.textContent=`TOTAL ${rsum}`;if(lsum>rsum){lmatch++;left.classList.add('round-win');}else{rmatch++;right.classList.add('round-win');}lm.textContent=lmatch;rm.textContent=rmatch;audio.hit();await wait(1000);left.classList.remove('rolling','round-win');right.classList.remove('rolling','round-win');}
    roundLabel.textContent='WINNER';(duel.heroLeft?left:right).classList.add('winner');fireworks(5,colorForName(name));audio.victorySting();await wait(1300);els.cardField.classList.remove('active-layer');setEvent('WINNER',name);await wait(650);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function themedSeatLanding(type, seat, name, mega=false) {
    const p=getSeatPoint(seat);if(!p)return;const rect=els.cinemaStage.getBoundingClientRect();
    if(type==='drop'||type==='final'){
      els.dropName.textContent=name;els.dropName.style.left=`${p.x}px`;els.dropName.style.top=`${p.y}px`;els.dropName.style.fontSize=mega?'clamp(54px,7.5vw,145px)':'clamp(38px,5vw,92px)';els.dropName.className='drop-name fall-seat name-only';audio.whoosh();await wait(760);return;
    }
    const icons={slot:'◉',laser:'⌖',cards:'◆',rain:'✦',glitch:'▣',countdown:'●',rgb:'RGB',lightning:'⚡',battle:'✹',race:'🐎',dart:'➤',spotlight:'✦',elimination:'★',pinball:'●',conveyor:'▰',meteor:'☄',tug:'◆',sprint:'➜',rocket:'🚀',penalty:'⚽',archery:'➳',sumo:'✹',boat:'⛵',rps:'✊',poker:'♠',baseball:'⚾',dice:'⚅'};
    const proj=document.createElement('div');proj.className=`seat-projectile project-${type}`;if(type==='dart'){proj.innerHTML='<i></i><b></b>';}else proj.textContent=icons[type]||'◆';els.cinemaStage.appendChild(proj);
    let sx=rect.width*.5,sy=-80,rot=0;
    if(['race','sprint','boat'].includes(type)){sx=-90;sy=p.y;rot=0;}
    if(type==='rps'||type==='poker'||type==='dice'){sx=rect.width*.5;sy=rect.height*.18;rot=0;}
    if(type==='baseball'){sx=rect.width*.13;sy=rect.height*.7;rot=0;}
    if(type==='rocket'){sx=p.x;sy=rect.height+110;rot=0;}
    if(type==='dart'||type==='archery'){sx=rect.width+120;sy=rect.height*.22;rot=180;}
    if(type==='penalty'){sx=rect.width*.12;sy=rect.height*.82;rot=-25;}
    if(type==='battle'||type==='sumo'||type==='tug'){sx=rect.width*.08;sy=rect.height*.48;rot=0;}
    if(type==='lightning'){sx=p.x;sy=-100;rot=0;}
    if(type==='meteor'){sx=rect.width*.82;sy=-100;rot=-35;}
    if(type==='pinball'){sx=rect.width*.08;sy=rect.height*.12;rot=0;}
    proj.style.left=`${sx}px`;proj.style.top=`${sy}px`;proj.style.setProperty('--projectile-color',state.currentColor);
    const dx=p.x-sx,dy=p.y-sy;const angle=Math.atan2(dy,dx)*180/Math.PI;
    if(['dart','archery','sprint'].includes(type))rot=angle;
    const duration=mega?980:(type==='rocket'?900:type==='dart'?850:type==='race'?920:760);
    const middle= type==='pinball' ? [{transform:`translate(-50%,-50%) translate(${dx*.45}px,${dy*.15-90}px) rotate(${angle}deg) scale(1.2)`}] : [];
    audio.whoosh();
    try{const frames=[{transform:`translate(-50%,-50%) rotate(${rot}deg) scale(${type==='rocket'?1.5:1})`,opacity:1},...middle,{transform:`translate(-50%,-50%) translate(${dx}px,${dy}px) rotate(${angle}deg) scale(${mega?1.35:.82})`,opacity:1}];await proj.animate(frames,{duration,easing:'cubic-bezier(.16,.82,.18,1)',fill:'forwards'}).finished;}catch(_){proj.style.left=`${p.x}px`;proj.style.top=`${p.y}px`;await wait(duration);}
    proj.classList.add('impacting');await wait(80);proj.remove();
  }

  async function commitAssignment(revealed, seat, name, mega = false, eventType='drop') {
    clearTransient();setEventColor(colorForName(name));renderCinemaSeats(revealed,seat);els.cinemaSeats.classList.add('targeting');els.cinemaClassroom.classList.add('assignment-focus');hideEventLayer();await wait(250);
    const p=getSeatPoint(seat);if(!p){revealed.set(seat,name);renderCinemaSeats(revealed);return;}
    spotlightAtSeat(seat,true);await themedSeatLanding(eventType,seat,name,mega);
    revealed.set(seat,name);renderCinemaSeats(revealed,seat,seat);els.cinemaSeats.classList.add('targeting');spotlightAtSeat(seat,true);const p2=getSeatPoint(seat)||p;screenImpact();impactWaves(p2.nx,p2.ny,mega?9:6,mega?48:66);particlesBurst(p2.nx,p2.ny,mega?300:185,state.currentColor,mega?2.75:1.95);fireworksAt(p2.nx,p2.ny,mega?12:6,state.currentColor);audio.impact(mega);await wait(mega?1250:980);
    els.seatSpotlight.classList.remove('active');els.seatBeam.classList.remove('active');els.cinemaSeats.classList.remove('targeting');els.cinemaClassroom.classList.remove('assignment-focus');renderCinemaSeats(revealed);
  }

  async function midShuffle(remainingNames) {
    clearTransient();setEventColor('#ff3f5f');setEvent('MID-SEQUENCE SHUFFLE','WARNING');audio.warning();els.cinemaStage.classList.add('glitching');fireworks(5,'#ff3f5f');await wait(1200);els.cinemaStage.classList.remove('glitching');setEventColor('#ff3bd4');await globalShuffle('MID-SEQUENCE SHUFFLE',remainingNames,4800);audio.confirm();await wait(700);
  }

  async function finalFiveIntro(entries) {
    clearTransient();setEventColor('#ff8a34');setEvent('FINAL FIVE','5',entries.map(([,name])=>name).join('  //  '));audio.finalRise();fireworks(6,'#ff8a34');await wait(2500);
  }

  async function finalThreeIntro(entries) {
    clearTransient();setEventColor('#ffe55d');setEvent('FINAL THREE','3',entries.map(([,name])=>name).join('  //  '));audio.finalRise(true);particlesBurst(.5,.5,125,'#ffe55d',1.8);await wait(2300);
  }

  async function finalTwo(entries) {
    clearTransient();const [[,n1],[,n2]]=entries;setEventColor('#ffffff');hideEventLayer();
    const a=document.createElement('div');a.className='duel-person';a.innerHTML=`<span>FINALIST A</span><strong>${escapeHtml(n1)}</strong>`;
    const b=document.createElement('div');b.className='duel-person';b.innerHTML=`<span>FINALIST B</span><strong>${escapeHtml(n2)}</strong>`;
    const vs=document.createElement('div');vs.className='duel-vs';vs.textContent='VS';els.finalDuel.append(a,vs,b);els.finalDuel.classList.add('active-layer');audio.heartbeat();await wait(3300);particlesBurst(.25,.5,60,colorForName(n1),1.1);particlesBurst(.75,.5,60,colorForName(n2),1.1);await wait(900);els.finalDuel.classList.remove('active-layer');setEvent('FINAL TWO','VS');await wait(750);
  }

  async function finalStudent(entry) {
    clearTransient();const [,name]=entry;setEventColor('#ffffff');setEvent('FINAL STUDENT',name);audio.heartbeat(true);await wait(1900);setEvent('FINAL SCAN','SEARCHING','','','top');
    const act=activeSeats();for(const s of shuffle(act).slice(0,Math.min(act.length,20))){seatPulse(s);spotlightAtSeat(s);audio.tick(190+(s%5)*35,.015);await wait(125)}hideEventLayer();await wait(350);
  }


  function bestPairHistorySwap(assign) {
    const current=pairViolations(assign);if(!current.length)return null;const locked=new Set(state.locks.values());let best=null,bestScore=current.length;
    const sourceSeats=[...new Set(current.flatMap(v=>[v.a,v.b]).filter(s=>!locked.has(s)))],targets=[...assign.keys()].filter(s=>!locked.has(s));
    for(const a of sourceSeats)for(const b of targets){if(a===b||seatPairMate(a)===b)continue;const test=new Map(assign),na=test.get(a),nb=test.get(b);if(!na||!nb)continue;test.set(a,nb);test.set(b,na);const score=pairViolations(test).length;if(score<bestScore){best={a,b,score};bestScore=score;if(score===0)return best;}}
    return best;
  }

  function findSafePairTarget(assign) {
    const locked=new Set(state.locks.values()),seats=[...assign.keys()].filter(s=>!locked.has(s)),names=seats.map(s=>assign.get(s));let best=null,bestDiff=Infinity;
    for(let tries=0;tries<1800;tries++){const order=shuffle(names),test=new Map(assign);seats.forEach((s,i)=>test.set(s,order[i]));if(pairViolations(test).length===0){let diff=0;seats.forEach(s=>{if(test.get(s)!==assign.get(s))diff++;});if(diff<bestDiff){best=test;bestDiff=diff;if(diff<=2)break;}}}return best;
  }

  function nextSwapTowardTarget(assign,target) {
    const locked=new Set(state.locks.values()),seats=[...assign.keys()].filter(s=>!locked.has(s));for(const a of seats){const wanted=target.get(a),now=assign.get(a);if(now===wanted)continue;const b=seats.find(s=>assign.get(s)===wanted);if(b!==undefined&&b!==a)return{a,b};}return null;
  }

  async function performPairHistorySwap(revealed,a,b,step) {
    const nameA=revealed.get(a),nameB=revealed.get(b);if(!nameA||!nameB)return;clearTransient();setEventColor('#ff3bd4');renderCinemaSeats(revealed);els.swapField.classList.add('active-layer');const board=document.createElement('div');board.className='pair-change-board';board.innerHTML=`<span>PAIR CHANGE ${step}</span><div><section><small>${seatMini(a)}</small><strong>${escapeHtml(nameA)}</strong></section><b>⇄</b><section><small>${seatMini(b)}</small><strong>${escapeHtml(nameB)}</strong></section></div>`;els.swapField.appendChild(board);audio.warning();fireworks(4,'#ff3bd4');await wait(1700);els.swapField.classList.remove('active-layer');els.swapField.innerHTML='';
    const pa=getSeatPoint(a),pb=getSeatPoint(b);if(!pa||!pb)return;els.cinemaSeats.classList.add('swap-dim');const ghost=(name,p,color)=>{const g=document.createElement('div');g.className='swap-ghost pair-history-ghost';g.textContent=name;g.style.left=`${p.x}px`;g.style.top=`${p.y}px`;g.style.setProperty('--ghost-color',color);els.cinemaStage.appendChild(g);return g;},ga=ghost(nameA,pa,colorForName(nameA)),gb=ghost(nameB,pb,colorForName(nameB));audio.whoosh();await Promise.allSettled([ga.animate([{transform:'translate(-50%,-50%)'},{transform:`translate(calc(-50% + ${(pb.x-pa.x)*.5}px),calc(-50% + ${(pb.y-pa.y)*.5-85}px)) scale(1.18)`},{transform:`translate(calc(-50% + ${pb.x-pa.x}px),calc(-50% + ${pb.y-pa.y}px))`}],{duration:1800,easing:'cubic-bezier(.2,.78,.22,1)',fill:'forwards'}).finished,gb.animate([{transform:'translate(-50%,-50%)'},{transform:`translate(calc(-50% + ${(pa.x-pb.x)*.5}px),calc(-50% + ${(pa.y-pb.y)*.5+85}px)) scale(1.18)`},{transform:`translate(calc(-50% + ${pa.x-pb.x}px),calc(-50% + ${pa.y-pb.y}px))`}],{duration:1800,easing:'cubic-bezier(.2,.78,.22,1)',fill:'forwards'}).finished]);ga.remove();gb.remove();revealed.set(a,nameB);revealed.set(b,nameA);state.assignment.set(a,nameB);state.assignment.set(b,nameA);els.cinemaSeats.classList.remove('swap-dim');renderCinemaSeats(revealed,a,a);const qa=getSeatPoint(a),qb=getSeatPoint(b);if(qa){impactWaves(qa.nx,qa.ny,5,58);fireworksAt(qa.nx,qa.ny,5,colorForName(nameB));}if(qb){impactWaves(qb.nx,qb.ny,5,58);fireworksAt(qb.nx,qb.ny,5,colorForName(nameA));}audio.impact(true);screenImpact();await wait(1050);renderCinemaSeats(revealed);
  }

  async function repairPairHistory(revealed) {
    if(!state.pairMode||!state.avoidPairHistory||!state.pairHistory.size)return;let conflicts=pairViolations(revealed);clearTransient();setEventColor('#ff3bd4');if(!conflicts.length){setEvent('PAIR HISTORY CHECK','CLEAR');audio.confirm();await wait(1200);return;}setEvent('PAIR HISTORY CHECK',`${conflicts.length} CONFLICT${conflicts.length===1?'':'S'}`,conflicts.map(v=>`${v.na} × ${v.nb}`).join('  //  '));audio.warning();await wait(2300);let step=1,target=null;
    while((conflicts=pairViolations(revealed)).length&&step<=12){let move=bestPairHistorySwap(revealed);if(!move){if(!target)target=findSafePairTarget(revealed);move=target?nextSwapTowardTarget(revealed,target):null;}if(!move)break;await performPairHistorySwap(revealed,move.a,move.b,step++);await wait(400);}
    conflicts=pairViolations(revealed);clearTransient();setEventColor(conflicts.length?'#ff3f5f':'#52f5a4');setEvent('PAIR HISTORY CHECK',conflicts.length?`${conflicts.length} UNRESOLVED`:'ALL CLEAR');conflicts.length?audio.error():audio.confirm();await wait(conflicts.length?1800:1400);
  }

  async function finale(revealed) {
    clearTransient();setEventColor('#36e7ff');els.cinemaClassroom.classList.remove('focus','assignment-focus');setEvent('ASSIGNMENT','COMPLETE');setProgress(100);audio.victory();fireworks(16,null);particlesBurst(.5,.42,310,null,2.8);await wait(1900);hideEventLayer();
    const full=new Map();state.locks.forEach((seat,name)=>full.set(seat,name));const ordered=[...revealed.entries()].sort((a,b)=>a[0]-b[0]);
    for(const [seat,name] of ordered){full.set(seat,name);renderCinemaSeats(full,seat,seat);const p=getSeatPoint(seat);if(p)particlesBurst(p.nx,p.ny,12,colorForName(name),.4);audio.tick(520+(seat%8)*38,.017);await wait(76)}
    renderCinemaSeats(full);els.cinemaClassroom.classList.add('final-view');els.finalBadge.hidden=false;els.remainingLabel.textContent='COMPLETE';fireworks(14,null);state.completed=true;els.downloadButton.hidden=false;await wait(1500);
  }


  async function swapAssignedSeats(revealed) {
    const locked=new Set(state.locks.values());const candidates=[...revealed.entries()].filter(([seat])=>!locked.has(seat));if(candidates.length<2)return false;
    const [[seatA,nameA],[seatB,nameB]]=shuffle(candidates).slice(0,2),type=pick(SWAP_POOL);clearTransient();setEventColor('#ff3bd4');renderCinemaSeats(revealed);els.swapField.classList.add('active-layer');
    const typeName={cross:'CROSS SWAP',portal:'PORTAL SWAP',orbit:'ORBIT SWAP',warp:'WARP SWAP'}[type];const board=document.createElement('div');board.className='swap-board swap-notice-board';board.innerHTML=`<div class="swap-alert">${typeName}</div><div class="swap-side a"><span>${seatMini(seatA)}</span><strong>${escapeHtml(nameA)}</strong></div><div class="swap-icon">⇄</div><div class="swap-side b"><span>${seatMini(seatB)}</span><strong>${escapeHtml(nameB)}</strong></div><div class="swap-notice">SWAP CONFIRMED // LOCKED SEATS EXCLUDED</div>`;els.swapField.appendChild(board);audio.warning();particlesBurst(.5,.5,120,null,1.4);fireworks(6,'#ff3bd4');await wait(2600);
    const pa=getSeatPoint(seatA),pb=getSeatPoint(seatB);if(!pa||!pb){els.swapField.classList.remove('active-layer');return false;}els.swapField.classList.remove('active-layer');els.swapField.innerHTML='';els.cinemaSeats.classList.add('swap-dim');spotlightAtSeat(seatA,true);seatPulse(seatA);await wait(300);spotlightAtSeat(seatB,true);seatPulse(seatB);await wait(500);
    const ghost=(name,p,color)=>{const g=document.createElement('div');g.className='swap-ghost';g.textContent=name;g.style.left=`${p.x}px`;g.style.top=`${p.y}px`;g.style.setProperty('--ghost-color',color);els.cinemaStage.appendChild(g);return g;};const ga=ghost(nameA,pa,colorForName(nameA)),gb=ghost(nameB,pb,colorForName(nameB));
    const duration=type==='orbit'?2100:type==='portal'?1900:1700;audio.whoosh();
    if(type==='portal'){
      for(const pnt of [pa,pb]){const portal=document.createElement('div');portal.className='swap-portal';portal.style.left=`${pnt.x}px`;portal.style.top=`${pnt.y}px`;els.cinemaStage.appendChild(portal);}await wait(550);
      const shrinkA=ga.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:'translate(-50%,-50%) scale(.04) rotate(420deg)',opacity:.08}],{duration:duration*.48,easing:'cubic-bezier(.55,.05,.2,1)',fill:'forwards'});
      const shrinkB=gb.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:'translate(-50%,-50%) scale(.04) rotate(-420deg)',opacity:.08}],{duration:duration*.48,easing:'cubic-bezier(.55,.05,.2,1)',fill:'forwards'});await Promise.allSettled([shrinkA.finished,shrinkB.finished]);ga.style.left=`${pb.x}px`;ga.style.top=`${pb.y}px`;gb.style.left=`${pa.x}px`;gb.style.top=`${pa.y}px`;ga.style.transform='translate(-50%,-50%) scale(.04)';gb.style.transform='translate(-50%,-50%) scale(.04)';ga.style.opacity='.08';gb.style.opacity='.08';
      const growA=ga.animate([{transform:'translate(-50%,-50%) scale(.04) rotate(-220deg)',opacity:.08},{transform:'translate(-50%,-50%) scale(1)',opacity:1}],{duration:duration*.52,easing:'cubic-bezier(.16,.84,.24,1)',fill:'forwards'});const growB=gb.animate([{transform:'translate(-50%,-50%) scale(.04) rotate(220deg)',opacity:.08},{transform:'translate(-50%,-50%) scale(1)',opacity:1}],{duration:duration*.52,easing:'cubic-bezier(.16,.84,.24,1)',fill:'forwards'});await Promise.allSettled([growA.finished,growB.finished]);
    }else if(type==='orbit'){
      const cx=(pa.x+pb.x)/2,cy=(pa.y+pb.y)/2,arc=Math.max(90,Math.abs(pb.x-pa.x)*.28);const framesA=[{transform:'translate(-50%,-50%)'},{transform:`translate(calc(-50% + ${cx-pa.x}px),calc(-50% + ${cy-pa.y-arc}px)) scale(1.16) rotate(180deg)`},{transform:`translate(calc(-50% + ${pb.x-pa.x}px),calc(-50% + ${pb.y-pa.y}px)) rotate(360deg)`}];const framesB=[{transform:'translate(-50%,-50%)'},{transform:`translate(calc(-50% + ${cx-pb.x}px),calc(-50% + ${cy-pb.y+arc}px)) scale(1.16) rotate(-180deg)`},{transform:`translate(calc(-50% + ${pa.x-pb.x}px),calc(-50% + ${pa.y-pb.y}px)) rotate(-360deg)`}];await Promise.allSettled([ga.animate(framesA,{duration,easing:'cubic-bezier(.45,.05,.2,1)',fill:'forwards'}).finished,gb.animate(framesB,{duration,easing:'cubic-bezier(.45,.05,.2,1)',fill:'forwards'}).finished]);
    }else if(type==='warp'){
      els.cinemaStage.classList.add('glitching');for(let i=0;i<5;i++){ga.style.opacity=i%2?'.15':'1';gb.style.opacity=i%2?'.15':'1';audio.glitch();await wait(150)}const a1=ga.animate([{transform:'translate(-50%,-50%) scaleX(1)'},{transform:`translate(calc(-50% + ${pb.x-pa.x}px),calc(-50% + ${pb.y-pa.y}px)) scaleX(2.2)`}],{duration,easing:'steps(8,end)',fill:'forwards'});const b1=gb.animate([{transform:'translate(-50%,-50%) scaleX(1)'},{transform:`translate(calc(-50% + ${pa.x-pb.x}px),calc(-50% + ${pa.y-pb.y}px)) scaleX(2.2)`}],{duration,easing:'steps(8,end)',fill:'forwards'});await Promise.allSettled([a1.finished,b1.finished]);els.cinemaStage.classList.remove('glitching');
    }else{
      await Promise.allSettled([ga.animate([{transform:'translate(-50%,-50%) scale(1)'},{transform:`translate(calc(-50% + ${(pb.x-pa.x)*.52}px),calc(-50% + ${(pb.y-pa.y)*.52-70}px)) scale(1.25)`},{transform:`translate(calc(-50% + ${pb.x-pa.x}px),calc(-50% + ${pb.y-pa.y}px)) scale(1)`}],{duration,easing:'cubic-bezier(.2,.78,.22,1)',fill:'forwards'}).finished,gb.animate([{transform:'translate(-50%,-50%) scale(1)'},{transform:`translate(calc(-50% + ${(pa.x-pb.x)*.52}px),calc(-50% + ${(pa.y-pb.y)*.52+70}px)) scale(1.25)`},{transform:`translate(calc(-50% + ${pa.x-pb.x}px),calc(-50% + ${pa.y-pb.y}px)) scale(1)`}],{duration,easing:'cubic-bezier(.2,.78,.22,1)',fill:'forwards'}).finished]);
    }
    ga.remove();gb.remove();document.querySelectorAll('.swap-portal').forEach(n=>n.remove());els.cinemaSeats.classList.remove('swap-dim');revealed.set(seatA,nameB);revealed.set(seatB,nameA);state.assignment.set(seatA,nameB);state.assignment.set(seatB,nameA);renderCinemaSeats(revealed);const a=getSeatPoint(seatA),b=getSeatPoint(seatB);if(a){impactWaves(a.nx,a.ny,5,55);fireworksAt(a.nx,a.ny,6,colorForName(nameB));}if(b){impactWaves(b.nx,b.ny,5,55);fireworksAt(b.nx,b.ny,6,colorForName(nameA));}audio.impact(true);screenImpact();await wait(1100);
    els.swapField.classList.add('active-layer');const done=document.createElement('div');done.className='swap-complete';done.innerHTML=`<strong>SWAP COMPLETE</strong><span>${seatMini(seatA)} · ${escapeHtml(nameB)} &nbsp;&nbsp;⇄&nbsp;&nbsp; ${seatMini(seatB)} · ${escapeHtml(nameA)}</span>`;els.swapField.appendChild(done);await wait(1500);els.swapField.classList.remove('active-layer');clearTransient();renderCinemaSeats(revealed);state.swapCount++;return true;
  }

  async function runDraw() {
    const err=validateSetup();if(err){els.setupMessage.textContent=err;return;}els.setupMessage.textContent='';state.running=true;state.skip=false;state.completed=false;state.assignment=createAssignment();state.eventQueue=[];state.lastEvent=null;state.swapCount=0;els.backButton.hidden=true;els.downloadButton.hidden=true;els.skipButton.hidden=false;els.finalBadge.hidden=true;els.cinemaClassroom.classList.remove('final-view');
    const names=roster();els.cinemaView.hidden=false;els.setupView.setAttribute('aria-hidden','true');renderCinemaSeats(new Map());resizeCanvas();audio.ensure();audio.setVolume(state.volume);audio.externalPausedByUser=false;audio.startBgm('intro');
    try{if(!document.fullscreenElement&&els.cinemaView.requestFullscreen)await els.cinemaView.requestFullscreen();}catch(_){ }
    await introSequence(names);if(state.skip){await finishImmediately();return;}audio.startBgm('draw');
    const lockedSeats=new Set(state.locks.values());let queue=shuffle([...state.assignment.entries()].filter(([seat])=>!lockedSeats.has(seat)));const revealed=new Map();state.locks.forEach((seat,name)=>revealed.set(seat,name));renderCinemaSeats(revealed);const total=queue.length;let midDone=false;let assignedUnlocked=0;const swapThresholds=total>=16?[Math.max(4,Math.floor(total*.34)),Math.max(7,Math.floor(total*.70))]:[Math.max(4,Math.floor(total*.45))];
    while(queue.length){
      if(state.skip){await finishImmediately();return;}const remaining=queue.length;
      if(!midDone&&total>=8&&remaining===Math.ceil(total/2)){midDone=true;await midShuffle(queue.map(([,name])=>name));queue=shuffle(queue);}
      if(state.swapCount<swapThresholds.length&&assignedUnlocked>=swapThresholds[state.swapCount]&&[...revealed.keys()].filter(s=>!lockedSeats.has(s)).length>=2){await swapAssignedSeats(revealed);}
      if(remaining===5){audio.startBgm('final');await finalFiveIntro(queue);}if(remaining===3)await finalThreeIntro(queue);if(remaining===2)await finalTwo(queue);
      if(remaining===1){const entry=queue.shift();await finalStudent(entry);await commitAssignment(revealed,entry[0],entry[1],true,'final');assignedUnlocked++;break;}
      const [seat,name]=queue.shift();const available=queue.map(([s])=>s).concat([seat]);const studentPool=queue.map(([,n])=>n).concat([name]);const ev=nextEvent();
      await drawEvent(ev,name,seat,available,studentPool,remaining,total-queue.length-1,total);await commitAssignment(revealed,seat,name,remaining<=3,ev);assignedUnlocked++;await wait(remaining<=5?820:430);
    }
    if(state.swapCount===0&&[...revealed.keys()].filter(s=>!lockedSeats.has(s)).length>=2)await swapAssignedSeats(revealed);
    await repairPairHistory(revealed);
    await finale(revealed);state.running=false;audio.stopBgm();audio.stopHeartbeat();els.skipButton.hidden=true;els.backButton.hidden=false;
  }

  async function finishImmediately() {
    state.skip=false;clearTransient();audio.stopBgm();audio.stopHeartbeat();renderCinemaSeats(state.assignment);els.cinemaClassroom.classList.add('final-view');hideEventLayer();setProgress(100);setEventColor('#36e7ff');els.remainingLabel.textContent='COMPLETE';els.finalBadge.hidden=false;audio.victory();fireworks(10,null);state.running=false;state.completed=true;els.skipButton.hidden=true;els.backButton.hidden=false;els.downloadButton.hidden=false;
  }

  function resizeCanvas() {
    const r=els.cinemaStage.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);els.fxCanvas.width=Math.round(r.width*dpr);els.fxCanvas.height=Math.round(r.height*dpr);els.fxCanvas.style.width=`${r.width}px`;els.fxCanvas.style.height=`${r.height}px`;const ctx=els.fxCanvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function particlesBurst(nx=.5,ny=.5,count=60,color=null,power=1) {
    const rect=els.cinemaStage.getBoundingClientRect();
    for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,speed=(85+Math.random()*390)*power;state.particles.push({x:rect.width*nx,y:rect.height*ny,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-45*power,life:.7+Math.random()*1.15,max:1.85,size:1+Math.random()*4.8,color:color||pick(COLORS),gravity:190+Math.random()*250,trail:Math.random()<.32});}
  }

  function fireworks(count=3,color=null){for(let i=0;i<count;i++)setTimeout(()=>{const x=.12+Math.random()*.76,y=.15+Math.random()*.55;particlesBurst(x,y,55+Math.floor(Math.random()*48),color||pick(COLORS),.9+Math.random()*.75);audio.firework();},i*155)}
  function fireworksAt(nx,ny,count=3,color=null){for(let i=0;i<count;i++)setTimeout(()=>{particlesBurst(clamp(nx+(Math.random()-.5)*.12,.05,.95),clamp(ny+(Math.random()-.5)*.12,.08,.9),45+Math.floor(Math.random()*40),color||pick(COLORS),.85+Math.random()*.7);audio.firework();},i*130)}

  function fxLoop(){
    const ctx=els.fxCanvas.getContext('2d'),rect=els.cinemaStage.getBoundingClientRect(),dt=.016;ctx.clearRect(0,0,rect.width,rect.height);state.particles=state.particles.filter(p=>p.life>0);
    for(const p of state.particles){p.life-=dt;p.vy+=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.992;ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=13;if(p.trail)ctx.fillRect(p.x,p.y,p.size*3.6,p.size*.8);else{ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}}
    ctx.globalAlpha=1;ctx.shadowBlur=0;state.raf=requestAnimationFrame(fxLoop);
  }

  const audio = {
    ctx:null,master:null,music:null,sfx:null,compressor:null,bgmTimer:null,heartbeatTimer:null,customEl:null,customUrl:null,playlist:[],playlistIndex:0,objectUrls:[],externalPausedByUser:false,
    ensure(){if(!state.soundOn)return;if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.master=this.ctx.createGain();this.music=this.ctx.createGain();this.sfx=this.ctx.createGain();this.compressor=this.ctx.createDynamicsCompressor();this.compressor.threshold.value=-16;this.compressor.knee.value=18;this.compressor.ratio.value=7;this.compressor.attack.value=.003;this.compressor.release.value=.22;this.music.gain.value=.50;this.sfx.gain.value=1.12;this.music.connect(this.master);this.sfx.connect(this.master);this.master.connect(this.compressor);this.compressor.connect(this.ctx.destination);this.setVolume(state.volume);}if(this.ctx.state==='suspended')this.ctx.resume();},
    setVolume(v){state.volume=clamp(v,0,1);if(this.master)this.master.gain.value=state.soundOn?state.volume:0;if(this.customEl)this.customEl.volume=state.soundOn?state.volume:0;},
    releaseObjectUrls(){this.objectUrls.forEach(u=>URL.revokeObjectURL(u));this.objectUrls=[];},
    setPlaylist(tracks,label='AUTO PLAYLIST',startIndex=0){if(this.customEl){this.customEl.pause();this.customEl.onended=null;}this.customEl=null;this.playlist=(tracks||[]).filter(t=>t&&t.src).map(t=>({title:t.title||t.src,src:t.src}));this.playlistIndex=clamp(startIndex,0,Math.max(0,this.playlist.length-1));state.bgmMode=this.playlist.length?'external':'synth';state.customBgmName=label;if(els.bgmFileName)els.bgmFileName.textContent=this.playlist.length?`${label} · ${this.playlist.length} TRACK${this.playlist.length===1?'':'S'}`:'BUILT-IN SYNTH BGM';},
    loadCustomFiles(files){this.releaseObjectUrls();const tracks=[...files].filter(f=>f&&f.type.startsWith('audio/')||f&&/\.(mp3|m4a|aac|wav|ogg|flac)$/i.test(f.name)).map(f=>{const src=URL.createObjectURL(f);this.objectUrls.push(src);return{title:f.name,src};});this.setPlaylist(tracks,tracks.length>1?'TEMP PLAYLIST':'TEMP FILE');},
    createExternal(index=this.playlistIndex,autoplay=false){if(!this.playlist.length)return null;if(this.customEl){this.customEl.pause();this.customEl.onended=null;}this.playlistIndex=(index+this.playlist.length)%this.playlist.length;const track=this.playlist[this.playlistIndex];const el=new Audio(track.src);el.preload='auto';el.loop=false;el.volume=state.soundOn?state.volume:0;el.onended=()=>{if(!this.externalPausedByUser&&state.soundOn){this.playlistIndex=(this.playlistIndex+1)%this.playlist.length;this.createExternal(this.playlistIndex,true);}};el.onerror=()=>{if(this.playlist.length>1&&!this.externalPausedByUser){this.playlistIndex=(this.playlistIndex+1)%this.playlist.length;setTimeout(()=>this.createExternal(this.playlistIndex,true),250);}};this.customEl=el;if(els.bgmFileName)els.bgmFileName.textContent=`${track.title}  ·  ${this.playlistIndex+1}/${this.playlist.length}`;if(autoplay)el.play().catch(()=>{});return el;},
    toggleCustomPreview(){if(!this.playlist.length)return false;if(!this.customEl)this.createExternal(this.playlistIndex,false);if(this.customEl.paused){this.externalPausedByUser=false;this.customEl.volume=state.soundOn?state.volume:0;this.customEl.play().catch(()=>{});if(els.bgmPlayButton)els.bgmPlayButton.textContent='PAUSE BGM';}else{this.externalPausedByUser=true;this.customEl.pause();if(els.bgmPlayButton)els.bgmPlayButton.textContent='PLAY BGM';}return true;},
    tone(freq=440,dur=.1,type='sine',gain=.08,when=0,bus='sfx',detune=0){if(!state.soundOn)return;this.ensure();if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),dest=bus==='music'?this.music:this.sfx;o.type=type;o.frequency.setValueAtTime(freq,this.ctx.currentTime+when);o.detune.value=detune;g.gain.setValueAtTime(Math.max(.0001,gain),this.ctx.currentTime+when);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+when+dur);o.connect(g);g.connect(dest);o.start(this.ctx.currentTime+when);o.stop(this.ctx.currentTime+when+dur+.03);},
    noise(dur=.18,gain=.08,filter=900,type='lowpass'){if(!state.soundOn)return;this.ensure();if(!this.ctx)return;const len=Math.floor(this.ctx.sampleRate*dur),buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate),data=buf.getChannelData(0);for(let i=0;i<len;i++)data[i]=Math.random()*2-1;const src=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();src.buffer=buf;f.type=type;f.frequency.value=filter;g.gain.setValueAtTime(gain,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+dur);src.connect(f);f.connect(g);g.connect(this.sfx);src.start();src.stop(this.ctx.currentTime+dur);},
    ui(f=520){this.tone(f,.06,'square',.045)},tick(f=460,g=.015){this.tone(f,.04,'square',g)},boot(){this.tone(58,.8,'sawtooth',.16);this.tone(116,.55,'triangle',.09,.12);this.tone(232,.32,'sine',.075,.34);this.noise(.35,.05,1400)},scan(){for(let i=0;i<9;i++)this.tone(340+i*48,.055,'square',.034,i*.07)},confirm(){this.tone(520,.12,'triangle',.085);this.tone(780,.18,'sine',.075,.08);this.tone(1040,.16,'triangle',.045,.16)},lock(){this.tone(960,.06,'square',.075);this.tone(480,.18,'triangle',.09,.04);this.tone(120,.22,'sine',.08,.03)},shuffleStart(){this.noise(.5,.075,2200);this.tone(100,.5,'sawtooth',.065)},whoosh(){this.noise(.58,.14,3000);this.noise(.48,.07,800,'highpass');this.tone(145,.48,'sine',.08)},impact(mega=false){this.noise(mega?.88:.56,mega?.34:.27,600);this.noise(.19,.15,4200,'highpass');this.tone(mega?34:44,mega?.86:.62,'sine',mega?.38:.30);this.tone(88,.28,'sawtooth',.16);this.tone(176,.13,'square',.09,.02);this.tone(352,.08,'square',.05,.05)},explosion(){this.noise(.8,.3,850);this.tone(36,.8,'sine',.35);this.tone(72,.3,'sawtooth',.16);this.tone(144,.15,'square',.08,.04)},firework(){this.noise(.16,.085,2200);this.tone(740+Math.random()*520,.14,'triangle',.042)},spin(){for(let i=0;i<15;i++)this.tone(200+i*20,.04,'square',.024,i*.075)},brake(){this.tone(360,.14,'sawtooth',.11);this.tone(220,.2,'triangle',.1,.08);this.noise(.15,.07,1200)},wind(){this.noise(.9,.055,3000)},glitch(){for(let i=0;i<15;i++)this.tone(120+Math.random()*1000,.035,'square',.032,i*.04)},warning(){this.tone(180,.25,'square',.1);this.tone(180,.25,'square',.1,.36);this.tone(90,.5,'sine',.06)},error(){this.tone(230,.18,'sawtooth',.11);this.tone(170,.24,'sawtooth',.1,.13)},countdown(n){this.tone(n===1?590:430,.15,'square',.12);this.tone(70,.15,'sine',.11)},powerDown(){this.tone(180,.85,'sawtooth',.08);this.tone(75,.9,'sine',.08)},lightning(){this.noise(.65,.28,3600);this.noise(.85,.18,500);this.tone(48,.55,'sine',.28)},special(tier){if(tier.startsWith('ULTRA')){this.tone(210,.6,'sine',.13);this.tone(840,.55,'triangle',.08,.15);this.noise(.4,.08,2600)}else{this.tone(660,.14,'triangle',.09);this.tone(990,.2,'sine',.08,.1)}},battleStart(){this.tone(92,.42,'sawtooth',.1);this.tone(184,.2,'square',.065,.18)},hit(){this.noise(.13,.12,900);this.tone(68,.18,'sine',.14);this.tone(240,.06,'square',.06)},raceStart(){for(let i=0;i<4;i++)this.tone(280+i*100,.08,'square',.06,i*.12)},eliminate(){this.tone(180,.12,'sawtooth',.07);this.noise(.08,.04,900)},pinball(){this.tone(880,.08,'sine',.065);this.tone(1320,.07,'triangle',.045,.08)},heartbeat(long=false){this.stopHeartbeat();this.ensure();let count=0;this.heartbeatTimer=setInterval(()=>{if(!state.soundOn)return;this.tone(52,.12,'sine',.18);this.tone(43,.13,'sine',.12,.17);if(!long&&++count>10)this.stopHeartbeat()},500)},stopHeartbeat(){if(this.heartbeatTimer){clearInterval(this.heartbeatTimer);this.heartbeatTimer=null}},finalRise(big=false){for(let i=0;i<(big?11:8);i++)this.tone(105*Math.pow(1.085,i),.45,'triangle',.04,i*.14,'music')},victorySting(){[523,659,784].forEach((f,i)=>this.tone(f,.28,'triangle',.08,i*.08));this.tone(64,.42,'sine',.12)},victory(){this.stopHeartbeat();[523.25,659.25,783.99,1046.5].forEach((f,i)=>this.tone(f,.55,'triangle',.09,i*.14));this.tone(52,.9,'sine',.16);this.noise(.35,.06,1800)},
    stopBgm(){if(this.bgmTimer){clearInterval(this.bgmTimer);this.bgmTimer=null;}if(this.customEl){this.customEl.pause();}this.externalPausedByUser=false;if(els.bgmPlayButton)els.bgmPlayButton.textContent='PLAY BGM';},
    startBgm(mode='draw'){if(!state.soundOn)return;if(this.playlist.length){if(!this.customEl)this.createExternal(this.playlistIndex,true);else if(this.customEl.paused&&!this.externalPausedByUser)this.customEl.play().catch(()=>{});return;}if(this.bgmTimer){clearInterval(this.bgmTimer);this.bgmTimer=null;}this.ensure();const configs={intro:{seq:[110,138.6,164.8,196],tempo:500,gain:.038},draw:{seq:[82.4,110,123.5,146.8,164.8,146.8],tempo:360,gain:.04},final:{seq:[73.4,82.4,110,130.8,146.8,174.6],tempo:270,gain:.052}};const c=configs[mode]||configs.draw;let i=0;this.bgmTimer=setInterval(()=>{const f=c.seq[i++%c.seq.length];this.tone(f,.3,'triangle',c.gain,0,'music');this.tone(f/2,.42,'sine',c.gain*.8,0,'music');if(i%4===0)this.tone(f*2,.12,'square',c.gain*.24,0,'music')},c.tempo);}
  };

  function roundRect(ctx,x,y,w,h,r){const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();}

  function downloadResultImage() {
    if(!state.assignment.size){els.setupMessage.textContent='저장할 자리배정 결과가 없습니다.';return;}
    const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;const ctx=canvas.getContext('2d');
    const grad=ctx.createRadialGradient(960,420,100,960,420,1050);grad.addColorStop(0,'#111423');grad.addColorStop(.42,'#07080d');grad.addColorStop(1,'#020203');ctx.fillStyle=grad;ctx.fillRect(0,0,1920,1080);
    ctx.fillStyle='#f7f8fc';ctx.font='900 42px system-ui, sans-serif';ctx.fillText('SEAT ASSIGNMENT',90,78);ctx.fillStyle='#7d8290';ctx.font='700 18px system-ui, sans-serif';ctx.fillText(`${state.rows} × ${state.cols}  //  ${roster().length} STUDENTS`,90,112);
    const marginX=90,top=175,bottom=80,boardH=54,gap=14;const areaW=1920-marginX*2,areaH=1080-top-bottom;ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=2;roundRect(ctx,560,top,800,boardH,12);ctx.stroke();ctx.fillStyle='#a0a4ae';ctx.textAlign='center';ctx.font='900 18px system-ui, sans-serif';ctx.fillText('BLACKBOARD',960,top+34);ctx.textAlign='left';
    const gridTop=top+boardH+30,gridH=areaH-boardH-30;const cellW=(areaW-gap*(state.cols-1))/state.cols,cellH=(gridH-gap*(state.rows-1))/state.rows;const lockMap=lockBySeat();
    for(const id of seatIds()){const {row,col}=seatRC(id),x=marginX+(col-1)*(cellW+gap),y=gridTop+(row-1)*(cellH+gap);if(state.inactive.has(id)){ctx.save();ctx.globalAlpha=.08;ctx.strokeStyle='#ffffff';ctx.setLineDash([8,8]);roundRect(ctx,x,y,cellW,cellH,14);ctx.stroke();ctx.restore();continue;}const person=state.assignment.get(id)||lockMap.get(id)||'';const color=person?colorForName(person):'#777b85';ctx.fillStyle='#090a0f';roundRect(ctx,x,y,cellW,cellH,14);ctx.fill();ctx.strokeStyle=person?color:'rgba(255,255,255,.16)';ctx.lineWidth=person?3:1.5;ctx.stroke();ctx.fillStyle='#858995';ctx.font=`800 ${Math.max(13,Math.min(20,cellH*.13))}px system-ui, sans-serif`;ctx.fillText(`SEAT ${String(id).padStart(2,'0')}`,x+16,y+26);ctx.fillStyle=person?'#ffffff':'#555966';ctx.textAlign='center';const fs=Math.max(22,Math.min(56,cellH*.42,cellW/(Math.max(3,person.length)*.72)));ctx.font=`1000 ${fs}px system-ui, sans-serif`;ctx.fillText(person||'',x+cellW/2,y+cellH*.66);ctx.textAlign='left';}
    ctx.fillStyle='#5d626e';ctx.font='700 14px system-ui, sans-serif';ctx.fillText('SEAT // CINEMATIC DRAW V8',90,1040);
    canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');const now=new Date();a.href=url;a.download=`SEAT_DRAW_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}.png`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);},'image/png');
  }

  els.lockButton.addEventListener('click',()=>{const name=els.lockStudent.value,seat=Number(els.lockSeat.value);if(!name||!seat)return;for(const[other,s]of[...state.locks])if(other===name||s===seat)state.locks.delete(other);state.locks.set(name,seat);renderAllSetup();audio.ensure();audio.lock();});
  els.rosterInput.addEventListener('input',renderAllSetup);els.rowInput.addEventListener('change',syncDimensions);els.colInput.addEventListener('change',syncDimensions);
  els.volumeInput.addEventListener('input',()=>{const v=clamp(Number(els.volumeInput.value),0,100);els.volumeValue.textContent=`${v}%`;state.volume=v/100;audio.setVolume(state.volume);});

  function initBgmLibrary(){
    if(!els.bgmLibrarySelect)return;const lib=Array.isArray(window.SEAT_BGM_LIBRARY)?window.SEAT_BGM_LIBRARY.filter(t=>t&&t.src):[];els.bgmLibrarySelect.innerHTML='';
    if(lib.length){const auto=document.createElement('option');auto.value='__playlist__';auto.textContent=`AUTO PLAYLIST · ${lib.length} TRACK${lib.length===1?'':'S'}`;els.bgmLibrarySelect.appendChild(auto);audio.setPlaylist(lib,'AUTO PLAYLIST');state.bgmMode='playlist';}
    const synth=document.createElement('option');synth.value='__synth__';synth.textContent='BUILT-IN SYNTH BGM';els.bgmLibrarySelect.appendChild(synth);lib.forEach((track,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=track.title||`TRACK ${i+1}`;els.bgmLibrarySelect.appendChild(o);});if(!lib.length){els.bgmLibrarySelect.value='__synth__';audio.setPlaylist([],'BUILT-IN SYNTH BGM');state.bgmMode='synth';}
  }
  initBgmLibrary();
  if(els.bgmLibrarySelect)els.bgmLibrarySelect.addEventListener('change',()=>{const v=els.bgmLibrarySelect.value,lib=(window.SEAT_BGM_LIBRARY||[]).filter(t=>t&&t.src);audio.stopBgm();if(v==='__playlist__'){audio.setPlaylist(lib,'AUTO PLAYLIST');state.bgmMode='playlist';}else if(v==='__synth__'){audio.setPlaylist([],'BUILT-IN SYNTH BGM');state.bgmMode='synth';els.bgmFileName.textContent='BUILT-IN SYNTH BGM';}else{const t=lib[Number(v)];if(t){audio.setPlaylist([t],t.title||t.src);state.bgmMode='single';}}});
  if(els.bgmFileInput)els.bgmFileInput.addEventListener('change',()=>{const files=els.bgmFileInput.files;if(!files||!files.length)return;audio.stopBgm();audio.loadCustomFiles(files);state.bgmMode='temp';if(els.bgmLibrarySelect)els.bgmLibrarySelect.value='';});
  if(els.bgmPlayButton)els.bgmPlayButton.addEventListener('click',()=>{if(!audio.toggleCustomPreview())els.setupMessage.textContent='BGM LIBRARY에 곡을 넣거나 TEMP FILE을 불러오세요.';});
  if(els.pairModeToggle)els.pairModeToggle.addEventListener('change',()=>{state.pairMode=els.pairModeToggle.checked;if(state.pairMode&&state.cols%2===1){state.cols=Math.min(10,state.cols+1);els.colInput.value=state.cols;}renderAllSetup();audio.ui();});
  if(els.avoidPairHistoryToggle)els.avoidPairHistoryToggle.addEventListener('change',()=>{state.avoidPairHistory=els.avoidPairHistoryToggle.checked;parsePairHistory();try{localStorage.setItem('seatAvoidPairHistory',state.avoidPairHistory?'1':'0');}catch(_){}});
  if(els.pairHistoryInput)els.pairHistoryInput.addEventListener('input',()=>{parsePairHistory();try{localStorage.setItem('seatPairHistory',els.pairHistoryInput.value);}catch(_){}});
  els.startButton.addEventListener('click',runDraw);els.skipButton.addEventListener('click',()=>{state.skip=true;audio.stopHeartbeat();audio.stopBgm();});
  els.downloadButton.addEventListener('click',downloadResultImage);
  els.backButton.addEventListener('click',async()=>{if(state.running)return;audio.stopBgm();audio.stopHeartbeat();clearTransient();try{if(document.fullscreenElement)await document.exitFullscreen();}catch(_){ }els.cinemaView.hidden=true;els.setupView.removeAttribute('aria-hidden');els.cinemaClassroom.classList.remove('focus','assignment-focus','final-view');els.finalBadge.hidden=true;els.backButton.hidden=true;els.downloadButton.hidden=true;els.skipButton.hidden=false;setProgress(0);setEvent('SEAT ASSIGNMENT SYSTEM','READY');renderAllSetup();});
  els.soundButton.addEventListener('click',()=>{state.soundOn=!state.soundOn;els.soundButton.textContent=state.soundOn?'SOUND ON':'SOUND OFF';if(state.soundOn){audio.ensure();audio.setVolume(state.volume);audio.ui();if(state.running)audio.startBgm('draw');}else{audio.stopBgm();audio.stopHeartbeat();if(audio.master)audio.master.gain.value=0;if(audio.customEl)audio.customEl.pause();}});
  window.addEventListener('resize',resizeCanvas);

  try{if(els.pairHistoryInput)els.pairHistoryInput.value=localStorage.getItem('seatPairHistory')||'';if(els.avoidPairHistoryToggle){state.avoidPairHistory=localStorage.getItem('seatAvoidPairHistory')==='1';els.avoidPairHistoryToggle.checked=state.avoidPairHistory;}}catch(_){ }
  renderAllSetup();els.volumeValue.textContent=`${Math.round(state.volume*100)}%`;resizeCanvas();state.raf=requestAnimationFrame(fxLoop);
})();
