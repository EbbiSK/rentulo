document.addEventListener("DOMContentLoaded", function () {
  saveUserFromRegistration();
  saveUserFromLogin();
  renderUserInDashboard();
});

/*
  Správa používateľa.

  Tento súbor nechávame aktívny, pretože niektoré stránky môžu používať
  spoločné funkcie pre:
  - registraci
  - přihlášení
  - zobrazení údajů v Můj účet

  Důležité:
  Pri prihlásení už nevytvárame nový účet automaticky.
  Používateľ sa môže prihlásiť iba vtedy, keď existuje v rentuloUsers,
  naradiUsers alebo keď ho nájdeme v starších demo dátach.
*/

function getInitials(fullName) {
  if (!fullName) {
    return "U";
  }

  const parts = String(fullName).trim().split(" ").filter(Boolean);

  if (!parts.length) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function saveCurrentUser(user) {
  if (typeof saveJson === "function") {
    saveJson("rentuloUser", user);
    saveJson("naradiUser", user);
  } else {
    localStorage.setItem("rentuloUser", JSON.stringify(user));
    localStorage.setItem("naradiUser", JSON.stringify(user));
  }

  localStorage.setItem("rentuloLoggedIn", "true");
  localStorage.setItem("naradiLoggedIn", "true");
}

function findUserByEmail(email) {
  const users = getUsers();
  const normalizedEmail = normalizeEmail(email);

  return users.find(function (user) {
    return normalizeEmail(getUserEmail(user)) === normalizedEmail;
  }) || null;
}



function addOrUpdateUser(user) {
  const users = getUsers();
  const normalizedEmail = normalizeEmail(user.email);

  const existingIndex = users.findIndex(function (item) {
    return normalizeEmail(getUserEmail(item)) === normalizedEmail;
  });

  if (existingIndex >= 0) {
    users[existingIndex] = {
      ...users[existingIndex],
      ...user
    };
  } else {
    users.push(user);
  }

  saveUsers(users);
  saveCurrentUser(user);
}

function showUserMessage(message, type) {
  if (typeof showMessage === "function") {
    showMessage(message, type || "error");
    return;
  }

  let messageBox = document.querySelector(".site-message");

  if (!messageBox) {
    messageBox = document.createElement("div");
    messageBox.className = "site-message";
    document.body.appendChild(messageBox);
  }

  messageBox.textContent = message;
  messageBox.className = "site-message " + (type || "error");

  setTimeout(function () {
    messageBox.className = "site-message";
  }, 3500);
}

function markUserInputError(input) {
  if (input) {
    input.classList.add("input-error");
  }
}

function clearUserInputErrors(form) {
  if (!form) {
    return;
  }

  const fields = form.querySelectorAll("input, textarea, select");

  fields.forEach(function (field) {
    field.classList.remove("input-error");
  });
}

/* Uložení údajů při registraci */

function saveUserFromRegistration() {
  const page = window.location.pathname;

  if (!page.includes("registrace.html")) {
    return;
  }

  const registerButton = document.querySelector(".auth-link-button");

  if (!registerButton) {
    return;
  }

  registerButton.addEventListener("click", function (event) {
    const form = registerButton.closest("form");

    if (!form) {
      return;
    }

    clearUserInputErrors(form);

    const fullNameInput =
      document.getElementById("fullName") ||
      form.querySelector('input[name="fullName"]') ||
      form.querySelectorAll("input")[0];

    const emailInput =
      document.getElementById("email") ||
      form.querySelector('input[type="email"]') ||
      form.querySelectorAll("input")[1];

    const phoneInput =
      document.getElementById("phone") ||
      form.querySelector('input[type="tel"]') ||
      form.querySelectorAll("input")[2];

    const streetInput =
      document.getElementById("street") ||
      form.querySelector('input[name="street"]') ||
      null;

    const cityInput =
      document.getElementById("city") ||
      form.querySelector('input[name="city"]') ||
      null;

    const postalInput =
      document.getElementById("postalCode") ||
      form.querySelector('input[name="postalCode"]') ||
      null;

    const passwordInput =
      document.getElementById("password") ||
      form.querySelector('input[type="password"]');

    const termsCheckbox = form.querySelector('.terms-check input[type="checkbox"]');

    const fullName = fullNameInput ? fullNameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const street = streetInput ? streetInput.value.trim() : "";
    const city = cityInput ? cityInput.value.trim() : "";
    const postalCode = postalInput ? postalInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value.trim() : "";

    let hasError = false;

    if (!fullName) {
      markUserInputError(fullNameInput);
      hasError = true;
    }

    if (!email) {
      markUserInputError(emailInput);
      hasError = true;
    }

    if (!phone) {
      markUserInputError(phoneInput);
      hasError = true;
    }

    if (!password) {
      markUserInputError(passwordInput);
      hasError = true;
    }

    if (termsCheckbox && !termsCheckbox.checked) {
      hasError = true;
      showUserMessage("Musíte souhlasit s podmínkami používání.");
    }

    if (hasError) {
      event.preventDefault();

      if (!termsCheckbox || termsCheckbox.checked) {
        showUserMessage("Vyplňte prosím všechna povinná pole.");
      }

      return;
    }

    const existingUser = findUserByEmail(email);

    if (existingUser) {
      event.preventDefault();
      markUserInputError(emailInput);
      showUserMessage("Účet s tímto e-mailem už existuje. Přihlaste se.");
      return;
    }

    const user = {
      fullName: fullName,
      name: fullName,
      email: email,
      phone: phone,
      street: street,
      city: city,
      postalCode: postalCode,
      password: password,
      initials: getInitials(fullName)
    };

    addOrUpdateUser(user);
    showUserMessage("Účet byl vytvořen.", "success");
  });
}

/* Přihlášení existujícího účtu */

function saveUserFromLogin() {
  const page = window.location.pathname;

  if (!page.includes("prihlaseni.html")) {
    return;
  }

  const loginButton = document.querySelector(".auth-link-button");

  if (!loginButton) {
    return;
  }

  loginButton.addEventListener("click", function (event) {
    const form = loginButton.closest("form");

    if (!form) {
      return;
    }

    clearUserInputErrors(form);

    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');

    if (!emailInput || !passwordInput) {
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    let hasError = false;

    if (!email) {
      markUserInputError(emailInput);
      hasError = true;
    }

    if (!password) {
      markUserInputError(passwordInput);
      hasError = true;
    }

    if (hasError) {
      event.preventDefault();
      showUserMessage("Vyplňte prosím e-mail a heslo.");
      return;
    }

    let user = findUserByEmail(email);

    

    if (!user) {
      event.preventDefault();
      markUserInputError(emailInput);
      showUserMessage("Účet s tímto e-mailem neexistuje.");
      return;
    }

    if (user.password && user.password !== password) {
      event.preventDefault();
      markUserInputError(passwordInput);
      showUserMessage("Zadané heslo není správné.");
      return;
    }

    saveCurrentUser(user);
    showUserMessage("Přihlášení proběhlo úspěšně.", "success");
  });
}

/* Zobrazení údajů na stránce Můj účet */

function renderUserInDashboard() {
  const page = window.location.pathname;

  if (!page.includes("muj-ucet.html")) {
    return;
  }

  const user = getCurrentUser();

  if (!user) {
    return;
  }

  const fullName = getUserName(user);
  const email = getUserEmail(user);
  const phone = getUserPhone(user);
  const initials = user.initials || getInitials(fullName);
  const firstName = fullName.split(" ")[0] || "uživateli";

  const title = document.querySelector(".dashboard-header h1");

  if (title) {
    title.textContent = "Dobrý den, " + firstName;
  }

  const avatar = document.querySelector(".profile-avatar");

  if (avatar) {
    avatar.textContent = initials;
  }

  const profileName = document.querySelector(".dashboard-profile strong");

  if (profileName) {
    profileName.textContent = fullName;
  }

  const profileEmail = document.querySelector(".dashboard-profile small");

  if (profileEmail) {
    profileEmail.textContent = email;
  }

  const accountInfoItems = document.querySelectorAll(".account-info div");

  accountInfoItems.forEach(function (item) {
    const label = item.querySelector("span");
    const value = item.querySelector("strong");

    if (!label || !value) {
      return;
    }

    const labelText = label.textContent.trim();

    if (labelText === "Jméno") {
      value.textContent = fullName;
    }

    if (labelText === "E-mail") {
      value.textContent = email;
    }

    if (labelText === "Telefon") {
      value.textContent = phone || "Telefon není vyplněn";
    }
  });
}