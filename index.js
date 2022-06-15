const express = require("express")
const app = express()
const mysql = require("mysql")

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'tugasbesar'
});

const dbConnect = () => {
    return new Promise((resolve,reject) => {
        pool.getConnection((err,conn) => {
            if(err){
                reject(err);
            }
            else{
                resolve(conn);
                
            }
        })
    })
}

app.listen(8080)
app.set('view engine', "ejs")
app.get('/',(req, res)=> {
    res.render('login')
})
app.get('/home',(req, res)=>{
    res.render('home')
})
app.get('/postList',(req, res)=>{
    res.render('postList')
})
app.get('/new',(req, res)=>{
    res.render('newPost')
})
app.get('/profile',(req, res)=>{
    res.render('profile')
})