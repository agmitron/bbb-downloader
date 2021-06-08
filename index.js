const fs = require('fs')
const puppeteer = require('puppeteer')
const download = require('download')
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder')
const FFmpeg = require('fluent-ffmpeg')

const sleep = ms => new Promise(resolve => setTimeout(() => resolve(), ms))

// TODO: concat a video and an audio streams

const start = async () => {
    try {
        const browser = await puppeteer.launch()
        const browserWSEndpoint = browser.wsEndpoint();

        const page = await browser.newPage()
        await page.goto('https://vconf.tomtit-tomsk.ru/playback/presentation/2.3/4293a04256d7a188dd77b1f709369ec0679c9832-1622267043704')
        await sleep(5000)
        await page.screenshot({ path: 'screenshot.png' })
        await page.setViewport({ width: 1920, height: 1080 })
        const recorder = new PuppeteerScreenRecorder(page)
        await recorder.start('video.mp4');
        const playButtonSelector = '.vjs-control-bar > .vjs-play-control.vjs-control.vjs-button'
        await page.waitForSelector(playButtonSelector)
        await page.click(playButtonSelector)
        const fileSrc = await page.evaluate(() => {
            const $audio = document.querySelector('.video-wrapper .vjs-tech')
            return $audio.src
        })

        await sleep(10000)

        await download(fileSrc, 'dist')



        await recorder.stop()

        const filename = fileSrc.split('/')[fileSrc.split('/').length - 1]

        // convert webm to audio 

        FFmpeg('video.mp4')
            .addInput('dist/webcams.webm')
            .outputOptions('-c copy')
            .saveToFile('output.mkv')
            .on('error', err => console.error('Merging error: ', err))
            .on('end', () => console.log('Merging completed'))


    } catch (e) {
        console.error(e)
    }
}


start()