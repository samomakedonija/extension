import { init, obliterate } from './obliterator.mjs';
import { log } from '../util.mjs';

export function run() {
  let _autoErasing;

  chrome.runtime.onMessage.addListener(request => {
    if (request.action === 'toggle erasing') {
      if (_autoErasing === request.data.autoErasing) {
        return;
      }

      _autoErasing = request.data.autoErasing;
      document.body.querySelectorAll('.s-m').forEach(node => {
        node.classList.toggle('s-m-hidden');
        node.classList.toggle('s-m-accent');
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
      initialCount: modifyDom(detectNorthisms(_autoErasing))
    }});
    observeAddedContent(addedElements => {
      const addCount = modifyDom(detectNorthisms(_autoErasing, addedElements));
      addCount > 0 && chrome.runtime.sendMessage({action: 'count', data: {
        addCount: addCount
      }});
    });
  });
}

function detectNorthisms(autoErasing, elements) {
  const
    smClass = `s-m ${autoErasing ? 's-m-hidden' : 's-m-accent'}`,
    domMods = [];
  Array.from(
    elements || document.body.getElementsByTagName('*')
  ).forEach(element => element.childNodes.forEach(
    node => node.nodeType === 3 && obliterate(
      node.nodeValue,
      smClass,
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
  if (text.indexOf('class="s-m') === -1) {
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
