function generateTable(pages, settings, url) {
  let tableData = [];

  for (const key in pages) {
    tableData.push({
      file: key,
      title: pages[key]["meta"]["title"],
      letters:
        pages[key]["content"]["summary"].length +
        pages[key]["content"]["full"].length,
      infobox: Object.keys(pages[key]["infobox"]).length,
    });
  }

  var table = new Tabulator("#table", {
    data: tableData,
    initialSort: [{ column: "title", dir: "asc" }],
    layout: "fitDataTable",
    columns: [
      {
        title: "File",
        field: "file",
        formatter: function (cell, formatterParams, onRendered) {
          var value = cell.getValue();
          var link = document.createElement("a");
          link.href = url + "/wiki/" + value;
          link.textContent = value;
          return link;
        },
      },
      {
        title: "Title",
        field: "title",
        formatter: function (cell, formatterParams, onRendered) {
          var value = cell.getValue();
          var link = document.createElement("a");
          link.href = url + "/wiki/" + cell.getRow().getData().file;
          link.textContent = value;
          return link;
        },
      },
      {
        title: "Letters",
        field: "letters",
        formatter: function (cell, formatterParams, onRendered) {
          var value = cell.getValue();
          var link = document.createElement("a");
          link.href = url + "/wiki/" + cell.getRow().getData().file;
          link.textContent = value;
          return link;
        },
      },
      {
        title: "Infobox",
        field: "infobox",
        formatter: function (cell, formatterParams, onRendered) {
          var value = cell.getValue();
          var link = document.createElement("a");
          link.href = url + "/wiki/" + cell.getRow().getData().file;
          link.textContent = value;
          return link;
        },
      },
    ],
  });
}

function displayBirthdays(birthdays) {
  let panels = [];

  for (const name in birthdays) {
    if (Object.hasOwnProperty.call(birthdays, name)) {
      const birthday = birthdays[name];

      let panel = document.createElement("div");
      panel.classList.add("home-panel");

      let panelTitle = document.createElement("h5");
      panelTitle.textContent = name;
      panel.appendChild(panelTitle);

      let panelDescription = document.createElement("p");
      panelDescription.textContent = birthday;
      panel.appendChild(panelDescription);

      panels.push(panel);
    }
  }

  panels.forEach((panel) => {
    document.getElementById("birthdays").appendChild(panel);
  });
}
