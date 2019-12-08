import { initObliterator, obliterate } from './obliterator.mjs';
import { log } from '../util.mjs';

const CLASS = {
  CONTENT: 'om-content',
  HIDE: 'om-hide',
  CROSS: 'om-cross'
};

let _capture, _disabled, _autoErasing;

export async function init(capture) {
  _capture = capture;
  browser.runtime.onMessage.addListener(
    _capture.bind(this, onRuntimeMessage)
  );

  handleState(
    await browser.runtime.sendMessage({action: 'get state'})
  );
}

function onRuntimeMessage(message) {
  if (message.action !== 'update content state') {
    return;
  }

  const data = message.data;
  if (_disabled !== data.disabled) {
    _disabled = data.disabled;
    toggleNorthisms(_disabled, _autoErasing);
  }

  if (_autoErasing !== data.autoErasing) {
    _autoErasing = data.autoErasing;
    toggleErasing();
  }
}

function handleState(state) {
  initObliterator(state.northisms);
  _autoErasing = state.autoErasing;
  _disabled = state.disabled;
  browser.runtime.sendMessage({action: 'count', data: {
    location: window.location,
    initialCount: modifyDom(detectNorthisms(_disabled, _autoErasing)),
    takeIntoAccount: takeIntoAccount()
  }});

  observeAddedContent(_capture.bind(this, addedElements => {
    const addCount = modifyDom(detectNorthisms(_disabled, _autoErasing, addedElements));
    addCount > 0 && browser.runtime.sendMessage({action: 'count', data: {
      location: window.location,
      addCount: addCount
    }});
  }));
}

function detectNorthisms(disabled, autoErasing, elements) {
  const
    className = `${CLASS.CONTENT} ${autoErasing ? CLASS.HIDE : CLASS.CROSS}`,
    domMods = [];
  if (disabled) {
    return domMods;
  }

  Array.from(
    elements || document.body.getElementsByTagName('*')
  ).forEach(element => element.childNodes.forEach(
    node => node.nodeType === 3 && obliterate(
      node.nodeValue,
      className,
      text => domMods.push({element: element, node: node, text: text})
    )
  ));

  return domMods;
}

function toggleErasing() {
  document.body.querySelectorAll('.' + CLASS.CONTENT).forEach(node => {
    node.classList.toggle(CLASS.HIDE);
    node.classList.toggle(CLASS.CROSS);
  });
}

function toggleNorthisms(disabled, autoErasing) {
  const nodes = document.body.querySelectorAll('.' + CLASS.CONTENT);
  if (disabled) {
    return nodes.forEach(
      node => node.classList.remove(CLASS.CROSS, CLASS.HIDE)
    );
  }

  if (nodes.length) {
    return nodes.forEach(
      node => node.classList.add(autoErasing ? CLASS.HIDE : CLASS.CROSS)
    );
  }

  browser.runtime.sendMessage({action: 'count', data: {
    location: window.location,
    initialCount: modifyDom(detectNorthisms(disabled, autoErasing)),
    takeIntoAccount: true
  }});
}

function modifyDom(mods) {
  if (!mods.length) {
    return 0;
  }

  mods.forEach(mod => mod.element.replaceChild(
    getNewChild(mod.text), mod.node
  ));
  return mods.length;
}

function getNewChild(text) {
  if (text.indexOf(`class="${CLASS.CONTENT}`) === -1) {
    return document.createTextNode(text);
  }

  const element = document.createElement('span');
  element.innerHTML = text;
  return element;
}

function observeAddedContent(addedElementsCb) {
  new MutationObserver(mutations => {
    const elements = [];
    mutations.forEach(mutation => mutation.addedNodes.forEach(
      node => node instanceof HTMLElement && elements.push(...node.getElementsByTagName('*'))
    ));
    addedElementsCb(elements);
  }).observe(document.body, {childList: true, subtree: true});
}

function takeIntoAccount() {
  try {
    return !['reload', 'back_forward'].includes(
      performance.getEntriesByType('navigation')[0].type
    );
  } catch {
    return true;
  }
}
