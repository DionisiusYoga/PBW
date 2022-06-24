const express = require("express")
const app = express()
const mysql = require("mysql")
const bodyParser = require('body-parser')


const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'tugasbesar'
});
const getUser = conn => {
    return new Promise((resolve,reject) => {
        conn.query('SELECT * FROM users', (err,result)=>{
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}
const getUserPost= (conn,userID)=>{
    return new Promise((resolve,reject)=>{
        conn.query('SELECT * FROM thread WHERE author_id LIKE'%{userID}%'', (err,result)=>{
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}
const getPost = conn => {
    return new Promise((resolve,reject) => {
        conn.query('SELECT * FROM thread', (err,result)=>{
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}
const
const cekLogin = (conn,user,pass)=> {
    return new Promise((resolve,reject) => {
        conn.query('SELECT nickname,pass FROM users WHERE nickname LIKE '%{user}%'AND pass LIKE' %{pass}%'',(err,result)=> {
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}

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
app.use(bodyParser())
app.get('/',async(req, res)=> {
    const conn = await dbConnect();
    
    res.render('login')
})
app.post('/',async(req, res)=>{
    const conn = await dbConnect();
    var username = req.body.user;
    var password = req.body.pass;
    const checkUser = cekLogin(conn,username,password);
    var sql = 'SELECT nickname,pass FROM users WHERE nickname LIKE '%{username}%'AND pass LIKE' %{password}%''
    conn.query(sql,[username,password],(err,result) => {
        if(err){throw err}
        if (result.length>0){
            req.session.loggedIn = true;
            req.session.username = username;
            req.session.name = results[0].name;
            req.session.role = result[0].role;
            req.session.status = result[0].status;
            req.session.id = result[0].id;
            req.session.join = result[0].joined_date;

            if(results[0].role == 'admin'){
                res.redirect('/homeAdmin');
            } else if(results[0].role == 'mod') {
                res.redirect('/homeMod');
            } else {
                res.redirect('/home');
            }
        } else if(username==""||password==""){
            req.flash('message','Tolong isi username dan password');
            res.redirect('/');
        } else {
            req.flash('message','Username atau Password salah' )
            res.redirect('/')
        }
    })
})
app.get('/home',async(req, res)=>{
    const conn = await dbConnect();
    conn.release();
    var name = req.session.name;
    var pass = req.session.pass;
    if (req.session.loggedIn){
        res.render('home')
    } else {
        req.flash('message', "LOGIN TERLEBIH DAHULU")
        res.redirect('/')
    }
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
app.get('/homeAdmin',(req, res)=>{
    res.render('homeAdmin')
})
app.get('/homeMod',(req, res)=>{
    const conn = await dbConnect();
    let posts = await getPost(conn);

    res.render('homeMod',{posts})
})
app.get('/profileMod',(req, res)=>{
    res.render('modProfile')
})
app.get('/profileAdmin',(req, res)=>{
    res.render('modAdmin')
})