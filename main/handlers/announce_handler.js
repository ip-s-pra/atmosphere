load('main/handlers/atmos_handler.js');

function Announce() {
	var collectionName = "announce";
	AtmosHandler.apply(this, [ collectionName ]);
	this.collectionName = collectionName;
}
Announce.prototype = Object.create(AtmosHandler.prototype);
Announce.prototype.constructor = Announce;

Announce.prototype.timeline = function(req) {
	var timelineInternalCallback = atmos.createCallback(
		function(timeline) {
			var appendResponseCallback = atmos.createCallback(
				function(responsedTimelineElements) {
					timeline['results'] = responsedTimelineElements;
					req.sendResponse(JSON.stringify(timeline));
				},
				this
			);
			this.appendResponseInfo(
				appendResponseCallback,
				timeline['results'],
				this.collectionName
			);
		},
		this
	);

	this.getTimelineInternal(
		timelineInternalCallback,
		req
	);
};

Announce.prototype.send = function(req) {
	var getBodyAsJSONCallback = atmos.createCallback(
		function(bodyJSON) {
			var msg = bodyJSON['message'];
	
			// extract group_ids from message
			var groupIds = this.extractGroupIds(msg);
	
			var dataJSON = {};
			dataJSON['message'] = msg;
			dataJSON['addresses'] = groupIds;
			this.sendInternal(req, dataJSON);
		},
		this
	);
	req.getBodyAsJSON(
		getBodyAsJSONCallback
	);
};

Announce.prototype.destroy = function(req) {
	this.destroyInternal(req);
};

Announce.prototype.response = function(req) {
	this.responseInternal(req);
};

Announce.prototype.extractGroupIds = function(msg) {
	var groupIdList = new Array();
	var pattern = /[^@.-_a-zA-Z0-9]@@([a-zA-Z0-9.-_]+)/g;
	var tempMsg = ' ' + msg + ' ';
	var groupId;
	while (groupId = pattern.exec(tempMsg)) {
		groupIdList.push(groupId[1]);
	}
	return groupIdList;
};

function getAnnounceHandler() {
	var announce = new Announce();
	return announce;
}
