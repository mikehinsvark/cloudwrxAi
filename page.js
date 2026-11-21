/* Standalone calculators for the existing agent-page markup. */
;(function (global, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (global) {
    global.DreamsAgentCalculators = api;
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var BUSINESS_DEFAULTS = {
    industry: "other", country: "USA", desk: 40, nonDesk: 15, years: 8
  };
  var REFERRAL_DEFAULTS = { personal: 1, team: 1, teamRate: 10000 };
  var PERSONAL_REFERRAL_EXAMPLE = 50000;
  var currency = new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0
  });
  var compactCurrency = new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", notation: "compact",
    minimumFractionDigits: 0, maximumFractionDigits: 1
  });

  // Preserve fractional numeric input; empty/non-finite input uses the minimum.
  function clampEstimateInput(value, min, max) {
    var numeric = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numeric)
      ? Math.min(max, Math.max(min, numeric))
      : min;
  }

  function round10k(value) {
    return Math.round(value / 10000) * 10000;
  }

  // Exact Cloudwrx source model, with source count fixed at five.
  function calculateBusinessEstimate(inputs) {
    var desk = clampEstimateInput(inputs.desk, 0, 100000);
    var nonDesk = clampEstimateInput(inputs.nonDesk, 0, 100000);
    var years = clampEstimateInput(inputs.years, 0, 100);
    var countryMultiplier = inputs.country === "Canada" ? 0.75 : 1;
    var industryMultiplier =
      inputs.industry === "legal" || inputs.industry === "medical" ? 1.3 : 1;
    var t = desk * 2400 + nonDesk * 240 + 16500 + years * 12250;
    var subtotal = t + Math.min(145000, t * 1.5);
    var offer = subtotal * 1.025 * 0.6 * countryMultiplier * industryMultiplier;
    var low = round10k(offer * 0.7 * 1.15 * 1.1);
    var high = round10k(offer * 1.05 * 1.35 * 1.25 * 2);
    var warning = desk < 20
      ? "Fewer than 20 desk employees: the source model flags smaller desk teams for closer review. This is not an eligibility decision."
      : years < 3
        ? "Less than 3 years of operating history: the source model flags shorter histories for closer review. This is not an eligibility decision."
        : null;

    return {
      low: low, high: high, t: t, subtotal: subtotal, offer: offer,
      countryMultiplier: countryMultiplier,
      industryMultiplier: industryMultiplier, warning: warning
    };
  }

  // The pure API retains the source's strict numeric team-rate comparison.
  function calculateReferralEstimate(inputs) {
    var personal = clampEstimateInput(inputs.personal, 0, 20);
    var team = clampEstimateInput(inputs.team, 0, 50);
    var teamRate = inputs.teamRate === 10000 ? 10000 : 5000;
    var personalAmount = personal * PERSONAL_REFERRAL_EXAMPLE;
    var teamAmount = team * teamRate;
    return {
      personalAmount: personalAmount, teamAmount: teamAmount,
      total: personalAmount + teamAmount, teamRate: teamRate
    };
  }

  function attributeNumber(element, name, fallback) {
    var value = element.getAttribute(name);
    if (value === null || value.trim() === "") return fallback;
    var numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function fieldValue(field, fallbackMax) {
    return clampEstimateInput(
      field.value,
      attributeNumber(field, "min", 0),
      attributeNumber(field, "max", fallbackMax)
    );
  }

  function syncRange(number, range, fallbackMax, fallbackSliderMax) {
    var value = fieldValue(number, fallbackMax);
    number.value = String(value);
    // A capped slider must not cap the separate numeric field's value.
    range.value = String(clampEstimateInput(
      value,
      attributeNumber(range, "min", 0),
      attributeNumber(range, "max", fallbackSliderMax)
    ));
    return value;
  }

  function listenNumber(field, update) {
    field.addEventListener("input", update);
    field.addEventListener("change", update);
  }

  function bindRange(number, range, update) {
    listenNumber(number, update);
    listenNumber(range, function () {
      number.value = range.value;
      update();
    });
  }

  function resetButton(header, label) {
    if (!header || header.tagName.toLowerCase() !== "header") return null;
    var buttons = header.querySelectorAll("button.an-calc-reset");
    for (var i = 0; i < buttons.length; i += 1) {
      if (buttons[i].textContent.replace(/\s+/g, " ").trim() === label) {
        return buttons[i];
      }
    }
    return null;
  }

  function updateWarning(live, message) {
    var warning = live.querySelector("p.an-calc-warning");
    if (!message) {
      if (warning) warning.remove();
      return;
    }
    if (!warning) {
      warning = live.ownerDocument.createElement("p");
      warning.className = "an-calc-warning";
      warning.textContent = message;
      live.appendChild(warning);
      return;
    }
    // Update only warning text, retaining the existing decorative SVG if present.
    var textNode = null;
    for (var i = 0; i < warning.childNodes.length; i += 1) {
      var node = warning.childNodes[i];
      if (node.nodeType === 3) {
        if (!textNode) textNode = node;
        else node.nodeValue = "";
      }
    }
    if (!textNode) {
      textNode = live.ownerDocument.createTextNode("");
      warning.appendChild(textNode);
    }
    textNode.nodeValue = (warning.querySelector("svg") ? " " : "") + message;
  }

  function initBusiness(calculator) {
    var industry = calculator.querySelector("#an-business-industry");
    var country = calculator.querySelector("#an-business-country");
    var desk = calculator.querySelector("#an-business-desk");
    var nonDesk = calculator.querySelector("#an-business-nondesk");
    var years = calculator.querySelector("#an-business-years");
    var deskRange = calculator.querySelector("#an-business-desk-range");
    var nonDeskRange = calculator.querySelector("#an-business-nondesk-range");
    var yearsRange = calculator.querySelector("#an-business-years-range");
    var output = calculator.querySelector("output.an-result-number");
    var live = calculator.querySelector(".an-result-live");
    var amounts = output && output.querySelectorAll("span:not(.an-result-dash)");
    if (!industry || !country || !desk || !nonDesk || !years ||
        !deskRange || !nonDeskRange || !yearsRange || !live ||
        !amounts || amounts.length !== 2) return false;

    function update() {
      var result = calculateBusinessEstimate({
        industry: industry.value,
        country: country.value,
        desk: syncRange(desk, deskRange, 100000, 500),
        nonDesk: syncRange(nonDesk, nonDeskRange, 100000, 500),
        years: syncRange(years, yearsRange, 100, 20)
      });
      // Keep the original output, dash, unit, live-region ARIA and caveats intact.
      amounts[0].textContent = currency.format(result.low);
      amounts[1].textContent = currency.format(result.high);
      updateWarning(live, result.warning);
    }

    industry.addEventListener("change", update);
    country.addEventListener("change", update);
    bindRange(desk, deskRange, update);
    bindRange(nonDesk, nonDeskRange, update);
    bindRange(years, yearsRange, update);
    var reset = resetButton(calculator.previousElementSibling, "Reset business");
    if (reset) {
      reset.addEventListener("click", function (event) {
        event.preventDefault();
        industry.value = BUSINESS_DEFAULTS.industry;
        country.value = BUSINESS_DEFAULTS.country;
        desk.value = String(BUSINESS_DEFAULTS.desk);
        nonDesk.value = String(BUSINESS_DEFAULTS.nonDesk);
        years.value = String(BUSINESS_DEFAULTS.years);
        update();
      });
    }
    update();
    return true;
  }

  function initReferrals(calculator) {
    var personal = calculator.querySelector("#an-referral-personal");
    var team = calculator.querySelector("#an-referral-team");
    var rate = calculator.querySelector("#an-referral-rate");
    var output = calculator.querySelector("output.an-result-number");
    var terms = calculator.querySelectorAll(".an-result-breakdown dt");
    var amounts = calculator.querySelectorAll(".an-result-breakdown dd");
    var header = calculator.previousElementSibling;
    var scenario = header && header.id === "referral-estimate"
      ? header.querySelector("p") : null;
    if (!personal || !team || !rate || !output ||
        terms.length !== 2 || amounts.length !== 2 || !scenario) return false;

    function update() {
      var personalCount = fieldValue(personal, 20);
      var teamCount = fieldValue(team, 50);
      var result = calculateReferralEstimate({
        personal: personalCount, team: teamCount,
        teamRate: Number(rate.value) === 10000 ? 10000 : 5000
      });
      personal.value = String(personalCount);
      team.value = String(teamCount);
      rate.value = String(result.teamRate);
      output.textContent = compactCurrency.format(result.total);
      terms[0].textContent = "Personal · " + personalCount + " × " +
        currency.format(PERSONAL_REFERRAL_EXAMPLE);
      amounts[0].textContent = currency.format(result.personalAmount);
      terms[1].textContent = "Team · " + teamCount + " × " +
        currency.format(result.teamRate);
      amounts[1].textContent = currency.format(result.teamAmount);
      scenario.textContent = "This scenario uses a fixed illustrative " +
        currency.format(PERSONAL_REFERRAL_EXAMPLE) +
        " per personal referral and the selected " +
        currency.format(result.teamRate) + " per team referral.";
    }

    listenNumber(personal, update);
    listenNumber(team, update);
    rate.addEventListener("change", update);
    var reset = resetButton(header, "Reset referrals");
    if (reset) {
      reset.addEventListener("click", function (event) {
        event.preventDefault();
        personal.value = String(REFERRAL_DEFAULTS.personal);
        team.value = String(REFERRAL_DEFAULTS.team);
        rate.value = String(REFERRAL_DEFAULTS.teamRate);
        update();
      });
    }
    update();
    return true;
  }

  // Explicit initialization only: pass the rendered agent-page root element.
  function init(root) {
    if (!root || !root.dataset || typeof root.querySelector !== "function" ||
        root.dataset.dreamsAgentCalculators === "initialized") return;
    var business = root.querySelector("#an-business-calculator");
    var referrals = root.querySelector("#an-referral-calculator");
    if (!business && !referrals) return;
    var businessReady = business ? initBusiness(business) : false;
    var referralsReady = referrals ? initReferrals(referrals) : false;
    if (businessReady || referralsReady) {
      root.dataset.dreamsAgentCalculators = "initialized";
    }
  }

  return {
    calculateBusinessEstimate: calculateBusinessEstimate,
    calculateReferralEstimate: calculateReferralEstimate,
    init: init
  };
});


/* Shared native interactions. No forms, tracking, cookies, or network requests. */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  function start() {
    var root = document.getElementById('dreams-agent-embed');
    if (!root) return false;
    if (root.dataset.dreamsPageReady === 'true') return true;
    root.dataset.dreamsPageReady = 'true';
    if (window.DreamsAgentCalculators) window.DreamsAgentCalculators.init(root);
    var menu = root.querySelector('.an-menu-button, .cl-menu');
    var nav = root.querySelector('.an-nav, .cl-nav');
    if (menu && nav) {
      var originalIcon = menu.innerHTML;
      var closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
      function setMenu(open) {
        nav.classList.toggle('is-open', open);
        menu.setAttribute('aria-expanded', String(open));
        menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
        menu.innerHTML = open ? closeIcon : originalIcon;
      }
      menu.addEventListener('click', function () { setMenu(menu.getAttribute('aria-expanded') !== 'true'); });
      nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
      root.addEventListener('keydown', function (event) { if (event.key === 'Escape') setMenu(false); });
    }
    root.querySelectorAll('dialog').forEach(function (dialog) {
      dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
      var close = dialog.querySelector('.an-dialog-close, .cl-dialog-close');
      if (close) close.addEventListener('click', function () { dialog.close(); });
    });
    root.querySelectorAll('.an-logo-expand, .cl-logo-expand, .an-graphic-open, .cl-image-open').forEach(function (button) {
      button.addEventListener('click', function () {
        var dialog = button.parentElement.querySelector('dialog');
        if (!dialog) return;
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else { var image = dialog.querySelector('img'); if (image) window.open(image.src, '_blank', 'noopener'); }
      });
    });
    root.querySelectorAll('video').forEach(function (video) {
      video.addEventListener('play', function () { root.querySelectorAll('video').forEach(function (other) { if (other !== video) other.pause(); }); });
    });
    var demo = root.querySelector('.cl-privacy-demo');
    if (demo) {
      var buttons = demo.querySelectorAll('.cl-demo-switch button');
      var mark = demo.querySelector('mark');
      var status = demo.querySelector('.cl-demo-status span');
      buttons.forEach(function (button, index) {
        button.addEventListener('click', function () {
          var original = index === 1;
          buttons.forEach(function (b, i) { b.setAttribute('aria-pressed', String(original ? i === 1 : i === 0)); });
          mark.textContent = original ? 'Dana Ruiz' : 'Customer 0412';
          mark.classList.toggle('is-original', original);
          status.textContent = original ? 'Fictional name shown for comparison.' : 'Name replaced. The workflow context remains.';
        });
      });
    }
    return true;
  }
  function ready() {
    if (start()) return;
    var observer = new MutationObserver(function () { if (start()) observer.disconnect(); });
    observer.observe(document.body, {childList:true, subtree:true});
    window.setTimeout(function () { observer.disconnect(); }, 30000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, {once:true});
  else ready();
}());

