// Importing necessary libraries and modules
const mongoose = require('mongoose');            // MongoDB ODM library
const Customers = require('./customer');         // Imported MongoDB model for 'customers'
const express = require('express');              // Express.js web framework
const bodyParser = require('body-parser');       // Middleware for parsing JSON requests
const path = require('path');                    // Node.js path module for working with file and directory paths
const bcrypt = require("bcrypt");
const saltRounds = 5;
const password = "admin"
const session = require('express-session');
const uuid = require('uuid');

// Creating an instance of the Express application
const app = express();

// Setting the port number for the server
const port = 3000;

// MongoDB connection URI and database name
const uri =  "mongodb://root:your_password@localhost:27017";
mongoose.connect(uri, {'dbName': 'customerDB'});

app.use(session({
    cookie: {maxAge: 120000},
    secret: 'itsmysecret',
    res: false,
    saveUninitialized: true,
    genid: () => uuid.v4()
}));
// Middleware to parse JSON requests
app.use("*", bodyParser.json());

// Serving static files from the 'frontend' directory under the '/static' route
app.use('/static', express.static(path.join(".", 'frontend')));

// Middleware to handle URL-encoded form data
app.use(bodyParser.urlencoded({ extended: true }));

// POST endpoint for user login
app.post('/api/login', async (req, res) => {
    const data = req.body;
    console.log(data);
    let user_name = data['user_name'];
    let password = data['password'];

    // Querying the MongoDB 'customers' collection for matching user_name and password
    const documents = await Customers.find({ user_name: user_name, password: password });

    // If a matching user is found, set the session username and serve the home page
    if (documents.length > 0) {
        let result = await bcrypt.compare(password, documents[0]['password']);
        if(true){
            const genidValue = req.sessionID;
            res.cookie('username', user_name);
            res.sendFile(path.join(__dirname, 'frontend', 'home.html'))
            res.send("User Logged In");
        }else{
            res.send("Password Incorrect! Try again");

        }
    } else {
        res.send("User Information incorrect");
    }
});

app.get('/api/logout', async (req, res)=>{
    req.session.destroy((err)=>{
        if(err){
            console.error(err);
        }else{
            res.cookie('username', '', {expires: new Date(0)})
            res.redirect("/");
        }
    })
})

// POST endpoint for adding a new customer
app.post('/api/add_customer', async (req, res) => {
    const data = req.body;
    const documents = await Customers.find({ user_name: data['user_name']});
    if (documents.length > 0) {
        res.send("User already exists");
    }

    let hashedpwd = bcrypt.hashSync(data['password'], saltRounds)


    
    // Creating a new instance of the Customers model with data from the request
    const customer = new Customers({
        "user_name": data['user_name'],
        "age": data['age'],
        "password": hashedpwd,
        "email": data['email']
    });

    // Saving the new customer to the MongoDB 'customers' collection
    await customer.save();

    res.send("Customer added successfully")
});

// GET endpoint for the root URL, serving the home page
app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'home.html'));
});

// Starting the server and listening on the specified port
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
