import { init, obliterate } from './obliterator.mjs';
import { log } from '../util.mjs';

const CLASS = {
  CONTENT: 'om-content',
  HIDE: 'om-hide',
  CROSS: 'om-cross'
};

export function run() {
  let _autoErasing;

  chrome.runtime.onMessage.addListener(request => {
    request.action === 'toggle erasing' && toggleErasing(
      request.data.autoErasing,
      _autoErasing,
      autoErasing => _autoErasing = autoErasing
    );

    request.action === 'toggle northisms' && toggleNorthisms(
      request.data.disabled,
      _autoErasing
    );
  });

  chrome.runtime.sendMessage({action: 'get state'}, state => {
    init(state.northisms);
    _autoErasing = state.autoErasing;
    chrome.runtime.sendMessage({action: 'count', data: {
      location: window.location,
      initialCount: modifyDom(detectNorthisms(state.disabled, _autoErasing)),
      takeIntoAccount: takeIntoAccount()
    }});

    observeAddedContent(addedElements => {
      const addCount = modifyDom(detectNorthisms(state.disabled, _autoErasing, addedElements));
      addCount > 0 && chrome.runtime.sendMessage({action: 'count', data: {
        location: window.location,
        addCount: addCount
      }});
    });
  });
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

function toggleErasing(updatedAutoErasing, autoErasing, callbackFn) {
  if (autoErasing === updatedAutoErasing) {
    return;
  }

  document.body.querySelectorAll('.' + CLASS.CONTENT).forEach(node => {
    node.classList.toggle(CLASS.HIDE);
    node.classList.toggle(CLASS.CROSS);
  });
  callbackFn(updatedAutoErasing);
}

function toggleNorthisms(omDisabled, autoErasing) {
  const nodes = document.body.querySelectorAll('.' + CLASS.CONTENT);
  if (omDisabled) {
    return nodes.forEach(
      node => node.classList.remove(CLASS.CROSS, CLASS.HIDE)
    );
  }

  if (nodes.length) {
    return nodes.forEach(
      node => node.classList.add(autoErasing ? CLASS.HIDE : CLASS.CROSS)
    );
  }

  chrome.runtime.sendMessage({action: 'count', data: {
    location: window.location,
    initialCount: modifyDom(detectNorthisms(omDisabled, autoErasing)),
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
