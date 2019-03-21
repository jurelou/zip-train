const express = require('express')
const path = require('path')
const api = require('./api')
const log = require('./logger')

const app = express()


app.set('port', process.env.PORT || 4000)

app.set('view engine', 'pug')
app.set('views', path.resolve(__dirname, '../app'))



app.use("/static", express.static(path.join(__dirname, "/../public/pictures/")));
console.log(path.join(__dirname, "/../public"))
app.use('/css', express.static(path.resolve(__dirname, '../app/assets/css')))
app.use('/dist', express.static(path.resolve(__dirname, '../app/dist')))
app.use('/js', express.static(path.resolve(__dirname, '../app/assets/js')))

app.use(api)

const server = app.listen(app.get('port'), () => {
  log.info(`Express server started on http://localhost:${server.address().port}`)
})

module.exports = server
