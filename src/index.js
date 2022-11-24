import { whenOdysseyLoaded } from '@abcnews/env-utils';
import { selectMounts } from '@abcnews/mount-utils';
import { h, render } from 'preact';
import App from './components/App';
import { IS_STANDALONE } from './constants';
import { fetchAudioDocument, parseSectionsAndEntries } from './utils';
import './global.css';

if (IS_STANDALONE) {
  document.documentElement.setAttribute('standalone', '');
}

whenOdysseyLoaded.then(() => {
  const [mountEl] = selectMounts('podyssey');

  if (!mountEl) {
    return;
  }

  fetchAudioDocument()
    .then(doc => {
      const audioFile = doc.media.audio.renditions.files[0];
      const playerProps = {
        ...parseSectionsAndEntries(doc.transcript.json.children, doc._embedded.mediaEmbedded),
        cover: doc.media.image.poster.originalInfo,
        cmid: doc.id,
        title: doc.title,
        audio: {
          contentType: audioFile.MIMEType,
          url: audioFile.url
        }
      };

      render(<App playerProps={playerProps} />, mountEl, mountEl.firstChild);

      // fetch(`/news/${audioDocument.id}`)
      //   .then(response => response.text())
      //   .then(body => {
      //     const playerProps = {
      //       ...parseTranscript(body),
      //       cmid: audioDocument.id,
      //       title: audioDocument.title,
      //       audio: {
      //         contentType: audioFile.MIMEType,
      //         url: audioFile.url
      //       }
      //     };

      //     render(<App playerProps={playerProps} />, mountEl, mountEl.firstChild);
      //   });
    })
    .catch(err => console.error(err));
});

if (process.env.NODE_ENV === 'development') {
  window.addEventListener('podyssey:entry', ({ detail }) => {
    console.log(detail);
  });
}
