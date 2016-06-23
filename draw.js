define([
    'knockout',
    './draw-utils',
    'd3',
    'moment'

], function(ko, utils, d3, moment) {
    var dataLength = 5;
    var data = [];

    for (var i = 0; i < dataLength; i++) data.push({
        timekey: i,
        inbound: Math.random(), // * i * (dataLength - i),
        // y0: Math.random() * i * (dataLength - i),
        outbound: i * (dataLength - i), //Math.random() * i * (dataLength - i)
    });


    function dataAtY(y) {
        var a = data.slice();
        a = a.map(function(e, i) {
            return $.extend({}, e, {
                inbound: e.inbound,
                outbound: ((i % 2) ? 0 : 1) * e.outbound
            });
        });
        return a;
    }

    return draw;

    function draw(selector, userActivity, params, filter) {

        // for testing
        userActivity = userActivity.slice(5, 6);

        var firstAndLastMonthKey = utils.getFirstAndLastMonthKey(userActivity);
        var dataLength = getSlotDifference(
            firstAndLastMonthKey.lastMonthKey, firstAndLastMonthKey.firstMonthKey);


        var userDrawData = flattenUserData(userActivity, firstAndLastMonthKey.firstMonthKey, dataLength);
        console.log(userDrawData);
        var height = params.yStep * (Object.keys(userActivity).length + 2);
        var width = params.xStep * (dataLength);
        // console.log(width, height);

        var keyToVisualize = 'count';

        console.log('x,y: ', width, height);
        console.log('length: ', dataLength);

        /* Initialize new SVG */
        var svg = d3.select(selector).append("svg")
            .attr("width", width)
            .attr("style", "margin-top: 150px")
            .attr("height", height);
        var y = d3.scale.linear()
            .domain([-1000, 1000])
            .range([0, height]);

        var x = d3.scale.linear()
            .domain([0, dataLength])
            .range([0, width]);

        /* Drawing functions MR HARDWIRE */
        var area = d3.svg.area()
            .x(function(d, i) {
                // console.log('x', arguments)
                return x(i);
            })
            .y(function(d) {
                console.log(d.inbound[keyToVisualize] || 0);
                return d.inbound[keyToVisualize] || 0;
            })
            .y1(function(d) {
                return 0;
                // y(d.outbound[keyToVisualize] || 0);
            });

        var color = d3.scale.linear()
            .range(["#aad", "#556"]);

        svg.selectAll("path")
            .data(userDrawData)
            .enter()
            .append('g')
            .attr('height', 50)
            .attr('width', 100)
            .attr('y', function(d, i) {
                return i * 70
            })
            .attr('class', 'markerr')
            .append("path")
            .attr("d", area)
            // .attr("")
            .attr("userId", function(d, i) {
                return Object.keys(userActivity)[i];
            })
            .style("fill", function() {
                return color(Math.random());
            });

        return;
    }


    function flattenUserData(userActivity, startSlot, dataLength) {
        return Object.keys(userActivity).map(function(userId) {
            return createUserActivityArray(userActivity[userId], startSlot, dataLength);
        })
    }

    /**
     *  @returns the user line data.
     */

    function createUserActivityArray(userActivity, startSlot, dataLength) {

        var activityArray = [];

        for (var i = 0; i < dataLength; i++) {
            var timeSlotKey = addTimeKey(startSlot, i);

            activityArray.push(_.extend({
                timeSlot: i,
                timeSlotKey: timeSlotKey,
                inbound: {},
                outbound: {},
                sums: {}
            }, userActivity.monthData[timeSlotKey]));

        }
        return activityArray;
    }

    /**
     * Adds i months to the timekey.
     */
    function addTimeKey(yyyymm, i) {
        return moment(yyyymm, "YYYYMM").add(i, 'months').format("YYYYMM");
    }

    /**
     * @returns the month difference between the first and the last interaction. 
     */
    function getStartAndEndDifference(userActivity) {
        return getSlotDifference(Object.keys(userActivity[0]), Object.keys(userActivity[Object.keys(userActivity).length]));
    }

    /**
     * @returns the month different between two YYYYMM keys.
     */

    function getSlotDifference(yyyymm1, yyyymm2) {
        return moment(yyyymm1, "YYYYMM").diff(moment(yyyymm2, "YYYYMM"), 'months');

    }

    /**
     * ------------------------------------------------------------------------------
     */

    function olddraw(drawUserList, params) {

        var timelineElement = $('<div>', {
            'data-user': metadata.username,
            'class': 'timeline'
        });

        params.bottomY = params.offsetY + (params.lineHeight * (metadata.maxHeight + 3));

        var timeline = SVG(timelineElement.get(0)).size(params.offsetX * 2 + params.monthsWidth * metadata.months, params.bottomY * 2);

        drawMainUserLine(timeline, params, metadata);

        window.u.draw.drawMonths(timeline, params, metadata)

        window.u.draw.drawMonthsText(timeline, params, metadata, 70)

        window.u.draw.drawMonthsText(timeline, params, metadata, params.bottomY)

        drawUsers(timeline, params, metadata, drawUserList)

        setTimeout(function() {
            createMouseOvers(drawUserList);
        }, 50)

        return timelineElement;

    }

    function drawUsers(timeline, params, d, userlist) {
        for (var i = 0; i < userlist.length; i++) {

            drawUserLines(timeline, params, d, userlist[i])
        }
    }

    function drawUserLines(timeline, params, d, user) {
        var index = 0
        var lastSlot = -1;
        var lastMonthData = null;

        // iterate over the months
        for (var yyyymm in user.monthData) {

            var slot = whichSlot(d, yyyymm).slot;

            var ld = {
                user: user,
                monthData: user.monthData[yyyymm],
                lastMonthData: lastMonthData,
                slot: slot,
                lastSlot: lastSlot,
                lastSlotStartX: lastSlot * params.monthsWidth,
                lastSlotEndX: (lastSlot + 1) * params.monthsWidth,
                y2: user.y * params.lineHeight + params.offsetYp,
                slotStartX: slot * params.monthsWidth,
                slotEndX: (slot + 1) * params.monthsWidth,
                params: params
            }


            if (slot - lastSlot == 1) {

            } else {
                if (slot - lastSlot < 3 && lastSlot > 0) {
                    drawFadedLine(timeline, ld);
                } else {
                    if (lastSlot > -1) {
                        //drawExitingLineStraight(timeline, ld)
                        drawExitingLineWithIntensity(timeline, ld)
                    }
                    if (index == 0) {
                        // drawEnteringLine(timeline, ld)
                        drawEnteringLineStraight(timeline, ld)
                    } else {
                        ld.lastMonthData = null;
                        drawEnteringLineStraight(timeline, ld)
                    }
                    window.u.draw.createUserTextNode(timeline, user, ld.slotStartX - (params.monthsWidth / 2), ld.y2 - 15)
                }

            }
            drawSimpleSlotWithIntensity(timeline, ld);
            lastSlot = slot;
            lastMonthData = user.monthData[yyyymm];
            index++;
        }
        if (user.monthData) {
            var firstSlot = whichSlot(d, Object.keys(user.monthData)[0]).slot;
            var stamp = {
                user: user,
                params: params,
                y2: user.y * params.lineHeight + params.offsetYp,
                slotStartX: firstSlot * params.monthsWidth,
                slotEndX: (firstSlot + 1) * params.monthsWidth - params.margin
            }
            if (!stamp.y2) {
                console.error(user, 'no Y')
                debugger
                return;
            }
            drawLastInteractionCircle(timeline, params, d, user)
            window.u.draw.createUserTextNode(timeline, user, stamp.slotStartX - (params.monthsWidth / 2), stamp.y2 - 15)
        } else {
            console.error('faulty user', user.name)
        }
    }


    function drawExitingLineWithIntensity(timeline, ld) {
        var min = ld.params.defaultLineWidth / 2;

        var p = {
            topFrom: min + (ld.lastMonthData.inbound[ld.params.sumkey] || 0) * ld.params.yscale,
            bottomFrom: min + (ld.lastMonthData.outbound[ld.params.sumkey] || 0) * ld.params.yscale,
            topTo: min,
            bottomTo: min
        }
        var topPath = u.draw.linePart(ld.lastSlotEndX, ld.lastSlotEndX + ld.params.monthsWidth, ld.y2, p.topFrom, p.topTo, true);
        var bottomPath = u.draw.linePart(ld.lastSlotEndX, ld.lastSlotEndX + ld.params.monthsWidth, ld.y2, p.bottomFrom, p.bottomTo, false);

        timeline.path(u.quadPathToString(topPath)).attr({
            fill: util(timeline).disappear(ld.user.color),
            title: ld.user.name,
            'data-userid': ld.user.userid,
        });
        timeline.path(u.quadPathToString(bottomPath)).attr({
            fill: util(timeline).disappear(ld.user.color, ld.params.lowerLinePartAlpha),

            'data-userid': ld.user.userid,
            title: ld.user.name,
            'class': 'downside'
        });

    }

    function drawSimpleSlot(timeline, ld) {
        timeline.line(ld.slotStartX, ld.y2, ld.slotEndX, ld.y2)
            .stroke({
                width: ld.c.defaultLineWidth, //+ (ientry.cnt/3), 
                color: ld.user.color
            }).attr({
                'data-userid': ld.user.userid,
                title: ld.user.name
            });
    }

    function drawSimpleSlotWithIntensity(timeline, ld) {
        var min = ld.params.defaultLineWidth / 2;
        var p = {
            topFrom: min,
            bottomFrom: min,
            topTo: min + ((ld.monthData.inbound[ld.params.sumkey] || 0) * ld.params.yscale),
            bottomTo: min + ((ld.monthData.outbound[ld.params.sumkey] || 0) * ld.params.yscale)
        }
        if (ld.lastMonthData) {
            p.topFrom = min + (ld.lastMonthData.inbound[ld.params.sumkey] || 0) * ld.params.yscale;
            p.bottomFrom = min + (ld.lastMonthData.outbound[ld.params.sumkey] || 0) * ld.params.yscale;
        }
        var topPath = u.draw.linePart(ld.slotStartX, ld.slotEndX, ld.y2, p.topFrom, p.topTo, true);
        var bottomPath = u.draw.linePart(ld.slotStartX, ld.slotEndX, ld.y2, p.bottomFrom, p.bottomTo, false);

        timeline.path(u.quadPathToString(topPath)).attr({
            fill: ld.user.color,
            'data-userid': ld.user.userid,
            title: ld.user.name
        });
        timeline.path(u.quadPathToString(bottomPath)).attr({
            fill: tinycolor(ld.user.color || '#777').setAlpha(ld.params.lowerLinePartAlpha),
            'data-userid': ld.user.userid,
            'class': 'downside',
            title: ld.user.name
        });
    }


    function drawLastInteractionCircle(timeline, params, data, user) {
        var min = params.defaultLineWidth / 2;
        var lastMonthKey = Object.keys(user.monthData)[0];
        for (var yyyymm in user.monthData)
            if (lastMonthKey < yyyymm) lastMonthKey = yyyymm;
        var lastMonthData = user.monthData[lastMonthKey];
        var slot = whichSlot(data, lastMonthKey).slot;
        var slotEndX = (slot + 1) * params.monthsWidth;
        var y2 = user.y * params.lineHeight + params.offsetYp;

        var topFrom = min + (lastMonthData.inbound[params.sumkey] || 0) * params.yscale;
        var bottomFrom = min + (lastMonthData.outbound[params.sumkey] || 0) * params.yscale;
        var topPath = u.draw.linePart(slotEndX, slotEndX + params.monthsWidth / 2, y2, topFrom, min, true);
        var bottomPath = u.draw.linePart(slotEndX, slotEndX + params.monthsWidth / 2, y2, bottomFrom, min, false);

        timeline.path(u.quadPathToString(topPath)).attr(util().pathAttr(user, params, true));
        timeline.path(u.quadPathToString(bottomPath)).attr(util().pathAttr(user, params, false));

        timeline.circle(7).attr({
            fill: user.color,
            cx: slotEndX + params.monthsWidth / 2,
            cy: y2,
            'data-userid': user.userid,
        })
    }

    function drawFadedLine(timeline, ld) {

        var min = ld.params.defaultLineWidth / 2;
        var p = {
            topFrom: min + (ld.lastMonthData.inbound[ld.params.sumkey] || 0) * ld.params.yscale,
            bottomFrom: min + (ld.lastMonthData.outbound[ld.params.sumkey] || 0) * ld.params.yscale,
            topTo: min + ((ld.monthData.inbound[ld.params.sumkey] || 0) * ld.params.yscale),
            bottomTo: min + ((ld.monthData.outbound[ld.params.sumkey] || 0) * ld.params.yscale)
        }

        var topPath1 = u.draw.linePart(ld.lastSlotEndX, (ld.lastSlotEndX + ld.slotStartX) / 2, ld.y2, p.topFrom, min, true);
        var bottomPath1 = u.draw.linePart(ld.lastSlotEndX, (ld.lastSlotEndX + ld.slotStartX) / 2, ld.y2, p.bottomFrom, min, false);
        var topPath2 = u.draw.linePart((ld.lastSlotEndX + ld.slotStartX) / 2, ld.slotStartX, ld.y2, min, p.topFrom, true);
        var bottomPath2 = u.draw.linePart((ld.lastSlotEndX + ld.slotStartX) / 2, ld.slotStartX, ld.y2, min, p.bottomFrom, false);

        var attrTop = {
            fill: ld.user.color,
            'data-userid': ld.user.userid
        }
        var attrBottom = {
            fill: tinycolor(ld.user.color || '#777').setAlpha(ld.params.lowerLinePartAlpha),
            'data-userid': ld.user.userid,
            'class': 'downside'
        }
        timeline.path(u.quadPathToString(topPath1)).attr(attrTop);
        timeline.path(u.quadPathToString(bottomPath1)).attr(attrBottom);
        timeline.path(u.quadPathToString(topPath2)).attr(attrTop);
        timeline.path(u.quadPathToString(bottomPath2)).attr(attrBottom);

    }

    function drawEnteringLineStraight(timeline, ld) {

        // The following line explained
        // http://stackoverflow.com/questions/21638169/svg-line-with-gradient-stroke-wont-display-straight
        timeline.line(ld.slotStartX - ((ld.params.monthsWidth) / 2), ld.y2 + 0.0001, ld.slotStartX, ld.y2)
            .attr({
                fill: 'none',
                'data-userid': ld.user.userid,
                stroke: util(timeline).appear(ld.user.color),
                'stroke-width': ld.params.defaultLineWidth
            });
    }

    function drawFirstEnteringLineStraight(timeline, ld) {

        // The following line explained
        // http://stackoverflow.com/questions/21638169/svg-line-with-gradient-stroke-wont-display-straight
        timeline.line(ld.slotStartX - ((ld.params.monthsWidth) / 2), ld.y2 + 0.0001, ld.slotStartX, ld.y2)
            .attr({
                fill: 'none',
                'data-userid': ld.user.userid,
                stroke: util(timeline).appear(ld.user.color),
                'stroke-width': ld.params.defaultLineWidth
            });
    }

    function drawEnteringLine(timeline, ld) {
        var enteringPath = {
            M: [ld.slotStartX, ld.y2],
            Q: [ld.slotStartX - (ld.params.monthsWidth / 3), ld.y2,
                (ld.slotStartX - (ld.params.monthsWidth) / 2), (ld.y2 + (ld.params.monthsWidth) / 2)
            ],
            T: [(ld.slotStartX - (ld.params.monthsWidth) / 2), (ld.y2 + (ld.params.monthsWidth) / 2)]
        };

        timeline.path(u.quadPathToString(enteringPath)).attr({
            fill: 'none',
            'stroke-width': ld.params.defaultLineWidth,
            stroke: util(timeline).appear(ld.user.color), //'red', //getUser(l.user.name).color,
            'data-userid': ld.user.userid,
            'class': 'entering'
        });
    }




    function createMouseOvers(users) {

        for (var u in users) {
            var userid = users[u].userid
            $('[data-userid="' + userid + '"]').each(function(i, o) {
                window.u.initMouseEvents(o, userid);
            })
        }
    }


    function drawMainUserLine(timeline, c, d) {

        timeline.line(c.offsetX - c.monthsWidth, c.offsetY, (d.months + 1) * c.monthsWidth + c.offsetX, c.offsetY)
            .stroke({
                width: 3,
                color: 'blue'
            });

        timeline.circle(5).attr({
            cx: c.offsetX - c.monthsWidth,
            cy: c.offsetY,
            fill: 'blue'
        });
        timeline.circle(15).attr({
            cx: (d.months + 1) * c.monthsWidth + c.offsetX,
            cy: c.offsetY,
            fill: 'blue'
        });
        timeline.text(d.name);

    }



    function whichSlot(d, yyyymm) {
        return {
            y: yyyymm.substr(0, 4),
            m: yyyymm.substr(4, 2),
            slot: moment(yyyymm, "YYYYMM").diff(moment(d.startSlot), 'months')
        }
    }

    function util(draw) {
        return {
            disappear: function(color, alpha) {
                alpha = alpha || 1;
                return draw.gradient('linear', function(stop) {
                    stop.at({
                        offset: 0,
                        color: color,
                        opacity: alpha
                    })
                    stop.at({
                        offset: 1,
                        color: 'rgba(255,255,255,0)'
                    })
                })
            },
            appear: function(color, alpha) {
                alpha = alpha || 1;
                return draw.gradient('linear', function(stop) {
                    stop.at({
                        offset: 0,
                        color: 'rgba(255,255,255,0)'
                    })
                    stop.at({
                        offset: 1,
                        color: color,
                        alpha
                    })

                    // stop.at({ offset: 0, color: '#ff0000' })
                    // stop.at({ offset: 1, color: '#00ff00' })
                })
            },
            fade: function(color) {
                return draw.gradient('linear', function(stop) {
                    stop.at({
                        offset: 0,
                        color: color
                    })
                    stop.at({
                        offset: 1,
                        color: color
                    })
                })
            },
            pathAttr: function(user, c, top) {

                return {
                    'data-userid': user.userid,
                    fill: top ? (user.color || '#777') : (tinycolor(user.color || '#777').setAlpha(c.lowerLinePartAlpha)),
                    'class': top ? '' : 'downside'
                }
            }

        }

    }



});