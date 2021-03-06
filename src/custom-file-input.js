// <label class="d-block">
//   <input required="required" data-toggle="custom-file" data-target="#company-logo" type="file" name="company_logo" accept="image/*" class="custom-file-input">
//   <span id="company-logo" class="custom-file-control custom-file-name" data-btn="{{ t('Select File') }}" data-content="{{ t('Upload company logo...') }}"></span>
// </label>
const customFileInput = function () {
  const $input = $(this);
  const target = $input.data('target');
  const $target = $(target);

  if ($target.length === 0)
    return console.error('Invalid target for custom file', $input);

  if (!$target.attr('data-content')) {
    return console.error(
      'Invalid `data-content` for custom file target',
      $input
    );
  }

  // Set original content so we can revert if user deselects file
  if (!$target.attr('data-original-content')) {
    $target.attr('data-original-content', $target.attr('data-content'));
  }

  const input = $input.get(0);

  let name =
    typeof input === 'object' &&
    Array.isArray(input.files) &&
    typeof input.files[0] === 'object' &&
    typeof input.files[0].name === 'string'
      ? input.files[0].name
      : $input.val();

  if (!name) name = $target.attr('data-original-content');

  $target.attr('data-content', name);
};

module.exports = customFileInput;
