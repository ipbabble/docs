var bucket_url = 'https://storage.googleapis.com/hcp-results';
var bucket_filter_field = null;
var bucket_filter_value = null;

class Badge {
    
    constructor(base, key, date) {  // Class constructor
	this.base = base;  // Class body/properties
	this.key = key;  // Class body/properties
	const fields = key.split("-");
	this.pattern = fields[0];
	this.platform = fields[1];
	if ( fields[2] != "ci.json" ) {
	    this.version = fields[2];
	} else {
	    this.version = "";
	}
	this.date = date.substr(5, 5);
    }

    string() {
        return this.key;
    }

    
    getLabel(field) {
        if(field == "pattern") {
	    return platform_name(this.platform)+" "+this.version+" @ "+ this.date;
        }
        if(field == "platform") {
	    return pattern_name(this.pattern)+" - "+this.version+" @ "+ this.date;
        }
        if(field == "version") {
	    return pattern_name(this.pattern)+" : "+platform_name(this.platform)+" @ "+ this.date;
        }
	return pattern_name(this.pattern)+" : "+ platform_name(this.platform)+" "+this.version+" @ "+ this.date;
    }

    getURI() {
        return this.base+"/"+this.key;
    }
}

function filterBadges(badges, field, value) {
    if ( field === "pattern" ) {
	return badges.filter(badge => badge.pattern === value);
    }
    if ( field === "platform" ) {
	return badges.filter(badge => badge.platform === value);
    }
    if ( field === "version" ) {
	return badges.filter(badge => badge.version === value);
    }
    return badges;
}

function rowTitle(field, value) {
    if ( field === "pattern" ) {
	return pattern_name(value);
    }
    if ( field === "platform" ) {
	return platform_name(value);
    }
    return value;
}

function get_shield_url(badge, label) {
    base = 'https://img.shields.io/endpoint?style=flat&logo=git&logoColor=white';
    // TODO: Replace the second link with the CI Job URL
    base = base +'&link='+ encodeURI(badge.getURI()) + '&link=' + encodeURI(badge.getURI());
    if ( label != "" ) {
        base = base +'&label='+ encodeURI(label);
    }
    return base + '&url=' + encodeURI(badge.getURI());
}

function pattern_name(key) {
    if ( key == "aegitops" ) {
        return "Ansible Edge";
    }
    if ( key == "devsecops" ) {
        return "DevSecOps";
    }
    if ( key == "manuela" ) {
        return "Industrial Edge";
    }
    if ( key == "mcgitops" ) {
        return "MultiCloud GitOps";
    }
    if ( key == "medicaldiag" ) {
        return "Medical Diagnosis";
    }
    return key;
}

function platform_name(key) {
    if ( key == "azr" ) {
        return "Azure";
    }
    if ( key == "gcp" ) {
        return "Google";
    }
    if ( key == "aws" ) {
        return "Amazon";
    }
    return key;
}

function getBadgeDate(xml) {
    parent = xml.parentNode;
    for (j = 0; j < parent.childNodes.length; j++) {
	if ( parent.childNodes[j].nodeName == "LastModified" ) {
	    return parent.childNodes[j].childNodes[0].nodeValue;
	}
    }
    return "3001-01-01T01:01:01.000Z";
}

function getUniqueValues(badges, field){
    results = [];
    if (field == 'date' ) {
	results.push('Entry');
	return results;
    }

    badges.forEach(b => {
	if (field == 'platform' && ! results.includes(b.platform) ) {
	    results.push(b.platform);
	} else if (field == 'pattern' && ! results.includes(b.pattern) ) {
	    results.push(b.pattern);
	} else if (field == 'version' && b.version != "" && ! results.includes(b.version) ) {
	    results.push(b.version);
	}
    });

    if ( field === "pattern" ) {
	return results.sort(function(a, b){return -1 * a.localeCompare(b)});
    } else if ( field === "version" ) {
	return results.sort(function(a, b){return -1 * a.localeCompare(b)});
    }
    
    return results.sort();
}

function patternSort(a, b){
    if ( a.pattern != b.pattern ) {
	return a.pattern.localeCompare(b.pattern);
    }
    if ( a.platform != b.platform ) {
	return a.platform.localeCompare(b.platform);
    }
    if ( a.version != b.version ) {
	return -1 * a.version.localeCompare(b.version);
    }
    return -1 * a.date.localeCompare(b.date)
}

function patternVertSort(a, b){
    if ( a.version != b.version ) {
	return -1 * a.version.localeCompare(b.version);
    }
    if ( a.pattern != b.pattern ) {
	return a.pattern.localeCompare(b.pattern);
    }
    if ( a.platform != b.platform ) {
	return a.platform.localeCompare(b.platform);
    }
    return -1 * a.date.localeCompare(b.date)
}

function toCamelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
	if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
	return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
}

function toTitleCase(str) {
    return str.replace(
	/\w\S*/g,
	function(txt) {
	    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	}
    );
}      

function createFilteredHorizontalTable(badges, field, titles) {
    //document.getElementById('data').innerHTML = 'Hello World!';

    tableText = "<div style='ci-results'>";
    if ( titles ) {
	tableText = tableText + "<h2>"+toTitleCase("By "+field)+"</h2>";
    }
    tableText = tableText + "<table><tbody>";

    rows = getUniqueValues(badges, field);

    rows.forEach(r => {
	pBadges = filterBadges(badges, field, r);

	tableText = tableText + "<tr>";
	if ( titles ) {
	    tableText = tableText + "<td><a href='?" + field + "=" + r + "'>" + rowTitle(field, r) + "</a></td>";
	}
	
	pBadges.forEach(b => {
	    tableText = tableText + "<td><object data='" + get_shield_url(b, b.getLabel(field)) + "' style='max-width: 100%;'>'</object></td>";
	});
	tableText = tableText + "</tr>";
    });

    return tableText + "</tbody></table></div>";
}

function createFilteredVerticalTable(badges, field, titles) {
    //document.getElementById('data').innerHTML = 'Hello World!';

    tableText = "<div style='ci-results'>";
    if ( titles ) {
	tableText = tableText + "<h2>"+toTitleCase("By "+field)+"</h2>";
    }
    tableText = tableText + "<table><tbody>";
    
    rows = getUniqueValues(badges, field);

    fieldColumns = [];
    tableText = tableText + "<tr>";
    rows.forEach(r => {
	fieldColumns.push(filterBadges(badges, field, r));

	// https://stackoverflow.com/questions/43775947/dynamically-generate-table-from-json-array-in-javascript
	if ( titles ) {
	    tableText = tableText + "<th><a href='?" + field + "=" + r + "'>" + rowTitle(field, r) + "</a></th>";
	}		  
    });
    tableText = tableText + "</tr>";

    any = true;
    row = 0;
    numColumns = fieldColumns.length;
    while (any) {
	any = false;
	tableText = tableText + "<tr>";
	for ( i = 0; i < numColumns; i++) {
	    blist = fieldColumns[i];
	    tableText = tableText + "<td>";
	    if ( blist.length > row ) {
		b = blist[row];
		//		      console.log(b);
		tableText = tableText + "<object data='" + get_shield_url(b, b.getLabel(field)) + "' style='max-width: 100%;'>'</object>";
		any = true;
	    }
	    tableText = tableText + "</td>";
	}
	tableText = tableText + "</tr>";
	row = row + 1;
    }

    return tableText + "</tbody></table></div>";

}

function getBadges(xmlText) {
    parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xmlText, "application/xml");
    const errorNode = xmlDoc.querySelector("parsererror");
    if (errorNode) {
	// parsing failed
	console.log("failed: "+errorNode);
	return;
    }

    var badges = [];
    var entries = xmlDoc.getElementsByTagName("Key");
    // var entries = xmlDoc.childNodes.getElementsByTagName("Contents");
    // var entries = xmlDoc.childNodes;
    // 	  document.getElementById("data").innerHTML = errorNode.childNodes[1].nodeValue;

    l = entries.length;
    console.log("processing +entries[0].nodeName+ "+l);
    
    for (i = 0; i < l; i++) {
	//	  entries[i].childNodes[0].nodeValue
	key = entries[i].childNodes[0].nodeValue;
	
	if ( key.endsWith("-badge.json") ) {
	    //		  console.log("Key["+i+"] : "+ key);
	    badges.push(new Badge(bucket_url, key, getBadgeDate(entries[i])));
	}
    }

    return badges;
    // console.log(badges);
}

function setBucketFilters(field, value) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    sections = [ "date", "version", "platform", "pattern" ];
    
    if ( field != null ) {
	bucket_filter_field = field;

    } else {
	for ( i=0; i < sections.length; i++) {
	    if ( urlParams.get(sections[i]) != null ) {
		bucket_filter_field = sections[i];
	    }
	}
    }

    if (bucket_filter_field != null) {
	if ( value != null) {
	    bucket_filter_value = value;
	} else if (urlParams.get(bucket_filter_field) != null) {
	    bucket_filter_value = urlParams.get(bucket_filter_field);
	}
    }
}

function reqListener() {
    //	  console.log(this.responseText);

    var field;
    setBucketFilters();

    htmlText = "";
    badges = getBadges(this.responseText);
    if ( bucket_filter_field === "date" ) {
	badges.sort(function(a, b){return -1 * a.date.localeCompare(b.date)});
	htmlText = createFilteredVerticalTable(badges, "date", false);

    } else if (bucket_filter_field != null ) {
	if ( bucket_filter_value != null) {
	    badges = filterBadges(badges, bucket_filter_field, bucket_filter_value);
	}
	badges.sort(patternSort);
	htmlText = createFilteredHorizontalTable(badges, bucket_filter_field, false);

    } else {
	badges.sort(function(a, b){return -1 * a.date.localeCompare(b.date)});
	htmlText = createFilteredVerticalTable(badges, "date", true);

	badges.sort(patternVertSort);
	htmlText = htmlText + createFilteredHorizontalTable(badges, "pattern", true);
	htmlText = htmlText + createFilteredVerticalTable(badges, "platform", true);
	htmlText = htmlText + createFilteredVerticalTable(badges, "version", true);
    }
    document.getElementById('data').innerHTML = htmlText;
}

function obtainBadges(aUrl, field, value) {
    const req = new XMLHttpRequest();
    setBucketFilters(field, value);

    req.addEventListener("load", reqListener);
    if ( aUrl == null) {
	aUrl = bucket_url;
    } else {
	// Requires new bucket permissions
	//bucket_url = aUrl;
    }
    req.open("GET", aUrl);
    req.send();
    return req.responseText;          
}

