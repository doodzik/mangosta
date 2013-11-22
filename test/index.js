var factory, Factory, mongoose, schema;

mongoose = require('mongoose');
connection = mongoose.connect('mongodb://localhost/mongoos-factory-test')

factory0Schema = new mongoose.Schema({
  "firstName": String,
  "lastName": String,
  "addr": String,
  "type": {"type": Number, "max": 10},
  "date": Date 
});

model = mongoose.model('factory0', factory0Schema);

Factory = require('../index.js');

factory1Schema = new mongoose.Schema({
  "test": String
});

model1 = mongoose.model('factory1', factory1Schema);

factory1 = new Factory(mongoose.model("factory1"), function() {
  return {
    test: "factory"
  };
});

factory = new Factory(mongoose.model("factory0"), function() {
  return {
    firstName: "d00d",
    lastName: "zik",
    addr: "isabela",
    type: 0,
    $child: {
      lola: function() {
        return {
          firstName: "lo",
          lastName: "la",
          $child: {
            la: function() {
              return {
                firstName: "la"
              };
            }
          }
        };
      },
      empty: function() {
        return {
          $child: {
            notempty: function() {
              return {
                firstName: "not",
                lastName: "empty"
              };
            }
          }
        };
      },
      object_child: {
        firstName: "object child"
      },
      current_date: function() {
        return {
          date: new Date()
        };
      },
      factory_ref: function() {
        var $docs;
        factory1.build({}, function(err, doc){
          $docs = doc;
        });
        return {
          firstName: $docs.test
        };
      },
    }
  };
});

describe('Factory', function(){
  afterEach(function(){
    model.find({}).remove();
    model1.find({}).remove();
  });

  after(function(){
    mongoose.connection.close();
  });

  describe('when stringMethods', function(){
    it('returns valid', function(){
      factory.stringMethods({test:"$len(12)"}).test.length.should.eql(12) 
    });
  });
  
  describe('when _newDoc', function(){
    it('returns valid', function(){
      var new_doc;
      new_doc = factory._newDoc({firstName: 'hoohhhoo', lastName: 'hiihhhii'}, {lastName: '$len(66)', type: 3});
      new_doc.lastName.length.should.eql(66);
      new_doc.type.should.eql(3);
      new_doc.constructor.name.should.eql('model');
    });
  });

  describe('when _getFactory', function(){
    it('return default factory', function(){
      var fctry, test_obj;
      test_obj = {firstName: "d00d", lastName: "zik", addr: "isabela", type: 0};
      fctry = factory._getFactory('default');
      fctry.should.eql(test_obj);
      fctry = factory._getFactory();
      fctry.should.eql(test_obj);
    });

    it('return 1st child', function(){
      var fctry, test_obj;
      fctry = factory._getFactory("lola");
      test_obj = {firstName: "lo", lastName: "la", addr: "isabela", type: 0};
      fctry.should.eql(test_obj);
    });

    it('return 2st child', function(){
      var fctry, test_obj;
      fctry = factory._getFactory("lola la");
      test_obj = {firstName: "la", lastName: "la", addr: "isabela", type: 0};
      fctry.should.eql(test_obj);
    });

    it('return 2st child with empty first', function(){
      var fctry, test_obj;
      fctry = factory._getFactory("empty notempty");
      test_obj = {firstName: "not", lastName: "empty", addr: "isabela", type: 0};
      fctry.should.eql(test_obj);
    });

    it('return child with obj not function', function(){
      var fctry, test_obj;
      fctry = factory._getFactory("object_child");
      test_obj = {firstName: "object child", lastName: "zik", addr: "isabela", type: 0};
      fctry.should.eql(test_obj);
    });

    it('invoke fx at build', function(){
      var fctry, fctry1, test_obj;
      fctry = factory._getFactory("current_date");
      setTimeout(function(){
        fctry1 = factory._getFactory("current_date");
        fctry1.date.should.not.be.above(fctry.date);
      }, 1000);
    });

    it('doesnt have proberty of child', function(){
      var fctry;
      fctry = factory._getFactory();
      fctry.should.not.have.property("$child");
    });

    it('return factory in factory', function(){
      var fctry, test_obj;
      fctry = factory._getFactory("factory_ref");
      fctry.firstName.should.eql("factory");
    });
  });

  describe('when _getNewDocs', function(){
    it('returns single default', function(){
      factory._getNewDocs({}, function(err, docs){
        docs.length.should.eql(1);
      });
    });

    describe('with num', function(){
      it('return defaults', function(){
        factory._getNewDocs({$doc:{$num: 20}}, function(err, docs){
          docs.length.should.eql(20);
        });
      });
      it('return defaults with default objs', function(){
        factory._getNewDocs({$docs:[{$num: 20},{},{}]}, function(err, docs){
          docs.length.should.eql(22);
        });
      });
    });
    describe('with factory', function(){
      it('return 1 child in doc', function(){
        factory._getNewDocs({$docs:[{$factory: 'lola'}]}, function(err, docs){
          docs[0].firstName.should.eql('lo');
        });
      });
      it('return 1 child with custom doc', function(){
        factory._getNewDocs({$docs:[{$factory: 'lola', firstName:"dodo"}]}, function(err, docs){
          docs.length.should.eql(1);
          docs[0].firstName.should.eql('dodo');
          docs[0].lastName.should.eql('la');
        });
      });
      it('default factory with $doc factory 2nd child', function(){
        factory._getNewDocs({$factory: 'lola', $doc:{$factory: 'empty notempty'}}, function(err, docs){
          docs.length.should.eql(1);
          docs[0].firstName.should.eql('not');
          docs[0].lastName.should.eql('empty');
        });
      });
    });
  });

  describe('when build', function(){
    describe('with single document', function(){
      it('without options', function(){
        factory.build({}, function(err, doc){
          doc.should.have.property('_id');
        });
      });
      it('with options', function(){
        factory.build({"$doc":{"type": 9}}, function(err, doc){
          doc.should.have.property('_id');
          doc.type.should.eql(9);
        });
      });    
    });

    describe('with multi document', function(){
      it('create default', function(){
        factory.build({$doc:{$num: 4}}, function(err, docs){
          docs.length.should.be.equal(4);
        });
      });
      it('create 2 default and 2 custom', function(){
        factory.build({$docs:[{addr: 'hallo'}, {type: 3}, {$num: 2}]}, function(err, docs){
          docs.length.should.be.equal(4);
          docs[0].should.have.property('addr', 'hallo');
          docs[1].should.have.property('type', 3);
        });
      });
      it('create 2 custom', function(){
        factory.build({$docs:[{addr: 'hallo'}, {type: 3}]}, function(err, docs){
          docs.length.should.be.equal(2);
          docs[0].should.have.property('addr', 'hallo');
          docs[1].should.have.property('type', 3);
        });
      });
    });
  });

  describe('when create', function(){
    describe('single document', function(){
      it('create mongodb dcuments', function(){
        factory.create({$doc: {$num:10}}, function(){
          model.find({}).exec(function(err, doc){
            doc.length.should.eql(10);
          });
        });
      });

      it('with invalid data return err', function(){
        factory.create({"$docs":[{"type": "2sre4"}]}, function(err, docs){
          err.should.be.an.instanceof(Error);
        });
      }); 
    });
    describe('multi document', function(){
      describe('with valid data', function(){
        it('create mongodb dcuments', function(){
          factory.create({$docs:[{addr: 'hallo'}, {type: 3}]}, function(err, docs){
            model.find({}).exec(function(err, docs1){
              docs1.length.should.be.equal(2);
            });
          });
        });
      });
      describe('with invalid data', function(){
        it('retrieve err', function(){
          factory.create({$docs:[{addr: 'hallo'}, {type:'fsg4'}]}, function(err, docs){
            err.should.be.instanceof(Error);
            model.find({}).exec(function(err, docs1){
              docs1.length.should.be.equal(0);
            });
          });
        });
      });
    });
  });
});
