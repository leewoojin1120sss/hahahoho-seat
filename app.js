(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const COLORS = ['#36e7ff','#ff3bd4','#8b5cff','#b8ff45','#ff8a34','#ffe55d','#52f5a4','#4d7cff','#ff3f5f'];
  const EVENT_POOL = ['drop','slot','laser','cards','rain','glitch','countdown','rgb','lightning','battle','race','dart','spotlight','elimination','pinball','conveyor','meteor','tug','sprint','rocket','penalty','archery','sumo','boat','rps','poker','baseball','dice','bomb','throne','bowling','basketball','cannon','treasure','tournament','curling','stocks','batting','tank','cooking'];
  const GAME_ARCHIVE = [
    ['drop','NAME DROP','REVEAL','1P','Name falls into the selected seat.'],
    ['slot','SLOT MACHINE','LUCK','1P','Slot reels lock onto the seat.'],
    ['laser','LASER LOCK','REVEAL','1P','Scanning laser targets the destination.'],
    ['cards','CARD SHUFFLE','LUCK','1P','Cards shuffle and reveal the seat.'],
    ['rain','NUMBER STORM','REVEAL','1P','Seat numbers flood the screen.'],
    ['glitch','GLITCH DRAW','REVEAL','1P','Digital interference resolves the result.'],
    ['countdown','COUNTDOWN','REVEAL','1P','A tense countdown reveals the seat.'],
    ['rgb','RGB PULSE','REVEAL','1P','RGB flashes lock the assignment.'],
    ['lightning','LIGHTNING','REVEAL','1P','A lightning strike marks the seat.'],
    ['battle','HP BATTLE','DUEL','2P','Random HP combat with hits and criticals.'],
    ['race','HORSE RACE','RACE','2-4P','Racers cross a visible finish line.'],
    ['dart','DART BOARD','PRECISION','1P','A dart lands on the target seat sector.'],
    ['spotlight','SPOTLIGHT','REVEAL','1P','The classroom is searched by spotlight.'],
    ['elimination','ELIMINATION','SURVIVAL','2-4P','Candidates are removed until one remains.'],
    ['pinball','PINBALL','LUCK','1P','A pinball ricochets toward the seat.'],
    ['conveyor','CONVEYOR','LUCK','1P','Seat candidates pass along a conveyor.'],
    ['meteor','METEOR','REVEAL','1P','A meteor impact confirms the assignment.'],
    ['tug','TUG OF WAR','DUEL','2P','The rope shifts dynamically before a winner.'],
    ['sprint','SPRINT','RACE','2-4P','Short track race with a real finish.'],
    ['rocket','ROCKET RACE','RACE','2-4P','Rockets race through boost zones.'],
    ['penalty','PENALTY SHOOTOUT','SCORE','2P','Goals, saves and misses decide the result.'],
    ['archery','ARCHERY','SCORE','2P','Hit position determines the score.'],
    ['sumo','SUMO','DUEL','2P','Two competitors clash in the ring.'],
    ['boat','BOAT RACE','RACE','2-4P','Boats race to the finish line.'],
    ['rps','ROCK PAPER SCISSORS','DUEL','2P','Best-of-three hands generated each match.'],
    ['poker','POKER','CARD','2P','Real shuffled deck and evaluated hands.'],
    ['baseball','HOME RUN DERBY','SCORE','2P','Home runs and outs decide the derby.'],
    ['dice','DICE DUEL','SCORE','2P','Two dice per round, best of three.'],
    ['bomb','BOMB PASS','SURVIVAL','2-4P','Pass the bomb until one player is safe.'],
    ['throne','THRONE CLASH','SCORE','2-4P','Round points determine who claims the crown.'],
    ['bowling','BOWLING','SCORE','2-4P','Two visible lane rolls with falling pins.'],
    ['basketball','FREE THROW','SCORE','2-4P','Five clearly animated free throws each.'],
    ['cannon','CANNON DUEL','DUEL','2P','Ships trade broadsides until one sinks.'],
    ['treasure','TREASURE HUNT','LUCK','2-4P','Chests reveal randomized gold totals.'],
    ['tournament','FINAL FOUR','TOURNAMENT','4P','Two semifinals lead into a championship.'],
    ['curling','CURLING','PRECISION','2-4P','Three stones each score by distance to center.'],
    ['stocks','STOCK MARKET','SCORE','2-4P','Random market paths race to the closing bell.'],
    ['batting','BATTING CLASH','SCORE','2-4P','Three animated at-bats with live base running.'],
    ['tank','TANK BATTLE','DUEL','2P','Turn-based shell hits reduce visible HP.'],
    ['cooking','COOK-OFF','SCORE','2-4P','Prep, cook, plate and judge each dish.']
  ];
  const SWAP_POOL = ['cross','portal','orbit','warp'];
  const LOW_POWER = (navigator.hardwareConcurrency || 8) <= 4 || Math.min(window.innerWidth, window.innerHeight) < 700;
  const PARTICLE_CAP = LOW_POWER ? 440 : 920;
  const FX_SCALE = LOW_POWER ? .64 : 1;
  const MAX_GAME_PLAYERS = 4;

  const els = {
    setupView: $('#setupView'), cinemaView: $('#cinemaView'), cinemaStage: $('#cinemaStage'),
    rosterInput: $('#rosterInput'), studentCount: $('#studentCount'), rowInput: $('#rowInput'), colInput: $('#colInput'),
    layoutEditor: $('#layoutEditor'), activeSeatCount: $('#activeSeatCount'), lockStudent: $('#lockStudent'), lockSeat: $('#lockSeat'),
    lockButton: $('#lockButton'), lockList: $('#lockList'), lockCount: $('#lockCount'), launchStudentCount: $('#launchStudentCount'), pairModeToggle: $('#pairModeToggle'), avoidPairHistoryToggle: $('#avoidPairHistoryToggle'), pairHistoryInput: $('#pairHistoryInput'), pairHistoryCount: $('#pairHistoryCount'), pairStatus: $('#pairStatus'), launchPairMode: $('#launchPairMode'),
    launchLockCount: $('#launchLockCount'), startButton: $('#startButton'), setupMessage: $('#setupMessage'), volumeInput: $('#volumeInput'), sfxVolumeInput: $('#sfxVolumeInput'),
    volumeValue: $('#volumeValue'), sfxVolumeValue: $('#sfxVolumeValue'), bgmLibrarySelect: $('#bgmLibrarySelect'), bgmFileInput: $('#bgmFileInput'), bgmPlayButton: $('#bgmPlayButton'), bgmFileName: $('#bgmFileName'), fxCanvas: $('#fxCanvas'), phaseLabel: $('#phaseLabel'), remainingLabel: $('#remainingLabel'),
    cinemaClassroom: $('#cinemaClassroom'), cinemaSeats: $('#cinemaSeats'), eventLayer: $('#eventLayer'), eventEyebrow: $('#eventEyebrow'),
    eventTitle: $('#eventTitle'), eventSub: $('#eventSub'), eventAux: $('#eventAux'), specialBanner: $('#specialBanner'),
    specialTier: $('#specialTier'), specialText: $('#specialText'), seatSpotlight: $('#seatSpotlight'), seatBeam: $('#seatBeam'),
    dropName: $('#dropName'), waveLayer: $('#waveLayer'), numberRain: $('#numberRain'), cardField: $('#cardField'), slotField: $('#slotField'),
    finalDuel: $('#finalDuel'), battleField: $('#battleField'), raceField: $('#raceField'), eliminationField: $('#eliminationField'),
    conveyorField: $('#conveyorField'), rouletteField: $('#rouletteField'), tugField: $('#tugField'), sprintField: $('#sprintField'), rocketField: $('#rocketField'), penaltyField: $('#penaltyField'), swapField: $('#swapField'), pinballOrb: $('#pinballOrb'), finalBadge: $('#finalBadge'), cinemaProgress: $('#cinemaProgress'),
    soundButton: $('#soundButton'), downloadButton: $('#downloadButton'), backButton: $('#backButton'), skipButton: $('#skipButton'),
    archiveButton: $('#archiveButton'), archiveModal: $('#archiveModal'), archiveCloseButton: $('#archiveCloseButton'), archiveGrid: $('#archiveGrid')
  };

  const state = {
    rows: 5, cols: 6, inactive: new Set(), locks: new Map(), assignment: new Map(),
    running: false, skip: false, soundOn: true, volume: .72, sfxVolume: 1.05, completed: false, pairMode: false, avoidPairHistory: false, pairHistory: new Set(),
    lastEvent: null, eventQueue: [], particles: [], raf: null, currentColor: COLORS[0], swapCount: 0, chaosCount: 0, customBgmName: '', customBgmSrc: '', bgmMode: 'synth', bgmSelection: '__synth__', bgmResumeTime: 0, bgmResumeIndex: 0, bgmWasPlaying: false
  };

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, state.skip ? 0 : ms));
  const roster = () => els.rosterInput.value.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
  const seatIds = () => Array.from({length: state.rows * state.cols}, (_, i) => i + 1);
  const activeSeats = () => seatIds().filter(id => !state.inactive.has(id));
  const lockBySeat = () => new Map([...state.locks.entries()].map(([name, seat]) => [seat, name]));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const pad = (n) => String(n).padStart(2, '0');
  const STORAGE_KEY = 'seatDrawPersistentV12';
  let persistTimer = null;

  function savePersistentState(){
    try{
      const music={
        selection: state.bgmSelection || (els.bgmLibrarySelect ? els.bgmLibrarySelect.value : '__synth__'),
        mode: state.bgmMode,
        index: audio ? (audio.playlistIndex || 0) : 0,
        time: audio && audio.customEl && Number.isFinite(audio.customEl.currentTime) ? audio.customEl.currentTime : (state.bgmResumeTime || 0),
        wasPlaying: !!(audio && audio.customEl && !audio.customEl.paused && !audio.customEl.ended)
      };
      localStorage.setItem(STORAGE_KEY,JSON.stringify({
        version:12,
        roster: els.rosterInput ? els.rosterInput.value : '',
        rows: state.rows, cols: state.cols,
        inactive:[...state.inactive], locks:[...state.locks.entries()],
        pairMode:!!state.pairMode, avoidPairHistory:!!state.avoidPairHistory,
        pairHistoryText:els.pairHistoryInput?els.pairHistoryInput.value:'',
        bgmVolume:state.volume, sfxVolume:state.sfxVolume, soundOn:!!state.soundOn,
        music
      }));
    }catch(_){ }
  }
  function queuePersistentSave(){clearTimeout(persistTimer);persistTimer=setTimeout(savePersistentState,120);}
  function loadPersistentState(){
    let data=null;try{data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');}catch(_){data=null;}
    if(data&&typeof data==='object'){
      if(typeof data.roster==='string'&&els.rosterInput)els.rosterInput.value=data.roster;
      state.rows=clamp(parseInt(data.rows||5,10),1,10);state.cols=clamp(parseInt(data.cols||6,10),1,10);
      state.inactive=new Set(Array.isArray(data.inactive)?data.inactive.map(Number).filter(Number.isFinite):[]);
      state.locks=new Map(Array.isArray(data.locks)?data.locks.map(([n,s])=>[String(n),Number(s)]):[]);
      state.pairMode=!!data.pairMode;if(state.pairMode&&state.cols%2===1)state.cols=Math.min(10,state.cols+1);
      state.avoidPairHistory=!!data.avoidPairHistory;
      if(els.rowInput)els.rowInput.value=state.rows;if(els.colInput)els.colInput.value=state.cols;
      if(els.pairModeToggle)els.pairModeToggle.checked=state.pairMode;if(els.avoidPairHistoryToggle)els.avoidPairHistoryToggle.checked=state.avoidPairHistory;
      if(els.pairHistoryInput&&typeof data.pairHistoryText==='string')els.pairHistoryInput.value=data.pairHistoryText;
      state.volume=clamp(Number(data.bgmVolume??.72),0,1);state.sfxVolume=clamp(Number(data.sfxVolume??1.05),0,1.2);state.soundOn=data.soundOn!==false;
      if(els.volumeInput)els.volumeInput.value=Math.round(state.volume*100);if(els.sfxVolumeInput)els.sfxVolumeInput.value=Math.round(state.sfxVolume*100);
      const m=data.music||{};state.bgmSelection=typeof m.selection==='string'?m.selection:'__synth__';state.bgmMode=typeof m.mode==='string'?m.mode:'synth';state.bgmResumeIndex=Math.max(0,parseInt(m.index||0,10)||0);state.bgmResumeTime=Math.max(0,Number(m.time)||0);state.bgmWasPlaying=!!m.wasPlaying;
      return true;
    }
    try{if(els.pairHistoryInput)els.pairHistoryInput.value=localStorage.getItem('seatPairHistory')||'';state.avoidPairHistory=localStorage.getItem('seatAvoidPairHistory')==='1';if(els.avoidPairHistoryToggle)els.avoidPairHistoryToggle.checked=state.avoidPairHistory;}catch(_){ }
    if(els.rowInput)els.rowInput.value='5';if(els.colInput)els.colInput.value='6';return false;
  }
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

  const randInt = (min,max) => min + Math.floor(Math.random()*(max-min+1));
  const weightedPick = (items) => {
    const total=items.reduce((s,x)=>s+x[1],0);let r=Math.random()*total;
    for(const [value,w] of items){r-=w;if(r<=0)return value;}return items[items.length-1][0];
  };

  function generateRpsMatch() {
    const hands=['✊','✋','✌'];
    const beats=(a,b)=>(a==='✊'&&b==='✌')||(a==='✋'&&b==='✊')||(a==='✌'&&b==='✋');
    for(let attempt=0;attempt<100;attempt++){
      const rounds=[];let hero=0,opp=0;
      while(hero<2&&opp<2&&rounds.length<5){
        let h=pick(hands),o=pick(hands);while(o===h)o=pick(hands);
        const heroWin=beats(h,o);hero+=heroWin?1:0;opp+=heroWin?0:1;rounds.push({hero:h,opp:o,heroWin});
      }
      if(hero===2)return rounds;
    }
    return generateRpsMatch();
  }

  function generateDiceMatch() {
    for(let attempt=0;attempt<120;attempt++){
      const rounds=[];let hero=0,opp=0;
      while(hero<2&&opp<2&&rounds.length<5){
        let hv=[randInt(1,6),randInt(1,6)],ov=[randInt(1,6),randInt(1,6)],hs=hv[0]+hv[1],os=ov[0]+ov[1];
        if(hs===os)continue;const heroWin=hs>os;hero+=heroWin?1:0;opp+=heroWin?0:1;rounds.push({hero:hv,opp:ov,heroWin});
      }
      if(hero===2)return rounds;
    }
    return generateDiceMatch();
  }

  function randomArcheryShot() {
    const angle=Math.random()*Math.PI*2;
    const radius=Math.min(46,Math.pow(Math.random(),1.55)*46);
    const x=50+Math.cos(angle)*radius,y=50+Math.sin(angle)*radius;
    const score=radius<=7?10:radius<=15?9:radius<=23?8:radius<=31?7:radius<=39?6:5;
    return {x:+x.toFixed(1),y:+y.toFixed(1),score};
  }
  function generateArcheryMatch() {
    for(let attempt=0;attempt<120;attempt++){
      const hero=Array.from({length:3},randomArcheryShot),opp=Array.from({length:3},randomArcheryShot);
      const hs=hero.reduce((s,x)=>s+x.score,0),os=opp.reduce((s,x)=>s+x.score,0);
      if(hs>os)return {hero,opp};
    }
    return generateArcheryMatch();
  }

  function randomPkOutcome(){return weightedPick([['goal',.62],['save',.23],['miss',.15]]);}
  function generatePkMatch(){
    for(let attempt=0;attempt<150;attempt++){
      const hero=Array.from({length:5},randomPkOutcome),opp=Array.from({length:5},randomPkOutcome);
      const hg=hero.filter(x=>x==='goal').length,og=opp.filter(x=>x==='goal').length;
      if(hg>og)return {hero,opp,sudden:[]};
      if(hg===og){
        const sudden=[];
        for(let sd=0;sd<6;sd++){
          const h=randomPkOutcome(),o=randomPkOutcome();sudden.push({hero:h,opp:o});
          if((h==='goal')!==(o==='goal')){if(h==='goal')return {hero,opp,sudden};break;}
        }
      }
    }
    return generatePkMatch();
  }

  function generateBaseballMatch(){
    for(let attempt=0;attempt<150;attempt++){
      const hero=Array.from({length:3},()=>Math.random()<.48?'HR':'OUT');
      const opp=Array.from({length:3},()=>Math.random()<.48?'HR':'OUT');
      const hs=hero.filter(x=>x==='HR').length,os=opp.filter(x=>x==='HR').length;
      if(hs>os)return {hero,opp,bonus:[]};
      if(hs===os){
        const bonus=[];
        for(let i=0;i<5;i++){
          const h=Math.random()<.48?'HR':'OUT',o=Math.random()<.48?'HR':'OUT';bonus.push({hero:h,opp:o});
          if(h!==o){if(h==='HR')return {hero,opp,bonus};break;}
        }
      }
    }
    return generateBaseballMatch();
  }

  const POKER_RANKS='23456789TJQKA'.split('');
  const POKER_SUITS=['♠','♥','♦','♣'];
  const pokerDeck=()=>POKER_SUITS.flatMap(s=>POKER_RANKS.map((r,i)=>({r,s,v:i+2})));
  function pokerEval5(cards){
    const vals=cards.map(c=>c.v).sort((a,b)=>b-a),counts=new Map();for(const v of vals)counts.set(v,(counts.get(v)||0)+1);
    const groups=[...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0]);const flush=cards.every(c=>c.s===cards[0].s);
    const uniq=[...new Set(vals)];if(uniq[0]===14)uniq.push(1);let straightHigh=0;for(let i=0;i<=uniq.length-5;i++){if(uniq[i]-uniq[i+4]===4){straightHigh=uniq[i];break;}}
    let key,name;
    if(flush&&straightHigh){key=[8,straightHigh];name=straightHigh===14?'ROYAL FLUSH':`${POKER_RANKS[straightHigh-2]}-HIGH STRAIGHT FLUSH`;}
    else if(groups[0][1]===4){key=[7,groups[0][0],groups[1][0]];name=`FOUR OF A KIND · ${POKER_RANKS[groups[0][0]-2]}S`;}
    else if(groups[0][1]===3&&groups[1]&&groups[1][1]>=2){key=[6,groups[0][0],groups[1][0]];name=`FULL HOUSE`;}
    else if(flush){key=[5,...vals];name=`${POKER_RANKS[vals[0]-2]}-HIGH FLUSH`;}
    else if(straightHigh){key=[4,straightHigh];name=`${POKER_RANKS[straightHigh-2]}-HIGH STRAIGHT`;}
    else if(groups[0][1]===3){key=[3,groups[0][0],...groups.slice(1).map(g=>g[0]).sort((a,b)=>b-a)];name=`THREE OF A KIND`;}
    else if(groups[0][1]===2&&groups[1]&&groups[1][1]===2){const ps=[groups[0][0],groups[1][0]].sort((a,b)=>b-a),kick=groups.find(g=>g[1]===1)[0];key=[2,...ps,kick];name=`TWO PAIR`;}
    else if(groups[0][1]===2){key=[1,groups[0][0],...groups.slice(1).map(g=>g[0]).sort((a,b)=>b-a)];name=`PAIR OF ${POKER_RANKS[groups[0][0]-2]}S`;}
    else {key=[0,...vals];name=`${POKER_RANKS[vals[0]-2]}-HIGH`;}
    return {key,name};
  }
  function pokerCmp(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return d;}return 0;}
  function pokerBest7(cards){
    let best=null;for(let a=0;a<3;a++)for(let b=a+1;b<4;b++)for(let c=b+1;c<5;c++)for(let d=c+1;d<6;d++)for(let e=d+1;e<7;e++){
      const ev=pokerEval5([cards[a],cards[b],cards[c],cards[d],cards[e]]);if(!best||pokerCmp(ev.key,best.key)>0)best=ev;
    }return best;
  }
  function generatePokerMatch(){
    for(let attempt=0;attempt<200;attempt++){
      const deck=shuffle(pokerDeck()),hero=deck.slice(0,2),opp=deck.slice(2,4),board=deck.slice(4,9);const he=pokerBest7([...hero,...board]),oe=pokerBest7([...opp,...board]);
      if(pokerCmp(he.key,oe.key)>0)return {hero,opp,board,heroName:he.name,oppName:oe.name};
    }
    return generatePokerMatch();
  }


  function uniqueFeaturedWinner(players, featured, valueOf, build, attempts=360) {
    for(let attempt=0;attempt<attempts;attempt++){
      const data=build();
      const featuredValue=valueOf(data,featured);
      if(players.every(p=>p===featured || featuredValue>valueOf(data,p)))return data;
    }
    return uniqueFeaturedWinner(players,featured,valueOf,build,attempts);
  }

  function generateThroneMatch(players, featured, rounds) {
    return uniqueFeaturedWinner(players,featured,(d,p)=>d.scores.get(p),()=>{
      const gains=new Map(),scores=new Map(players.map(p=>[p,0]));
      players.forEach(p=>gains.set(p,Array.from({length:rounds},()=>randInt(1,6))));
      players.forEach(p=>scores.set(p,gains.get(p).reduce((a,b)=>a+b,0)));
      return {gains,scores};
    });
  }

  function randomBowlingRoll(){return weightedPick([[10,.18],[9,.16],[8,.17],[7,.15],[6,.12],[5,.09],[4,.06],[3,.035],[2,.025],[1,.01],[0,.005]]);}
  function generateBowlingMatch(players, featured) {
    return uniqueFeaturedWinner(players,featured,(d,p)=>d.scores.get(p),()=>{
      const rolls=new Map(),scores=new Map();
      players.forEach(p=>{const r=[randomBowlingRoll(),randomBowlingRoll()];rolls.set(p,r);scores.set(p,r[0]+r[1]);});
      return {rolls,scores};
    });
  }

  function generateBasketballMatch(players, featured) {
    return uniqueFeaturedWinner(players,featured,(d,p)=>d.scores.get(p),()=>{
      const sequences=new Map(),scores=new Map();
      players.forEach(p=>{const seq=Array.from({length:5},()=>Math.random()<.58);sequences.set(p,seq);scores.set(p,seq.filter(Boolean).length);});
      return {sequences,scores};
    });
  }

  function generateTreasureMatch(players, featured) {
    return uniqueFeaturedWinner(players,featured,(d,p)=>d.scores.get(p),()=>{
      const scores=new Map(players.map(p=>[p,randInt(8,100)]));return {scores};
    });
  }

  function generateCannonPlan(featured, opponent) {
    const players=[featured,opponent];
    for(let attempt=0;attempt<500;attempt++){
      const hp=new Map(players.map(p=>[p,100])),turns=[];let attacker=randomBool()?featured:opponent;
      for(let turn=0;turn<14;turn++){
        const defender=attacker===featured?opponent:featured,hit=Math.random()<.67,dmg=hit?randInt(13,31):0;
        if(hit)hp.set(defender,Math.max(0,hp.get(defender)-dmg));
        turns.push({attacker,defender,hit,dmg,hpAfter:hp.get(defender)});
        if(hp.get(defender)<=0)break;
        attacker=defender;
      }
      if(hp.get(opponent)<=0&&hp.get(featured)>0)return {turns,winner:featured};
    }
    return generateCannonPlan(featured,opponent);
  }

  function randomCurlingStone(){
    const angle=Math.random()*Math.PI*2,radius=Math.pow(Math.random(),1.28)*47;
    const x=50+Math.cos(angle)*radius,y=50+Math.sin(angle)*radius;
    const score=Math.max(0,Math.round(100-radius*1.82));
    return {x:+x.toFixed(1),y:+y.toFixed(1),score};
  }
  function generateCurlingMatch(players, featured) {
    return uniqueFeaturedWinner(players,featured,(d,p)=>d.scores.get(p),()=>{
      const stones=new Map(),scores=new Map();
      players.forEach(p=>{const ss=Array.from({length:3},randomCurlingStone);stones.set(p,ss);scores.set(p,ss.reduce((a,b)=>a+b.score,0));});
      return {stones,scores};
    });
  }

  function randomStockPath(){
    let price=100;const path=[price];
    const drift=(Math.random()-.5)*1.2,vol=2.6+Math.random()*3.6;
    for(let i=0;i<11;i++){
      const shock=Math.random()<.10?(Math.random()-.5)*18:0;
      price=clamp(price+drift+(Math.random()-.5)*vol*2+shock,38,185);
      path.push(+price.toFixed(1));
    }
    return path;
  }
  function generateStockMatch(players, featured) {
    return uniqueFeaturedWinner(players,featured,(d,p)=>d.paths.get(p).at(-1),()=>{
      const paths=new Map(players.map(p=>[p,randomStockPath()]));return {paths};
    });
  }

  const BATTING_OUTCOMES=[['OUT',.34,0],['1B',.28,1],['2B',.19,2],['3B',.06,3],['HR',.13,4]];
  function randomBattingOutcome(){const key=weightedPick(BATTING_OUTCOMES.map(([k,w])=>[k,w]));return BATTING_OUTCOMES.find(x=>x[0]===key);}
  function simulateBattingSequence(){
    let bases=[false,false,false],runs=0,outs=0,totalBases=0;const seq=[];
    for(let i=0;i<3;i++){
      const [label,,hitBases]=randomBattingOutcome();let runsOnPlay=0;
      if(label==='OUT'){outs++;}
      else{
        totalBases+=hitBases;
        if(hitBases===4){runsOnPlay=bases.filter(Boolean).length+1;bases=[false,false,false];}
        else{
          const next=[false,false,false];
          for(let b=2;b>=0;b--){if(!bases[b])continue;const dest=(b+1)+hitBases;if(dest>3)runsOnPlay++;else next[dest-1]=true;}
          next[hitBases-1]=true;bases=next;
        }
        runs+=runsOnPlay;
      }
      seq.push({label,hitBases,angle:randInt(-38,38),distance:label==='HR'?randInt(88,100):label==='OUT'?randInt(44,74):randInt(55,86),runsOnPlay,runs,outs,totalBases,basesAfter:[...bases]});
    }
    return {seq,runs,outs,totalBases,rank:runs*100+totalBases};
  }
  function generateBattingMatch(players, featured) {
    return uniqueFeaturedWinner(players,featured,(d,p)=>d.ranks.get(p),()=>{
      const atBats=new Map(),scores=new Map(),totalBases=new Map(),ranks=new Map();
      players.forEach(p=>{const sim=simulateBattingSequence();atBats.set(p,sim.seq);scores.set(p,sim.runs);totalBases.set(p,sim.totalBases);ranks.set(p,sim.rank);});
      return {atBats,scores,totalBases,ranks};
    });
  }

  function generateTankPlan(featured, opponent) {
    for(let attempt=0;attempt<500;attempt++){
      const hp=new Map([[featured,100],[opponent,100]]),turns=[];let attacker=randomBool()?featured:opponent;
      for(let t=0;t<16;t++){
        const defender=attacker===featured?opponent:featured,hit=Math.random()<.7,dmg=hit?randInt(12,29):0,crit=hit&&Math.random()<.12;
        const finalDmg=crit?Math.min(38,dmg+randInt(6,12)):dmg;
        if(hit)hp.set(defender,Math.max(0,hp.get(defender)-finalDmg));
        turns.push({attacker,defender,hit,dmg:finalDmg,crit,hpAfter:hp.get(defender),arc:.35+Math.random()*.45});
        if(hp.get(defender)<=0)break;attacker=defender;
      }
      if(hp.get(opponent)<=0&&hp.get(featured)>0)return {turns,winner:featured};
    }
    return generateTankPlan(featured,opponent);
  }

  const DISHES=['PASTA','STEAK','CURRY','RISOTTO','RAMEN','TACOS','OMELETTE','PAELLA'];
  function generateCookingMatch(players, featured) {
    return uniqueFeaturedWinner(players,featured,(d,p)=>d.totals.get(p),()=>{
      const scores=new Map(),totals=new Map(),dishes=new Map();
      players.forEach(p=>{
        const rounds=[randInt(55,100),randInt(55,100),randInt(55,100)];scores.set(p,rounds);totals.set(p,rounds.reduce((a,b)=>a+b,0));dishes.set(p,pick(DISHES));
      });
      return {scores,totals,dishes};
    });
  }


  function generateRacePaths(players, featured, steps=46) {
    for(let attempt=0;attempt<500;attempt++){
      const paths=new Map(),finals=new Map();
      players.forEach(p=>{
        let total=0;const base=.86+Math.random()*.34,surgeAt=randInt(Math.floor(steps*.25),Math.floor(steps*.82)),surge=.15+Math.random()*.38,vals=[];
        for(let i=0;i<steps;i++){
          const stumble=Math.random()<.035?-.28:0,burst=(i>=surgeAt&&i<surgeAt+randInt(3,8))?surge:0;
          total+=Math.max(.25,base+(Math.random()-.5)*.62+burst+stumble);vals.push(total);
        }
        paths.set(p,vals);finals.set(p,total);
      });
      if(players.every(p=>p===featured||finals.get(featured)>finals.get(p)))return {paths,finals};
    }
    return generateRacePaths(players,featured,steps);
  }

  function generateHpDuelPlan(featured, opponent) {
    for(let attempt=0;attempt<600;attempt++){
      const hp=new Map([[featured,100],[opponent,100]]),turns=[];let attacker=randomBool()?featured:opponent;
      for(let t=0;t<18;t++){
        const defender=attacker===featured?opponent:featured,hit=Math.random()<.84,crit=hit&&Math.random()<.10,dmg=hit?randInt(9,22)+(crit?randInt(5,10):0):0;
        if(hit)hp.set(defender,Math.max(0,hp.get(defender)-dmg));turns.push({attacker,defender,hit,crit,dmg,hpAfter:hp.get(defender)});if(hp.get(defender)<=0)break;attacker=defender;
      }
      if(hp.get(opponent)<=0&&hp.get(featured)>0)return {turns,winner:featured};
    }
    return generateHpDuelPlan(featured,opponent);
  }

  function generateBombOrder(players, featured){
    for(let attempt=0;attempt<100;attempt++){const order=shuffle(players);if(order.at(-1)===featured)return order;}return generateBombOrder(players,featured);
  }

  function generateTugPath(heroLeft, steps=28){
    const wanted=heroLeft?-1:1;
    for(let attempt=0;attempt<500;attempt++){
      let pull=0;const path=[];const drift=(Math.random()-.5)*2.2;
      for(let i=0;i<steps;i++){pull=clamp(pull+(Math.random()-.5)*28+drift,-128,128);path.push(pull);}
      if(Math.sign(path.at(-1))===wanted&&Math.abs(path.at(-1))>42)return path;
    }
    return generateTugPath(heroLeft,steps);
  }

  function generateTournamentPlan(players, featured){
    for(let attempt=0;attempt<500;attempt++){
      const seeded=shuffle(players),semiPairs=[[seeded[0],seeded[1]],[seeded[2],seeded[3]]],semis=[];
      for(const [a,b] of semiPairs){let as=randInt(1,9),bs=randInt(1,9);while(as===bs)bs=randInt(1,9);semis.push({a,b,as,bs,winner:as>bs?a:b});}
      let a=semis[0].winner,b=semis[1].winner,as=randInt(1,9),bs=randInt(1,9);while(as===bs)bs=randInt(1,9);const final={a,b,as,bs,winner:as>bs?a:b};
      if(final.winner===featured)return {seeded,semis,final};
    }
    return generateTournamentPlan(players,featured);
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
    renderAllSetup(); queuePersistentSave();
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
        rm.addEventListener('click', () => { state.locks.delete(name); renderAllSetup(); queuePersistentSave(); audio.ui(280); });
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
      case 'bomb': await eventBomb(name,seat,availableSeats,studentPool); break;
      case 'throne': await eventThrone(name,seat,availableSeats,studentPool); break;
      case 'bowling': await eventBowling(name,seat,availableSeats,studentPool); break;
      case 'basketball': await eventBasketball(name,seat,availableSeats,studentPool); break;
      case 'cannon': await eventCannon(name,seat,availableSeats,studentPool); break;
      case 'treasure': await eventTreasure(name,seat,availableSeats,studentPool); break;
      case 'tournament': await eventTournament(name,seat,availableSeats,studentPool); break;
      case 'curling': await eventCurling(name,seat,availableSeats,studentPool); break;
      case 'stocks': await eventStocks(name,seat,availableSeats,studentPool); break;
      case 'batting': await eventBatting(name,seat,availableSeats,studentPool); break;
      case 'tank': await eventTank(name,seat,availableSeats,studentPool); break;
      case 'cooking': await eventCooking(name,seat,availableSeats,studentPool); break;
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
    const stack=document.createElement('div');stack.className='card-stack card-stack-v10';
    const cards=candidates.map((n,i)=>{const c=document.createElement('div');c.className='draw-card draw-card-v10';c.innerHTML='<span class="card-back-mark">?</span>';c.dataset.seat=n;c.style.setProperty('--home-x',`${(i-(candidates.length-1)/2)*8.4}vw`);c.style.setProperty('--r',`${(i-(candidates.length-1)/2)*2.2}deg`);stack.appendChild(c);return c;});
    els.cardField.appendChild(stack);els.cardField.classList.add('active-layer');audio.shuffleStart();await wait(500);
    for(let r=0;r<6;r++){cards.forEach(c=>{c.style.setProperty('--shuffle-x',`${(Math.random()-.5)*34}vw`);c.style.setProperty('--shuffle-y',`${(Math.random()-.5)*24}vh`);c.style.setProperty('--r',`${(Math.random()-.5)*34}deg`)});await wait(330);}cards.forEach(c=>{c.style.setProperty('--shuffle-x','0px');c.style.setProperty('--shuffle-y','0px')});await wait(500);
    const chosen=cards.find(c=>Number(c.dataset.seat)===seat)||cards[0];cards.filter(c=>c!==chosen).forEach(c=>c.classList.add('card-discard-v10'));await wait(380);
    chosen.style.setProperty('--home-x','0px');chosen.style.setProperty('--shuffle-x','0px');chosen.style.setProperty('--shuffle-y','0px');chosen.style.setProperty('--r','0deg');chosen.innerHTML=`<span class="card-seat-word">SEAT</span><strong class="card-seat-number">${pad(seat)}</strong>`;chosen.classList.add('card-chosen-v10');audio.lock();fireworks(4,state.currentColor);screenImpact();await wait(1250);
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
    const opponents=studentPool.filter(n=>n!==name);if(!opponents.length){await eventLaser(name,seat,pool);return;}const opponent=pick(opponents),duel=duelOrder(name,opponent),plan=generateHpDuelPlan(name,opponent),heroColor=colorForName(name);setEventColor(heroColor);setEvent('BATTLE EVENT','FIGHT');hideEventLayer();
    const fighter=(n,c,side)=>{const d=document.createElement('div');d.className=`fighter-card fighter-${side}`;d.style.setProperty('--fighter-color',c);d.innerHTML=`<div class="fighter-tag">${side==='left'?'PLAYER 1':'PLAYER 2'}</div><div class="fighter-avatar"><i class="head"></i><i class="body"></i><i class="arm a1"></i><i class="arm a2"></i><i class="leg l1"></i><i class="leg l2"></i></div><div class="fighter-name">${escapeHtml(n)}</div><div class="hp-readout"><span>HP</span><b>100</b></div><div class="hp"><i></i></div>`;return d;};
    const left=fighter(duel.leftName,colorForName(duel.leftName),'left'),right=fighter(duel.rightName,colorForName(duel.rightName),'right'),vs=document.createElement('div');vs.className='battle-vs';vs.textContent='VS';els.battleField.append(left,vs,right);els.battleField.classList.add('active-layer');audio.battleStart();await wait(1300);const cardFor=p=>p===duel.leftName?left:right;
    for(const turn of plan.turns){const att=cardFor(turn.attacker),def=cardFor(turn.defender);att.classList.add('attack');if(turn.hit){def.classList.add('hit');def.querySelector('.hp i').style.width=`${turn.hpAfter}%`;def.querySelector('.hp-readout b').textContent=turn.hpAfter;audio.hit();particlesBurst(def===left?.32:.68,.48,turn.crit?42:26,colorForName(turn.attacker),turn.crit?.9:.6);if(turn.crit)screenImpact();}else{audio.whoosh();}await wait(520);att.classList.remove('attack');def.classList.remove('hit');if(turn.hpAfter<=0){def.classList.add('knockout');audio.explosion();screenImpact();await wait(650);break;}await wait(220);}
    const heroCard=cardFor(name);heroCard.classList.add('winner');particlesBurst(duel.heroLeft?.68:.32,.48,140,heroColor,1.6);fireworks(5,heroColor);audio.victorySting();await wait(1250);els.battleField.classList.remove('active-layer');setEvent('WINNER',name);await wait(650);for(const s of shuffle(pool).slice(0,Math.min(10,pool.length))){seatPulse(s);await wait(105)}setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventRace(name, seat, pool, studentPool) {
    const others=shuffle(studentPool.filter(n=>n!==name)).slice(0,3),racers=shuffle([name,...others]);if(racers.length<2){await eventPinball(name,seat,pool);return;}const match=generateRacePaths(racers,name,48);setEvent('HORSE RACE','RACE');hideEventLayer();const title=document.createElement('div');title.className='race-title';title.textContent='GRAND SEAT DERBY';els.raceField.appendChild(title);
    const maxFinal=Math.max(...[...match.finals.values()]);const laneData=racers.map((r,idx)=>{const lane=document.createElement('div');lane.className='race-lane';lane.style.setProperty('--racer-color',colorForName(r));lane.innerHTML=`<div class="race-lane-no">${idx+1}</div><div class="race-track"><i class="finish-line"></i><i class="race-start-line"></i></div><div class="horse"><span class="horse-icon">🐎</span><b>${escapeHtml(r)}</b></div>`;els.raceField.appendChild(lane);return{r,lane,horse:lane.querySelector('.horse')};});els.raceField.classList.add('active-layer');audio.raceStart();await wait(950);for(const n of [3,2,1]){title.textContent=String(n);audio.countdown(n);await wait(680)}title.textContent='GO!';audio.explosion();await wait(350);
    for(let step=0;step<48;step++){for(const x of laneData){const raw=match.paths.get(x.r)[step],p=8+(raw/maxFinal)*81;x.horse.style.left=`${p}%`;}if(step%3===0)audio.tick(245+step*6,.021);if(step===17||step===31){particlesBurst(.52,.78,38,pick(COLORS),.42);audio.whoosh();}await wait(175);}const winner=laneData.find(x=>x.r===name);title.textContent='FINISH LINE';winner.horse.style.transition='left 1.05s cubic-bezier(.12,.72,.12,1)';winner.horse.style.left='97%';await wait(1100);winner.lane.classList.add('winner','finish-crossed');audio.victorySting();fireworks(6,colorForName(name));await wait(1350);els.raceField.classList.remove('active-layer');setEvent('WINNER',name);await wait(650);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
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
    const opponents=studentPool.filter(n=>n!==name);if(!opponents.length){await eventBattle(name,seat,pool,studentPool);return;}const opponent=pick(opponents),duel=duelOrder(name,opponent),heroLeft=duel.heroLeft,path=generateTugPath(heroLeft);setEvent('TUG OF WAR','VS');hideEventLayer();
    const wrap=document.createElement('div');wrap.className='tug-arena tug-v5';wrap.style.setProperty('--left-color',colorForName(duel.leftName));wrap.style.setProperty('--right-color',colorForName(duel.rightName));wrap.innerHTML=`<div class="tug-ground"></div><div class="tug-center-line"></div><div class="tug-player left"><div class="tug-human"><i class="head"></i><i class="body"></i><i class="arm a1"></i><i class="arm a2"></i><i class="leg l1"></i><i class="leg l2"></i></div><strong>${escapeHtml(duel.leftName)}</strong></div><div class="tug-player right"><div class="tug-human"><i class="head"></i><i class="body"></i><i class="arm a1"></i><i class="arm a2"></i><i class="leg l1"></i><i class="leg l2"></i></div><strong>${escapeHtml(duel.rightName)}</strong></div><div class="tug-rope"><span class="rope-knot">◆</span><i class="rope-flag"></i></div>`;els.tugField.appendChild(wrap);els.tugField.classList.add('active-layer');audio.battleStart();await wait(1000);for(const n of [3,2,1]){wrap.dataset.count=n;audio.countdown(n);await wait(650)}wrap.dataset.count='';const rope=wrap.querySelector('.tug-rope'),left=wrap.querySelector('.tug-player.left'),right=wrap.querySelector('.tug-player.right');
    for(let i=0;i<path.length;i++){const pull=path[i];rope.style.transform=`translate(-50%,-50%) translateX(${pull}px)`;left.style.transform=`translate(-50%,-50%) translateX(${clamp(pull*.25,-30,30)}px) rotate(${clamp(-6-pull*.03,-20,16)}deg)`;right.style.transform=`translate(50%,-50%) translateX(${clamp(pull*.25,-30,30)}px) rotate(${clamp(6-pull*.03,-16,20)}deg)`;audio.tick(170+i*9,.019);if(i%6===0)particlesBurst(.5,.58,12,pick(COLORS),.24);await wait(265);}if(heroLeft){wrap.classList.add('left-wins');rope.style.transform='translate(-50%,-50%) translateX(-145px)';}else{wrap.classList.add('right-wins');rope.style.transform='translate(-50%,-50%) translateX(145px)';}audio.explosion();screenImpact();particlesBurst(heroLeft?.36:.64,.53,125,colorForName(name),1.45);fireworks(5,colorForName(name));await wait(1350);els.tugField.classList.remove('active-layer');setEvent('WINNER',name);await wait(650);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventSprint(name, seat, pool, studentPool) {
    const others=shuffle(studentPool.filter(n=>n!==name)).slice(0,3),runners=shuffle([name,...others]);if(runners.length<2){await eventRace(name,seat,pool,studentPool);return;}const match=generateRacePaths(runners,name,46),maxFinal=Math.max(...[...match.finals.values()]);setEvent('SPRINT','100M');hideEventLayer();const title=document.createElement('div');title.className='sprint-title';title.textContent='100M SPRINT';els.sprintField.appendChild(title);const data=runners.map((r,i)=>{const lane=document.createElement('div');lane.className='sprint-lane';lane.style.setProperty('--runner-color',colorForName(r));lane.innerHTML=`<span class="lane-id">${i+1}</span><div class="runner"><span class="runner-person"><i class="r-head"></i><i class="r-body"></i><i class="r-arm a"></i><i class="r-arm b"></i><i class="r-leg a"></i><i class="r-leg b"></i></span><b>${escapeHtml(r)}</b></div><i class="sprint-finish"></i>`;els.sprintField.appendChild(lane);return{r,runner:lane.querySelector('.runner'),lane};});els.sprintField.classList.add('active-layer');audio.raceStart();await wait(850);for(const n of [3,2,1]){title.textContent=String(n);audio.countdown(n);await wait(650)}title.textContent='GO!';audio.explosion();await wait(300);
    for(let step=0;step<46;step++){for(const x of data){const raw=match.paths.get(x.r)[step],p=6+(raw/maxFinal)*83;x.runner.style.left=`${p}%`;}if(step%2===0)audio.tick(285+step*6,.018);await wait(170);}const w=data.find(x=>x.r===name);title.textContent='PHOTO FINISH';w.runner.style.transition='left 1s cubic-bezier(.12,.72,.12,1)';w.runner.style.left='96%';await wait(1050);w.lane.classList.add('winner','finish-crossed');audio.victorySting();fireworks(5,colorForName(name));await wait(1300);els.sprintField.classList.remove('active-layer');setEvent('WINNER',name);await wait(650);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventRocket(name, seat, pool, studentPool) {
    const others=shuffle(studentPool.filter(n=>n!==name)).slice(0,3),racers=shuffle([name,...others]);if(racers.length<2){await eventMeteor(name,seat,pool);return;}const match=generateRacePaths(racers,name,44),maxFinal=Math.max(...[...match.finals.values()]);setEvent('ROCKET RACE','LAUNCH');hideEventLayer();const sky=document.createElement('div');sky.className='rocket-sky';sky.innerHTML='<i class="rocket-finish"></i><strong class="rocket-title">ROCKET RACE</strong>';els.rocketField.appendChild(sky);const data=racers.map((r,i)=>{const rocket=document.createElement('div');rocket.className='rocket-racer';rocket.style.setProperty('--rocket-color',colorForName(r));rocket.style.left=`${14+i*(72/Math.max(1,racers.length-1))}%`;rocket.innerHTML=`<b>${escapeHtml(r)}</b><span>▲</span><i></i>`;sky.appendChild(rocket);return{r,rocket};});els.rocketField.classList.add('active-layer');const rocketTitle=sky.querySelector('.rocket-title');audio.warning();await wait(750);for(const n of [3,2,1]){rocketTitle.textContent=String(n);audio.countdown(n);await wait(640)}rocketTitle.textContent='LAUNCH!';audio.explosion();particlesBurst(.5,.82,95,null,1.15);await wait(300);rocketTitle.textContent='';
    for(let step=0;step<44;step++){for(const x of data){const raw=match.paths.get(x.r)[step],p=5+(raw/maxFinal)*72;x.rocket.style.bottom=`${p}%`;}if(step%3===0)audio.whoosh();await wait(175);}const w=data.find(x=>x.r===name);w.rocket.style.transition='bottom 1.05s cubic-bezier(.12,.72,.12,1)';w.rocket.style.bottom='86%';await wait(1100);w.rocket.classList.add('winner','finish-crossed');audio.victorySting();fireworks(7,colorForName(name));await wait(1300);els.rocketField.classList.remove('active-layer');setEvent('WINNER',name);await wait(650);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventPenalty(name, seat, pool, studentPool) {
    const opponents=studentPool.filter(n=>n!==name);const opponent=opponents.length?pick(opponents):'RIVAL',duel=duelOrder(name,opponent),match=generatePkMatch();setEvent('PENALTY SHOOTOUT','SHOOTOUT');hideEventLayer();
    const leftName=duel.leftName,rightName=duel.rightName,heroLeft=duel.heroLeft,leftSeq=heroLeft?match.hero:match.opp,rightSeq=heroLeft?match.opp:match.hero;
    const arena=document.createElement('div');arena.className='penalty-arena pk-v11';arena.innerHTML=`<div class="pk11-scoreboard"><section class="pk11-team left"><div class="pk11-head"><strong>${escapeHtml(leftName)}</strong><b class="pk11-score-num">0</b></div><div class="pk11-shots"></div></section><div class="pk11-center"><strong>SHOOTOUT</strong><span class="pk11-round">KICK 1 / 5</span></div><section class="pk11-team right"><div class="pk11-head"><b class="pk11-score-num">0</b><strong>${escapeHtml(rightName)}</strong></div><div class="pk11-shots"></div></section></div><div class="penalty-goal"><div class="penalty-net"></div><div class="penalty-keeper-v5"></div></div><div class="penalty-kicker"><span class="shooter-figure"></span><b></b></div><div class="penalty-ball-v5">●</div><div class="penalty-call">READY</div>`;els.penaltyField.appendChild(arena);els.penaltyField.classList.add('active-layer');audio.warning();await wait(1100);
    const scoreNums=[...arena.querySelectorAll('.pk11-score-num')],shots=[...arena.querySelectorAll('.pk11-shots')],roundLabel=arena.querySelector('.pk11-round'),kicker=arena.querySelector('.penalty-kicker'),kickerName=kicker.querySelector('b'),ball=arena.querySelector('.penalty-ball-v5'),keeper=arena.querySelector('.penalty-keeper-v5'),call=arena.querySelector('.penalty-call');let leftDone=[],rightDone=[],ls=0,rs=0;
    const token=o=>`<span class="pk11-shot ${o||''}" title="${o||''}">${o==='goal'?'●':o==='save'?'S':o==='miss'?'×':''}</span>`;
    const paint=()=>{shots[0].innerHTML=leftDone.map(token).join('');shots[1].innerHTML=rightDone.map(token).join('');scoreNums[0].textContent=ls;scoreNums[1].textContent=rs;};paint();
    const shotPoint=o=>o==='goal'?pick([[37,30],[63,30],[41,48],[59,48],[50,28]]):o==='save'?pick([[43,42],[57,42],[48,48],[52,48]]):pick([[16,30],[84,30],[50,12]]);
    const kick=async(player,outcome)=>{kickerName.textContent=player;kicker.style.setProperty('--kick-color',colorForName(player));call.textContent=player;ball.style.transition='none';ball.style.left='50%';ball.style.top='82%';ball.style.opacity='1';ball.style.transform='translate(-50%,-50%) scale(1)';keeper.style.transition='none';keeper.style.transform='translateX(-50%)';await wait(430);const[tx,ty]=shotPoint(outcome);let keeperShift=outcome==='save'?(tx-50)*2.5:outcome==='goal'?(tx<50?82:-82):(Math.random()<.5?-72:72);keeper.style.transition='transform .62s cubic-bezier(.2,.8,.2,1)';keeper.style.transform=`translateX(calc(-50% + ${keeperShift}px)) rotate(${keeperShift<0?-27:27}deg)`;ball.style.transition='left .78s cubic-bezier(.16,.78,.18,1), top .78s cubic-bezier(.16,.78,.18,1), transform .78s linear';audio.whoosh();ball.style.left=`${tx}%`;ball.style.top=`${ty}%`;ball.style.transform='translate(-50%,-50%) scale(.72)';await wait(800);if(outcome==='goal'){call.textContent='GOAL';arena.classList.add('net-hit');audio.explosion();particlesBurst(.5,.36,46,colorForName(player),.62);}else if(outcome==='save'){call.textContent='SAVED';arena.classList.add('saved-shot');audio.hit();particlesBurst(tx/100,ty/100,24,'#ffe55d',.4);}else{call.textContent='MISS';audio.error();particlesBurst(tx/100,ty/100,18,'#ff3f5f',.3);}await wait(650);arena.classList.remove('net-hit','saved-shot');ball.style.opacity='0';};
    for(let i=0;i<5;i++){roundLabel.textContent=`KICK ${i+1} / 5`;await kick(leftName,leftSeq[i]);leftDone.push(leftSeq[i]);if(leftSeq[i]==='goal')ls++;paint();await wait(320);await kick(rightName,rightSeq[i]);rightDone.push(rightSeq[i]);if(rightSeq[i]==='goal')rs++;paint();await wait(400);}
    for(let i=0;i<match.sudden.length;i++){roundLabel.textContent=`SUDDEN DEATH ${i+1}`;const l=heroLeft?match.sudden[i].hero:match.sudden[i].opp,r=heroLeft?match.sudden[i].opp:match.sudden[i].hero;await kick(leftName,l);leftDone.push(l);if(l==='goal')ls++;paint();await wait(300);await kick(rightName,r);rightDone.push(r);if(r==='goal')rs++;paint();await wait(420);}
    roundLabel.textContent='WINNER';arena.classList.add(heroLeft?'left-winner':'right-winner');call.textContent=name;audio.victorySting();fireworks(6,colorForName(name));screenImpact();await wait(1600);els.penaltyField.classList.remove('active-layer');setEvent('WINNER',name);await wait(700);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventArchery(name, seat, pool, studentPool) {
    const opponents=studentPool.filter(n=>n!==name);const opponent=opponents.length?pick(opponents):'RIVAL',duel=duelByRows(name,opponent),match=generateArcheryMatch();setEvent('ARCHERY DUEL','3 ARROWS');hideEventLayer();
    const makeRow=(player,cls)=>`<div class="archery-row ${cls}" style="--archer-color:${colorForName(player)}"><strong>${escapeHtml(player)}</strong><div class="archery-range"><span class="archery-bow">)</span><div class="archery-board-v5"><i></i><i></i><i></i><i></i><b></b></div></div><em class="archery-total">0</em></div>`;
    const arena=document.createElement('div');arena.className='archery-arena-v5';arena.innerHTML=`<div class="archery-head">ARCHERY DUEL <span>RANDOM TARGETS</span></div>${makeRow(duel.topName,'a')}${makeRow(duel.bottomName,'b')}`;els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');await wait(1050);
    const heroRow=arena.querySelector(duel.heroTop?'.archery-row.a':'.archery-row.b'),oppRow=arena.querySelector(duel.heroTop?'.archery-row.b':'.archery-row.a');let totalHero=0,totalOpp=0;
    const shoot=async(row,shot)=>{row.classList.add('shooting');const range=row.querySelector('.archery-range'),target=row.querySelector('.archery-board-v5');const arrow=document.createElement('span');arrow.className='archery-arrow-v5';arrow.style.top='66%';range.appendChild(arrow);audio.whoosh();await wait(120);arrow.classList.add('fired');arrow.style.setProperty('--hit-y',`${shot.y}%`);await wait(760);audio.hit();const mark=document.createElement('span');mark.className='archery-mark';mark.style.left=`${shot.x}%`;mark.style.top=`${shot.y}%`;target.appendChild(mark);const popup=document.createElement('span');popup.className='archery-score-pop';popup.textContent=`+${shot.score}`;popup.style.left=`${shot.x}%`;popup.style.top=`${shot.y}%`;target.appendChild(popup);particlesBurst(.5,row.classList.contains('a')?.36:.66,18,colorForName(row.querySelector('strong').textContent),.35);row.classList.remove('shooting');await wait(600);};
    for(let r=0;r<3;r++){await shoot(heroRow,match.hero[r]);totalHero+=match.hero[r].score;heroRow.querySelector('.archery-total').textContent=totalHero;await wait(300);await shoot(oppRow,match.opp[r]);totalOpp+=match.opp[r].score;oppRow.querySelector('.archery-total').textContent=totalOpp;await wait(430);}heroRow.classList.add('winner');audio.victorySting();fireworks(5,colorForName(name));await wait(1500);els.cardField.classList.remove('active-layer');setEvent('WINNER',name);await wait(650);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventSumo(name, seat, pool, studentPool) {
    const opponents=studentPool.filter(n=>n!==name);const opponent=opponents.length?pick(opponents):'RIVAL';const duel=duelOrder(name,opponent);setEvent('SUMO CLASH','VS');hideEventLayer();const arena=document.createElement('div');arena.className='sumo-arena';arena.innerHTML=`<div class="sumo-ring"></div><div class="sumo fighter-a"><span style="background:${colorForName(duel.leftName)};box-shadow:0 0 35px ${colorForName(duel.leftName)}"></span><strong>${escapeHtml(duel.leftName)}</strong></div><div class="sumo fighter-b"><span style="background:${colorForName(duel.rightName)};box-shadow:0 0 35px ${colorForName(duel.rightName)}"></span><strong>${escapeHtml(duel.rightName)}</strong></div>`;els.eliminationField.appendChild(arena);els.eliminationField.classList.add('active-layer');await wait(1000);for(let i=0;i<8;i++){arena.classList.toggle('clash');audio.hit();particlesBurst(.5,.55,22,pick(COLORS),.35);screenImpact();await wait(620);arena.classList.toggle('clash');await wait(350);}arena.classList.add(duel.heroLeft?'winner-a':'winner-b');audio.explosion();fireworks(5,colorForName(name));await wait(1300);els.eliminationField.classList.remove('active-layer');setEvent('WINNER',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventBoat(name, seat, pool, studentPool) {
    const others=shuffle(studentPool.filter(n=>n!==name)).slice(0,2),racers=shuffle([name,...others]);if(racers.length<2){await eventRace(name,seat,pool,studentPool);return;}const match=generateRacePaths(racers,name,46),maxFinal=Math.max(...[...match.finals.values()]);setEvent('BOAT RACE','FINAL REGATTA');hideEventLayer();const sea=document.createElement('div');sea.className='boat-arena';sea.innerHTML='<strong class="boat-title">FINAL REGATTA</strong>';const data=racers.map(r=>{const lane=document.createElement('div');lane.className='boat-lane';lane.style.setProperty('--boat-color',colorForName(r));lane.innerHTML=`<i class="boat-finish"></i><div class="boat"><span class="boat-graphic"><i class="mast"></i><i class="sail"></i><i class="hull"></i><i class="wake"></i></span><b>${escapeHtml(r)}</b></div>`;sea.appendChild(lane);return{r,lane,boat:lane.querySelector('.boat')};});els.raceField.appendChild(sea);els.raceField.classList.add('active-layer');const boatTitle=sea.querySelector('.boat-title');await wait(900);for(const n of [3,2,1]){boatTitle.textContent=String(n);audio.countdown(n);await wait(650)}boatTitle.textContent='GO!';audio.explosion();await wait(300);boatTitle.textContent='';
    for(let step=0;step<46;step++){for(const x of data){const raw=match.paths.get(x.r)[step],p=7+(raw/maxFinal)*82;x.boat.style.left=`${p}%`;}if(step%3===0)audio.whoosh();await wait(175);}const win=data.find(x=>x.r===name);win.boat.style.transition='left 1.05s cubic-bezier(.12,.72,.12,1)';win.boat.style.left='96%';await wait(1100);win.lane.classList.add('winner','finish-crossed');fireworks(5,colorForName(name));audio.victorySting();await wait(1300);els.raceField.classList.remove('active-layer');setEvent('WINNER',name);await wait(650);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventRps(name, seat, pool, studentPool) {
    const opponents=studentPool.filter(n=>n!==name);if(!opponents.length){await eventCards(name,seat,pool);return;}const opponent=pick(opponents),duel=duelOrder(name,opponent),rounds=generateRpsMatch();setEvent('ROCK PAPER SCISSORS','BEST OF 3');hideEventLayer();
    const arena=document.createElement('div');arena.className='rps-arena';arena.innerHTML=`<div class="rps-player left" style="--rps-color:${colorForName(duel.leftName)}"><strong>${escapeHtml(duel.leftName)}</strong><span class="rps-hand">✊</span><b class="rps-score">0</b></div><div class="rps-center"><em>VS</em><span>ROUND 1</span></div><div class="rps-player right" style="--rps-color:${colorForName(duel.rightName)}"><strong>${escapeHtml(duel.rightName)}</strong><span class="rps-hand">✊</span><b class="rps-score">0</b></div>`;els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');await wait(1000);
    const lp=arena.querySelector('.rps-player.left'),rp=arena.querySelector('.rps-player.right'),lh=lp.querySelector('.rps-hand'),rh=rp.querySelector('.rps-hand'),ls=lp.querySelector('.rps-score'),rs=rp.querySelector('.rps-score'),roundLabel=arena.querySelector('.rps-center span');let leftScore=0,rightScore=0;
    for(let i=0;i<rounds.length;i++){roundLabel.textContent=`ROUND ${i+1}`;for(let shake=0;shake<4;shake++){lh.textContent='✊';rh.textContent='✊';lp.classList.toggle('shake');rp.classList.toggle('shake');audio.tick(220+shake*35,.022);await wait(260);}const r=rounds[i],leftHand=duel.heroLeft?r.hero:r.opp,rightHand=duel.heroLeft?r.opp:r.hero,leftWins=duel.heroLeft?r.heroWin:!r.heroWin;lh.textContent=leftHand;rh.textContent=rightHand;audio.hit();if(leftWins){leftScore++;lp.classList.add('round-win');}else{rightScore++;rp.classList.add('round-win');}ls.textContent=leftScore;rs.textContent=rightScore;await wait(1100);lp.classList.remove('round-win','shake');rp.classList.remove('round-win','shake');}
    roundLabel.textContent='WINNER';(duel.heroLeft?lp:rp).classList.add('winner');audio.victorySting();fireworks(5,colorForName(name));await wait(1400);els.cardField.classList.remove('active-layer');setEvent('WINNER',name);await wait(650);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventPoker(name, seat, pool, studentPool) {
    const opponents=studentPool.filter(n=>n!==name);if(!opponents.length){await eventCards(name,seat,pool);return;}const opponent=pick(opponents),duel=duelByRows(name,opponent),t=generatePokerMatch();setEvent('POKER SHOWDOWN','HEADS-UP');hideEventLayer();
    const card=c=>`<span class="poker-card ${c.s==='♥'||c.s==='♦'?'red':''}"><b>${c.r}</b><i>${c.s}</i></span>`,back='<span class="poker-card back">◆</span>',topName=duel.topName,bottomName=duel.bottomName,heroTop=duel.heroTop;
    const table=document.createElement('div');table.className='poker-table';table.innerHTML=`<div class="poker-player top" style="--poker-color:${colorForName(topName)}"><strong>${escapeHtml(topName)}</strong><div class="poker-hole">${back}${back}</div><em class="poker-hand-name"></em></div><div class="poker-community">${back}${back}${back}${back}${back}</div><div class="poker-pot"><i></i><i></i><i></i><b>POT</b></div><div class="poker-player bottom" style="--poker-color:${colorForName(bottomName)}"><strong>${escapeHtml(bottomName)}</strong><div class="poker-hole">${back}${back}</div><em class="poker-hand-name"></em></div>`;els.cardField.appendChild(table);els.cardField.classList.add('active-layer');await wait(1000);audio.shuffleStart();await wait(850);
    const topHole=heroTop?t.hero:t.opp,bottomHole=heroTop?t.opp:t.hero,holes=table.querySelectorAll('.poker-hole');holes[0].innerHTML=topHole.map(card).join('');await wait(620);holes[1].innerHTML=bottomHole.map(card).join('');await wait(780);const comm=table.querySelector('.poker-community');comm.innerHTML='';for(let i=0;i<t.board.length;i++){comm.insertAdjacentHTML('beforeend',card(t.board[i]));audio.tick(360+i*45,.025);await wait(i<3?500:820);}const labels=table.querySelectorAll('.poker-hand-name');labels[0].textContent=heroTop?t.heroName:t.oppName;labels[1].textContent=heroTop?t.oppName:t.heroName;(heroTop?table.querySelector('.poker-player.top'):table.querySelector('.poker-player.bottom')).classList.add('winner');audio.victorySting();fireworks(6,colorForName(name));await wait(1900);els.cardField.classList.remove('active-layer');setEvent('WINNER',name);await wait(650);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }


  async function eventBaseball(name, seat, pool, studentPool) {
    const opponents=studentPool.filter(n=>n!==name);if(!opponents.length){await eventCards(name,seat,pool);return;}const opponent=pick(opponents),duel=duelOrder(name,opponent),match=generateBaseballMatch();setEvent('BASEBALL','HOME RUN DERBY');hideEventLayer();
    const leftName=duel.leftName,rightName=duel.rightName,heroLeft=duel.heroLeft,leftSeq=heroLeft?match.hero:match.opp,rightSeq=heroLeft?match.opp:match.hero;
    const arena=document.createElement('div');arena.className='baseball-arena baseball-v7';arena.innerHTML=`<div class="baseball-scoreboard"><div class="bb-team left"><strong>${escapeHtml(leftName)}</strong><span class="bb-score">0</span><em class="bb-results"></em></div><div class="bb-center"><b>HOME RUN DERBY</b><span class="bb-round-label">3 SWINGS EACH</span></div><div class="bb-team right"><strong>${escapeHtml(rightName)}</strong><span class="bb-score">0</span><em class="bb-results"></em></div></div><div class="baseball-field-wrap"><div class="baseball-field"><i class="bb-fence"></i><i class="bb-diamond"></i><div class="bb-homeplate">HOME</div><div class="bb-mound">PITCHER</div><div class="bb-batter"><i></i><b></b></div><i class="bb-pitcher"></i><i class="bb-ball"></i><div class="bb-call">READY</div></div></div>`;els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');await wait(900);
    const ball=arena.querySelector('.bb-ball'),call=arena.querySelector('.bb-call'),batter=arena.querySelector('.bb-batter'),batterName=batter.querySelector('b'),scoreEls=arena.querySelectorAll('.bb-score'),resultEls=arena.querySelectorAll('.bb-results'),roundLabel=arena.querySelector('.bb-round-label');let ls=0,rs=0,lr=[],rr=[];
    const update=()=>{scoreEls[0].textContent=ls;scoreEls[1].textContent=rs;resultEls[0].innerHTML=lr.map(x=>`<i class="${x==='HR'?'hr':'out'}">${x}</i>`).join('');resultEls[1].innerHTML=rr.map(x=>`<i class="${x==='HR'?'hr':'out'}">${x}</i>`).join('');};
    const swing=async(player,outcome)=>{batterName.textContent=player;batter.style.setProperty('--batter-color',colorForName(player));call.textContent=`${player} // PITCH`;ball.style.transition='none';ball.style.left='50%';ball.style.top='46%';ball.style.opacity='1';ball.style.transform='translate(-50%,-50%) scale(.72)';await wait(320);audio.whoosh();ball.style.transition='left .48s linear, top .48s linear, transform .48s linear';ball.style.left='50%';ball.style.top='79%';ball.style.transform='translate(-50%,-50%) scale(1)';await wait(500);batter.classList.add('swing');audio.hit();await wait(120);if(outcome==='HR'){const tx=pick([18,28,38,62,72,82]);ball.style.transition='left 1.08s cubic-bezier(.18,.7,.2,1), top 1.08s cubic-bezier(.18,.7,.2,1), transform 1.08s linear';ball.style.left=`${tx}%`;ball.style.top='5%';ball.style.transform='translate(-50%,-50%) scale(.4)';call.textContent='HOME RUN';audio.explosion();fireworksAt(tx/100,.18,3,colorForName(player));}else{const tx=pick([32,42,50,58,68]);ball.style.transition='left .8s ease, top .8s ease, transform .8s linear';ball.style.left=`${tx}%`;ball.style.top=`${randInt(25,40)}%`;ball.style.transform='translate(-50%,-50%) scale(.62)';call.textContent='OUT';audio.error();}await wait(1150);batter.classList.remove('swing');ball.style.opacity='0';await wait(240);};
    for(let i=0;i<3;i++){roundLabel.textContent=`SWING ${i+1} / 3`;await swing(leftName,leftSeq[i]);lr.push(leftSeq[i]);if(leftSeq[i]==='HR')ls++;update();await wait(320);await swing(rightName,rightSeq[i]);rr.push(rightSeq[i]);if(rightSeq[i]==='HR')rs++;update();await wait(400);}for(let i=0;i<match.bonus.length;i++){roundLabel.textContent=`BONUS SWING ${i+1}`;const l=heroLeft?match.bonus[i].hero:match.bonus[i].opp,r=heroLeft?match.bonus[i].opp:match.bonus[i].hero;await swing(leftName,l);lr.push(l);if(l==='HR')ls++;update();await wait(300);await swing(rightName,r);rr.push(r);if(r==='HR')rs++;update();await wait(400);}call.textContent='WINNER';arena.classList.add(heroLeft?'bb-left-win':'bb-right-win');fireworks(6,colorForName(name));audio.victorySting();await wait(1500);els.cardField.classList.remove('active-layer');setEvent('WINNER',name);await wait(650);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }

  async function eventDice(name, seat, pool, studentPool) {
    const opponents=studentPool.filter(n=>n!==name);if(!opponents.length){await eventCards(name,seat,pool);return;}const opponent=pick(opponents),duel=duelOrder(name,opponent),rounds=generateDiceMatch();setEvent('DICE DUEL','BEST OF 3');hideEventLayer();
    const faces=['⚀','⚁','⚂','⚃','⚄','⚅'];const arena=document.createElement('div');arena.className='dice-arena dice-v7';arena.innerHTML=`<div class="dice-player left" style="--dice-color:${colorForName(duel.leftName)}"><strong>${escapeHtml(duel.leftName)}</strong><div class="dice-pair"><div class="dice-face">⚀</div><div class="dice-face">⚀</div></div><span class="dice-round-total">TOTAL 2</span><b class="dice-match-score">0</b></div><div class="dice-center"><em>DICE</em><span>ROUND 1</span></div><div class="dice-player right" style="--dice-color:${colorForName(duel.rightName)}"><strong>${escapeHtml(duel.rightName)}</strong><div class="dice-pair"><div class="dice-face">⚀</div><div class="dice-face">⚀</div></div><span class="dice-round-total">TOTAL 2</span><b class="dice-match-score">0</b></div>`;els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');await wait(900);
    const left=arena.querySelector('.dice-player.left'),right=arena.querySelector('.dice-player.right'),ld=[...left.querySelectorAll('.dice-face')],rd=[...right.querySelectorAll('.dice-face')],lt=left.querySelector('.dice-round-total'),rt=right.querySelector('.dice-round-total'),lm=left.querySelector('.dice-match-score'),rm=right.querySelector('.dice-match-score'),roundLabel=arena.querySelector('.dice-center span');let lmatch=0,rmatch=0;
    for(let round=0;round<rounds.length;round++){roundLabel.textContent=`ROUND ${round+1}`;for(let s=0;s<10;s++){for(const d of [...ld,...rd])d.textContent=faces[randInt(0,5)];left.classList.toggle('rolling');right.classList.toggle('rolling');audio.tick(220+s*24,.018);await wait(105);}const rr=rounds[round],lvals=duel.heroLeft?rr.hero:rr.opp,rvals=duel.heroLeft?rr.opp:rr.hero;ld[0].textContent=faces[lvals[0]-1];ld[1].textContent=faces[lvals[1]-1];rd[0].textContent=faces[rvals[0]-1];rd[1].textContent=faces[rvals[1]-1];const lsum=lvals[0]+lvals[1],rsum=rvals[0]+rvals[1];lt.textContent=`TOTAL ${lsum}`;rt.textContent=`TOTAL ${rsum}`;if(lsum>rsum){lmatch++;left.classList.add('round-win');}else{rmatch++;right.classList.add('round-win');}lm.textContent=lmatch;rm.textContent=rmatch;audio.hit();await wait(1050);left.classList.remove('rolling','round-win');right.classList.remove('rolling','round-win');}
    roundLabel.textContent='WINNER';(duel.heroLeft?left:right).classList.add('winner');fireworks(5,colorForName(name));audio.victorySting();await wait(1400);els.cardField.classList.remove('active-layer');setEvent('WINNER',name);await wait(650);setEvent('TARGET LOCK',name,seatLabel(seat),'','top');await wait(620);
  }


  function eventCompetitors(name, studentPool, maxPlayers=4, minPlayers=2) {
    const others=shuffle([...new Set(studentPool.filter(n=>n!==name))]);
    const wanted=clamp(2+Math.floor(Math.random()*Math.max(1,maxPlayers-1)),minPlayers,maxPlayers);
    return shuffle([name,...others.slice(0,Math.max(0,wanted-1))]).slice(0,maxPlayers);
  }

  function multiplayerPace(players) {
    const n=Array.isArray(players)?players.length:Number(players)||2;
    return n>=4?1.28:n===3?1.16:1;
  }
  const gameWait=(ms,players)=>wait(Math.round(ms*multiplayerPace(players)));

  async function eventBomb(name, seat, pool, studentPool) {
    const players=eventCompetitors(name,studentPool,4,2);if(players.length<2){await eventCountdown(name,seat);return;}
    const order=generateBombOrder(players,name);setEvent('BOMB PASS','PASS IT BEFORE ZERO');hideEventLayer();
    const arena=document.createElement('div');arena.className='bomb-arena';const ring=document.createElement('div');ring.className='bomb-ring';arena.appendChild(ring);const nodes=[];
    players.forEach((player,i)=>{const node=document.createElement('div');node.className='bomb-player';node.style.setProperty('--bomb-color',colorForName(player));node.style.setProperty('--bomb-angle',`${i*360/players.length}deg`);node.innerHTML=`<strong>${escapeHtml(player)}</strong><span>SAFE</span>`;ring.appendChild(node);nodes.push(node);});
    const bomb=document.createElement('div');bomb.className='bomb-core';bomb.textContent='●';ring.appendChild(bomb);const timer=document.createElement('div');timer.className='bomb-timer';timer.innerHTML='<small>BOMB TIMER</small><strong>5.0</strong>';arena.appendChild(timer);const timerValue=timer.querySelector('strong');els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');await gameWait(1250,players);
    const moveBomb=async idx=>{const rr=ring.getBoundingClientRect(),nr=nodes[idx].getBoundingClientRect();bomb.style.left=`${nr.left-rr.left+nr.width/2}px`;bomb.style.top=`${nr.top-rr.top+nr.height/2}px`;bomb.style.transform='translate(-50%,-50%) scale(1)';};
    let alive=players.map((p,i)=>({p,i})),seconds=5.0;
    for(const loserName of order.slice(0,-1)){
      const loser=alive.find(x=>x.p===loserName),passes=7+randInt(0,4),start=randInt(0,alive.length-1);
      for(let k=0;k<passes;k++){const target=alive[(start+k)%alive.length];nodes.forEach(n=>n.classList.remove('holding'));nodes[target.i].classList.add('holding');await moveBomb(target.i);seconds=Math.max(.6,seconds-(.28+Math.random()*.28));timerValue.textContent=seconds.toFixed(1);audio.tick(360+k*28,.026);await gameWait(Math.max(175,300-k*10),players);}
      nodes.forEach(n=>n.classList.remove('holding'));await moveBomb(loser.i);nodes[loser.i].classList.add('bombed');nodes[loser.i].querySelector('span').textContent='OUT';timerValue.textContent='0.0';bomb.style.transform='translate(-50%,-50%) scale(1.8)';audio.explosion();const bp=nodes[loser.i].getBoundingClientRect(),ar=els.cinemaStage.getBoundingClientRect();particlesBurst((bp.left+bp.width/2-ar.left)/ar.width,(bp.top+bp.height/2-ar.top)/ar.height,90,colorForName(loser.p),1.1);screenImpact();await gameWait(1050,players);alive=alive.filter(x=>x!==loser);seconds=Math.max(2.5,5.0-(order.length-alive.length)*.65);timerValue.textContent=seconds.toFixed(1);await gameWait(450,players);
    }
    const win=alive[0];nodes[win.i].classList.add('winner');nodes[win.i].querySelector('span').textContent='SURVIVOR';timerValue.textContent='SAFE';fireworks(5,colorForName(name));audio.victorySting();await gameWait(1650,players);els.cardField.classList.remove('active-layer');setEvent('SURVIVOR',name,seatLabel(seat),'','top');await wait(700);
  }

  async function eventThrone(name, seat, pool, studentPool) {
    const players=eventCompetitors(name,studentPool,4,2);if(players.length<2){await eventBattle(name,seat,pool,studentPool);return;}setEvent('THRONE CLASH','CLAIM THE CROWN');hideEventLayer();
    const rounds=players.length===4?3:2,match=generateThroneMatch(players,name,rounds);const arena=document.createElement('div');arena.className='throne-arena';arena.innerHTML='<div class="throne-crown">♛</div><div class="throne-seat">SEAT THRONE</div><div class="throne-board"></div><div class="throne-log">ROUND READY</div>';const board=arena.querySelector('.throne-board'),log=arena.querySelector('.throne-log');
    const live=new Map(players.map(p=>[p,0]));players.forEach(p=>{const c=document.createElement('section');c.style.setProperty('--throne-color',colorForName(p));c.innerHTML=`<strong>${escapeHtml(p)}</strong><span>0</span><small>PTS</small>`;board.appendChild(c);});els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');await gameWait(1150,players);
    for(let r=0;r<rounds;r++){log.textContent=`ROUND ${r+1} / ${rounds}`;await gameWait(600,players);for(const p of shuffle(players)){const gain=match.gains.get(p)[r];live.set(p,live.get(p)+gain);const card=board.children[players.indexOf(p)];card.querySelector('span').textContent=live.get(p);card.classList.add('pulse');log.textContent=`${p}  +${gain}`;audio.hit();await gameWait(600,players);card.classList.remove('pulse');}await gameWait(500,players);}
    log.textContent='CROWN CLAIMED';board.children[players.indexOf(name)].classList.add('winner');arena.querySelector('.throne-crown').classList.add('claimed');fireworks(6,colorForName(name));audio.victorySting();await gameWait(1700,players);els.cardField.classList.remove('active-layer');setEvent('KING OF THE SEAT',name,seatLabel(seat),'','top');await wait(700);
  }

  async function eventBowling(name, seat, pool, studentPool) {
    const players=eventCompetitors(name,studentPool,4,2);if(players.length<2){await eventPinball(name,seat,pool);return;}setEvent('BOWLING','TWO ROLLS EACH');hideEventLayer();
    const match=generateBowlingMatch(players,name),arena=document.createElement('div');arena.className='bowling-arena bowling-v15';const board=document.createElement('div');board.className='bowling-scoreboard';arena.appendChild(board);const lane=document.createElement('div');lane.className='bowling-lane bowling-lane-v15';lane.innerHTML='<div class="bowling-deck"></div><div class="bowling-arrow">▲ ▲ ▲</div><div class="bowling-ball"><i></i><i></i><i></i></div><div class="bowling-call">LANE READY</div>';arena.appendChild(lane);const deck=lane.querySelector('.bowling-deck');for(let i=0;i<10;i++){const pin=document.createElement('i');pin.className=`bowling-pin pin-${i+1}`;deck.appendChild(pin);}els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');
    const live=new Map(players.map(p=>[p,0]));players.forEach(p=>{const c=document.createElement('section');c.style.setProperty('--bowling-color',colorForName(p));c.innerHTML=`<strong>${escapeHtml(p)}</strong><span>0</span><small>ROLL 0 / 2</small>`;board.appendChild(c);});await gameWait(1150,players);
    const ball=lane.querySelector('.bowling-ball'),call=lane.querySelector('.bowling-call'),pins=[...deck.children];
    for(let roll=0;roll<2;roll++){for(const player of players){const knocked=match.rolls.get(player)[roll],card=board.children[players.indexOf(player)];card.classList.add('active-bowler');call.textContent=`${player} · ROLL ${roll+1}`;pins.forEach(pin=>pin.classList.remove('down'));ball.style.transition='none';ball.style.left=`${48+randInt(-8,8)}%`;ball.style.top='88%';ball.style.transform='translate(-50%,-50%) rotate(0deg) scale(1.08)';await gameWait(260,players);audio.whoosh();ball.style.transition=`top ${1.12*multiplayerPace(players)}s cubic-bezier(.18,.76,.2,1),left ${1.12*multiplayerPace(players)}s ease,transform ${1.12*multiplayerPace(players)}s linear`;ball.style.left=`${50+randInt(-4,4)}%`;ball.style.top='17%';ball.style.transform='translate(-50%,-50%) rotate(1080deg) scale(.72)';await gameWait(1140,players);audio.hit();const down=shuffle(pins).slice(0,knocked);down.forEach((pin,i)=>{pin.style.setProperty('--pin-fall',`${randInt(-65,65)}deg`);setTimeout(()=>pin.classList.add('down'),i*28);});live.set(player,live.get(player)+knocked);card.querySelector('span').textContent=live.get(player);card.querySelector('small').textContent=`ROLL ${roll+1} / 2`;call.textContent=knocked===10?'STRIKE!':knocked===0?'GUTTER BALL':`${knocked} PINS DOWN`;knocked===10?audio.confirm():audio.tick(520+knocked*30,.025);await gameWait(900,players);card.classList.remove('active-bowler');await gameWait(260,players);}}
    board.children[players.indexOf(name)].classList.add('winner');call.textContent=`WINNER · ${match.scores.get(name)} PINS`;fireworks(5,colorForName(name));audio.victorySting();await gameWait(1600,players);els.cardField.classList.remove('active-layer');setEvent('BOWLING WINNER',name,seatLabel(seat),'','top');await wait(700);
  }

  async function eventBasketball(name, seat, pool, studentPool) {
    const players=eventCompetitors(name,studentPool,4,2);if(players.length<2){await eventPenalty(name,seat,pool,studentPool);return;}setEvent('FREE THROW','5 SHOTS EACH');hideEventLayer();
    const match=generateBasketballMatch(players,name),arena=document.createElement('div');arena.className='basket-arena basket-v15';arena.innerHTML='<div class="basket-board"></div><div class="basket-court basket-court-v15"><div class="basket-key"></div><div class="basket-backboard"></div><div class="basket-hoop"><i></i></div><div class="basket-shooter"><b></b></div><div class="basket-ball">●</div><div class="basket-call">FREE THROW LINE</div></div>';const board=arena.querySelector('.basket-board'),ball=arena.querySelector('.basket-ball'),call=arena.querySelector('.basket-call'),shooter=arena.querySelector('.basket-shooter');els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');
    players.forEach(player=>{const c=document.createElement('section');c.style.setProperty('--basket-color',colorForName(player));c.innerHTML=`<strong>${escapeHtml(player)}</strong><span>0/5</span><em class="basket-shots">○ ○ ○ ○ ○</em>`;board.appendChild(c);});await gameWait(1150,players);
    for(const player of players){let hit=0;const seq=match.sequences.get(player),card=board.children[players.indexOf(player)],marks=['○','○','○','○','○'];card.classList.add('active-shooter');shooter.style.setProperty('--shooter-color',colorForName(player));shooter.querySelector('b').textContent=player;
      for(let shot=1;shot<=5;shot++){const good=seq[shot-1];call.textContent=`${player} · SHOT ${shot} / 5`;ball.classList.remove('made','missed');ball.style.transition='none';ball.style.left='22%';ball.style.top='72%';ball.style.transform='translate(-50%,-50%) rotate(0deg) scale(1)';await gameWait(260,players);audio.whoosh();ball.style.transition=`left ${.62*multiplayerPace(players)}s ease-out,top ${.62*multiplayerPace(players)}s cubic-bezier(.1,.7,.15,1),transform ${.62*multiplayerPace(players)}s linear`;ball.style.left='50%';ball.style.top='20%';ball.style.transform='translate(-50%,-50%) rotate(420deg) scale(.9)';await gameWait(630,players);ball.style.transition=`left ${.42*multiplayerPace(players)}s ease-in,top ${.42*multiplayerPace(players)}s ease-in,transform ${.42*multiplayerPace(players)}s linear`;ball.style.left=good?'78%':`${pick([70,84,88])}%`;ball.style.top=good?'31%':`${pick([23,27,39])}%`;ball.style.transform='translate(-50%,-50%) rotate(760deg) scale(.78)';await gameWait(430,players);
        if(good){ball.classList.add('made');ball.style.transition=`top ${.24*multiplayerPace(players)}s ease-in`;ball.style.top='43%';hit++;marks[shot-1]='●';call.textContent='SWISH · GOOD';audio.confirm();}else{ball.classList.add('missed');marks[shot-1]='×';call.textContent='MISS';audio.error();}card.querySelector('span').textContent=`${hit}/5`;card.querySelector('.basket-shots').textContent=marks.join(' ');await gameWait(720,players);}
      card.classList.remove('active-shooter');await gameWait(400,players);
    }
    board.children[players.indexOf(name)].classList.add('winner');call.textContent=`WINNER · ${match.scores.get(name)}/5`;fireworks(5,colorForName(name));audio.victorySting();await gameWait(1650,players);els.cardField.classList.remove('active-layer');setEvent('FREE THROW WINNER',name,seatLabel(seat),'','top');await wait(700);
  }

  async function eventCannon(name, seat, pool, studentPool) {
    const others=studentPool.filter(n=>n!==name);if(!others.length){await eventBattle(name,seat,pool,studentPool);return;}const opponent=pick(others),duel=duelOrder(name,opponent),plan=generateCannonPlan(name,opponent);setEvent('CANNON DUEL','FIRE!');hideEventLayer();
    const arena=document.createElement('div');arena.className='cannon-arena';arena.innerHTML=`<div class="cannon-ship left" style="--ship-color:${colorForName(duel.leftName)}"><strong>${escapeHtml(duel.leftName)}</strong><span>100 HP</span><i></i></div><div class="cannon-sea"></div><div class="cannon-ball"></div><div class="cannon-ship right" style="--ship-color:${colorForName(duel.rightName)}"><strong>${escapeHtml(duel.rightName)}</strong><span>100 HP</span><i></i></div><div class="cannon-call">BROADSIDES READY</div>`;els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');const left=arena.querySelector('.cannon-ship.left'),right=arena.querySelector('.cannon-ship.right'),ball=arena.querySelector('.cannon-ball'),call=arena.querySelector('.cannon-call');const shipFor=p=>p===duel.leftName?left:right;await wait(1100);
    for(const turn of plan.turns){const att=shipFor(turn.attacker),def=shipFor(turn.defender);call.textContent=`${turn.attacker} FIRES`;ball.style.transition='none';ball.style.left=att===left?'25%':'75%';ball.style.top='53%';await wait(80);ball.style.transition='left .58s ease, top .58s ease';ball.style.left=att===left?'72%':'28%';ball.style.top=turn.hit?'48%':`${pick([26,32,67])}%`;audio.explosion();await wait(760);if(turn.hit){def.querySelector('span').textContent=`${turn.hpAfter} HP`;def.classList.add('hit');audio.hit();call.textContent=turn.hpAfter<=0?'DIRECT HIT · SUNK':`HIT · -${turn.dmg}`;await wait(430);def.classList.remove('hit');if(turn.hpAfter<=0){def.classList.add('sunk');break;}}else{call.textContent='MISS';await wait(350);}}
    shipFor(name).classList.add('winner');call.textContent='SHIP SUNK';particlesBurst(duel.heroLeft?.73:.27,.52,125,colorForName(name),1.3);fireworks(5,colorForName(name));audio.victorySting();await wait(1650);els.cardField.classList.remove('active-layer');setEvent('WINNER',name,seatLabel(seat),'','top');await wait(700);
  }

  async function eventTreasure(name, seat, pool, studentPool) {
    const players=eventCompetitors(name,studentPool,4,2),match=generateTreasureMatch(players,name);setEvent('TREASURE HUNT','OPEN A CHEST');hideEventLayer();const arena=document.createElement('div');arena.className='treasure-arena';const board=document.createElement('div');board.className='treasure-board';arena.appendChild(board);players.forEach(p=>{const card=document.createElement('section');card.style.setProperty('--treasure-color',colorForName(p));card.innerHTML=`<strong>${escapeHtml(p)}</strong><div class="treasure-chest">▰</div><span>?</span>`;board.appendChild(card);});els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');await gameWait(1100,players);
    for(const p of shuffle(players)){const i=players.indexOf(p),card=board.children[i],score=match.scores.get(p);card.classList.add('opening');audio.lock();await gameWait(620,players);card.querySelector('span').textContent=`${score} GOLD`;card.classList.remove('opening');if(score>=90)particlesBurst(.5,.5,36,'#ffe55d',.45);await gameWait(620,players);}board.children[players.indexOf(name)].classList.add('winner');fireworks(6,'#ffe55d');audio.victorySting();await gameWait(1550,players);els.cardField.classList.remove('active-layer');setEvent('RICHEST',name,seatLabel(seat),'','top');await wait(700);
  }

  async function eventTournament(name, seat, pool, studentPool) {
    let players=eventCompetitors(name,studentPool,4,4);if(players.length<4){await eventThrone(name,seat,pool,studentPool);return;}const plan=generateTournamentPlan(players,name);players=plan.seeded;setEvent('FINAL FOUR','TOURNAMENT');hideEventLayer();
    const arena=document.createElement('div');arena.className='tournament-arena tournament-v15';arena.innerHTML='<div class="tournament-title">FINAL FOUR</div><div class="bracket"></div><div class="tournament-log"><span class="tournament-round">SEMIFINALS</span><div class="tournament-matchline"><b>READY</b></div></div>';const bracket=arena.querySelector('.bracket'),log=arena.querySelector('.tournament-log');els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');players.forEach((p,i)=>{const c=document.createElement('section');c.style.setProperty('--tour-color',colorForName(p));c.innerHTML=`<small>SEED ${i+1}</small><strong title="${escapeHtml(p)}">${escapeHtml(p)}</strong><em>—</em>`;bracket.appendChild(c);});await gameWait(1350,players);
    const card=p=>[...bracket.children].find(c=>c.querySelector('strong').textContent===p);const showLine=(label,m)=>{log.innerHTML=`<span class="tournament-round">${label}</span><div class="tournament-matchline"><b title="${escapeHtml(m.a)}">${escapeHtml(m.a)}</b><strong>${m.as}</strong><i>:</i><strong>${m.bs}</strong><b title="${escapeHtml(m.b)}">${escapeHtml(m.b)}</b></div>`;};
    const play=async(m,label)=>{showLine(label,m);const ca=card(m.a),cb=card(m.b);ca.classList.add('active');cb.classList.add('active');await gameWait(850,players);for(let i=0;i<6;i++){audio.tick(300+i*45,.025);await gameWait(230,players);}ca.querySelector('em').textContent=m.as;cb.querySelector('em').textContent=m.bs;await gameWait(650,players);ca.classList.remove('active');cb.classList.remove('active');card(m.winner).classList.add('advance');log.querySelector('.tournament-round').textContent=`${label} WINNER · ${m.winner}`;audio.confirm();await gameWait(1050,players);};
    await play(plan.semis[0],'SEMIFINAL 1');await play(plan.semis[1],'SEMIFINAL 2');log.innerHTML='<span class="tournament-round">CHAMPIONSHIP</span><div class="tournament-matchline"><b>FINALISTS READY</b></div>';await gameWait(900,players);await play(plan.final,'CHAMPIONSHIP');card(name).classList.add('champion');log.innerHTML=`<span class="tournament-round">CHAMPION</span><div class="tournament-matchline"><b>${escapeHtml(name)}</b></div>`;fireworks(8,colorForName(name));audio.victorySting();await gameWait(1800,players);els.cardField.classList.remove('active-layer');setEvent('CHAMPION',name,seatLabel(seat),'','top');await wait(700);
  }

  async function eventCurling(name, seat, pool, studentPool) {
    const players=eventCompetitors(name,studentPool,4,2);if(players.length<2){await eventSpotlight(name,seat,pool);return;}const match=generateCurlingMatch(players,name);setEvent('CURLING','PRECISION HOUSE');hideEventLayer();
    const arena=document.createElement('div');arena.className='curling-arena';arena.innerHTML='<div class="curling-scoreboard"></div><div class="curling-sheet"><div class="curling-house"><i></i><i></i><i></i><i></i></div><div class="curling-call">HACK READY</div></div>';const board=arena.querySelector('.curling-scoreboard'),sheet=arena.querySelector('.curling-sheet'),house=arena.querySelector('.curling-house'),call=arena.querySelector('.curling-call');players.forEach(p=>{const c=document.createElement('section');c.style.setProperty('--game-color',colorForName(p));c.innerHTML=`<strong>${escapeHtml(p)}</strong><span>0</span>`;board.appendChild(c);});els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');await gameWait(1050,players);
    const live=new Map(players.map(p=>[p,0]));for(let shot=0;shot<3;shot++){for(const p of players){const st=match.stones.get(p)[shot],stone=document.createElement('div');stone.className='curling-stone';stone.style.setProperty('--stone-color',colorForName(p));stone.innerHTML='<b></b>';sheet.appendChild(stone);const sr=sheet.getBoundingClientRect(),hr=house.getBoundingClientRect(),tx=hr.left-sr.left+(st.x/100)*hr.width,ty=hr.top-sr.top+(st.y/100)*hr.height;call.textContent=`${p} · STONE ${shot+1}`;stone.style.left='7%';stone.style.top='50%';await gameWait(140,players);stone.style.transition='left .95s cubic-bezier(.12,.78,.18,1),top .95s ease,transform .95s linear';stone.style.left=`${tx}px`;stone.style.top=`${ty}px`;stone.style.transform='translate(-50%,-50%) rotate(720deg)';audio.whoosh();await gameWait(1080,players);live.set(p,live.get(p)+st.score);board.children[players.indexOf(p)].querySelector('span').textContent=live.get(p);call.textContent=`${st.score} PRECISION`;audio.confirm();await gameWait(480,players);}}
    board.children[players.indexOf(name)].classList.add('winner');call.textContent=`WINNER · ${match.scores.get(name)}`;fireworks(5,colorForName(name));audio.victorySting();await gameWait(1550,players);els.cardField.classList.remove('active-layer');setEvent('CURLING WINNER',name,seatLabel(seat),'','top');await wait(700);
  }

  async function eventStocks(name, seat, pool, studentPool) {
    const players=eventCompetitors(name,studentPool,4,2);if(players.length<2){await eventRain(name,seat,pool);return;}const match=generateStockMatch(players,name);setEvent('STOCK MARKET','CLOSING BELL');hideEventLayer();
    const arena=document.createElement('div');arena.className='stock-arena';arena.innerHTML='<div class="stock-board"></div><div class="stock-chart"><div class="stock-grid"></div><svg viewBox="0 0 100 100" preserveAspectRatio="none"></svg><div class="stock-ticker">OPEN · 100.0</div></div>';const board=arena.querySelector('.stock-board'),svg=arena.querySelector('svg'),ticker=arena.querySelector('.stock-ticker');const lines=new Map();players.forEach(p=>{const c=document.createElement('section');c.style.setProperty('--game-color',colorForName(p));c.innerHTML=`<strong>${escapeHtml(p)}</strong><span>100.0</span><small>0.0%</small>`;board.appendChild(c);const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');line.setAttribute('fill','none');line.setAttribute('stroke',colorForName(p));line.setAttribute('stroke-width','1.8');line.setAttribute('vector-effect','non-scaling-stroke');svg.appendChild(line);lines.set(p,line);});els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');await gameWait(1100,players);
    const point=(v,i,n)=>`${(i/(n-1))*100},${95-clamp((v-35)/150,0,1)*90}`;for(let tick=1;tick<12;tick++){for(const p of players){const path=match.paths.get(p),visible=path.slice(0,tick+1);lines.get(p).setAttribute('points',visible.map((v,i)=>point(v,i,path.length)).join(' '));const price=path[tick],pct=((price/100)-1)*100,card=board.children[players.indexOf(p)];card.querySelector('span').textContent=price.toFixed(1);card.querySelector('small').textContent=`${pct>=0?'+':''}${pct.toFixed(1)}%`;card.classList.toggle('down',pct<0);}ticker.textContent=`TICK ${tick}/11`;audio.tick(310+tick*22,.018);if(tick===5||tick===9)particlesBurst(.5,.45,24,pick(COLORS),.28);await gameWait(430,players);}
    const winnerCard=board.children[players.indexOf(name)];winnerCard.classList.add('winner');ticker.textContent=`MARKET WINNER · ${match.paths.get(name).at(-1).toFixed(1)}`;audio.victorySting();fireworks(6,colorForName(name));await gameWait(1650,players);els.cardField.classList.remove('active-layer');setEvent('TOP STOCK',name,seatLabel(seat),'','top');await wait(700);
  }

  async function eventBatting(name, seat, pool, studentPool) {
    const players=eventCompetitors(name,studentPool,4,2);if(players.length<2){await eventBaseball(name,seat,pool,studentPool);return;}const match=generateBattingMatch(players,name);setEvent('BATTING CLASH','3 AT-BATS · BASE RUNNING');hideEventLayer();
    const arena=document.createElement('div');arena.className='batting-arena batting-v151';arena.innerHTML='<div class="batting-board"></div><div class="batting-field"><div class="batting-cut left"></div><div class="batting-cut right"></div><div class="batting-base base-second" data-base="2"><b>2</b></div><div class="batting-base base-third" data-base="3"><b>3</b></div><div class="batting-base base-first" data-base="1"><b>1</b></div><div class="batting-home">HOME</div><div class="batting-pitcher"><i></i><small>P</small></div><div class="batting-batter"><i></i><b></b></div><div class="batting-ball"></div><div class="batting-runner"></div><div class="batting-outs">OUTS <b>○ ○ ○</b></div><div class="batting-call">READY</div></div>';
    const board=arena.querySelector('.batting-board'),field=arena.querySelector('.batting-field'),ball=arena.querySelector('.batting-ball'),runner=arena.querySelector('.batting-runner'),batter=arena.querySelector('.batting-batter'),call=arena.querySelector('.batting-call'),outsLabel=arena.querySelector('.batting-outs b'),baseNodes=[...arena.querySelectorAll('.batting-base')];
    players.forEach(p=>{const c=document.createElement('section');c.style.setProperty('--game-color',colorForName(p));c.innerHTML=`<strong>${escapeHtml(p)}</strong><span>0 R</span><small>TB 0 · AB 0/3</small>`;board.appendChild(c);});els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');await gameWait(1150,players);
    const pos={home:[50,84],1:[68,62],2:[50,38],3:[32,62]};
    const setBases=(occupied,color)=>{baseNodes.forEach((node,i)=>{node.classList.toggle('occupied',!!occupied[i]);node.style.setProperty('--runner-color',color);});};
    const moveRunner=async(base,color)=>{runner.style.setProperty('--runner-color',color);runner.style.opacity='1';runner.style.left=`${pos[base][0]}%`;runner.style.top=`${pos[base][1]}%`;await gameWait(300,players);};
    for(const p of players){
      const seq=match.atBats.get(p),card=board.children[players.indexOf(p)],color=colorForName(p);let previousBases=[false,false,false];board.querySelectorAll('section').forEach(x=>x.classList.remove('active-batter'));card.classList.add('active-batter');setBases(previousBases,color);outsLabel.textContent='○ ○ ○';
      for(let i=0;i<seq.length;i++){
        const ab=seq[i];call.textContent=`${p} · AT BAT ${i+1} / 3`;card.querySelector('small').textContent=`TB ${ab.totalBases-(ab.hitBases||0)} · AB ${i+1}/3`;
        batter.classList.remove('swing');ball.classList.remove('hit-ball');ball.style.transition='none';ball.style.opacity='1';ball.style.left='50%';ball.style.top='44%';ball.style.transform='translate(-50%,-50%) scale(.72)';runner.style.transition='none';runner.style.left='50%';runner.style.top='84%';runner.style.opacity='0';await gameWait(350,players);
        call.textContent='PITCH';audio.tick(470,.026);ball.style.transition=`top ${.38*multiplayerPace(players)}s cubic-bezier(.25,.7,.25,1),transform ${.38*multiplayerPace(players)}s`;ball.style.top='78%';ball.style.transform='translate(-50%,-50%) scale(1)';await gameWait(390,players);
        batter.classList.add('swing');audio.whoosh();await gameWait(150,players);
        const hit=ab.label!=='OUT';ball.classList.add('hit-ball');ball.style.transition=`left ${.72*multiplayerPace(players)}s ease-out,top ${.72*multiplayerPace(players)}s cubic-bezier(.1,.7,.2,1),transform ${.72*multiplayerPace(players)}s linear,opacity ${.72*multiplayerPace(players)}s`;ball.style.left=`${clamp(50+ab.angle*.68,18,82)}%`;ball.style.top=hit?`${clamp(65-ab.distance*.57,5,35)}%`:`${pick([31,38,45])}%`;ball.style.transform='translate(-50%,-50%) scale(.55) rotate(540deg)';ball.style.opacity=ab.label==='OUT'?'.55':'1';await gameWait(740,players);
        if(!hit){
          call.textContent='OUT!';audio.error();outsLabel.textContent=`${'● '.repeat(ab.outs).trim()}${ab.outs<3?' '+ '○ '.repeat(3-ab.outs).trim():''}`;card.querySelector('span').textContent=`${ab.runs} R`;card.querySelector('small').textContent=`TB ${ab.totalBases} · ${ab.label} · AB ${i+1}/3`;field.classList.add('out-flash');await gameWait(700,players);field.classList.remove('out-flash');
        }else{
          call.textContent=ab.label==='HR'?'HOME RUN!':`${ab.label} · RUN!`;audio.confirm();runner.style.transition=`left ${.3*multiplayerPace(players)}s ease,top ${.3*multiplayerPace(players)}s ease,transform ${.3*multiplayerPace(players)}s`;runner.style.transform='translate(-50%,-50%) scale(1)';await moveRunner('home',color);
          const steps=ab.hitBases===4?[1,2,3,'home']:Array.from({length:ab.hitBases},(_,k)=>k+1);
          for(const step of steps){await moveRunner(step,color);audio.tick(560+(step==='home'?4:step)*55,.02);const base=step==='home'?null:baseNodes.find(n=>Number(n.dataset.base)===step);if(base){base.classList.add('step-hit');setTimeout(()=>base.classList.remove('step-hit'),260);}}
          runner.style.opacity='0';setBases(ab.basesAfter,color);card.querySelector('span').textContent=`${ab.runs} R`;card.querySelector('small').textContent=`TB ${ab.totalBases} · ${ab.label} · AB ${i+1}/3`;if(ab.runsOnPlay>0){call.textContent=ab.label==='HR'?`HOME RUN · +${ab.runsOnPlay} RUN${ab.runsOnPlay>1?'S':''}`:`${ab.label} · +${ab.runsOnPlay} RUN${ab.runsOnPlay>1?'S':''}`;particlesBurst(.5,.42,ab.label==='HR'?58:30,color,.5);}
          await gameWait(650,players);
        }
        previousBases=ab.basesAfter;await gameWait(300,players);
      }
      card.classList.remove('active-batter');setBases([false,false,false],color);runner.style.opacity='0';await gameWait(450,players);
    }
    const winnerCard=board.children[players.indexOf(name)];winnerCard.classList.add('winner');call.textContent=`WINNER · ${match.scores.get(name)} RUN${match.scores.get(name)===1?'':'S'} · TB ${match.totalBases.get(name)}`;fireworks(5,colorForName(name));audio.victorySting();await gameWait(1750,players);els.cardField.classList.remove('active-layer');setEvent('BATTING WINNER',name,seatLabel(seat),'','top');await wait(700);
  }

  async function eventTank(name, seat, pool, studentPool) {
    const others=studentPool.filter(n=>n!==name);if(!others.length){await eventBattle(name,seat,pool,studentPool);return;}const opponent=pick(others),duel=duelOrder(name,opponent),plan=generateTankPlan(name,opponent);setEvent('TANK BATTLE','ARMORED DUEL');hideEventLayer();
    const arena=document.createElement('div');arena.className='tank-arena';arena.innerHTML=`<div class="tank-unit left" style="--game-color:${colorForName(duel.leftName)}"><strong>${escapeHtml(duel.leftName)}</strong><div class="tank-hp"><i></i></div><span>100 HP</span><b>▰═</b></div><div class="tank-ground"></div><div class="tank-shell">●</div><div class="tank-unit right" style="--game-color:${colorForName(duel.rightName)}"><strong>${escapeHtml(duel.rightName)}</strong><div class="tank-hp"><i></i></div><span>100 HP</span><b>═▰</b></div><div class="tank-call">TARGETING</div>`;const left=arena.querySelector('.tank-unit.left'),right=arena.querySelector('.tank-unit.right'),shell=arena.querySelector('.tank-shell'),call=arena.querySelector('.tank-call'),unitFor=p=>p===duel.leftName?left:right;els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');await wait(1150);
    for(const turn of plan.turns){const att=unitFor(turn.attacker),def=unitFor(turn.defender);call.textContent=`${turn.attacker} FIRES`;shell.style.transition='none';shell.style.left=att===left?'22%':'78%';shell.style.top='60%';await wait(150);shell.style.transition='left .62s ease,top .62s cubic-bezier(.12,.7,.18,1)';shell.style.left=att===left?'76%':'24%';shell.style.top=turn.hit?'58%':`${20+turn.arc*30}%`;audio.explosion();await wait(790);if(turn.hit){def.querySelector('span').textContent=`${turn.hpAfter} HP`;def.querySelector('.tank-hp i').style.width=`${turn.hpAfter}%`;def.classList.add('hit');call.textContent=turn.crit?`CRITICAL · -${turn.dmg}`:`HIT · -${turn.dmg}`;audio.hit();await wait(440);def.classList.remove('hit');if(turn.hpAfter<=0){def.classList.add('destroyed');audio.explosion();particlesBurst(def===left?.25:.75,.56,100,'#ff8a34',1.1);break;}}else{call.textContent='MISS';await wait(350);}}
    unitFor(name).classList.add('winner');call.textContent='VICTORY';fireworks(6,colorForName(name));audio.victorySting();await wait(1650);els.cardField.classList.remove('active-layer');setEvent('TANK ACE',name,seatLabel(seat),'','top');await wait(700);
  }

  async function eventCooking(name, seat, pool, studentPool) {
    const players=eventCompetitors(name,studentPool,4,2);if(players.length<2){await eventCards(name,seat,pool);return;}const match=generateCookingMatch(players,name),categories=['TASTE','TECHNIQUE','PRESENTATION'];setEvent('COOK-OFF','PREP · COOK · PLATE · JUDGE');hideEventLayer();
    const dishIcon=d=>({PASTA:'🍝',STEAK:'🥩',CURRY:'🍛',RISOTTO:'🍚',RAMEN:'🍜',TACOS:'🌮',OMELETTE:'🍳',PAELLA:'🥘'}[d]||'🍽️');
    const arena=document.createElement('div');arena.className='cooking-arena cooking-v15';arena.innerHTML='<div class="cooking-board"></div><div class="cooking-stage cooking-stage-v15"><div class="kitchen-chef"><strong>CHEF READY</strong><span>🍽️</span><em>WAITING</em></div><div class="prep-board">🥕 🧅 🥬</div><div class="cooking-pan">🍳</div><div class="dish-plate">◯</div><div class="cooking-steam">⌁⌁⌁</div><div class="cooking-call">MISE EN PLACE</div></div>';const board=arena.querySelector('.cooking-board'),stage=arena.querySelector('.cooking-stage'),call=arena.querySelector('.cooking-call'),chef=arena.querySelector('.kitchen-chef'),pan=arena.querySelector('.cooking-pan');
    players.forEach(p=>{const c=document.createElement('section');c.style.setProperty('--game-color',colorForName(p));c.innerHTML=`<strong>${escapeHtml(p)}</strong><em>${match.dishes.get(p)}</em><div class="cook-marks">${categories.map(x=>`<span><small>${x}</small><i class="cook-score-value">--</i></span>`).join('')}</div><b class="cook-total">0</b>`;board.appendChild(c);});els.cardField.appendChild(arena);els.cardField.classList.add('active-layer');await gameWait(1250,players);
    for(const p of players){const card=board.children[players.indexOf(p)],dish=match.dishes.get(p),vals=match.scores.get(p);board.querySelectorAll('section').forEach(c=>c.classList.remove('active-chef'));card.classList.add('active-chef');chef.querySelector('strong').textContent=p;chef.querySelector('span').textContent=dishIcon(dish);chef.querySelector('em').textContent=dish;stage.style.setProperty('--chef-color',colorForName(p));pan.style.setProperty('--pan-color',colorForName(p));
      call.textContent=`${p} · PREP`;stage.className='cooking-stage cooking-stage-v15 phase-prep';audio.tick(420,.025);await gameWait(750,players);
      call.textContent=`${p} · COOK`;stage.className='cooking-stage cooking-stage-v15 phase-cook';audio.whoosh();await gameWait(1050,players);
      call.textContent=`${p} · PLATING`;stage.className='cooking-stage cooking-stage-v15 phase-plate';audio.confirm();await gameWait(850,players);
      call.textContent=`JUDGES · ${p}`;for(let i=0;i<3;i++){const val=vals[i];card.querySelectorAll('.cook-score-value')[i].textContent=val;card.querySelector('.cook-total').textContent=vals.slice(0,i+1).reduce((a,b)=>a+b,0);card.classList.add('judged');audio.confirm();await gameWait(620,players);card.classList.remove('judged');}await gameWait(500,players);
    }
    board.children[players.indexOf(name)].classList.add('winner');call.textContent=`CHEF WINNER · ${match.totals.get(name)}`;stage.className='cooking-stage cooking-stage-v15 phase-winner';fireworks(6,colorForName(name));audio.victorySting();await gameWait(1850,players);els.cardField.classList.remove('active-layer');setEvent('MASTER CHEF',name,seatLabel(seat),'','top');await wait(700);
  }

  async function themedSeatLanding(type, seat, name, mega=false) {
    const p=getSeatPoint(seat);if(!p)return;const rect=els.cinemaStage.getBoundingClientRect();
    if(type==='drop'||type==='final'){
      els.dropName.textContent=name;els.dropName.style.left=`${p.x}px`;els.dropName.style.top=`${p.y}px`;els.dropName.style.fontSize=mega?'clamp(54px,7.5vw,145px)':'clamp(38px,5vw,92px)';els.dropName.className='drop-name fall-seat name-only';audio.whoosh();await wait(760);return;
    }
    const icons={slot:'◉',laser:'⌖',cards:'◆',rain:'✦',glitch:'▣',countdown:'●',rgb:'RGB',lightning:'⚡',battle:'✹',race:'🐎',dart:'➤',spotlight:'✦',elimination:'★',pinball:'●',conveyor:'▰',meteor:'☄',tug:'◆',sprint:'➜',rocket:'🚀',penalty:'⚽',archery:'➳',sumo:'✹',boat:'⛵',rps:'✊',poker:'♠',baseball:'⚾',dice:'⚅',bomb:'💣',throne:'♛',bowling:'●',basketball:'●',cannon:'✹',treasure:'◆',tournament:'★',curling:'●',stocks:'↗',batting:'⚾',tank:'▰',cooking:'♨'};
    const proj=document.createElement('div');proj.className=`seat-projectile project-${type}`;if(type==='dart'){proj.innerHTML='<i></i><b></b>';}else proj.textContent=icons[type]||'◆';els.cinemaStage.appendChild(proj);
    let sx=rect.width*.5,sy=-80,rot=0;
    if(['race','sprint','boat'].includes(type)){sx=-90;sy=p.y;rot=0;}
    if(['rps','poker','dice','treasure','tournament','stocks','cooking'].includes(type)){sx=rect.width*.5;sy=rect.height*.18;rot=0;}
    if(['bowling','basketball','cannon','bomb','curling','batting','tank'].includes(type)){sx=rect.width*.12;sy=rect.height*.68;rot=0;}
    if(type==='throne'){sx=p.x;sy=-90;rot=0;}
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
    let middle=[];
    if(type==='pinball')middle=[{transform:`translate(-50%,-50%) translate(${dx*.45}px,${dy*.15-90}px) rotate(${angle}deg) scale(1.2)`}];
    else if(type==='basketball')middle=[{transform:`translate(-50%,-50%) translate(${dx*.52}px,${dy*.35-145}px) rotate(${angle+220}deg) scale(1.05)`}];
    else if(type==='bowling')middle=[{transform:`translate(-50%,-50%) translate(${dx*.58}px,${dy*.72}px) rotate(540deg) scale(.95)`}];
    else if(type==='cannon')middle=[{transform:`translate(-50%,-50%) translate(${dx*.52}px,${dy*.42-85}px) scale(1.18)`}];
    else if(type==='bomb')middle=[{transform:`translate(-50%,-50%) translate(${dx*.5}px,${dy*.4-70}px) rotate(360deg) scale(1.45)`}];
    else if(type==='throne')middle=[{transform:`translate(-50%,-50%) translate(${dx*.5}px,${dy*.48}px) rotate(-18deg) scale(1.4)`}];
    else if(type==='curling')middle=[{transform:`translate(-50%,-50%) translate(${dx*.58}px,${dy*.82}px) rotate(540deg) scale(.95)`}];
    else if(type==='batting')middle=[{transform:`translate(-50%,-50%) translate(${dx*.45}px,${dy*.2-110}px) rotate(360deg) scale(.9)`}];
    else if(type==='tank')middle=[{transform:`translate(-50%,-50%) translate(${dx*.5}px,${dy*.35-60}px) rotate(0deg) scale(1.1)`}];
    else if(type==='stocks')middle=[{transform:`translate(-50%,-50%) translate(${dx*.5}px,${dy*.3-80}px) scale(1.25)`}];
    else if(type==='cooking')middle=[{transform:`translate(-50%,-50%) translate(${dx*.5}px,${dy*.4-45}px) rotate(12deg) scale(1.2)`}];
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


  async function animateChaosExchange(revealed, seatA, seatB, label='SEAT SWITCH') {
    const nameA=revealed.get(seatA),nameB=revealed.get(seatB);if(!nameA||!nameB)return false;const pa=getSeatPoint(seatA),pb=getSeatPoint(seatB);if(!pa||!pb)return false;
    els.cinemaSeats.classList.add('swap-dim');const ghost=(name,p,color)=>{const g=document.createElement('div');g.className='swap-ghost chaos-ghost';g.textContent=name;g.style.left=`${p.x}px`;g.style.top=`${p.y}px`;g.style.setProperty('--ghost-color',color);els.cinemaStage.appendChild(g);return g;};const ga=ghost(nameA,pa,colorForName(nameA)),gb=ghost(nameB,pb,colorForName(nameB));audio.whoosh();
    await Promise.allSettled([ga.animate([{transform:'translate(-50%,-50%) scale(1)'},{transform:`translate(calc(-50% + ${(pb.x-pa.x)*.52}px),calc(-50% + ${(pb.y-pa.y)*.52-90}px)) scale(1.3) rotate(12deg)`},{transform:`translate(calc(-50% + ${pb.x-pa.x}px),calc(-50% + ${pb.y-pa.y}px)) scale(1)`}],{duration:1800,easing:'cubic-bezier(.18,.78,.2,1)',fill:'forwards'}).finished,gb.animate([{transform:'translate(-50%,-50%) scale(1)'},{transform:`translate(calc(-50% + ${(pa.x-pb.x)*.52}px),calc(-50% + ${(pa.y-pb.y)*.52+90}px)) scale(1.3) rotate(-12deg)`},{transform:`translate(calc(-50% + ${pa.x-pb.x}px),calc(-50% + ${pa.y-pb.y}px)) scale(1)`}],{duration:1800,easing:'cubic-bezier(.18,.78,.2,1)',fill:'forwards'}).finished]);
    ga.remove();gb.remove();revealed.set(seatA,nameB);revealed.set(seatB,nameA);state.assignment.set(seatA,nameB);state.assignment.set(seatB,nameA);els.cinemaSeats.classList.remove('swap-dim');renderCinemaSeats(revealed);for(const s of [seatA,seatB]){const p=getSeatPoint(s);if(p){impactWaves(p.nx,p.ny,5,58);fireworksAt(p.nx,p.ny,5,colorForName(revealed.get(s)));}}audio.impact(true);screenImpact();await wait(950);return true;
  }

  async function mysterySwitchEvent(revealed) {
    const locked=new Set(state.locks.values()),candidates=shuffle([...revealed.entries()].filter(([s])=>!locked.has(s)));if(candidates.length<2)return false;const [a,b]=candidates.slice(0,2);clearTransient();setEventColor('#36e7ff');setEvent('MYSTERY SWITCH','INCOMING',`${seatMini(a[0])} · ${escapeHtml(a[1])}   ⇄   ${seatMini(b[0])} · ${escapeHtml(b[1])}`);audio.glitch();await wait(2300);for(let i=0;i<8;i++){els.eventTitle.textContent=i%2?'???':'SWITCH';await wait(130);}hideEventLayer();const ok=await animateChaosExchange(revealed,a[0],b[0],'MYSTERY');if(ok){fireworks(6,'#36e7ff');els.swapField.classList.add('active-layer');const done=document.createElement('div');done.className='chaos-result';done.innerHTML=`<strong>MYSTERY SWITCH</strong><span>${escapeHtml(a[1])} → ${seatMini(b[0])}</span><small>${escapeHtml(b[1])} → ${seatMini(a[0])}</small>`;els.swapField.appendChild(done);await wait(2300);els.swapField.classList.remove('active-layer');els.swapField.innerHTML='';state.swapCount++;state.chaosCount++;}return ok;
  }


  async function runChaosMutation(revealed) {
    // V15: CHAOS stays readable. Only two-seat changes remain.
    if(Math.random()<.78){const ok=await swapAssignedSeats(revealed);if(ok)state.chaosCount++;return ok;}
    return mysterySwitchEvent(revealed);
  }

  async function swapAssignedSeats(revealed) {
    const locked=new Set(state.locks.values());const candidates=[...revealed.entries()].filter(([seat])=>!locked.has(seat));if(candidates.length<2)return false;
    const [[seatA,nameA],[seatB,nameB]]=shuffle(candidates).slice(0,2),type=pick(SWAP_POOL);clearTransient();setEventColor('#ff3bd4');renderCinemaSeats(revealed);els.swapField.classList.add('active-layer');
    const typeName={cross:'CROSS SWAP',portal:'PORTAL SWAP',orbit:'ORBIT SWAP',warp:'WARP SWAP'}[type];const board=document.createElement('div');board.className='swap-board swap-notice-board';board.innerHTML=`<div class="swap-alert">${typeName}</div><div class="swap-side a"><span>${seatMini(seatA)}</span><strong>${escapeHtml(nameA)}</strong></div><div class="swap-icon">⇄</div><div class="swap-side b"><span>${seatMini(seatB)}</span><strong>${escapeHtml(nameB)}</strong></div><div class="swap-notice">SWAP CONFIRMED // LOCKED SEATS EXCLUDED</div>`;els.swapField.appendChild(board);audio.warning();particlesBurst(.5,.5,120,null,1.4);fireworks(6,'#ff3bd4');await wait(3800);
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
    els.swapField.classList.add('active-layer');const done=document.createElement('div');done.className='swap-complete';done.innerHTML=`<strong>SWAP COMPLETE</strong><span>${seatMini(seatA)} · ${escapeHtml(nameB)} &nbsp;&nbsp;⇄&nbsp;&nbsp; ${seatMini(seatB)} · ${escapeHtml(nameA)}</span>`;els.swapField.appendChild(done);await wait(2600);els.swapField.classList.remove('active-layer');clearTransient();renderCinemaSeats(revealed);state.swapCount++;return true;
  }

  async function runDraw() {
    const err=validateSetup();if(err){els.setupMessage.textContent=err;return;}els.setupMessage.textContent='';state.running=true;state.skip=false;state.completed=false;state.assignment=createAssignment();state.eventQueue=[];state.lastEvent=null;state.swapCount=0;state.chaosCount=0;els.backButton.hidden=true;els.downloadButton.hidden=true;els.skipButton.hidden=false;els.finalBadge.hidden=true;els.cinemaClassroom.classList.remove('final-view');
    const names=roster();els.cinemaView.hidden=false;els.setupView.setAttribute('aria-hidden','true');renderCinemaSeats(new Map());resizeCanvas();audio.ensure();audio.setVolume(state.volume);audio.setSfxVolume(state.sfxVolume);audio.externalPausedByUser=false;audio.startBgm('intro');
    try{if(!document.fullscreenElement&&els.cinemaView.requestFullscreen)await els.cinemaView.requestFullscreen();}catch(_){ }
    await introSequence(names);if(state.skip){await finishImmediately();return;}audio.startBgm('draw');
    const lockedSeats=new Set(state.locks.values());let queue=shuffle([...state.assignment.entries()].filter(([seat])=>!lockedSeats.has(seat)));const revealed=new Map();state.locks.forEach((seat,name)=>revealed.set(seat,name));renderCinemaSeats(revealed);const total=queue.length;let midDone=false;let assignedUnlocked=0;const chaosThresholds=total>=20?[Math.max(4,Math.floor(total*.20)),Math.max(7,Math.floor(total*.38)),Math.max(10,Math.floor(total*.56)),Math.max(13,Math.floor(total*.73)),Math.max(16,Math.floor(total*.86))]:total>=10?[3,Math.max(5,Math.floor(total*.50)),Math.max(7,Math.floor(total*.78))]:[Math.max(3,Math.floor(total*.55))];
    while(queue.length){
      if(state.skip){await finishImmediately();return;}const remaining=queue.length;
      if(!midDone&&total>=8&&remaining===Math.ceil(total/2)){midDone=true;await midShuffle(queue.map(([,name])=>name));queue=shuffle(queue);}
      if(state.chaosCount<chaosThresholds.length&&assignedUnlocked>=chaosThresholds[state.chaosCount]&&[...revealed.keys()].filter(s=>!lockedSeats.has(s)).length>=2){await runChaosMutation(revealed);}
      if(remaining===5){audio.startBgm('final');await finalFiveIntro(queue);}if(remaining===3)await finalThreeIntro(queue);if(remaining===2)await finalTwo(queue);
      if(remaining===1){const entry=queue.shift();await finalStudent(entry);await commitAssignment(revealed,entry[0],entry[1],true,'final');assignedUnlocked++;break;}
      const [seat,name]=queue.shift();const available=queue.map(([s])=>s).concat([seat]);const studentPool=queue.map(([,n])=>n).concat([name]);const ev=nextEvent();
      await drawEvent(ev,name,seat,available,studentPool,remaining,total-queue.length-1,total);await commitAssignment(revealed,seat,name,remaining<=3,ev);assignedUnlocked++;if(remaining>6&&state.chaosCount<9&&assignedUnlocked>=5&&Math.random()<.14&&[...revealed.keys()].filter(s=>!lockedSeats.has(s)).length>=2){await runChaosMutation(revealed);}await wait(remaining<=5?820:430);
    }
    if(state.chaosCount===0&&[...revealed.keys()].filter(s=>!lockedSeats.has(s)).length>=2){const ok=await swapAssignedSeats(revealed);if(ok)state.chaosCount++;}
    await repairPairHistory(revealed);
    await finale(revealed);state.running=false;audio.stopHeartbeat();els.skipButton.hidden=true;els.backButton.hidden=false;
  }

  async function finishImmediately() {
    state.skip=false;clearTransient();audio.stopHeartbeat();renderCinemaSeats(state.assignment);els.cinemaClassroom.classList.add('final-view');hideEventLayer();setProgress(100);setEventColor('#36e7ff');els.remainingLabel.textContent='COMPLETE';els.finalBadge.hidden=false;audio.victory();fireworks(10,null);state.running=false;state.completed=true;els.skipButton.hidden=true;els.backButton.hidden=false;els.downloadButton.hidden=false;
  }

  function resizeCanvas() {
    const r=els.cinemaStage.getBoundingClientRect(),dpr=Math.min(LOW_POWER?1.25:1.75,window.devicePixelRatio||1);els.fxCanvas.width=Math.round(r.width*dpr);els.fxCanvas.height=Math.round(r.height*dpr);els.fxCanvas.style.width=`${r.width}px`;els.fxCanvas.style.height=`${r.height}px`;const ctx=els.fxCanvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function particlesBurst(nx=.5,ny=.5,count=60,color=null,power=1) {
    const rect=els.cinemaStage.getBoundingClientRect(),remaining=Math.max(0,PARTICLE_CAP-state.particles.length),scaled=Math.min(remaining,Math.max(0,Math.round(count*FX_SCALE)));if(!scaled)return;
    for(let i=0;i<scaled;i++){const a=Math.random()*Math.PI*2,speed=(85+Math.random()*390)*power;state.particles.push({x:rect.width*nx,y:rect.height*ny,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-45*power,life:.7+Math.random()*1.05,max:1.75,size:1+Math.random()*4.2,color:color||pick(COLORS),gravity:190+Math.random()*250,trail:Math.random()<.28});}
  }

  function fireworks(count=3,color=null){for(let i=0;i<count;i++)setTimeout(()=>{const x=.12+Math.random()*.76,y=.15+Math.random()*.55;particlesBurst(x,y,55+Math.floor(Math.random()*48),color||pick(COLORS),.9+Math.random()*.75);audio.firework();},i*155)}
  function fireworksAt(nx,ny,count=3,color=null){for(let i=0;i<count;i++)setTimeout(()=>{particlesBurst(clamp(nx+(Math.random()-.5)*.12,.05,.95),clamp(ny+(Math.random()-.5)*.12,.08,.9),45+Math.floor(Math.random()*40),color||pick(COLORS),.85+Math.random()*.7);audio.firework();},i*130)}

  function fxLoop(){
    const ctx=els.fxCanvas.getContext('2d'),rect=els.cinemaStage.getBoundingClientRect(),dt=.016;ctx.clearRect(0,0,rect.width,rect.height);state.particles=state.particles.filter(p=>p.life>0);
    for(const p of state.particles){p.life-=dt;p.vy+=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.992;ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=LOW_POWER?5:(state.particles.length>600?7:12);if(p.trail)ctx.fillRect(p.x,p.y,p.size*3.6,p.size*.8);else{ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}}
    ctx.globalAlpha=1;ctx.shadowBlur=0;state.raf=requestAnimationFrame(fxLoop);
  }

  const audio = {
    ctx:null,master:null,music:null,sfx:null,compressor:null,bgmTimer:null,heartbeatTimer:null,customEl:null,customUrl:null,playlist:[],playlistIndex:0,objectUrls:[],externalPausedByUser:false,
    ensure(){if(!state.soundOn)return;if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.master=this.ctx.createGain();this.music=this.ctx.createGain();this.sfx=this.ctx.createGain();this.compressor=this.ctx.createDynamicsCompressor();this.compressor.threshold.value=-16;this.compressor.knee.value=18;this.compressor.ratio.value=7;this.compressor.attack.value=.003;this.compressor.release.value=.22;this.music.gain.value=state.volume;this.sfx.gain.value=1.35*state.sfxVolume;this.music.connect(this.master);this.sfx.connect(this.master);this.master.connect(this.compressor);this.compressor.connect(this.ctx.destination);this.setVolume(state.volume);this.setSfxVolume(state.sfxVolume);}if(this.ctx.state==='suspended')this.ctx.resume();},
    setVolume(v){state.volume=clamp(v,0,1);if(this.master)this.master.gain.value=state.soundOn?1:0;if(this.music)this.music.gain.value=state.volume;if(this.customEl)this.customEl.volume=state.soundOn?state.volume:0;},
    setSfxVolume(v){state.sfxVolume=clamp(v,0,1.2);if(this.sfx)this.sfx.gain.value=1.35*state.sfxVolume;},
    releaseObjectUrls(){this.objectUrls.forEach(u=>URL.revokeObjectURL(u));this.objectUrls=[];},
    setPlaylist(tracks,label='AUTO PLAYLIST',startIndex=0){if(this.customEl){this.customEl.pause();this.customEl.onended=null;}this.customEl=null;this.playlist=(tracks||[]).filter(t=>t&&t.src).map(t=>({title:t.title||t.src,src:t.src}));this.playlistIndex=clamp(startIndex,0,Math.max(0,this.playlist.length-1));state.bgmResumeIndex=this.playlistIndex;state.bgmMode=this.playlist.length?'external':'synth';state.customBgmName=label;if(els.bgmFileName)els.bgmFileName.textContent=this.playlist.length?`${label} · ${this.playlist.length} TRACK${this.playlist.length===1?'':'S'}`:'BUILT-IN SYNTH BGM';},
    loadCustomFiles(files){this.releaseObjectUrls();const tracks=[...files].filter(f=>f&&f.type.startsWith('audio/')||f&&/\.(mp3|m4a|aac|wav|ogg|flac)$/i.test(f.name)).map(f=>{const src=URL.createObjectURL(f);this.objectUrls.push(src);return{title:f.name,src};});this.setPlaylist(tracks,tracks.length>1?'TEMP PLAYLIST':'TEMP FILE');},
    createExternal(index=this.playlistIndex,autoplay=false){if(!this.playlist.length)return null;if(this.customEl){this.customEl.pause();this.customEl.onended=null;}this.playlistIndex=(index+this.playlist.length)%this.playlist.length;const track=this.playlist[this.playlistIndex];const el=new Audio(track.src);el.preload='auto';el.loop=false;el.volume=state.soundOn?state.volume:0;el.onended=()=>{if(!this.externalPausedByUser&&state.soundOn){this.playlistIndex=(this.playlistIndex+1)%this.playlist.length;state.bgmResumeTime=0;queuePersistentSave();this.createExternal(this.playlistIndex,true);}};el.onerror=()=>{if(this.playlist.length>1&&!this.externalPausedByUser){this.playlistIndex=(this.playlistIndex+1)%this.playlist.length;setTimeout(()=>this.createExternal(this.playlistIndex,true),250);}};this.customEl=el;state.bgmResumeIndex=this.playlistIndex;if(els.bgmFileName)els.bgmFileName.textContent=`${track.title}  ·  ${this.playlistIndex+1}/${this.playlist.length}`;el.addEventListener('loadedmetadata',()=>{if(state.bgmResumeTime>0&&Number.isFinite(el.duration)){el.currentTime=Math.min(state.bgmResumeTime,Math.max(0,el.duration-.2));state.bgmResumeTime=0;}},{once:true});let lastSavedSecond=-1;el.addEventListener('timeupdate',()=>{const sec=Math.floor(el.currentTime||0);if(sec!==lastSavedSecond&&sec%2===0){lastSavedSecond=sec;queuePersistentSave();}});el.addEventListener('play',()=>{state.bgmWasPlaying=true;queuePersistentSave();});el.addEventListener('pause',()=>{state.bgmWasPlaying=false;queuePersistentSave();});if(autoplay)el.play().catch(()=>{});return el;},
    toggleCustomPreview(){if(!this.playlist.length)return false;if(!this.customEl)this.createExternal(this.playlistIndex,false);if(this.customEl.paused){this.externalPausedByUser=false;this.customEl.volume=state.soundOn?state.volume:0;this.customEl.play().catch(()=>{});if(els.bgmPlayButton)els.bgmPlayButton.textContent='PAUSE BGM';}else{this.externalPausedByUser=true;this.customEl.pause();if(els.bgmPlayButton)els.bgmPlayButton.textContent='PLAY BGM';}return true;},
    tone(freq=440,dur=.1,type='sine',gain=.08,when=0,bus='sfx',detune=0){if(!state.soundOn)return;this.ensure();if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),dest=bus==='music'?this.music:this.sfx;o.type=type;o.frequency.setValueAtTime(freq,this.ctx.currentTime+when);o.detune.value=detune;g.gain.setValueAtTime(Math.max(.0001,gain),this.ctx.currentTime+when);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+when+dur);o.connect(g);g.connect(dest);o.start(this.ctx.currentTime+when);o.stop(this.ctx.currentTime+when+dur+.03);},
    noise(dur=.18,gain=.08,filter=900,type='lowpass'){if(!state.soundOn)return;this.ensure();if(!this.ctx)return;const len=Math.floor(this.ctx.sampleRate*dur),buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate),data=buf.getChannelData(0);for(let i=0;i<len;i++)data[i]=Math.random()*2-1;const src=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();src.buffer=buf;f.type=type;f.frequency.value=filter;g.gain.setValueAtTime(gain,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+dur);src.connect(f);f.connect(g);g.connect(this.sfx);src.start();src.stop(this.ctx.currentTime+dur);},
    ui(f=520){this.tone(f,.06,'square',.045)},tick(f=460,g=.015){this.tone(f,.04,'square',g)},boot(){this.tone(58,.8,'sawtooth',.16);this.tone(116,.55,'triangle',.09,.12);this.tone(232,.32,'sine',.075,.34);this.noise(.35,.05,1400)},scan(){for(let i=0;i<9;i++)this.tone(340+i*48,.055,'square',.034,i*.07)},confirm(){this.tone(520,.12,'triangle',.085);this.tone(780,.18,'sine',.075,.08);this.tone(1040,.16,'triangle',.045,.16)},lock(){this.tone(960,.06,'square',.075);this.tone(480,.18,'triangle',.09,.04);this.tone(120,.22,'sine',.08,.03)},shuffleStart(){this.noise(.5,.075,2200);this.tone(100,.5,'sawtooth',.065)},whoosh(){this.noise(.58,.14,3000);this.noise(.48,.07,800,'highpass');this.tone(145,.48,'sine',.08)},impact(mega=false){this.noise(mega?.88:.56,mega?.34:.27,600);this.noise(.19,.15,4200,'highpass');this.tone(mega?34:44,mega?.86:.62,'sine',mega?.38:.30);this.tone(88,.28,'sawtooth',.16);this.tone(176,.13,'square',.09,.02);this.tone(352,.08,'square',.05,.05)},explosion(){this.noise(.8,.3,850);this.tone(36,.8,'sine',.35);this.tone(72,.3,'sawtooth',.16);this.tone(144,.15,'square',.08,.04)},firework(){this.noise(.16,.085,2200);this.tone(740+Math.random()*520,.14,'triangle',.042)},spin(){for(let i=0;i<15;i++)this.tone(200+i*20,.04,'square',.024,i*.075)},brake(){this.tone(360,.14,'sawtooth',.11);this.tone(220,.2,'triangle',.1,.08);this.noise(.15,.07,1200)},wind(){this.noise(.9,.055,3000)},glitch(){for(let i=0;i<15;i++)this.tone(120+Math.random()*1000,.035,'square',.032,i*.04)},warning(){this.tone(180,.25,'square',.1);this.tone(180,.25,'square',.1,.36);this.tone(90,.5,'sine',.06)},error(){this.tone(230,.18,'sawtooth',.11);this.tone(170,.24,'sawtooth',.1,.13)},countdown(n){this.tone(n===1?590:430,.15,'square',.12);this.tone(70,.15,'sine',.11)},powerDown(){this.tone(180,.85,'sawtooth',.08);this.tone(75,.9,'sine',.08)},lightning(){this.noise(.65,.28,3600);this.noise(.85,.18,500);this.tone(48,.55,'sine',.28)},special(tier){if(tier.startsWith('ULTRA')){this.tone(210,.6,'sine',.13);this.tone(840,.55,'triangle',.08,.15);this.noise(.4,.08,2600)}else{this.tone(660,.14,'triangle',.09);this.tone(990,.2,'sine',.08,.1)}},battleStart(){this.tone(92,.42,'sawtooth',.1);this.tone(184,.2,'square',.065,.18)},hit(){this.noise(.13,.12,900);this.tone(68,.18,'sine',.14);this.tone(240,.06,'square',.06)},raceStart(){for(let i=0;i<4;i++)this.tone(280+i*100,.08,'square',.06,i*.12)},eliminate(){this.tone(180,.12,'sawtooth',.07);this.noise(.08,.04,900)},pinball(){this.tone(880,.08,'sine',.065);this.tone(1320,.07,'triangle',.045,.08)},heartbeat(long=false){this.stopHeartbeat();this.ensure();let count=0;this.heartbeatTimer=setInterval(()=>{if(!state.soundOn)return;this.tone(52,.12,'sine',.18);this.tone(43,.13,'sine',.12,.17);if(!long&&++count>10)this.stopHeartbeat()},500)},stopHeartbeat(){if(this.heartbeatTimer){clearInterval(this.heartbeatTimer);this.heartbeatTimer=null}},finalRise(big=false){for(let i=0;i<(big?11:8);i++)this.tone(105*Math.pow(1.085,i),.45,'triangle',.04,i*.14,'music')},victorySting(){[523,659,784].forEach((f,i)=>this.tone(f,.28,'triangle',.08,i*.08));this.tone(64,.42,'sine',.12)},victory(){this.stopHeartbeat();[523.25,659.25,783.99,1046.5].forEach((f,i)=>this.tone(f,.55,'triangle',.09,i*.14));this.tone(52,.9,'sine',.16);this.noise(.35,.06,1800)},
    stopBgm(){if(this.bgmTimer){clearInterval(this.bgmTimer);this.bgmTimer=null;}if(this.customEl){this.customEl.pause();}this.externalPausedByUser=false;if(els.bgmPlayButton)els.bgmPlayButton.textContent='PLAY BGM';},
    startBgm(mode='draw'){if(!state.soundOn)return;if(this.playlist.length){if(!this.customEl)this.createExternal(this.playlistIndex,true);else if(this.customEl.paused&&!this.externalPausedByUser)this.customEl.play().catch(()=>{});return;}if(this.bgmTimer){clearInterval(this.bgmTimer);this.bgmTimer=null;}this.ensure();const configs={intro:{seq:[110,138.6,164.8,196],tempo:500,gain:.038},draw:{seq:[82.4,110,123.5,146.8,164.8,146.8],tempo:360,gain:.04},final:{seq:[73.4,82.4,110,130.8,146.8,174.6],tempo:270,gain:.052}};const c=configs[mode]||configs.draw;let i=0;this.bgmTimer=setInterval(()=>{const f=c.seq[i++%c.seq.length];this.tone(f,.3,'triangle',c.gain,0,'music');this.tone(f/2,.42,'sine',c.gain*.8,0,'music');if(i%4===0)this.tone(f*2,.12,'square',c.gain*.24,0,'music')},c.tempo);}
  };

  function roundRect(ctx,x,y,w,h,r){const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();}

  function renderGameArchive() {
    if(!els.archiveGrid)return;
    els.archiveGrid.innerHTML=GAME_ARCHIVE.map((g,i)=>`<article class="archive-card" data-category="${g[2]}"><div><span>${String(i+1).padStart(2,'0')}</span><small>${g[2]} · ${g[3]}</small></div><strong>${g[1]}</strong><p>${g[4]}</p></article>`).join('');
  }
  function openGameArchive(){if(!els.archiveModal)return;renderGameArchive();els.archiveModal.hidden=false;document.body.classList.add('archive-open');}
  function closeGameArchive(){if(!els.archiveModal)return;els.archiveModal.hidden=true;document.body.classList.remove('archive-open');}

  function downloadResultImage() {
    if(!state.assignment.size){els.setupMessage.textContent='저장할 자리배정 결과가 없습니다.';return;}
    const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;const ctx=canvas.getContext('2d');
    const grad=ctx.createRadialGradient(960,420,100,960,420,1050);grad.addColorStop(0,'#111423');grad.addColorStop(.42,'#07080d');grad.addColorStop(1,'#020203');ctx.fillStyle=grad;ctx.fillRect(0,0,1920,1080);
    ctx.fillStyle='#f7f8fc';ctx.font='900 42px system-ui, sans-serif';ctx.fillText('SEAT ASSIGNMENT',90,78);ctx.fillStyle='#7d8290';ctx.font='700 18px system-ui, sans-serif';ctx.fillText(`${state.rows} × ${state.cols}  //  ${roster().length} STUDENTS`,90,112);
    const marginX=90,top=175,bottom=80,boardH=54,gap=14;const areaW=1920-marginX*2,areaH=1080-top-bottom;ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=2;roundRect(ctx,560,top,800,boardH,12);ctx.stroke();ctx.fillStyle='#a0a4ae';ctx.textAlign='center';ctx.font='900 18px system-ui, sans-serif';ctx.fillText('BLACKBOARD',960,top+34);ctx.textAlign='left';
    const gridTop=top+boardH+30,gridH=areaH-boardH-30;const cellW=(areaW-gap*(state.cols-1))/state.cols,cellH=(gridH-gap*(state.rows-1))/state.rows;const lockMap=lockBySeat();
    for(const id of seatIds()){const {row,col}=seatRC(id),x=marginX+(col-1)*(cellW+gap),y=gridTop+(row-1)*(cellH+gap);if(state.inactive.has(id)){ctx.save();ctx.globalAlpha=.08;ctx.strokeStyle='#ffffff';ctx.setLineDash([8,8]);roundRect(ctx,x,y,cellW,cellH,14);ctx.stroke();ctx.restore();continue;}const person=state.assignment.get(id)||lockMap.get(id)||'';const color=person?colorForName(person):'#777b85';ctx.fillStyle='#090a0f';roundRect(ctx,x,y,cellW,cellH,14);ctx.fill();ctx.strokeStyle=person?color:'rgba(255,255,255,.16)';ctx.lineWidth=person?3:1.5;ctx.stroke();ctx.fillStyle='#858995';ctx.font=`800 ${Math.max(13,Math.min(20,cellH*.13))}px system-ui, sans-serif`;ctx.fillText(`SEAT ${String(id).padStart(2,'0')}`,x+16,y+26);ctx.fillStyle=person?'#ffffff':'#555966';ctx.textAlign='center';const fs=Math.max(22,Math.min(56,cellH*.42,cellW/(Math.max(3,person.length)*.72)));ctx.font=`1000 ${fs}px system-ui, sans-serif`;ctx.fillText(person||'',x+cellW/2,y+cellH*.66);ctx.textAlign='left';}
    ctx.fillStyle='#5d626e';ctx.font='700 14px system-ui, sans-serif';ctx.fillText('SEAT // CINEMATIC DRAW V15',90,1040);
    canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');const now=new Date();a.href=url;a.download=`SEAT_DRAW_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}.png`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);},'image/png');
  }

  els.lockButton.addEventListener('click',()=>{const name=els.lockStudent.value,seat=Number(els.lockSeat.value);if(!name||!seat)return;for(const[other,s]of[...state.locks])if(other===name||s===seat)state.locks.delete(other);state.locks.set(name,seat);renderAllSetup();queuePersistentSave();audio.ensure();audio.lock();});
  els.rosterInput.addEventListener('input',()=>{renderAllSetup();queuePersistentSave();});els.rowInput.addEventListener('change',syncDimensions);els.colInput.addEventListener('change',syncDimensions);
  els.volumeInput.addEventListener('input',()=>{const v=clamp(Number(els.volumeInput.value),0,100);els.volumeValue.textContent=`${v}%`;state.volume=v/100;audio.setVolume(state.volume);queuePersistentSave();});
  if(els.sfxVolumeInput)els.sfxVolumeInput.addEventListener('input',()=>{const v=clamp(Number(els.sfxVolumeInput.value),0,120);els.sfxVolumeValue.textContent=`${v}%`;state.sfxVolume=v/100;audio.setSfxVolume(state.sfxVolume);queuePersistentSave();audio.ui(720);});

  function initBgmLibrary(){
    if(!els.bgmLibrarySelect)return;const lib=Array.isArray(window.SEAT_BGM_LIBRARY)?window.SEAT_BGM_LIBRARY.filter(t=>t&&t.src):[];els.bgmLibrarySelect.innerHTML='';
    if(lib.length){const auto=document.createElement('option');auto.value='__playlist__';auto.textContent=`AUTO PLAYLIST · ${lib.length} TRACK${lib.length===1?'':'S'}`;els.bgmLibrarySelect.appendChild(auto);}
    const synth=document.createElement('option');synth.value='__synth__';synth.textContent='BUILT-IN SYNTH BGM';els.bgmLibrarySelect.appendChild(synth);lib.forEach((track,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=track.title||`TRACK ${i+1}`;els.bgmLibrarySelect.appendChild(o);});
    let sel=state.bgmSelection;if(sel==='__playlist__'&&!lib.length)sel='__synth__';if(/^\d+$/.test(sel)&&!lib[Number(sel)])sel=lib.length?'__playlist__':'__synth__';if(!['__playlist__','__synth__'].includes(sel)&&!/^\d+$/.test(sel))sel=lib.length?'__playlist__':'__synth__';state.bgmSelection=sel;els.bgmLibrarySelect.value=sel;
    if(sel==='__playlist__'){audio.setPlaylist(lib,'AUTO PLAYLIST',Math.min(state.bgmResumeIndex,Math.max(0,lib.length-1)));state.bgmMode='playlist';if(lib.length)audio.createExternal(audio.playlistIndex,false);}else if(sel==='__synth__'){audio.setPlaylist([],'BUILT-IN SYNTH BGM');state.bgmMode='synth';if(els.bgmFileName)els.bgmFileName.textContent='BUILT-IN SYNTH BGM';}else{const idx=Number(sel),t=lib[idx];if(t){audio.setPlaylist([t],t.title||t.src,0);state.bgmMode='single';audio.createExternal(0,false);}}
    if(state.bgmWasPlaying&&audio.customEl&&els.bgmPlayButton)els.bgmPlayButton.textContent='RESUME BGM';
  }
  loadPersistentState();
  initBgmLibrary();
  if(els.bgmLibrarySelect)els.bgmLibrarySelect.addEventListener('change',()=>{const v=els.bgmLibrarySelect.value,lib=(window.SEAT_BGM_LIBRARY||[]).filter(t=>t&&t.src);audio.stopBgm();state.bgmSelection=v;state.bgmResumeTime=0;state.bgmResumeIndex=0;if(v==='__playlist__'){audio.setPlaylist(lib,'AUTO PLAYLIST');state.bgmMode='playlist';}else if(v==='__synth__'){audio.setPlaylist([],'BUILT-IN SYNTH BGM');state.bgmMode='synth';els.bgmFileName.textContent='BUILT-IN SYNTH BGM';}else{const t=lib[Number(v)];if(t){audio.setPlaylist([t],t.title||t.src);state.bgmMode='single';}}queuePersistentSave();});
  if(els.bgmFileInput)els.bgmFileInput.addEventListener('change',()=>{const files=els.bgmFileInput.files;if(!files||!files.length)return;audio.stopBgm();audio.loadCustomFiles(files);state.bgmMode='temp';state.bgmSelection='__temp__';if(els.bgmLibrarySelect)els.bgmLibrarySelect.value='';queuePersistentSave();});
  if(els.bgmPlayButton)els.bgmPlayButton.addEventListener('click',()=>{if(!audio.toggleCustomPreview())els.setupMessage.textContent='BGM LIBRARY에 곡을 넣거나 TEMP FILE을 불러오세요.';});
  if(els.pairModeToggle)els.pairModeToggle.addEventListener('change',()=>{state.pairMode=els.pairModeToggle.checked;if(state.pairMode&&state.cols%2===1){state.cols=Math.min(10,state.cols+1);els.colInput.value=state.cols;}renderAllSetup();queuePersistentSave();audio.ui();});
  if(els.avoidPairHistoryToggle)els.avoidPairHistoryToggle.addEventListener('change',()=>{state.avoidPairHistory=els.avoidPairHistoryToggle.checked;parsePairHistory();try{localStorage.setItem('seatAvoidPairHistory',state.avoidPairHistory?'1':'0');}catch(_){}queuePersistentSave();});
  if(els.pairHistoryInput)els.pairHistoryInput.addEventListener('input',()=>{parsePairHistory();try{localStorage.setItem('seatPairHistory',els.pairHistoryInput.value);}catch(_){}queuePersistentSave();});
  if(els.archiveButton)els.archiveButton.addEventListener('click',openGameArchive);
  if(els.archiveCloseButton)els.archiveCloseButton.addEventListener('click',closeGameArchive);
  if(els.archiveModal)els.archiveModal.addEventListener('click',e=>{if(e.target===els.archiveModal)closeGameArchive();});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&els.archiveModal&&!els.archiveModal.hidden)closeGameArchive();});
  els.startButton.addEventListener('click',runDraw);els.skipButton.addEventListener('click',()=>{state.skip=true;audio.stopHeartbeat();});
  els.downloadButton.addEventListener('click',downloadResultImage);
  els.backButton.addEventListener('click',async()=>{if(state.running)return;audio.stopBgm();audio.stopHeartbeat();clearTransient();try{if(document.fullscreenElement)await document.exitFullscreen();}catch(_){ }els.cinemaView.hidden=true;els.setupView.removeAttribute('aria-hidden');els.cinemaClassroom.classList.remove('focus','assignment-focus','final-view');els.finalBadge.hidden=true;els.backButton.hidden=true;els.downloadButton.hidden=true;els.skipButton.hidden=false;setProgress(0);setEvent('SEAT ASSIGNMENT SYSTEM','READY');renderAllSetup();});
  els.soundButton.addEventListener('click',()=>{state.soundOn=!state.soundOn;els.soundButton.textContent=state.soundOn?'SOUND ON':'SOUND OFF';if(state.soundOn){audio.ensure();audio.setVolume(state.volume);audio.setSfxVolume(state.sfxVolume);audio.ui();if(state.running||state.completed)audio.startBgm('draw');}else{audio.stopBgm();audio.stopHeartbeat();if(audio.master)audio.master.gain.value=0;if(audio.customEl)audio.customEl.pause();}queuePersistentSave();});
  window.addEventListener('resize',resizeCanvas);window.addEventListener('pagehide',savePersistentState);window.addEventListener('beforeunload',savePersistentState);setInterval(()=>{if(audio.customEl&&!audio.customEl.paused)savePersistentState();},3000);

  renderAllSetup();els.volumeValue.textContent=`${Math.round(state.volume*100)}%`;if(els.sfxVolumeValue)els.sfxVolumeValue.textContent=`${Math.round(state.sfxVolume*100)}%`;resizeCanvas();state.raf=requestAnimationFrame(fxLoop);
})();
