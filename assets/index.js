   // Check for input required and adds text in the label
   const allRequired = document.querySelectorAll("input[required]")
   allRequired.forEach(el => {
       const id = el.getAttribute('id');
       const label = document.querySelector(`label[for="${id}"`)
       const text = `<span class="required">&nbsp;(Required)</span>`
       label.insertAdjacentHTML("beforeend", text)
   });

   // Check for aria invalid and add error message
   const allAriaInvalid = document.querySelectorAll(`input[aria-invalid="true"]`)
   allAriaInvalid.forEach(el => {
       const id = el.getAttribute('id')
       const errorId = id + "-error"
       const infoID = id + "-info"
       const errorMessage = document.querySelector(`div[id="${errorId}"]`)
       errorMessage.removeAttribute("hidden")
       const existingIds = el.getAttribute('aria-describedby')
       el.setAttribute("aria-describedby", existingIds + " " + errorId)

   });

   // Checks for collapse component
   const triggers = document.querySelectorAll('.collapse [data-trigger="true"]');
   triggers.forEach(el => {
       const tagName = el.tagName
       const dataAttributes = el.dataset
       let attrString = ""
       Object
           .keys(dataAttributes)
           .map(key => {
               if (key !== "trigger") {
                   attrString += ` data-${key} `
               }
           });
       el.innerHTML = `
<button aria-expanded="false" ${attrString}>${el.textContent}</button>`;
       const getContent = (elem) => {
           let elems = [];
           //Put siblings inside an array if they don't are a data trigger
           while (elem.nextElementSibling && elem.nextElementSibling.tagName !== tagName) {
               elems.push(elem.nextElementSibling);
               elem = elem.nextElementSibling;
           }
           // Delete the old versions of the content nodes
           elems.forEach((node) => {
               node
                   .parentNode
                   .removeChild(node);
           })
           return elems;
       }
       let contents = getContent(el);

       let wrapper = document.createElement('div');
       wrapper.hidden = true;
       wrapper.setAttribute("class", "flow accessibility-menu")

       // Add each element of `contents` to `wrapper`
       contents.forEach(node => {
           wrapper.appendChild(node);
       })

       // Add the wrapped content back into the DOM after the trigger
       el
           .parentNode
           .insertBefore(wrapper, el.nextElementSibling);

       // Assign the button
       let btn = el.querySelector('button');

       btn.onclick = () => {
           // Cast the state as a boolean
           let expanded = btn.getAttribute('aria-expanded') === 'true';
           // Switch the state
           btn.setAttribute('aria-expanded', !expanded);
           // Switch the content's visibility
           wrapper.hidden = expanded;
       }
   })

   function changeFont(el) {
       const font = el.dataset.font;
       let body = document.querySelector("body")
       if (font === "inter") {
        body.setAttribute('font-style', "")
           localStorage.setItem("sorus-style", null);
       } else {
        body.setAttribute('font-style', font)
           localStorage.setItem("sorus-style", font);
       }
   }

   function changeFontSize(el) {
       const action = el.dataset.resize;
       let root = document.querySelector("body"),
           style = window
               .getComputedStyle(root, null)
               .getPropertyValue('font-size'),
           fontSize = parseFloat(style);
       if (action === "+") {
           let size = (fontSize * 1.25) + "px";
           root.style.fontSize = size
           localStorage.setItem("sorus-size", size);
       } else {
           let size = (fontSize / 1.25) + "px";
           root.style.fontSize = size
           localStorage.setItem("sorus-size", size);
       }
   }

   function changeColors(el) {
       const body = document.querySelector("body")
       const currentTheme = body.getAttribute('theme')
       const newTheme = el.getAttribute("id")
       body.setAttribute("theme", newTheme)
       localStorage.setItem("sorus-theme", newTheme);
   }

   function changeAnimations(el) {
       const anim = el.dataset.anim;
       let body = document.querySelector("body")
       body.setAttribute('anim', anim)
       localStorage.setItem("sorus-anim", anim);
   }

   function setThemeFromLocalStorage() {
       const body = document.querySelector("body")

       const theme = localStorage.getItem("sorus-theme");
       theme
           ? body.setAttribute('theme', theme)
           : ''

       const anim = localStorage.getItem("sorus-anim");
       anim
           ? body.setAttribute('anim', anim)
           : ''

       const size = localStorage.getItem("sorus-size");
       size
           ? body.style.fontSize = size
           : ''

       const style = localStorage.getItem("sorus-style");
       style
           ? body.setAttribute('font-style', style)
           : ''
   }(function () {
       document.addEventListener("DOMContentLoaded", function () {
           setThemeFromLocalStorage()
       });

   })();