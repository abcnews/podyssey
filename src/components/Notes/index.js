const { h, Component } = require('preact');
const { disableBodyScroll, enableBodyScroll } = require('body-scroll-lock');
const Note = require('../Note');
const styles = require('./styles.css');

const getVisibleNoteTimes = (notes, time) => Object.keys(notes).filter(key => time >= +key);
const getIsComposing = (notes, time) => Object.keys(notes).filter(key => +key > time && +key - 5 <= time).length > 0;

class Notes extends Component {
  constructor(props) {
    super(props);

    this.getNotesElRef = this.getNotesElRef.bind(this);
    this.getNotesEndElRef = this.getNotesEndElRef.bind(this);
  }

  getNotesElRef(el) {
    this.notesEl = el;
    disableBodyScroll(this.notesEl);
  }

  getNotesEndElRef(el) {
    this.notesEndEl = el;
  }

  componentDidMount() {
    this.notesEl.scrollTop = this.notesEl.scrollHeight;
  }

  componentWillReceiveProps() {
    this._wasAtEnd = this.notesEndEl.getBoundingClientRect().top < this.base.getBoundingClientRect().bottom;
  }

  componentDidUpdate(prevProps) {
    this._hasMoreVisibleNoteTimes =
      getVisibleNoteTimes(prevProps.notes, prevProps.time).length <
      getVisibleNoteTimes(this.props.notes, this.props.time).length;

    if (this._hasMoreVisibleNoteTimes && this._wasAtEnd) {
      this.notesEndEl.scrollIntoView({
        behavior: 'smooth'
      });
    }

    this._wasAtEnd = null;
    this._hasMoreVisibleNoteTimes = null;
  }

  componentWillUnmount() {
    // Re-enable this when we stop getting ontouchstart binding errors during hot-reloading. It's probably important.
    // enableBodyScroll();
  }

  render({ notes, time }) {
    const visibleNoteTimes = getVisibleNoteTimes(notes, time);
    const visibleNotes = visibleNoteTimes.reduce(
      (memo, time, index) =>
        memo.concat(
          notes[time].map((note, timeIndex) => ({
            note,
            time: +time,
            timeIndex
          }))
        ),
      []
    );
    const isComposing = getIsComposing(notes, time);

    return (
      <section className={styles.root}>
        <div ref={this.getNotesElRef} className={styles.notes}>
          {visibleNotes
            .map(({ note, time, timeIndex }, index) => (
              <Note
                key={`note${index}`}
                component={note.component}
                props={note.props}
                time={time}
                timeIndex={timeIndex}
                onTimeLink={this.props.onTimeLink}
              />
            ))
            .concat(isComposing ? [<Note key="composing" component={Composing} time={time - 5} />] : [])
            .concat([<div key="end" ref={this.getNotesEndElRef} className={styles.end} />])}
        </div>
      </section>
    );
  }
}

const Composing = () => (
  <div className={styles.composing}>
    <span className={styles.dot} />
    <span className={styles.dot} />
    <span className={styles.dot} />
  </div>
);

module.exports = Notes;
