var factory, Factory, mongoose, schema;

mongoose = require('mongoose');
connection = mongoose.connect('mongodb://localhost/mongoos-factory-test')

schema = new mongoose.Schema({
  "firstName": String,
  "lastName": String,
  "addr": String,
  "type": {"type": Number, "max": 10},
  "date": Date 
});

model = mongoose.model('schema', schema);

Factory = require('../index.js');
factory = new Factory(mongoose.model("schema"), function() {
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
      }
    }
  };
});

describe('Factory', function(){
  afterEach(function(){
    model.find({}).remove();
  });
  after(function(){
    mongoose.connection.close();
  });

  describe("methods", function(){
    describe("strgMethods", function(){
      it('$len', function(){
        docs = factory.stringMethods({"firstName": "xx$len(32)"});
        docs.firstName.length.should.be.equal(34);
      });

      it('$seq', function(){
        docs = factory.stringMethods({"firstName": "22$seqnanan"});
        docs.firstName.should.be.equal("220nanan");
        factory.build({}, function(){
          docs = factory.stringMethods({"firstName": "22$seqnanan"});
          docs.firstName.should.be.equal("221nanan");
        });
      });
    });    
  });

  describe('single document', function(){
    describe('when build', function(){
      describe('with child factory', function(){
        it('should create 1st child', function(){
          factory.build({"$factory": "lola"}, function(doc){
            doc.firstName.should.eql('lo');
            doc.lastName.should.eql('la');
          });
        });
        it('should create 2st child', function(){
          factory.build({"$factory": "lola la"}, function(doc){
            doc.firstName.should.eql('la');
            doc.lastName.should.eql('la');
          });
        });
        it('should create 2st child with empty first', function(){
          factory.build({"$factory": "empty notempty"}, function(doc){
            doc.firstName.should.eql('not');
            doc.lastName.should.eql('empty');
          });
        });
        it('should create child with obj not function', function(){
          factory.build({"$factory": "object_child"}, function(doc){
            doc.firstName.should.eql("object child");
          });
        });
        it('should invoke fx at build', function(){
          factory.build({"$factory": "current_date"}, function(doc0){
            setTimeout(function(){
              factory.build({"$factory": "current_date"}, function(doc1){
                doc1.date.should.not.be.above(doc0.date)
              });
            }, 1000);
          });
        });
        it('should not have proberty of child', function(){
          factory.build({}, function(doc){
            doc.should.not.have.property("$child");
          });
        });
      });
      it('without options', function(){
        factory.build({}, function(doc){
          doc.should.have.property('_id');
        });
      });
      it('with options', function(){
        factory.build({"docs":[{"type": 9}]}, function(doc){
          doc.should.have.property('_id')
          doc.type.should.eql(9)
        });
      });
    });
    describe('when create', function(){
      it('without options', function(){
        factory.create({}, function(err){
          if (err) {
            err.should.not.be.an.instanceof(Error);
          }
          model.findOne({}).exec(function(err, doc){
            doc.type.should.eql(0)
          });
        });
      });

      it('with options', function(){
        factory.create({"docs":[{"type": 9}]}, function(err){
          if (err) {
            err.should.not.be.an.instanceof(Error);
          }
          model.findOne({}).exec(function(err, doc){
            doc.type.should.eql(9)
          });
        });
      });

      it('with invalid data return err', function(){
        factory.create({"docs":[{"type": "2sre4"}]}, function(err){
          err.should.be.an.instanceof(Error);
        });
      });
    });
  });

  describe('multi document', function(){
    describe('when build', function(){
      it('with child factory in docs');
      it('with child factory as default');
      describe('when num', function(){
        it('create default', function(){
          factory.build({num: 4}, function(docs){
            docs.length.should.be.equal(4);
          });
        });
      });
      describe('when num and docs', function(){
        it('create 4 default and 2 custom', function(){
          factory.build({docs:[{addr: 'hallo'}, {type: 3}] ,num: 4}, function(docs){
            docs.length.should.be.equal(4);
            docs[0].should.have.property('addr', 'hallo');
            docs[1].should.have.property('type', 3);
          });
        });
      });
      describe('when docs', function(){
        it('create 4 default and 2 custom', function(){
          factory.build({docs:[{addr: 'hallo'}, {type: 3}]}, function(docs){
            docs.length.should.be.equal(2);
            docs[0].should.have.property('addr', 'hallo');
            docs[1].should.have.property('type', 3);
          });
        });
      });
    });
    describe('when create', function(){
      describe('with valid data', function(){
        it('create mongodb dcuments', function(){
          factory.create({docs:[{addr: 'hallo'}, {type: 3}]}, function(err, docs){
            model.find({}).exec(function(err, docs){
              docs.length.should.be.equal(2);
            });
          });
        });
      });
      describe('with invalid data', function(){
        it('retrieve err', function(){
          factory.create({docs:[{addr: 'hallo'}, {type:'fsg4'}]}, function(err, docs){
            err.should.be.instanceof(Error);
            model.find({}).exec(function(err, docs){
              docs.length.should.be.equal(0);
            });
          });
        });
      });
    });
  });
});
