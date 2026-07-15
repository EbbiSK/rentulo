    const cityPostalCodes = {
      "praha": "110 00",
      "brno": "602 00",
      "ostrava": "702 00",
      "plzeň": "301 00",
      "plzen": "301 00",
      "liberec": "460 01",
      "olomouc": "779 00",
      "české budějovice": "370 01",
      "ceske budejovice": "370 01",
      "hradec králové": "500 03",
      "hradec kralove": "500 03",
      "pardubice": "530 02",
      "zlín": "760 01",
      "zlin": "760 01",
      "havířov": "736 01",
      "havirov": "736 01",
      "kladno": "272 01",
      "most": "434 01",
      "opava": "746 01",
      "frýdek-místek": "738 01",
      "frydek-mistek": "738 01",
      "karviná": "733 01",
      "karvina": "733 01",
      "jihlava": "586 01",
      "teplice": "415 01",
      "děčín": "405 02",
      "decin": "405 02",
      "chomutov": "430 01",
      "karlovy vary": "360 01",
      "jablonec nad nisou": "466 01",
      "mladá boleslav": "293 01",
      "mlada boleslav": "293 01",
      "prostějov": "796 01",
      "prostejov": "796 01",
      "přerov": "750 02",
      "prerov": "750 02",
      "třinec": "739 61",
      "trinec": "739 61",
      "tábor": "390 01",
      "tabor": "390 01",
      "znojmo": "669 02",
      "kolín": "280 02",
      "kolin": "280 02",
      "písek": "397 01",
      "pisek": "397 01",
      "cheb": "350 02",
      "příbram": "261 01",
      "pribram": "261 01",
      "orlová": "735 14",
      "orlova": "735 14",
      "kroměříž": "767 01",
      "kromeriz": "767 01",
      "vsetín": "755 01",
      "vsetin": "755 01",
      "šumperk": "787 01",
      "sumperk": "787 01",
      "uherské hradiště": "686 01",
      "uherske hradiste": "686 01",
      "břeclav": "690 02",
      "breclav": "690 02",
      "hodonín": "695 01",
      "hodonin": "695 01",
      "česká lípa": "470 01",
      "ceska lipa": "470 01",
      "litoměřice": "412 01",
      "litomerice": "412 01",
      "krnov": "794 01",
      "sokolov": "356 01"
    };

    function registrationNormalizeEmail(email) {
      return String(email || "").trim().toLowerCase();
    }

    function normalizeCityName(value) {
      return String(value || "")
        .trim()
        .toLowerCase();
    }

    function registrationShowError(message) {
      const errorBox = document.getElementById("registrationError");

      if (!errorBox) {
        return;
      }

      errorBox.textContent = message;
      errorBox.classList.add("active");
    }

    function registrationHideError() {
      const errorBox = document.getElementById("registrationError");

      if (!errorBox) {
        return;
      }

      errorBox.textContent = "";
      errorBox.classList.remove("active");
    }

    function registrationClearErrors() {
      const fields = document.querySelectorAll("#registrationForm input");

      fields.forEach(function (field) {
        field.classList.remove("input-error");
      });
    }

    function registrationMarkError(input) {
      if (input) {
        input.classList.add("input-error");
      }
    }

    function registrationIsEmpty(value) {
      return String(value || "").trim() === "";
    }

    function registrationGetInitials(fullName) {
      if (!fullName) {
        return "U";
      }

      const parts = fullName.trim().split(" ").filter(Boolean);

      if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
      }

      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }

    function registrationGetSupabaseClient() {
      if (window.rentuloSupabase) {
        return window.rentuloSupabase;
      }

      if (typeof rentuloSupabase !== "undefined") {
        return rentuloSupabase;
      }

      return null;
    }

    function registrationSaveCurrentUser(user) {
      if (typeof saveCurrentUser === "function") {
        saveCurrentUser(user);
        return;
      }

      try {
        localStorage.setItem("rentuloUser", JSON.stringify(user));
localStorage.setItem("rentuloLoggedIn", "true");
      } catch (error) {
        console.warn("Nepodařilo se uložit aktuálního uživatele do localStorage.", error);
      }
    }

    function setupCitySuggestions() {
      const datalist = document.getElementById("citySuggestions");

      if (!datalist) {
        return;
      }

      const uniqueCities = [];
      const seen = {};

      Object.keys(cityPostalCodes).forEach(function (city) {
        const displayCity = city
          .split(" ")
          .map(function (part) {
            return part.charAt(0).toUpperCase() + part.slice(1);
          })
          .join(" ");

        const normalized = normalizeCityName(displayCity);

        if (!seen[normalized]) {
          seen[normalized] = true;
          uniqueCities.push(displayCity);
        }
      });

      datalist.innerHTML = uniqueCities
        .sort()
        .map(function (city) {
          return `<option value="${city}"></option>`;
        })
        .join("");
    }

    function setupPostalCodeAutocomplete() {
      const cityInput = document.getElementById("city");
      const postalCodeInput = document.getElementById("postalCode");

      if (!cityInput || !postalCodeInput) {
        return;
      }

      function updatePostalCode() {
        const city = normalizeCityName(cityInput.value);
        const postalCode = cityPostalCodes[city];

        if (!postalCode) {
          return;
        }

        if (!postalCodeInput.value.trim() || postalCodeInput.dataset.autoFilled === "true") {
          postalCodeInput.value = postalCode;
          postalCodeInput.dataset.autoFilled = "true";
        }
      }

      cityInput.addEventListener("input", updatePostalCode);
      cityInput.addEventListener("change", updatePostalCode);

      postalCodeInput.addEventListener("input", function () {
        postalCodeInput.dataset.autoFilled = "false";
      });
    }

    async function createUserAccount(event) {
      event.preventDefault();

      registrationHideError();
      registrationClearErrors();

      const supabaseClient = registrationGetSupabaseClient();

      if (!supabaseClient) {
        registrationShowError("Chyba: Supabase klient není načtený. Zkontrolujte js/supabase-config.js.");
        return;
      }

      const fullNameInput = document.getElementById("fullName");
      const emailInput = document.getElementById("email");
      const phoneInput = document.getElementById("phone");
      const streetInput = document.getElementById("street");
      const cityInput = document.getElementById("city");
      const postalCodeInput = document.getElementById("postalCode");
      const passwordInput = document.getElementById("password");
      const submitButton = document.getElementById("registrationSubmitButton");

      const termsBusiness = document.getElementById("termsBusiness");
      const termsPrivacy = document.getElementById("termsPrivacy");
      const termsIdentity = document.getElementById("termsIdentity");

      const requiredFields = [
        fullNameInput,
        emailInput,
        phoneInput,
        streetInput,
        cityInput,
        postalCodeInput,
        passwordInput
      ];

      let hasError = false;

      requiredFields.forEach(function (field) {
        if (registrationIsEmpty(field.value)) {
          registrationMarkError(field);
          hasError = true;
        }
      });

      if (!termsBusiness.checked) {
        registrationMarkError(termsBusiness);
        hasError = true;
      }

      if (!termsPrivacy.checked) {
        registrationMarkError(termsPrivacy);
        hasError = true;
      }

      if (!termsIdentity.checked) {
        registrationMarkError(termsIdentity);
        hasError = true;
      }

      if (hasError) {
        registrationShowError("Vyplňte prosím všechna pole a potvrďte všechny souhlasy.");
        return;
      }

      if (passwordInput.value.length < 6) {
        registrationMarkError(passwordInput);
        registrationShowError("Heslo musí mít alespoň 6 znaků.");
        return;
      }

      const email = registrationNormalizeEmail(emailInput.value);
      const fullName = fullNameInput.value.trim();
      const phone = phoneInput.value.trim();
      const street = streetInput.value.trim();
      const city = cityInput.value.trim();
      const postalCode = postalCodeInput.value.trim();
      const now = new Date().toISOString();

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Vytvářím účet...";
      }

      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email: email,
          password: passwordInput.value,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              street: street,
              city: city,
              postal_code: postalCode,
              terms_business_accepted: true,
              terms_privacy_accepted: true,
              terms_identity_accepted: true,
              terms_accepted_at: now
            }
          }
        });

        if (error) {
          const message = String(error.message || "");

          if (message.toLowerCase().includes("already registered") || message.toLowerCase().includes("already exists")) {
            registrationMarkError(emailInput);
            registrationShowError("Uživatel s tímto e-mailem už existuje. Zkuste se přihlásit.");
            return;
          }

          registrationShowError("Registrace se nepodařila: " + message);
          return;
        }

        const createdUser = {
          id: data && data.user ? data.user.id : "supabase-user-" + Date.now(),
          fullName: fullName,
          name: fullName,
          email: email,
          phone: phone,
          street: street,
          city: city,
          postalCode: postalCode,
          initials: registrationGetInitials(fullName),
          role: "user",

          termsBusinessAccepted: true,
          termsPrivacyAccepted: true,
          termsIdentityAccepted: true,
          termsAcceptedAt: now,

          createdAt: now,
          updatedAt: now,
          source: "supabase"
        };
const { error: profileError } = await supabaseClient
  .from("profiles")
  .upsert(
    {
      id: createdUser.id,
      full_name: createdUser.fullName,
      email: createdUser.email,
      phone: createdUser.phone,
      street: createdUser.street,
      city: createdUser.city,
      postal_code: createdUser.postalCode,




      updated_at: createdUser.updatedAt
    },
    {
      onConflict: "id"
    }
  );

if (profileError) {
  throw profileError;
}
        registrationSaveCurrentUser(createdUser);

        window.location.href = "ucet-vytvoren.html";
      } catch (error) {
        console.error(error);
        registrationShowError("Registrace se nepodařila. Zkontrolujte připojení a zkuste to znovu.");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Vytvořit účet";
        }
      }
    }

    document.addEventListener("DOMContentLoaded", function () {
      renderSharedNavigation("");
      setupCitySuggestions();
      setupPostalCodeAutocomplete();

      const registrationForm = document.getElementById("registrationForm");

      if (registrationForm) {
        registrationForm.addEventListener("submit", createUserAccount);
      }
    });
