var Factory, strgMethods;
strgMethods = require('strgMethods');

function Factory(model, factory){
  this.model = model;
  this.factory = factory || model;
  this.sequenc = 0;
}

Factory.prototype.build = function (options, callback){
  if (typeof options == "function"){
    callback = options;
    options = {};
  }
  this.sequenc = (typeof options.$seq === 'undefined') ? this.sequenc : options.$seq;
  this._getNewDocs(options, function (err, docs) {
    if (err) { return callback(err, null); }
    docs = (docs.length === 1 ) ? docs[0] : docs;
    return callback(err, docs);
  });
};

Factory.prototype._compareObjSync = function (mObj, obj) {
  if(this.model === this.factory){ return false; }
  obj._id = "";
  mObj = Object.keys(mObj.toObject());
  obj = Object.keys(obj);
  for (var i = 0; i < mObj.length; i++) {
    if (mObj[i] != obj[i]) {
      return new Error(obj[i]+' isnt the right Schema var type');
    }
  }
  return false;
};

Factory.prototype._mergeObjsSync = function (obj1, obj2) {
  var attrname, obj3;
  obj3 = {};
  for (attrname in obj1) {
    obj3[attrname] = obj1[attrname];
  }
  for (attrname in obj2) {
    obj3[attrname] = obj2[attrname];
  }
  return obj3;
};

Factory.prototype._getNewDocs = function (options, callback) {
  var $doc, docs, $docsOpt, factory, $num, _i, _len;
  docs = [];
  options.$docs = (options.$doc) ? [options.$doc] : options.$docs;
  $docsOpt = options.$docs || [{}];
  for (_i = 0, _len = $docsOpt.length; _i < _len; _i++) {
    $doc = $docsOpt[_i];
    $num = $doc.$num || 1;
    factory = (typeof $doc.$factory === "undefined") ? options.$factory : $doc.$factory;
    this._getFactory(factory, function(err, $fctry) {
      if (err) {return callback(err, null);}
      $factory = $fctry;
    });
    delete $doc.$factory;
    delete $doc.$num;
    for (__i = 0, __len = $num; __i < __len; __i++) {
      this.sequenc++;
      docs.push(this._newDoc($factory, $doc));
      err = this._compareObjSync(docs[_i], this._mergeObjsSync($factory, $doc));
    }
  }
  return callback(err, docs);
}; 

Factory.prototype._getFactory =function (options, callback){
  var factory, err, child, _len, _i, child_factory;
  if (typeof options == "function"){
    callback = options;
    options = "";
  }
  factory = this.factory();
  child = factory.$child;
  delete factory.$child;
  if(options && options != "default"){
    factories = options.split(' ');
    for (_i = 0, _len = factories.length; _i < _len; _i++) {
      child_factory = child[factories[_i]];
      if (typeof child_factory === "undefined") { return callback(new Error(factories[_i]+' isnt a child factory'), null) }
      child_factory = (typeof child_factory === 'function') ? child_factory() : child_factory;
      child = child_factory.$child;
      delete child_factory.$child;
      factory = this._mergeObjsSync(factory, child_factory);
    }
  }
  return callback(err, factory);
};

Factory.prototype._newDoc = function (factory, doc){
  if(this.model === this.factory){
    return this.stringMethods(this._mergeObjsSync(factory, doc));
  } else {
    return new this.model(this.stringMethods(this._mergeObjsSync(factory, doc)));
  }
};

Factory.prototype.stringMethods = function (doc){
  for (var key in doc) {
    if (doc.hasOwnProperty(key)) {
      Strg = new strgMethods(doc[key], this.sequenc);
      doc[key] = Strg.all();
    }
  }
  return doc;
};

Factory.prototype.create = function (options, callback) {
  if (typeof options == "function"){
    callback = options;
    options = {};
  } else if (typeof options == "undefined"){
    options = {};
  }
  this.build(options, function (err, docs) {
    if (err && typeof callback == "function") { return callback(err, null); }
    this.model.create(docs, function (err, docs){
      if (typeof callback == "function"){
        return callback(err, docs);
      }
    });
  });
};

// mongoose methodes as instance of factory
Factory.prototype.find =  function (args) {
  this.model.find.call(arguments);
};

Factory.prototype.count =  function (args) {
  this.model.count.call(arguments);
};

Factory.prototype.findOne = function (args) {
  this.model.findOne.call(arguments);
};

Factory.prototype.remove = function (options, callback) {
  if (typeof options == "undefined") {
    options = {};
  }
  if (typeof options == "function") {
    callback = options;
    options = {};
  }
  this.model.remove(options, function (err, num){
    if (typeof callback != "undefined") {
      callback(err, num);
    }
  });
};

module.exports = Factory;
