import { Anime, Constants, MyStream, PStream } from ".";
import * as puppeteer from 'puppeteer';

export class Episode {

    private anime: Anime;
    private episode: number;
    private cover: string;
    private time: number;
    private url: string;
    private pstream: PStream;
    private mystream: MyStream;
    

    constructor(url: string, episode: number, anime: Anime, cover: string, time: number) {
        this.episode = episode;
        this.anime = anime;
        this.cover = cover;
        this.time = time;
        this.url = url;
    }

    async retrieveInfos() {
        const browser = await puppeteer.launch(Constants.PUPPETEER);
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(0);
        await page.goto(this.url);

        const body = await page.$("body");

        const vids = await page.evaluate(() => {return window["video"]});

        for (let i in vids) {
            const e = vids[i];
            if (e.includes("pstream")) this.pstream = new PStream(e, this);
            if (e.includes("mystream")) this.mystream = new MyStream(e); 
        }

        await browser.close();
    }

    getAnime(): Anime {
        return this.anime;
    }

    getEpisode(): number {
        return this.episode;
    }

    getCover(): string {
        return this.cover;
    }

    getTime(): number {
        return this.time;
    }

    getURL(): string {
        return this.url;
    }

    getPStream(): PStream {
        return this.pstream;
    }

    getMyStream(): MyStream {
        return this.mystream;
    }

}