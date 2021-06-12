"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Anime = void 0;
const _1 = require(".");
const puppeteer = require("puppeteer");
class Anime {
    constructor(url) {
        this.url = url;
    }
    async retrieveInfos() {
        this.ID = this.url.split("/")[this.url.split("/").length - 1].split("-")[0];
        const browser = await puppeteer.launch(_1.Constants.PUPPETEER);
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(0);
        await page.goto(this.url);
        const infos = await page.$("div#info");
        this.background = (await page.evaluate(i => i.firstElementChild.style.backgroundImage, infos)).substring(5);
        this.background = this.background.substring(this.background.length - 2);
        this.names = (await page.evaluate(i => i.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.innerText, infos)).split(", ");
        this.poch = (await page.evaluate(i => i.querySelector("#anime-main").firstElementChild.firstElementChild.firstElementChild.firstElementChild.src, infos));
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
            eps.push(new _1.Episode(url, num, this, cover, time));
        }
        this.ep = eps;
        await browser.close();
    }
    getURL() {
        return this.url;
    }
    getNames() {
        return this.names;
    }
    getID() {
        return this.ID;
    }
    getBackground() {
        return this.background;
    }
    getCover() {
        return this.poch;
    }
    getEpisodes() {
        return this.ep;
    }
}
exports.Anime = Anime;
