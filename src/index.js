require('./polyfills');

const { h, render } = require('preact');
const xhr = require('xhr');
const { IS_STANDALONE } = require('./constants');
const { convertAudioEmbedToCMID, detailPageURLFromCMID, normalise, parsePlayerProps } = require('./utils');
require('./theme.css');
require('./global.css');

if (IS_STANDALONE) {
  document.documentElement.setAttribute('standalone', '');
}

const rootEl = document.querySelector('[data-podyssey-root]');

normalise(rootEl);

let playerProps = null;

function renderApp() {
  const App = require('./components/App');

  render(<App playerProps={playerProps} />, rootEl, rootEl.firstChild);
}

renderApp();

const audioDocumentCMID = convertAudioEmbedToCMID();
const audioDocumentURL = detailPageURLFromCMID(audioDocumentCMID);

xhr({ url: audioDocumentURL }, (error, response, body) => {
  if (error || response.statusCode !== 200) {
    console.error(error || new Error(response.statusCode));
  }

  playerProps = {
    cmid: audioDocumentCMID,
    ...parsePlayerProps(body)
  };

  renderApp();
});

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
