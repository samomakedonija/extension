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
    initialCount: getSevernaCount(_autoErasing)
  }});
  observeAddedContent(addedElements => {
    const addCount = getSevernaCount(_autoErasing, addedElements);
    addCount > 0 && chrome.runtime.sendMessage({action: 'count', data: {
      addCount: addCount
    }});
  });
});

function getSevernaCount(autoErasing, elements) {
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
      replacedText = text.replace(
        /Северна Македонија/gi, getSpan('Северна', 'Македонија')
      ).replace(
        /С\. Македонија/gi, getSpan('С.', 'Македонија')
      );
      if (replacedText === text) {
        continue;
      }

      count++;
      element.replaceChild(getNewChild(replacedText), node);
    }
  }

  return count;

  function getSpan(part1, part2) {
    return `<span class="${smClass}">${part1}</span> ${part2}`;
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

function log(...args) {
  console.log('s-m:', ...args);
}
