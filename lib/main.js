"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NEKO = require(".");
(async () => {
    //const search = new NEKO.Search("sao");
    const anime = new NEKO.Anime("https://neko-sama.fr/anime/info/7892-koe-no-katachi-vostfr");
    await anime.retrieveInfos();
    const eps = anime.getEpisodes();
    for (let e in eps) {
        if (+e < 0)
            console.log("Skipped ep " + (+e + 1));
        else {
            const ep = eps[e];
            await ep.retrieveInfos();
            const stream = ep.getPStream();
            await stream.retrieveInfos();
            const downloader = stream.getDownloader();
            let q = downloader.getQuality().sort((a, b) => {
                if (+a < +b)
                    return -1;
                if (+a > +b)
                    return 1;
                return 0;
            });
            await new Promise(resolve => {
                downloader.download("./KoeNoKatachi" /*+ anime.getNames()[1] + "-" + ep.getEpisode()*/ + ".mp4", q[q.length - 1], (code) => {
                    console.log("Ends with code : " + code);
                    resolve();
                }, (stdout) => {
                    if (("" + stdout).toLowerCase().includes("fps="))
                        console.log("FFMPEG : " + stdout);
                });
            });
        }
    }
})();
