const form = document.getElementById('product-form');
const categoryInput = document.getElementById('category');
const replacementWrapper = document.getElementById('replacement-wrapper');
const replacementOemInput = document.getElementById('replacement-oem');
const previewReplacement = document.getElementById('preview-replacement');

function toggleReplacementOem() {
  const isFilterCategory = categoryInput.value === 'Lọc';
  replacementWrapper.classList.toggle('hidden', !isFilterCategory);
  previewReplacement.classList.toggle('hidden', !isFilterCategory);

  if (isFilterCategory) {
    replacementOemInput.required = true;
  } else {
    replacementOemInput.required = false;
    replacementOemInput.value = '';
  }
}

function updatePreview(formData) {
  const values = {
    productName: formData.get('productName') || '—',
    sku: formData.get('sku') || '—',
    category: formData.get('category') || '—',
    oem: formData.get('oem') || '—',
    replacementOem: formData.get('replacementOem') || '—',
  };

  document.querySelector('#preview div:nth-child(1) dd').textContent = values.productName;
  document.querySelector('#preview div:nth-child(2) dd').textContent = values.sku;
  document.querySelector('#preview div:nth-child(3) dd').textContent = values.category;
  document.querySelector('#preview div:nth-child(4) dd').textContent = values.oem;
  document.querySelector('#preview-replacement dd').textContent = values.replacementOem;
}

categoryInput.addEventListener('change', toggleReplacementOem);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  toggleReplacementOem();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);
  updatePreview(formData);
});

form.addEventListener('input', () => {
  const formData = new FormData(form);
  updatePreview(formData);
});

toggleReplacementOem();
