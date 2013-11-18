var Factory, _get, _setRelationsSync;
strgMethods = require('strgMethods'); 

function merge_options(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

Factory.prototype.stringMethods = function(doc){
  for (var key in doc) {
    if (doc.hasOwnProperty(key)) {
      Strg = new strgMethods(doc[key], this.sequenc);
      doc[key] = Strg.len().intv().seq().value;
      console.log(doc);
    }
  }
  return doc;
}

function Factory(model, factory){
  this.model = model;
  this.factory = factory;
  this.sequenc = 0
};

Factory.prototype._getFactory =function (optionFactory){
  var factory, child, _len, _i, child_factory; 
  factory = this.factory();
  child = factory['$child']
  delete factory["$child"];
  if(optionFactory && optionFactory != "default"){
    factories = optionFactory.split(' ');
    for (_i = 0, _len = factories.length; _i < _len; _i++) {
      child_factory = child[factories[_i]];
      if(typeof child_factory === 'function'){
        child_factory = child_factory()
      }
      child = child_factory['$child'];
      delete child_factory["$child"];
      factory = merge_options(factory, child_factory)
    }
  }
  return factory;
};

Factory.prototype.build = function(options, callback){
  var new_doc;
  options.factory = this._getFactory(options.$factory)
  new_doc = this._getNewDocs(options);
  if (new_doc.length == 1 ) {
    new_doc = new_doc[0]
  }
  return callback(new_doc);
};

Factory.prototype._getNewDocs = function(options) {
  var $doc, $docs, $factory, $num, _i, _len;
  if (options.$doc) {
    options.$docs = new Array(options.$doc);
  } 
  $docs = new Array();
  $docsOpt = options.$docs || new Array({});
  _i = 0;
  _len = $docsOpt.length;
  while (_i < _len) {
    this.sequenc++;
    $doc = $docsOpt[_i];
    if (typeof $doc["$factory"] === "undefined") {
      $factory = options.factory; 
    } else {
      $factory = this._getFactory($doc["$factory"]);
    }
    $num = $doc["$num"] || 0;
    delete $doc["$factory"];
    delete $doc["$num"];
    $docs.push(this._newDoc($factory, $doc));
    __i = 1;
    __len = $num;
    while (__i < __len) {
      this.sequenc++;
      $docs.push(this._newDoc($factory, $doc));
      __i++;
    }
    _i++;
  }
  return $docs;
};

Factory.prototype._newDoc = function (factory, doc){
  return new this.model(this.stringMethods(merge_options(factory, doc)))
};


Factory.prototype.create = function(options, callback) {
  var new_docs, returned, error;
  new_docs = new Array();
  this.build(options, function(docs) {
    var _i, _len;
    if (Object.prototype.toString.call(docs) === "[object Array]") {
      _i = 0;
      _len = docs.length;
      while (_i < _len) {
        docs[_i].save(function(err, doc) {
          if (err) {
            error = err;
            __i = 0;
            __len = new_docs.length;
            while (__i < __len) {
              new_docs[__i].remove();
              __i++;
            }
            _i = _len
          }
          new_docs.push(doc);
        });
        _i++;
      }
      return callback(error, new_docs);
    } else {
      docs.save(function(err, doc) {
        return callback(err, doc);
      });
    }
  });
};

module.exports = Factory;
