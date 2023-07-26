const { marked } = require("marked");
const express = require("express");
const path = require("path");
const fs = require("fs");
const { gfmHeadingId } = require("marked-gfm-heading-id");
const session = require("express-session");
const { randomBytes } = require("crypto");
const settings = require("./settings");
const log = require("./modules/logger/logger");

const app = express();

marked.use(gfmHeadingId());

app.set("view engine", "pug");
app.set("views", `${__dirname}/views`);
app.use(express.static(`${__dirname}/public`));
app.use(express.json());

app.use(
  session({
    secret: randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: true,
  })
);

app.use("/api/" + "auth", require("./modules/auth/discord"));

app.use((req, res, next) => {
  if (!req.url.includes("api") && !req.session.user) {
    req.session.redirectTo = req.originalUrl;
    return res.render("login", {
      settings,
    });
  }

  next();
});

app.use((req, res, next) => {
  if (!req.url.includes(".js") && !req.url.includes(".css")) {
    log.http(`${req.method} ${req.url} from ${req.ip}`);
  }

  next();
});

app.get("/", (req, res) => {
  const found = scanForFiles(settings.dataPath, ".json");
  const pages = {};

  found.forEach((file) => {
    const fileName = file
      .split(settings["dataPathSplitter"])
      .pop()
      .split(".")[0];
    pages[fileName] = require(file);
  });

  res.render("home", {
    settings,
    pages,
  });
});

app.get("/new", (req, res) => {
  res.render("edit_wikipage", {
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
  const { body } = req;
  const file = body.fileName;

  found = scanForFiles(settings.dataPath, ".json");

  const foundFile = findFile(file, found);

  if (foundFile === "") {
    fs.writeFileSync(
      path.join(settings.dataPath, `${file}.json`),
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
  const { file } = req.params;
  let found = [];
  const foundImages = {};
  const foundInfoboxImages = {};

  found = scanForFiles(settings.dataPath, ".json");

  const foundFile = findFile(file, found);

  if (foundFile === "") {
    res.render("404", {
      fileName: file,
      settings,
    });
    return;
  }

  const foundObject = require(foundFile);

  if (fs.existsSync(path.join(settings.dataPath, "images", file, "main"))) {
    scanForImages(
      path.join(settings.dataPath, "images", file, "main"),
      foundInfoboxImages
    );
  }

  if (fs.existsSync(path.join(settings.dataPath, "images", file))) {
    scanForImages(path.join(settings.dataPath, "images", file), foundImages);
  }

  res.render("edit_wikipage", {
    settings,
    file: foundObject,
    fileName: file,
    infoboxImages: foundInfoboxImages,
    images: foundImages,

    infoboxtemplate: require(path.join(__dirname, "infobox.json")),
  });

  delete require.cache[require.resolve(foundFile)];
});

app.get("/wiki/:file", (req, res) => {
  const { file } = req.params;
  let found = [];
  const foundImages = {};
  const foundInfoboxImages = {};

  found = scanForFiles(settings.dataPath, ".json");

  const foundFile = findFile(file, found);

  if (foundFile === "") {
    res.render("404", {
      fileName: file,
      settings,
    });
    return;
  }

  const foundObject = require(foundFile);
  convertToMarkdown(foundObject);

  if (fs.existsSync(path.join(settings.dataPath, "images", file, "main"))) {
    scanForImages(
      path.join(settings.dataPath, "images", file, "main"),
      foundInfoboxImages
    );
  }

  if (fs.existsSync(path.join(settings.dataPath, "images", file))) {
    scanForImages(path.join(settings.dataPath, "images", file), foundImages);
  }

  res.render("wikipage", {
    settings,
    file: foundObject,
    fileName: file,
    infoboxImages: foundInfoboxImages,
    images: foundImages,

    infoboxtemplate: require(path.join(__dirname, "infobox.json")),
  });

  delete require.cache[require.resolve(foundFile)];
});

app.delete("/wiki/:file/image/:image", (req, res) => {
  const { file, image } = req.params;
  let found = [];
  const foundImages = {};
  let foundInfoboxImage = {};

  found = scanForFiles(settings.dataPath, ".json");

  const foundFile = findFile(file, found);

  if (foundFile === "") {
    res.status(404).send({
      status: `NOTE "${file}" NOT FOUND`,
    });
    return;
  }

  if (fs.existsSync(path.join(settings.dataPath, "images", file, "main"))) {
    foundInfoboxImage = findFile(
      image,
      fs.readdirSync(path.join(settings.dataPath, "images", file, "main"))
    );
  }

  let foundImage = path.join(
    settings.dataPath,
    "images",
    file,
    "main",
    foundInfoboxImage
  );

  if (!foundImage) {
    res.status(404).send({
      status: `NOTE "${image}" NOT FOUND`,
    });
    return;
  }

  fs.unlinkSync(foundImage);
});

app.post("/wiki/:file/image/:image", (req, res) => {
  const { file, image } = req.params;

  fs.writeFile(
    path.join(settings.dataPath, "images", file, "main", image),
    new Buffer.from(
      req.body.image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    ),
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
});

// 404 for all other routes
app.get("*", (req, res) => {
  res.render("404", {
    settings,
  });
});

app.listen(settings["hostport"], () => {
  log.info(`App listening on ${settings.url()}`);
});
/**
 * Scans a directory for files with a specific extension and adds their paths to a JSON array.
 *
 * @param {string} directory - The directory to scan for files.
 * @param {string} extension - The extension of files to search for.
 * @param {array} jsonData - The JSON array to store the paths of files found.
 */
function scanForFiles(directory, extension) {
  const jsonData = [];
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

  for (const key in obj) {
    if (typeof obj[key] === "string") {
      let before = obj[key];
      before = convertFileLinks(before);
      before = handleCustomStuff(before);

      const dateRegex =
        /(\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s\d{1,2},\s\d{4}\b)/g;

      switch (key) {
        case "date_of_birth":
          before = before.replace(dateRegex, (match) => {
            const age = calculateAge(match);
            return `${match} <small>(age ${age})</small>`;
          });
          break;
        case "date_of_death":
          break;

        case "first_met":
          before = before.replace(dateRegex, (match) => {
            const timeAgo = calculateTimeAgo(match);
            return `${match} <small>(${timeAgo})</small>`;
          });
          break;
      }

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
    const currentFileName = e.split(settings["dataPathSplitter"])[
      e.split(settings["dataPathSplitter"]).length - 1
    ];

    if (
      currentFileName.toLowerCase().split(".")[0] === fileName.toLowerCase()
    ) {
      toReturn = e;
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

    return `<a href="${settings.url()}/wiki/${fileName}">${linkText}</a>`;
  });
}

/**
 * Replaces "custom stuff" in the given text with processed values.
 *
 * @param {string} text - The text containing custom stuff.
 * @return {string} The text with custom stuff replaced.
 */
function handleCustomStuff(text) {
  const customStuffRegex = /\{\{(.*?)\}\}/g;
  return text.replace(customStuffRegex, (_, match) => {
    const parts = match.split("|");
    const type = parts[1];

    switch (type) {
      case "authenticity":
        const level = parseInt(parts[2]);
        let explanation = parts[3];
        let confidence = "";

        switch (level) {
          case 0:
            confidence = "Unsure";
            break;
          case 1:
            confidence = "Likely correct";
            break;
          case 2:
            confidence = "Confirmed";

          default:
            break;
        }

        explanation = explanation.replace(
          /\[([^\]]+)\]\(([^\)]+)\)/g,
          "<a href='$2'>$1</a>"
        );

        return `<span class="authenticity authenticity-${level}" tooltip="<b>${confidence}:</b> ${
          explanation || "N/A"
        }" level="${level}">${parts[0]}</span>`;

      default:
        return match; // Return the original match if the type is not recognized
    }
  });
}

/**
 * Calculates the age based on the given date of birth.
 *
 * @param {string} dateOfBirth - The date of birth in the format 'YYYY-MM-DD'.
 * @return {number} The calculated age.
 */
function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Calculates the dynamic time ago representation based on the given date of birth.
 *
 * @param {string} dateFromThePast - The date of birth in the format 'YYYY-MM-DD'.
 * @return {string} The dynamic age representation.
 */
function calculateTimeAgo(dateFromThePast) {
  const dob = new Date(dateFromThePast);
  const today = new Date();

  // Calculate the time difference in milliseconds
  const timeDiff = today.getTime() - dob.getTime();

  // Calculate the time difference in days, months, and years
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
  const monthsDiff =
    today.getMonth() -
    dob.getMonth() +
    12 * (today.getFullYear() - dob.getFullYear());
  const yearsDiff = today.getFullYear() - dob.getFullYear();

  if (daysDiff === 1) {
    return "1 day ago";
  } else if (daysDiff > 1 && daysDiff < 30) {
    return `${daysDiff} days ago`;
  } else if (monthsDiff === 1) {
    return "1 month ago";
  } else if (monthsDiff > 1 && monthsDiff < 12) {
    return `${monthsDiff} months ago`;
  } else if (yearsDiff === 1) {
    return "1 year ago";
  } else {
    return `${yearsDiff} years ago`;
  }
}
