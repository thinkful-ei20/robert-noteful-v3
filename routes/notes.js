'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Note = require('../models/note');



/* ========== GET/READ ALL ITEM ========== */
router.get('/', (req, res, next) => {

  const {searchTerm} = req.query;
  let filter = {};
  let search;

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    search = { $regex: re };
    filter = {$or: [{title: search}, {content: search}]};
  }

  return Note.find(filter)
    .sort('created')        
    .then(results => {
      return res.json(results);
      
    })
    .catch(err => next(err));
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const {id} = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return next();

  return Note.findById(id)
    .then(results => {
      if (results) return res.json(results);
      return next();
    })
    .catch(err => next(err));
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {

  const {title, content} = req.body;
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  return Note.create({title, content,})
    .then(results => {
      return res.location(`${req.originalUrl}/${results.id}`).status(201).json(results);
    })
    .catch(err => next(err));

});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {

  const {id} = req.params;
  const {title, content} = req.body;

  if (id.length !== 24) return next();

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  return Note.findByIdAndUpdate(id, {title, content, updatedAt: Date.now()}, {new: true, upsert: true})
    .then(results => {
      if (results) return res.json(results);
      return next();
    })
    .catch(err => next(err));
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const {id} = req.params;
  if (id.length !== 24) return next();

  return Note.findByIdAndRemove(id)
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => next(err));
});

module.exports = router;