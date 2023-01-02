const fs = require("fs");
const path = require("path");
const exec = require("child_process").exec;

(async () => {
    let raw_dir = "../less/";
    let raw_out = "../css/";
    let dir_path = path.join(__dirname, raw_dir);
    let files = fs.readdirSync(dir_path, { encoding: "utf-8", withFileTypes: true });
    files.forEach(async (file) => {
        let file_path = path.join(__dirname, `${raw_dir}${file.name}`);
        if (fs.statSync(file_path).isFile() && path.extname(file_path).includes("less")) {
            await exec(`lessc ${dir_path}${file.name} ${path.join(__dirname, raw_out)}${file.name.match(/^([^\.]+)\.[^\.]+$/)[1]}.css --source-map`);
        }
    })
})();