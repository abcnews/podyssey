const cn = require('classnames');
const { h, Component } = require('preact');
const Icon = require('../Icon');
const styles = require('./styles.css');

module.exports = ({ type, iconProps = {}, onClick, className, children, ...props }) => {
  iconProps.type = iconProps.type || type;

  return (
    <button className={cn(styles.root, className)} data-type={type ? type : null} onClick={onClick} {...props}>
      {type && <Icon {...iconProps} />}
      {children && children.length > 0 && <span>{children}</span>}
    </button>
  );
};
