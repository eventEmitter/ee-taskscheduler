


	var   Class 		= require( "ee-class" )
		, Events 		= require( "ee-event-emitter" )
		, log 			= require( "ee-log" );


	var ScheduleGroup 	= require( "./ScheduleGroup" );




	module.exports = new Class( {
		inherits: Events

		, groups: {}
		, defaultGroup: null
		, idMap: {}
		, __idCounter: 0


		, init: function( options ){
			this.events = { task: this.handleTask.bind( this ), log: this.handleLog.bind( this ), error: this.handleError.bind( this ) };
			this.defaultGroup = new ScheduleGroup( { on: this.events } );
		}



		, interval: function( interval, referenceDate, group, maxAge ){
			var id = ++this.__idCounter;
			group = this.getGroup( group );

			group.interval( id, interval, referenceDate, maxAge );
			this.idMap[ id ] = group;

			return id;
		}


		, schedule: function( days, times, group, maxAge ){
			var id = ++this.__idCounter;
			group = this.getGroup( group );

			group.schedule( id, days, times, maxAge );
			this.idMap[ id ] = group;

			return id;
		}


		, setOffset: function( offset, group ){
			if ( group ) {
				if ( this.groups[ group ] ) this.groups[ group ].setOffset( offset );
			}
			else {
				this.defaultGroup.setOffset( offset );
			}
		}


		, remove: function( id ){
			if ( this.idMap[ id ] ){
				this.idMap[ id ].remove( id );
				delete this.idMap[ id ];
			}
		}


		, getGroup: function( group ){
			var groupRef;

			if ( !group ) groupRef = this.defaultGroup;
			else {
				if ( !this.groups[ group ] ); this.groups[ group ] = new ScheduleGroup( { group: group, on : this.events } );
				groupRef = this.groups[ group ];
			}
			return groupRef;
		}


		, handleTask: function( group, id, next ){
			this.emit( "task", group, id, next );
		}

		, handleLog: function( group, id, status, data ){
			this.emit( "log", group, id, status, data );
		}

		, handleError: function( err ){
			this.emit( "error", err );
		}
	} );