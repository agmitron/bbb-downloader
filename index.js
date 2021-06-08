const puppeteer = require('puppeteer')
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder')

const sleep = ms => new Promise(resolve => setTimeout(() => resolve(), ms))

    // 1. Access to BBB stream

    ; (async () => {
        const browser = await puppeteer.launch()
        const browserWSEndpoint = browser.wsEndpoint();

        const page = await browser.newPage()
        await page.goto('https://vconf.tomtit-tomsk.ru/playback/presentation/2.3/4293a04256d7a188dd77b1f709369ec0679c9832-1621919197407')
        await sleep(10000)
        await page.screenshot({ path: 'screenshot.png' })
        await page.setViewport({ width: 1920, height: 1080 })
        const recorder = new PuppeteerScreenRecorder(page, {
            followNewTab: true,
            fps: 25,
            ffmpeg_Path: null,
            videoFrame: {
                width: 1920,
                height: 1080,
            },
            aspectRatio: '16:9',
        })

        await recorder.start('./video.mp4')

        await sleep(1000)

        await recorder.stop()
        console.log('done')
    })()

function openBBBWebinar(url) {
    if (typeof url !== 'string') {
        return
    }


}