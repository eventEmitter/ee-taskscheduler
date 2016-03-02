(function() {
	'use strict';


	let Class 		= require('ee-class');
	let Events 		= require('ee-event-emitter');
	let log 		= require('ee-log');


	let ScheduleGroup 	= require('./ScheduleGroup');




	module.exports = new Class({
		inherits: Events

		, groups: null
		, defaultGroup: null
		, idMap: null
		, __idCounter: 0


		, init: function(options) {

			this.groups = {};
			this.idMap = [];

			this.defaultGroup = new ScheduleGroup({ on: this.events });
			this.defaultGroup.on('task', this.handleTask.bind(this));
			this.defaultGroup.on('log', this.handleLog.bind(this));
			this.defaultGroup.on('error', this.handleError.bind(this));
		}




		, interval: function(interval, referenceDate, group, maxAge) {
			let id = ++this.__idCounter;
			group = this.getGroup(group);

			group.interval(id, interval, referenceDate, maxAge);
			this.idMap[id] = group;

			return id;
		}




		, schedule: function(days, times, group, maxAge) {
			let id = ++this.__idCounter;
			group = this.getGroup(group);

			group.schedule(id, days, times, maxAge);
			this.idMap[id] = group;

			return id;
		}




		, setOffset: function(offset, group) {
			if (group) {
				if (this.groups[group]) this.groups[group].setOffset(offset);
			}
			else {
				this.defaultGroup.setOffset(offset);
			}
		}





		, remove: function(id) {
			if (this.idMap[id]) {
				this.idMap[id].remove(id);
				delete this.idMap[id];
			}
		}




		, getGroup: function(group) {
			let groupRef;

			if (!group) groupRef = this.defaultGroup;
			else {
				if (!this.groups[group]) {
					this.groups[group] = new ScheduleGroup({group: group});
					this.groups[group].on('task', this.handleTask.bind(this));
					this.groups[group].on('log', this.handleLog.bind(this));
					this.groups[group].on('error', this.handleError.bind(this));
				}
				groupRef = this.groups[group];
			}
			return groupRef;
		}


		, handleTask: function(group, id, next) {
			this.emit('task', group, id, next);
		}

		, handleLog: function(group, id, status, data) {
			this.emit('log', group, id, status, data);
		}

		, handleError: function(err) {
			this.emit('error', err);
		}
	});
})();
