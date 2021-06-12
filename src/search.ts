import { Anime, Constants } from ".";
import * as puppeteer from 'puppeteer';

export class Search {

    private json: Array<any> = [];
    private tag: string;
    private type: string;

    /**
     * 
     * @param name Name of the anime
     * @param type `VOSTFR` or `VF`
     */
    constructor(name: string = "", type: string = "VOSTFR") {
        this.tag = name.toLowerCase();
        this.type = type;
    }

    async get(): Promise<Array<Anime>> {
        const browser = await puppeteer.launch(Constants.PUPPETEER);
        const page = await browser.newPage();
        await page.goto(Constants[this.type]);
        page.setDefaultNavigationTimeout(0);
        this.json = JSON.parse(await page.evaluate(() => document.body.innerText));

        const arr: Array<Anime> = [];
        this.json.forEach(e => {
            if ((e.title != null && e.title.toLowerCase().includes(this.tag)) || (e.title_english != null && e.title_english.toLowerCase().includes(this.tag)) || (e.title_romanji != null && e.title_romanji.toLowerCase().includes(this.tag))) {
                arr.push(new Anime(Constants.BASE + e.url));
            }
        });
        await browser.close();
        return new Promise<Array<Anime>>(resolve => resolve(arr));
    }

}