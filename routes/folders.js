'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require ('mongoose');
const Folder = require('../models/folder');
const Note = require('../models/note');

router.get('/', (req, res, next) => {
  const {searchTerm} = req.query;
  let filter ={};
  if (searchTerm) {
    filter = {name: {$regex: searchTerm, $options: 'i' }};
  }
  Folder.find(filter)
    .then(result => {
      res.json(result);
    })
    .catch(err => next(err));
});

router.get('/:id', (req, res, next) => {
  const {id} = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return next();

  return Folder.findById(id)
    .then(result => {
      if (result) return res.json(result);
      return next();
    })
    .catch(err => next(err));
});

router.post('/', (req, res, next) => {
  const folder = req.body;
  if (!folder.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  return Folder.create(folder)
    .then(results => {
      return res.location(`${req.originalUrl}/${results.id}`).status(201).json(results);
    })
    .catch(err => {
      if(err.code === 11000) {
        err = new Error('Folder name already exists');
        err.status = 400;
      }
      return next(err);
    });
});

router.put('/:id', (req, res, next) => {
  const {id} = req.params;
  const folder = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) return next();

  if(!req.body.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  return Folder.findByIdAndUpdate(id, folder, {new: true})
    .then(result => {
      if (result) return res.json(result);
      return next();
    })
    .catch(err => {
      if(err.code === 11000) {
        err = new Error('Folder name already exists');
        err.status = 400;
      }
      return next(err);
    });
});

router.delete('/:id', (req, res, next) => {
  const {id} = req.params;

  return Promise.all([
    Folder.findOneAndRemove(id),
    Note.updateMany({folderId: id}, {folderId: null})
  ])
    .then(() => res.sendStatus(204))
    .catch(err => next(err));
});

module.exports = router;