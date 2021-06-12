"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NEKO_1 = require("./NEKO");
(async () => {
    const neko = new NEKO_1.NEKO();
    await neko.init();
    await neko.download("./test.mp4", await (await neko.getFullStream(await neko.getFullEpisode((await neko.search("overlord"))[0]))).qualities[0], console.log);
    await neko.close();
})();
