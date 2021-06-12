"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Constants = exports.NEKO = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const puppeteer_1 = require("puppeteer");
class NEKO {
    constructor() { }
    async init() {
        this.browser = await puppeteer_1.launch({
            headless: true
        });
    }
    async search(tag, type = "VOSTFR") {
        const page = await this.browser.newPage();
        await page.goto(Constants[type], { timeout: 0 });
        let json = JSON.parse(await page.evaluate(() => document.body.innerText));
        const arr = [];
        for (let e of json) {
            if ((e.title != null && e.title.toLowerCase().includes(tag)) || (e.title_english != null && e.title_english.toLowerCase().includes(tag)) || (e.title_romanji != null && e.title_romanji.toLowerCase().includes(tag))) {
                arr.push({
                    url: Constants.BASE + e.url,
                    title: e.title,
                    cover: e["url_image"],
                    partial: true
                });
            }
        }
        await page.close();
        return arr;
    }
    async getFullAnime(anime) {
        anime.partial = false;
        const ID = anime.url.split("/")[anime.url.split("/").length - 1].split("-")[0];
        const page = await this.browser.newPage();
        await page.goto(anime.url, { timeout: 0 });
        const infos = await page.$("div#info");
        let background = (await page.evaluate(i => i.firstElementChild.style.backgroundImage, infos)).substring(5);
        anime.background = background.substring(background.length - 2);
        const animeList = (await page.evaluate(i => i.querySelector("#anime-main").firstElementChild.lastElementChild.firstElementChild.lastElementChild.children[1].className, infos)).replaceAll(" ", ".");
        const list = await (await page.$("div." + animeList)).$$("div.col-lg-4.col-sm-6.col-xs-6");
        const eps = [];
        for (let i in list) {
            let e = list[i];
            e = await e.$("div");
            let num = +(await page.evaluate(e => e.lastElementChild.firstElementChild.lastElementChild.innerText, e)).substring(4);
            let cover = (await page.evaluate(e => e.firstElementChild.lastElementChild.src, e));
            let time = +(await page.evaluate(e => e.firstElementChild.firstElementChild.firstElementChild.innerText, e)).toLowerCase().replace(" min", "");
            let url = (await page.evaluate(e => e.lastElementChild.firstElementChild.href, e));
            eps.push({
                cover: cover,
                number: num,
                time: time,
                url: url,
                partial: true
            });
        }
        anime.episodes = eps;
        await page.close();
        return anime;
    }
    async getFullEpisode(episode, n = 1) {
        let ep = episode;
        let anime = episode;
        if (anime.title) {
            if (anime.partial)
                anime = await this.getFullAnime(anime);
            ep = anime.episodes[n];
        }
        ep.partial = false;
        const page = await this.browser.newPage();
        await page.goto(ep.url, { timeout: 0 });
        const vids = await page.evaluate(() => { return window["video"]; });
        for (let i in vids) {
            const e = vids[i];
            if (e.includes("pstream"))
                ep.stream = {
                    url: e,
                    partial: true
                };
        }
        await page.close();
        return ep;
    }
    async getFullStream(stream) {
        let str = stream;
        let ep = stream;
        if (ep.cover) {
            if (ep.partial)
                ep = await this.getFullEpisode(ep);
            str = ep.stream;
        }
        const page = await this.browser.newPage();
        await page.goto(str.url, { timeout: 0 });
        let down = await page.evaluate(async () => {
            function b64_to_utf8(str) {
                return decodeURIComponent(escape(window.atob(str)));
            }
            const json = JSON.parse(b64_to_utf8(window['playerOptsB64']));
            let res = (await window.fetch(json.url)).body;
            let data = (await res.getReader().read()).value;
            return new TextDecoder().decode(data);
        });
        const lines = down.split("\n");
        down = {};
        let i = 0;
        lines.forEach((l) => {
            i++;
            if (i % 2 == 1)
                return;
            let q = l.substring(l.indexOf("NAME") + 6, l.length - 1);
            down[q] = lines[i];
        });
        for (let i in Object.keys(down)) {
            let q = Object.keys(down)[i];
            let arr = await page.evaluate(async (q) => {
                let res = await window.fetch(q).then((res) => res.text()).then((res) => { return res; });
                return res;
            }, down[q]);
            down[q] = (!arr.includes("html") ? arr : null);
        }
        await page.close();
        str.partial = false;
        let quals = [];
        for (let i of Object.keys(down)) {
            quals.push({
                size: +i,
                m3u8: down[i]
            });
        }
        if (quals[quals.length - 1].size == 0)
            quals.pop();
        str.qualities = quals;
        return str;
    }
    async download(path, stream, stdout) {
        fs_1.writeFileSync(__dirname + "/file.m3u8", stream.m3u8);
        const proc = child_process_1.spawn("ffmpeg", [
            "-y",
            "-protocol_whitelist", "file,http,https,tcp,tls",
            "-i", __dirname + "/file.m3u8",
            path_1.resolve(path)
        ]);
        proc.stdout.on("data", m => stdout(m['toString']()));
        proc.stderr.on("data", m => stdout(m['toString']()));
        return await new Promise(resolve => {
            proc.on("close", (code) => {
                fs_1.unlinkSync(__dirname + "/file.m3u8");
                resolve(code);
            });
        });
    }
    async close() {
        await this.browser.close();
    }
}
exports.NEKO = NEKO;
class Constants {
    static get BASE() { return "https://neko-sama.fr"; }
    static get VOSTFR() { return this.BASE + "/animes-search-vostfr.json"; }
    static get VF() { return this.BASE + "/animes-search-vf.json"; }
    static get PUPPETEER() { return { headless: true, timeout: 120000 }; }
}
exports.Constants = Constants;
