/*
  Ksana Search Engine.

  need a KDE instance to be functional
  
*/
var bsearch=require("./bsearch");

var _search=function(engine,q,opts,cb) {
	if (typeof engine=="string") {//browser only
		//search on remote server
		var kde=Require("ksana-document").kde;
		var $kse=Require("ksanaforge-kse").$yase; 
		opts.dbid=engine;
		opts.q=q;
		$kse.search(opts,cb);
	} else {//nw or brower
		var dosearch=require("./search");
		var res= dosearch(engine,q,opts,cb);
		return res;
	}
}

var _highlightPage=function(engine,fileid,pageid,opts,cb){
	if (!opts.q) opts.q=""; 
	_search(engine,opts.q,opts,function(Q){
		api.excerpt.highlightPage(Q,fileid,pageid,opts,cb);
	});	
}
var _highlightRange=function(engine,start,end,opts,cb){

	if (opts.q) {
		_search(engine,opts.q,opts,function(Q){
			api.excerpt.highlightRange(Q,start,end,opts,cb);
		});
	} else {
		api.excerpt.getRange(engine,start,end,cb);
	}
}
var _highlightFile=function(engine,fileid,opts,cb){
	if (!opts.q) opts.q=""; 
	_search(engine,opts.q,opts,function(Q){
		api.excerpt.highlightFile(Q,fileid,opts,cb);
	});
	/*
	} else {
		api.excerpt.getFile(engine,fileid,function(data) {
			cb.apply(engine.context,[data]);
		});
	}
	*/
}

var vpos2filepage=function(engine,vpos) {
    var pageOffsets=engine.get("pageOffsets");
    var fileOffsets=engine.get(["fileOffsets"]);
    var pageNames=engine.get("pageNames");
    var fileid=bsearch(fileOffsets,vpos+1,true);
    fileid--;
    var pageid=bsearch(pageOffsets,vpos+1,true);
	var range=engine.getFileRange(fileid);
	pageid-=range.start;
    return {file:fileid,page:pageid};
}
var api={
	search:_search
	,concordance:require("./concordance")
	,regex:require("./regex")
	,highlightPage:_highlightPage
	,highlightFile:_highlightFile
//	,highlightRange:_highlightRange
	,excerpt:require("./excerpt")
	,vpos2filepage:vpos2filepage
}
module.exports=api;