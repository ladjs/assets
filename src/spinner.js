class Spinner {
  constructor($, selector) {
    this.$ = $;
    this.selector = selector || '#spinner';
  }

  show() {
    this.$(this.selector).addClass('show d-block');
  }

  hide() {
    this.$(this.selector).removeClass('show d-block');
  }
}

module.exports = Spinner;
