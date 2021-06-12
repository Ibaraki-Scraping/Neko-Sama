import { NEKO } from "./NEKO"

(async () => {
    const neko = new NEKO();
    await neko.init();

    await neko.download("./test.mp4", await (await neko.getFullStream(await neko.getFullEpisode((await neko.search("overlord"))[0]))).qualities[0], console.log);

    await neko.close();

})()