const { actions, events } = require('html5-audio-driver');
const { h, Component } = require('preact');
const { Button, FormattedTime, PauseButton, PlayButton, ProgressBar } = require('react-player-controls');
const Slider = require('react-rangeslider').default;
const Nav = require('../Nav');
const Notes = require('../Notes');
const styles = require('./styles.css');

const STORAGE_PREFIX = 'podyssey';
const HOP_BACK_SECONDS = 15;
const HOP_FORWARD_SECONDS = 30;
const INERT_EL = { focus: () => {} };

class App extends Component {
  constructor(props) {
    super(props);

    this.getAudioElRef = this.getAudioElRef.bind(this);
    this.getPauseElRef = this.getPauseElRef.bind(this);
    this.getPlayElRef = this.getPlayElRef.bind(this);
    this.pause = this.pause.bind(this);
    this.play = this.play.bind(this);
    this.playFrom = this.playFrom.bind(this);
    this.seek = this.seek.bind(this);
    this.seekEnd = this.seekEnd.bind(this);
    this.seekStart = this.seekStart.bind(this);
    this.hopBack = this.hopBack.bind(this);
    this.hopForward = this.hopForward.bind(this);

    this._lastStoredTime = +localStorage.getItem(`${STORAGE_PREFIX}__currentTime__${this.props.audioData.url}`);

    this.state = {
      currentTime: this._lastStoredTime,
      duration: 0,
      isPaused: true,
      isEnded: false
    };
  }

  getAudioElRef(el) {
    this.audioEl = el;
  }

  getPauseElRef(component) {
    this.pauseEl = component ? component.base : INERT_EL;
  }

  getPlayElRef(component) {
    this.playEl = component ? component.base : INERT_EL;
  }

  pause() {
    this.audioActions.pause();
    this.playEl.focus();
  }

  play() {
    if (this.state.isEnded) {
      this.audioEl.currentTime = 0;
    }

    this.audioActions.play();
    this.pauseEl.focus();
  }

  playFrom(time) {
    this.audioActions.setPlaytime(time);

    if (this.state.isPaused) {
      this.play();
    }
  }

  seek(time, event) {
    if (event.type === 'keydown') {
      this.audioActions.setPlaytime(time);
    } else {
      this.setState({ currentTime: time });
    }
  }

  seekEnd() {
    this._isSeeking = false;
    this.audioActions.setPlaytime(this.state.currentTime);
  }

  seekStart() {
    this._isSeeking = true;
  }

  hopBack() {
    this.audioActions.setPlaytime(this.state.currentTime - HOP_BACK_SECONDS);
  }

  hopForward() {
    this.audioActions.setPlaytime(this.state.currentTime + HOP_FORWARD_SECONDS);
  }

  componentDidUpdate() {
    // Persist playback time if changed by 5 seconds
    if (Math.abs(this._lastStoredTime - this.state.currentTime) > 5) {
      this._lastStoredTime = Math.round(this.state.currentTime);
      localStorage.setItem(`${STORAGE_PREFIX}__currentTime__${this.props.audioData.url}`, this._lastStoredTime);
    }
  }

  componentDidMount() {
    this.audioActions = actions(this.audioEl);
    this.audioEvents = events(this.audioEl);
    this.audioEvents.onDurationChange(() => this.setState({ duration: this.audioEl.duration }));
    this.audioEvents.onEnd(() => this.setState({ isEnded: true }));
    this.audioEvents.onPause(() => this.setState({ isPaused: true }));
    this.audioEvents.onPlay(() => this.setState({ isPaused: false, isEnded: false }));
    this.audioEvents.onPlaytimeUpdate(
      () => this._isSeeking || this.setState({ currentTime: this.audioEl.currentTime })
    );
    this.audioActions.setPlaytime(this._lastStoredTime);
  }

  render({ audioData, notes, title }, { currentTime, duration, isEnded, isPaused }) {
    return audioData ? (
      <div className={styles.root}>
        <audio ref={this.getAudioElRef}>
          <source src={audioData.url} type={audioData.mimeType} />
        </audio>
        <Nav />
        <main>
          <Notes notes={notes} time={currentTime} onTimeLink={this.playFrom} />
          <footer className={styles.player}>
            <div className={styles.scrub}>
              <Slider
                min={0}
                max={duration}
                value={currentTime}
                tooltip={false}
                onChangeStart={this.seekStart}
                onChange={this.seek}
                onChangeComplete={this.seekEnd}
              />
            </div>
            <div className={styles.playerText}>
              <FormattedTime numSeconds={Math.round(currentTime)} />
              <h1>{title}</h1>
              <FormattedTime numSeconds={Math.round(duration)} />
            </div>
            <div className={styles.toggle}>
              <Button
                isEnabled={currentTime - HOP_BACK_SECONDS >= 0}
                onClick={this.hopBack}
              >{`-${HOP_BACK_SECONDS}s`}</Button>
              <PauseButton ref={this.getPauseElRef} isEnabled={!isPaused} onClick={this.pause} />
              <PlayButton ref={this.getPlayElRef} isEnabled={isPaused} onClick={this.play} />
              <Button
                isEnabled={currentTime + HOP_FORWARD_SECONDS <= duration}
                onClick={this.hopForward}
              >{`+${HOP_FORWARD_SECONDS}s`}</Button>
            </div>
          </footer>
        </main>
      </div>
    ) : (
      <div>🔇</div>
    );
  }
}

module.exports = App;
