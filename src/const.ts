export class Constants {
    static get BASE () {return "https://neko-sama.fr"}
    static get VOSTFR () {return this.BASE + "/animes-search-vostfr.json"}
    static get VF () {return this.BASE + "/animes-search-vf.json"}
    static get PUPPETEER () {return {headless: true, timeout: 120000}}
    
}