const jumpTo = require('./jump-to.js');

module.exports = (ev) => {
  ev.preventDefault();
  jumpTo($(ev.currentTarget).attr('href'), ev);
};
