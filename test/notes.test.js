const chai = require('chai');
const chaiHTTP = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const {TEST_MONGODB_URI} = require('../config');
const Note = require('../models/note');
const seedNotes = require('../db/seed/notes');

const expect = chai.expect;
chai.use(chaiHTTP);

describe('Noteful Api notes route', function(){

  before(function () {

    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => {
        return mongoose.connection.db.dropDatabase();
      });
  });

  beforeEach(function () {

    return Note.insertMany(seedNotes);
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });


  

  describe('Get /api/notes', function() {
    
    it('should return all the notes', function() {
      let res;
      return chai.request(app).get('/api/notes')
        .then(_res => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          res.body.forEach(note => {
            expect(note).to.be.a('object');
            expect(note).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
          });
          return Note.count();
        })
        .then(data => {
          expect(res.body).to.have.length(data);
        });
    });

    it('should return correct search results for a searchTerm query', function () {
      
      return Promise.all([
        Note.find({$or : [{title: {$regex: 'lady gaga'}, content: {$regex: 'lady gaga'}}]}),
        chai.request(app).get('/api/notes?searchTerm=lady gaga')
      ])
        .then(([data, res])=> {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.have.length(1);
          expect(res.body.title).to.eql(data.title);
          expect(res.body.content).to.eql(data.content);
        });
    });

    it('should return an empty array for an incorrect query', function() {
      let searchTerm = 'blahblahblah';
      return Promise.all([
        Note.find({$or: [{title: {$regex: searchTerm}}, {content: {$regex: searchTerm}}]}),
        chai.request(app).get(`/api/notes?searchTerm=${searchTerm}`)
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

  });

  describe('GET /api/notes/:id', function () {
    it('should return correct note', function () {
      let data;
      return Note.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .get(`/api/notes/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
        });
    });
    
    it('should return 404 for incorrect id', function() {
      return chai.request(app).get('/api/notes/notanid')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });

  describe('POST /api/notes', function () {
    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'title': 'The best article about cats ever!',
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
      };

      let res;
      // 1) First, call the API
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
          // 2) then call the database
          return Note.findById(res.body.id);
        })
        // 3) then compare the API response to the database results
        .then(data => {
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
        });
    });

    it('should return 400 if request does not include a title', function() {
      return chai.request(app).post('/api/notes/')
        .send({content: 'blahblah'})
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eql('Missing `title` in request body');
        });
    });
  });

  describe('put /api/notes/:id', function() {
    it('it should update a note if given a valid id and update information', function() {
      let id = '000000000000000000000002';
      let updatObj = {
        title: 'new title',
        content: 'a bunch of words'
      };
      let res;
      return chai.request(app).put(`/api/notes/${id}`)
        .send(updatObj)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.id).to.eql(id);
          expect(res.body).to.have.keys('title', 'content', 'id', 'createdAt', 'updatedAt');
          return Note.findById(id);
        })
        .then(data => {
          expect(res.body.content).to.eql(data.content);
          expect(res.body.title).to.eql(data.title);
          expect(res.body.id).to.eql(data.id);
        });
    });

    it('should return 404 with an incorrect/invalid id', function() {
      let updatObj = {
        title: 'new title',
        content: 'a bunch of words'
      };
      return chai.request(app).put('/api/notes/notanid')
        .send(updatObj)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should return 400 with message "Missing `title` in request body" if a title is not included', function() {
      let id = '000000000000000000000002';
      let updatObj = {
        content: 'a bunch of words'
      };
      return chai.request(app).put(`/api/notes/${id}`)
        .send(updatObj)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eql('Missing `title` in request body');
        });
    });
  });
  
  describe('DELETE /api/notes/:id', function() {
    it('should return 204 if given a valid id', function() {
      let id = '000000000000000000000002';
      return chai.request(app).delete(`/api/notes/${id}`)
        .then(res => {
          expect(res).to.have.status(204);
          return Note.find({id: id});
        })
        .then(data => {
          expect(data).to.be.a('array');
          expect(data).to.have.length(0);
        });
    });

    it('should return 404 for a malformed id', function() {
      return chai.request(app).delete('/api/notes/badid')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });




});

