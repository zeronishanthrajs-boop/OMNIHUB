
const js = require('fs').readFileSync('scratch/test_antigravity.js', 'utf8');

// Mock DOM
global.window = global;
global.window.addEventListener = () => {};
const mockCanvas = {
  getContext: () => ({
    clearRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    measureText: () => ({ width: 10 }),
    fillText: () => {},
    setTransform: () => {}
  }),
  parentElement: {
    getBoundingClientRect: () => ({ width: 400, height: 300 })
  },
  width: 100,
  height: 100,
  style: {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 })
};

global.document = {
  querySelector: (sel) => {
    if (sel && (sel.includes('Canvas') || sel.includes('Waveform') || sel.includes('arc') || sel.includes('Reactor'))) return mockCanvas;
    if (sel === '#mainPromptInput') return { 
      value: 'create a website for selling a single table fan worth 200$ we have 300 peice on stock after discount price will be 277$ make sure high quality', 
      style: {}, 
      dispatchEvent: () => {}, 
      focus: ()=>{},
      addEventListener: ()=>{} 
    };
    if (sel === '#sendPromptBtn') return { classList: { add: ()=>{}, remove: ()=>{} }, style: {} };
    if (sel === '#homeView') return { style: {} };
    if (sel === '#conversationView') return { classList: { add: ()=>{} }, style: {} };
    if (sel === '#convTitle') return { textContent: '' };
    if (sel === '#convStatusBadge') return { textContent: '', className: '' };
    if (sel === '#chatStream') return { innerHTML: '' };
    if (sel === '#projectsTreeRoot') return { innerHTML: '' };
    if (sel === '#activeFolderLabel') return { textContent: '' };
    return { style: {}, classList: { add: ()=>{}, remove: ()=>{} }, textContent: '', innerHTML: '', addEventListener: ()=>{} };
  },
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, classList: { add: ()=>{} }, appendChild: ()=>{} }),
  body: { appendChild: ()=>{} },
  addEventListener: () => {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.matchMedia = () => ({ matches: false });
global.fetch = async (url, options) => {
  console.log('FETCH CALLED:', url, options ? options.method : 'GET');
  if (url === '/api/projects') return { ok: true, json: async () => [] };
  if (url === '/api/state') return { ok: true, json: async () => ({ is_running: false, status_code: 'idle' }) };
  if (url === '/api/run') {
    console.log('RUN BODY:', options.body);
    return { ok: true, json: async () => ({ status: 'success' }) };
  }
  return { ok: true, json: async () => ({}) };
};
global.requestAnimationFrame = () => {};
global.setInterval = () => {};
global.setTimeout = (fn) => fn();
global.alert = (msg) => console.log('ALERT:', msg);

try {
  eval(js);
  console.log('Script evaluated successfully.');
  console.log('Testing submitPrompt()...');
  window.submitPrompt().then(() => {
    console.log('SUCCESS: submitPrompt executed and sent command to /api/run!');
  }).catch(e => {
    console.error('submitPrompt PROMISE REJECTED:', e);
  });
} catch (e) {
  console.error('EVAL ERROR:', e);
}
