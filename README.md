#ee-taskscheduler


simple task scheduler class


### usage

	// create instance
	var scheduler = new TaskSchedler();


	// add an interval
	var id = scheduler.interval( interval, [ referenceDate ], [ group ], [ maxAge ] );
	var id = scheduler.interval( "20 days", null, "backup", 24*3600 );

	// add a date schedule
	var id = scheduler.schedule( days, times, [ group ], [ maxAge ] );
	var id = scheduler.schedule( [ "wed", "thu" ], [ "03:00", "15:00" ], "backup", 24*3600 );
	var id = scheduler.schedule( [ 1, 11, 21 ], "03:00", "backup", 24*3600 );


	scheduler.on( "task", function( group, id, next ){
		// next = callback which must be called when the job is completed, yoo may pass an error object as parameter 1 if the task failed ( the scheduler wil lemit anm error and a log line )
	} );


	scheduler.on( "log", function( group, id, status, data ){
		// log info
	} );


	scheduler.remove( id );