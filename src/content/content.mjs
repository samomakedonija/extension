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
    if (request.action === 'toggle erasing') {
      if (_autoErasing === request.data.autoErasing) {
        return;
      }

      _autoErasing = request.data.autoErasing;
      document.body.querySelectorAll('.' + CLASS.CONTENT).forEach(node => {
        node.classList.toggle(CLASS.HIDE);
        node.classList.toggle(CLASS.CROSS);
      });
    }

    if (request.action === 'toggle extension') {
      log(request.action);
    }
  });

  chrome.runtime.sendMessage({action: 'get state'}, state => {
    init(state.northisms);
    _autoErasing = state.autoErasing;
    chrome.runtime.sendMessage({action: 'count', data: {
      location: window.location,
      initialCount: modifyDom(detectNorthisms(_autoErasing)),
      takeIntoAccount: takeIntoAccount()
    }});

    observeAddedContent(addedElements => {
      const addCount = modifyDom(detectNorthisms(_autoErasing, addedElements));
      addCount > 0 && chrome.runtime.sendMessage({action: 'count', data: {
        location: window.location,
        addCount: addCount
      }});
    });
  });
}

function detectNorthisms(autoErasing, elements) {
  const
    className = `${CLASS.CONTENT} ${autoErasing ? CLASS.HIDE : CLASS.CROSS}`,
    domMods = [];
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
