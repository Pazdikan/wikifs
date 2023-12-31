const marked = require("marked");
const { gfmHeadingId } = require("marked-gfm-heading-id");
const lodash = require("lodash");
const moment = require("moment");

const { calculateAge } = require("./mathUtil");
const settings = require("../../settings");

marked.use(gfmHeadingId());

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
        const level = parseInt(parts[2], 10);
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
            break;
          default:
            break;
        }

        explanation = explanation.replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
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
 * Converts the given object to markdown format.
 *
 * @param {object} obj - The object to be converted to markdown.
 */
function convertToMarkdown(obj) {
  const rendered = lodash.cloneDeep(obj);
  const renderer = new marked.Renderer();
  renderer.paragraph = (text) => text;

  Object.entries(rendered).forEach(([key, value]) => {
    if (typeof value === "string") {
      let before = value;
      before = convertFileLinks(before);
      before = handleCustomStuff(before);

      const dateFormats = [
        /\b\d{4}-\d{2}-\d{2}\b/g,
        /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s\d{1,2},\s\d{4}\b/g,
      ];

      switch (key) {
        case "date_of_birth":
          dateFormats.forEach((dateRegex) => {
            before = before.replace(dateRegex, (match) => {
              const formattedDate = moment(match).format("YYYY-MM-DD");
              const age = calculateAge(match);
              return `${formattedDate} <small>(age ${age})</small>`;
            });
          });
          break;
        case "date_of_death":
          break;
        case "first_met":
          dateFormats.forEach((dateRegex) => {
            before = before.replace(dateRegex, (match) => {
              const formattedDate = moment(match).format("YYYY-MM-DD");
              const timeAgo = moment(match).fromNow();
              return `${formattedDate} <small>(${timeAgo})</small>`;
            });
          });
          break;
        case "home":
          const addressRegex = /((?:\w+ )+\d+,\s[\w\s]+(?:\s<[^>]+>)?)/g;
          const googleMapsUrl =
            "https://www.google.com/maps/search/?api=1&query=";

          before = before.replace(
            addressRegex,
            (match, address) =>
              `<a href="${googleMapsUrl}${encodeURIComponent(
                address
              )}">${match}</a>`
          );
          break;
        default:
          break;
      }

      rendered[key] = marked.parse(before, {
        renderer,
        mangle: false,
      });
    } else if (typeof value === "object") {
      rendered[key] = convertToMarkdown(value);
    }
  });

  return rendered;
}

module.exports = {
  convertToMarkdown,
  convertFileLinks,
  handleCustomStuff,
};
