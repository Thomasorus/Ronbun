function setThemeFromLocalStorage() {
  const theme = localStorage.getItem("sorus-theme");
  theme ? setTheme(theme) : setTheme("color")
}

function setTheme(theme) {
  localStorage.setItem("sorus-theme", theme);
  const body = document.querySelector("body")
  body.setAttribute('theme', theme)
  const radio = document.querySelectorAll(`input[name="theme"][value="${theme}"]`)[0]
  radio.checked = true
}

(function() {
  document.addEventListener("DOMContentLoaded", function() {
    setThemeFromLocalStorage()
    const radios = document.querySelectorAll(`input[name="theme"]`)
    radios.forEach((r) => {
      r.addEventListener('change', function() {
        setTheme(this.value)
      });
    });
  });
})();
