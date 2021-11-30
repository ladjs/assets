const isSANB = require('is-string-and-not-blank');

function handleFormOnPopstate(ev) {
  const { state } = ev.originalEvent;

  // Get forms and filter out any that are inside of the table
  // as they will be reloaded when form is submitted
  const $forms = $(`.table-ajax-form`).filter(function () {
    const $this = $(this);
    const $table = $($this.data('table'));

    return !$.contains($table.get(0), this);
  });

  // Return early if there is no forms
  if ($forms.length === 0) return;

  const $unmodifiedForms = [];
  const $modifiedForms = [];

  // Iterate thru search params for each form and set values
  $forms.each(function () {
    const $this = $(this);

    let isModified = false;

    // Data search-params should be a ',' delimited string
    let searchParameters = $this.data('search-params');
    searchParameters = isSANB(searchParameters)
      ? searchParameters.split(',')
      : [];

    for (const key of searchParameters) {
      const $input = $this.find(`[name=${key}]`);
      if (state) {
        $input.val(state[key]);

        if (state[key]) isModified = true;
      } else {
        $input.val(undefined);
      }
    }

    // Sort form for modification after reloading table
    if (isModified) $modifiedForms.push($this);
    else $unmodifiedForms.push($this);
  });

  // Submit form
  $forms.first().submit();

  // Fix modified forms
  for (const $f of $modifiedForms) {
    $f.data('modified', true);
  }

  for (const $f of $unmodifiedForms) {
    $f.data('modified', false);
  }
}

module.exports = handleFormOnPopstate;
