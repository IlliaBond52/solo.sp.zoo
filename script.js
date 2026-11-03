
"use strict";

const CONFIG = {
  API_URL: "/api/contact",
  OFERTEO_URL:
    "https://www.oferteo.pl/solo-sp-z-o-o/firma/5880905"
};


const preloader = document.getElementById("preloader");

window.addEventListener("load", () => {
  setTimeout(() => {
    preloader?.classList.add("hide");
  }, 400);
});


const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");

menuToggle?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("active");

  menuToggle.setAttribute(
    "aria-expanded",
    String(isOpen)
  );
});

nav?.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});



const header = document.getElementById("header");
const backToTop = document.getElementById("backToTop");

function handleScroll() {
  const position = window.scrollY;

  header?.classList.toggle("scrolled", position > 70);
  backToTop?.classList.toggle("show", position > 500);
}

window.addEventListener("scroll", handleScroll, {
  passive: true
});

handleScroll();


const animatedElements = document.querySelectorAll(
  ".stat, .service-card, .project, .benefit, " +
  ".review-card, .step, .about-grid, .calc-grid"
);

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12
    }
  );

  animatedElements.forEach(element => {
    element.classList.add("scroll-reveal");
    observer.observe(element);
  });
} else {
  animatedElements.forEach(element => {
    element.classList.add("visible");
  });
}



const repairType = document.getElementById("repairType");
const areaInput = document.getElementById("area");
const calcResult = document.getElementById("calcResult");
const sendEstimate = document.getElementById("sendEstimate");

function calculateEstimate() {
  const service = repairType.value;
  const area = Number(areaInput.value);

  calcResult.textContent = "Wycena indywidualna";

  if (area > 0 && area <= 10000) {
    calcResult.textContent =
      "Powierzchnia: " + area + " m²";
  }

  return {
    service,
    area: area > 0 && area <= 10000 ? area : null
  };
}

repairType.addEventListener("change", calculateEstimate);
areaInput.addEventListener("input", calculateEstimate);

sendEstimate.addEventListener("click", () => {
  const estimate = calculateEstimate();

  const message = document.getElementById("message");

  message.value =
    "Rodzaj usługi: " + estimate.service +
    "\nPowierzchnia: " +
    (estimate.area ? estimate.area + " m²" : "Do ustalenia");

  document.getElementById("contact").scrollIntoView({
    behavior: "smooth"
  });

  document.getElementById("name").focus({
    preventScroll: true
  });
});


const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");
const submitButton = document.getElementById("submitButton");

function showStatus(message, isError = false) {
  formStatus.textContent = message;
  formStatus.style.color = isError
    ? "#ff8b7b"
    : "#c6a36b";
}

contactForm.addEventListener("submit", async event => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();
  const consent = document.getElementById("consent").checked;

  if (!name || !phone) {
    showStatus(
      "Proszę uzupełnić imię i numer telefonu.",
      true
    );
    return;
  }

  if (!consent) {
    showStatus(
      "Proszę zaznaczyć wymagane pole zgody.",
      true
    );
    return;
  }

  const phoneClean = phone.replace(/[\s().-]/g, "");

  if (!/^\+?[0-9]{7,15}$/.test(phoneClean)) {
    showStatus(
      "Proszę podać prawidłowy numer telefonu.",
      true
    );
    return;
  }

  const payload = {
  name,
  phone,
  email,
  message,
  consent,
  company: "SOLO Sp. z o.o.",
  source: "Strona internetowa"
};


  if (!CONFIG.API_URL) {
    showStatus(
      "Formularz jest przygotowany. W celu wysłania zgłoszenia skonfiguruj serwer API lub skontaktuj się przez Oferteo.",
      true
    );

    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Wysyłanie...";

  try {
    const response = await fetch(CONFIG.API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
});

const result = await response.json();

if (!response.ok || !result.success) {
  throw new Error(result.message || "Błąd wysyłania");
}

    showStatus(
      "Dziękujemy! Twoje zapytanie zostało wysłane."
    );

    contactForm.reset();

  } catch (error) {
    showStatus(
      "Nie udało się wysłać formularza. Spróbuj ponownie lub skontaktuj się przez Oferteo.",
      true
    );

  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Wyślij zapytanie ↗";
  }
});


document.getElementById("year").textContent =
  new Date().getFullYear();


backToTop?.addEventListener("click", event => {
  event.preventDefault();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});


console.log("SOLO Sp. z o.o. — website initialized.");

fetch