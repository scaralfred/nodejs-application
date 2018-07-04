// Require config file
require('./config/config');

// Required the installed npm packages +  MongoDB and Mongoos
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {School} = require('./models/school')
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate')

// SET UP EXPRESS AND PORT NUMBER 

var app = express();
const port = process.env.PORT || 5000;

// MIDDLEWARES
app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token, Authorization, x-auth' );
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Expose-Headers', 'X-Api-Version, x-auth, X-Request-Id, X-Response-Time');
    res.setHeader('Access-Control-Max-Age', '1000');
    next();
});

// POST CLASS //

app.post('/school', authenticate, (req,res) => {
    var school = new School({
         classSettings: req.body,
        _creator: req.user._id
    })
  school.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});

// UPDATE A SINGLE CLASS  //

app.patch('/school/:id', authenticate, (req, res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ['classSettings']);

  School.findOneAndUpdate({_id: id}, {$set: body}, {new: true}).then((school) => {
    if (!school) {
      return res.status(404).send();
    }

    res.send({school});
  }).catch((e) => {
    res.status(400).send();
  })
});

// GET A SINGLE CLASS

app.get('/school/:id', (req, res) => {
  var id = req.params.id;

  School.findOne({
      _id: id
  }).then((school) => {
    if (!school) {
      return res.status(404).send();
    }

    res.send({school});
  }).catch((e) => {
    res.status(400).send();
  });
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
    var newSchool = {
        starCounter: 0,
        classList: [],
        playerPhoto: []
    }
    
    var school = new School({
         classSettings: newSchool
    })
  
    var user = new User({
        email: req.body.email,
        password: req.body.password,
        schoolID: school._id
    });  // OR YOU CAN ALSO USE THE LODASH METHOD => var body = _.pick(req.body, ['email','password']);
    
  school.save().then(()=> {
      return user.save();
  }).then(() => {
     return user.generateAuthToken();
  }).then((token) => {
    res.header('x-auth', token).send({user, school});
  }).catch((e) => {
    res.status(400).send(e);
  });
});


app.post('/users/login', (req, res) => {
   var body = _.pick(req.body, ['email','password']);
    
    User.findByCredentials(body.email, body.password)
    .then((userFound) => user = userFound )
    .then((user) => School.findOne({ _id: user.schoolID }) )
    .then((school) => schoolSettings = school.classSettings )
    .then(() => user.generateAuthToken()
        .then((token) => {   
        res.header('x-auth', token).send({user, schoolSettings}); 
        })
    )
    .catch((e) => {
        res.status(400).send();
    });

});

// GET ROUTE

app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user)
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
