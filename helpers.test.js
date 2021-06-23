const helpers = require('./helpers')

describe('checkIsOnlyDirExisted', () => {
  const bbb_url = 'https://vconf.tomtit-tomsk.ru/playback/presentation/2.3/4293a04256d7a188dd77b1f709369ec0679c9832-1622267043704'
  test(`must return false because dir haven't existed yet`, done => {
    expect(helpers.checkIsOnlyDirExisted(bbb_url)).toEqual(false)
    done()
  })


})
