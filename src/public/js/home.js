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
