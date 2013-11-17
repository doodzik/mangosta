var Factory, _get, _setRelationsSync;

function merge_options(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

createStrg = function(length) {
  var chars, i, randomstring, rnum;
  chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
  randomstring = "";
  i = 0;
  while (i < length) {
    rnum = Math.floor(Math.random() * chars.length);
    randomstring += chars.substring(rnum, rnum + 1);
    i++;
  }
  return randomstring;
};

strgSeq = function (value, seq) {
  if ('string' == typeof value && value.match(/\$seq/)) {
    value = value.replace('$seq', seq);
  }
  return value;
}

strgLen = function (value) {
  var length, regExp;
  regExp = /\$len\(([^)]+)\)/;
  if ('string' == typeof value && value.match(regExp)) {
    length = regExp.exec(value)[1];
    value = value.replace('$len('+length+')', createStrg(length));
  }
  return value;
}

Factory.prototype.stringMethods = function(doc){
  for (var key in doc) {
    if (doc.hasOwnProperty(key)) {
      doc[key] = strgLen(strgSeq(doc[key], this.sequenc));
    }
  }
  return doc;
}

function Factory(model, factory){
  this.model = model;
  this.factory = factory;
  this.sequenc = 0
};

Factory.prototype._getFactoryObj = function (options){
  var factory, child, _len, _i, child_factory; 
  factory = this.factory();
  child = factory['$child']
  delete factory["$child"];
  if(options.$factory){
    factories = options.$factory.split(' ');
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
}

Factory.prototype._getNewDoc = function (options){
  var new_doc;
  this.sequenc++;
  if(typeof options.docs === 'undefined'){
    options.docs = new Array(options.factory);
  }
  new_doc = merge_options(options.factory, options.docs[0]);
  return new this.model(this.stringMethods(new_doc));
};

Factory.prototype.build = function(options, callback){
  var new_doc;
  options.factory = this._getFactoryObj(options)
  if((options.docs && options.docs.length > 1) || (options.num && options.num > 1 )){
    new_doc = this._buildMultiple(options)
  } else {
    new_doc = this._getNewDoc(options);
  }
  return callback(new_doc);
};

Factory.prototype._buildMultipleNum = function(options){
  var new_docs;
  new_docs = new Array();
  for (_i = 0, _len = options.num; _i < _len; _i++) {
    this.sequenc++
    new_docs.push(new this.model(this.stringMethods(options.factory)));
  }
  return new_docs;
};

Factory.prototype._buildMultipleNumWithDocs = function(options){
  var new_docs;
  new_docs = new Array();
  for (_i = 0, _len = options.num; _i < _len; _i++) {
    this.sequenc++
    if(_i <= options.docs.length){
      new_docs.push(new this.model(this.stringMethods(merge_options(options.factory, options.docs[_i]))));
    }else{
      new_docs.push(new this.model(this.stringMethods(options.factory)));
    }
  }
  return new_docs;
};

Factory.prototype._buildMultipleDocs = function(options){
  var new_docs; 
  new_docs = new Array();
  for (_i = 0, _len = options.docs.length; _i < _len; _i++) {
    this.sequenc++
    new_docs.push(new this.model(this.stringMethods(merge_options(options.factory, options.docs[_i]))));
  }
  return new_docs;
};

Factory.prototype._getNewDocs = function (options){
  if ( options.docs && 'object' === typeof options.docs){
    if( options.num && 'number' === typeof options.num ){
      return this._buildMultipleNumWithDocs(options);
    } else {
      return this._buildMultipleDocs(options);
    }
  }else{
    return this._buildMultipleNum(options);
  }
};

Factory.prototype._buildMultiple = function(options){
  var doc_new;
  doc_new = this._getNewDocs(options);
  return doc_new;
};

Factory.prototype.create = function(options, callback) {
  var new_docs, returned;
  new_docs = new Array();
  this.build(options, function(docs) {
    if(Object.prototype.toString.call( docs ) === '[object Array]'){
      for (_i = 0, _len = docs.length; _i < _len; _i++) {
        docs[_i].save(function(err, doc) {
          if(err){
            returned = true;
            for (_i = 0, _len = new_docs.length; _i < _len; _i++) {
              new_docs[_i].remove();
            }
            return callback(err, null);
          }
          new_docs.push(doc)
        });
      }
      if(returned != true){
        return callback(null, new_docs);
      }
    }else{
      docs.save(function(err, doc) {
        return callback(err, doc);
      });
    }
  });
};

module.exports = Factory;
