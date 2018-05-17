require('./polyfills');

const { h, render } = require('preact');
const xhr = require('xhr');
const { IS_STANDALONE } = require('./constants');
const { detailPageURLFromCMID, getAudioCMID, normalise, parsePlayerProps } = require('./utils');
require('./global.css');

const rootEl = document.querySelector('[data-podyssey-root]');
const audioDocumentCMID = getAudioCMID();
let playerProps = null;

function renderApp() {
  const App = require('./components/App');

  render(<App playerProps={playerProps} />, rootEl, rootEl.firstChild);
}

if (audioDocumentCMID) {
  normalise(rootEl);
  renderApp();
  xhr({ url: detailPageURLFromCMID(audioDocumentCMID) }, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      console.error(error || new Error(response.statusCode));
    }

    playerProps = {
      cmid: audioDocumentCMID,
      ...parsePlayerProps(body)
    };

    renderApp();
  });
}

if (IS_STANDALONE) {
  document.documentElement.setAttribute('standalone', '');
}

if (module.hot) {
  module.hot.accept('./components/App', () => {
    try {
      renderApp();
    } catch (err) {
      const ErrorBox = require('./components/ErrorBox');
      render(<ErrorBox error={err} />, rootEl, rootEl.firstChild);
    }
  });
}

if (process.env.NODE_ENV === 'development') {
  require('preact/devtools');
}
