import { spawn } from "child_process";
import { fstat, unlinkSync, writeFileSync } from "fs";
import { resolve } from "path";
import { Browser, launch } from "puppeteer";

export class NEKO {

    private browser: Browser;

    constructor() {}

    public async init() {
        this.browser = await launch({
            headless: true
        });
    }

    public async search(tag: string, type: "VOSTFR" | "VF" = "VOSTFR"): Promise<Array<Anime>> {
        const page = await this.browser.newPage();
        await page.goto(Constants[type], {timeout: 0});
        let json: Array<any> = JSON.parse(await page.evaluate(() => document.body.innerText));

        const arr: Array<Anime> = [];
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

    public async getFullAnime(anime: Anime): Promise<Anime> {

        anime.partial = false;

        const ID = anime.url.split("/")[anime.url.split("/").length-1].split("-")[0];

        const page = await this.browser.newPage();
        await page.goto(anime.url, {timeout: 0});

        const infos = await page.$("div#info");
        let background = (await page.evaluate(i => i.firstElementChild.style.backgroundImage, infos)).substring(5);
        anime.background = background.substring(background.length-2);

        const animeList = (await page.evaluate(i => i.querySelector("#anime-main").firstElementChild.lastElementChild.firstElementChild.lastElementChild.children[1].className, infos)).replaceAll(" ", ".");
        const list = await (await page.$("div." + animeList)).$$("div.col-lg-4.col-sm-6.col-xs-6");

        const eps: Array<Episode> = [];

        for (let i in list) {
            let e = list[i];

            e = await e.$("div");
            let num: number = +(await page.evaluate(e => e.lastElementChild.firstElementChild.lastElementChild.innerText, e)).substring(4);
            let cover: string = (await page.evaluate(e => e.firstElementChild.lastElementChild.src, e));
            let time: number = +(await page.evaluate(e => e.firstElementChild.firstElementChild.firstElementChild.innerText, e)).toLowerCase().replace(" min", "");
            let url: string = (await page.evaluate(e => e.lastElementChild.firstElementChild.href, e));

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

    public async getFullEpisode(episode: Episode | Anime, n: number = 1): Promise<Episode> {
        let ep: Episode = (episode as Episode);
        let anime = (episode as Anime);
        if (anime.title) {
            if (anime.partial) anime = await this.getFullAnime(anime);
            ep = anime.episodes[n];
        }

        ep.partial = false;

        const page = await this.browser.newPage();
        await page.goto(ep.url, {timeout: 0});

        const vids = await page.evaluate(() => {return window["video"]});

        for (let i in vids) {
            const e = vids[i];
            if (e.includes("pstream")) ep.stream = {
                url: e,
                partial: true
            }
        }

        await page.close();

        return ep;
    }

    public async getFullStream(stream: Stream | Episode): Promise<Stream> {
        let str: Stream = stream as Stream;
        let ep: Episode = stream as Episode;
        if (ep.cover) {
            if (ep.partial) ep = await this.getFullEpisode(ep);
            str = ep.stream;
        }

        const page = await this.browser.newPage();
        
        await page.goto(str.url, {timeout: 0});

        let down: any = await page.evaluate(async () => {
            function b64_to_utf8( str: string ) {
                return decodeURIComponent(escape(window.atob( str )));
            }
            const json = JSON.parse(b64_to_utf8(window['playerOptsB64']));
            let res = (await window.fetch(json.url)).body;
            let data = (await res.getReader().read()).value;

            return new TextDecoder().decode(data);
        });
        
        const lines = down.split("\n");
        down = {};
        let i = 0;
        lines.forEach((l: string) => {
            i++;
            if (i%2 == 1) return;
            let q = l.substring(l.indexOf("NAME")+6, l.length - 1);
            down[q] = lines[i];
        });

        for (let i in Object.keys(down)) {
            let q = Object.keys(down)[i];
            let arr = await page.evaluate(async (q) => {
                let res = await window.fetch(q).then((res) => res.text()).then((res) => {return res});
                return res;
            }, down[q]);
            down[q] = (!arr.includes("html") ? arr : null);
        }
        await page.close();

        str.partial = false;

        let quals: Array<Quality> = [];

        for (let i of Object.keys(down)) {
            quals.push({
                size: +i,
                m3u8: down[i]
            });
        }

        if (quals[quals.length-1].size == 0) quals.pop();

        str.qualities = quals;

        return str;
    }

    public async download(path: string, stream: Quality, stdout?: (line: string) => void): Promise<number> {
        writeFileSync(__dirname + "/file.m3u8", stream.m3u8);
        const proc = spawn("ffmpeg", [
            "-y",
            "-protocol_whitelist", "file,http,https,tcp,tls",
            "-i", __dirname + "/file.m3u8",
            resolve(path)
        ]);

        proc.stdout.on("data", m => stdout(m['toString']()));
        proc.stderr.on("data", m => stdout(m['toString']()));
        
        return await new Promise<number>(resolve => {
            proc.on("close", (code) => {
                unlinkSync(__dirname + "/file.m3u8");
                resolve(code);
            });
        });
    }

    public async close() {
        await this.browser.close();
    }
}

export interface Search {
    animes: Array<Anime>,
    tag: string
}

export interface Anime {
    url: string,
    title: string,
    cover: string,
    partial: boolean,
    background?: string,
    episodes?: Array<Episode>
}

export interface Episode {
    url: string,
    number: number,
    cover: string,
    time: number,
    partial: boolean,
    stream?: Stream
}

export interface Stream {
    url: string,
    partial: boolean,
    qualities?: Array<Quality>
}

export interface Quality {
    size: number,
    m3u8: string
}

export class Constants {
    static get BASE () {return "https://neko-sama.fr"}
    static get VOSTFR () {return this.BASE + "/animes-search-vostfr.json"}
    static get VF () {return this.BASE + "/animes-search-vf.json"}
    static get PUPPETEER () {return {headless: true, timeout: 120000}}
    
}