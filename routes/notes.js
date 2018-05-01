'use strict';

const express = require('express');
const router = express.Router();


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
      res.json(results);
      
    })
    .catch(next);
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const {id} = req.params;
  if (id.length !== 24) return next();

  return Note.findById(id)
    .then(results => {
      if (results) return res.json(results);
      next();
    })
    .catch(next);
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
      res.location(`${req.originalUrl}/${results.id}`).status(201).json(results);
    })
    .catch(next);

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
      next();
    })
    .catch(next);
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const {id} = req.params;
  if (id.length !== 24) return next();

  return Note.findByIdAndRemove(id)
    .then(() => {
      res.sendStatus(204);
    })
    .catch(next);
});

module.exports = router;