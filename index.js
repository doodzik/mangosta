var Factory, merge_obj, strgMethods;
strgMethods = require('strgMethods'); 

function merge_obj(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

function Factory(model, factory){
  this.model = model;
  this.factory = factory;
  this.sequenc = 0
};

Factory.prototype.build = function(options, callback){
  this._getNewDocs(options, function(err, docs) {
    docs = (docs.length === 1 ) ? docs[0] : docs;
    return callback(err, docs);
  });
};

Factory.prototype._getNewDocs = function(options, callback) {
  var $doc, docs, $factory, $num, _i, _len;
  docs = new Array();
  options.$docs = (options.$doc) ? new Array(options.$doc) : options.$docs;
  $docsOpt = options.$docs || new Array({});
  for (_i = 0, _len = $docsOpt.length; _i < _len; _i++) {
    $doc = $docsOpt[_i];
    $num = $doc["$num"] || 1;
    $factory = (typeof $doc["$factory"] === "undefined") ? this._getFactory(options.$factory) : this._getFactory($doc["$factory"]);
    delete $doc["$factory"];
    delete $doc["$num"];
    for (__i = 0, __len = $num; __i < __len; __i++) {
      this.sequenc++;
      docs.push(this._newDoc($factory, $doc));
    }
  }
  return callback(null, docs);
}; 

Factory.prototype._getFactory =function (optionFactory){
  var factory, child, _len, _i, child_factory; 
  factory = this.factory();
  child = factory['$child'];
  delete factory["$child"];
  if(optionFactory && optionFactory != "default"){
    factories = optionFactory.split(' ');
    for (_i = 0, _len = factories.length; _i < _len; _i++) {
      child_factory = child[factories[_i]];
      child_factory = (typeof child_factory === 'function') ? child_factory() : child_factory;
      child = child_factory['$child'];
      delete child_factory["$child"];
      factory = merge_obj(factory, child_factory)
    }
  }
  return factory;
};

Factory.prototype._newDoc = function (factory, doc){
    return new this.model(this.stringMethods(merge_obj(factory, doc)));
};

Factory.prototype.stringMethods = function(doc){
  for (var key in doc) {
    if (doc.hasOwnProperty(key)) {
      Strg = new strgMethods(doc[key], this.sequenc);
      doc[key] = Strg.all();
    }
  }
  return doc;
}

Factory.prototype.create = function(options, callback) {
  this.build(options, function(err, docs) {
    if (Object.prototype.toString.call(docs) !== "[object Array]") {
      docs.save(function(err, doc){
        return callback(err, doc);
      });
    } else {
      this.model.create(docs, function(err){
        process.nextTick(function(){
          return callback(err, docs);
        });
      });
    }
  });
};

module.exports = Factory;
