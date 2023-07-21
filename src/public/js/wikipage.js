generateToc();

function initEditButton(fileName) {
  document.getElementById("edit_button").addEventListener("click", () => {
    document.location.href = `/wiki/${fileName}/edit`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const authenticityElements = document.querySelectorAll(".authenticity");

  authenticityElements.forEach((element) => {
    tippy(element, {
      content: element.getAttribute("tooltip"),
      theme: element.getAttribute("level"),
      allowHTML: true,
      interactive: true,
    });
  });
});
