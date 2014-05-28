

	var   Scheduler = require( "./" )
		, log 		= require( "ee-log" );


	var s = new Scheduler( {
		on: {
			  error: function( err ){ log.trace( err ); }
			, log: function( group, id, status, data ){ log.debug( group, id, status, data ); }
		}
	} );



	//s.schedule( [ "1", "fri" ], [ "03:00", "1:1" ] );
	var x = new Date();
	x.setHours( 3 );
	x.setMinutes( 0 );
	

	log(s.interval( "1s", x, "testee", 5 ));
	//s.interval( "1s", null, "another", 5 );


	s.interval( "1s", x, "import", 5 )
	s.interval( "1 day", x, "import", 5 )

	s.on('task', function(group, id, next){
		if (group === 'import'){
			//s.import(next);
		}
		 log.info( group, id ); 
		 setTimeout( next , 2000 );
	});