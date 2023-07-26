let currentFileName = "";

function initSave(fileName) {
  currentFileName = fileName;

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

let uploadedPhotos = {};

document.getElementById("manage_images").addEventListener("click", () => {
  Swal.fire({
    title: "Warning!",
    text: "If you changed any values here, please save the file before proceeding. Otherwise all changes will be lost.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Continue",
    cancelButtonText: "Dismiss",
  }).then((result) => {
    if (result.isConfirmed) {
      // Function to display the photo upload popup
      function showPhotoUploadPopup() {
        // Create an HTML element to hold the uploaded photos
        const uploadedPhotosContainer = document.createElement("div");

        // Iterate through the uploaded photos and create an HTML element for each photo

        for (const photo in uploadedPhotos) {
          if (Object.hasOwnProperty.call(uploadedPhotos, photo)) {
            const image = uploadedPhotos[photo];
            const photoElement = document.createElement("div");
            photoElement.textContent = photo;

            // Add a delete button for each photo
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => {
              // Call a function to delete the photo
              deletePhoto(photo);
            });

            photoElement.appendChild(deleteButton);
            uploadedPhotosContainer.appendChild(photoElement);
          }
        }

        const fileSelector = document.createElement("input");
        fileSelector.type = "file";
        fileSelector.id = "file_to_upload";

        const selectedFileName = document.createElement("input");
        selectedFileName.type = "text";
        selectedFileName.id = "filename_to_upload";
        selectedFileName.placeholder = "Enter file name with extension here";

        uploadedPhotosContainer.appendChild(fileSelector);
        uploadedPhotosContainer.appendChild(selectedFileName);

        // Create the SweetAlert2 popup
        Swal.fire({
          title: "Uploaded Photos",
          html: uploadedPhotosContainer,
          showCancelButton: true,
          confirmButtonText: "Upload",
          cancelButtonText: "Close",
        }).then((result) => {
          if (result.isConfirmed) {
            handlePhotoUpload(fileSelector.files[0], selectedFileName.value);
          }
        });
      }

      // Example function to handle photo upload
      function handlePhotoUpload(file, name) {
        if (!file) {
          return;
        }

        const reader = new FileReader();
        let base64Image;

        reader.onloadend = function () {
          base64Image = reader.result;

          fetch(`/wiki/${currentFileName}/image/${name}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image: base64Image,
            }),
          }).then(function (response) {
            if (response.ok) {
              window.location.href = `/wiki/${currentFileName}`;
            } else {
              Swal.fire({
                icon: "error",
                title: "Error",
                text: `Error: ${response.status}`,
              });

              throw new Error("Error: " + response.status);
            }
          });
        };

        reader.readAsDataURL(file);
      }

      // Example function to delete a photo
      function deletePhoto(photoId) {
        fetch(`/wiki/${currentFileName}/image/${photoId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }).then(function (response) {
          if (response.ok) {
            window.location.href = `/wiki/${currentFileName}`;
          } else {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: `Error: ${response.status}`,
            });

            throw new Error("Error: " + response.status);
          }
        });
      }

      showPhotoUploadPopup();
    }
  });
});

function getUploadedPhotos(photos) {
  uploadedPhotos = JSON.parse(photos);
}
