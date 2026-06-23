document.documentElement.classList.add("js");

// This website now uses Firebase directly. GitHub Pages cannot run Node.js backend code.

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initScrollEffects();
  initRevealAnimations();
  initFaq();
  initDateAndService();
  initPasswordToggles();
  initAuthTabs();
  initForms();
  initUserState();

  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
});

function initNavigation() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");

  if (!toggle || !nav) return;

  const closeNavigation = () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
  };

  toggle.addEventListener("click", () => {
    const willOpen = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(willOpen));
    toggle.setAttribute("aria-label", willOpen ? "Close navigation" : "Open navigation");
    nav.classList.toggle("is-open", willOpen);
    document.body.classList.toggle("nav-open", willOpen);
  });

  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNavigation));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNavigation();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) closeNavigation();
  });
}

function initScrollEffects() {
  const header = document.querySelector("[data-header]");
  const progress = document.querySelector(".page-progress span");
  let ticking = false;

  const update = () => {
    const scrollTop = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", scrollTop > 28);

    if (progress) {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = available > 0 ? Math.min(100, (scrollTop / available) * 100) : 0;
      progress.style.width = `${percentage}%`;
    }

    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  update();
}

function initRevealAnimations() {
  const elements = [...document.querySelectorAll(".reveal")];
  if (!elements.length) return;

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const delay = Number(entry.target.dataset.delay || 0);
      window.setTimeout(() => entry.target.classList.add("is-visible"), delay);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.13, rootMargin: "0px 0px -35px" });

  elements.forEach((element) => observer.observe(element));
}

function initFaq() {
  const items = document.querySelectorAll(".faq-item");
  items.forEach((item) => {
    const button = item.querySelector("button");
    if (!button) return;

    button.addEventListener("click", () => {
      const willOpen = !item.classList.contains("is-open");
      items.forEach((otherItem) => {
        otherItem.classList.remove("is-open");
        otherItem.querySelector("button")?.setAttribute("aria-expanded", "false");
      });
      item.classList.toggle("is-open", willOpen);
      button.setAttribute("aria-expanded", String(willOpen));
    });
  });
}

function initDateAndService() {
  const dateInputs = document.querySelectorAll("[data-min-today]");
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const today = now.toISOString().slice(0, 10);

  dateInputs.forEach((input) => {
    input.min = today;
  });

  const params = new URLSearchParams(window.location.search);
  const requestedService = params.get("service");
  const serviceSelect = document.querySelector('select[name="dentalProblem"]');

  if (requestedService && serviceSelect) {
    const matchingOption = [...serviceSelect.options].find((option) => option.value === requestedService);
    if (matchingOption) serviceSelect.value = requestedService;
  }
}

function initPasswordToggles() {
  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.closest(".password-field")?.querySelector("input");
      if (!input) return;

      const willShow = input.type === "password";
      input.type = willShow ? "text" : "password";
      button.textContent = willShow ? "Hide" : "Show";
      button.setAttribute("aria-label", willShow ? "Hide password" : "Show password");
    });
  });
}

function initAuthTabs() {
  const tabs = document.querySelectorAll("[data-auth-tab]");
  const panels = document.querySelectorAll("[data-auth-panel]");
  if (!tabs.length || !panels.length) return;

  const activate = (name) => {
    tabs.forEach((tab) => {
      const selected = tab.dataset.authTab === name;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });

    panels.forEach((panel) => {
      const selected = panel.dataset.authPanel === name;
      panel.classList.toggle("is-active", selected);
      panel.hidden = !selected;
    });
  };

  tabs.forEach((tab) => tab.addEventListener("click", () => activate(tab.dataset.authTab)));
}

function initForms() {
  const appointmentForm = document.querySelector("#appointmentForm");
  const contactForm = document.querySelector("#contactForm");
  const loginForm = document.querySelector("#loginForm");
  const signupForm = document.querySelector("#signupForm");

  appointmentForm?.addEventListener("submit", handleAppointment);
  contactForm?.addEventListener("submit", handleContact);
  loginForm?.addEventListener("submit", handleLogin);
  signupForm?.addEventListener("submit", handleSignup);
}

async function handleAppointment(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validateForm(form)) return;

  const payload = formToObject(form);
  const selectedDate = new Date(`${payload.preferredDate}T23:59:59`);
  if (selectedDate < new Date()) {
    setFormStatus(form, "Please select today or a future date.", "error");
    return;
  }

  await submitWithState(form, async () => {
    const user = auth.currentUser;

    await db.collection("appointments").add({
      ...payload,
      userId: user ? user.uid : null,
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    form.reset();
    initDateAndService();
    setFormStatus(form, "Appointment request submitted successfully.", "success");
    showToast("Appointment saved in Firebase. The clinic will contact you to confirm.");
  });
}

async function handleContact(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validateForm(form)) return;

  await submitWithState(form, async () => {
    await db.collection("contacts").add({
      ...formToObject(form),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    form.reset();
    setFormStatus(form, "Your message has been sent.", "success");
    showToast("Message saved in Firebase.");
  });
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validateForm(form)) return;

  const payload = formToObject(form);

  await submitWithState(form, async () => {
    const result = await auth.signInWithEmailAndPassword(payload.email, payload.password);
    const userDoc = await db.collection("users").doc(result.user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {
      uid: result.user.uid,
      name: result.user.email,
      email: result.user.email
    };

    saveSession({ user: userData });
    setFormStatus(form, "Login successful. Taking you to appointment booking...", "success");
    showToast(`Welcome back, ${userData.name || result.user.email}.`);
    window.setTimeout(() => window.location.assign("appointment.html"), 900);
  });
}

async function handleSignup(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validateForm(form)) return;

  const payload = formToObject(form);
  if (!/(?=.*[A-Za-z])(?=.*\d).{8,}/.test(payload.password)) {
    setFormStatus(form, "Password must contain at least one letter and one number.", "error");
    return;
  }

  await submitWithState(form, async () => {
    const result = await auth.createUserWithEmailAndPassword(payload.email, payload.password);
    const userData = {
      uid: result.user.uid,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("users").doc(result.user.uid).set(userData);
    saveSession({ user: { uid: result.user.uid, name: payload.name, phone: payload.phone, email: payload.email } });
    setFormStatus(form, "Account created. Taking you to appointment booking...", "success");
    showToast(`Welcome to RK Dental Clinic, ${payload.name}.`);
    window.setTimeout(() => window.location.assign("appointment.html"), 900);
  });
}

async function submitWithState(form, action) {
  const button = form.querySelector('button[type="submit"]');
  const originalText = button?.querySelector("span:first-child")?.textContent || "Submit";

  setFormStatus(form, "", "");
  if (button) {
    button.classList.add("is-loading");
    button.disabled = true;
    const text = button.querySelector("span:first-child");
    if (text) text.textContent = "Please wait";
  }

  try {
    await action();
  } catch (error) {
    const message = error.message || "Something went wrong. Please try again.";
    setFormStatus(form, message, "error");
    showToast(message, "error");
  } finally {
    if (button) {
      button.classList.remove("is-loading");
      button.disabled = false;
      const text = button.querySelector("span:first-child");
      if (text) text.textContent = originalText;
    }
  }
}

function validateForm(form) {
  if (form.checkValidity()) return true;
  form.reportValidity();
  setFormStatus(form, "Please complete all required fields correctly.", "error");
  return false;
}

function formToObject(form) {
  return Object.fromEntries(
    [...new FormData(form).entries()].map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
  );
}

function setFormStatus(form, message, type) {
  const status = form.querySelector(".form-status");
  if (!status) return;
  status.textContent = message;
  status.classList.remove("success", "error");
  if (type) status.classList.add(type);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {})
    }
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}.`);
    error.status = response.status;
    error.details = data.errors;
    throw error;
  }

  return data;
}

function saveSession(data) {
  localStorage.setItem("rk_user", JSON.stringify(data.user));
}

function initUserState() {
  let user;
  try {
    user = JSON.parse(localStorage.getItem("rk_user") || "null");
  } catch {
    user = null;
  }

  if (!user?.name) return;
  document.querySelectorAll('a[href="login.html"]').forEach((link) => {
    link.textContent = `Hi, ${user.name.split(" ")[0]}`;
    link.setAttribute("title", "Patient account is logged in");
  });

  const patientName = document.querySelector('input[name="patientName"]');
  const phone = document.querySelector('input[name="phone"]');
  const email = document.querySelector('input[name="email"]');
  if (patientName && !patientName.value) patientName.value = user.name || "";
  if (phone && !phone.value) phone.value = user.phone || "";
  if (email && !email.value) email.value = user.email || "";
}

function showToast(message, type = "success") {
  const region = document.querySelector(".toast-region");
  if (!region) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "error" : ""}`.trim();
  toast.textContent = message;
  region.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), 260);
  }, 4300);
}
