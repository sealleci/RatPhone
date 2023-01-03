import { fileURLToPath } from "url";
import path from "path";
import { readdirSync, statSync } from "fs";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
    const raw_dir = "../less/";
    const raw_out = "../css/";
    const dir_path = path.join(__dirname, raw_dir);
    const files = readdirSync(dir_path, { encoding: "utf-8", withFileTypes: true });

    for (let file of files) {
        const file_path = path.join(__dirname, `${raw_dir}${file.name}`);
        if (statSync(file_path).isFile() && path.extname(file_path).includes("less")) {
            execSync(`lessc -x ${dir_path}${file.name} ${path.join(__dirname, raw_out)}${file.name.match(/^([^\.]+)\.[^\.]+$/)[1]}.css --source-map`);
        }
    }

    console.log(`@script.less: Compiled ${files.length} less file${files.length > 1 ? "s" : ""}.`);
})();