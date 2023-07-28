function generateToc() {
  document.getElementById("toc").innerHTML = null;
  let search = "h1, h2, h3, h4, h5, h6";
  let article = document.getElementById("content");
  const headings = article.querySelectorAll(search);
  const toc = document.createElement("ul");
  let sectionCount = 1;
  let subSectionCount = 1;
  let subSubSectionCount = 1;
  let subSubSubSectionCount = 1;

  for (i = 0; i < headings.length; i++) {
    if (headings[i].tagName === "H1" || headings[i].tagName === "H2") {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.textContent = headings[i].textContent;
      link.href = `#${headings[i].id}`;
      li.appendChild(link);
      toc.appendChild(li);
      if (headings[i].tagName === "H1") {
        sectionCount++;
        subSectionCount = 1;
        subSubSectionCount = 1;
        subSubSubSectionCount = 1;
      } else if (headings[i].tagName === "H2") {
        subSectionCount++;
        subSubSectionCount = 1;
        subSubSubSectionCount = 1;
      }
    } else if (
      headings[i].tagName === "H3" ||
      headings[i].tagName === "H4" ||
      headings[i].tagName === "H5" ||
      headings[i].tagName === "H6"
    ) {
      const previousHeading = headings[i - 1];
      if (headings[i].tagName !== previousHeading.tagName) {
        const newOl = document.createElement("ul");
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.textContent = headings[i].textContent;
        link.href = `#${headings[i].id}`;
        li.appendChild(link);
        newOl.appendChild(li);
        if (headings[i].tagName === "H3") {
          toc.lastChild.appendChild(newOl);
          subSectionCount++;
          subSubSectionCount = 1;
          subSubSubSectionCount = 1;
        } else if (headings[i].tagName === "H4") {
          toc.lastChild.lastChild.appendChild(newOl);
          subSubSectionCount++;
          subSubSubSectionCount = 1;
        } else if (headings[i].tagName === "H5") {
          toc.lastChild.lastChild.lastChild.appendChild(newOl);
          subSubSubSectionCount++;
        } else if (headings[i].tagName === "H6") {
          toc.lastChild.lastChild.lastChild.lastChild.appendChild(newOl);
        }
      } else {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.textContent = headings[i].textContent;
        link.href = `#${headings[i].id}`;
        li.appendChild(link);
        if (headings[i].tagName === "H3") {
          toc.lastChild.lastChild.appendChild(li);
          subSectionCount++;
          subSubSectionCount = 1;
          subSubSubSectionCount = 1;
        } else if (headings[i].tagName === "H4") {
          toc.lastChild.lastChild.lastChild.appendChild(li);
          subSubSectionCount++;
          subSubSubSectionCount = 1;
        } else if (headings[i].tagName === "H5") {
          toc.lastChild.lastChild.lastChild.lastChild.appendChild(li);
          subSubSubSectionCount++;
        } else if (headings[i].tagName === "H6") {
          toc.lastChild.lastChild.lastChild.lastChild.lastChild.appendChild(li);
        }
      }
    }
  }

  if (toc.childElementCount === 0) {
    document.getElementById("toc").style.display = "none";
  }
  document.getElementById("toc").appendChild(toc);
}

// Animate infobox
document.addEventListener("DOMContentLoaded", function () {
  var infoboxGroups = document.querySelectorAll(".infobox-group");
  var animationDelay = 200;

  function addAnimation(element, index) {
    setTimeout(function () {
      element.classList.add("animate");
    }, index * animationDelay);
  }

  for (var i = 0; i < infoboxGroups.length; i++) {
    addAnimation(infoboxGroups[i], i);
  }
});

// Blur images
var shouldBlurImages = true;

if (shouldBlurImages) {
  const blurredImages = document.querySelectorAll("img");

  blurredImages.forEach((image) => {
    image.classList.add("blurred-image");

    image.addEventListener("click", () => {
      image.classList.toggle("blurred-image");
    });
  });
}

// Get all the gallery tabs
galleryTabs = document.querySelectorAll(".gallery-tab");

// Get all the gallery images
galleryImages = document.querySelectorAll(".infobox-img");

// Add click event listener to each gallery tab
galleryTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    // Remove 'active' class from all tabs and images
    galleryTabs.forEach((tab) => tab.classList.remove("active"));
    galleryImages.forEach((image) => image.classList.remove("active"));

    // Add 'active' class to the clicked tab and corresponding image
    tab.classList.add("active");
    galleryImages[index].classList.add("active");
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("loading").style.opacity = "0";
  document.getElementsByTagName("body")[0].style.overflowY = "scroll";

  const htmlTag = document.getElementsByTagName("html")[0];
  document.querySelectorAll(".theme-switch-item").forEach((item) => {
    item.addEventListener("click", () => {
      htmlTag.setAttribute("data-theme", item.innerText);
      localStorage.setItem("theme", item.innerText);
    });
  });

  htmlTag.setAttribute("data-theme", localStorage.getItem("theme") || "Dark");
});
