"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PStream = void 0;
const _1 = require(".");
const puppeteer = require("puppeteer");
class PStream {
    constructor(url, episode) {
        this.url = url;
        this.ep = episode;
    }
    async retrieveInfos() {
        const browser = await puppeteer.launch(_1.Constants.PUPPETEER);
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(0);
        await page.goto(this.url);
        this.down = await page.evaluate(async () => {
            function b64_to_utf8(str) {
                return decodeURIComponent(escape(window.atob(str)));
            }
            const json = JSON.parse(b64_to_utf8(window['playerOptsB64']));
            let res = (await window.fetch(json.url)).body;
            let data = (await res.getReader().read()).value;
            return new TextDecoder().decode(data);
        });
        const lines = this.down.split("\n");
        this.down = {};
        let i = 0;
        lines.forEach((l) => {
            i++;
            if (i % 2 == 1)
                return;
            let q = l.substring(l.indexOf("NAME") + 6, l.length - 1);
            this.down[q] = lines[i];
        });
        for (let i in Object.keys(this.down)) {
            let q = Object.keys(this.down)[i];
            let arr = await page.evaluate(async (q) => {
                let res = await window.fetch(q).then((res) => res.text()).then((res) => { return res; });
                return res;
            }, this.down[q]);
            this.down[q] = (!arr.includes("html") ? arr : null);
        }
        //console.log(this.downURL + "\n" + m3u8);
        await browser.close();
    }
    getSteamURL() {
        return this.url;
    }
    getEpisode() {
        return this.ep;
    }
    getDownloader() {
        return new _1.Converter(this.down);
    }
}
exports.PStream = PStream;
