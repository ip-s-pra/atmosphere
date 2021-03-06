load('main/handlers/atmos_handler.js');

function Messages() {
	var collectionName = "messages";
	AtmosHandler.apply(this, [ collectionName ]);
	this.collectionName = collectionName;
}
Messages.prototype = Object.create(AtmosHandler.prototype);
Messages.prototype.constructor = Messages;

Messages.prototype.pnAndOr = 'and_or';
Messages.prototype.pnAddressUsers = 'address_users';
Messages.prototype.pnAddressGroups = 'address_groups';
Messages.prototype.pnMessageTypes = 'message_types';
Messages.prototype.pnHashtags = 'hashtags';
Messages.prototype.pnCreatedBy = 'created_by';
Messages.prototype.pnKeywords = 'keywords';
Messages.prototype.pnResponses = 'responses';
Messages.prototype.pnMessageIds = 'message_ids';

Messages.prototype.globalTimeline = function(req) {
	var timelineInternalCallback = atmos.createCallback(
		function(timeline) {
			req.sendResponse(JSON.stringify(timeline));
		},
		this
	);

	var cond = req.getQueryValue(AtmosHandler.prototype.paramNameSearchCondition);
	var futureThan = req.getQueryValue(AtmosHandler.prototype.paramNameFutureThan);
	var pastThan = req.getQueryValue(AtmosHandler.prototype.paramNamePastThan);
	var count = parseInt(req.getQueryValue(AtmosHandler.prototype.paramNameCount), 10);

	// default sort new -> old
	var sort = {};
	sort[AtmosHandler.prototype.persistor.createdAt] = -1;
	atmos.messages.getMessages(
		timelineInternalCallback,
		null,
		//[ atmos.messages.messageTypeMessage, atmos.messages.messageTypeAnnounce ],
		null,
		cond,
		null,
		futureThan,
		pastThan,
		count
	);
};

Messages.prototype.focusedTimeline = function(req) {
	var getCurrentUserIdCallback = atmos.createCallback(
		function(currentUserId) {
			//自分がListenしてるユーザーを取得
			var getSpeakersCallback = atmos.createCallback(
				function(speakerUserIds) {
					if (speakerUserIds.length === 0) {
						req.sendResponse('You listen nobody.', 400);
					}
					else {
						var cond = req.getQueryValue(AtmosHandler.prototype.paramNameSearchCondition);
						var futureThan = req.getQueryValue(AtmosHandler.prototype.paramNameFutureThan);
						var pastThan = req.getQueryValue(AtmosHandler.prototype.paramNamePastThan);
						var count = parseInt(req.getQueryValue(AtmosHandler.prototype.paramNameCount), 10);
						var additionalCondition = this.persistor.createInCondition(
							'created_by',
							speakerUserIds
						);
						var timelineInternalCallback = atmos.createCallback(
							function(timeline) {
								req.sendResponse(JSON.stringify(timeline));
							},
							this
						);
						atmos.messages.getMessages(
							timelineInternalCallback,
							currentUserId,
							[ atmos.messages.messageTypeMessage, atmos.messages.messageTypeAnnounce, atmos.messages.messageTypeAnnouncePlus ],
							cond,
							additionalCondition,
							futureThan,
							pastThan,
							count
						);
					}
				},
				this
			);
			atmos.user.getSpeakers(
				getSpeakersCallback,
				currentUserId
			);
		},
		this
	);
	req.getCurrentUserId(
		getCurrentUserIdCallback
	);
};

Messages.prototype.talkTimeline = function(req) {
	var getCurrentUserIdCallback = atmos.createCallback(
		function(currentUserId) {
			var cond = req.getQueryValue(AtmosHandler.prototype.paramNameSearchCondition);
			var futureThan = req.getQueryValue(AtmosHandler.prototype.paramNameFutureThan);
			var pastThan = req.getQueryValue(AtmosHandler.prototype.paramNamePastThan);
			var count = parseInt(req.getQueryValue(AtmosHandler.prototype.paramNameCount), 10);
			var toMyself = this.persistor.createInCondition('addresses.users', [ currentUserId ]);
			var fromMyself = this.persistor.createEqualCondition(this.persistor.createdBy, currentUserId);
			var fromMyselfOrToMyself = this.persistor.joinConditionsOr( [ fromMyself, toMyself ] );
	
			var timelineInternalCallback = atmos.createCallback(
				function(timeline) {
					req.sendResponse(JSON.stringify(timeline));
				},
				this
			);
			atmos.messages.getMessages(
				timelineInternalCallback,
				currentUserId,
				[ atmos.messages.messageTypeMessage, atmos.messages.messageTypeAnnouncePlus ],
				cond,
				fromMyselfOrToMyself,
				futureThan,
				pastThan,
				count
			);
		},
		this
	);
	req.getCurrentUserId(
		getCurrentUserIdCallback
	);
};

Messages.prototype.announceTimeline = function(req) {
	var getCurrentUserIdCallback = atmos.createCallback(
		function(currentUserId) {
			//自分が所属しているグループを取得
			var getGroupsCallback = atmos.createCallback(
				function(groupIds) {
					if (groupIds.length === 0) {
						req.sendResponse('You are not belonging to any groups.', 400);
					}
					else {
						var cond = req.getQueryValue(AtmosHandler.prototype.paramNameSearchCondition);
						var futureThan = req.getQueryValue(AtmosHandler.prototype.paramNameFutureThan);
						var pastThan = req.getQueryValue(AtmosHandler.prototype.paramNamePastThan);
						var count = parseInt(req.getQueryValue(AtmosHandler.prototype.paramNameCount), 10);
						var groupCondition = this.persistor.createInCondition(
							MessagesManager.prototype.cnAddresses + '.' + MessagesManager.prototype.cnAddressesGroups,
							groupIds
						);
						var fromMyself = this.persistor.createEqualCondition(this.persistor.createdBy, currentUserId);
						var fromMyselfOrMyGroup = this.persistor.joinConditionsOr( [ fromMyself, groupCondition ] );

						var timelineInternalCallback = atmos.createCallback(
							function(timeline) {
								req.sendResponse(JSON.stringify(timeline));
							},
							this
						);
						atmos.messages.getMessages(
							timelineInternalCallback,
							currentUserId,
							[ atmos.messages.messageTypeAnnounce, atmos.messages.messageTypeAnnouncePlus ],
							cond,
							fromMyselfOrMyGroup,
							futureThan,
							pastThan,
							count
						);
					}
				},
				this
			);
			atmos.user.getGroups(
				getGroupsCallback,
				currentUserId
			);
		},
		this
	);
	req.getCurrentUserId(
		getCurrentUserIdCallback
	);
};

Messages.prototype.monologTimeline = function(req) {
	var getCurrentUserIdCallback = atmos.createCallback(
		function(currentUserId) {
			var cond = req.getQueryValue(AtmosHandler.prototype.paramNameSearchCondition);
			var futureThan = req.getQueryValue(AtmosHandler.prototype.paramNameFutureThan);
			var pastThan = req.getQueryValue(AtmosHandler.prototype.paramNamePastThan);
			var count = parseInt(req.getQueryValue(AtmosHandler.prototype.paramNameCount), 10);
			var additionalCondition = {
				'created_by' : currentUserId
			};
			var timelineInternalCallback = atmos.createCallback(
				function(timeline) {
					req.sendResponse(JSON.stringify(timeline));
				},
				this
			);
			atmos.messages.getMessages(
				timelineInternalCallback,
				currentUserId,
				[ atmos.messages.messageTypeMonolog ],
				cond,
				additionalCondition,
				futureThan,
				pastThan,
				count
			);
		},
		this
	);
	req.getCurrentUserId(
		getCurrentUserIdCallback
	);
};

Messages.prototype.search = function(req) {
	var getCurrentUserIdCallback = atmos.createCallback(
		function(currentUserId) {
			var cond = req.getQueryValue(AtmosHandler.prototype.paramNameSearchCondition);
			var futureThan = req.getQueryValue(AtmosHandler.prototype.paramNameFutureThan);
			var pastThan = req.getQueryValue(AtmosHandler.prototype.paramNamePastThan);
			var count = parseInt(req.getQueryValue(AtmosHandler.prototype.paramNameCount), 10);
			var andOr = req.getQueryValue(Messages.prototype.pnAndOr);
			atmos.log("andOr: " + andOr);
			var addressUsers = Messages.prototype.string2array(req.getQueryValue(Messages.prototype.pnAddressUsers));
			atmos.log("addressUsers: " + addressUsers);
			var addressGroups = Messages.prototype.string2array(req.getQueryValue(Messages.prototype.pnAddressGroups));
			atmos.log("addressGroups: " + addressGroups);
			var messageTypes = Messages.prototype.string2array(req.getQueryValue(Messages.prototype.pnMessageTypes));
			atmos.log("messageTypes: " + messageTypes);
			var hashtags = Messages.prototype.string2array(req.getQueryValue(Messages.prototype.pnHashtags));
			atmos.log("hashtags: " + hashtags);
			var createdByUsers = Messages.prototype.string2array(req.getQueryValue(Messages.prototype.pnCreatedBy));
			atmos.log("createdByUsers: " + createdByUsers);
			var keywords = Messages.prototype.string2array(req.getQueryValue(Messages.prototype.pnKeywords));
			atmos.log("keywords: " + keywords);
			var responses = Messages.prototype.string2array(req.getQueryValue(Messages.prototype.pnResponses));
			atmos.log("responses: " + responses);
			var messageIds = Messages.prototype.string2array(req.getQueryValue(Messages.prototype.pnMessageIds));
			atmos.log("messageIds: " + messageIds);

			var innerConditions = [];
			if (addressUsers.length > 0) {
				innerConditions.push(atmos.persistor.createInCondition(atmos.messages.cnAddresses + "." + atmos.messages.cnAddressesUsers, addressUsers));
			}
			if (addressGroups.length > 0) {
				innerConditions.push(atmos.persistor.createInCondition(atmos.messages.cnAddresses + "." + atmos.messages.cnAddressesGroups, addressGroups));
			}
			if (messageTypes.length > 0) {
				innerConditions.push(atmos.persistor.createInCondition(atmos.messages.cnMessageType, messageTypes));
			}
			if (hashtags.length > 0) {
				innerConditions.push(atmos.persistor.createInCondition(atmos.messages.cnHashtags, hashtags));
			}
			if (createdByUsers.length > 0) {
				innerConditions.push(atmos.persistor.createInCondition(atmos.messages.cnCreatedBy, createdByUsers));
			}
			if (keywords.length > 0) {
				var keywordConditions = [];
				for (var i=0; i<keywords.length; i++) {
					var regexKeyword = { '$regex' : keywords[i] };
					var keywordCond = {};
					keywordCond[atmos.messages.cnMessage] = regexKeyword;
					keywordConditions.push(keywordCond);
				}
				var allKeywordConditions = { '$or' : keywordConditions };
				innerConditions.push(allKeywordConditions);
			}
			if (responses.length > 0) {
				var responseInner = [];
				for (var i=0; i<responses.length; i++) {
					var resCondition = {};
					resCondition[atmos.messages.cnResponces + '.' + responses[i]] = { "$not" : { "$size" : 0 }};
					responseInner.push(resCondition);
				}
				if (responseInner.length > 0) {
					var responseCondition = {};
					responseCondition['$or'] = responseInner;
					innerConditions.push(responseCondition);
				}
			}
			if (messageIds.length > 0) {
				innerConditions.push(atmos.persistor.createInCondition(atmos.messages.cnMessageId, messageIds));
			}

			var joint = andOr == 'or' ? "$or" : "$and";

			var additionalCondition = {};
			if (innerConditions.length > 0) {
				additionalCondition[joint] = innerConditions;
			}
			var timelineInternalCallback = atmos.createCallback(
				function(timeline) {
					req.sendResponse(JSON.stringify(timeline));
				},
				this
			);
			atmos.messages.getMessages(
				timelineInternalCallback,
				currentUserId,
				null,
				cond,
				additionalCondition,
				futureThan,
				pastThan,
				count
			);
		},
		this
	);
	req.getCurrentUserId(
		getCurrentUserIdCallback
	);
};

Messages.prototype.string2array = function(valuesString) {
	var ret = [];
	if (atmos.can(valuesString)) {
		var srcArray = valuesString.split(',');
		// trim
		for (var i=0; i<srcArray.length; i++) {
			ret.push(srcArray[i].trim());
		}
	}
	return ret;
};

Messages.prototype.send = function(req) {
	var getCurrentUserIdCallback = atmos.createCallback(
		function(currentUserId) {
			var getBodyAsJSONCallback = atmos.createCallback(
				function(bodyJSON) {
					var msg = bodyJSON['message'];
					var replyTo = bodyJSON['reply_to'];
					var messageType = bodyJSON['message_type'];
			
					// extract user_ids from message
					var addressesUsers = this.extractAddressesUsers(msg);
					var addressesGroups = this.extractAddressesGroups(msg);
					var hashtags = this.extractHashtags(msg);

					if (messageType !== atmos.messages.messageTypeMonolog) {
						if (addressesGroups.length > 0 ) {
							if (addressesUsers.length > 0 ) {
								messageType = atmos.messages.messageTypeAnnouncePlus;
							}
							else {
								messageType = atmos.messages.messageTypeAnnounce;
							}
						}
						else {
							messageType = atmos.messages.messageTypeMessage;
						}
					}
			
					var sendMessageCallback = atmos.createCallback(
						function(res) {
							req.sendResponse(JSON.stringify(res));
						},
						this
					);
					atmos.messages.send(
						sendMessageCallback,
						msg,
						messageType,
						addressesUsers,
						addressesGroups,
						hashtags,
						replyTo,
						currentUserId
					);
				},
				this
			);
			req.getBodyAsJSON(
				getBodyAsJSONCallback
			);
		},
		this
	);
	req.getCurrentUserId(
		getCurrentUserIdCallback
	);
};

Messages.prototype.destroy = function(req) {
	var getCurrentUserIdCallback = atmos.createCallback(
		function(currentUserId) {
			var getBodyAsJSONCallback = atmos.createCallback(
				function(bodyJSON) {
					var id = bodyJSON[AtmosHandler.prototype.persistor.pk];
					if (atmos.can(id)) {
						var destroyCallback = atmos.createCallback(
							function(res) {
								req.sendResponse(JSON.stringify(res));
							},
							this
						);
						atmos.messages.destroy(
							destroyCallback,
							id,
							currentUserId
						);
					} else {
						var res = AtmosHandler.prototype.createResponse(AtmosHandler.prototype.returnCodeArgumentMissingError, 'Destroy requires "_id"');
						req.sendResponse(JSON.stringify(res), 400);
					}
				},
				this
			);
			req.getBodyAsJSON(
				getBodyAsJSONCallback
			);
		},
		this
	);
	req.getCurrentUserId(
		getCurrentUserIdCallback
	);
};

Messages.prototype.response = function(req) {
	var getCurrentUserIdCallback = atmos.createCallback(
		function(currentUserId) {
			var getBodyAsJSONCallback = atmos.createCallback(
				function(bodyJSON) {
					var targetMessageId = bodyJSON['target_id'];
					var responseAction = bodyJSON['action'];
			
					var responseCallback = atmos.createCallback(
						function(res) {
							req.sendResponse(JSON.stringify(res));
						},
						this
					);
					atmos.messages.addResponse(
						responseCallback,
						targetMessageId,
						currentUserId,
						responseAction
					);
				},
				this
			);
			req.getBodyAsJSON(
				getBodyAsJSONCallback
			);
		},
		this
	);
	req.getCurrentUserId(
		getCurrentUserIdCallback
	);
};

Messages.prototype.removeResponse = function(req) {
	var getCurrentUserIdCallback = atmos.createCallback(
		function(currentUserId) {
			var getBodyAsJSONCallback = atmos.createCallback(
				function(bodyJSON) {
					var targetMessageId = bodyJSON['target_id'];
					var responseAction = bodyJSON['action'];
			
					var responseCallback = atmos.createCallback(
						function(res) {
							req.sendResponse(JSON.stringify(res));
						},
						this
					);
					atmos.messages.removeResponse(
						responseCallback,
						targetMessageId,
						currentUserId,
						responseAction
					);
				},
				this
			);
			req.getBodyAsJSON(
				getBodyAsJSONCallback
			);
		},
		this
	);
	req.getCurrentUserId(
		getCurrentUserIdCallback
	);
};

Messages.prototype.extractAddressesUsers = function(msg) {
	var addressList = new Array();
	var pattern = /[^@.\-_a-zA-Z0-9]@([a-zA-Z0-9.\-_]+)/g;
	var tempMsg = ' ' + msg + ' ';
	var address;
	while (address = pattern.exec(tempMsg)) {
		addressList.push(address[1]);
	}
	return addressList;
};

Messages.prototype.extractAddressesGroups = function(msg) {
	var addressList = new Array();
	var pattern = /[^@.\-_a-zA-Z0-9]@@([a-zA-Z0-9.\-_]+)/g;
	var tempMsg = ' ' + msg + ' ';
	var address;
	while (address = pattern.exec(tempMsg)) {
		addressList.push(address[1]);
	}
	return addressList;
};

Messages.prototype.extractHashtags = function(msg) {
	var hashtagList = new Array();
	var pattern = /[^#]#([^#@ \n]+)/g;
	var tempMsg = ' ' + msg + ' ';
	var address;
	while (hashtag = pattern.exec(tempMsg)) {
		hashtagList.push(hashtag[1]);
	}
	return hashtagList;
};

function getMessagesHandler() {
	var m = new Messages();
	return m;
}
