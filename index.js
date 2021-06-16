const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')
const download = require('download')
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder')
const FFmpeg = require('fluent-ffmpeg')
const { ffprobe } = require('fluent-ffmpeg')
const express = require('express')
const app = express()
const cors = require('cors')
const port = 3000
app.listen(port, () => console.log(`App started on port ${port}`))

const PROJECTS_DIR = 'projects'
const finalFileName = 'output.mkv'

const sleep = ms => new Promise(resolve => setTimeout(() => resolve(), ms))

app.use(cors())

app.get('/', async (req, res) => {
    const { bbb_url } = req.query

    if (!bbb_url) {
        return res.status(500).json({
            message: 'bbb_url is required in query parameters'
        })
    }

    res.write(await start(bbb_url), 'binary')

    return res.status(200).end()
})

app.get('/check', (req, res) => {
    const { bbb_url } = req.query

    if (!bbb_url) {
        return res.status(500).json({
            message: 'bbb_url is required in query parameters'
        })
    }

    res.status(200).json({
        result: checkIsExisted(bbb_url)
    })
})

function checkIsExisted(bbb_url) {
    const p = path.join(PROJECTS_DIR, getLastPart(bbb_url), finalFileName)
    return fs.existsSync(p)
}

const start = async (bbb_url) => {
    try {
        const browser = await puppeteer.launch()

        // Check if no in db
        const page = await browser.newPage()
        await openBBB(page, bbb_url)
        await startWebinarVideo(page)

        const projectId = getLastPart(bbb_url)

        const outputDir = await createOutputDir(projectId)

        await recordScreen(outputDir, page)

        const mergedVideoPath = await mergeVideoAndAudio(outputDir)

        return fs.promises.readFile(mergedVideoPath)
    } catch (e) {
        console.error(e)
    }
}

async function recordScreen(outputDir, page, callbackDuringRecording = async () => {}) {
    const audioLocalSrc = await downloadAudio(await getAudioRemoteSrc(page), outputDir)
    const duration = Math.ceil(await getDuration(audioLocalSrc) * 1000)

    const recorder = new PuppeteerScreenRecorder(page)
    await recorder.start(`${outputDir}/video.mp4`);

    await callbackDuringRecording()

    await sleep(300000)
    await recorder.stop()
}

async function openBBB(page, bbb_url) {
    await page.goto(bbb_url)
    await page.setViewport({ width: 1920, height: 1080 })
}

async function startWebinarVideo(page) {
    const playButtonSelector = '.vjs-control-bar > .vjs-play-control.vjs-control.vjs-button'
    await page.waitForSelector(playButtonSelector)
    await page.click(playButtonSelector)
}

async function getAudioRemoteSrc(page) {
    return await page.evaluate(() => {
        const $audio = document.querySelector('.video-wrapper .vjs-tech')
        return $audio.src
    })
}

async function downloadAudio(audioUrl, output) {
    const filename = 'audio.webm'
    await download(audioUrl, output, { filename })
    return `${output}/${filename}`
}

async function createOutputDir(projectId, base = PROJECTS_DIR) {
    const dirPath = `${base}/${projectId}`

    if (fs.existsSync(dirPath)) {
        console.log('Project has already existed')
        return dirPath
    }

    await fs.promises.mkdir(dirPath, { recursive: true })
    return dirPath
}

function getLastPart(fullString) {
    const parts = fullString.split('/')

    return parts[parts.length - 1]
}

function getDuration(fileSrc) {
    return new Promise((resolve, reject) => {
        ffprobe(fileSrc, (err, data) => {
            if (err) {
                return reject(err)
            }

            return resolve(data.format.duration)
        })
    })
}

function mergeVideoAndAudio(outputDir, videoSrc = `${outputDir}/video.mp4`, audioSrc = `${outputDir}/audio.webm`, outputPath = `${outputDir}/${finalFileName}`) {
    console.log({videoSrc, audioSrc, outputPath})
    return new Promise((resolve, reject) => {
        FFmpeg(videoSrc)
            .addInput(audioSrc)
            .outputOptions('-c copy')
            .saveToFile(outputPath)
            .on('error', err => {
                console.error('Merging error: ', err)
                return reject(err)
            })
            .on('end', () => {
                console.log('Merging completed')
                return resolve(outputPath)
            })
    })
}
// start()
