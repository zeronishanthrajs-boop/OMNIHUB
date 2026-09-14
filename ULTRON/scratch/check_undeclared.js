
const fs = require('fs');
const js = fs.readFileSync('scratch/test_antigravity.js', 'utf8');
const vm = require('vm');

const mockEl = {
  style: {},
  classList: { add: ()=>{}, remove: ()=>{} },
  appendChild: ()=>{},
  addEventListener: ()=>{},
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
  parentElement: { getBoundingClientRect: () => ({ width: 400, height: 300 }) },
  getBoundingClientRect: () => ({ width: 400, height: 300 }),
  value: 'build an online shop for table fans',
  dispatchEvent: () => {},
  focus: () => {}
};

const context = {
  window: {
    addEventListener: () => {}
  },
  document: {
    querySelector: () => mockEl,
    querySelectorAll: () => [mockEl],
    createElement: () => mockEl,
    body: mockEl,
    addEventListener: () => {}
  },
  console: console,
  performance: { now: () => Date.now() },
  setTimeout: (fn) => fn(),
  setInterval: () => {},
  clearTimeout: () => {},
  clearInterval: () => {},
  localStorage: { getItem: ()=>null, setItem: ()=>{}, removeItem: ()=>{} },
  matchMedia: () => ({ matches: false }),
  fetch: async () => ({ ok: true, json: async () => [] }),
  requestAnimationFrame: () => {},
  alert: (msg) => console.log('ALERT:', msg),
  navigator: {},
  location: { href: '' },
  Event: function() {}
};
context.window = Object.assign(context.window, context);

try {
  vm.createContext(context);
  vm.runInContext(js, context);
  console.log('Context initialized successfully.');
  
  if (context.window.submitPrompt) {
    console.log('Invoking submitPrompt()...');
    context.window.submitPrompt().then(() => {
      console.log('submitPrompt resolved cleanly.');
    }).catch(err => {
      console.log('submitPrompt caught error:', err.name, '::', err.message);
    });
  }
} catch (e) {
  console.log('Initialization Error:', e);
}
