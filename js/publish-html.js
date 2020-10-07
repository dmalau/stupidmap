var zip = new JSZip();
var sitemap = false;

function randomDate(start, end, startHour, endHour) {
	var date = new Date(+start + Math.random() * (end - start));
	var hour = startHour + Math.random() * (endHour - startHour) | 0;
	date.setHours(hour);
	return date;
  }
  
Date.prototype.toISOString = function() {
	  var tzo = -this.getTimezoneOffset(),
		  dif = tzo >= 0 ? '+' : '-',
		  pad = function(num) {
			  var norm = Math.floor(Math.abs(num));
			  return (norm < 10 ? '0' : '') + norm;
		  };
	  return this.getFullYear() +
		  '-' + pad(this.getMonth() + 1) +
		  '-' + pad(this.getDate()) +
		  'T' + pad(this.getHours()) +
		  ':' + pad(this.getMinutes()) +
		  ':' + pad(this.getSeconds()) +
		  dif + pad(tzo / 60) +
		  ':' + pad(tzo % 60);
}
  
function formatDate(date) {
	var d = new Date(date),
		month = '' + (d.getMonth() + 1),
		day = '' + d.getDate(),
		year = d.getFullYear();
	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;
	return [year, month, day].join('-');
}

$(function(){
	formatDate($('#hariini').val(new Date().toJSON().slice(0,10)));
	$('#publish').click(function(){
		var data = {};
		data.name = $('#name').val();
		data.description = $('#description').val();
		data.thedomain = $('#thedomain').val();
		data.hariini = $('#hariini').val();
		data.pages = ['index', 'contact', 'copyright', 'dmca', 'privacy-policy', 'sitemap'];
		data.nice_pages = ['Index', 'Contact', 'Copyright', 'DMCA', 'Privacy-Policy'];
		show('loading');
		setHeading('Starting up...');
		hide('form');
		chrome.storage.local.get({posts: []}, function(result){
			data.divided_posts = result.posts.divideInto(3);
			data.posts = result.posts;
			data._ = _;
			data.chance = chance;
			data.post = {};
			$.get('/templates/html/layout.html', function(layout){
				generatePages(layout, data);
			});
		});
	});
});

function generatePages(layout, data){
	page = data.pages.shift();
	if (page=='sitemap') {
		sitemap = true;
	}
	renderHtml(layout, page, data, function(output){
		if (page=='sitemap') {
			zip.file(page+'.xml', output);
		} else {
			zip.file(page+'.html', output);
		}
		if(data.pages.length == 0){
			// start generate posts
			generatePosts(layout, data);
		}
		else{
			generatePages(layout, data);
		}
	});
}

function generatePosts(layout, data){
	var post = data.posts.shift();
	data.content = post.content;
	data.name = post.title;
	data.post = post;
	setHeading('Creating ' + post.title + '...');
	var output = ejs.render(layout, data);
	zip.file(post.slug + '.html', output);
	if(data.posts.length == 0){
		zip.file('googlec972a0074fd7c36a.html','google-site-verification: googlec972a0074fd7c36a.html');
		setHeading('Your download will begin...');
		downloadZip();
	}
	else{
		generatePosts(layout, data);
	}
}

function downloadZip(){
	zip.generateAsync({type:"blob"})
	.then(function(content) {
		// see FileSaver.js
		saveAs(content, "html.zip");
	});
}

function renderHtml(layout, template, data, callback){
	$.get('/templates/html/'+ template +'.html', function(page){
		setHeading('Creating '+ template +'...');
		var content = ejs.render(page, data);
		data.content = content;
		var output = ejs.render(layout, data);
		callback(output);
	});	
}