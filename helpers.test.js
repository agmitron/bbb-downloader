const helpers = require('./helpers')
const fs = require('fs')

const bbb_url = 'https://vconf.tomtit-tomsk.ru/playback/presentation/2.3/4293a04256d7a188dd77b1f709369ec0679c9832-1622267043704'
const PROJECTS_DIR = 'test_projects'
const projectId = helpers.getLastPart(bbb_url)

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

})
