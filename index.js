const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')
const express = require('express')
const app = express()
const cors = require('cors')

const {
  checkIsExisted,
  checkIsOnlyDirExisted,
  recordScreen,
  openBBB,
  startWebinarVideo,
  createOutputDir,
  getLastPart,
  mergeVideoAndAudio
} = require('./helpers')

const port = 3000
app.listen(port, () => console.log(`App started on port ${port}`))

app.use(cors())

const validateURL = url => url.includes('playback/presentation/')

app.get('/', async (req, res) => {
  try {
    const { bbb_url } = req.query

    if (!bbb_url) {
      return res.status(500).json({
        message: 'bbb_url is required in query parameters'
      })
    }

    if (!validateURL(bbb_url)) {
      return res.status(500).json({
        message: 'bbb_url must be like <domain>/playback/presentation/<v>/<id>'
      })
    }

    if (checkIsExisted(bbb_url)) {
      console.log('The recording exists')
      const p = path.join(__dirname, PROJECTS_DIR, getLastPart(bbb_url), finalFileName)
      console.log({ p })
      return res.download(p)
    }

    if (checkIsOnlyDirExisted(bbb_url)) {
      return res.status(200).json({
        message: 'The recording is still preparing.',
        status: 'PREPARING'
      })
    }

    start(bbb_url)

    return res.status(200).json({
      message: 'The recording has started preparing.',
      status: 'PREPARING'
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      error
    })
  }
})

app.get('/check', (req, res) => {
  const { bbb_url } = req.query

  if (!bbb_url) {
    return res.status(500).json({
      message: 'bbb_url is required in query parameters'
    })
  }

  const existed = checkIsExisted(bbb_url)

  if (checkIsOnlyDirExisted(bbb_url)) {
    return res.status(200).json({
      result: existed,
      status: 'PREPARING'
    })
  }

  return res.status(200).json({
    result: existed,
    status: existed
      ? 'READY'
      : 'ABSENT'
  })
})

const start = async (bbb_url) => {
  try {
    const browser = await puppeteer.launch()
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
