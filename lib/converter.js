"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Converter = void 0;
const child = require("child_process");
const fs = require("fs");
class Converter {
    constructor(quality) {
        this.quality = {};
        this.quality = quality;
    }
    download(path, quality, callback, stdout) {
        let m3u8 = "./tmp.m3u8";
        if (this.quality[quality] == undefined || this.quality[quality] == null)
            throw new Error("The quality dosen't exist (" + quality + ")");
        fs.writeFileSync(m3u8, this.quality[quality]);
        const p = child.spawn("ffmpeg", [
            "-y",
            "-protocol_whitelist", "file,http,https,tcp,tls",
            "-i", m3u8,
            path
        ]);
        p.stdout.on('data', stdout);
        p.stderr.on('data', stdout);
        p.on("close", (code) => {
            fs.unlinkSync(m3u8);
            callback(code);
        });
    }
    getQuality() {
        return Object.keys(this.quality);
    }
}
exports.Converter = Converter;
