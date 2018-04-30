require('./polyfills');

const { h, render } = require('preact');
const { normalise, parse } = require('./utils');
require('./theme.css');
require('./global.css');

const root = document.createElement('div');

root.setAttribute('data-podyssey-root', '');
document.body.insertBefore(root, document.body.firstChild);

normalise();

const { audioData, cover, notes, title } = parse();

function init() {
  const App = require('./components/App');

  render(<App audioData={audioData} notes={notes} title={title} cover={cover} />, root, root.firstChild);
}

init();

if (module.hot) {
  module.hot.accept('./components/App', () => {
    try {
      init();
    } catch (err) {
      const ErrorBox = require('./components/ErrorBox');
      render(<ErrorBox error={err} />, root, root.firstChild);
    }
  });
}

if (process.env.NODE_ENV === 'development') {
  require('preact/devtools');
}
