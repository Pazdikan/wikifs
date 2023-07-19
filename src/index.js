const settings = require("./settings");
const { marked } = require("marked");
const express = require("express");
const path = require("path");
const fs = require("fs");
const { gfmHeadingId } = require("marked-gfm-heading-id");
const session = require("express-session");
const { randomBytes } = require("crypto");

const app = express();

marked.use(gfmHeadingId());

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));
app.use(express.json());

app.use(
  session({
    secret: randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: true,
  })
);

app.use("/api/" + "auth", require("./auth/discord"));

app.use((req, res, next) => {
  if (!req.url.includes("api") && !req.session.user) {
    req.session.redirectTo = req.originalUrl;
    return res.redirect("/api/auth/discord");
  }

  next();
});

app.get("/", (req, res) => {
  res.render("home.ejs", {
    settings,
  });
});

app.get("/new", (req, res) => {
  res.render("edit_wikipage.ejs", {
    settings,
    fileName: "",
    infoboxImages: {},
    file: {
      meta: {
        title: "",
        subtitle: "",
      },
      infobox: {},
      content: {
        summary: "",
        full: "",
      },
    },
    infoboxtemplate: require(path.join(__dirname, "infobox.json")),
  });
});

app.post("/wiki/:file", (req, res) => {
  let found = [];
  let body = req.body;
  let file = body.fileName;
  console.log("🚀 ~ file: index.js:45 ~ app.post ~ body:", body);

  found = scanForFiles(settings.dataPath, ".json");

  let foundFile = findFile(file, found);

  if (foundFile === "") {
    fs.writeFileSync(
      path.join(settings.dataPath, file + ".json"),
      JSON.stringify(body, null, 2)
    );
    return res.status(200).json({
      status: "OK",
    });
  }

  fs.writeFileSync(foundFile, JSON.stringify(body, null, 2));

  return res.status(200).json({
    status: "OK",
  });
});

app.get("/wiki/:file/edit", (req, res) => {
  const file = req.params.file;
  let found = [];
  let foundImages = {};
  let foundInfoboxImages = {};

  found = scanForFiles(settings.dataPath, ".json");

  let foundFile = findFile(file, found);

  if (foundFile === "") {
    res.render("404.ejs", {
      fileName: file,
      settings,
    });
    return;
  }

  let foundObject = require(foundFile);

  if (fs.existsSync(path.join(settings.dataPath, "images", file, "main")))
    scanForImages(
      path.join(settings.dataPath, "images", file, "main"),
      foundInfoboxImages
    );

  if (fs.existsSync(path.join(settings.dataPath, "images", file)))
    scanForImages(path.join(settings.dataPath, "images", file), foundImages);

  res.render("edit_wikipage.ejs", {
    settings,
    file: foundObject,
    fileName: file,
    infoboxImages: foundInfoboxImages,
    images: foundImages,

    infoboxtemplate: require(path.join(__dirname, "infobox.json")),
  });

  delete require.cache[require.resolve(foundFile)];
  return;
});

app.get("/wiki/:file", (req, res) => {
  const file = req.params.file;
  let found = [];
  let foundImages = {};
  let foundInfoboxImages = {};

  found = scanForFiles(settings.dataPath, ".json");

  let foundFile = findFile(file, found);

  if (foundFile === "") {
    res.render("404.ejs", {
      fileName: file,
      settings,
    });
    return;
  }

  let foundObject = require(foundFile);
  convertToMarkdown(foundObject);

  if (fs.existsSync(path.join(settings.dataPath, "images", file, "main")))
    scanForImages(
      path.join(settings.dataPath, "images", file, "main"),
      foundInfoboxImages
    );

  if (fs.existsSync(path.join(settings.dataPath, "images", file)))
    scanForImages(path.join(settings.dataPath, "images", file), foundImages);

  res.render("wikipage.ejs", {
    settings,
    file: foundObject,
    fileName: file,
    infoboxImages: foundInfoboxImages,
    images: foundImages,

    infoboxtemplate: require(path.join(__dirname, "infobox.json")),
  });

  delete require.cache[require.resolve(foundFile)];
  return;
});

// 404 for all other routes
app.get("*", (req, res) => {
  res.render("404.ejs", {
    settings,
  });
});

app.listen(3000, () => {
  console.log("Example app listening on " + settings.url());
});
/**
 * Scans a directory for files with a specific extension and adds their paths to a JSON array.
 *
 * @param {string} directory - The directory to scan for files.
 * @param {string} extension - The extension of files to search for.
 * @param {array} jsonData - The JSON array to store the paths of files found.
 */
function scanForFiles(directory, extension) {
  let jsonData = [];
  const files = fs.readdirSync(directory);

  files.forEach((filename) => {
    const filePath = path.join(directory, filename);
    const fileStat = fs.statSync(filePath);

    if (!fileStat.isDirectory()) {
      if (path.extname(filePath) === extension) {
        jsonData.push(filePath);
      }
    } else {
      scanForFiles(filePath, extension, jsonData);
    }
  });

  return jsonData;
}

/**
 * Scans a given directory for images and adds them to a JSON object.
 *
 * @param {string} directory - The directory to scan for images.
 * @param {object} jsonData - The JSON object to add the images to.
 */
function scanForImages(directory, jsonData) {
  const files = fs.readdirSync(directory);

  files.forEach((filename) => {
    const filePath = path.join(directory, filename);
    const fileStat = fs.statSync(filePath);

    if (!fileStat.isDirectory()) {
      if (
        path.extname(filePath) === ".png" ||
        path.extname(filePath) === ".jpg" ||
        path.extname(filePath) === ".jpeg"
      ) {
        const nameWithoutExtension = path.parse(filename).name;
        const imageBytes = fs.readFileSync(filePath, "base64");

        jsonData[nameWithoutExtension] = `data:image/${path
          .extname(filePath)
          .substring(1)};base64,${imageBytes}`;
      }
    } else {
      scanForImages(filePath, jsonData);
    }
  });
}

/**
 * Converts the given object to markdown format.
 *
 * @param {object} obj - The object to be converted to markdown.
 */
function convertToMarkdown(obj) {
  const renderer = new marked.Renderer();
  renderer.paragraph = (text) => text;

  for (let key in obj) {
    if (typeof obj[key] === "string") {
      let before = obj[key];
      before = convertFileLinks(before);

      obj[key] = marked.parse(before, {
        renderer,
        mangle: false,
      });
    } else if (typeof obj[key] === "object") {
      convertToMarkdown(obj[key]);
    }
  }
}

/**
 * Finds a file with the specified name in an array of paths.
 *
 * @param {string} fileName - The name of the file to find.
 * @param {Array<string>} arrayOfPaths - An array of paths to search for the file.
 * @return {string} The path of the file if found, or an empty string if not found.
 */
function findFile(fileName, arrayOfPaths) {
  let toReturn = "";

  arrayOfPaths.forEach((e) => {
    let currentFileName = e.split("\\")[e.split("\\").length - 1];

    if (
      currentFileName.toLowerCase().replace(".json", "") ===
      fileName.toLowerCase()
    ) {
      toReturn = e;
      return;
    }
  });

  return toReturn;
}

/**
 * Replaces file links in the given text with HTML anchor tags.
 *
 * @param {string} text - The text to search for file links.
 * @return {string} The text with file links replaced by HTML anchor tags.
 */
function convertFileLinks(text) {
  const fileLinkRegex = /\[\[([^|\]]+?)(\|([^|\]]+))?\]\]/g;
  return text.replace(fileLinkRegex, (_, fileName, __, customName) => {
    const linkText = customName || fileName;

    return `<a href="${settings["url"]()}/wiki/${fileName}">${linkText}</a>`;
  });
}
