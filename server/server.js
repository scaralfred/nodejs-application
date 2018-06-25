// Require config file
require('./config/config');

// Required the installed npm packages +  MongoDB and Mongoos
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate')

// SET UP EXPRESS AND PORT NUMBER 

var app = express();
const port = process.env.PORT;

// MIDDLEWARES
app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// POST /todos

app.post('/todos', authenticate, (req, res) => {
  var todo = new Todo({
    text: req.body.text,
    _creator: req.user._id
  });

  todo.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});

// GET ALL TODOS

app.get('/todos', authenticate, (req, res) => {
  Todo.find({
      _creator: req.user._id
  }).then((todos) => {
    res.send({todos});
  }, (e) => {
    res.status(400).send(e);
  });
});

// GET A SINGLE TODO

app.get('/todos/:id', authenticate, (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findOne({
      _id: id,
      _creator: req.user._id 
  }).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }

    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  });
});

// DELETE A SINGLE TODO

app.delete('/todos/:id', authenticate, (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findOneAndRemove({
     _id: id,
     _creator: req.user._id
  }).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }

    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  });
});

// UPDATE A SINGLE TODO

app.patch('/todos/:id', authenticate, (req, res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ['text', 'completed']);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findOneAndUpdate({_id: id, _creator: req.user._id}, {$set: body}, {new: true}).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }

    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  })
});

/// POST /users

app.post('/users', (req, res) => {
//  var user = new User({
//    email: req.body.email,
//    password: req.body.password
//  });   OR YOU CAN ALSO USE THE LODASH METHOD => Pick   
var body = _.pick(req.body, ['email','password']);
var user = new User(body); 

  user.save().then(() => {
     return user.generateAuthToken();
  }).then((token) => {
//    res.header('x-auth', token).send(user);
    res('idToken', token).send(user);
  }).catch((e) => {
    res.status(400).send(e);
  });
});

// GET ROUTE

app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user)
});

// POST /users/login {email, password}

app.post('/users/login', (req, res) => {
   var body = _.pick(req.body, ['email','password']);
     
    User.findByCredentials(body.email, body.password).then((user) => {
       return user.generateAuthToken().then((token) => {   
           //    res.header('x-auth', token).send(user);
                res('idToken', token).send(user);
        });
    }).catch((e) => {
        res.status(400).send();
    });
});

// DELETE => Logout Users

app.delete('/users/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
      res.status(200).send();
  }, () => {
      res.status(400).send();
  }) 
});

// Express Listen

app.listen(port, () => {
  console.log(`Started up at port ${port}`);
});

module.exports = {app};
