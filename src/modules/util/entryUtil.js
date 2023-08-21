const { scanForFiles } = require("./fileUtil");
const settings = require("../../settings");

/**
 * Extracts links from a given text.
 *
 * @param {string} text - The text to search for links.
 * @return {Array} An array containing the extracted links.
 */
function extractLinks(text) {
  const regex = /\[\[(.*?)\]\]/g;
  const matches = text.match(regex);

  if (matches) {
    return matches.map((match) => match.slice(2, -2)); // Remove the double brackets
  }

  return [];
}

/**
 * Retrieves the backlinks for a given entry.
 *
 * @param {Object} entry - The entry for which to retrieve the backlinks.
 * @return {Object} The backlinks for the given entry.
 */
function getLinks(entry) {
  return extractLinks(JSON.stringify(entry));
}

/**
 * Loads entries from files and generates a response object with backlinks.
 *
 * @return {Object} The response object containing the loaded entries and their backlinks.
 */
function loadEntries() {
  const response = {};
  const backlinks = {};

  const files = scanForFiles(settings.dataPath, ".json");
  files.forEach((file) => {
    const fileName = file.split(settings.dataPathSplitter).pop().split(".")[0];

    const entry = require(file);
    delete require.cache[require.resolve(file)];

    const links = getLinks(entry);

    // For each link in the entry, update the backlinks object
    links.forEach((link) => {
      if (!backlinks[link]) {
        backlinks[link] = []; // Initialize the array if it doesn't exist
      }
      backlinks[link].push(fileName); // Add the current entry as a backlink
    });

    entry.meta = {
      ...(entry.meta || {}),
      backlinks: backlinks[fileName] || [], // Initialize with an empty array if no backlinks
    };

    response[fileName] = entry;
  });

  Object.keys(backlinks).forEach((fileName) => {
    if (!response[fileName]) {
      response[fileName] = {};
    }

    response[fileName].meta = {
      ...(response[fileName].meta || {}),
      backlinks: backlinks[fileName],
    };
  });

  return response;
}

module.exports = {
  getLinks,
  loadEntries,
};
