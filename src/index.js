require('./polyfills');

const { h, render } = require('preact');
const { convertAudioEmbedToCMID, normalise } = require('./utils');
require('./theme.css');
require('./global.css');

const audioCMID = convertAudioEmbedToCMID();
const rootEl = document.querySelector('[data-podyssey-root]');

normalise(rootEl);

function init() {
  const App = require('./components/App');

  render(<App audioCMID={audioCMID} />, rootEl, rootEl.firstChild);
}

init();

if (module.hot) {
  module.hot.accept('./components/App', () => {
    try {
      init();
    } catch (err) {
      const ErrorBox = require('./components/ErrorBox');
      render(<ErrorBox error={err} />, rootEl, rootEl.firstChild);
    }
  });
}

if (process.env.NODE_ENV === 'development') {
  require('preact/devtools');
}
