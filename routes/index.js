function routers(app) {
  app.get('/', function (req, res) {
    res.redirect('/home')
  })
  app.use('/users', require('./users'))
  app.use('/home', require('./home'))

  /**
   * [404 page handle]
   * @param  {[type]} req  [requires]
   * @param  {[type]} res) { if (!res.headersSent) {res.status(404).render('404')    }  } [description]
   * @return {[type]}      [response]
   */
  app.use(function (req, res) {
    if (!res.headersSent) {
      res.status(404).render('404')
    }
  })
}

module.exports = routers;
