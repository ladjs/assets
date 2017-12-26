// eslint-disable-next-line import/no-unassigned-import
// require('babel-polyfill');

const clipboard = require('./clipboard');
const returnTo = require('./return-to');
const facebookHashFix = require('./facebook-hash-fix');
const changeHashOnScroll = require('./change-hash-on-scroll');
const customFileInput = require('./custom-file-input');
const confirmPrompt = require('./confirm-prompt');
const ajaxForm = require('./ajax-form');
const jumpTo = require('./jump-to');
const flash = require('./flash');
const spinner = require('./spinner');
const resizeNavbarPadding = require('./resize-navbar-padding');
const modalAnchor = require('./modal-anchor');
const handleHashOnLoad = require('./handle-hash-on-load');
const handleHashChange = require('./handle-hash-change');

module.exports = {
  clipboard,
  returnTo,
  facebookHashFix,
  changeHashOnScroll,
  customFileInput,
  confirmPrompt,
  ajaxForm,
  jumpTo,
  flash,
  spinner,
  resizeNavbarPadding,
  modalAnchor,
  handleHashOnLoad,
  handleHashChange
};
