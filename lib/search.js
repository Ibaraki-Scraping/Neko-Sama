"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Search = void 0;
const _1 = require(".");
const puppeteer = require("puppeteer");
class Search {
    /**
     *
     * @param name Name of the anime
     * @param type `VOSTFR` or `VF`
     */
    constructor(name = "", type = "VOSTFR") {
        this.json = [];
        this.tag = name.toLowerCase();
        this.type = type;
    }
    async get() {
        const browser = await puppeteer.launch(_1.Constants.PUPPETEER);
        const page = await browser.newPage();
        await page.goto(_1.Constants[this.type]);
        page.setDefaultNavigationTimeout(0);
        this.json = JSON.parse(await page.evaluate(() => document.body.innerText));
        const arr = [];
        this.json.forEach(e => {
            if ((e.title != null && e.title.toLowerCase().includes(this.tag)) || (e.title_english != null && e.title_english.toLowerCase().includes(this.tag)) || (e.title_romanji != null && e.title_romanji.toLowerCase().includes(this.tag))) {
                arr.push(new _1.Anime(_1.Constants.BASE + e.url));
            }
        });
        await browser.close();
        return new Promise(resolve => resolve(arr));
    }
}
exports.Search = Search;
