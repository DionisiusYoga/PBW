const express = require("express")
const app = express()

app.listen(8080)
app.set('view engine', "ejs")
app.get('/',(req, res)=> {
    res.render('login')
})
app.get('/home',(req, res)=>{
    res.render('home')
})