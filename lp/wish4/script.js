(() => {
  'use strict';

  const businessType = document.querySelector('#business-type');
  const documentCheck = document.querySelector('#document-check');
  const documentCopy = document.querySelector('#document-copy');
  const documentYes = document.querySelector('#document-yes');
  const documentDeny = document.querySelector('#document-deny');
  const documentRadios = [...document.querySelectorAll('[data-document-radio]')];
  const form = document.querySelector('.form');
  const submitButton = document.querySelector('#submitBtn');
  const formError = document.querySelector('#form-error');
  const modal = document.querySelector('#after-hours-modal');
  const modalPanel = modal?.querySelector('.modal__panel');
  let lastFocusedElement = null;

  const config = {
    webhookUrl: 'https://hooks.zapier.com/hooks/catch/12525485/4ydff70/',
    thanksPage: './thanks.html',
    trackingKeys: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'placement', 'keyword', 'matchtype', 'gclid', 'fbclid', 'lpv', 'src', 'camp', 'ag', 'ad', 'pl', 'kw', 'mt']
  };

  function captureTrackingParameters() {
    const params = new URLSearchParams(window.location.search);
    config.trackingKeys.forEach((key) => {
      const input = document.querySelector(`#trk-${key}`);
      if (input) input.value = params.get(key) || '';
    });
    const pathInput = document.querySelector('#trk-lp_path');
    if (pathInput) pathInput.value = window.location.pathname;
  }

  function updateDocumentQuestion() {
    const type = businessType.value;
    const isSoleProprietor = type === '個人事業主';
    const hasBusinessType = type !== '';

    documentCheck.hidden = !hasBusinessType;
    documentDeny.hidden = true;
    documentRadios.forEach((radio) => {
      radio.required = hasBusinessType;
      radio.checked = false;
      radio.name = isSoleProprietor ? 'doc_check_sole' : 'doc_check_corp';
    });

    if (!hasBusinessType) return;

    if (isSoleProprietor) {
      documentCopy.innerHTML = '通信契約には事業確認が必要なため、下記書類が必須となります。<br><strong>● 青色申告書 または 開業届の控え<br>● 本人確認書類</strong>';
      documentYes.textContent = 'はい、青色申告書または開業届があります。（またはすぐに準備可能）';
    } else {
      documentCopy.innerHTML = '通信契約には法人確認が必要なため、下記書類が必須となります。<br><strong>● 履歴事項全部証明書（登記簿謄本）<br>● 本人確認書類</strong>';
      documentYes.textContent = 'はい、登記簿謄本を取得済です。（またはすぐに準備可能）';
    }
  }

  async function submitForm(event) {
    event.preventDefault();
    const requiredControls = [...form.querySelectorAll('[required]')];
    const invalid = requiredControls.filter((control) => !control.checkValidity());

    form.querySelectorAll('[aria-invalid="true"]').forEach((control) => control.removeAttribute('aria-invalid'));

    if (invalid.length) {
      invalid.forEach((control) => control.setAttribute('aria-invalid', 'true'));
      formError.hidden = false;
      const firstInvalid = invalid[0];
      if (firstInvalid.type === 'radio') {
        documentCheck.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        firstInvalid.focus({ preventScroll: true });
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    formError.hidden = true;
    const selectedDocumentStatus = documentRadios.find((radio) => radio.checked);
    if (selectedDocumentStatus?.value === 'no') {
      documentDeny.hidden = false;
      documentCheck.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    documentDeny.hidden = true;
    submitButton.disabled = true;
    const originalButton = submitButton.innerHTML;
    submitButton.textContent = '送信中...';

    try {
      await fetch(config.webhookUrl, { method: 'POST', mode: 'no-cors', body: new FormData(form) });
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'form_submit_cv', form_name: 'aquos_wish4_lp' });
      window.location.href = config.thanksPage;
    } catch (error) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButton;
      window.alert('送信に失敗しました。お手数ですがお電話でお問い合わせください（050-1791-6247）');
    }
  }

  function isPhoneReceptionOpen() {
    const japanParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    const values = Object.fromEntries(japanParts.map((part) => [part.type, part.value]));
    const weekday = values.weekday;
    const minutes = Number(values.hour) * 60 + Number(values.minute);
    return !['Sat', 'Sun'].includes(weekday) && minutes >= 9 * 60 && minutes < 19 * 60;
  }

  function openModal(trigger) {
    if (!modal) return;
    lastFocusedElement = trigger;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => modal.querySelector('.modal__close').focus());
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    lastFocusedElement?.focus();
  }

  businessType?.addEventListener('change', updateDocumentQuestion);
  form?.addEventListener('submit', submitForm);
  documentRadios.forEach((radio) => radio.addEventListener('change', () => {
    documentDeny.hidden = radio.value !== 'no' || !radio.checked;
  }));
  form?.addEventListener('input', (event) => {
    if (event.target.matches('[aria-invalid="true"]') && event.target.checkValidity()) {
      event.target.removeAttribute('aria-invalid');
    }
  });

  document.querySelectorAll('[data-phone]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (!isPhoneReceptionOpen()) {
        event.preventDefault();
        openModal(link);
      } else {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'phone_click', phone_number: '050-1791-6247' });
      }
    });
  });

  modal?.querySelectorAll('[data-modal-close]').forEach((button) => button.addEventListener('click', closeModal));
  modal?.querySelector('[data-modal-form]')?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal && !modal.hidden) closeModal();
    if (event.key === 'Tab' && modal && !modal.hidden) {
      const focusable = [...modalPanel.querySelectorAll('a[href],button:not([disabled])')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  captureTrackingParameters();
})();
