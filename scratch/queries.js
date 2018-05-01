const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');

mongoose.connect(MONGODB_URI)
  .then(() => {
    const {title, content} = {title: 'test', content: 'testytest'};
    if (!title) {
      console.log('yo, aint no title in der!');
      // const err = new Error('Missing `title` in request body');
      // err.status = 400;
      // return next(err);
    }

    return Note.create({title, content,})
      .then(results => {
        console.log(results);
      })
      .catch(console.error);
  })
  .then(() => {
    return mongoose.disconnect()
      .then(() => {
        console.info('Disconnected');
      });
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });