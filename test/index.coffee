mongoose = require("mongoose")
connection = mongoose.connect("mongodb://localhost/mongoos-factory-test")
factory0Schema = new mongoose.Schema(
  firstName: String
  lastName: String
  addr: String
  type:
    type: Number
    max: 10

  date: Date
)
model = mongoose.model("factory0", factory0Schema)
Factory = require("../index.js")
factory1Schema = new mongoose.Schema(test: String)
model1 = mongoose.model("factory1", factory1Schema)
fctryStrgSchema = new mongoose.Schema(
  firstName: String
  lastName: String
  type: String
)
model2 = mongoose.model("fctryStrg", fctryStrgSchema)
factory1 = new Factory(mongoose.model("factory1"), ->
  test: "factory"
)
factory = new Factory(mongoose.model("factory0"), ->
  firstName: "d00d"
  lastName: "zik"
  addr: "isabela"
  type: 0
  $child:
    lola: ->
      firstName: "lo"
      lastName: "la"
      $child:
        la: ->
          firstName: "la"

    empty: ->
      $child:
        notempty: ->
          firstName: "not"
          lastName: "empty"

    object_child:
      firstName: "object child"

    current_date: ->
      date: new Date()

    factory_ref: ->
      $docs = undefined
      factory1.build {}, (err, doc) ->
        $docs = doc

      firstName: $docs.test
)
factoryObj = new Factory(->
  firstName: "factory"
  lastName: "hi"
  type: "lolo"
)
factoryStr = new Factory("fctryStrg", ->
  firstName: "factory"
  lastName: "hi"
  type: "lolo"
)
describe "Factory", ->
  afterEach (done) ->
    model.remove ->
      model1.remove ->
        model2.remove ->
          done()



  describe "when model passed as String", ->
    it "returns counts", (done) ->
      factoryStr.create
        $doc:
          $num: 6
      , (err, docs) ->
        factoryStr.model.find {}, (err, docs) ->
          docs.length.should.eql 6
          done()




  describe "when done() as callback", ->
    before (done) ->
      factory.create
        $doc:
          $num: 6
      , done()

    it "returns counts", ->
      factory.model.find {}, (err, docs) ->
        docs.length.should.eql 6



  describe "when _stringMethods", ->
    describe "when obj isnt nested", ->
      it "returns valid", ->
        factory._stringMethods(test: "$len(12)").test.length.should.eql 12


    describe "when obj is nested", ->
      it "returns valid", ->
        applied = factory._stringMethods(
          test: "$len(12)"
          second:
            test: "$len(12)"
        )
        applied.test.length.should.eql 12
        applied.second.test.length.should.eql 12



  describe "when _newDoc", ->
    it "returns valid mongoose doc", ->
      new_doc = undefined
      new_doc = factory._newDoc(
        firstName: "hoohhhoo"
        lastName: "hiihhhii"
      ,
        lastName: "$len(66)"
        type: 3
      )
      new_doc.lastName.length.should.eql 66
      new_doc.type.should.eql 3
      new_doc.constructor.name.should.eql "model"

    it "returns valid plain obj", ->
      new_doc = undefined
      new_doc = factoryObj._newDoc(
        firstName: "hoohhhoo"
        lastName: "hiihhhii"
      ,
        lastName: "$len(66)"
        type: 3
      )
      new_doc.lastName.length.should.eql 66
      new_doc.type.should.eql 3
      new_doc.constructor.name.should.not.eql "model"


  describe "when _getFactory", ->
    it "return default factory", ->
      test_obj = undefined
      test_obj =
        firstName: "d00d"
        lastName: "zik"
        addr: "isabela"
        type: 0

      factory._getFactory "default", (err, fctry) ->
        fctry.should.eql test_obj

      factory._getFactory (err, fctry) ->
        fctry.should.eql test_obj


    it "return 1st child", ->
      test_obj = undefined
      test_obj =
        firstName: "lo"
        lastName: "la"
        addr: "isabela"
        type: 0

      factory._getFactory "lola", (err, fctry) ->
        fctry.should.eql test_obj


    it "return 2st child", ->
      test_obj = undefined
      test_obj =
        firstName: "la"
        lastName: "la"
        addr: "isabela"
        type: 0

      factory._getFactory "lola la", (err, fctry) ->
        fctry.should.eql test_obj


    it "return 2st child with empty first", ->
      test_obj = undefined
      test_obj =
        firstName: "not"
        lastName: "empty"
        addr: "isabela"
        type: 0

      factory._getFactory "empty notempty", (err, fctry) ->
        fctry.should.eql test_obj


    it "return child with obj not function", ->
      test_obj = undefined
      test_obj =
        firstName: "object child"
        lastName: "zik"
        addr: "isabela"
        type: 0

      factory._getFactory "object_child", (err, fctry) ->
        fctry.should.eql test_obj


    it "invoke fx at build", ->
      test_obj = undefined
      factory._getFactory "current_date", (err, fctry) ->
        setTimeout (->
          factory._getFactory "current_date", (err, fctry1) ->
            fctry1.date.should.not.be.above fctry.date

        ), 1000


    it "doesnt have proberty of child", ->
      factory._getFactory (err, fctry) ->
        fctry.should.not.have.property "$child"


    it "return factory in factory", ->
      test_obj = undefined
      factory._getFactory "factory_ref", (err, fctry) ->
        fctry.firstName.should.eql "factory"


    describe "with invalid", ->
      it "returns err", ->
        factory._getFactory "notExists", (err) ->
          err.message.should.eql "notExists isnt a child factory"




  describe "_mergeObjsSync", ->
    describe "without nested obj", ->
      it "returns merged obj", ->
        newObj = undefined
        newObj = factory._mergeObjsSync(
          one: "one"
          two: "two"
        ,
          one: "three"
          three: "one"
        )
        newObj.one.should.eql "three"
        newObj.two.should.eql "two"
        newObj.three.should.eql "one"


    describe "with nested obj", ->
      it "returns merged obj", ->
        newObj = undefined
        newObj = factory._mergeObjsSync(
          one: "one"
          two: "two"
          three:
            one: "one"
            two: "two"

          five:
            one: "one"
        ,
          one: "three"
          four:
            one: "one"

          five:
            two: "two"
        )
        newObj.should.eql
          one: "three"
          two: "two"
          three:
            one: "one"
            two: "two"

          four:
            one: "one"

          five:
            one: "one"
            two: "two"




  describe "when _getKeys", ->
    describe "when isnt nested", ->
      it "returns false", ->
        factory._getKeys(
          hola: "fas"
          type: "avr"
        ).should.eql ["hola", "type"]


    describe "when is nested", ->
      it "returns false", ->
        factory._getKeys(
          hola: "fas"
          hii:
            day: "dzien"
            good:
              bien: "dobry"

          type: "avr"
        ).should.eql ["hola", "hii", "day", "good", "bien", "type"]



  describe "when _compareObjSync", ->
    describe "when Obj factory", ->
      it "returns false", ->
        (not (factoryObj._compareObjSync(
          hola: "fas"
          type: "avr"
        , {})?)).should.eql true

    describe "when factory", ->
      describe "when mObj keys different then obj keys", ->
        it "returns Error", ->
          mObj = undefined
          err = undefined
          mObj = new factory.model(
            firstName: "d00d"
            lastName: "111"
            addr: "isabela"
            type: "lbhjlh"
          )
          err = factory._compareObjSync(mObj,
            firstName: "d00d"
            lastName: "111"
            addr: "isabela"
            type: 0
          )
          
          err.should.be.instanceof(Error)
          err.message.should.eql "type isnt the right Schema var type"


      describe "when mObj keys different then obj keys", ->
        it "returns null", ->
          mObj = undefined
          err = undefined
          mObj = new factory.model(
            firstName: "d00d"
            lastName: "111"
            addr: "isabela"
            type: 0
          )
          (factory._compareObjSync(mObj, {firstName: "d00d", lastName: "111", addr: "isabela", type: 0}) == null).should.be.true



  describe "when _getNewDocs", ->
    it "returns single default", ->
      factory._getNewDocs {}, (err, docs) ->
        docs.length.should.eql 1


    describe "with num", ->
      it "return defaults", ->
        factory._getNewDocs
          $doc:
            $num: 20
        , (err, docs) ->
          docs.length.should.eql 20


      it "return defaults with default objs", ->
        factory._getNewDocs
          $docs: [
            $num: 20
          , {}, {}]
        , (err, docs) ->
          docs.length.should.eql 22



    describe "with factory", ->
      it "return 1 child in doc", ->
        factory._getNewDocs
          $docs: [$factory: "lola"]
        , (err, docs) ->
          docs[0].firstName.should.eql "lo"


      it "return 1 child with custom doc", ->
        factory._getNewDocs
          $docs: [
            $factory: "lola"
            firstName: "dodo"
          ]
        , (err, docs) ->
          docs.length.should.eql 1
          docs[0].firstName.should.eql "dodo"
          docs[0].lastName.should.eql "la"


      it "default factory with $doc factory 2nd child", ->
        factory._getNewDocs
          $factory: "lola"
          $doc:
            $factory: "empty notempty"
        , (err, docs) ->
          docs.length.should.eql 1
          docs[0].firstName.should.eql "not"
          docs[0].lastName.should.eql "empty"




  describe "when remove", ->
    beforeEach (done) ->
      factory.model.find({}).remove ->
        factory.create
          $docs: [
            $num: 5
          ,
            lastName: "zuk"
            $num: 3
          ]
        , ->
          done()



    describe "without options", ->
      describe "without callback", ->
        it "removes all", (done) ->
          factory.remove()
          process.nextTick ->
            factory.model.find({}).count (err, num) ->
              num.should.eql 0
              done()




      describe "with callback", ->
        it "removes all and return num of retured", ->
          factory.remove (err, num) ->
            num.should.eql 8




    describe "with options", ->
      describe "without callback", ->
        it "removes 3", ->
          factory.remove lastName: "zuk"
          process.nextTick ->
            factory.model.find({}).count (err, num) ->
              num.should.eql 5




      describe "with callback", ->
        it "removes 3 and return num of retured", (done) ->
          factory.remove
            lastName: "zuk"
          , (err, num) ->
            num.should.eql 3
            done()





  describe "when build", ->
    describe "factory.last", ->
      describe "when single", ->
        it "returns last build doc", (done) ->
          factory.build
            $doc:
              lastName: "last"
          , (err, docs) ->
            done()


        describe "with before hook", ->
          before (done) ->
            factory.build
              $doc:
                lastName: "done"
            , (err, docs) ->
              factory.last.should.eql docs
              done()


          it "sets factory.last", ->
            factory.last.lastName.should.eql "done"



      describe "when multiple", ->
        it "returns last build docs", (done) ->
          factory.build
            $doc:
              lastName: "last"
              $num: 3
          , (err, docs) ->
            factory.last.should.eql docs
            done()




    describe "with invalid", ->
      it "var type return err", ->
        factory.build
          $doc:
            type: "f234fq3"
        , (err) ->
          err.message.should.eql "type isnt the right Schema var type"



    it "set sequence to given num", ->
      factoryObj.build
        $seq: 10
        $doc:
          $num: 20
      , (err, doc) ->
        factoryObj.sequenc.should.eql 30
        factoryObj.build
          $doc:
            $num: 20
        , (err, doc) ->
          factoryObj.sequenc.should.eql 50



    describe "with single document", ->
      it "without options", ->
        factory.build {}, (err, doc) ->
          doc.should.have.property "_id"


      it "with options", ->
        factory.build
          $doc:
            type: 9
        , (err, doc) ->
          doc.should.have.property "_id"
          doc.type.should.eql 9



    describe "with multi document", ->
      it "create default", ->
        factory.build
          $doc:
            $num: 4
        , (err, docs) ->
          docs.length.should.be.equal 4


      it "create 2 default and 2 custom", ->
        factory.build
          $docs: [
            addr: "hallo"
          ,
            type: 3
          ,
            $num: 2
          ]
        , (err, docs) ->
          docs.length.should.be.equal 4
          docs[0].should.have.property "addr", "hallo"
          docs[1].should.have.property "type", 3


      it "create 2 custom", ->
        factory.build
          $docs: [
            addr: "hallo"
          ,
            type: 3
          ]
        , (err, docs) ->
          docs.length.should.be.equal 2
          docs[0].should.have.property "addr", "hallo"
          docs[1].should.have.property "type", 3



    describe "without args", ->
      describe "without options", ->
        it "returns default obj", ->
          factory.build {}, (err, doc1) ->
            factory.build (err, doc2) ->
              doc1["_id"] = doc2["_id"]
              doc1.toJSON().should.eql doc2.toJSON()






  describe "when create", ->
    describe "single document", ->
      it "create mongodb dcuments", (done) ->
        factory.create
          $doc:
            $num: 10
        , ->
          model.find({}).exec (err, doc) ->
            doc.length.should.eql 10
            done()



      it "with invalid data return err", ->
        factory.create
          $docs: [type: 1000]
        , (err, docs) ->
          err.should.be.an.instanceof(Error)


    
    describe "multi document", ->
      describe "with valid data", ->
        it "create mongodb dcuments", (done) ->
          factory.create
            $docs: [
              addr: "hallo"
            ,
              type: 3
            ]
          , (err, docs) ->
            model.find({}).exec (err, docs1) ->
              docs1.length.should.be.equal 2
              done()




      describe "with invalid data", ->
        it "retrieve err", (done) ->
          factory.create
            $docs: [
              addr: "hallo"
              $num: 3
            ,
              type: 1000
            ]
          , (err, docs) ->
            
            err.should.be.instanceof(Error)
            model.find({}).exec (err, docs1) ->
              docs1.length.should.be.equal 3
              done()





    describe "without args", ->
      describe "without options", ->
        it "returns default obj", ->
          factory.create {}, (err, doc1) ->
            factory.create (err, doc2) ->
              doc1["_id"] = doc2["_id"]
              doc1.toJSON().should.eql doc2.toJSON()




      describe "without callback", ->
        it "saves default obj to db", ->
          factory.create {}
          factory.model.find({}).count (err, num) ->
            num.should.eql 0



      describe "without options, callback", ->
        it "saves default obj to db", ->
          factory.create()
          factory.model.find({}).count (err, num) ->
            num.should.eql 0
