if (typeof nodeRequire=='undefined')nodeRequire=require;

/*
  text:       [ [page_text][page_text] ]
  pagenames:  []
  tokentree:  []
  
  search engine API: 
  getToken        //return raw posting
  getText(vpos)   //return raw page text
    getPageText   
  vpos2pgoff      //virtual posting to page offset
  groupBy         //convert raw posting to group (with optional converted offset) 
  findMarkupInRange
*/


var indexing=false; //only allow one indexing task
var projinfo=null;
var status={progress:1,done:false};
var session={};
var api=null;
var isSkip=null;
var normalize=null;
var tokenize=null;

var putPosting=function(tk) {
	var	postingid=session.json.tokens[tk];
	var out=session.json;

	if (!postingid) {
		session.json.tokens[tk]=out.postingCount+1;
		posting=out.postings[out.postingCount]=[];
		out.postingCount++;
	} else {
		posting=out.postings[postingid-1];
	}
	posting.push(session.vpos);
}
var putExtra=function(arr_of_key_vpos_payload) {
	//which markup to be added in the index
	//is depended on application requirement...
	//convert markup start position to vpos
	// application  key-values  pairs
	//    ydb provide search for key , return array of vpos
	//        and given range of vpos, return all key in the range
  // structure
  // key , 
}

var putPage=function(docPage) {
	var tokenized=tokenize(docPage.inscription);

	for (var i=0;i<tokenized.tokens.length;i++) {
		var t=tokenized.tokens[i];
		var normalized=normalize(t);
		if (normalized) {
			putPosting(normalized);
 		} else {
 			if (isSkip(t)) session.vpos--;
 		}
 		session.vpos++;
	}

	session.indexedTextLength+= docPage.inscription.length;
}
var shortFilename=function(fn) {
	var arr=fn.split('/');
	while (arr.length>2) arr.shift();
	return arr.join('/');
}
var putFile=function(fn) {
	var persistent=nodeRequire("ksana-document").persistent;
	var doc=persistent.createLocal(fn);
	var shortfn=shortFilename(fn);

	var fileinfo={pages:[],pageNames:[],pageOffset:[]};
	session.json.files.push(fileinfo);
	session.json.fileNames.push(shortfn);
	session.json.fileOffset.push(session.vpos);
	for (var i=1;i<doc.pageCount;i++) {
		var pg=doc.getPage(i);
		fileinfo.pages.push(pg.inscription);
		fileinfo.pageNames.push(pg.name);
		fileinfo.pageOffset.push(session.vpos);
		putPage(pg);
	}
}
var initSession=function() {
	var json={
		files:[],
		fileNames:[],
		fileOffset:[],
		postings:[],
		tokens:{},
		postingCount:0,
	};
	var session={vpos:1, json:json , 
		           indexedTextLength:0,
		           options: projinfo.ksana.indexopt };
	return session;
}
var initIndexer=function() {
	session=initSession();
	session.filenow=0;
	session.files=projinfo.files;
	
	api=nodeRequire("./customfunc.js").getAPI(session.options.template);
	
	normalize=api["normalize"];
	isSkip=api["isSkip"];
	tokenize=api["tokenize"];
	setTimeout(indexstep,1);
}

var getMeta=function() {
	var meta={};
	meta.template=session.options.template;
	meta.name=projinfo.project.shortname;
	return meta;
}

var backupFilename=function(ydbfn) {
	//user has a chance to recover from previous ydb
	return ydbfn+"k"; //todo add date in the middle
}

var backup=function(ydbfn) {
	var fs=nodeRequire('fs');
	if (fs.existsSync(ydbfn)) {
		var bkfn=ydbfn+'k';
		if (fs.existsSync(bkfn)) fs.unlinkSync(bkfn);
		fs.renameSync(ydbfn,bkfn);
	}
}
var finalize=function(cb) {
	var opt=session.options;
	var ydbfn=projinfo.project.filename+'.ydb';
	session.json.meta=getMeta();
	
	backup(ydbfn);
	status.message='writing '+ydbfn;
	//output=api("optimize")(session.json,session.indexopt.template);

	var ydb =nodeRequire("./ydbw")();
	ydb.save(session.json,null,{autodelete:true});
	
	ydb.writeFile(ydbfn,function(total,written) {
		status.progress=written/total;
		if (total==written) cb();
	});
}

var indexstep=function() {
	
	if (session.filenow<session.files.length) {
		status.filename=session.files[session.filenow];
		status.progress=Math.floor((session.filenow/session.files.length)*100);
		putFile(status.filename);
		session.filenow++;
		setTimeout(indexstep,1); //rest for 1 ms to response status
	} else {
		finalize(function() {
			status.done=true;
			indexing=false;
		});	
	}
}

var status=function() {
  return status;
}
var start=function(projname) {
	if (indexing) return null;
	indexing=true;

	projinfo=nodeRequire("ksana-document").projects.fullInfo(projname);
	if (!projinfo.files.length) return null;//nothing to index

	initIndexer();
  status.projectname=projname;
  return status;
}

var stop=function(status) {
  status.done=true;
  indexing=false;
  return status;
}
module.exports={start:start,stop:stop,status:status};