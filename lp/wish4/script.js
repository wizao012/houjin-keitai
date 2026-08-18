(() => {
  'use strict';

  const businessType = document.querySelector('#companyType');
  const documentCheck = document.querySelector('#docCheck');
  const documentCopy = document.querySelector('#docCopy');
  const documentYes = document.querySelector('#docYes');
  const documentDeny = document.querySelector('#docDeny');
  const documentRadios = [...document.querySelectorAll('[data-document-radio]')];
  const form = document.querySelector('.form');
  const submitButton = document.querySelector('#submitBtn');
  const formError = document.querySelector('#formError');
  const modal = document.querySelector('#afterHoursModal');
  const modalPanel = modal?.querySelector('.modal-panel');
  let lastFocusedElement = null;

  const config = {
    webhookUrl: 'https://hooks.zapier.com/hooks/catch/12525485/4ydff70/',
    thanksPage: './thanks.html',
    trackingKeys: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'placement', 'keyword', 'matchtype', 'gclid', 'fbclid', 'lpv', 'src', 'camp', 'ag', 'ad', 'pl', 'kw', 'mt']
  };

  /* ---------- 入力バリデーション（iPhone LPと共通仕様） ---------- */
  const companyNameInput = document.querySelector('#companyName');
  const contactNameInput = document.querySelector('#contactName');

  const CARRIER_PATTERNS = [
    'au', 'kddi',
    'docomo', 'ドコモ', 'どこも',
    'softbank', 'ソフトバンク', 'そふとばんく',
    'rakuten', 'rakutenmobile', '楽天', '楽天モバイル',
    'ahamo', 'アハモ',
    'ymobile', 'ワイモバイル',
    'mineo', 'マイネオ',
    'uqmobile', 'uq', 'ユーキュー', 'ユーキューモバイル',
    'linemo', 'ラインモ',
    'povo', 'ポヴォ', 'ポボ',
    'biglobe', 'biglobemobile',
    'iijmio', 'iij',
    'nuromobile', 'nuro',
    'ocnmobile', 'ocn',
    'jcom', 'jcommobile',
    'lineモバイル', 'linemobile'
  ];

  function normalizeCarrierInput(value) {
    return value
      .toLowerCase()
      .replace(/[０-９ａ-ｚＡ-Ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .replace(/[\s\u3000・\-_。、,.]/g, '');
  }

  function isCarrierName(value) {
    if (!value) return false;
    return CARRIER_PATTERNS.indexOf(normalizeCarrierInput(value)) !== -1;
  }

  function containsJapanese(value) {
    if (!value) return false;
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF61-\uFF9F]/.test(value);
  }

  function showFieldError(fieldId, message) {
    const input = document.querySelector(`#${fieldId}`);
    const err = document.querySelector(`#err-${fieldId}`);
    if (input) {
      input.classList.add('error');
      input.setAttribute('aria-invalid', 'true');
    }
    if (err) {
      err.textContent = message;
      err.classList.add('show');
    }
  }

  function clearFieldError(fieldId) {
    const input = document.querySelector(`#${fieldId}`);
    const err = document.querySelector(`#err-${fieldId}`);
    if (input) {
      input.classList.remove('error');
      input.removeAttribute('aria-invalid');
    }
    if (err) {
      err.textContent = '';
      err.classList.remove('show');
    }
  }

  function validateCompanyName(input) {
    const value = input.value.trim();
    clearFieldError('companyName');
    if (!value) return true;
    if (isCarrierName(value)) {
      showFieldError('companyName', '携帯キャリア名が入力されているようです。お客様の会社名・屋号をご入力ください。');
      return false;
    }
    return true;
  }

  function validateContactName(input) {
    const value = input.value.trim();
    clearFieldError('contactName');
    if (!value) return true;
    if (!containsJapanese(value)) {
      showFieldError('contactName', 'お名前は日本語（漢字・ひらがな・カタカナ）でご入力ください。');
      return false;
    }
    return true;
  }

  function validateInputFormats() {
    let isValid = true;
    if (companyNameInput && !validateCompanyName(companyNameInput)) isValid = false;
    if (contactNameInput && !validateContactName(contactNameInput)) isValid = false;
    if (!isValid) {
      const firstError = form.querySelector('.field input.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus({ preventScroll: true });
      }
    }
    return isValid;
  }

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
    // 法人系（iPhone LPと同一の列挙。その他非営利法人は書類確認の対象外）
    const isCorporate = ['株式会社', '有限会社', 'その他営利法人'].indexOf(type) !== -1;
    const needsDocumentCheck = isSoleProprietor || isCorporate;

    documentCheck.hidden = !needsDocumentCheck;
    documentDeny.hidden = true;
    documentRadios.forEach((radio) => {
      radio.required = needsDocumentCheck;
      radio.checked = false;
      radio.name = isSoleProprietor ? 'doc_check_sole' : 'doc_check_corp';
    });

    if (!needsDocumentCheck) return;

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

    if (!validateInputFormats()) return;

    submitButton.disabled = true;
    const originalButton = submitButton.innerHTML;
    submitButton.textContent = '送信中...';

    try {
      await fetch(config.webhookUrl, { method: 'POST', mode: 'no-cors', body: new FormData(form) });
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'form_submit_cv' });
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
    return !['Sat', 'Sun'].includes(weekday) && minutes >= 9 * 60 && minutes < 18 * 60;
  }

  function openModal(trigger) {
    if (!modal) return;
    lastFocusedElement = trigger;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => modal.querySelector('.modal-close').focus());
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    lastFocusedElement?.focus();
  }

  companyNameInput?.addEventListener('blur', () => validateCompanyName(companyNameInput));
  companyNameInput?.addEventListener('input', () => {
    if (companyNameInput.classList.contains('error')) validateCompanyName(companyNameInput);
  });
  contactNameInput?.addEventListener('blur', () => validateContactName(contactNameInput));
  contactNameInput?.addEventListener('input', () => {
    if (contactNameInput.classList.contains('error')) validateContactName(contactNameInput);
  });

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
        window.dataLayer.push({ event: 'tel_tap_cv' });
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
