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
		return require("./search")(engine,q,opts,cb);		
	}
}

var _highlightPage=function(engine,fileid,pageid,opts,cb){
	if (opts.q) {
		_search(engine,opts.q,opts,function(Q){
			api.excerpt.highlightPage(Q,fileid,pageid,opts,cb);
		});
	} else {
		api.excerpt.getPage(engine,fileid,pageid,cb);
	}
}

var vpos2filepage=function(engine,vpos) {
    var pageOffsets=engine.get("pageOffsets");
    var fileOffsets=engine.get(["fileOffsets"]);
    var pageNames=engine.get("pageNames");
    var fileid=bsearch(fileOffsets,vpos+1,true);
    fileid--;
    var pageid=bsearch(pageOffsets,vpos+1,true);
    pageid--;

    var fileOffset=fileOffsets[fileid];
    var pageOffset=bsearch(pageOffsets,fileOffset+1,true);
    pageOffset--;
    pageid-=pageOffset;
    return {file:fileid,page:pageid};
}
var api={
	search:_search
	,concordance:require("./concordance")
	,regex:require("./regex")
	,highlightPage:_highlightPage
	,excerpt:require("./excerpt")
	,vpos2filepage:vpos2filepage
}
module.exports=api;