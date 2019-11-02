chrome.runtime.onMessage.addListener(request => {
  if (request.message === 'show_popup') {
    log('show popup');
  }
});

chrome.runtime.sendMessage({count: getSevernaCount()});

function getSevernaCount() {
  let
    element, node, text, replacedText, i, j,
    count = 0,
    elements = document.getElementsByTagName('*');

  for (i = 0; i < elements.length; i++) {
    element = elements[i];

    for (j = 0; j < element.childNodes.length; j++) {
      node = element.childNodes[j];
      if (node.nodeType !== 3) {
        continue;
      }

      text = node.nodeValue;
      replacedText = text.replace(
        /Северна Македонија/gi, 'Македонија'
      ).replace(
        /С\. Македонија/gi, 'Македонија'
      );
      if (replacedText === text) {
        continue;
      }

      count++;
      element.replaceChild(document.createTextNode(replacedText), node);
    }
  }

  return count;
}

function log(...args) {
  console.log('s-m:', ...args);
}
