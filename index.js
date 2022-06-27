const express = require("express")
const app = express()
const mysql = require("mysql")
const bodyParser = require('body-parser')
const session = require('express-session')
const flash = require('connect-flash');


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
const pool = mysql.createPool({
    host:'127.0.0.1',
    user:'root',
    password:'',
    database:'tugasbesar'
})

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
        conn.query(`SELECT * FROM thread WHERE author_id = ${userID}`, (err,result)=>{
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
const getCategory = conn => {
    return new Promise((resolve,reject) => {
        conn.query('SELECT name FROM thread_categories',(err,result)=>{
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}


const signup= (conn,username,password,email,fullname,date) =>{
    return new Promise((resolve,reject)=>{
        conn.query('INSERT INTO users (name,nickname,email,pass,role,joined_date,status) VALUES ("'%{fullname}% '", "'%{username}% '", "'%{email}%'","'%{password}%'","user","'%{date}%'","normal")', (err,result)=>{
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}
const insertUser= (conn,data)=>{
    return new Promise((resolve,reject) => {
        conn.query('INSERT INTO users SET ?' ,data,(err,result)=> {
            if(err){
                reject(err);
            } else {
                resolve(result.insertId);
            }
        })
    })
}
const cekLogin = (conn,username,password)=> {
    return new Promise((resolve,reject) => {
        conn.query(`SELECT nickname, pass FROM users WHERE nickname LIKE '${username}' AND pass LIKE '${password}'`,(err,result)=> {
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}
const updateStatus = (conn,postID,userID)=>{
    return new Promise((resolve,reject)=>{
        conn.query('UPDATE thread SET lock_by = '%{userID}%' WHERE postID LIKE '%{postID}%'', (err,result)=>{
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}
const getBannedUser= conn=>{
    return new Promise((resolve,reject) => {
        conn.query('SELECT name,id FROM users WHERE status LIKE banned',(err,result)=> {
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}
const getLockedThread= (conn,modID)=>{
    return new Promise((resolve,reject) => {
        conn.query('SELECT title,id,author_id FROM users WHERE lock_by LIKE'%{modID}%'',(err,result)=> {
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}




app.use(session({resave: true ,secret: '123456' , saveUninitialized: true}))
app.listen(8080)
app.set('view engine', "ejs")
app.use(bodyParser())
app.use(flash());



app.get('/',async(req, res)=> {
    const conn = await dbConnect();
    res.render('login')
})
app.post('/',async(req, res)=>{
    const conn = await dbConnect(); 
    var username = req.body.user;
    var password = req.body.pass;
    const cekUser = cekLogin(conn,username,password);
    var sql = `SELECT * FROM users WHERE nickname = '${username}' AND pass = '${password}'`
    conn.query(sql,[username,password],(err,results) => {
        if(err){
            throw err;
        }
        if (results.length>0){
            req.session.loggedIn = true;
            req.session.username = username;
            req.session.name = results[0].name;
            req.session.role = results[0].role;
            req.session.status = results[0].status;
            req.session.userId = results[0].id;
            req.session.join = results[0].joined_date;

            if(results[0].role == 'admin'){
                res.redirect('/homeAdmin');
            } else if(results[0].role == 'mod') {
                res.redirect('/homeMod');
            } else {
                res.redirect('/home');
            }
        }else {
            req.flash('message','Username atau Password salah' )
            res.redirect('/')
        }
    })
})
app.get('/home',async(req, res)=>{
    const conn = await dbConnect();
    let posts = await getPost(conn);
    conn.release();
    if (req.session.loggedIn){
        var name = req.session.name;
        var pass = req.session.pass;
        res.render('home',{posts})
    } else {
        req.flash('message', "LOGIN TERLEBIH DAHULU")
        res.redirect('/')
    }
})
app.get('/postList',async(req, res)=>{
    const conn = await dbConnect();
    const categories = await getCategory(conn);
    res.render('postList',{categories})
})
app.get('/new',async(req, res)=>{
    res.render('newPost')
})
app.get('/profile',async(req, res)=>{
    const conn = await dbConnect();
    const posts = await getUserPost(conn,req.session.userId)
    var name = req.session.name;
    var date = req.session.join;
    var id = req.session.id;
    res.render('profile', {name,date,posts})
})
app.get('/homeAdmin',async(req, res)=>{
    const conn = await dbConnect();
    let posts = await getPost(conn);
    res.render('homeAdmin',{posts})
})
app.get('/homeMod',async(req, res)=>{
    const conn = await dbConnect();
    let posts = await getPost(conn);
    res.render('homeMod',{posts})
})
app.get('/upUser',async(req,res)=>{
    const conn = await dbConnect();
    res.render('updateUser')
})
app.get('/postlListAdmin',async(req,res)=>{
    const conn = await dbConnect();
    const categories = await getCategory(conn);
    res.render('updateUser',{categories})
})
app.get('/profileMod',async(req, res)=>{
    const conn = await dbConnect();
    let bannedUser = await getBannedUser(conn);
    res.render('modProfile')
})
app.get('/profileAdmin',async(req, res)=>{
    const conn = await dbConnect();
    var name = req.session.name;
    var users = await getUser(conn);
    res.render('adminProfile',{users,name});
})
app.get('/signup',async(req, res)=>{
    const conn = await dbConnect();
    res.render('signup');
})
app.post('/signup',async(req, res)=>{
    const conn = await dbConnect();
    var username = req.body.user;
    var password = req.body.pass;
    var email = req.body.email;
    var fullname = req.body.name;
    var date = new Date();
    var data = {name: fullname, nickname: username, email: email, pass: password, role: "user", joined_date: date, status: 'normal'}
    const signUps = await insertUser(conn,data);
    req.session.loggedIn = true;
    req.session.name = fullname;
    req.session.join = date;
    req.session.userId = signUps;
    res.redirect('home');
})

app.post('/new',async(req, res)=>{
    const conn = await dbConnect();
    var title = req.body.title;
    var content = req.body.content;
    var tags = req.body.tags;
    if(tags.value == 'Wholesome'){
        var tag = 1;
    } else if (tags.value == 'News'){
        var tag = 2;
    } else if (tags.value == 'Confession'){
        var tag = 3;
    } else {
        var tag = 4;
    }
    var date = new Date();
    var data = {title: title, created_date: date, lock_by: null, content: content, author_id: 1, category_id: tag}
    const newPost = 'INSERT INTO thread SET ?';
    conn.query(newPost, data, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
    });
    res.redirect('home');
})
app.get('/testing',async(req, res)=>{
    const conn = await dbConnect();
    res.send("test" + req.body.userId);
})