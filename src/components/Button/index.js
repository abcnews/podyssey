import cn from 'classnames';
import { h, Component } from 'preact';
import Icon from '../Icon';
import styles from './styles.css';

const MAX_TIME_DIFF = 500;

class Button extends Component {
  constructor(props) {
    super(props);

    this.lastTapAt = 0;
    this.preventDoubleTapZoom = this.preventDoubleTapZoom.bind(this);
  }

  preventDoubleTapZoom(event) {
    if (event.touches.length > 1) {
      return;
    }

    const tapAt = Date.now();

    if (tapAt - this.lastTapAt < MAX_TIME_DIFF) {
      event.preventDefault();
      event.currentTarget.click();
    }

    this.lastTapAt = tapAt;
  }

  render({ type, iconProps = {}, onClick, className, children, ...props }) {
    iconProps.type = iconProps.type || type;

    return (
      <button
        className={cn(styles.root, className)}
        data-type={type ? type : null}
        onClick={onClick}
        onTouchStart={this.preventDoubleTapZoom}
        {...props}
      >
        {type && <Icon {...iconProps} />}
        {children && children.length > 0 && <span>{children}</span>}
      </button>
    );
  }
}

export default Button;
