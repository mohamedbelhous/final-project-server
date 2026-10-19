const fs = require("fs");
const path = require("path");

const inputFile = path.join(__dirname, "destinationDetailsData.js");

const outputFile = path.join(
  __dirname,
  "destinationDetailsData-unsplash-ready.js",
);

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

const escapeString = (value) => {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, " ")
    .trim();
};

const makeQuery = (...parts) => {
  return parts
    .filter(Boolean)
    .map((part) => String(part).trim())
    .filter(Boolean)
    .join(" ");
};

// ---------------------------------------------------------
// 1. Read source file
// ---------------------------------------------------------

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Source file not found: ${inputFile}`);
  process.exit(1);
}

let content = fs.readFileSync(inputFile, "utf8");

// ---------------------------------------------------------
// 2. Add destination imageQuery
// ---------------------------------------------------------

content = content.replace(
  /(\n\s*name:\s*"([^"]+)",)/g,
  (match, nameLine, name) => {
    return `${nameLine}
    imageQuery: "${escapeString(name)} Algeria",`;
  },
);

// Prevent duplicate imageQuery fields
content = content.replace(
  /(\n\s*imageQuery:\s*"[^"]+",)\n\s*imageQuery:\s*"[^"]+",/g,
  "$1",
);

// ---------------------------------------------------------
// 3. Add galleryQueries
// ---------------------------------------------------------
//
// Add galleryQueries to destination objects only.
// We detect a destination by its top-level `name` +
// `imageQuery` + `location` structure.
//
// Activity/attraction imageQuery fields are ignored.
// ---------------------------------------------------------

// Remove any old generated galleryQueries.
content = content.replace(/\n\s*galleryQueries:\s*\[[\s\S]*?\n\s*\],/g, "");

// Add galleryQueries after destination-level imageQuery.
//
// Important:
// We use the destination name directly from the object
// instead of trying to infer it from another match.
content = content.replace(
  /(\n\s*name:\s*"([^"]+)",\s*\n\s*imageQuery:\s*"([^"]+)",)(\s*\n\s*location:)/g,
  (match, destinationHeader, destinationName, imageQuery, locationLine) => {
    const cleanName = escapeString(destinationName);

    return `${destinationHeader}
    galleryQueries: [
      "${cleanName} Algeria",
      "${cleanName} Algeria landscape",
      "${cleanName} Algeria travel",
      "${cleanName} Algeria nature"
    ],${locationLine}`;
  },
);
// ---------------------------------------------------------
// 4. Add imageQuery to activities
// ---------------------------------------------------------
//
// Expected structure:
//
// activities: [
//   {
//     title: "...",
//     duration: "...",
//     price: "..."
//   }
// ]
//
// We intentionally target the "activities" section only.
// This prevents accommodation objects from receiving
// activity imageQuery values.
// ---------------------------------------------------------

const addActivityQueries = (text) => {
  return text.replace(
    /activities:\s*\[([\s\S]*?)\n\s*\],\s*\n\s*attractions:/g,
    (match, activitiesBody) => {
      const updatedActivities = activitiesBody.replace(
        /(\n\s*title:\s*"([^"]+)",)(?![\s\S]*?imageQuery:)/g,
        (titleMatch, titleLine, title) => {
          return `${titleLine}
      imageQuery: "${escapeString(title)} Algeria",`;
        },
      );

      return `activities: [${updatedActivities}
    ],
    attractions:`;
    },
  );
};

content = addActivityQueries(content);

// ---------------------------------------------------------
// 5. Add imageQuery to attractions
// ---------------------------------------------------------
//
// Expected structure:
//
// attractions: [
//   {
//     title: "...",
//     subtitle: "...",
//     image: "..."
//   }
// ]
//
// The destination name is included when possible.
// ---------------------------------------------------------

const addAttractionQueries = (text) => {
  return text.replace(
    /(\s+attractions:\s*\[)([\s\S]*?)(\n\s*\],\s*\n\s*accommodations:)/g,
    (match, start, attractionsBody, end) => {
      const before = text.slice(0, text.indexOf(match));

      const names = [...before.matchAll(/\n\s*name:\s*"([^"]+)",/g)];

      const destinationName =
        names.length > 0 ? names[names.length - 1][1] : "";

      const updatedAttractions = attractionsBody.replace(
        /(\n\s*title:\s*"([^"]+)",)/g,
        (titleMatch, titleLine, title) => {
          const query = makeQuery(title, destinationName, "Algeria");

          return `${titleLine}
        imageQuery: "${escapeString(query)}",`;
        },
      );

      return `${start}${updatedAttractions}${end}`;
    },
  );
};

content = addAttractionQueries(content);

// ---------------------------------------------------------
// 6. Remove imageQuery from accommodations
// ---------------------------------------------------------
//
// Accommodations keep their existing image field.
// We don't need Unsplash queries for them yet.
// ---------------------------------------------------------

const removeAccommodationQueries = (text) => {
  return text.replace(
    /(\s+accommodations:\s*\[)([\s\S]*?)(\n\s*\],)/g,
    (match, start, body, end) => {
      const cleanedBody = body.replace(/\n\s*imageQuery:\s*"[^"]*",/g, "");

      return `${start}${cleanedBody}${end}`;
    },
  );
};

content = removeAccommodationQueries(content);

// ---------------------------------------------------------
// 7. Save output
// ---------------------------------------------------------

const header = `// AUTO-GENERATED FILE
// Generated by seeding/generate-unsplash-data.cjs
// Do not edit this file manually.

`;

if (!content.startsWith("export")) {
  content = content.trimStart();
}

fs.writeFileSync(outputFile, header + content, "utf8");

console.log("");
console.log("✅ Unsplash-ready file generated successfully!");
console.log("");
console.log("Added:");
console.log("  ✓ Destination imageQuery");
console.log("  ✓ galleryQueries");
console.log("  ✓ Activity imageQuery");
console.log("  ✓ Attraction imageQuery");
console.log("  ✓ Existing heroImage preserved");
console.log("  ✓ Existing galleryImages preserved");
console.log("  ✓ Existing attraction images preserved");
console.log("  ✓ Accommodation images preserved");
console.log("");
console.log("Excluded:");
console.log("  ✓ Accommodation imageQuery");
console.log("");
console.log(`Output: ${outputFile}`);
