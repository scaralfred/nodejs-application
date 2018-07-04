var mongoose = require('mongoose');

var School = mongoose.model('School', {
  classSettings: {
    type: Object,
    required: true
  },
//    _creator: {
//      type: mongoose.Schema.Types.ObjectId,
//      required: true
//  }
});

//School.methods.generateSchool = function () {
//    var newSchool = {
//        starCounter: 0,
//        classList: {},
//        playerPhoto: {}
//    }
//    return newSchool
//}

module.exports = {School};
