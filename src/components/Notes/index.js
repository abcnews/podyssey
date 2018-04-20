const { h, Component } = require('preact');
const { disableBodyScroll, enableBodyScroll } = require('body-scroll-lock');
const Note = require('../Note');
const styles = require('./styles.css');

const getVisibleNoteTimes = (notes, time) => Object.keys(notes).filter(key => time >= +key);

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

    return (
      <section className={styles.root}>
        <div ref={this.getNotesElRef} className={styles.notes}>
          {visibleNotes
            .map(({ note, time, timeIndex }, index) => (
              <Note
                component={note.component}
                maxWidth={note.component.MAX_WIDTH}
                props={note.props}
                time={time}
                timeIndex={timeIndex}
                onTimeLink={this.props.onTimeLink}
              />
            ))
            .concat([<div className={styles.end} ref={this.getNotesEndElRef} />])}
        </div>
      </section>
    );
  }
}

module.exports = Notes;
