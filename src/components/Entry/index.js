const { h, Component } = require('preact');
const styles = require('./styles.css');

const isStateless = component => typeof component !== 'string' && !(component.prototype && component.prototype.render);

const renderComponentWithProps = ({ component, props }) => {
  const Constructor = !isStateless(component) && component;

  return Constructor ? <Constructor {...props} /> : component(props);
};

class Entry extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (this.props.emit) {
      window.dispatchEvent(new CustomEvent('podyssey:entry', { detail: this.props.emit }));
    }
  }

  render({ media, notes, isPaused }) {
    return (
      <article className={styles.root}>
        <section className={styles.media}>
          {media && renderComponentWithProps({ component: media.component, props: { isPaused, ...media.props } })}
        </section>
        <section className={styles.text}>
          {notes && notes.length > 0 && (
            <div className={styles.notes}>
              {notes.map(note => (
                <div className={styles.note}>{renderComponentWithProps(note)}</div>
              ))}
            </div>
          )}
        </section>
      </article>
    );
  }
}

module.exports = Entry;
