const express = require('express');
const cors = require('cors'); //when the clients aren't on the server

const secret = "frenchfriestastegood!"; //for tokens - should be stored as an enviroment variable
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const app = express(); //server-app
const pg = require('pg');
const dbURI="postgres://pexmmwdyftxqmm:f8ff838ef3f9028287453919a7a4069cf36cda0afa467cf6573ef8eb99f67032@ec2-46-137-173-221.eu-west-1.compute.amazonaws.com:5432/d1fpt2lmsoq7v7" + "?ssl=true";
const connstring = process.env.DATABASE_URL || dbURI;
const pool = new pg.Pool({connectionString: connstring});

let logindata;

// middleware ------------------------------------
app.use(cors()); //allow all CORS requests
app.use(express.json()); //for extracting json in the request-body
app.use('/', express.static('client')); //for serving client files
app.use("/travels", protectEndpoints);
app.use("/expenses", protectEndpoints);

//function used for protecting endpoints 
function protectEndpoints(req, res, next) {

    let token = req.headers["authorization"];

    if (token) {
        try {
            logindata = jwt.verify(token, secret);
            next();
        } catch (err) {
            res.status(403).json({ msg: "Not a valid token" });
        }
    }
    else {
        res.status(403).json({ msg: "No token"});
    }
}

// -----------------------------------------------

// endpoint - travels GET ----------------------------------
app.get('/travels', async function (req, res) {
    
    let sql = "SELECT * FROM travels WHERE userid = $1";
    let values = [logindata.userid];
    try {
        let result = await pool.query(sql);
        res.status(200).json(result.rows); //send response  
    }
    catch(err) {
        res.status(500).json(err); //send response  
    }


});

// endpoint POST ---------------------------------
app.post('/travels', async function (req, res) {
    // code here... 
    let updata = req.body;

    let sql = 'INSERT INTO travels (id, destination, date, km, description, userid) VALUES(DEFAULT, $1, $2, $3, $4, $5) RETURNING *';
    let values = [updata.dest, updata.date, updata.km, updata.descr, updata.userid];

    try {
        let result = await pool.query(sql, values);

        if (result.rows.length > 0) {
            res.status(200).json({msg: "insert ok"}); //send response  
        }
        else {
            throw "Insert failed";
        }
    }

    catch(err){

        res.status(500).json({error: err}); //send error resposonse
    }
  
});

// endpoint - users POST ---------------------------------
app.post('/users', async function (req, res) {

    let updata = req.body; //thedata sent from the client

    //hashing the password before it is stored in the DB
    let hash = bcrypt.hashSync(update.password, 109);

    let sql = 'INSERT INTO users (id, email, pswhash) VALUES(DEFAULT, $1, $2) RETURNING *';
    let values = [updata.dest, updata.date, updata.km, updata.descr, updata.userid];

    try {
        let result = await pool.query(sql, values);

        if (result.rows.length > 0) {
            res.status(200).json({msg: "insert ok"}); //send response  
        }
        else {
            throw "Insert failed";
        }
    }

    catch(err){

        res.status(500).json({error: err}); //send error resposonse
    }

});

// endpoint - auth (login) POST ---------------------------------
app.post('/auth', async function (req, res) {

    let updata = req.body; //the data sent from the client

    //get the user from the database
    let sql = "SELECT * FROM users WHERE email = $1";
    let values = [updata.email];

    try {
        let result = await pool.query(sql, values);

        if (result.rows.length == 0) {
            res.status(400).json({msg: "User doesn't exist"}); 
        }
        else {
            let check = bcrypt.compareSync(updata.password, result.rows[0].pswhash);
            if (check == true) {
                let payload = {userid: result.rows[0].id};
                let tok = jwt.sign(payload, secret, {expiresIn: "12h"}); //create token
                res.status(200).json({email: result.rows[0].email, userid: result.rows[0].id, token: tok});
            }
            else {
                res.status(400).json({msg: "Wrong password"});
            }
        }
    }
    catch(err){

        res.status(500).json({error: err}); //send error resposonse
    }

});

// start server -----------------------------------
var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log('Server listening on port 3000!');
});

// endpoint - travels DELETE ----------------------------------
app.delete('/travels', async function (req, res) {

    let updata = req.body;

    let sql ='DELETE FROM travels WHERE id = $1 RETURNING *';
    let values = [updata.travelID];

    try {
        let result = await pool.query(sql, values);

        if (result.rows.length > 0) {
            res.status(200).json({msg: "Delete ok"}); //send response  
        }
        else {
            throw "Delete failed";
        }
    }

    catch(err){
        
        res.status(500).json({error: err}); //send error resposonse
    }
  
});


