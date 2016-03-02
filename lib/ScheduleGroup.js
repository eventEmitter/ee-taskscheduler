(function() {
    'use strict';



    let Class       = require('ee-class');
    let Events      = require('ee-event-emitter');
    let log         = require('ee-log');
    let moment      = require('moment');


    module.exports = new Class({
        inherits: Events

        , config: null
        , weekdays: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] 
        , timeouts: null






        , init: function(options) {
            this.config = {};
            this.timeouts = [];

            this.threads = options && options.threads ? options.threads : 0;
            this.group = options.group || null;

            process.nextTick(() => this.reSchedule());
        }





        , interval: function(id, interval, referenceDate, maxAge) {
            if (!interval) {
                this.emit('error', new Error('missing interval!'));
            }
            else {
                this.config[id] = this.computeNextExecution({
                      interval:         interval
                    , referenceDate:    moment(referenceDate || new Date())
                    , maxAge:           maxAge || 0
                    , id:               id
                });

                this.reSchedule();
            }
        }





        , schedule: function(id, days, times, maxAge) {
            if (!days) this.emit('error', new Error('missing days!'));
            else if (!times) this.emit('error', new Error('missing times!'));
            else {
                this.config[id] = this.computeNextExecution({
                      days:         Array.isArray(days) ? days : [days]
                    , times:        Array.isArray(times) ? times : [times]
                    , maxAge:       maxAge || 0
                    , id:           id
                });

                this.reSchedule();
            }
        }





        , remove: function(id) {
            if (this.config[id]) delete this.config[id];
            this.reSchedule();
        }





        , computeNextExecution: function(config) {
            // compute interval
            if (config.interval) {
                let components = /([0-9\.]+)\s*(sec|s|min|hour|h|d|day|week|w|month|y|year)/gi.exec(config.interval);
                if (components) {

                    // interval in milliseconds
                    let   ms    = parseFloat(components[1])
                        , now   = moment();

                    switch (components[2].toLowerCase()) {
                        case 'y':
                        case 'year':
                            ms *= 12;
                        case 'month':
                            ms *= 4.348125;
                        case 'w':
                        case 'week':
                            ms *= 7;
                        case 'd':
                        case 'day':
                            ms *= 24;
                        case 'h':
                        case 'hour':
                            ms *= 60;
                        case 'min':
                            ms *= 60;
                        case 's':
                        case 'sec':
                            ms *= 1000;
                            break;

                        default:
                            this.emit('error', config.id, new Error('failed to interpret interval value [' + config.interval + ']!'));
                    }

                    // store interval
                    config.msInterval = ms;

                    // get next execution time
                    config.nextExecution = moment(config.referenceDate).milliseconds(config.msInterval * Math.ceil(now.diff(config.referenceDate) / config.msInterval));
                }
                else this.emit('error', config.id, new Error('failed to interpret interval value [' + config.interval + ']!'));
            }

            // compute schedule
            else {
                config.parsedTimes  = [];
                config.offsetDate   = moment();

                // parse time
                config.times.forEach((time) => {
                    let timeComponents = /([0-9]+):([0-9]+)/gi.exec(time);
                    if (timeComponents) {
                        config.parsedTimes.push({
                            h: timeComponents[1]
                            , m: timeComponents[2]
                        });
                    }
                    else this.emit('error', config.id, new Error('failed to interpret time value [' + config.times + ']!'));
                });

                this.computeNextDateSchedule(config);
            }

            return config;
        }






        // find next schedule for config
        , computeNextDateSchedule: function(config) {
            let executions = [];

            config.days.forEach(function(day) {
                let weekdays = /(mon|tue|wed|thu|fri|sat|sun)/gi.exec((day + '').toLowerCase())
                    , dayNo;


                if (weekdays) {
                    dayNo = this.weekdays.indexOf(weekdays[1].toLowerCase());

                    for (let i = 0; i < 30; i++) {
                        if (moment(config.offsetDate).add('days', i).day() === dayNo) {
                            config.parsedTimes.forEach(function(time) {
                                executions.push(moment(config.offsetDate).add('days', i).hour(time.h).minute(time.m));
                            }.bind(this));
                        }
                    }
                }
                else {
                    dayNo = parseInt(day + '', 10);
                    for (let i = 0; i < 30; i++) {
                        if (moment(config.offsetDate).add('days', i).date() === dayNo) {
                            config.parsedTimes.forEach(function(time) {
                                executions.push(moment(config.offsetDate).add('days', i).hour(time.h).minute(time.m));
                            }.bind(this));
                        }
                    }
                }
            }.bind(this));

            executions.sort();

            config.nextExecution    = executions[0];
            config.offsetDate       = config.offsetDate.add('seconds', 1);
        }



        , reSchedule: function() {
            this.timeouts.forEach((timeout) => clearTimeout(timeout));
            this.next();
        }





        , next: function() {
            let keys    = Object.keys(this.config), i = keys.length;
            let lowest  = { nextExecution: moment().add('years', 1000), isFake: true };

            while(i--) {
                if (this.config[keys[i]].nextExecution < lowest.nextExecution) lowest = this.config[keys[i]];
            }

            // there is nothign toi schedule
            if (lowest.isFake) return;


            // schedule if valid
            if (lowest.maxAge === 0 || lowest.nextExecution > moment().subtract('seconds', lowest.maxAge)) {
                // schedule
                this.timeouts.push(setTimeout(() => {
                    this.emit('log', this.group, lowest.id, 'started');

                    this.emit('task', this.group, lowest.id, function(err) {
                        if (err) {
                            this.emit('log', this.group, lowest.id, 'error', err);
                            this.emit('error', lowest.id, err);
                        }
                        this.emit('log', this.group, lowest.id, 'finished');
                        this.next();
                    }.bind(this));

                    // reschedule task
                    if (lowest.interval) lowest.nextExecution.add('milliseconds', lowest.msInterval);
                    else this.computeNextDateSchedule(lowest);
                }, lowest.nextExecution.diff(moment())));

            }
            else {
                let err = new Error('task was expired because its waiting for other tasks to finish!');
                this.emit('log', this.group, lowest.id, 'expired', err);
                this.emit('error', lowest.id, err);

                // task is expired, re schedule
                if (lowest.interval) lowest.nextExecution.add('milliseconds', lowest.msInterval);
                else this.computeNextDateSchedule(lowest);

                this.next();
            }
        }
    });
})();
