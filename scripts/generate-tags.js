import https from "https";
import fs from "fs";
import { createGunzip } from "zlib";
import { pipeline } from "stream";
import { promisify } from "util";
import path from "path";
import { parse } from "csv-parse";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pipe = promisify(pipeline);

const yesterday = getYesterdayDate();
const files = [
    {
        name: "posts",
        url: `https://e621.net/db_export/posts-${yesterday}.csv.gz`,
        csvPath: `csv/posts-${yesterday}.csv`,
    },
    {
        name: "tag_aliases",
        url: `https://e621.net/db_export/tag_aliases-${yesterday}.csv.gz`,
        csvPath: `csv/tag_aliases-${yesterday}.csv`,
    },
    {
        name: "tags",
        url: `https://e621.net/db_export/tags-${yesterday}.csv.gz`,
        csvPath: `csv/tags-${yesterday}.csv`,
    },
];

(async () => {
    try {
        await generateTags();
    } catch (err) {
        console.error("Error generating tags:", err);
        process.exit(1);
    }
})();

async function generateTags() {
    const tags = new Map();
    var begin;
    console.log("Renaming tags.json file...");
    renameOldTagsFile();

    console.log("Retrieving files...");
    begin = Date.now();
    await retrieveFiles();
    console.log(`Retrieved files in ${Date.now() - begin} ms.`);

    console.log("Parsing tags...");
    begin = Date.now();
    await parseTags(tags);
    console.log(`Parsed tags in ${Date.now() - begin} ms.`);

    console.log("Parsing aliases...");
    begin = Date.now();
    await parseAliases(tags);
    console.log(`Parsed aliases in ${Date.now() - begin} ms.`);

    console.log("Retrieving top tags by category...");
    begin = Date.now();
    const topTags = [
        ...getTopTagsByCategory(tags.values(), 0, 1000),
        ...getTopTagsByCategory(tags.values(), 1, 1000),
        ...getTopTagsByCategory(tags.values(), 3, 1000),
        ...getTopTagsByCategory(tags.values(), 4, 1000),
        ...getTopTagsByCategory(tags.values(), 5, 1000),
    ];
    console.log(`Retrieving top tags in ${Date.now() - begin} ms.`);

    console.log("Parsing posts...");
    begin = Date.now();
    await parsePosts(topTags);
    console.log(`Parsed posts in ${Date.now() - begin} ms.`);

    saveTagsAsJson(topTags);
}

function renameOldTagsFile() {
    const oldPath = path.join(__dirname, "../resources/tags.json");
    const newPath = path.join(__dirname, "../resources/tags-old.json");

    try {
        // Check if the file exists before attempting to rename
        if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
            console.log(`\tSuccessfully renamed ${oldPath} to ${newPath}`);
        } else {
            console.log(`\t${oldPath} does not exist. Nothing to rename.`);
        }
    } catch (error) {
        console.error(`\tError renaming file: ${error}`);
    }
}

async function retrieveFiles() {
    try {
        for (const f of files) {
            console.log(`\tDownloading ${f.name}...`);
            if (fs.existsSync(f.csvPath)) {
                console.log(`\t${f.name}.csv already exists, skipping download.`);
            } else {
                await downloadAndExtract(f.url, f.csvPath);
            }
        }

        console.log("All files downloaded and extracted ✅");
    } catch (err) {
        console.error("Download failed ❌:", err.message);
        process.exit(1);
    }
}

async function downloadAndExtract(url, outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    return new Promise((resolve, reject) => {
        https
            .get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                    return;
                }

                const gunzip = createGunzip();
                const file = fs.createWriteStream(outputPath);

                pipe(response, gunzip, file).then(resolve).catch(reject);
            })
            .on("error", reject);
    });
}

async function parseTags(tags) {
    return new Promise((resolve, reject) => {
        const parser = parse({ skip_empty_lines: true });
        let isFirstLine = true;

        fs.createReadStream(files[2].csvPath)
            .pipe(parser)
            .on("data", (line) => {
                if (isFirstLine) {
                    isFirstLine = false;
                    return;
                }

                if (line.length < 4) return;

                const name = line[1];
                const category = parseInt(line[2], 10);
                const count = parseInt(line[3], 10);

                tags.set(name, new Tag(name, category, count));
            })
            .on("end", () => resolve(tags))
            .on("error", reject);
    });
}

async function parseAliases(tags) {
    return new Promise((resolve, reject) => {
        const parser = parse({ skip_empty_lines: true });
        let isFirstLine = true;

        fs.createReadStream(files[1].csvPath)
            .pipe(parser)
            .on("data", (line) => {
                if (isFirstLine) {
                    isFirstLine = false;
                    return;
                }

                if (line.length < 5) return;

                const alias = line[1];
                const canonical = line[2];

                const tag = tags.get(canonical);
                if (tag) tag.addAlias(alias);
            })
            .on("end", () => resolve(tags))
            .on("error", reject);
    });
}

async function parsePosts(topTags) {
    const topTagsMap = new Map(topTags.map((t) => [t.name, t]));
    const targetTagsSet = new Set(topTagsMap.keys());

    return new Promise((resolve, reject) => {
        const parser = parse({ skip_empty_lines: true });
        let isFirstLine = true;

        fs.createReadStream(files[0].csvPath)
            .pipe(parser)
            .on("data", (line) => {
                if (isFirstLine) {
                    isFirstLine = false;
                    return; // skip header
                }

                // Skip unwanted formats/invalid data
                if (
                    line.length !== 29 ||
                    !isNumber(line[0]) ||
                    line[20] === "t" || // deleted
                    ["webm", "swf", "gif", "mp4"].includes(line[11]) ||
                    parseInt(line[23], 10) < 0
                )
                    return;

                const md5 = line[3];
                const rating = line[5]; // explicit, questionable, safe
                const fileExt = line[11];
                const score = parseInt(line[23], 10);

                // Only consider PNG/JPG
                if (!["png", "jpg"].includes(fileExt)) return;

                const url = createImageUrl(md5, fileExt);

                // Split tags once, loop through
                const postTags = line[8].split(/\s+/);
                for (let i = 0; i < postTags.length; i++) {
                    const tagName = postTags[i];
                    if (!targetTagsSet.has(tagName)) continue;

                    const tag = topTagsMap.get(tagName);
                    if (tag) tag.updatePreview(rating, score, url);
                }
            })
            .on("end", () => resolve())
            .on("error", reject);
    });
}

function saveTagsAsJson(topTags) {
    const outputPath = path.join(__dirname, "../resources/tags.json");

    try {
        fs.writeFileSync(outputPath, JSON.stringify(topTags, null, 2), "utf-8");
        console.log(`Saved ${topTags.length} tags to ${outputPath}`);
    } catch (err) {
        console.error("Failed to save tags as JSON:", err);
    }
}

// helper functions
function isNumber(str) {
    return !isNaN(str) && str.trim() !== "";
}

function createImageUrl(md5) {
    return `https://static1.e621.net/data/sample/${md5.substring(0, 2)}/${md5.substring(2, 4)}/${md5}.jpg`;
}

function getTopTagsByCategory(tagsCollection, category, limit) {
    return Array.from(tagsCollection)
        .filter((tag) => tag.category === category && tag.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

function getYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const yyyy = yesterday.getFullYear();
    const mm = String(yesterday.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
    const dd = String(yesterday.getDate()).padStart(2, "0");

    const formatted = `${yyyy}-${mm}-${dd}`;
    return formatted;
}

// classes
class Tag {
    constructor(name, category, count) {
        this.name = name;
        this.category = category;
        this.count = count;
        this.aliases = [];
        this.images = {
            explicit: { url: null, score: -Infinity },
            questionable: { url: null, score: -Infinity },
            safe: { url: null, score: -Infinity },
        };
    }

    addAlias(alias) {
        this.aliases.push(alias);
    }

    updatePreview(rating, score, url) {
        const ratingMap = { e: "explicit", q: "questionable", s: "safe" };
        const ratingKey = ratingMap[rating.toLowerCase()];
        if (!ratingKey) return;

        if (this.images[ratingKey].score === null || score > this.images[ratingKey].score) {
            this.images[ratingKey] = { url, score };
        }
    }
}
