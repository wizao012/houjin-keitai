/* ==========================================================================
   法人携帯の窓口 LP - main.js
   ========================================================================== */

/* ---------- 設定 ---------- */
const CONFIG = {
  ZAPIER_WEBHOOK_URL: 'https://hooks.zapier.com/hooks/catch/12525485/4ydff70/',
  THANKS_PAGE: './thanks.html',
  TEL: '050-1791-6247',
  // GTM/広告計測用パラメータキー
  PARAM_KEYS: [
    // UTM標準パラメータ（GA4自動連携）
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    // 配信面・追加情報
    'placement', 'keyword', 'matchtype',
    // クリックID（オフラインCVインポート用）
    'gclid', 'fbclid',
    // 独自パラメータ（手動メモ・既存互換）
    'lpv', 'src', 'camp', 'ag', 'ad', 'pl', 'kw', 'mt'
  ]
};

/* ---------- URLパラメータをhidden inputへ ---------- */
(function captureUrlParams() {
  try {
    const params = new URLSearchParams(location.search);
    CONFIG.PARAM_KEYS.forEach(function(key) {
      const el = document.getElementById('trk-' + key);
      if (el) el.value = params.get(key) || '';
    });
  } catch (e) {}
})();

/* ---------- GTM dataLayer 初期化 ---------- */
window.dataLayer = window.dataLayer || [];

/* ---------- スムーススクロール ---------- */
document.querySelectorAll('.js-scroll').forEach(function(el) {
  el.addEventListener('click', function(e) {
    const href = el.getAttribute('href');
    if (!href || href.charAt(0) !== '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ---------- 電話ポップアップモーダル ---------- */
const telModal = document.getElementById('telModal');
const headerTelBtn = document.getElementById('headerTelBtn');

function openTelModal() {
  if (!telModal) return;
  telModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeTelModal() {
  if (!telModal) return;
  telModal.hidden = true;
  document.body.style.overflow = '';
}

if (headerTelBtn) {
  headerTelBtn.addEventListener('click', openTelModal);
}

if (telModal) {
  telModal.querySelectorAll('[data-close-tel]').forEach(function(el) {
    el.addEventListener('click', closeTelModal);
  });
  // 電話番号タップ時にGTM計測
  const telCta = document.getElementById('telModalCta');
  if (telCta) {
    telCta.addEventListener('click', function() {
      window.dataLayer.push({ event: 'tel_tap_cv' });
    });
  }
}

/* ---------- 個人事業主notice表示制御 ---------- */
const companyType = document.getElementById('companyType');
const soleNotice = document.getElementById('soleNotice');

if (companyType && soleNotice) {
  companyType.addEventListener('change', function() {
    soleNotice.hidden = companyType.value !== '個人事業主';
  });
}

/* ==========================================================================
   フォームバリデーション
   ========================================================================== */

/* キャリア名リスト（小文字・空白除去で正規化済み） */
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

/**
 * 入力値を正規化（小文字化、全角→半角、空白・記号除去）
 */
function normalizeCarrierInput(value) {
  return value
    .toLowerCase()
    .replace(/[０-９ａ-ｚＡ-Ｚ]/g, function(s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    })
    .replace(/[\s\u3000・\-_。、,.]/g, '');
}

/**
 * 会社名がキャリア名そのものか判定
 */
function isCarrierName(value) {
  if (!value) return false;
  const normalized = normalizeCarrierInput(value);
  // 完全一致のみ弾く（"ドコモショップ青山" などは通す）
  return CARRIER_PATTERNS.indexOf(normalized) !== -1;
}

/**
 * 日本語文字（漢字・ひらがな・カタカナ）を含むか判定
 */
function containsJapanese(value) {
  if (!value) return false;
  // ひらがな U+3040-U+309F
  // カタカナ U+30A0-U+30FF
  // CJK統合漢字 U+4E00-U+9FFF
  // 半角カタカナ U+FF61-U+FF9F
  const jpRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF61-\uFF9F]/;
  return jpRegex.test(value);
}

/**
 * エラー表示
 */
function showFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const err = document.getElementById('err-' + fieldId);
  if (input) input.classList.add('error');
  if (err) {
    err.textContent = message;
    err.classList.add('show');
  }
}

function clearFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  const err = document.getElementById('err-' + fieldId);
  if (input) input.classList.remove('error');
  if (err) {
    err.textContent = '';
    err.classList.remove('show');
  }
}

/**
 * 会社名のバリデーション
 */
function validateCompanyName(input) {
  const value = input.value.trim();
  clearFieldError('companyName');
  if (!value) return true; // 必須チェックはHTML5に委譲
  if (isCarrierName(value)) {
    showFieldError(
      'companyName',
      '携帯キャリア名が入力されているようです。お客様の会社名・屋号をご入力ください。'
    );
    return false;
  }
  return true;
}

/**
 * 担当者名のバリデーション（日本語必須）
 */
function validateContactName(input) {
  const value = input.value.trim();
  clearFieldError('contactName');
  if (!value) return true;
  if (!containsJapanese(value)) {
    showFieldError(
      'contactName',
      'お名前は日本語（漢字・ひらがな・カタカナ）でご入力ください。'
    );
    return false;
  }
  return true;
}

/* ---------- リアルタイムバリデーション（blur時） ---------- */
const companyNameInput = document.getElementById('companyName');
const contactNameInput = document.getElementById('contactName');

if (companyNameInput) {
  companyNameInput.addEventListener('blur', function() {
    validateCompanyName(companyNameInput);
  });
  companyNameInput.addEventListener('input', function() {
    if (companyNameInput.classList.contains('error')) {
      validateCompanyName(companyNameInput);
    }
  });
}

if (contactNameInput) {
  contactNameInput.addEventListener('blur', function() {
    validateContactName(contactNameInput);
  });
  contactNameInput.addEventListener('input', function() {
    if (contactNameInput.classList.contains('error')) {
      validateContactName(contactNameInput);
    }
  });
}

/* ==========================================================================
   フォーム送信 → 直接 Zapier → サンクスページへ（モーダルなし）
   ========================================================================== */
const form = document.getElementById('leadForm');
const submitBtn = document.getElementById('submitBtn');

if (form && submitBtn) {
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // HTML5バリデーション
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // カスタムバリデーション（キャリア名・日本語必須）
    let isValid = true;
    if (companyNameInput && !validateCompanyName(companyNameInput)) {
      isValid = false;
    }
    if (contactNameInput && !validateContactName(contactNameInput)) {
      isValid = false;
    }
    if (!isValid) {
      const firstError = document.querySelector('.form-row input.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
      return;
    }

    // 送信ボタン無効化＋ローディング表示
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = '送信中...';

    try {
      const formData = new FormData(form);

      const response = await fetch(CONFIG.ZAPIER_WEBHOOK_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // GTM dataLayerへCVイベント送信
      window.dataLayer.push({ event: 'form_submit_cv' });

      // 成功 → thanksページへ遷移
      window.location.href = CONFIG.THANKS_PAGE;
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      alert('送信に失敗しました。お手数ですがお電話でお問い合わせください（' + CONFIG.TEL + '）');
    }
  });
}

/* ---------- ESCキーで電話モーダルを閉じる ---------- */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (telModal && !telModal.hidden) closeTelModal();
  }
});
