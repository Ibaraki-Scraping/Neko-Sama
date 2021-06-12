"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Episode = void 0;
const _1 = require(".");
const puppeteer = require("puppeteer");
class Episode {
    constructor(url, episode, anime, cover, time) {
        this.episode = episode;
        this.anime = anime;
        this.cover = cover;
        this.time = time;
        this.url = url;
    }
    async retrieveInfos() {
        const browser = await puppeteer.launch(_1.Constants.PUPPETEER);
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(0);
        await page.goto(this.url);
        const body = await page.$("body");
        const vids = await page.evaluate(() => { return window["video"]; });
        for (let i in vids) {
            const e = vids[i];
            if (e.includes("pstream"))
                this.pstream = new _1.PStream(e, this);
            if (e.includes("mystream"))
                this.mystream = new _1.MyStream(e);
        }
        await browser.close();
    }
    getAnime() {
        return this.anime;
    }
    getEpisode() {
        return this.episode;
    }
    getCover() {
        return this.cover;
    }
    getTime() {
        return this.time;
    }
    getURL() {
        return this.url;
    }
    getPStream() {
        return this.pstream;
    }
    getMyStream() {
        return this.mystream;
    }
}
exports.Episode = Episode;
