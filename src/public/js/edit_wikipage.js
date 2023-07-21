function initSave(fileName) {
  document.getElementById("save_to_file").addEventListener("click", () => {
    if (fileName === "") {
      fileName = window.prompt("Enter file name");
    }

    var infoboxFields = {};
    var infoboxInputs = document.querySelectorAll(".infobox-input");
    infoboxInputs.forEach(function (input) {
      var infoboxKey = input.getAttribute("infobox-key");
      if (input.value !== "") {
        infoboxFields[infoboxKey] = input.value;
      }
    });

    fetch(`/wiki/${fileName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: fileName,
        meta: {
          title: document.getElementById("heading_title_input").value,
          subtitle: document.getElementById("subtitle_input").value,
        },
        infobox: infoboxFields,
        content: {
          summary: document.getElementById("short_description_input").value,
          full: document.getElementById("content_input").value,
        },
      }),
    }).then(function (response) {
      if (response.ok) {
        window.location.href = `/wiki/${fileName}`;
      } else {
        throw new Error("Error: " + response.status);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  let textareaContent = document.getElementById("content_input");
  let textareaShort = document.getElementById("short_description_input");
  let outputDivContent = document.getElementById("content");
  let outputDivShort = document.getElementById("short_description");

  outputDivContent.innerHTML = marked.parse(textareaContent.value);
  outputDivShort.innerHTML = marked.parse(textareaShort.value);
  generateToc();

  textareaContent.addEventListener("input", function () {
    outputDivContent.innerHTML = marked.parse(textareaContent.value, {
      mangled: false,
    });
    generateToc();
  });

  textareaShort.addEventListener("input", function () {
    outputDivShort.innerHTML = marked.parse(textareaShort.value, {
      mangled: false,
    });
  });

  document
    .getElementById("heading_title_input")
    .addEventListener("input", function () {
      document.getElementById("heading-title").innerHTML = this.value;
    });
});
