chrome.runtime.onMessage.addListener(message => {
  if (message.action === 'toggleDisplay') {
    document.body.querySelectorAll('.s-m').forEach(
      node => node.classList.toggle('s-m-accent')
    );
  }
});

let count = getSevernaCount();
chrome.runtime.sendMessage({count: count});
observeAddedContent(addedElements => {
  count += getSevernaCount(addedElements);
  chrome.runtime.sendMessage({count: count});
});

function getSevernaCount(elements) {
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
        /Северна Македонија/gi, '<span class="s-m s-m-hidden">Северна</span> Македонија'
      ).replace(
        /С\. Македонија/gi, 'Македонија'
      );
      if (replacedText === text) {
        continue;
      }

      count++;
      element.replaceChild(getNewChild(replacedText), node);
    }
  }

  return count;
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
