const helpers = require('./helpers')
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')
const recordScreen = require('record-screen')
const bbb_url = 'https://vconf.tomtit-tomsk.ru/playback/presentation/2.3/4293a04256d7a188dd77b1f709369ec0679c9832-1622267043704'
const PROJECTS_DIR = 'test_projects'
const projectId = helpers.getLastPart(bbb_url)

jest.setTimeout(30000)

describe('initial state', () => {
  fs.rmdirSync(PROJECTS_DIR, { recursive: true })

  test(`validate bbb_url to be in a correct format `, () => {
    expect(helpers.validateURL(bbb_url)).toBe(true)
  })

  test(`projectId takes itself correctly`, () => {
    expect(bbb_url.includes(helpers.getLastPart(projectId))).toBe(true)
  })

  test(`must return false because dir haven't existed yet`, () => {
    expect(helpers.checkIsOnlyDirExisted(bbb_url, PROJECTS_DIR)).toEqual(false)
    expect(helpers.checkIsExisted(bbb_url, PROJECTS_DIR)).toEqual(false)
  })
})

describe('preparing', () => {
  test('[creating an output dir] must create an output dir and return path to it', async () => {
    expect(await helpers.createOutputDir(projectId, PROJECTS_DIR))
      .toEqual(`${PROJECTS_DIR}/${projectId}`)
    expect(helpers.checkIsOnlyDirExisted(bbb_url, PROJECTS_DIR)).toEqual(true)
  })

  test('[creating an output dir] output dir must be empty', () => {
    expect(helpers.checkIsOnlyDirExisted(bbb_url, PROJECTS_DIR)).toEqual(true)
  })
})

describe('downloading stuff', () => {
  let page
  let audioRemoteSrc

  beforeEach(async () => {
    const browser = await puppeteer.launch()
    page = await browser.newPage()
    await page.goto(bbb_url)
  })

  test(`[downloading audio] getAudioRemoteSrc must return a string containing the URL to the audio file with '.webm' extension`, async () => {
    audioRemoteSrc = await helpers.getAudioRemoteSrc(page)
    expect(typeof audioRemoteSrc).toBe('string')
    expect(audioRemoteSrc.includes('.webm')).toBe(true)
  })

  test(`[downloading audio] audio must be downloaded and saved into '${PROJECTS_DIR}' directory`, async () => {
    const downloadedAudioPath = await helpers.downloadAudio(audioRemoteSrc, path.join(PROJECTS_DIR, projectId))
    expect(typeof downloadedAudioPath).toBe('string')
    expect(downloadedAudioPath.includes('.webm')).toBe(true)
    expect(fs.existsSync(downloadedAudioPath)).toBe(true)
  })

  test(`[downloading video] 10 sec video must be recorded and saved into '${PROJECTS_DIR}' directory`, async () => {
    const dir = `${PROJECTS_DIR}/${projectId}`
    await helpers.startWebinarVideo(page)
    await helpers.recordScreen(dir, page, 10000)

    const fileSrc = `${dir}/video.mp4`

    expect(fs.existsSync(fileSrc)).toBe(true)
    expect(await helpers.getDuration(fileSrc)).toBeGreaterThan(5)
  })
})

describe('merging video', () => {
  test(`mergeVideoAndAudio must create one more file with default file path '${PROJECTS_DIR}/${projectId}/output.mkv'`, async () => {
    expect(await helpers.mergeVideoAndAudio(`${PROJECTS_DIR}/${projectId}`)).toBe(`${PROJECTS_DIR}/${projectId}/output.mkv`)
  })
})

describe('helper functions', () => {
  test('getLastPart return "how" on https://stackoverflow.com/questions/24090270/how', () => {
    expect(helpers.getLastPart('https://stackoverflow.com/questions/24090270/how')).toBe('how')
  })

  test('getDuration must return a number of seconds of the media duration', async () => {
    expect(typeof await helpers.getDuration(`${PROJECTS_DIR}/${projectId}/video.mp4`)).toBe('number')
  })

  test('validateURL must check is the URL including "playback/presentation/" to be sure it\'s a correct BBB recording URL', () => {
    expect(helpers.validateURL('https://vconf.tomtit-tomsk.ru/playback/presentation/2.3/4293a04256d7a188dd77b1f709369ec0679c9832-1622267043704')).toBe(true)
    expect(helpers.validateURL('https://stackoverflow.com/questions/49603939/message-async-callback-was-not-invoked-within-the-5000-ms-timeout-specified-by')).toBe(false)
  })
})
