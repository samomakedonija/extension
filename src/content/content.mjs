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
    _autoErasing = state.autoErasing;
    chrome.runtime.sendMessage({action: 'count', data: {
      initialCount: detectNorthisms(_autoErasing)
    }});
    observeAddedContent(addedElements => {
      const addCount = detectNorthisms(_autoErasing, addedElements);
      addCount > 0 && chrome.runtime.sendMessage({action: 'count', data: {
        addCount: addCount
      }});
    });
  });
}

function detectNorthisms(autoErasing, elements) {
  const smClass = `s-m ${autoErasing ? 's-m-hidden' : 's-m-accent'}`;
  let
    element, node, text, replacedText, i, j,
    count = 0;

  elements = elements || document.body.getElementsByTagName('*');
  for (i = 0; i < elements.length; i++) {
    element = elements[i];

    for (j = 0; j < element.childNodes.length; j++) {
      node = element.childNodes[j];
      if (node.nodeType !== 3) {
        continue;
      }

      text = node.nodeValue;
      replacedText = replaceNorthisms(text, smClass);
      if (replacedText === text) {
        continue;
      }

      count++;
      element.replaceChild(getNewChild(replacedText), node);
    }
  }

  return count;
}

function replaceNorthisms(s, smClass) {
  return s.replace(
    /Северна Македонија/gi, getSpan(0, 'Северна', ' Македонија')
  ).replace(
    /С\. Македонија/gi, getSpan(0, 'С.', ' Македонија')
  ).replace(
    /РСМ/gi, getSpan(1, 'Р', 'С', 'М')
  ).replace(
    /North Macedonia/gi, getSpan(0, 'North', ' Macedonia')
  );

  function getSpan(pos, ...parts) {
    parts[pos] = `<span class="${smClass}">${parts[pos]}</span>`;
    return parts.join('');
  }
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
