const fs = require("fs");
const path = require("path");

const settings = require("../../settings");

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
 * Sorts an object of images based on numeric keys in descending order.
 *
 * @param {Object} obj - The object containing images with numeric keys.
 * @returns {Array} An array of objects representing the sorted images.
 */
function sortImages(obj) {
  let keys = Object.keys(obj);
  let strings = [];
  let numbers = [];

  keys.forEach((key) => {
    if (!isNaN(key)) {
      numbers.push(key);
    } else {
      strings.push(key);
    }
  });

  numbers = numbers.map((key) => {
    return parseInt(key);
  });

  numbers.sort((a, b) => {
    return b - a;
  });

  const sorted = [];
  numbers.forEach((key) => {
    sorted.push({ [key.toString()]: obj[key.toString()] });
  });

  strings.forEach((key) => {
    sorted.push({ [key.toString()]: obj[key.toString()] });
  });

  return sorted;
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
    const currentFileName = e.split(settings.dataPathSplitter)[
      e.split(settings.dataPathSplitter).length - 1
    ];

    if (
      currentFileName.toLowerCase().split(".")[0] === fileName.toLowerCase()
    ) {
      toReturn = e;
    }
  });

  return toReturn;
}

module.exports = {
  scanForFiles,
  scanForImages,
  findFile,
  sortImages,
};
