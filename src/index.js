const session = require("express-session");
const { randomBytes } = require("crypto");
const express = require("express");
const path = require("path");
const fs = require("fs");

const { loadEntries, getBirthdays } = require("./modules/util/entryUtil");
const {
  scanForFiles,
  findFile,
  sortImages,
  scanForImages,
} = require("./modules/util/fileUtil");
const { convertToMarkdown } = require("./modules/util/markdownUtil");
const settings = require("./settings");
const log = require("./modules/logger/logger");

log.info("Loading entries...");

let entries = loadEntries();

const app = express();

app.set("view engine", "pug");
app.set("views", `${__dirname}/views`);
app.use(express.static(`${__dirname}/public`));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use(
  session({
    secret: randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(`/api/auth`, require("./modules/auth/discord"));

app.use((req, res, next) => {
  if (!req.url.includes("api") && !req.session.user) {
    req.session.redirectTo = req.originalUrl;
    return res.render("login", {
      settings,
    });
  }

  return next();
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
    const fileName = file.split(settings.dataPathSplitter).pop().split(".")[0];
    pages[fileName] = require(file);
  });

  res.render("home", {
    settings,
    pages,
    birthdays: getBirthdays(),
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
  const foundImages = {};
  const foundInfoboxImages = {};

  const foundEntry = entries[file];

  if (
    !foundEntry ||
    (Object.keys(foundEntry).length === 1 && "backlinks" in foundEntry.meta)
  ) {
    res.render("404", {
      fileName: file,
      settings,
    });
    return;
  }

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
    file: foundEntry,
    fileName: file,
    infoboxImages: sortImages(foundInfoboxImages),
    images: sortImages(foundImages),

    infoboxtemplate: require(path.join(__dirname, "infobox.json")),
  });
});

app.get("/wiki/:file", (req, res) => {
  const { file } = req.params;
  const foundImages = {};
  const foundInfoboxImages = {};

  entries = loadEntries();

  const foundEntry = entries[file];

  if (
    !foundEntry ||
    (Object.keys(foundEntry).length === 1 && "backlinks" in foundEntry.meta)
  ) {
    res.render("404", {
      fileName: file,
      settings,
    });
    return;
  }

  if (fs.existsSync(path.join(settings.dataPath, "images", file, "main"))) {
    scanForImages(
      path.join(settings.dataPath, "images", file, "main"),
      foundInfoboxImages
    );
  }

  if (fs.existsSync(path.join(settings.dataPath, "images", file))) {
    scanForImages(path.join(settings.dataPath, "images", file), foundImages);
  }

  console.log(
    '🚀 ~ file: index.js:193 ~ app.get ~ fs.existsSync(path.join(settings.dataPath, "images", file)):',
    sortImages(foundInfoboxImages)
  );

  res.render("wikipage", {
    settings,
    file: convertToMarkdown(foundEntry),
    fileName: file,
    infoboxImages: sortImages(foundInfoboxImages),
    images: sortImages(foundImages),

    infoboxtemplate: require(path.join(__dirname, "infobox.json")),
  });
});

app.delete("/wiki/:file/image/:image", (req, res) => {
  const { file, image } = req.params;
  let foundInfoboxImage = {};

  const foundEntry = entries[file];

  if (!foundEntry) {
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

  const foundImage = path.join(
    settings.dataPath,
    "images",
    file,
    "main",
    foundInfoboxImage
  );

  if (!foundImage) {
    if (!res.headersSent) {
      res.status(404).send({
        status: `NOTE "${image}" NOT FOUND`,
      });
      return;
    }
  }

  fs.unlinkSync(foundImage);
  if (!res.headersSent) {
    res.status(200).send({
      status: "OK",
    });
  }
});

app.post("/wiki/:file/image/:image", (req, res) => {
  const { file, image } = req.params;
  const directoryPath = path.join(settings.dataPath, "images", file, "main");

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  fs.writeFile(
    path.join(directoryPath, image),
    Buffer.from(
      req.body.image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    ),
    (err) => {
      if (err) {
        if (!res.headersSent) {
          res.status(500).send({ status: "ERROR (CHECK SERVER CONSOLE)" });
        }

        log.error(err);
      }
    }
  );
  if (!res.headersSent) {
    res.status(200).send({ status: "OK" });
  }
});

app.get("/graph", (req, res) => {
  res.render("graph", {
    settings,
    entries: loadEntries(),
  });
});

app.get("/search", (req, res) => {
  const query = req.query.q;

  const found = Object.entries(entries).filter(([key, value]) => {
    console.log("🚀 ~ file: index.js:290 ~ found ~ value:", value);
    if (value.meta && value.meta.title) {
      if (value.meta.title.toLowerCase().includes(query.toLowerCase())) {
        return true;
      }
    }

    if (value.meta && value.meta.subtitle) {
      if (value.meta.subtitle.toLowerCase().includes(query.toLowerCase())) {
        return true;
      }
    }

    return false;
  });

  if (found.length === 0) {
    res.render("404", {
      settings,
    });
    return;
  }

  const result = Object.fromEntries(found);

  res.render("home", {
    settings,
    pages: result,
  });
});

getBirthdays();

// 404 for all other routes
app.get("*", (req, res) => {
  res.render("404", {
    settings,
  });
});

app.listen(settings.hostport, () => {
  log.info(`Done! App listening on ${settings.url()}`);
});
