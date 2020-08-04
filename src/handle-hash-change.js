const jumpTo = require('./jump-to');

module.exports = (ev) => {
  ev.preventDefault();
  jumpTo($(ev.currentTarget).attr('href'), ev);
};
