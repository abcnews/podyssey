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
const NO_BUBBLE = event => event.stopPropagation();

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
          <Notes notes={notes} time={Math.round(currentTime)} onTimeLink={this.playFrom} />
          <footer className={styles.player} onTouchMove={NO_BUBBLE} onMouseMove={NO_BUBBLE}>
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
              <StepButton
                seconds={HOP_BACK_SECONDS}
                isEnabled={currentTime - HOP_BACK_SECONDS >= 0}
                onClick={this.hopBack}
              />
              <PauseButton ref={this.getPauseElRef} isEnabled={!isPaused} onClick={this.pause} />
              <PlayButton ref={this.getPlayElRef} isEnabled={isPaused} onClick={this.play} />
              <StepButton
                seconds={HOP_FORWARD_SECONDS}
                isEnabled={currentTime + HOP_FORWARD_SECONDS <= duration}
                isForward={true}
                onClick={this.hopForward}
              />
            </div>
          </footer>
        </main>
      </div>
    ) : (
      <div>🔇</div>
    );
  }
}

const StepButton = ({ seconds, isEnabled, isForward, onClick }) => (
  <Button isEnabled={isEnabled} onClick={onClick}>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <path
        transform={`scale(${isForward ? '-' : ''}1, 1) translate(-2, 1)`}
        transform-origin="50% 50%"
        fill="currentColor"
        d="M32.3,14.9c0-7.3-6-13.3-13.3-13.3C12.5,1.7,6.8,6.5,5.9,13l-0.1,0.9H2.7l4.1,5.5l4.1-5.5H7.8l0.2-1.2
          c1.1-5.2,5.7-9,11-9c6.2,0,11.2,5,11.2,11.2c0,5.8-4.5,10.6-10.2,11.2v2.1C26.9,27.7,32.3,21.9,32.3,14.9z"
      />
      <text
        className={styles.stepButtonText}
        x="50%"
        y="50%"
        dx={`${isForward ? '-' : ''}1`}
        fill="currentColor"
        text-anchor="middle"
        alignment-baseline="middle"
      >
        {seconds}
      </text>
    </svg>
  </Button>
);

module.exports = App;
