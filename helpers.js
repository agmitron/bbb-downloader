const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder')
const download = require('download')
const FFmpeg = require('fluent-ffmpeg')
const { ffprobe } = require('fluent-ffmpeg')
const fs = require('fs')
const path = require('path')
const PROJECTS_DIR = 'projects'
const finalFileName = 'output.mkv'

const sleep = ms => new Promise(r => setTimeout(r, ms))

function checkIsOnlyDirExisted(bbb_url) {
  return fs.existsSync(path.join(PROJECTS_DIR, getLastPart(bbb_url)))
    && !fs.existsSync(path.join(PROJECTS_DIR, getLastPart(bbb_url), finalFileName))
}

function checkIsExisted(bbb_url) {
  const p = path.join(PROJECTS_DIR, getLastPart(bbb_url), finalFileName)
  return fs.existsSync(p)
}

async function recordScreen(outputDir, page, callbackDuringRecording = async () => { }) {
  const audioLocalSrc = await downloadAudio(await getAudioRemoteSrc(page), outputDir)
  const duration = Math.ceil(await getDuration(audioLocalSrc) * 1000)
  console.log({ duration })
  const recorder = new PuppeteerScreenRecorder(page)
  await recorder.start(`${outputDir}/video.mp4`);

  let counter = 0;
  const interval = setInterval(() => {
    counter += 10;
    console.log(`${outputDir} is running for ${counter} seconds`)
  }, 10 * 1000)

  await callbackDuringRecording()

  await sleep(duration)
  await recorder.stop()

  clearInterval(interval)
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
    console.log('Project folder has already existed')
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
  console.log({ videoSrc, audioSrc, outputPath })
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

module.exports = {
  checkIsOnlyDirExisted,
  checkIsExisted,
  recordScreen,
  openBBB,
  startWebinarVideo,
  downloadAudio,
  createOutputDir,
  getLastPart,
  getDuration
}
