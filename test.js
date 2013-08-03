

	var   Scheduler = require( "./" )
		, log 		= require( "ee-log" );


	var s = new Scheduler( {
		on: {
			  error: function( err ){ log.trace( err ); }
			, log: function( group, id, status, data ){ log.debug( group, id, status, data ); }
			, task: function( group, id, next ){ log.info( group, id ); setTimeout( next , 2000 ); }
		}
	} );



	s.schedule( [ "1", "fri" ], [ "03:00", "1:1" ] );
	s.interval( "1s", null, "testee", 5 );
	s.interval( "1s", null, "another", 5 );