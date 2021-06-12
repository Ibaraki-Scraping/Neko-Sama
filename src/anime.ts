import { Constants, Episode } from ".";
import * as puppeteer from 'puppeteer';

export class Anime {

    private url: string;
    private names: Array<string>;
    private ID: string;
    private background: string;
    private poch: string;
    private ep: Array<Episode>;

    constructor(url: string) {
        this.url = url;
    }

    async retrieveInfos() {

        this.ID = this.url.split("/")[this.url.split("/").length-1].split("-")[0];

        const browser = await puppeteer.launch(Constants.PUPPETEER);
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(0);
        await page.goto(this.url);

        const infos = await page.$("div#info");
        this.background = (await page.evaluate(i => i.firstElementChild.style.backgroundImage, infos)).substring(5);
        this.background = this.background.substring(this.background.length-2);

        this.names = (await page.evaluate(i => i.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.innerText, infos)).split(", ");

        this.poch = (await page.evaluate(i => i.querySelector("#anime-main").firstElementChild.firstElementChild.firstElementChild.firstElementChild.src, infos))
    
        const animeList = (await page.evaluate(i => i.querySelector("#anime-main").firstElementChild.lastElementChild.firstElementChild.lastElementChild.children[1].className, infos)).replaceAll(" ", ".");
    
        const list = await (await page.$("div." + animeList)).$$("div.col-lg-4.col-sm-6.col-xs-6");

        const eps = [];

        for (let i in list) {
            let e = list[i];

            e = await e.$("div");
            let num: number = +(await page.evaluate(e => e.lastElementChild.firstElementChild.lastElementChild.innerText, e)).substring(4);
            let cover: string = (await page.evaluate(e => e.firstElementChild.lastElementChild.src, e));
            let time: number = +(await page.evaluate(e => e.firstElementChild.firstElementChild.firstElementChild.innerText, e)).toLowerCase().replace(" min", "");
            let url: string = (await page.evaluate(e => e.lastElementChild.firstElementChild.href, e));

            eps.push(new Episode(url, num, this, cover, time));
        }

        this.ep = eps;

        await browser.close();
    }

    getURL(): string {
        return this.url;
    }

    getNames(): Array<string> {
        return this.names;
    }

    getID(): string {
        return this.ID;
    }

    getBackground(): string {
        return this.background;
    }

    getCover(): string {
        return this.poch
    }

    getEpisodes(): Array<Episode> {
        return this.ep;
    }

}