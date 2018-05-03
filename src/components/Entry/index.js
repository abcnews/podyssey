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

  render({ section, media, notes }) {
    return (
      <article className={styles.root}>
        <section className={styles.media}>{media && renderComponentWithProps(media)}</section>
        <section className={styles.text}>
          <header key={section} className={styles.sectionTitle}>
            {section.title}
          </header>
          <div className={styles.notes}>
            {notes.map(note => <div className={styles.note}>{renderComponentWithProps(note)}</div>)}
          </div>
        </section>
      </article>
    );
  }
}

module.exports = Entry;
