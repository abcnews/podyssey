const { append, detach, isInlineElement, isText } = require('./dom');

function _linebreaksToParagraphsAppender(state) {
  if (!state.stack.length) {
    return state;
  }

  const pEl = document.createElement('p');

  while (state.stack.length) {
    append(pEl, state.stack.shift());
  }

  append(state.cEl, pEl);

  return state;
}

function _linebreaksToParagraphsReducer(state, node, index, nodes) {
  // On the first iteration, initialise the state
  if (index === 0) {
    state.cEl = document.createElement('div');
    state.stack = [];
  }

  // Decide to do with each node, depending on
  // its type and tagName. The aim of this reducer
  // is to wrap series' of loose text/inline elements in
  // <p> elements and discard <br> elements

  if (isText(node)) {
    // Push the text element onto the stack if it
    // contains more than empty space
    if (String(node.nodeValue).trim().length) {
      state.stack.push(node);
    }
  } else if (isInlineElement(node)) {
    if (node.tagName === 'BR') {
      // Append the stack, discarding the <br> element
      state = _linebreaksToParagraphsAppender(state);
      detach(node);
    } else {
      // Push the inline element onto the stack
      state.stack.push(node);
    }
  } else {
    // Append the stack, then append the node
    // (which should be a non-text, non-inline element)
    state = _linebreaksToParagraphsAppender(state);
    append(state.cEl, node);
  }

  // If continuing to iterate, return the state
  if (nodes.length - 1 > index) {
    return state;
  }

  // On the last iteration, append the stack (which may not
  // be empty), then return the state's container
  return _linebreaksToParagraphsAppender(state).cEl;
}

module.exports.linebreaksToParagraphs = el => (
  Array.from(Array.from(el.childNodes).reduce(_linebreaksToParagraphsReducer, {}).childNodes).forEach(childEl =>
    append(el, childEl)
  ),
  el
);
