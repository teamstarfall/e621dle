import https from "https";
import fs from "fs";
import { createGunzip } from "zlib";
import { pipeline } from "stream";
import { promisify } from "util";
import path from "path";
import { parse } from "csv-parse";
import { fileURLToPath } from "url";
import { encode } from "@msgpack/msgpack";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pipe = promisify(pipeline);
const branchName = getBranchName();
const outputFileName = branchName === "main" ? "tags.json" : "tags.dev.json";
const today = getTodayDate();
const files = [
    {
        name: "posts",
        url: `https://e621.net/db_export/posts-${today}.csv.gz`,
        csvPath: `csv/posts-${today}.csv`,
    },
    {
        name: "tags",
        url: `https://e621.net/db_export/tags-${today}.csv.gz`,
        csvPath: `csv/tags-${today}.csv`,
    },
];

// no you may not argue this blacklist with me (but i'm open to suggestions)
const blacklist = [
    "amputation",
    "amputee",
    "anal_vore",
    "babyfur",
    "beastiality",
    "bestiality",
    "blood",
    "castration",
    "cbt",
    "cub",
    "dead",
    "death",
    "decapitation",
    "diaper",
    "diapers",
    "diarrhea",
    "disembowelment",
    "dismembered",
    "dismemberment",
    "drowning",
    "feces",
    "forced_incest",
    "gaping",
    "gore",
    "guro",
    "guts",
    "hyperscat",
    "incest",
    "incest_(lore)",
    "incestuous_voyeur_(lore)",
    "infantilism",
    "involuntary_pedophilia",
    "loli",
    "lolicon",
    "morbidly_obese",
    "murder",
    "mutilation",
    "nazi",
    "necrophilia",
    "pedo",
    "pedobear",
    "pedophile_iconography",
    "pedophilia_humiliation",
    "pedophilia_pride_colors",
    "pedophilia_temptation",
    "penectomy",
    "poo",
    "poop",
    "pooping",
    "pregnancy",
    "puke",
    "rape",
    "real",
    "scat",
    "shit",
    "shitting_dicknipples",
    "shota",
    "snuff",
    "stated_pedophilia",
    "suicide",
    "torture",
    "unbirth",
    "unbirthing",
    "underage",
    "urethral",
    "vomit",
    "vore",
    "watersports",
    "what",
    "young",
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

    console.log("Starting process. Current branch name: ", branchName);
    console.log("Output file name will be: ", outputFileName);
    console.log("Retrieving files...");
    begin = Date.now();
    await retrieveFiles();
    console.log(`Retrieved files in ${Date.now() - begin} ms.`);

    console.log("Parsing tags...");
    begin = Date.now();
    await parseTags(tags);
    console.log(`Parsed tags in ${Date.now() - begin} ms.`);

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

async function retrieveFiles() {
    try {
        for (const f of files) {
            console.log(`	Downloading ${f.name}...`);
            if (fs.existsSync(f.csvPath)) {
                console.log(`	${f.name}.csv already exists, skipping download.`);
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

        fs.createReadStream(files[1].csvPath)
            .pipe(parser)
            .on("data", (line) => {
                if (isFirstLine) {
                    isFirstLine = false;
                    return;
                }

                if (line.length < 4) return;

                const name = line[1];
                if (blacklist.includes(name)) return;

                const category = parseInt(line[2], 10);
                const count = parseInt(line[3], 10);

                tags.set(name, new Tag(name, category, count));
            })
            .on("end", () => resolve(tags))
            .on("error", reject);
    });
}

async function parsePosts(topTags) {
    const topTagsMap = new Map(topTags.map((t) => [t.name, t]));
    const targetTagsSet = new Set(topTagsMap.keys());
    const usedImages = new Map();

    return new Promise((resolve, reject) => {
        const parser = parse({ skip_empty_lines: true });
        const ratingMap = { e: "explicit", q: "questionable", s: "safe" };
        let isFirstLine = true;

        fs.createReadStream(files[0].csvPath)
            .pipe(parser)
            .on("data", (line) => {
                if (isFirstLine) {
                    isFirstLine = false;
                    return;
                }

                if (shouldProcessPost(line)) return;

                const id = line[0];
                const md5 = line[3];
                const rating = line[5]; // explicit, questionable, safe
                const postTags = line[8].split(/\s+/);
                const fileExt = line[11];
                const score = parseInt(line[23], 10);

                const blacklistedTag = postTags.find((t) => blacklist.includes(t));
                if (blacklistedTag) return;

                for (const tagName of postTags) {
                    if (!targetTagsSet.has(tagName)) continue;

                    const tag = topTagsMap.get(tagName);
                    if (!tag || ([4, 5].includes(tag.category) && !postTags.includes("solo"))) continue;

                    const ratingKey = ratingMap[rating.toLowerCase()];
                    if (!ratingKey || tag.images[ratingKey].score > score) continue;

                    const existingImage = usedImages.get(md5);
                    if (existingImage && existingImage.tag.name !== tag.name) {
                        if (score > existingImage.score) {
                            existingImage.tag.resetPreview(existingImage.ratingKey);
                            tag.updatePreview(id, rating, score, md5, fileExt);
                            usedImages.set(md5, { id, tag, score, ratingKey });
                        }
                    } else {
                        tag.updatePreview(id, rating, score, md5, fileExt);
                        usedImages.set(md5, { tag, score, ratingKey });
                    }
                }
            })
            .on("end", () => resolve())
            .on("error", reject);
    });
}

function saveTagsAsJson(topTags) {
    const outputPath = path.join(__dirname, "../resources", outputFileName);
    const outputMinPath = path.join(__dirname, "../resources", outputFileName.replace(".json", ".min.json"));

    const outputData = {
        date: getTodayDate(),
        tags: topTags,
    };

    try {
        fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), "utf-8");
        fs.writeFileSync(outputMinPath, encode(outputData), "utf-8");
        console.log(`Saved ${topTags.length} tags to ${outputPath}`);
    } catch (err) {
        console.error("Failed to save tags as JSON:", err);
    }
}

// helper functions
function isNumber(str) {
    return !isNaN(str) && str.trim() !== "";
}

function getTopTagsByCategory(tagsCollection, category, limit) {
    return Array.from(tagsCollection)
        .filter((tag) => tag.category === category && tag.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

function getTodayDate() {
    return new Date().toISOString().split("T")[0];
}

function shouldProcessPost(line) {
    return (
        line.length !== 29 ||
        !isNumber(line[0]) ||
        line[20] === "t" || // post is deleted
        !["png", "jpg", "gif"].includes(line[11]) ||
        parseInt(line[23], 10) < 0
    );
}

function getBranchName() {
    try {
        const branchName = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
        return branchName;
    } catch (error) {
        console.error("Error getting branch name:", error);
        return "unknown";
    }
}

// classes
class Tag {
    constructor(name, category, count) {
        this.name = name;
        this.category = category;
        this.count = count;
        this.images = {
            explicit: { id: null, md5: null, score: -Infinity, fileExt: null },
            questionable: {
                id: null,
                md5: null,
                score: -Infinity,
                fileExt: null,
            },
            safe: { id: null, md5: null, score: -Infinity, fileExt: null },
        };
    }

    updatePreview(id, rating, score, md5, fileExt) {
        const ratingMap = { e: "explicit", q: "questionable", s: "safe" };
        const ratingKey = ratingMap[rating.toLowerCase()];
        if (!ratingKey) return;

        if (this.images[ratingKey].score === null || score > this.images[ratingKey].score) {
            this.images[ratingKey] = { id, md5, score, fileExt };
        }
    }

    resetPreview(ratingKey) {
        this.images[ratingKey] = {
            id: null,
            md5: null,
            score: -Infinity,
            fileExt: null,
        };
    }
}
