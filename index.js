const express = require("express")
const app = express()

app.listen(8080)
app.set('view engine', "ejs")
app.get('/',(req, res)=> {
    app.render('home')
})