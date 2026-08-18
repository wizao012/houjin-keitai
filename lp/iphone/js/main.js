/* ==========================================================================
   法人携帯の窓口 LP - main.js
   ========================================================================== */

/* ---------- 設定 ---------- */
// ▼▼ テスト用：true にすると常に「受付時間外」表示になります（本番前に false へ） ▼▼
var FORCE_TEL_CLOSED = false;

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
    
    // LPパスを自動取得（サブディレクトリ判定用）
    // 例: /lp/iphone/ → "iphone"、/lp/990yen/ → "990yen"
    const lpPathEl = document.getElementById('trk-lp_path');
    if (lpPathEl) {
      lpPathEl.value = location.pathname || '';
    }
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
    telCta.addEventListener('click', function(e) {
      if (!isTelOpenNow()) {
        e.preventDefault();
        closeTelModal();
        openAfterHoursModal();
        return;
      }
      window.dataLayer.push({ event: 'tel_tap_cv' });
    });
  }
}

/* ---------- 営業時間判定（東京時間・平日9:00〜18:00） ---------- */
function isTelOpenNow() {
  if (FORCE_TEL_CLOSED) return false;
  try {
    // 端末のタイムゾーンに関係なく東京時間で判定
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      weekday: 'short',
      hour: 'numeric',
      hour12: false
    }).formatToParts(new Date());
    const wd = parts.find(p => p.type === 'weekday').value; // Mon...Sun
    let hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
    if (hour === 24) hour = 0;
    const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(wd) !== -1;
    return isWeekday && hour >= 9 && hour < 18;
  } catch (e) {
    return true; // 判定不能時は発信を許可
  }
}

/* ---------- 時間外モーダル制御 ---------- */
const afterHoursModal = document.getElementById('afterHoursModal');

function openAfterHoursModal() {
  if (!afterHoursModal) return;
  afterHoursModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeAfterHoursModal() {
  if (!afterHoursModal) return;
  afterHoursModal.hidden = true;
  document.body.style.overflow = '';
}

if (afterHoursModal) {
  afterHoursModal.querySelectorAll('[data-close-afterhours]').forEach(function(el) {
    el.addEventListener('click', closeAfterHoursModal);
  });
  const afterHoursFormBtn = document.getElementById('afterHoursFormBtn');
  if (afterHoursFormBtn) {
    afterHoursFormBtn.addEventListener('click', function(e) {
      e.preventDefault();
      closeAfterHoursModal();
      const target = document.getElementById('contact-form');
      if (target) {
        setTimeout(function() {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    });
  }
}

/* ---------- FV電話CTAタップ計測 ---------- */
const fvTelCta = document.getElementById('fvTelCta');
if (fvTelCta) {
  fvTelCta.addEventListener('click', function(e) {
    if (!isTelOpenNow()) {
      e.preventDefault();
      openAfterHoursModal();
      return;
    }
    window.dataLayer.push({ event: 'tel_tap_cv' });
  });
}

/* ---------- 会社形態 → 書類確認エリア表示制御 ---------- */
const companyType = document.getElementById('companyType');
const soleNotice = document.getElementById('soleNotice');
const corpNotice = document.getElementById('corpNotice');

// 会社形態が変更されたら、該当する書類確認エリアを表示
if (companyType) {
  companyType.addEventListener('change', function() {
    const value = companyType.value;
    
    // 法人系（株式会社・有限会社・その他営利法人）
    const isCorp = ['株式会社', '有限会社', 'その他営利法人'].indexOf(value) !== -1;
    // 個人事業主
    const isSole = value === '個人事業主';
    
    if (soleNotice) {
      soleNotice.hidden = !isSole;
      // 非表示時はラジオボタンの選択をリセット
      if (!isSole) {
        const radios = soleNotice.querySelectorAll('input[type="radio"]');
        radios.forEach(r => r.checked = false);
        const deny = soleNotice.querySelector('[data-deny-for="sole"]');
        if (deny) deny.hidden = true;
      }
    }
    
    if (corpNotice) {
      corpNotice.hidden = !isCorp;
      if (!isCorp) {
        const radios = corpNotice.querySelectorAll('input[type="radio"]');
        radios.forEach(r => r.checked = false);
        const deny = corpNotice.querySelector('[data-deny-for="corp"]');
        if (deny) deny.hidden = true;
      }
    }
  });
}

// 書類確認のラジオボタンが変更されたら、「いいえ」選択時に注釈を表示
function setupDocCheckRadios(noticeEl, denyKey) {
  if (!noticeEl) return;
  const radios = noticeEl.querySelectorAll('input[type="radio"]');
  const deny = noticeEl.querySelector(`[data-deny-for="${denyKey}"]`);
  
  radios.forEach(function(radio) {
    radio.addEventListener('change', function() {
      const allowSubmit = radio.dataset.allowSubmit === 'true';
      if (deny) deny.hidden = allowSubmit;
    });
  });
}

setupDocCheckRadios(soleNotice, 'sole');
setupDocCheckRadios(corpNotice, 'corp');

// 書類確認のバリデーション（送信時にチェック）
function validateDocumentCheck() {
  const value = companyType ? companyType.value : '';
  const isCorp = ['株式会社', '有限会社', 'その他営利法人'].indexOf(value) !== -1;
  const isSole = value === '個人事業主';
  
  // 法人系の場合
  if (isCorp && corpNotice) {
    const checkedRadio = corpNotice.querySelector('input[type="radio"]:checked');
    if (!checkedRadio) {
      alert('登記簿謄本のご準備状況をお選びください。');
      corpNotice.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    if (checkedRadio.dataset.allowSubmit === 'false') {
      alert('登記簿謄本のご提示が必須のため、お申し込みをお受けできません。\nご不明点があればお電話にてご相談ください：050-1791-6247');
      return false;
    }
  }
  
  // 個人事業主の場合
  if (isSole && soleNotice) {
    const checkedRadio = soleNotice.querySelector('input[type="radio"]:checked');
    if (!checkedRadio) {
      alert('書類のご準備状況をお選びください。');
      soleNotice.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    if (checkedRadio.dataset.allowSubmit === 'false') {
      alert('書類のご提示が必須のため、お申し込みをお受けできません。\nご不明点があればお電話にてご相談ください：050-1791-6247');
      return false;
    }
  }
  
  return true;
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

    // 書類確認バリデーション（最優先）
    if (!validateDocumentCheck()) {
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

      // Zapier送信（no-corsモードでCORS問題を回避）
      // no-corsではレスポンスが読めないが、データは正常に送信される
      await fetch(CONFIG.ZAPIER_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });

      // GTM dataLayerへCVイベント送信
      window.dataLayer.push({ event: 'form_submit_cv' });

      // サンクスページへ遷移
      window.location.href = CONFIG.THANKS_PAGE;
    } catch (err) {
      // 真のネットワークエラーのみここに来る
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
    if (afterHoursModal && !afterHoursModal.hidden) closeAfterHoursModal();
  }
});
